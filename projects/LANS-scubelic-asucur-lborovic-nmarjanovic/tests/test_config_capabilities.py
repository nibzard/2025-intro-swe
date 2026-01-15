"""
Tests for config/capabilities.py - Model capabilities loading and validation.

Tests:
- Loading capabilities from YAML
- Pydantic validation
- Temperature support checking
- max_completion_tokens checking
- Error handling for missing/invalid files
"""

from pathlib import Path

import pytest
import yaml

from llm_answer_watcher.config.capabilities import (
    ModelCapabilities,
    ProviderCapabilities,
    TemperatureCapabilities,
    get_model_capabilities,
    load_capabilities_from_yaml,
)


class TestTemperatureCapabilitiesModel:
    """Test TemperatureCapabilities Pydantic model."""

    def test_default_empty_lists(self):
        """Test that default values are empty lists."""
        caps = TemperatureCapabilities()
        assert caps.unsupported_prefixes == []
        assert caps.unsupported_exact == []

    def test_with_prefixes(self):
        """Test with unsupported prefixes."""
        caps = TemperatureCapabilities(
            unsupported_prefixes=["o3-", "gpt-5"],
            unsupported_exact=["gpt-4-custom"],
        )
        assert caps.unsupported_prefixes == ["o3-", "gpt-5"]
        assert caps.unsupported_exact == ["gpt-4-custom"]


class TestProviderCapabilitiesModel:
    """Test ProviderCapabilities Pydantic model."""

    def test_default_values(self):
        """Test that default values are empty."""
        caps = ProviderCapabilities()
        assert caps.temperature.unsupported_prefixes == []
        assert caps.temperature.unsupported_exact == []
        assert caps.parameters.max_completion_tokens_models == []

    def test_with_temperature_config(self):
        """Test with temperature configuration."""
        caps = ProviderCapabilities(
            temperature=TemperatureCapabilities(unsupported_prefixes=["o3-"])
        )
        assert caps.temperature.unsupported_prefixes == ["o3-"]


class TestModelCapabilitiesModel:
    """Test ModelCapabilities Pydantic model."""

    def test_default_providers(self):
        """Test that all providers have default empty configs."""
        caps = ModelCapabilities()
        assert isinstance(caps.openai, ProviderCapabilities)
        assert isinstance(caps.anthropic, ProviderCapabilities)
        assert isinstance(caps.google, ProviderCapabilities)
        assert isinstance(caps.mistral, ProviderCapabilities)
        assert isinstance(caps.grok, ProviderCapabilities)
        assert isinstance(caps.perplexity, ProviderCapabilities)


class TestSupportsTemperature:
    """Test ModelCapabilities.supports_temperature method."""

    def test_supports_temperature_default(self):
        """Test that models support temperature by default."""
        caps = ModelCapabilities()
        # No restrictions configured, should support temperature
        assert caps.supports_temperature("openai", "gpt-4o")
        assert caps.supports_temperature("anthropic", "claude-3-5-sonnet")

    def test_supports_temperature_prefix_match(self):
        """Test prefix matching for unsupported models."""
        caps = ModelCapabilities(
            openai=ProviderCapabilities(
                temperature=TemperatureCapabilities(unsupported_prefixes=["o3-", "gpt-5"])
            )
        )

        # Prefix matches should not support temperature
        assert not caps.supports_temperature("openai", "o3-mini")
        assert not caps.supports_temperature("openai", "o3-mini-2025-01-01")
        assert not caps.supports_temperature("openai", "gpt-5-nano")
        assert not caps.supports_temperature("openai", "gpt-5")

        # Non-matching models should support temperature
        assert caps.supports_temperature("openai", "gpt-4o")
        assert caps.supports_temperature("openai", "gpt-4-turbo")

    def test_supports_temperature_exact_match(self):
        """Test exact matching for unsupported models."""
        caps = ModelCapabilities(
            openai=ProviderCapabilities(
                temperature=TemperatureCapabilities(
                    unsupported_exact=["gpt-4-custom", "my-special-model"]
                )
            )
        )

        # Exact matches should not support temperature
        assert not caps.supports_temperature("openai", "gpt-4-custom")
        assert not caps.supports_temperature("openai", "my-special-model")

        # Partial matches should support temperature
        assert caps.supports_temperature("openai", "gpt-4-custom-v2")
        assert caps.supports_temperature("openai", "gpt-4o")

    def test_supports_temperature_unknown_provider(self):
        """Test that unknown providers default to supporting temperature."""
        caps = ModelCapabilities()
        # Unknown provider should default to True with warning
        assert caps.supports_temperature("unknown_provider", "some-model")

    def test_supports_temperature_combined_rules(self):
        """Test prefix and exact rules working together."""
        caps = ModelCapabilities(
            openai=ProviderCapabilities(
                temperature=TemperatureCapabilities(
                    unsupported_prefixes=["o3-"],
                    unsupported_exact=["gpt-5-special"],
                )
            )
        )

        # Both prefix and exact matches should not support temperature
        assert not caps.supports_temperature("openai", "o3-mini")
        assert not caps.supports_temperature("openai", "gpt-5-special")

        # Other models should support temperature
        assert caps.supports_temperature("openai", "gpt-4o")


class TestUsesMaxCompletionTokens:
    """Test ModelCapabilities.uses_max_completion_tokens method."""

    def test_default_false(self):
        """Test that models don't use max_completion_tokens by default."""
        caps = ModelCapabilities()
        assert not caps.uses_max_completion_tokens("openai", "gpt-4o")

    def test_configured_models(self):
        """Test models configured to use max_completion_tokens."""
        caps = ModelCapabilities(
            openai=ProviderCapabilities(
                parameters={"max_completion_tokens_models": ["gpt-5", "gpt-5-nano"]}
            )
        )

        # Configured models should return True
        assert caps.uses_max_completion_tokens("openai", "gpt-5")
        assert caps.uses_max_completion_tokens("openai", "gpt-5-nano")

        # Other models should return False
        assert not caps.uses_max_completion_tokens("openai", "gpt-4o")

    def test_unknown_provider(self):
        """Test unknown provider returns False."""
        caps = ModelCapabilities()
        assert not caps.uses_max_completion_tokens("unknown", "some-model")


class TestLoadCapabilitiesFromYaml:
    """Test loading capabilities from YAML files."""

    def test_load_bundled_config(self):
        """Test loading the bundled model_capabilities.yaml."""
        # Get path to bundled config
        from llm_answer_watcher.config import capabilities

        config_path = Path(capabilities.__file__).parent / "model_capabilities.yaml"

        caps = load_capabilities_from_yaml(config_path)

        # Verify structure
        assert isinstance(caps, ModelCapabilities)
        assert isinstance(caps.openai, ProviderCapabilities)

        # Verify OpenAI temperature restrictions are loaded
        assert "o3-" in caps.openai.temperature.unsupported_prefixes
        assert "gpt-5" in caps.openai.temperature.unsupported_prefixes
        assert "gpt-4.1" in caps.openai.temperature.unsupported_prefixes

    def test_load_missing_file(self):
        """Test that missing file raises FileNotFoundError."""
        with pytest.raises(FileNotFoundError, match="Capabilities config not found"):
            load_capabilities_from_yaml(Path("/nonexistent/path.yaml"))

    def test_load_invalid_yaml(self, tmp_path):
        """Test that invalid YAML raises ValueError."""
        yaml_file = tmp_path / "invalid.yaml"
        yaml_file.write_text("invalid: yaml: content: [")

        with pytest.raises(ValueError, match="Invalid YAML"):
            load_capabilities_from_yaml(yaml_file)

    def test_load_empty_file(self, tmp_path):
        """Test that empty file raises ValueError."""
        yaml_file = tmp_path / "empty.yaml"
        yaml_file.write_text("")

        with pytest.raises(ValueError, match="empty"):
            load_capabilities_from_yaml(yaml_file)

    def test_load_minimal_valid_config(self, tmp_path):
        """Test loading minimal valid config."""
        yaml_file = tmp_path / "minimal.yaml"
        config = {
            "openai": {},
            "anthropic": {},
            "google": {},
            "mistral": {},
            "grok": {},
            "perplexity": {},
        }
        yaml_file.write_text(yaml.dump(config))

        caps = load_capabilities_from_yaml(yaml_file)
        assert isinstance(caps, ModelCapabilities)

    def test_load_custom_config(self, tmp_path):
        """Test loading custom config with specific rules."""
        yaml_file = tmp_path / "custom.yaml"
        config = {
            "openai": {
                "temperature": {
                    "unsupported_prefixes": ["custom-"],
                    "unsupported_exact": ["special-model"],
                },
                "parameters": {"max_completion_tokens_models": ["custom-model"]},
            },
            "anthropic": {},
            "google": {},
            "mistral": {},
            "grok": {},
            "perplexity": {},
        }
        yaml_file.write_text(yaml.dump(config))

        caps = load_capabilities_from_yaml(yaml_file)

        # Verify custom rules are loaded
        assert "custom-" in caps.openai.temperature.unsupported_prefixes
        assert "special-model" in caps.openai.temperature.unsupported_exact
        assert "custom-model" in caps.openai.parameters.max_completion_tokens_models


class TestGetModelCapabilities:
    """Test get_model_capabilities caching function."""

    def test_returns_model_capabilities(self):
        """Test that function returns ModelCapabilities instance."""
        caps = get_model_capabilities()
        assert isinstance(caps, ModelCapabilities)

    def test_caching(self):
        """Test that function caches results."""
        caps1 = get_model_capabilities()
        caps2 = get_model_capabilities()
        # Should be the same object (cached)
        assert caps1 is caps2

    def test_real_config_openai_rules(self):
        """Test that real config has expected OpenAI rules."""
        caps = get_model_capabilities()

        # Verify o3-mini doesn't support temperature
        assert not caps.supports_temperature("openai", "o3-mini")
        assert not caps.supports_temperature("openai", "o3-mini-2025-01-01")

        # Verify gpt-5 models don't support temperature
        assert not caps.supports_temperature("openai", "gpt-5")
        assert not caps.supports_temperature("openai", "gpt-5-nano")

        # Verify gpt-4.1 models don't support temperature
        assert not caps.supports_temperature("openai", "gpt-4.1-nano")

        # Verify gpt-4o supports temperature
        assert caps.supports_temperature("openai", "gpt-4o")
        assert caps.supports_temperature("openai", "gpt-4o-mini")
