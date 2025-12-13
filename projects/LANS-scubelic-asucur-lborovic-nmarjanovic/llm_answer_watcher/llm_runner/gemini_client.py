"""
Google Gemini API client implementation for LLM Answer Watcher.

Provides asynchronous HTTP client for Google Gemini API with
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
    >>> from llm_runner.gemini_client import GeminiClient
    >>> client = GeminiClient("gemini-2.0-flash-exp", api_key="...",
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

# Google Gemini API base URL
# API endpoint format: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

# Maximum prompt length to prevent excessive API costs
# ~25k tokens at 4 chars/token average - prevents runaway costs from extremely long prompts
MAX_PROMPT_LENGTH = 100_000

# Get logger for this module
logger = logging.getLogger(__name__)


class GeminiClient:
    """
    Google Gemini API client with retry logic and cost tracking.

    Implements the LLMClient protocol for Google's Gemini API with automatic retry
    on transient failures, exponential backoff, and integrated cost estimation.
    Uses async/await for parallel execution across multiple models.

    Attributes:
        model_name: Gemini model identifier (e.g., "gemini-2.0-flash-exp", "gemini-1.5-pro")
        api_key: Google API key for authentication (NEVER logged)
        system_prompt: System message sent with every request for context/instructions

    Example:
        >>> client = GeminiClient("gemini-2.0-flash-exp", "AIza...", "You are a helpful assistant.")
        >>> response = await client.generate_answer("What are the best email warmup tools?")
        >>> response.tokens_used
        450
        >>> response.cost_usd
        0.000135

    Security:
        - API keys are NEVER logged in any form (not even partial)
        - API keys are only used in query parameters or headers
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
        Initialize Gemini client with model, API key, system prompt, and optional tools.

        Args:
            model_name: Gemini model identifier (e.g., "gemini-2.0-flash-exp")
            api_key: Google API key for authentication
            system_prompt: System message for context/instructions
            tools: Optional list of tool configurations (e.g., [{"google_search": {}}])
            tool_choice: Tool selection mode (note: Gemini auto-decides, this param is for API compat)

        Raises:
            ValueError: If model_name, api_key, or system_prompt is empty

        Example:
            >>> client = GeminiClient("gemini-2.0-flash-exp", "AIza...", "You are a helpful assistant.")
            >>> client.model_name
            'gemini-2.0-flash-exp'

            >>> # With Google Search grounding
            >>> client = GeminiClient(
            ...     "gemini-2.5-flash",
            ...     "AIza...",
            ...     "You are a helpful assistant.",
            ...     tools=[{"google_search": {}}]
            ... )

        Security:
            - The api_key parameter is NEVER logged
            - API key validation happens server-side
            - We only validate it's non-empty locally

        Note:
            Google Search grounding is supported via the tools parameter.
            Pass [{"google_search": {}}] to enable grounding with web search.
            Note that tool_choice is accepted for API compatibility but Gemini
            automatically decides when to use Google Search based on the query.
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

        # Log if Google Search grounding is enabled
        if tools:
            # Check if google_search tool is in tools list
            has_google_search = any(
                "google_search" in tool for tool in tools if isinstance(tool, dict)
            )
            if has_google_search:
                logger.info(
                    f"Initialized Gemini client with Google Search grounding: {model_name}"
                )
            else:
                logger.warning(
                    f"Tools provided but no google_search found. "
                    f"Only google_search is supported for Gemini. Model: {model_name}"
                )
        else:
            # Log initialization without tools (never log api_key)
            logger.info(f"Initialized Gemini client for model: {model_name}")

    @create_retry_decorator()
    async def generate_answer(self, prompt: str) -> LLMResponse:
        """
        Execute LLM query asynchronously with automatic retry and cost tracking.

        Sends prompt to Google Gemini API with system message for
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
            >>> client = GeminiClient("gemini-2.0-flash-exp", "AIza-...")
            >>> response = await client.generate_answer("What are the best CRM tools?")
            >>> print(response.answer_text[:100])
            "Based on market research, here are the top CRM tools..."
            >>> response.provider
            'google'
            >>> response.model_name
            'gemini-2.0-flash-exp'

        Retry behavior:
            - Retries automatically on 429, 500, 502, 503, 504
            - Fails immediately on 401, 400, 404
            - Uses exponential backoff: 2s, 4s, 8s, ... up to 60s
            - Max 3 attempts total

        Security:
            - API key is sent in query parameter only
            - API key is NEVER logged, even in error messages
            - Only model name and status codes are logged

        Note:
            The @retry decorator automatically handles async/await.
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
        # Gemini API uses 'contents' array with role/parts objects
        # System instruction is a separate parameter
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}],
                }
            ],
            "systemInstruction": {"parts": [{"text": self.system_prompt}]},
            "generationConfig": {
                "temperature": 0.7,  # Default temperature for consistency
            },
        }

        # Add tools if configured (direct passthrough to Gemini API)
        # Google format: [{"google_search": {}}] - dictionary with tool name as key
        # This differs from OpenAI's format: [{"type": "web_search"}] (typed specification)
        # Gemini automatically decides when to use tools (no tool_choice parameter)
        # Config schema uses generic list[dict] to support provider-specific formats
        if self.tools:
            payload["tools"] = self.tools
            logger.debug(f"Added tools to request: {len(self.tools)} tool(s)")

        # Build API endpoint URL
        # Format: /v1beta/models/{model}:generateContent?key={api_key}
        api_url = f"{GEMINI_API_BASE_URL}/models/{self.model_name}:generateContent"

        # Build headers (NEVER log api_key)
        headers = {
            "Content-Type": "application/json",
        }

        # API key is passed as query parameter for Gemini API
        params = {
            "key": self.api_key,
        }

        # Log request (NEVER log api_key or params)
        logger.debug(f"Sending request to Gemini: model={self.model_name}")

        # Make HTTP request with context manager for proper cleanup
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                response = await client.post(
                    api_url,
                    json=payload,
                    headers=headers,
                    params=params,
                )

                # Check for non-retryable errors first
                # These should fail immediately without retry
                if response.status_code in NO_RETRY_STATUS_CODES:
                    error_detail = self._extract_error_detail(response)
                    raise RuntimeError(
                        f"Gemini API error (non-retryable): "
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
                f"Gemini API HTTP error: "
                f"status={e.response.status_code}, "
                f"model={self.model_name}, "
                f"detail={error_detail}"
            )
            raise

        except httpx.ConnectError as e:
            # Connection failed (network issue)
            logger.error(
                f"Gemini API connection error: model={self.model_name}, error={e}"
            )
            raise

        except httpx.TimeoutException as e:
            # Request timed out
            logger.error(f"Gemini API timeout: model={self.model_name}, error={e}")
            raise

        # Parse response JSON
        try:
            data = response.json()
        except Exception as e:
            raise RuntimeError(f"Failed to parse Gemini response JSON: {e}") from e

        # Extract answer text
        answer_text = self._extract_answer_text(data)

        # Extract token usage
        tokens_used, prompt_tokens, completion_tokens = self._extract_token_usage(data)

        # Extract grounding metadata (Google Search results if tools enabled)
        web_search_results, web_search_count = self._extract_grounding_metadata(data)

        # Calculate cost
        usage_meta = {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
        }
        cost_usd = estimate_cost("google", self.model_name, usage_meta)

        # Get current timestamp
        timestamp = utc_timestamp()

        # Build and return response
        return LLMResponse(
            answer_text=answer_text,
            tokens_used=tokens_used,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cost_usd=cost_usd,
            provider="google",
            model_name=self.model_name,
            timestamp_utc=timestamp,
            web_search_results=web_search_results,
            web_search_count=web_search_count,
        )

    def _extract_answer_text(self, data: dict[str, Any]) -> str:
        """
        Extract answer text from Gemini API response.

        Args:
            data: Parsed JSON response from Gemini API

        Returns:
            str: The assistant's message content

        Raises:
            RuntimeError: If response structure is invalid or missing required fields
        """
        try:
            # Gemini API uses 'candidates' array
            candidates = data.get("candidates")
            if (
                not candidates
                or not isinstance(candidates, list)
                or len(candidates) == 0
            ):
                raise RuntimeError("Gemini response missing 'candidates' array")

            # Get first candidate
            candidate = candidates[0]
            if not isinstance(candidate, dict):
                raise RuntimeError("Invalid candidate structure")

            # Check for any non-STOP finish reason
            # These indicate the response didn't complete normally
            finish_reason = candidate.get("finishReason")
            if finish_reason and finish_reason != "STOP":
                # Build informative error message based on finish reason
                if finish_reason in ("SAFETY", "RECITATION", "PROHIBITED_CONTENT"):
                    error_msg = (
                        f"Gemini API blocked content due to safety filters: "
                        f"finishReason={finish_reason}"
                    )
                elif finish_reason == "UNEXPECTED_TOOL_CALL":
                    error_msg = (
                        f"Gemini API encountered unexpected tool call: "
                        f"finishReason={finish_reason}. "
                        f"This typically happens when the system prompt references tools "
                        f"(e.g., Google Search) but no tools are configured in the API request. "
                        f"Either add 'tools' parameter to your config or use a simpler system prompt."
                    )
                elif finish_reason == "MAX_TOKENS":
                    error_msg = (
                        f"Gemini API response exceeded maximum token limit: "
                        f"finishReason={finish_reason}. "
                        f"Consider using a shorter prompt or a model with larger context window."
                    )
                else:
                    error_msg = (
                        f"Gemini API returned unexpected finish reason: "
                        f"finishReason={finish_reason}. "
                        f"The response may be incomplete or invalid."
                    )
                raise RuntimeError(error_msg)

            # Extract content from candidate
            content = candidate.get("content")
            if not content or not isinstance(content, dict):
                # Include finish reason in error for debugging
                fr = candidate.get("finishReason", "UNKNOWN")
                raise RuntimeError(
                    f"Candidate missing 'content' field. finishReason={fr}. "
                    f"Available fields: {list(candidate.keys())}"
                )

            # Extract parts array
            parts = content.get("parts")
            if not parts or not isinstance(parts, list) or len(parts) == 0:
                raise RuntimeError("Content missing 'parts' array")

            # Extract text from first part
            first_part = parts[0]
            if not isinstance(first_part, dict):
                raise RuntimeError("Invalid part structure")

            text = first_part.get("text")
            if text is None:
                raise RuntimeError("Part missing 'text' field")

            return str(text)

        except (KeyError, IndexError, TypeError) as e:
            raise RuntimeError(f"Invalid Gemini response structure: {e}") from e

    def _extract_grounding_metadata(
        self, data: dict[str, Any]
    ) -> tuple[list[dict] | None, int]:
        """
        Extract Google Search grounding metadata from Gemini API response.

        Extracts groundingMetadata which includes web search queries and sources
        when Google Search grounding is enabled via tools parameter.

        Args:
            data: Parsed JSON response from Gemini API

        Returns:
            tuple: (web_search_results, web_search_count)
                - web_search_results: List of web search metadata dicts, or None if no searches
                - web_search_count: Number of web search queries performed

        Note:
            Returns (None, 0) if no grounding metadata in response (graceful handling).
            This happens when tools are not configured or Gemini decides search is not needed.

        Example grounding metadata structure:
            {
                "webSearchQueries": ["query1", "query2"],
                "groundingChunks": [
                    {"web": {"uri": "https://...", "title": "..."}},
                    ...
                ],
                "groundingSupports": [
                    {
                        "segment": {"startIndex": 0, "endIndex": 50, "text": "..."},
                        "groundingChunkIndices": [0, 1]
                    },
                    ...
                ]
            }
        """
        try:
            # Check if candidates exist
            candidates = data.get("candidates")
            if not candidates or not isinstance(candidates, list) or len(candidates) == 0:
                return None, 0

            # Get first candidate
            candidate = candidates[0]
            if not isinstance(candidate, dict):
                return None, 0

            # Extract grounding metadata (optional field)
            grounding_metadata = candidate.get("groundingMetadata")
            if not grounding_metadata or not isinstance(grounding_metadata, dict):
                logger.debug("No grounding metadata in response")
                return None, 0

            # Extract web search queries (list of strings)
            web_search_queries = grounding_metadata.get("webSearchQueries", [])
            if not isinstance(web_search_queries, list):
                web_search_queries = []

            # Extract grounding chunks (search results/sources)
            grounding_chunks = grounding_metadata.get("groundingChunks", [])
            if not isinstance(grounding_chunks, list):
                grounding_chunks = []

            # Extract grounding supports (citations mapping)
            grounding_supports = grounding_metadata.get("groundingSupports", [])
            if not isinstance(grounding_supports, list):
                grounding_supports = []

            # Build web search results in format similar to OpenAI
            # Store queries and sources for database/reporting
            web_search_results = []

            # Add search queries
            for query in web_search_queries:
                web_search_results.append(
                    {"type": "web_search_query", "query": str(query)}
                )

            # Add grounding chunks (sources)
            for chunk in grounding_chunks:
                if isinstance(chunk, dict) and "web" in chunk:
                    web = chunk["web"]
                    web_search_results.append(
                        {
                            "type": "web_search_source",
                            "uri": web.get("uri", ""),
                            "title": web.get("title", ""),
                        }
                    )

            # Add citation supports (optional, for advanced usage)
            if grounding_supports:
                web_search_results.append(
                    {"type": "grounding_supports", "supports": grounding_supports}
                )

            if not web_search_results:
                logger.debug("Grounding metadata present but no queries/sources extracted")
                return None, 0

            # Count is based on number of queries performed
            web_search_count = len(web_search_queries)

            logger.debug(
                f"Extracted grounding metadata: {web_search_count} queries, "
                f"{len(grounding_chunks)} sources, {len(grounding_supports)} supports"
            )

            return web_search_results, web_search_count

        except (KeyError, TypeError) as e:
            logger.warning(f"Failed to extract grounding metadata: {e}")
            return None, 0

    def _extract_token_usage(self, data: dict[str, Any]) -> tuple[int, int, int]:
        """
        Extract token usage breakdown from Gemini API response.

        Args:
            data: Parsed JSON response from Gemini API

        Returns:
            tuple[int, int, int]: (total_tokens, prompt_tokens, candidates_tokens)
                All values default to 0 if unavailable

        Note:
            Returns (0, 0, 0) if usage data is missing (graceful degradation).
            Logs warning if usage data is unavailable.
        """
        usage = data.get("usageMetadata")
        if not usage or not isinstance(usage, dict):
            logger.warning(
                f"Gemini response missing 'usageMetadata' for model={self.model_name}. "
                "Token count and cost will be zero."
            )
            return 0, 0, 0

        # Gemini uses 'promptTokenCount' and 'candidatesTokenCount'
        prompt_tokens = usage.get("promptTokenCount", 0)
        candidates_tokens = usage.get("candidatesTokenCount", 0)
        total_tokens = usage.get("totalTokenCount", prompt_tokens + candidates_tokens)

        return (
            int(total_tokens) if total_tokens else 0,
            int(prompt_tokens) if prompt_tokens else 0,
            int(candidates_tokens) if candidates_tokens else 0,
        )

    def _extract_error_detail(self, response: httpx.Response) -> str:
        """
        Extract error detail from Gemini API error response.

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
