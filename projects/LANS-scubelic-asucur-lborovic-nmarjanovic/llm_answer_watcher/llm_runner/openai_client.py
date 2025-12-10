"""
OpenAI API client implementation for LLM Answer Watcher.

Provides asynchronous HTTP client for OpenAI Responses API with
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
    >>> from llm_runner.openai_client import OpenAIClient
    >>> client = OpenAIClient("gpt-4o-mini", api_key="sk-...",
    ...     system_prompt="You are a helpful assistant.")
    >>> response = await client.generate_answer("What are the best CRM tools?")
    >>> print(f"Answer: {response.answer_text[:100]}...")
    >>> print(f"Cost: ${response.cost_usd:.6f}")
"""

import logging
from typing import Any

import httpx

from llm_answer_watcher.config.capabilities import get_model_capabilities
from llm_answer_watcher.config.constants import MAX_PROMPT_LENGTH
from llm_answer_watcher.llm_runner.models import LLMResponse
from llm_answer_watcher.llm_runner.retry_config import (
    NO_RETRY_STATUS_CODES,
    REQUEST_TIMEOUT,
    create_retry_decorator,
)
from llm_answer_watcher.utils.time import utc_timestamp

# Default temperature for models that support it
DEFAULT_TEMPERATURE = 0.7

# Suppress HTTPX request logging to prevent test interference
httpx_logger = logging.getLogger("httpx")
httpx_logger.setLevel(logging.WARNING)

# OpenAI API endpoint
OPENAI_API_URL = "https://api.openai.com/v1/responses"

# Get logger for this module
logger = logging.getLogger(__name__)


class OpenAIClient:
    """
    OpenAI Responses API client with async retry logic and cost tracking.

    Implements the LLMClient protocol for OpenAI's Responses API with automatic retry
    on transient failures, exponential backoff, and integrated cost estimation.
    Uses async HTTP client for non-blocking parallel execution.

    Attributes:
        model_name: OpenAI model identifier (e.g., "gpt-4o-mini", "gpt-4o")
        api_key: OpenAI API key for authentication (NEVER logged)
        system_prompt: System message sent with every request for context/instructions

    Example:
        >>> client = OpenAIClient("gpt-4o-mini", "sk-...", "You are a helpful assistant.")
        >>> response = await client.generate_answer("What are the best email warmup tools?")
        >>> response.tokens_used
        450
        >>> response.cost_usd
        0.000135

    Security:
        - API keys are NEVER logged in any form (not even partial)
        - API keys are only used in Authorization headers
        - No API keys are persisted to disk or included in error messages

    Retry behavior:
        - Retries on: 429 (rate limit), 500, 502, 503, 504 (server errors)
        - Fails immediately on: 401 (auth), 400 (bad request), 404 (not found)
        - Max attempts: 3 (from retry_config.MAX_ATTEMPTS)
        - Backoff: Exponential starting at 1s, max 60s (from retry_config)
        - Timeout: 120s per request (from retry_config.REQUEST_TIMEOUT)

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
        Initialize OpenAI client with model, API key, system prompt, and optional tools.

        Args:
            model_name: OpenAI model identifier (e.g., "gpt-4o-mini")
            api_key: OpenAI API key for authentication
            system_prompt: System message for context/instructions
            tools: Optional list of tool configurations (e.g., [{"type": "web_search"}])
            tool_choice: Tool selection mode ("auto", "required", "none"). Default: "auto"

        Raises:
            ValueError: If model_name, api_key, or system_prompt is empty

        Example:
            >>> client = OpenAIClient("gpt-4o-mini", "sk-...", "You are a helpful assistant.")
            >>> client.model_name
            'gpt-4o-mini'
            >>> # With web search enabled
            >>> client = OpenAIClient("gpt-4o-mini", "sk-...", "...",
            ...     tools=[{"type": "web_search"}], tool_choice="auto")

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

        # Log initialization (never log api_key)
        tools_enabled = "with tools" if tools else "without tools"
        logger.info(
            f"Initialized OpenAI client for model: {model_name} ({tools_enabled})"
        )

    @create_retry_decorator()
    async def generate_answer(self, prompt: str) -> LLMResponse:
        """
        Execute LLM query asynchronously with automatic retry and cost tracking.

        Sends prompt to OpenAI Chat Completions API with system message for
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
            >>> client = OpenAIClient("gpt-4o-mini", "sk-...")
            >>> response = await client.generate_answer("What are the best CRM tools?")
            >>> print(response.answer_text[:100])
            "Based on market research, here are the top CRM tools..."
            >>> response.provider
            'openai'
            >>> response.model_name
            'gpt-4o-mini'

        Retry behavior:
            - Retries automatically on 429, 500, 502, 503, 504
            - Fails immediately on 401, 400, 404
            - Uses exponential backoff: 2s, 4s, 8s, ... up to 60s
            - Max 3 attempts total

        Security:
            - API key is sent in Authorization header only
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

        # Build request payload with model-specific parameters
        # Responses API uses 'input' array with typed message objects
        # Each message requires: type="message", role, and content array
        payload = {
            "model": self.model_name,
            "input": [
                {
                    "type": "message",
                    "role": "developer",
                    "content": [{"type": "input_text", "text": self.system_prompt}],
                },
                {
                    "type": "message",
                    "role": "user",
                    "content": [{"type": "input_text", "text": prompt}],
                },
            ],
        }

        # Add temperature parameter only if model supports it
        # Load model capabilities from config
        capabilities = get_model_capabilities()
        if capabilities.supports_temperature("openai", self.model_name):
            payload["temperature"] = DEFAULT_TEMPERATURE
            logger.debug(f"Using temperature {DEFAULT_TEMPERATURE} for model: {self.model_name}")
        else:
            logger.debug(f"Using default temperature for model: {self.model_name} (custom temperature not supported)")

        # Add tools configuration if provided (direct passthrough to OpenAI API)
        # OpenAI format: [{"type": "web_search"}] with tool_choice control
        # This differs from Google's format: [{"google_search": {}}] (no tool_choice)
        # Config schema uses generic list[dict] to support provider-specific formats
        if self.tools:
            payload["tools"] = self.tools
            payload["tool_choice"] = self.tool_choice
            logger.debug(
                f"Enabled tools: {self.tools} with tool_choice={self.tool_choice}"
            )

        # GPT-5 models don't support max_tokens parameter, but we generally don't use it anyway
        # This is just for documentation - no changes needed since we don't set max_tokens

        # Build headers (NEVER log api_key)
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        # Log request (NEVER log api_key or headers)
        logger.debug(f"Sending request to OpenAI: model={self.model_name}")

        # Make async HTTP request with context manager for proper cleanup
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                response = await client.post(
                    OPENAI_API_URL,
                    json=payload,
                    headers=headers,
                )

                # Check for non-retryable errors first
                # These should fail immediately without retry
                if response.status_code in NO_RETRY_STATUS_CODES:
                    error_detail = self._extract_error_detail(response)
                    raise RuntimeError(
                        f"OpenAI API error (non-retryable): "
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
                f"OpenAI API HTTP error: "
                f"status={e.response.status_code}, "
                f"model={self.model_name}, "
                f"detail={error_detail}"
            )
            raise

        except httpx.ConnectError as e:
            # Connection failed (network issue)
            logger.error(
                f"OpenAI API connection error: model={self.model_name}, error={e}"
            )
            raise

        except httpx.TimeoutException as e:
            # Request timed out
            logger.error(f"OpenAI API timeout: model={self.model_name}, error={e}")
            raise

        # Parse response JSON
        try:
            data = response.json()
        except Exception as e:
            raise RuntimeError(f"Failed to parse OpenAI response JSON: {e}") from e

        # Debug: Log the entire response structure to understand token usage format
        logger.debug(f"OpenAI Responses API response keys: {data.keys()}")
        logger.debug(f"OpenAI usage field content: {data.get('usage', 'MISSING')}")

        # Extract answer text
        answer_text = self._extract_answer_text(data)

        # Extract token usage (total, prompt, completion)
        tokens_used, prompt_tokens, completion_tokens = self._extract_token_usage(data)

        # Extract web search results (if tools were used)
        web_search_results, web_search_count = self._extract_web_search_results(data)

        # Calculate cost (including web search if applicable)
        # Build usage_meta in the format expected by cost estimation functions
        usage_meta = {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": tokens_used,
        }

        # Detect web search version for pricing
        from llm_answer_watcher.utils.cost import (
            detect_web_search_version,
            estimate_cost_with_dynamic_pricing,
        )

        web_search_version = detect_web_search_version(self.model_name)

        # Use enhanced cost calculation with web search support
        cost_breakdown = estimate_cost_with_dynamic_pricing(
            provider="openai",
            model=self.model_name,
            usage_meta=usage_meta,
            web_search_count=web_search_count,
            web_search_version=web_search_version,
            use_dynamic_pricing=True,
        )

        cost_usd = cost_breakdown["total_cost_usd"]

        # Get current timestamp
        timestamp = utc_timestamp()

        # Log web search usage and costs if applicable
        if web_search_count > 0:
            logger.info(
                f"Web search performed: {web_search_count} searches, "
                f"model={self.model_name}, "
                f"tool_cost=${cost_breakdown['web_search_tool_cost_usd']:.6f}, "
                f"content_cost=${cost_breakdown['web_search_content_cost_usd']:.6f}"
            )

        # Build and return response
        return LLMResponse(
            answer_text=answer_text,
            tokens_used=tokens_used,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cost_usd=cost_usd,
            provider="openai",
            model_name=self.model_name,
            timestamp_utc=timestamp,
            web_search_results=web_search_results,
            web_search_count=web_search_count,
        )

    def _extract_answer_text(self, data: dict[str, Any]) -> str:
        """
        Extract answer text from OpenAI Responses API response.

        When tools are used, the output array may contain multiple items
        (e.g., web_search results, function_call, then the text response).
        This method iterates through all output items to find either:
        1. Function call (formatted as special JSON for function_extractor)
        2. Text response (for normal queries)

        Args:
            data: Parsed JSON response from OpenAI Responses API

        Returns:
            str: The assistant's message content or formatted function call

        Raises:
            RuntimeError: If response structure is invalid or missing required fields
        """
        import json

        try:
            # Responses API uses 'output' instead of 'choices'
            output = data.get("output")
            if not output or not isinstance(output, list) or len(output) == 0:
                raise RuntimeError("OpenAI response missing 'output' array")

            # First pass: Check for function_call items
            # Function calls take precedence over text responses
            for output_item in output:
                if not isinstance(output_item, dict):
                    continue

                item_type = output_item.get("type")

                # Handle function_call type (OpenAI Responses API format)
                if item_type == "function_call":
                    function_name = output_item.get("name")
                    arguments_str = output_item.get("arguments", "{}")

                    # Parse arguments JSON
                    try:
                        arguments = (
                            json.loads(arguments_str)
                            if isinstance(arguments_str, str)
                            else arguments_str
                        )
                    except json.JSONDecodeError:
                        logger.warning(
                            f"Failed to parse function arguments: {arguments_str}"
                        )
                        arguments = {}

                    # Format as special JSON for function_extractor to parse
                    function_call_data = {
                        "_function_call": {
                            "name": function_name,
                            "arguments": arguments,
                            "call_id": output_item.get("call_id"),
                        }
                    }

                    logger.debug(
                        f"Detected function call: {function_name} with {len(arguments)} args"
                    )

                    return json.dumps(function_call_data)

            # Second pass: Look for regular text response
            # When tools are used, output may contain: [web_search, message, ...]
            for output_item in output:
                if not isinstance(output_item, dict):
                    continue

                # Skip non-message items (e.g., web_search, function_call)
                item_type = output_item.get("type")
                if item_type and item_type != "message":
                    continue

                # Found a message item, extract content
                content_array = output_item.get("content")
                if content_array is None:
                    continue

                # If content is a list, extract text from output_text items
                if isinstance(content_array, list):
                    for content_item in content_array:
                        if isinstance(content_item, dict):
                            if content_item.get("type") == "output_text":
                                text = content_item.get("text", "")
                                if text:  # Return first non-empty text
                                    return str(text)
                        elif content_item:  # String in array
                            return str(content_item)

                # Fallback: content is a string (backward compatibility)
                elif content_array:
                    return str(content_array)

            # No text content found in any output item
            raise RuntimeError(
                "OpenAI response contains no text content. "
                f"Output items: {[item.get('type') for item in output if isinstance(item, dict)]}"
            )

        except (KeyError, IndexError, TypeError) as e:
            raise RuntimeError(f"Invalid OpenAI response structure: {e}") from e

    def _extract_token_usage(self, data: dict[str, Any]) -> tuple[int, int, int]:
        """
        Extract token usage breakdown from OpenAI Responses API response.

        Args:
            data: Parsed JSON response from OpenAI Responses API

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
                f"OpenAI response missing 'usage' data for model={self.model_name}. "
                "Token count and cost will be zero. "
                f"Response keys: {list(data.keys())}"
            )
            return 0, 0, 0

        # Debug: Log what fields are in the usage object
        logger.debug(f"Usage object keys for {self.model_name}: {list(usage.keys())}")
        logger.debug(f"Usage object content: {usage}")

        # OpenAI Responses API uses input_tokens/output_tokens
        # Older Chat Completions API used prompt_tokens/completion_tokens
        # Try both formats for compatibility
        total_tokens = usage.get("total_tokens", 0)
        prompt_tokens = usage.get("input_tokens") or usage.get("prompt_tokens", 0)
        completion_tokens = usage.get("output_tokens") or usage.get(
            "completion_tokens", 0
        )

        # Log the extracted values
        logger.info(
            f"Extracted token usage for {self.model_name}: "
            f"total={total_tokens}, prompt={prompt_tokens}, completion={completion_tokens}"
        )

        return (
            int(total_tokens) if total_tokens else 0,
            int(prompt_tokens) if prompt_tokens else 0,
            int(completion_tokens) if completion_tokens else 0,
        )

    def _extract_web_search_results(
        self, data: dict[str, Any]
    ) -> tuple[list[dict] | None, int]:
        """
        Extract web search results from OpenAI Responses API response.

        Args:
            data: Parsed JSON response from OpenAI Responses API

        Returns:
            tuple: (web_search_results, web_search_count)
                - web_search_results: List of web search result dicts, or None if no searches
                - web_search_count: Number of web searches performed

        Note:
            Returns (None, 0) if no web search results in response (graceful handling).
        """
        try:
            output = data.get("output")
            if not output or not isinstance(output, list):
                return None, 0

            # Debug logging to understand response structure
            output_types = [
                item.get("type") if isinstance(item, dict) else type(item).__name__
                for item in output
            ]
            logger.debug(f"Response output types: {output_types}")

            web_search_results = []
            for item in output:
                if not isinstance(item, dict):
                    continue

                item_type = item.get("type")
                logger.debug(f"Processing output item type: {item_type}")

                # Check for web_search types (web_search_call, web_search, web_search_result)
                if item_type in ("web_search_call", "web_search", "web_search_result"):
                    # Extract web search data - try multiple possible fields
                    searches = item.get("searches", [])
                    if searches:
                        web_search_results.extend(searches)
                        logger.debug(
                            f"Found {len(searches)} searches in '{item_type}' item"
                        )

                    # Also check for results field
                    results = item.get("results", [])
                    if results:
                        web_search_results.extend(results)
                        logger.debug(
                            f"Found {len(results)} results in '{item_type}' item"
                        )

                    # Store the entire item if no sub-items found
                    if not searches and not results:
                        web_search_results.append(item)
                        logger.debug(f"Stored full '{item_type}' item as search result")

                # Also check if item has search_results field (alternative structure)
                if "search_results" in item:
                    search_results = item.get("search_results", [])
                    web_search_results.extend(search_results)
                    logger.debug(
                        f"Found search_results with {len(search_results)} results"
                    )

            if not web_search_results:
                logger.debug("No web search results found in response")
                return None, 0

            logger.debug(f"Extracted {len(web_search_results)} web search results")
            return web_search_results, len(web_search_results)

        except (KeyError, TypeError) as e:
            logger.warning(f"Failed to extract web search results: {e}")
            return None, 0

    def _extract_error_detail(self, response: httpx.Response) -> str:
        """
        Extract error detail from OpenAI Responses API error response.

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
