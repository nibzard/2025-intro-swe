"""
LLM client abstraction and factory for LLM Answer Watcher.

This module provides a provider-agnostic interface for interacting with
different LLM providers (OpenAI, Anthropic, Mistral, etc.) through a unified
Protocol-based design.

Key components:
- LLMResponse: Structured dataclass holding LLM response data
- LLMClient: Protocol defining provider-agnostic interface
- build_client: Factory function to create appropriate client instances

The design follows the Protocol pattern for extensibility, allowing new
providers to be added without modifying existing code, while maintaining
a stable internal contract for the Cloud product.

Example:
    >>> from llm_runner.models import build_client
    >>> client = build_client("openai", "gpt-4o-mini", api_key,
    ...     system_prompt="You are a helpful assistant.")
    >>> response = client.generate_answer("What are the best email warmup tools?")
    >>> print(response.answer_text)
    >>> print(f"Cost: ${response.cost_usd:.4f}")
"""

from dataclasses import dataclass
from typing import Protocol


@dataclass
class LLMResponse:
    """
    Structured response from an LLM query.

    Contains the raw answer text plus metadata for tracking costs,
    tokens, and provider information. Used for consistent handling
    across all provider implementations.

    Attributes:
        answer_text: The LLM's complete response text
        tokens_used: Total tokens consumed (prompt + completion)
        prompt_tokens: Tokens in the prompt/input
        completion_tokens: Tokens in the completion/output
        cost_usd: Estimated cost in USD based on provider pricing
        provider: Provider name (e.g., "openai", "anthropic")
        model_name: Specific model identifier (e.g., "gpt-4o-mini")
        timestamp_utc: ISO 8601 timestamp with 'Z' suffix when response was received
        web_search_results: Optional list of web search results if tools were used
        web_search_count: Number of web searches performed (0 if no web search)

    Example:
        >>> response = LLMResponse(
        ...     answer_text="Based on market research...",
        ...     tokens_used=450,
        ...     prompt_tokens=100,
        ...     completion_tokens=350,
        ...     cost_usd=0.000135,
        ...     provider="openai",
        ...     model_name="gpt-4o-mini",
        ...     timestamp_utc="2025-11-02T08:30:45Z",
        ...     web_search_results=None,
        ...     web_search_count=0
        ... )
        >>> response.cost_usd
        0.000135
        >>> response.prompt_tokens + response.completion_tokens == response.tokens_used
        True
    """

    answer_text: str
    tokens_used: int
    cost_usd: float
    provider: str
    model_name: str
    timestamp_utc: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    web_search_results: list[dict] | None = None
    web_search_count: int = 0


class LLMClient(Protocol):
    """
    Provider-agnostic interface for LLM clients.

    All LLM provider implementations must conform to this Protocol.
    This enables polymorphic usage and simplifies adding new providers.

    The Protocol defines a single async method that handles the complete request/response
    cycle including retry logic, error handling, and metadata extraction.

    Methods:
        generate_answer: Execute LLM query asynchronously and return structured response

    Example implementation:
        >>> class OpenAIClient:
        ...     def __init__(self, model_name: str, api_key: str):
        ...         self.model_name = model_name
        ...         self.api_key = api_key
        ...
        ...     async def generate_answer(self, prompt: str) -> LLMResponse:
        ...         # Implementation with async HTTP, retry logic, etc.
        ...         pass

    Note:
        Implementations MUST:
        - Use async/await for HTTP requests (httpx.AsyncClient)
        - Include automatic retry logic with exponential backoff
        - Handle transient failures (rate limits, server errors)
        - Never log API keys or sensitive credentials
        - Return LLMResponse with accurate cost estimates
        - Use UTC timestamps from utils.time module
    """

    async def generate_answer(self, prompt: str) -> LLMResponse:
        """
        Execute an LLM query asynchronously and return structured response with metadata.

        Handles the complete request/response cycle including:
        - Async HTTP API call to provider (using httpx.AsyncClient)
        - Automatic retry on transient failures (429, 5xx errors)
        - Token usage extraction
        - Cost estimation
        - Timestamp generation

        Args:
            prompt: User intent prompt to send to the LLM

        Returns:
            LLMResponse: Structured response with answer text and metadata

        Raises:
            RuntimeError: On permanent failures (auth errors, invalid requests)
                or after all retry attempts exhausted

        Example:
            >>> client = build_client("openai", "gpt-4o-mini", api_key)
            >>> response = await client.generate_answer("What are the best CRM tools?")
            >>> print(response.answer_text)
            "Based on market research, the top CRM tools are..."
            >>> response.tokens_used
            350

        Note:
            - Uses async HTTP client for non-blocking I/O
            - Retry logic is provider-specific (configured per implementation)
            - Typical retry strategy: 3 attempts, exponential backoff 1s-10s
            - Non-retryable errors: 401 (auth), 400 (bad request), 404 (not found)
            - Retryable errors: 429 (rate limit), 500, 502, 503, 504 (server errors)
        """
        ...


def build_client(
    provider: str,
    model_name: str,
    api_key: str,
    system_prompt: str,
    tools: list[dict] | None = None,
    tool_choice: str = "auto",
) -> LLMClient:
    """
    Factory function to create appropriate LLM client based on provider.

    Implements the factory pattern to instantiate provider-specific clients
    while returning the common LLMClient interface. This allows the rest of
    the codebase to work with providers polymorphically.

    Supported providers:
    - "openai": OpenAI API (GPT models)
    - "anthropic": Anthropic API (Claude models)
    - "mistral": Mistral API (Mistral models)
    - "grok": X.AI Grok API (Grok models)
    - "google": Google Gemini API (Gemini models)
    - "perplexity": Perplexity API (Sonar models)

    Args:
        provider: Provider identifier (lowercase string)
        model_name: Model identifier (e.g., "gpt-4o-mini", "claude-3-5-haiku-20241022")
        api_key: API key for authentication (NEVER logged or persisted)
        system_prompt: System message for context/instructions sent with requests
        tools: Optional list of tool configurations (e.g., [{"type": "web_search"}])
        tool_choice: Tool selection mode ("auto", "required", "none"). Default: "auto"

    Returns:
        LLMClient: Provider-specific client implementing LLMClient protocol

    Raises:
        ValueError: If provider is not supported
        NotImplementedError: If provider support is planned but not yet implemented

    Example:
        >>> client = build_client("openai", "gpt-4o-mini", "sk-...",
        ...     system_prompt="You are a helpful assistant.")
        >>> isinstance(client, LLMClient)  # Satisfies protocol
        True
        >>> response = client.generate_answer("What are the best email tools?")
        >>> # With tools enabled
        >>> client = build_client("openai", "gpt-4o-mini", "sk-...", "...",
        ...     tools=[{"type": "web_search"}], tool_choice="auto")
        >>> # Grok example
        >>> client = build_client("grok", "grok-beta", "xai-...", "...")

    Security:
        - NEVER log the api_key parameter in any form
        - API keys are only passed to provider client constructors
        - Clients MUST NOT persist keys to disk or logs

    Note:
        This function is the single entry point for creating LLM clients.
        As new providers are added, register them here to maintain the
        stable internal contract for the Cloud product API.
    """
    if provider == "openai":
        # Import here to avoid circular dependencies and keep imports lazy
        from llm_answer_watcher.llm_runner.openai_client import (
            OpenAIClient,
        )

        return OpenAIClient(
            model_name=model_name,
            api_key=api_key,
            system_prompt=system_prompt,
            tools=tools,
            tool_choice=tool_choice,
        )

    if provider == "anthropic":
        # Import here to avoid circular dependencies and keep imports lazy
        from llm_answer_watcher.llm_runner.anthropic_client import (
            AnthropicClient,
        )

        return AnthropicClient(
            model_name=model_name,
            api_key=api_key,
            system_prompt=system_prompt,
            tools=tools,
            tool_choice=tool_choice,
        )

    if provider == "mistral":
        # Import here to avoid circular dependencies and keep imports lazy
        from llm_answer_watcher.llm_runner.mistral_client import (
            MistralClient,
        )

        return MistralClient(
            model_name=model_name,
            api_key=api_key,
            system_prompt=system_prompt,
            tools=tools,
            tool_choice=tool_choice,
        )

    if provider == "grok":
        # Import here to avoid circular dependencies and keep imports lazy
        from llm_answer_watcher.llm_runner.grok_client import (
            GrokClient,
        )

        return GrokClient(
            model_name=model_name,
            api_key=api_key,
            system_prompt=system_prompt,
            tools=tools,
            tool_choice=tool_choice,
        )

    if provider == "google":
        # Import here to avoid circular dependencies and keep imports lazy
        from llm_answer_watcher.llm_runner.gemini_client import (
            GeminiClient,
        )

        return GeminiClient(
            model_name=model_name,
            api_key=api_key,
            system_prompt=system_prompt,
            tools=tools,
            tool_choice=tool_choice,
        )

    if provider == "perplexity":
        # Import here to avoid circular dependencies and keep imports lazy
        from llm_answer_watcher.llm_runner.perplexity_client import (
            PerplexityClient,
        )

        return PerplexityClient(
            model_name=model_name,
            api_key=api_key,
            system_prompt=system_prompt,
            tools=tools,
            tool_choice=tool_choice,
        )

    # Unknown provider - clear error message
    raise ValueError(
        f"Unsupported provider: '{provider}'. "
        f"Supported providers: openai, anthropic, mistral, grok, google, perplexity"
    )
