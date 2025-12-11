"""System prompt loader for LLM Answer Watcher.

Loads system prompts from JSON files with support for:
- Package defaults (bundled with the tool)
- User overrides (~/.config/llm-answer-watcher/system_prompts/)
- Provider-specific defaults

Path resolution order:
1. User config directory (~/.config/llm-answer-watcher/system_prompts/)
2. Package directory (llm_answer_watcher/system_prompts/)
"""

import json
import logging
from pathlib import Path

from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger(__name__)


class PromptNotFoundError(Exception):
    """Raised when a requested system prompt file cannot be found."""

    pass


class SystemPrompt(BaseModel):
    """Schema for system prompt JSON files.

    Example JSON:
    {
        "name": "gpt-4-default",
        "description": "Default ChatGPT system prompt for GPT-4 models",
        "provider": "openai",
        "compatible_models": ["gpt-4", "gpt-4-turbo", "gpt-4o"],
        "prompt": "You are ChatGPT, a large language model...",
        "metadata": {
            "version": "v2",
            "created": "2025-03-07",
            "author": "openai"
        }
    }
    """

    name: str = Field(description="Short identifier for this prompt")
    description: str = Field(description="Human-readable description")
    provider: str = Field(description="LLM provider (openai, anthropic, etc.)")
    prompt: str = Field(description="The actual system prompt text")
    compatible_models: list[str] | None = Field(
        default=None, description="Optional list of compatible model names"
    )
    metadata: dict[str, str] | None = Field(
        default=None, description="Optional metadata (version, author, etc.)"
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Ensure name is not empty."""
        if not v or v.isspace():
            raise ValueError("Prompt name cannot be empty")
        return v

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        """Ensure provider is not empty."""
        if not v or v.isspace():
            raise ValueError("Provider cannot be empty")
        return v

    @field_validator("prompt")
    @classmethod
    def validate_prompt(cls, v: str) -> str:
        """Ensure prompt is not empty."""
        if not v or v.isspace():
            raise ValueError("System prompt text cannot be empty")
        return v


def _get_package_prompts_dir() -> Path:
    """Get the package-bundled system_prompts directory."""
    return Path(__file__).parent


def _get_user_prompts_dir() -> Path:
    """Get the user config directory for custom system prompts.

    Returns:
        Path to ~/.config/llm-answer-watcher/system_prompts/

    Note: Does not create the directory if it doesn't exist.
    """
    config_home = Path.home() / ".config" / "llm-answer-watcher" / "system_prompts"
    return config_home


def _resolve_prompt_path(relative_path: str) -> Path:
    """Resolve a relative prompt path to an absolute path.

    Checks user directory first, then package directory.

    Args:
        relative_path: Relative path like "openai/gpt-4-default" or "openai/default"

    Returns:
        Absolute path to the JSON file

    Raises:
        PromptNotFoundError: If the prompt file is not found in either location
    """
    # Ensure .json extension
    if not relative_path.endswith(".json"):
        relative_path = f"{relative_path}.json"

    # Check user directory first
    user_path = _get_user_prompts_dir() / relative_path
    if user_path.exists():
        logger.debug(f"Using user prompt: {user_path}")
        return user_path

    # Fall back to package directory
    package_path = _get_package_prompts_dir() / relative_path
    if package_path.exists():
        logger.debug(f"Using package prompt: {package_path}")
        return package_path

    # Not found in either location
    raise PromptNotFoundError(
        f"System prompt not found: {relative_path}\n"
        f"Searched in:\n"
        f"  - User dir: {user_path}\n"
        f"  - Package dir: {package_path}"
    )


def load_prompt(relative_path: str) -> SystemPrompt:
    """Load a system prompt from a JSON file.

    Args:
        relative_path: Relative path like "openai/gpt-4-default" or "openai/default"

    Returns:
        Validated SystemPrompt object

    Raises:
        PromptNotFoundError: If the prompt file cannot be found
        ValueError: If the JSON is invalid or fails validation
        json.JSONDecodeError: If the file contains invalid JSON
    """
    prompt_path = _resolve_prompt_path(relative_path)

    try:
        with prompt_path.open("r", encoding="utf-8") as f:
            data = json.load(f)

        prompt = SystemPrompt.model_validate(data)
        logger.info(f"Loaded system prompt '{prompt.name}' from {prompt_path}")
        return prompt

    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in prompt file {prompt_path}: {e}") from e
    except Exception as e:
        raise ValueError(f"Failed to load prompt from {prompt_path}: {e}") from e


def get_provider_default(provider: str) -> SystemPrompt:
    """Load the default system prompt for a given provider.

    Args:
        provider: Provider name (e.g., "openai", "anthropic")

    Returns:
        Validated SystemPrompt object for the provider's default

    Raises:
        PromptNotFoundError: If the provider's default.json is not found
        ValueError: If the JSON is invalid or fails validation
    """
    default_path = f"{provider}/default"
    return load_prompt(default_path)
