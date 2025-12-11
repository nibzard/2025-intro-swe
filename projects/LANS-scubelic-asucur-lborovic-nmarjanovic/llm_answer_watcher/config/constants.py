"""
Configuration constants for LLM Answer Watcher.

This module contains global constants used across the application
to avoid tight coupling between modules.
"""

# Maximum prompt length to prevent excessive API costs
# ~25k tokens at 4 chars/token average - prevents runaway costs from extremely long prompts
# This limit applies to all LLM providers
MAX_PROMPT_LENGTH = 100_000
