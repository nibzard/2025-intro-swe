"""
LLM runner module for LLM Answer Watcher.

This module provides the complete runner infrastructure including:
- LLMClient protocol (API-based runners)
- IntentRunner protocol (unified interface)
- Plugin registry system
- Built-in plugins (API, Steel ChatGPT, Steel Perplexity)

The module automatically registers all built-in plugins on import, making them
available via the RunnerRegistry.

Example:
    >>> from llm_answer_watcher.llm_runner import RunnerRegistry
    >>>
    >>> # List available runners
    >>> plugins = RunnerRegistry.list_plugins()
    >>> for p in plugins:
    ...     print(f"{p['name']} ({p['type']})")
    api (api)
    steel-chatgpt (browser)
    steel-perplexity (browser)
    >>>
    >>> # Create a runner
    >>> config = {"provider": "openai", "model_name": "gpt-4o-mini", "api_key": "sk-..."}
    >>> runner = RunnerRegistry.create_runner("api", config)
    >>> result = runner.run_intent("What are the best CRM tools?")
"""

# Core protocols and models
from .intent_runner import IntentResult, IntentRunner
from .models import LLMClient, LLMResponse, build_client
from .plugin_registry import RunnerPlugin, RunnerRegistry

# Import plugins to trigger auto-registration
# API plugin
from .api_runner import APIRunnerPlugin

# Browser plugins
from .browser.steel_chatgpt import SteelChatGPTPlugin
from .browser.steel_perplexity import SteelPerplexityPlugin

__all__ = [
    # Protocols
    "IntentRunner",
    "LLMClient",
    "RunnerPlugin",
    # Data classes
    "IntentResult",
    "LLMResponse",
    # Functions
    "build_client",
    # Registry
    "RunnerRegistry",
    # Plugins (for direct access if needed)
    "APIRunnerPlugin",
    "SteelChatGPTPlugin",
    "SteelPerplexityPlugin",
]
