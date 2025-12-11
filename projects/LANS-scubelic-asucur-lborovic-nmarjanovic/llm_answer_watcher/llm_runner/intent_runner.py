"""
Intent runner abstraction for LLM Answer Watcher.

This module provides a higher-level abstraction over LLM execution that supports
both API-based and browser-based runners through a unified interface.

Key components:
- IntentResult: Unified result structure from any runner type (API/browser/custom)
- IntentRunner: Protocol defining the runner interface
- Runner types: "api" (direct LLM API), "browser" (headless automation), "custom"

Architecture:
    This abstraction enables the plugin system where different runner implementations
    can be swapped without changing the orchestration code. API runners wrap existing
    LLMClient implementations, while browser runners use tools like Steel/Playwright
    to interact with web interfaces like ChatGPT.

Example:
    >>> # API-based runner (wraps LLMClient)
    >>> api_runner = APIRunner(client=openai_client)
    >>> result = api_runner.run_intent("What are the best CRM tools?")
    >>> print(result.answer_text)
    >>> print(f"Cost: ${result.cost_usd:.4f}")

    >>> # Browser-based runner (Steel ChatGPT)
    >>> browser_runner = SteelChatGPTRunner(config=steel_config)
    >>> result = browser_runner.run_intent("What are the best CRM tools?")
    >>> print(result.answer_text)
    >>> print(f"Screenshot: {result.screenshot_path}")
"""

from dataclasses import dataclass
from typing import Protocol


@dataclass
class IntentResult:
    """
    Unified result structure from any runner type.

    This dataclass provides a consistent interface for results from API-based,
    browser-based, and custom runners. It includes fields for both API metadata
    (tokens, costs) and browser metadata (screenshots, sessions).

    Attributes:
        answer_text: The extracted answer text from LLM or browser
        runner_type: Runner category - "api", "browser", or "custom"
        runner_name: Human-readable runner identifier (e.g., "openai-gpt-4o", "steel-chatgpt")
        provider: Provider/platform name (e.g., "openai", "chatgpt-web", "steel")
        model_name: Model identifier (e.g., "gpt-4o-mini", "chatgpt-plus", "unknown")
        timestamp_utc: UTC timestamp of execution (ISO 8601 with 'Z' suffix)

        # Cost tracking (API-based have exact costs, browser-based can be estimated)
        cost_usd: Estimated cost in USD (0.0 if not tracked)
        tokens_used: Total token count (0 for browser-based)
        prompt_tokens: Input tokens (0 for browser-based)
        completion_tokens: Output tokens (0 for browser-based)

        # Browser-specific metadata (None for API-based runners)
        screenshot_path: Optional path to screenshot artifact
        html_snapshot_path: Optional path to HTML snapshot file
        session_id: Optional browser session identifier
        interaction_steps: Optional list of browser actions taken

        # Web search results (from API tools or browser scraping)
        web_search_results: Optional list of web search results with URLs/snippets
        web_search_count: Number of web searches performed (0 if none)

        # Error handling
        success: Whether execution succeeded (True) or failed (False)
        error_message: Optional error details if success=False

    Example:
        >>> # API-based result
        >>> result = IntentResult(
        ...     answer_text="Here are the top CRM tools...",
        ...     runner_type="api",
        ...     runner_name="openai-gpt-4o-mini",
        ...     provider="openai",
        ...     model_name="gpt-4o-mini",
        ...     timestamp_utc="2025-11-06T10:30:00Z",
        ...     cost_usd=0.0012,
        ...     tokens_used=450,
        ...     prompt_tokens=100,
        ...     completion_tokens=350,
        ...     success=True
        ... )

        >>> # Browser-based result
        >>> result = IntentResult(
        ...     answer_text="Here are the top CRM tools...",
        ...     runner_type="browser",
        ...     runner_name="steel-chatgpt",
        ...     provider="chatgpt-web",
        ...     model_name="chatgpt-unknown",
        ...     timestamp_utc="2025-11-06T10:30:00Z",
        ...     cost_usd=0.0,  # Not tracked initially
        ...     tokens_used=0,  # Browser-based, no token tracking
        ...     screenshot_path="./output/run-id/screenshot_intent-1.png",
        ...     html_snapshot_path="./output/run-id/html_intent-1.html",
        ...     session_id="steel-session-abc123",
        ...     web_search_count=3,
        ...     success=True
        ... )
    """

    answer_text: str
    runner_type: str  # "api" | "browser" | "custom"
    runner_name: str
    provider: str
    model_name: str
    timestamp_utc: str

    # Cost tracking (optional)
    cost_usd: float = 0.0
    tokens_used: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0

    # Browser-specific metadata (optional)
    screenshot_path: str | None = None
    html_snapshot_path: str | None = None
    session_id: str | None = None
    interaction_steps: list[dict] | None = None

    # Web search (optional)
    web_search_results: list[dict] | None = None
    web_search_count: int = 0

    # Error handling
    success: bool = True
    error_message: str | None = None


class IntentRunner(Protocol):
    """
    Universal interface for intent execution.

    This Protocol defines the contract that all runners (API-based, browser-based,
    custom) must implement. It provides a consistent interface for the orchestration
    layer (llm_runner/runner.py) to execute intents without knowing the underlying
    implementation.

    Protocol methods:
        run_intent: Execute intent and return structured result
        runner_type: Property returning runner category
        runner_name: Property returning human-readable identifier

    Example implementation:
        >>> class MyCustomRunner:
        ...     def run_intent(self, prompt: str) -> IntentResult:
        ...         # Custom implementation
        ...         result = self._execute_somehow(prompt)
        ...         return IntentResult(
        ...             answer_text=result,
        ...             runner_type="custom",
        ...             runner_name="my-runner",
        ...             provider="custom",
        ...             model_name="custom-model",
        ...             timestamp_utc=utc_timestamp(),
        ...             success=True
        ...         )
        ...
        ...     @property
        ...     def runner_type(self) -> str:
        ...         return "custom"
        ...
        ...     @property
        ...     def runner_name(self) -> str:
        ...         return "my-runner"

    Note:
        This is a Protocol (PEP 544), not an abstract base class. Implementations
        don't need to explicitly inherit from this Protocol - they just need to
        provide the required methods/properties with matching signatures.
    """

    def run_intent(self, prompt: str) -> IntentResult:
        """
        Execute intent and return structured result.

        Args:
            prompt: User intent prompt to execute (buyer-intent query)

        Returns:
            IntentResult: Structured result with answer text and metadata

        Raises:
            Exception: Runner-specific exceptions on failures (auth, network, etc.)
                Implementations should catch exceptions and return IntentResult
                with success=False and error_message set.

        Example:
            >>> runner = build_runner("openai-api", config)
            >>> result = runner.run_intent("What are the best email warmup tools?")
            >>> if result.success:
            ...     print(result.answer_text)
            ...     print(f"Cost: ${result.cost_usd:.4f}")
            ... else:
            ...     print(f"Error: {result.error_message}")
        """
        ...

    @property
    def runner_type(self) -> str:
        """
        Return runner type category.

        Returns:
            str: One of "api", "browser", "custom"

        Example:
            >>> runner.runner_type
            'api'
        """
        ...

    @property
    def runner_name(self) -> str:
        """
        Return human-readable runner identifier.

        This should be a descriptive string that uniquely identifies the runner
        configuration (e.g., "openai-gpt-4o", "steel-chatgpt", "anthropic-claude-sonnet").

        Returns:
            str: Runner identifier for logging and display

        Example:
            >>> runner.runner_name
            'openai-gpt-4o-mini'
        """
        ...
