"""
ABOUTME: Model capabilities configuration loader for LLM Answer Watcher
ABOUTME: Loads and validates provider-specific model parameter support from YAML

This module provides access to model capabilities (parameter support, quirks, etc.)
for different LLM providers. Capabilities are loaded from YAML config and cached.

Key features:
- Pydantic validation of capabilities config
- Cached loading for performance
- Support for user overrides via ~/.llm-answer-watcher/
- Provider-agnostic API for checking model capabilities

Example:
    >>> caps = get_model_capabilities()
    >>> caps.supports_temperature("openai", "o3-mini")
    False
    >>> caps.supports_temperature("openai", "gpt-4o")
    True
"""

import logging
from functools import lru_cache
from pathlib import Path

import yaml
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class TemperatureCapabilities(BaseModel):
    """Temperature parameter support configuration."""

    unsupported_prefixes: list[str] = Field(
        default_factory=list,
        description="Model name prefixes that don't support custom temperature",
    )
    unsupported_exact: list[str] = Field(
        default_factory=list,
        description="Exact model names that don't support custom temperature",
    )


class ParameterCapabilities(BaseModel):
    """General parameter capabilities and quirks."""

    max_completion_tokens_models: list[str] = Field(
        default_factory=list,
        description="Models that use max_completion_tokens instead of max_tokens",
    )


class ProviderCapabilities(BaseModel):
    """Capabilities for a single provider."""

    temperature: TemperatureCapabilities = Field(
        default_factory=TemperatureCapabilities,
        description="Temperature parameter support",
    )
    parameters: ParameterCapabilities = Field(
        default_factory=ParameterCapabilities,
        description="General parameter capabilities",
    )


class ModelCapabilities(BaseModel):
    """
    Model capabilities configuration for all providers.

    Loaded from model_capabilities.yaml with support for user overrides.
    Provides methods to check if a model supports specific parameters.

    Attributes:
        openai: OpenAI provider capabilities
        anthropic: Anthropic provider capabilities
        google: Google provider capabilities
        mistral: Mistral provider capabilities
        grok: Grok provider capabilities
        perplexity: Perplexity provider capabilities
    """

    openai: ProviderCapabilities = Field(
        default_factory=ProviderCapabilities,
        description="OpenAI model capabilities",
    )
    anthropic: ProviderCapabilities = Field(
        default_factory=ProviderCapabilities,
        description="Anthropic model capabilities",
    )
    google: ProviderCapabilities = Field(
        default_factory=ProviderCapabilities,
        description="Google model capabilities",
    )
    mistral: ProviderCapabilities = Field(
        default_factory=ProviderCapabilities,
        description="Mistral model capabilities",
    )
    grok: ProviderCapabilities = Field(
        default_factory=ProviderCapabilities,
        description="Grok model capabilities",
    )
    perplexity: ProviderCapabilities = Field(
        default_factory=ProviderCapabilities,
        description="Perplexity model capabilities",
    )

    def supports_temperature(self, provider: str, model_name: str) -> bool:
        """
        Check if a model supports custom temperature parameter.

        Args:
            provider: Provider name (e.g., "openai", "anthropic")
            model_name: Model identifier (e.g., "gpt-4o", "o3-mini")

        Returns:
            bool: True if model supports custom temperature, False otherwise

        Example:
            >>> caps = ModelCapabilities(...)
            >>> caps.supports_temperature("openai", "o3-mini")
            False
            >>> caps.supports_temperature("openai", "gpt-4o")
            True
        """
        # Get provider capabilities (default to empty if provider not found)
        provider_caps = getattr(self, provider, None)
        if not provider_caps:
            logger.warning(
                f"Unknown provider '{provider}', assuming temperature is supported"
            )
            return True

        temp_caps = provider_caps.temperature

        # Check exact match first
        if model_name in temp_caps.unsupported_exact:
            logger.debug(
                f"Model {provider}/{model_name} doesn't support temperature (exact match)"
            )
            return False

        # Check prefix match
        for prefix in temp_caps.unsupported_prefixes:
            if model_name.startswith(prefix):
                logger.debug(
                    f"Model {provider}/{model_name} doesn't support temperature "
                    f"(prefix match: {prefix})"
                )
                return False

        # No match found, model supports temperature
        return True

    def uses_max_completion_tokens(self, provider: str, model_name: str) -> bool:
        """
        Check if a model uses max_completion_tokens instead of max_tokens.

        Args:
            provider: Provider name (e.g., "openai")
            model_name: Model identifier (e.g., "gpt-5-nano")

        Returns:
            bool: True if model uses max_completion_tokens, False otherwise

        Example:
            >>> caps = ModelCapabilities(...)
            >>> caps.uses_max_completion_tokens("openai", "gpt-5-nano")
            True
            >>> caps.uses_max_completion_tokens("openai", "gpt-4o")
            False
        """
        provider_caps = getattr(self, provider, None)
        if not provider_caps:
            return False

        return model_name in provider_caps.parameters.max_completion_tokens_models


def load_capabilities_from_yaml(yaml_path: Path) -> ModelCapabilities:
    """
    Load model capabilities from YAML file.

    Args:
        yaml_path: Path to model_capabilities.yaml

    Returns:
        ModelCapabilities: Validated capabilities config

    Raises:
        FileNotFoundError: If YAML file doesn't exist
        ValueError: If YAML is invalid or validation fails
    """
    if not yaml_path.exists():
        raise FileNotFoundError(f"Capabilities config not found: {yaml_path}")

    logger.debug(f"Loading model capabilities from: {yaml_path}")

    try:
        with open(yaml_path) as f:
            data = yaml.safe_load(f)

        if not data:
            raise ValueError("Capabilities config is empty")

        # Validate with Pydantic
        capabilities = ModelCapabilities(**data)
        logger.info(f"Loaded model capabilities from {yaml_path}")
        return capabilities

    except yaml.YAMLError as e:
        raise ValueError(f"Invalid YAML in capabilities config: {e}") from e
    except Exception as e:
        raise ValueError(f"Failed to load capabilities config: {e}") from e


@lru_cache(maxsize=1)
def get_model_capabilities() -> ModelCapabilities:
    """
    Get cached model capabilities config.

    Loads from package's model_capabilities.yaml and caches for performance.
    Future enhancement: Support user overrides from ~/.llm-answer-watcher/

    Returns:
        ModelCapabilities: Cached capabilities config

    Raises:
        ValueError: If config file is missing or invalid

    Example:
        >>> caps = get_model_capabilities()
        >>> if caps.supports_temperature("openai", model_name):
        ...     payload["temperature"] = 0.7
    """
    # Get path to bundled capabilities file
    config_dir = Path(__file__).parent
    capabilities_path = config_dir / "model_capabilities.yaml"

    # TODO: Support user overrides from ~/.llm-answer-watcher/model_capabilities.yaml
    # user_override = Path.home() / ".llm-answer-watcher" / "model_capabilities.yaml"
    # if user_override.exists():
    #     return load_capabilities_from_yaml(user_override)

    return load_capabilities_from_yaml(capabilities_path)
