"""
Groq API client implementation for LLM Answer Watcher.

Provides asynchronous HTTP client for Groq API with
automatic retry logic, exponential backoff, and comprehensive error handling.

Groq uses an OpenAI-compatible API format, making integration straightforward.
Supported models include Llama 3, Mixtral, and Gemma.

Key features:
- Async HTTP client for parallel execution (httpx.AsyncClient)
- Retry on transient failures (429, 5xx) with exponential backoff
- Fail fast on permanent errors (401, 400, 404)
- Automatic cost estimation based on token usage
- UTC timestamp tracking
- Configurable system message per model
- Security: NEVER logs API keys

Example:
    >>> from llm_runner.groq_client import GroqClient
    >>> client = GroqClient("llama-3.1-8b-instant", api_key="...",
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

# Groq API base URL (OpenAI-compatible endpoint)
GROQ_API_BASE_URL = "https://api.groq.com/openai/v1"

# Maximum prompt length to prevent excessive API costs
# ~25k tokens at 4 chars/token average - prevents runaway costs from extremely long prompts
MAX_PROMPT_LENGTH = 100_000

# Get logger for this module
logger = logging.getLogger(__name__)


class GroqClient:
    """
    Groq API client with retry logic and cost tracking.

    Implements the LLMClient protocol for Groq's API with automatic retry
    on transient failures, exponential backoff, and integrated cost estimation.
    Uses async/await for parallel execution across multiple models.

    Groq is known for extremely fast inference speeds using custom LPU hardware.

    Supported models:
    - llama-3.3-70b-versatile: Llama 3.3 70B, great for general tasks
    - llama-3.1-8b-instant: Llama 3.1 8B, fastest inference
    - llama-3.2-90b-vision-preview: Llama 3.2 90B with vision
    - mixtral-8x7b-32768: Mixtral MoE with 32k context
    - gemma2-9b-it: Gemma 2 9B instruction-tuned

    Attributes:
        model_name: Groq model identifier (e.g., "llama-3.1-8b-instant")
        api_key: Groq API key for authentication (NEVER logged)
        system_prompt: System message sent with every request for context/instructions

    Example:
        >>> client = GroqClient("llama-3.1-8b-instant", "gsk-...", "You are a helpful assistant.")
        >>> response = await client.generate_answer("What are the best email warmup tools?")
        >>> response.tokens_used
        450
        >>> response.cost_usd
        0.000027

    Security:
        - API keys are NEVER logged in any form (not even partial)
        - API keys are only used in Authorization headers
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
        Initialize Groq client with model, API key, system prompt, and optional tools.

        Args:
            model_name: Groq model identifier (e.g., "llama-3.1-8b-instant")
            api_key: Groq API key for authentication
            system_prompt: System message for context/instructions
            tools: Optional list of tool configurations (not currently used by Groq)
            tool_choice: Tool selection mode (not currently used by Groq)

        Raises:
            ValueError: If model_name, api_key, or system_prompt is empty

        Example:
            >>> client = GroqClient("llama-3.1-8b-instant", "gsk-...", "You are a helpful assistant.")
            >>> client.model_name
            'llama-3.1-8b-instant'

        Security:
            - The api_key parameter is NEVER logged
            - API key validation happens server-side
            - We only validate it's non-empty locally
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

        # Log if tools are provided (Groq has limited tool support)
        if tools:
            logger.warning(
                f"Tools provided to Groq client for model {model_name}. "
                f"Groq has limited tool support - verify compatibility."
            )
        else:
            # Log initialization without tools (never log api_key)
            logger.info(f"Initialized Groq client for model: {model_name}")

    @create_retry_decorator()
    async def generate_answer(self, prompt: str) -> LLMResponse:
        """
        Execute LLM query asynchronously with automatic retry and cost tracking.

        Sends prompt to Groq API with system message for
        unbiased analysis. Handles transient failures with exponential backoff
        and calculates costs based on token usage.

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
            >>> client = GroqClient("llama-3.1-8b-instant", "gsk-...")
            >>> response = await client.generate_answer("What are the best CRM tools?")
            >>> print(response.answer_text[:100])
            "Based on market research, here are the top CRM tools..."
            >>> response.provider
            'groq'
            >>> response.model_name
            'llama-3.1-8b-instant'

        Retry behavior:
            - Retries automatically on 429, 500, 502, 503, 504
            - Fails immediately on 401, 400, 404
            - Uses exponential backoff: 2s, 4s, 8s, ... up to 60s
            - Max 3 attempts total

        Security:
            - API key is sent in Authorization header only
            - API key is NEVER logged, even in error messages
            - Only model name and status codes are logged
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

        # Build request payload (OpenAI-compatible format)
        payload: dict[str, Any] = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.7,  # Default temperature for consistency
        }

        # Build API endpoint URL
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        # Build headers (NEVER log api_key)
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        # Log request (NEVER log api_key)
        logger.debug(f"Sending request to Groq: model={self.model_name}")

        # Make HTTP request with context manager for proper cleanup
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                response = await client.post(
                    api_url,
                    json=payload,
                    headers=headers,
                )

                # Check for non-retryable errors first
                # These should fail immediately without retry
                if response.status_code in NO_RETRY_STATUS_CODES:
                    error_detail = self._extract_error_detail(response)
                    raise RuntimeError(
                        f"Groq API error (non-retryable): "
                        f"status={response.status_code}, "
                        f"model={self.model_name}, "
                        f"detail={error_detail}"
                    )

                # Raise for retryable errors (429, 5xx)
                # The @retry decorator will catch these and retry
                response.raise_for_status()

        except httpx.HTTPStatusError as e:
            # Log specific warning for rate limit errors
            if e.response.status_code == 429:
                retry_after = e.response.headers.get("Retry-After")
                logger.warning(
                    f"Groq API rate limit exceeded (429 Too Many Requests). "
                    f"Retry-After: {retry_after}. "
                    f"Consider reducing 'max_concurrent_requests' in your config file. "
                    f"Model: {self.model_name}"
                )

            # Log generic error (NEVER log api_key)
            error_detail = self._extract_error_detail(e.response)
            logger.error(
                f"Groq API HTTP error: "
                f"status={e.response.status_code}, "
                f"model={self.model_name}, "
                f"detail={error_detail}"
            )
            raise

        except httpx.ConnectError as e:
            # Connection failed (network issue)
            logger.error(
                f"Groq API connection error: model={self.model_name}, error={e}"
            )
            raise

        except httpx.TimeoutException as e:
            # Request timed out
            logger.error(f"Groq API timeout: model={self.model_name}, error={e}")
            raise

        # Parse response JSON
        try:
            data = response.json()
        except Exception as e:
            raise RuntimeError(f"Failed to parse Groq response JSON: {e}") from e

        # Extract answer text
        answer_text = self._extract_answer_text(data)

        # Extract token usage
        tokens_used, prompt_tokens, completion_tokens = self._extract_token_usage(data)

        # Calculate cost
        usage_meta = {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
        }
        cost_usd = estimate_cost("groq", self.model_name, usage_meta)

        # Get current timestamp
        timestamp = utc_timestamp()

        # Build and return response
        return LLMResponse(
            answer_text=answer_text,
            tokens_used=tokens_used,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cost_usd=cost_usd,
            provider="groq",
            model_name=self.model_name,
            timestamp_utc=timestamp,
            web_search_results=None,
            web_search_count=0,
        )

    def _extract_answer_text(self, data: dict[str, Any]) -> str:
        """
        Extract answer text from Groq API response.

        Args:
            data: Parsed JSON response from Groq API

        Returns:
            str: The assistant's message content

        Raises:
            RuntimeError: If response structure is invalid or missing required fields
        """
        try:
            # Groq uses OpenAI-compatible 'choices' array
            choices = data.get("choices")
            if not choices or not isinstance(choices, list) or len(choices) == 0:
                raise RuntimeError("Groq response missing 'choices' array")

            # Get first choice
            choice = choices[0]
            if not isinstance(choice, dict):
                raise RuntimeError("Invalid choice structure")

            # Check finish reason
            finish_reason = choice.get("finish_reason")
            if finish_reason and finish_reason not in ("stop", "length"):
                logger.warning(
                    f"Groq returned unexpected finish_reason: {finish_reason}"
                )

            # Extract message content
            message = choice.get("message")
            if not message or not isinstance(message, dict):
                raise RuntimeError("Choice missing 'message' field")

            content = message.get("content")
            if content is None:
                raise RuntimeError("Message missing 'content' field")

            return str(content)

        except (KeyError, IndexError, TypeError) as e:
            raise RuntimeError(f"Invalid Groq response structure: {e}") from e

    def _extract_token_usage(self, data: dict[str, Any]) -> tuple[int, int, int]:
        """
        Extract token usage breakdown from Groq API response.

        Args:
            data: Parsed JSON response from Groq API

        Returns:
            tuple[int, int, int]: (total_tokens, prompt_tokens, completion_tokens)
                All values default to 0 if unavailable

        Note:
            Returns (0, 0, 0) if usage data is missing (graceful degradation).
            Logs warning if usage data is unavailable.
        """
        usage = data.get("usage")
        if not usage or not isinstance(usage, dict):
            logger.warning(
                f"Groq response missing 'usage' for model={self.model_name}. "
                "Token count and cost will be zero."
            )
            return 0, 0, 0

        # Groq uses OpenAI-compatible format
        prompt_tokens = usage.get("prompt_tokens", 0)
        completion_tokens = usage.get("completion_tokens", 0)
        total_tokens = usage.get("total_tokens", prompt_tokens + completion_tokens)

        return (
            int(total_tokens) if total_tokens else 0,
            int(prompt_tokens) if prompt_tokens else 0,
            int(completion_tokens) if completion_tokens else 0,
        )

    def _extract_error_detail(self, response: httpx.Response) -> str:
        """
        Extract error detail from Groq API error response.

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
