"""Tests for system_prompts.prompt_loader module."""

import json
from pathlib import Path

import pytest

from llm_answer_watcher.system_prompts import (
    PromptNotFoundError,
    SystemPrompt,
    get_provider_default,
    load_prompt,
)
from llm_answer_watcher.system_prompts.prompt_loader import (
    _get_package_prompts_dir,
    _get_user_prompts_dir,
    _resolve_prompt_path,
)


class TestSystemPrompt:
    """Tests for SystemPrompt Pydantic model."""

    def test_valid_prompt(self):
        """Test creating a valid SystemPrompt."""
        prompt = SystemPrompt(
            name="test-prompt",
            description="Test prompt description",
            provider="openai",
            prompt="You are a helpful assistant.",
        )
        assert prompt.name == "test-prompt"
        assert prompt.provider == "openai"
        assert prompt.prompt == "You are a helpful assistant."

    def test_valid_prompt_with_metadata(self):
        """Test creating a SystemPrompt with optional metadata."""
        prompt = SystemPrompt(
            name="test-prompt",
            description="Test prompt",
            provider="openai",
            prompt="Test prompt text",
            compatible_models=["gpt-4", "gpt-4-turbo"],
            metadata={"version": "1.0", "author": "test"},
        )
        assert prompt.compatible_models == ["gpt-4", "gpt-4-turbo"]
        assert prompt.metadata == {"version": "1.0", "author": "test"}

    def test_empty_name_raises_error(self):
        """Test that empty name raises validation error."""
        with pytest.raises(ValueError, match="Prompt name cannot be empty"):
            SystemPrompt(
                name="",
                description="Test",
                provider="openai",
                prompt="Test prompt",
            )

    def test_whitespace_name_raises_error(self):
        """Test that whitespace-only name raises validation error."""
        with pytest.raises(ValueError, match="Prompt name cannot be empty"):
            SystemPrompt(
                name="   ",
                description="Test",
                provider="openai",
                prompt="Test prompt",
            )

    def test_empty_provider_raises_error(self):
        """Test that empty provider raises validation error."""
        with pytest.raises(ValueError, match="Provider cannot be empty"):
            SystemPrompt(
                name="test",
                description="Test",
                provider="",
                prompt="Test prompt",
            )

    def test_empty_prompt_raises_error(self):
        """Test that empty prompt text raises validation error."""
        with pytest.raises(ValueError, match="System prompt text cannot be empty"):
            SystemPrompt(
                name="test",
                description="Test",
                provider="openai",
                prompt="",
            )


class TestGetPackagePromptsDir:
    """Tests for _get_package_prompts_dir function."""

    def test_returns_valid_path(self):
        """Test that package prompts dir is returned."""
        prompts_dir = _get_package_prompts_dir()
        assert isinstance(prompts_dir, Path)
        assert prompts_dir.exists()
        assert prompts_dir.is_dir()
        assert prompts_dir.name == "system_prompts"


class TestGetUserPromptsDir:
    """Tests for _get_user_prompts_dir function."""

    def test_returns_config_path(self):
        """Test that user prompts dir path is returned."""
        user_dir = _get_user_prompts_dir()
        assert isinstance(user_dir, Path)
        assert ".config" in str(user_dir)
        assert "llm-answer-watcher" in str(user_dir)
        assert user_dir.name == "system_prompts"


class TestResolvePromptPath:
    """Tests for _resolve_prompt_path function."""

    def test_resolves_package_prompt(self):
        """Test resolving a package-bundled prompt."""
        path = _resolve_prompt_path("openai/default")
        assert path.exists()
        assert path.name == "default.json"
        assert path.parent.name == "openai"

    def test_adds_json_extension(self):
        """Test that .json extension is added automatically."""
        path = _resolve_prompt_path("openai/default")
        assert path.suffix == ".json"

    def test_preserves_json_extension(self):
        """Test that existing .json extension is preserved."""
        path = _resolve_prompt_path("openai/default.json")
        assert path.suffix == ".json"
        assert "default.json.json" not in str(path)

    def test_nonexistent_prompt_raises_error(self):
        """Test that nonexistent prompt raises PromptNotFoundError."""
        with pytest.raises(
            PromptNotFoundError,
            match="System prompt not found: nonexistent/prompt",
        ):
            _resolve_prompt_path("nonexistent/prompt")

    def test_user_override_takes_precedence(self, tmp_path, monkeypatch):
        """Test that user prompts override package prompts."""
        # Create a temporary user prompts directory
        user_prompts_dir = tmp_path / "user_prompts"
        user_prompts_dir.mkdir()
        (user_prompts_dir / "openai").mkdir()

        # Create a user override prompt
        user_prompt_path = user_prompts_dir / "openai" / "test.json"
        user_prompt_path.write_text('{"name": "user-override"}')

        # Mock _get_user_prompts_dir to return our temp directory
        monkeypatch.setattr(
            "llm_answer_watcher.system_prompts.prompt_loader._get_user_prompts_dir",
            lambda: user_prompts_dir,
        )

        # Resolve should return user path
        resolved = _resolve_prompt_path("openai/test")
        assert resolved == user_prompt_path


class TestLoadPrompt:
    """Tests for load_prompt function."""

    def test_load_openai_default(self):
        """Test loading the OpenAI default prompt."""
        prompt = load_prompt("openai/default")
        assert isinstance(prompt, SystemPrompt)
        assert prompt.provider == "openai"
        assert prompt.name == "openai-default"
        assert "unbiased market analyst" in prompt.prompt.lower()

    def test_load_anthropic_default(self):
        """Test loading the Anthropic default prompt."""
        prompt = load_prompt("anthropic/default")
        assert isinstance(prompt, SystemPrompt)
        assert prompt.provider == "anthropic"
        assert prompt.name == "anthropic-default"

    def test_load_gpt4_prompt(self):
        """Test loading the GPT-4 specific prompt."""
        prompt = load_prompt("openai/gpt-4-default")
        assert isinstance(prompt, SystemPrompt)
        assert prompt.provider == "openai"
        assert prompt.name == "gpt-4-default"
        assert "ChatGPT" in prompt.prompt

    def test_load_gpt5_prompt(self):
        """Test loading the GPT-5 specific prompt."""
        prompt = load_prompt("openai/gpt-5-default")
        assert isinstance(prompt, SystemPrompt)
        assert prompt.provider == "openai"
        assert prompt.name == "gpt-5-default"
        assert "GPT-5" in prompt.prompt

    def test_load_with_json_extension(self):
        """Test loading with explicit .json extension."""
        prompt = load_prompt("openai/default.json")
        assert isinstance(prompt, SystemPrompt)
        assert prompt.name == "openai-default"

    def test_nonexistent_prompt_raises_error(self):
        """Test that loading nonexistent prompt raises error."""
        with pytest.raises(PromptNotFoundError):
            load_prompt("nonexistent/prompt")

    def test_invalid_json_raises_error(self, tmp_path, monkeypatch):
        """Test that invalid JSON raises ValueError."""
        # Create a prompt with invalid JSON
        user_prompts_dir = tmp_path / "user_prompts"
        user_prompts_dir.mkdir()
        (user_prompts_dir / "openai").mkdir()

        invalid_prompt = user_prompts_dir / "openai" / "invalid.json"
        invalid_prompt.write_text("not valid json {")

        monkeypatch.setattr(
            "llm_answer_watcher.system_prompts.prompt_loader._get_user_prompts_dir",
            lambda: user_prompts_dir,
        )

        with pytest.raises(ValueError, match="Invalid JSON"):
            load_prompt("openai/invalid")

    def test_missing_required_field_raises_error(self, tmp_path, monkeypatch):
        """Test that missing required field raises validation error."""
        # Create a prompt missing required fields
        user_prompts_dir = tmp_path / "user_prompts"
        user_prompts_dir.mkdir()
        (user_prompts_dir / "openai").mkdir()

        incomplete_prompt = user_prompts_dir / "openai" / "incomplete.json"
        incomplete_prompt.write_text(
            json.dumps(
                {
                    "name": "test",
                    # Missing description, provider, and prompt
                }
            )
        )

        monkeypatch.setattr(
            "llm_answer_watcher.system_prompts.prompt_loader._get_user_prompts_dir",
            lambda: user_prompts_dir,
        )

        with pytest.raises(ValueError, match="Failed to load prompt"):
            load_prompt("openai/incomplete")

    def test_custom_user_prompt(self, tmp_path, monkeypatch):
        """Test loading a custom user-defined prompt."""
        # Create a custom user prompt
        user_prompts_dir = tmp_path / "user_prompts"
        user_prompts_dir.mkdir()
        (user_prompts_dir / "openai").mkdir()

        custom_prompt_data = {
            "name": "custom-analyst",
            "description": "Custom market analyst prompt",
            "provider": "openai",
            "prompt": "You are a custom analyst.",
            "metadata": {"version": "1.0"},
        }

        custom_prompt_path = user_prompts_dir / "openai" / "custom.json"
        custom_prompt_path.write_text(json.dumps(custom_prompt_data))

        monkeypatch.setattr(
            "llm_answer_watcher.system_prompts.prompt_loader._get_user_prompts_dir",
            lambda: user_prompts_dir,
        )

        prompt = load_prompt("openai/custom")
        assert prompt.name == "custom-analyst"
        assert prompt.prompt == "You are a custom analyst."
        assert prompt.metadata == {"version": "1.0"}


class TestGetProviderDefault:
    """Tests for get_provider_default function."""

    def test_get_openai_default(self):
        """Test getting OpenAI provider default."""
        prompt = get_provider_default("openai")
        assert isinstance(prompt, SystemPrompt)
        assert prompt.provider == "openai"
        assert prompt.name == "openai-default"

    def test_get_anthropic_default(self):
        """Test getting Anthropic provider default."""
        prompt = get_provider_default("anthropic")
        assert isinstance(prompt, SystemPrompt)
        assert prompt.provider == "anthropic"
        assert prompt.name == "anthropic-default"

    def test_nonexistent_provider_raises_error(self):
        """Test that nonexistent provider raises error."""
        with pytest.raises(PromptNotFoundError):
            get_provider_default("nonexistent-provider")

    def test_provider_without_default_raises_error(self, tmp_path, monkeypatch):
        """Test that provider without default.json raises error."""
        # Create a provider dir without default.json
        package_dir = tmp_path / "package_prompts"
        package_dir.mkdir()
        (package_dir / "testprovider").mkdir()

        # Create user dir without default.json
        user_dir = tmp_path / "user_prompts"
        user_dir.mkdir()

        monkeypatch.setattr(
            "llm_answer_watcher.system_prompts.prompt_loader._get_package_prompts_dir",
            lambda: package_dir,
        )
        monkeypatch.setattr(
            "llm_answer_watcher.system_prompts.prompt_loader._get_user_prompts_dir",
            lambda: user_dir,
        )

        with pytest.raises(PromptNotFoundError):
            get_provider_default("testprovider")


class TestEndToEndScenarios:
    """End-to-end tests for common usage scenarios."""

    def test_load_all_bundled_prompts(self):
        """Test that all bundled prompts can be loaded successfully."""
        bundled_prompts = [
            "openai/default",
            "openai/gpt-4-default",
            "openai/gpt-5-default",
            "anthropic/default",
        ]

        for prompt_path in bundled_prompts:
            prompt = load_prompt(prompt_path)
            assert isinstance(prompt, SystemPrompt)
            assert len(prompt.prompt) > 0

    def test_fallback_to_provider_default(self):
        """Test fallback to provider default when custom prompt not specified."""
        openai_default = get_provider_default("openai")
        anthropic_default = get_provider_default("anthropic")

        assert openai_default.provider == "openai"
        assert anthropic_default.provider == "anthropic"
        # Provider defaults can have the same prompt text (both use unbiased analyst)
        # The important thing is that they load successfully
        assert len(openai_default.prompt) > 0
        assert len(anthropic_default.prompt) > 0

    def test_user_prompt_overrides_package(self, tmp_path, monkeypatch):
        """Test that user prompt overrides package prompt with same name."""
        # Create user prompts directory
        user_prompts_dir = tmp_path / "user_prompts"
        user_prompts_dir.mkdir()
        (user_prompts_dir / "openai").mkdir()

        # Create a user version of default.json
        user_default = {
            "name": "user-openai-default",
            "description": "User override of OpenAI default",
            "provider": "openai",
            "prompt": "This is the user's custom default prompt.",
        }

        user_default_path = user_prompts_dir / "openai" / "default.json"
        user_default_path.write_text(json.dumps(user_default))

        monkeypatch.setattr(
            "llm_answer_watcher.system_prompts.prompt_loader._get_user_prompts_dir",
            lambda: user_prompts_dir,
        )

        # Load should return user version
        prompt = load_prompt("openai/default")
        assert prompt.name == "user-openai-default"
        assert prompt.prompt == "This is the user's custom default prompt."
