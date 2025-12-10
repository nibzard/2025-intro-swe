"""System prompt library for LLM Answer Watcher.

This module provides functionality to load and manage system prompts for different LLM providers.
Prompts are stored as JSON files organized by provider (openai/, anthropic/, etc.).

Supports both package defaults and user overrides:
- Package defaults: llm_answer_watcher/system_prompts/
- User overrides: ~/.config/llm-answer-watcher/system_prompts/

User prompts take precedence over package defaults.
"""

from llm_answer_watcher.system_prompts.prompt_loader import (
    PromptNotFoundError,
    SystemPrompt,
    get_provider_default,
    load_prompt,
)

__all__ = [
    "PromptNotFoundError",
    "SystemPrompt",
    "get_provider_default",
    "load_prompt",
]
