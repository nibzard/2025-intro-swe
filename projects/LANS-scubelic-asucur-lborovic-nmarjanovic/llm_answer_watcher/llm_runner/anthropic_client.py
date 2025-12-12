"""
Anthropic API client implementation for LLM Answer Watcher.

Provides asynchronous HTTP client for Anthropic Messages API with
automatic retry logic, exponential backoff, and comprehensive error handling.

Key features:
- Async HTTP client for parallel execution (httpx.AsyncClient)
- Retry on transient failures (429, 5xx) with exponential backoff
- Fail fast on permanent errors (401, 400, 404)
- Automatic cost estimation based on token usage
- UTC timestamp tracking
- Configurable system message per model
- Security: NEVER logs API keys

Example:
    >>> from llm_runner.anthropic_client import AnthropicClient
    >>> client = AnthropicClient("claude-3-5-haiku-20241022", api_key="sk-ant-...",
    ...     system_prompt="You are a helpful assistant.")
    >>> response = await client.generate_answer("What are the best CRM tools?")
    >>> print(f"Answer: {response.answer_text[:100]}...")
    >>> print(f"Cost: ${response.cost_usd:.6f}")
"""

import logging
from typing import Any

import httpx

from llm_answer_watcher.llm_runner.models import LLMResponse
from llm_answer_watcher.llm_runner.retry_config import (
    NO_RETRY_STATUS_CODES,
    REQUEST_TIMEOUT,
    create_retry_decorator,
)
from llm_answer_watcher.utils.cost import estimate_cost
from llm_answer_watcher.utils.time import utc_timestamp

# Suppress HTTPX request logging to prevent test interference
httpx_logger = logging.getLogger("httpx")
httpx_logger.setLevel(logging.WARNING)

# Anthropic API endpoint
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

# Anthropic API version header (required)
ANTHROPIC_VERSION = "2023-06-01"

# Maximum prompt length to prevent excessive API costs
# ~25k tokens at 4 chars/token average - prevents runaway costs from extremely long prompts
MAX_PROMPT_LENGTH = 100_000

# Default max_tokens for response (required by Anthropic API)
# Can be overridden per request if needed
DEFAULT_MAX_TOKENS = 4096

# Get logger for this module
logger = logging.getLogger(__name__)


class AnthropicClient:
    """
    Anthropic Messages API client with async retry logic and cost tracking.

    Implements the LLMClient protocol for Anthropic's Messages API with automatic retry
    on transient failures, exponential backoff, and integrated cost estimation.
    Uses async HTTP client for non-blocking parallel execution.

    Attributes:
        model_name: Anthropic model identifier (e.g., "claude-3-5-haiku-20241022")
        api_key: Anthropic API key for authentication (NEVER logged)
        system_prompt: System message sent with every request for context/instructions

    Example:
        >>> client = AnthropicClient("claude-3-5-haiku-20241022", "sk-ant-...", "You are a helpful assistant.")
        >>> response = await client.generate_answer("What are the best email warmup tools?")
        >>> response.tokens_used
        450
        >>> response.cost_usd
        0.002000

    Security:
        - API keys are NEVER logged in any form (not even partial)
        - API keys are only used in x-api-key headers
        - No API keys are persisted to disk or included in error messages

    Retry behavior:
        - Retries on: 429 (rate limit), 500, 502, 503, 504 (server errors)
        - Fails immediately on: 401 (auth), 400 (bad request), 404 (not found)
        - Max attempts: 3 (from retry_config.MAX_ATTEMPTS)
        - Backoff: Exponential starting at 1s, max 60s (from retry_config)
        - Timeout: 30s per request (from retry_config.REQUEST_TIMEOUT)

    Note:
        This implementation uses async/await for parallel execution.
        Streaming is not supported in v1.
    """

    def __init__(
        self,
        model_name: str,
        api_key: str,
        system_prompt: str,
        tools: list[dict] | None = None,
        tool_choice: str = "auto",
    ):
        """
        Initialize Anthropic client with model, API key, system prompt, and optional tools.

        Args:
            model_name: Anthropic model identifier (e.g., "claude-3-5-haiku-20241022")
            api_key: Anthropic API key for authentication
            system_prompt: System message for context/instructions
            tools: Optional list of tool configurations (not currently supported)
            tool_choice: Tool selection mode (not currently supported)

        Raises:
            ValueError: If model_name, api_key, or system_prompt is empty

        Example:
            >>> client = AnthropicClient("claude-3-5-haiku-20241022", "sk-ant-...", "You are a helpful assistant.")
            >>> client.model_name
            'claude-3-5-haiku-20241022'

        Security:
            - The api_key parameter is NEVER logged
            - API key validation happens server-side
            - We only validate it's non-empty locally

        Note:
            Tools are not currently supported for Anthropic client in v1.
            The parameters are accepted for API compatibility but will log a warning if used.
        """
        # Validate inputs (never log api_key)
        if not model_name or model_name.isspace():
            raise ValueError("model_name cannot be empty")

        if not api_key or api_key.isspace():
            raise ValueError("api_key cannot be empty")

        if not system_prompt or system_prompt.isspace():
            raise ValueError("system_prompt cannot be empty")

        self.model_name = model_name
        self.api_key = api_key
        self.system_prompt = system_prompt
        self.tools = tools
        self.tool_choice = tool_choice

        # Log warning if tools are provided (not yet supported)
        if tools:
            logger.warning(
                f"Tools are not currently supported for Anthropic client. "
                f"Tools parameter will be ignored for model: {model_name}"
            )

        # Log initialization (never log api_key)
        logger.info(f"Initialized Anthropic client for model: {model_name}")

    @create_retry_decorator()
    async def generate_answer(self, prompt: str) -> LLMResponse:
        """
        Execute LLM query asynchronously with automatic retry and cost tracking.

        Sends prompt to Anthropic Messages API with system message for
        unbiased analysis. Handles transient failures with exponential backoff
        and calculates costs based on token usage. Uses async HTTP client for
        non-blocking parallel execution.

        Args:
            prompt: User intent prompt to send to the LLM

        Returns:
            LLMResponse: Structured response with answer text, tokens, cost, metadata

        Raises:
            ValueError: If prompt is empty
            RuntimeError: On permanent failures (auth errors, invalid requests)
                or after all retry attempts exhausted
            httpx.HTTPStatusError: On HTTP errors after retries exhausted
            httpx.ConnectError: On connection failures after retries exhausted
            httpx.TimeoutException: On timeout after retries exhausted

        Example:
            >>> client = AnthropicClient("claude-3-5-haiku-20241022", "sk-ant-...")
            >>> response = await client.generate_answer("What are the best CRM tools?")
            >>> print(response.answer_text[:100])
            "Based on market research, here are the top CRM tools..."
            >>> response.provider
            'anthropic'
            >>> response.model_name
            'claude-3-5-haiku-20241022'

        Retry behavior:
            - Retries automatically on 429, 500, 502, 503, 504
            - Fails immediately on 401, 400, 404
            - Uses exponential backoff: 2s, 4s, 8s, ... up to 60s
            - Max 3 attempts total

        Security:
            - API key is sent in x-api-key header only
            - API key is NEVER logged, even in error messages
            - Only model name and status codes are logged

        Note:
            The @retry decorator automatically handles retries for async functions.
            If a non-retryable error occurs (e.g., 401), it checks the status
            code and raises immediately without retry.
        """
        # Validate prompt is not empty
        if not prompt or prompt.isspace():
            raise ValueError("Prompt cannot be empty")

        # Validate prompt length to prevent excessive API costs
        if len(prompt) > MAX_PROMPT_LENGTH:
            raise ValueError(
                f"Prompt exceeds maximum length of {MAX_PROMPT_LENGTH:,} characters "
                f"(received {len(prompt):,} characters). "
                f"Please shorten your prompt to stay within the limit."
            )

        # Build request payload
        # Anthropic Messages API uses 'messages' array with role/content objects
        payload = {
            "model": self.model_name,
            "max_tokens": DEFAULT_MAX_TOKENS,  # Required by Anthropic API
            "system": self.system_prompt,  # System prompt is separate parameter
            "messages": [
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.7,  # Default temperature for consistency
        }

        # Build headers (NEVER log api_key)
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": ANTHROPIC_VERSION,
            "content-type": "application/json",
        }

        # Log request (NEVER log api_key or headers)
        logger.debug(f"Sending request to Anthropic: model={self.model_name}")

        # Make async HTTP request with context manager for proper cleanup
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                response = await client.post(
                    ANTHROPIC_API_URL,
                    json=payload,
                    headers=headers,
                )

                # Check for non-retryable errors first
                # These should fail immediately without retry
                if response.status_code in NO_RETRY_STATUS_CODES:
                    error_detail = self._extract_error_detail(response)
                    raise RuntimeError(
                        f"Anthropic API error (non-retryable): "
                        f"status={response.status_code}, "
                        f"model={self.model_name}, "
                        f"detail={error_detail}"
                    )

                # Raise for retryable errors (429, 5xx)
                # The @retry decorator will catch these and retry
                response.raise_for_status()

        except httpx.HTTPStatusError as e:
            # Log error (NEVER log api_key)
            error_detail = self._extract_error_detail(e.response)
            logger.error(
                f"Anthropic API HTTP error: "
                f"status={e.response.status_code}, "
                f"model={self.model_name}, "
                f"detail={error_detail}"
            )
            raise

        except httpx.ConnectError as e:
            # Connection failed (network issue)
            logger.error(
                f"Anthropic API connection error: model={self.model_name}, error={e}"
            )
            raise

        except httpx.TimeoutException as e:
            # Request timed out
            logger.error(f"Anthropic API timeout: model={self.model_name}, error={e}")
            raise

        # Parse response JSON
        try:
            data = response.json()
        except Exception as e:
            raise RuntimeError(f"Failed to parse Anthropic response JSON: {e}") from e

        # Extract answer text
        answer_text = self._extract_answer_text(data)

        # Extract token usage (input and output)
        tokens_used, prompt_tokens, completion_tokens = self._extract_token_usage(data)

        # Calculate cost
        usage_meta = {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
        }
        cost_usd = estimate_cost("anthropic", self.model_name, usage_meta)

        # Get current timestamp
        timestamp = utc_timestamp()

        # Build and return response
        return LLMResponse(
            answer_text=answer_text,
            tokens_used=tokens_used,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cost_usd=cost_usd,
            provider="anthropic",
            model_name=self.model_name,
            timestamp_utc=timestamp,
            web_search_results=None,  # Web search not supported in v1
            web_search_count=0,
        )

    def _extract_answer_text(self, data: dict[str, Any]) -> str:
        """
        Extract answer text from Anthropic Messages API response.

        Args:
            data: Parsed JSON response from Anthropic Messages API

        Returns:
            str: The assistant's message content

        Raises:
            RuntimeError: If response structure is invalid or missing required fields
        """
        try:
            # Anthropic API uses 'content' array
            content = data.get("content")
            if not content or not isinstance(content, list) or len(content) == 0:
                raise RuntimeError("Anthropic response missing 'content' array")

            # Extract text from first content block
            # Content blocks have 'type' and 'text' fields
            first_block = content[0]
            if not isinstance(first_block, dict):
                raise RuntimeError("Invalid content block structure")

            block_type = first_block.get("type")
            if block_type != "text":
                raise RuntimeError(
                    f"Expected content block type 'text', got '{block_type}'"
                )

            text = first_block.get("text")
            if text is None:
                raise RuntimeError("Content block missing 'text' field")

            return str(text)

        except (KeyError, IndexError, TypeError) as e:
            raise RuntimeError(f"Invalid Anthropic response structure: {e}") from e

    def _extract_token_usage(self, data: dict[str, Any]) -> tuple[int, int, int]:
        """
        Extract token usage breakdown from Anthropic Messages API response.

        Args:
            data: Parsed JSON response from Anthropic Messages API

        Returns:
            tuple[int, int, int]: (total_tokens, input_tokens, output_tokens)
                All values default to 0 if unavailable

        Note:
            Returns (0, 0, 0) if usage data is missing (graceful degradation).
            Logs warning if usage data is unavailable.
        """
        usage = data.get("usage")
        if not usage or not isinstance(usage, dict):
            logger.warning(
                f"Anthropic response missing 'usage' data for model={self.model_name}. "
                "Token count and cost will be zero."
            )
            return 0, 0, 0

        # Anthropic uses 'input_tokens' and 'output_tokens'
        input_tokens = usage.get("input_tokens", 0)
        output_tokens = usage.get("output_tokens", 0)
        total_tokens = input_tokens + output_tokens

        return (
            int(total_tokens) if total_tokens else 0,
            int(input_tokens) if input_tokens else 0,
            int(output_tokens) if output_tokens else 0,
        )

    def _extract_error_detail(self, response: httpx.Response) -> str:
        """
        Extract error detail from Anthropic Messages API error response.

        Args:
            response: HTTP response object from failed request

        Returns:
            str: Error message from API or generic message if unavailable

        Note:
            NEVER includes API keys in error messages.
            Only extracts error messages from response body.
        """
        try:
            error_data = response.json()
            error = error_data.get("error", {})
            message = error.get("message", "Unknown error")
            return str(message)
        except Exception:
            # Failed to parse error response
            return f"HTTP {response.status_code}"
