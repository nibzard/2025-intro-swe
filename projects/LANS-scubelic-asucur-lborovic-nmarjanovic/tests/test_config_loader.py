"""
Tests for config.loader and config.schema modules.

This module tests configuration loading, validation, and API key resolution:
- YAML loading and parsing
- Pydantic schema validation (all validators)
- Environment variable resolution for API keys
- Error handling for missing files, invalid YAML, and missing env vars
- Edge cases (empty files, whitespace-only values, duplicate IDs)

Coverage target: 80%+ for both loader.py and schema.py
"""

from pathlib import Path

import pytest
import yaml
from pydantic import ValidationError

from llm_answer_watcher.config.loader import load_config, resolve_api_keys
from llm_answer_watcher.config.schema import (
    Brands,
    Intent,
    ModelConfig,
    RunSettings,
    RuntimeConfig,
    RuntimeModel,
    WatcherConfig,
)

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def valid_config_dict():
    """Return a valid configuration dictionary for testing."""
    return {
        "run_settings": {
            "output_dir": "./output",
            "sqlite_db_path": "./output/watcher.db",
            "models": [
                {
                    "provider": "openai",
                    "model_name": "gpt-4o-mini",
                    "env_api_key": "OPENAI_API_KEY",
                }
            ],
            "use_llm_rank_extraction": False,
        },
        "brands": {
            "mine": ["MyBrand", "MyProduct"],
            "competitors": ["Competitor1", "Competitor2"],
        },
        "intents": [
            {
                "id": "test-intent-1",
                "prompt": "What are the best email warmup tools?",
            },
            {
                "id": "test-intent-2",
                "prompt": "Compare email warmup solutions",
            },
        ],
    }


@pytest.fixture
def valid_config_yaml(tmp_path, valid_config_dict):
    """Create a valid YAML config file and return its path."""
    config_file = tmp_path / "watcher.config.yaml"
    with config_file.open("w", encoding="utf-8") as f:
        yaml.dump(valid_config_dict, f)
    return config_file


@pytest.fixture
def mock_env_vars(monkeypatch):
    """Set up mock environment variables for API keys."""
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key-12345")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test-key-67890")


# ============================================================================
# Schema Validation Tests
# ============================================================================


class TestModelConfig:
    """Test ModelConfig Pydantic model."""

    def test_valid_model_config(self):
        """ModelConfig should accept valid input."""
        model = ModelConfig(
            provider="openai",
            model_name="gpt-4o-mini",
            env_api_key="OPENAI_API_KEY",
        )
        assert model.provider == "openai"
        assert model.model_name == "gpt-4o-mini"
        assert model.env_api_key == "OPENAI_API_KEY"

    def test_rejects_empty_model_name(self):
        """ModelConfig should reject empty model_name."""
        with pytest.raises(ValidationError) as exc_info:
            ModelConfig(
                provider="openai",
                model_name="",
                env_api_key="OPENAI_API_KEY",
            )
        assert "model_name cannot be empty" in str(exc_info.value)

    def test_rejects_whitespace_model_name(self):
        """ModelConfig should reject whitespace-only model_name."""
        with pytest.raises(ValidationError) as exc_info:
            ModelConfig(
                provider="openai",
                model_name="   ",
                env_api_key="OPENAI_API_KEY",
            )
        assert "model_name cannot be empty" in str(exc_info.value)

    def test_rejects_empty_env_api_key(self):
        """ModelConfig should reject empty env_api_key."""
        with pytest.raises(ValidationError) as exc_info:
            ModelConfig(
                provider="openai",
                model_name="gpt-4o-mini",
                env_api_key="",
            )
        assert "env_api_key cannot be empty" in str(exc_info.value)

    def test_rejects_invalid_provider(self):
        """ModelConfig should reject provider not in Literal list."""
        with pytest.raises(ValidationError) as exc_info:
            ModelConfig(
                provider="invalid_provider",
                model_name="gpt-4o-mini",
                env_api_key="OPENAI_API_KEY",
            )
        assert "provider" in str(exc_info.value).lower()


class TestRunSettings:
    """Test RunSettings Pydantic model."""

    def test_valid_run_settings(self):
        """RunSettings should accept valid input."""
        settings = RunSettings(
            output_dir="./output",
            sqlite_db_path="./output/watcher.db",
            models=[
                ModelConfig(
                    provider="openai",
                    model_name="gpt-4o-mini",
                    env_api_key="OPENAI_API_KEY",
                )
            ],
            use_llm_rank_extraction=False,
        )
        assert settings.output_dir == "./output"
        assert len(settings.models) == 1
        assert settings.use_llm_rank_extraction is False

    def test_default_use_llm_rank_extraction(self):
        """RunSettings should default use_llm_rank_extraction to False."""
        settings = RunSettings(
            output_dir="./output",
            sqlite_db_path="./output/watcher.db",
            models=[
                ModelConfig(
                    provider="openai",
                    model_name="gpt-4o-mini",
                    env_api_key="OPENAI_API_KEY",
                )
            ],
        )
        assert settings.use_llm_rank_extraction is False

    def test_rejects_empty_output_dir(self):
        """RunSettings should reject empty output_dir."""
        with pytest.raises(ValidationError) as exc_info:
            RunSettings(
                output_dir="",
                sqlite_db_path="./output/watcher.db",
                models=[
                    ModelConfig(
                        provider="openai",
                        model_name="gpt-4o-mini",
                        env_api_key="OPENAI_API_KEY",
                    )
                ],
            )
        assert "output_dir cannot be empty" in str(exc_info.value)

    def test_rejects_empty_sqlite_db_path(self):
        """RunSettings should reject empty sqlite_db_path."""
        with pytest.raises(ValidationError) as exc_info:
            RunSettings(
                output_dir="./output",
                sqlite_db_path="",
                models=[
                    ModelConfig(
                        provider="openai",
                        model_name="gpt-4o-mini",
                        env_api_key="OPENAI_API_KEY",
                    )
                ],
            )
        assert "sqlite_db_path cannot be empty" in str(exc_info.value)

    def test_allows_empty_models_list(self):
        """RunSettings should allow empty models list (can use operation_models instead)."""
        # Empty models is valid - operation_models can be used instead
        settings = RunSettings(
            output_dir="./output",
            sqlite_db_path="./output/watcher.db",
            models=[],
            operation_models=[],  # Also empty is fine - validation happens at WatcherConfig level
        )
        assert settings.models == []
        assert settings.operation_models == []


class TestBrands:
    """Test Brands Pydantic model."""

    def test_valid_brands(self):
        """Brands should accept valid input."""
        brands = Brands(
            mine=["MyBrand", "MyProduct"],
            competitors=["Competitor1", "Competitor2"],
        )
        assert len(brands.mine) == 2
        assert len(brands.competitors) == 2

    def test_default_empty_competitors(self):
        """Brands should default competitors to empty list."""
        brands = Brands(mine=["MyBrand"])
        assert brands.competitors == []

    def test_rejects_empty_mine_list(self):
        """Brands should reject empty mine list."""
        with pytest.raises(ValidationError) as exc_info:
            Brands(mine=[], competitors=["Competitor1"])
        assert "At least one brand alias required in 'mine'" in str(exc_info.value)

    def test_cleans_whitespace_from_mine(self):
        """Brands should strip whitespace from mine aliases."""
        brands = Brands(mine=["  MyBrand  ", "MyProduct"], competitors=[])
        assert brands.mine == ["MyBrand", "MyProduct"]

    def test_removes_empty_entries_from_mine(self):
        """Brands should remove empty/whitespace-only entries from mine."""
        brands = Brands(mine=["MyBrand", "", "  ", "MyProduct"], competitors=[])
        assert brands.mine == ["MyBrand", "MyProduct"]

    def test_raises_if_all_mine_entries_empty(self):
        """Brands should raise if all mine entries are empty/whitespace."""
        with pytest.raises(ValidationError) as exc_info:
            Brands(mine=["", "  ", "   "], competitors=[])
        assert "At least one brand alias required in 'mine'" in str(exc_info.value)

    def test_cleans_competitors_list(self):
        """Brands should clean competitors list (remove empty, strip whitespace)."""
        brands = Brands(
            mine=["MyBrand"],
            competitors=["  Comp1  ", "", "Comp2", "  "],
        )
        assert brands.competitors == ["Comp1", "Comp2"]


class TestIntent:
    """Test Intent Pydantic model."""

    def test_valid_intent(self):
        """Intent should accept valid input."""
        intent = Intent(
            id="email-warmup",
            prompt="What are the best email warmup tools?",
        )
        assert intent.id == "email-warmup"
        assert "warmup" in intent.prompt

    def test_rejects_empty_id(self):
        """Intent should reject empty ID."""
        with pytest.raises(ValidationError) as exc_info:
            Intent(id="", prompt="Test prompt")
        assert "Intent ID cannot be empty" in str(exc_info.value)

    def test_rejects_whitespace_id(self):
        """Intent should reject whitespace-only ID."""
        with pytest.raises(ValidationError) as exc_info:
            Intent(id="   ", prompt="Test prompt")
        assert "Intent ID cannot be empty" in str(exc_info.value)

    def test_rejects_invalid_slug_characters(self):
        """Intent should reject IDs with invalid characters."""
        with pytest.raises(ValidationError) as exc_info:
            Intent(id="invalid id!", prompt="Test prompt")
        assert "alphanumeric with hyphens/underscores" in str(exc_info.value)

    def test_accepts_valid_slug_formats(self):
        """Intent should accept valid slug formats."""
        valid_ids = ["simple", "with-hyphens", "with_underscores", "MixedCase123"]
        for valid_id in valid_ids:
            intent = Intent(id=valid_id, prompt="Test prompt")
            assert intent.id == valid_id

    def test_rejects_empty_prompt(self):
        """Intent should reject empty prompt."""
        with pytest.raises(ValidationError) as exc_info:
            Intent(id="test-id", prompt="")
        assert "Intent prompt cannot be empty" in str(exc_info.value)

    def test_rejects_prompt_over_max_length(self):
        """Intent should reject prompts exceeding MAX_PROMPT_LENGTH."""
        from llm_answer_watcher.llm_runner.openai_client import MAX_PROMPT_LENGTH

        with pytest.raises(ValidationError, match=r"Prompt exceeds maximum length"):
            Intent(id="test", prompt="a" * (MAX_PROMPT_LENGTH + 1))

    def test_accepts_prompt_at_max_length(self):
        """Intent should accept prompts exactly at MAX_PROMPT_LENGTH."""
        from llm_answer_watcher.llm_runner.openai_client import MAX_PROMPT_LENGTH

        intent = Intent(id="test", prompt="a" * MAX_PROMPT_LENGTH)
        assert len(intent.prompt) == MAX_PROMPT_LENGTH

    def test_prompt_length_error_shows_counts(self):
        """Intent validation error should show actual and max character counts."""
        from llm_answer_watcher.llm_runner.openai_client import MAX_PROMPT_LENGTH

        with pytest.raises(ValidationError) as exc_info:
            Intent(id="test", prompt="a" * (MAX_PROMPT_LENGTH + 10000))

        error_msg = str(exc_info.value)
        assert "110,000" in error_msg
        assert "100,000" in error_msg


class TestWatcherConfig:
    """Test WatcherConfig root model."""

    def test_valid_watcher_config(self, valid_config_dict):
        """WatcherConfig should accept valid configuration."""
        config = WatcherConfig.model_validate(valid_config_dict)
        assert len(config.intents) == 2
        assert len(config.run_settings.models) == 1
        assert len(config.brands.mine) == 2

    def test_rejects_empty_intents_list(self, valid_config_dict):
        """WatcherConfig should reject empty intents list."""
        valid_config_dict["intents"] = []
        with pytest.raises(ValidationError) as exc_info:
            WatcherConfig.model_validate(valid_config_dict)
        assert "At least one intent must be configured" in str(exc_info.value)

    def test_rejects_duplicate_intent_ids(self, valid_config_dict):
        """WatcherConfig should reject duplicate intent IDs."""
        valid_config_dict["intents"] = [
            {"id": "duplicate", "prompt": "Prompt 1"},
            {"id": "duplicate", "prompt": "Prompt 2"},
        ]
        with pytest.raises(ValidationError) as exc_info:
            WatcherConfig.model_validate(valid_config_dict)
        assert "Duplicate intent IDs found" in str(exc_info.value)
        assert "duplicate" in str(exc_info.value)


class TestRuntimeModel:
    """Test RuntimeModel Pydantic model."""

    def test_valid_runtime_model(self):
        """RuntimeModel should accept valid input with API key and system prompt."""
        model = RuntimeModel(
            provider="openai",
            model_name="gpt-4o-mini",
            api_key="sk-test-key-12345",
            system_prompt="You are a helpful assistant.",
        )
        assert model.provider == "openai"
        assert model.api_key == "sk-test-key-12345"
        assert model.system_prompt == "You are a helpful assistant."

    def test_rejects_empty_api_key(self):
        """RuntimeModel should reject empty API key."""
        with pytest.raises(ValidationError) as exc_info:
            RuntimeModel(
                provider="openai",
                model_name="gpt-4o-mini",
                api_key="",
                system_prompt="You are a helpful assistant.",
            )
        assert "API key cannot be empty" in str(exc_info.value)


# ============================================================================
# Loader Tests
# ============================================================================


class TestLoadConfig:
    """Test load_config() function."""

    def test_loads_valid_config_file(self, valid_config_yaml, mock_env_vars):
        """load_config() should successfully load valid YAML file."""
        config = load_config(valid_config_yaml)
        assert isinstance(config, RuntimeConfig)
        assert len(config.intents) == 2
        assert len(config.models) == 1
        assert config.models[0].api_key == "sk-test-key-12345"

    def test_raises_filenotfounderror_for_missing_file(self):
        """load_config() should raise FileNotFoundError for missing file."""
        with pytest.raises(FileNotFoundError) as exc_info:
            load_config("/nonexistent/path/config.yaml")
        assert "Configuration file not found" in str(exc_info.value)

    def test_raises_on_empty_yaml_file(self, tmp_path):
        """load_config() should raise ValueError for empty YAML file."""
        empty_file = tmp_path / "empty.yaml"
        empty_file.write_text("", encoding="utf-8")

        with pytest.raises(ValueError) as exc_info:
            load_config(empty_file)
        assert "Configuration file is empty" in str(exc_info.value)

    def test_raises_on_invalid_yaml_syntax(self, tmp_path):
        """load_config() should raise ValueError for malformed YAML."""
        bad_yaml = tmp_path / "bad.yaml"
        bad_yaml.write_text("invalid: yaml: syntax: [", encoding="utf-8")

        with pytest.raises(ValueError) as exc_info:
            load_config(bad_yaml)
        assert "Invalid YAML syntax" in str(exc_info.value)

    def test_raises_on_validation_error(self, tmp_path, mock_env_vars):
        """load_config() should raise ValueError for validation errors."""
        invalid_config = {
            "run_settings": {
                "output_dir": "",  # Invalid: empty
                "sqlite_db_path": "./db.db",
                "models": [
                    {
                        "provider": "openai",
                        "model_name": "gpt-4o-mini",
                        "env_api_key": "OPENAI_API_KEY",
                    }
                ],
            },
            "brands": {"mine": ["MyBrand"]},
            "intents": [{"id": "test", "prompt": "Test?"}],
        }

        config_file = tmp_path / "invalid.yaml"
        with config_file.open("w", encoding="utf-8") as f:
            yaml.dump(invalid_config, f)

        with pytest.raises(ValueError) as exc_info:
            load_config(config_file)
        assert "Configuration validation failed" in str(exc_info.value)
        assert "output_dir cannot be empty" in str(exc_info.value)

    def test_raises_on_missing_env_var(self, valid_config_yaml, monkeypatch):
        """load_config() should raise ValueError if API key env var missing."""
        # Don't set OPENAI_API_KEY in environment
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)

        with pytest.raises(ValueError) as exc_info:
            load_config(valid_config_yaml)
        assert "Failed to resolve API keys" in str(exc_info.value)
        assert "OPENAI_API_KEY" in str(exc_info.value)

    def test_accepts_path_object(self, valid_config_yaml, mock_env_vars):
        """load_config() should accept Path objects."""
        config = load_config(Path(valid_config_yaml))
        assert isinstance(config, RuntimeConfig)

    def test_accepts_string_path(self, valid_config_yaml, mock_env_vars):
        """load_config() should accept string paths."""
        config = load_config(str(valid_config_yaml))
        assert isinstance(config, RuntimeConfig)


class TestResolveApiKeys:
    """Test resolve_api_keys() function."""

    def test_resolves_single_api_key(self, valid_config_dict, mock_env_vars):
        """resolve_api_keys() should resolve single API key from environment."""
        watcher_config = WatcherConfig.model_validate(valid_config_dict)
        models = resolve_api_keys(watcher_config)

        assert len(models) == 1
        assert models[0].api_key == "sk-test-key-12345"
        assert models[0].provider == "openai"

    def test_resolves_multiple_api_keys(self, valid_config_dict, mock_env_vars):
        """resolve_api_keys() should resolve multiple API keys."""
        valid_config_dict["run_settings"]["models"].append(
            {
                "provider": "anthropic",
                "model_name": "claude-3-5-sonnet-20241022",
                "env_api_key": "ANTHROPIC_API_KEY",
            }
        )

        watcher_config = WatcherConfig.model_validate(valid_config_dict)
        models = resolve_api_keys(watcher_config)

        assert len(models) == 2
        assert models[0].api_key == "sk-test-key-12345"
        assert models[1].api_key == "sk-ant-test-key-67890"

    def test_raises_on_missing_env_var(self, valid_config_dict, monkeypatch):
        """resolve_api_keys() should raise ValueError for missing env var."""
        # Don't set OPENAI_API_KEY
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)

        watcher_config = WatcherConfig.model_validate(valid_config_dict)
        with pytest.raises(ValueError) as exc_info:
            resolve_api_keys(watcher_config)

        assert "OPENAI_API_KEY" in str(exc_info.value)
        assert "not set" in str(exc_info.value)

    def test_raises_on_empty_env_var(self, valid_config_dict, monkeypatch):
        """resolve_api_keys() should raise ValueError for empty env var."""
        monkeypatch.setenv("OPENAI_API_KEY", "")

        watcher_config = WatcherConfig.model_validate(valid_config_dict)
        with pytest.raises(ValueError) as exc_info:
            resolve_api_keys(watcher_config)

        assert "OPENAI_API_KEY" in str(exc_info.value)
        assert "not set" in str(exc_info.value)

    def test_raises_on_whitespace_env_var(self, valid_config_dict, monkeypatch):
        """resolve_api_keys() should raise ValueError for whitespace-only env var."""
        monkeypatch.setenv("OPENAI_API_KEY", "   ")

        watcher_config = WatcherConfig.model_validate(valid_config_dict)
        with pytest.raises(ValueError) as exc_info:
            resolve_api_keys(watcher_config)

        assert "OPENAI_API_KEY" in str(exc_info.value)
        assert "empty or whitespace" in str(exc_info.value)


# ============================================================================
# Integration Tests
# ============================================================================


class TestIntegration:
    """Integration tests for config loading end-to-end."""

    def test_complete_config_loading_workflow(self, tmp_path, monkeypatch):
        """Test complete workflow from YAML to RuntimeConfig."""
        # Set up environment
        monkeypatch.setenv("OPENAI_API_KEY", "sk-real-key")

        # Create config file
        config_data = {
            "run_settings": {
                "output_dir": "./output",
                "sqlite_db_path": "./output/watcher.db",
                "models": [
                    {
                        "provider": "openai",
                        "model_name": "gpt-4o-mini",
                        "env_api_key": "OPENAI_API_KEY",
                    }
                ],
                "use_llm_rank_extraction": True,
            },
            "brands": {
                "mine": ["MyBrand", "MyProduct", "My Service"],
                "competitors": ["Competitor A", "Competitor B"],
            },
            "intents": [
                {
                    "id": "email-warmup",
                    "prompt": "What are the best email warmup tools?",
                },
                {
                    "id": "cold-email",
                    "prompt": "Top cold email software for 2025?",
                },
                {
                    "id": "email-deliverability",
                    "prompt": "How to improve email deliverability?",
                },
            ],
        }

        config_file = tmp_path / "test.yaml"
        with config_file.open("w", encoding="utf-8") as f:
            yaml.dump(config_data, f)

        # Load config
        config = load_config(config_file)

        # Verify all components
        assert len(config.intents) == 3
        assert config.intents[0].id == "email-warmup"
        assert len(config.brands.mine) == 3
        assert len(config.brands.competitors) == 2
        assert len(config.models) == 1
        assert config.models[0].api_key == "sk-real-key"
        assert config.run_settings.use_llm_rank_extraction is True
        assert config.run_settings.output_dir == "./output"

    def test_multi_model_config(self, tmp_path, monkeypatch):
        """Test configuration with multiple models."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-openai-key")
        monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-key")

        config_data = {
            "run_settings": {
                "output_dir": "./output",
                "sqlite_db_path": "./output/watcher.db",
                "models": [
                    {
                        "provider": "openai",
                        "model_name": "gpt-4o-mini",
                        "env_api_key": "OPENAI_API_KEY",
                    },
                    {
                        "provider": "anthropic",
                        "model_name": "claude-3-5-sonnet-20241022",
                        "env_api_key": "ANTHROPIC_API_KEY",
                    },
                ],
            },
            "brands": {"mine": ["MyBrand"]},
            "intents": [{"id": "test", "prompt": "Test?"}],
        }

        config_file = tmp_path / "multi.yaml"
        with config_file.open("w", encoding="utf-8") as f:
            yaml.dump(config_data, f)

        config = load_config(config_file)

        assert len(config.models) == 2
        assert config.models[0].provider == "openai"
        assert config.models[0].api_key == "sk-openai-key"
        assert config.models[1].provider == "anthropic"
        assert config.models[1].api_key == "sk-ant-key"
