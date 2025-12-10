"""
API runner adapter for wrapping LLMClient implementations.

This module provides an adapter that wraps existing LLMClient implementations
(OpenAI, Anthropic, Mistral, etc.) to conform to the IntentRunner protocol.
This enables seamless integration between legacy API-based clients and the
new plugin system.

Key components:
- APIRunner: Adapter wrapping LLMClient to provide IntentRunner interface
- APIRunnerPlugin: Plugin implementation for API-based runners

Architecture:
    The adapter pattern allows existing LLMClient code to work unchanged while
    providing the new IntentRunner interface for the plugin system. This maintains
    backward compatibility and avoids code duplication.

Example:
    >>> from llm_runner.models import build_client
    >>> from llm_runner.api_runner import APIRunner
    >>>
    >>> # Create LLMClient
    >>> client = build_client("openai", "gpt-4o-mini", api_key, system_prompt)
    >>>
    >>> # Wrap in APIRunner
    >>> runner = APIRunner(
    ...     client=client,
    ...     runner_name="openai-gpt-4o-mini",
    ...     provider="openai",
    ...     model_name="gpt-4o-mini"
    ... )
    >>>
    >>> # Use via IntentRunner interface
    >>> result = runner.run_intent("What are the best CRM tools?")
    >>> print(f"Cost: ${result.cost_usd:.4f}")
"""

import logging

from .intent_runner import IntentResult, IntentRunner
from .models import LLMClient, LLMResponse, build_client
from .plugin_registry import RunnerRegistry

logger = logging.getLogger(__name__)


class APIRunner:
    """
    Adapter wrapping LLMClient to provide IntentRunner interface.

    This adapter allows existing LLMClient implementations to work with the
    new plugin system without modification. It converts LLMResponse objects
    to IntentResult objects and adds runner metadata.

    Attributes:
        client: Underlying LLMClient implementation
        _runner_name: Human-readable runner identifier
        _provider: Provider name (e.g., "openai", "anthropic")
        _model_name: Model identifier (e.g., "gpt-4o-mini")

    Example:
        >>> from llm_runner.models import build_client
        >>>
        >>> client = build_client("openai", "gpt-4o-mini", api_key, system_prompt)
        >>> runner = APIRunner(
        ...     client=client,
        ...     runner_name="openai-gpt-4o-mini",
        ...     provider="openai",
        ...     model_name="gpt-4o-mini"
        ... )
        >>> result = runner.run_intent("What are the best CRM tools?")
        >>> assert result.runner_type == "api"
        >>> assert result.provider == "openai"
    """

    def __init__(
        self, client: LLMClient, runner_name: str, provider: str, model_name: str
    ):
        """
        Initialize API runner adapter.

        Args:
            client: LLMClient implementation (OpenAI, Anthropic, etc.)
            runner_name: Human-readable runner identifier
            provider: Provider name (e.g., "openai", "anthropic")
            model_name: Model identifier (e.g., "gpt-4o-mini")
        """
        self.client = client
        self._runner_name = runner_name
        self._provider = provider
        self._model_name = model_name

    def run_intent(self, prompt: str) -> IntentResult:
        """
        Execute intent via LLMClient and convert response to IntentResult.

        Args:
            prompt: User intent prompt to execute

        Returns:
            IntentResult: Structured result with answer and metadata

        Example:
            >>> result = runner.run_intent("What are the best email warmup tools?")
            >>> print(result.answer_text)
            >>> print(f"Cost: ${result.cost_usd:.4f}")
            >>> print(f"Tokens: {result.tokens_used}")
        """
        try:
            # Call underlying LLMClient
            response: LLMResponse = self.client.generate_answer(prompt)

            # Convert LLMResponse to IntentResult
            return IntentResult(
                answer_text=response.answer_text,
                runner_type="api",
                runner_name=self._runner_name,
                provider=self._provider,
                model_name=self._model_name,
                timestamp_utc=response.timestamp_utc,
                cost_usd=response.cost_usd,
                tokens_used=response.tokens_used,
                prompt_tokens=response.prompt_tokens,
                completion_tokens=response.completion_tokens,
                web_search_results=response.web_search_results,
                web_search_count=response.web_search_count,
                success=True,
            )

        except Exception as e:
            # Convert exception to failed IntentResult
            logger.error(
                f"API runner {self._runner_name} failed: {e}",
                exc_info=True,
            )

            # Get timestamp for error result
            from ..utils.time import utc_timestamp

            return IntentResult(
                answer_text="",
                runner_type="api",
                runner_name=self._runner_name,
                provider=self._provider,
                model_name=self._model_name,
                timestamp_utc=utc_timestamp(),
                cost_usd=0.0,
                success=False,
                error_message=str(e),
            )

    @property
    def runner_type(self) -> str:
        """Return runner type (always 'api' for this adapter)."""
        return "api"

    @property
    def runner_name(self) -> str:
        """Return human-readable runner identifier."""
        return self._runner_name


@RunnerRegistry.register
class APIRunnerPlugin:
    """
    Plugin implementation for API-based runners.

    This plugin creates APIRunner instances that wrap LLMClient implementations.
    It supports all existing API providers (openai, anthropic, mistral, grok,
    google, perplexity) through the build_client factory.

    Configuration:
        - provider: LLM provider name (openai, anthropic, etc.)
        - model_name: Model identifier (e.g., "gpt-4o-mini")
        - api_key: API key for authentication
        - system_prompt: System prompt text (optional)
        - tools: Optional list of tool configurations
        - tool_choice: Tool selection mode (default: "auto")

    Example:
        >>> config = {
        ...     "provider": "openai",
        ...     "model_name": "gpt-4o-mini",
        ...     "api_key": "sk-...",
        ...     "system_prompt": "You are a helpful assistant.",
        ...     "tools": [{"type": "web_search"}],
        ...     "tool_choice": "auto",
        ... }
        >>> runner = APIRunnerPlugin.create_runner(config)
        >>> result = runner.run_intent("What are the best CRM tools?")
    """

    @classmethod
    def plugin_name(cls) -> str:
        """Return plugin identifier."""
        return "api"

    @classmethod
    def runner_type(cls) -> str:
        """Return runner type (always 'api')."""
        return "api"

    @classmethod
    def create_runner(cls, config: dict) -> IntentRunner:
        """
        Create APIRunner from configuration.

        Args:
            config: Configuration dictionary with keys:
                - provider: LLM provider name
                - model_name: Model identifier
                - api_key: API key
                - system_prompt: System prompt (optional)
                - tools: Tool configurations (optional)
                - tool_choice: Tool selection mode (optional)

        Returns:
            IntentRunner: Configured APIRunner instance

        Raises:
            ValueError: If provider is unsupported
            KeyError: If required config keys are missing
        """
        provider = config["provider"]
        model_name = config["model_name"]
        api_key = config["api_key"]
        system_prompt = config.get("system_prompt", "")
        tools = config.get("tools")
        tool_choice = config.get("tool_choice", "auto")

        # Build LLMClient using existing factory
        client = build_client(
            provider=provider,
            model_name=model_name,
            api_key=api_key,
            system_prompt=system_prompt,
            tools=tools,
            tool_choice=tool_choice,
        )

        # Create runner name
        runner_name = f"{provider}-{model_name}"

        # Wrap client in APIRunner adapter
        return APIRunner(
            client=client,
            runner_name=runner_name,
            provider=provider,
            model_name=model_name,
        )

    @classmethod
    def validate_config(cls, config: dict) -> tuple[bool, str]:
        """
        Validate API runner configuration.

        Args:
            config: Configuration dictionary to validate

        Returns:
            tuple[bool, str]: (is_valid, error_message)
        """
        # Check required fields
        required_fields = ["provider", "model_name", "api_key"]
        for field in required_fields:
            if field not in config:
                return False, f"Missing required field: {field}"
            if not config[field] or (
                isinstance(config[field], str) and config[field].isspace()
            ):
                return False, f"Field cannot be empty: {field}"

        # Validate provider
        supported_providers = [
            "openai",
            "anthropic",
            "mistral",
            "grok",
            "google",
            "perplexity",
        ]
        if config["provider"] not in supported_providers:
            return False, (
                f"Unsupported provider: {config['provider']}. "
                f"Supported: {', '.join(supported_providers)}"
            )

        # Validate tool_choice if specified
        if "tool_choice" in config:
            allowed_choices = {"auto", "required", "none"}
            if config["tool_choice"] not in allowed_choices:
                return False, (
                    f"Invalid tool_choice: {config['tool_choice']}. "
                    f"Allowed: {', '.join(allowed_choices)}"
                )

        return True, ""

    @classmethod
    def required_env_vars(cls) -> list[str]:
        """
        Return required environment variables.

        Note: Actual env vars depend on provider, but we list common ones.
        """
        return [
            "OPENAI_API_KEY",
            "ANTHROPIC_API_KEY",
            "MISTRAL_API_KEY",
            "XAI_API_KEY",
            "GOOGLE_API_KEY",
            "PERPLEXITY_API_KEY",
        ]
