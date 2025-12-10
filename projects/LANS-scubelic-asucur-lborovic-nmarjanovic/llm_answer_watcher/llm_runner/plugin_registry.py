"""
Plugin registry system for intent runners.

This module provides the plugin infrastructure for registering and creating
intent runners. It enables a modular architecture where new runner implementations
can be added without modifying existing code.

Key components:
- RunnerPlugin: Protocol defining plugin interface
- RunnerRegistry: Central registry for managing plugins
- Registration decorator: @RunnerRegistry.register for auto-registration

Architecture:
    Plugins are registered at import time using the @RunnerRegistry.register
    decorator. The registry validates plugin configurations and creates runner
    instances on demand. This design supports both built-in runners (API, Steel)
    and future external plugins via entry points.

Example:
    >>> # Define a plugin
    >>> @RunnerRegistry.register
    ... class MyRunnerPlugin:
    ...     @classmethod
    ...     def plugin_name(cls) -> str:
    ...         return "my-runner"
    ...
    ...     @classmethod
    ...     def runner_type(cls) -> str:
    ...         return "custom"
    ...
    ...     @classmethod
    ...     def create_runner(cls, config: dict) -> IntentRunner:
    ...         return MyRunner(**config)
    ...
    ...     @classmethod
    ...     def validate_config(cls, config: dict) -> tuple[bool, str]:
    ...         if "required_field" not in config:
    ...             return False, "Missing required_field"
    ...         return True, ""
    ...
    ...     @classmethod
    ...     def required_env_vars(cls) -> list[str]:
    ...         return ["MY_API_KEY"]

    >>> # Use the registry
    >>> runner = RunnerRegistry.create_runner("my-runner", {"required_field": "value"})
    >>> result = runner.run_intent("What are the best CRM tools?")
"""

import logging
from typing import Protocol

from .intent_runner import IntentRunner

logger = logging.getLogger(__name__)


class RunnerPlugin(Protocol):
    """
    Protocol defining the interface for runner plugins.

    All plugin classes must implement these class methods to be registered
    in the RunnerRegistry. The plugin system uses class methods (not instance
    methods) because plugins are factories for creating runner instances.

    Class methods:
        plugin_name: Return unique plugin identifier
        runner_type: Return runner category (api/browser/custom)
        create_runner: Factory method to create runner from config
        validate_config: Validate configuration before runner creation
        required_env_vars: List required environment variables

    Example:
        >>> @RunnerRegistry.register
        ... class OpenAIAPIPlugin:
        ...     @classmethod
        ...     def plugin_name(cls) -> str:
        ...         return "openai-api"
        ...
        ...     @classmethod
        ...     def runner_type(cls) -> str:
        ...         return "api"
        ...
        ...     @classmethod
        ...     def create_runner(cls, config: dict) -> IntentRunner:
        ...         # Create OpenAI API runner with config
        ...         return OpenAIAPIRunner(
        ...             model_name=config["model_name"],
        ...             api_key=config["api_key"],
        ...         )
        ...
        ...     @classmethod
        ...     def validate_config(cls, config: dict) -> tuple[bool, str]:
        ...         if "model_name" not in config:
        ...             return False, "Missing model_name"
        ...         if "api_key" not in config:
        ...             return False, "Missing api_key"
        ...         return True, ""
        ...
        ...     @classmethod
        ...     def required_env_vars(cls) -> list[str]:
        ...         return ["OPENAI_API_KEY"]

    Note:
        This is a Protocol (PEP 544), so plugins don't need to explicitly
        inherit from this class. They just need to implement these class methods.
    """

    @classmethod
    def plugin_name(cls) -> str:
        """
        Return unique plugin identifier.

        This name is used in configuration files to specify which runner to use.
        Should be lowercase with hyphens (e.g., "openai-api", "steel-chatgpt").

        Returns:
            str: Unique plugin identifier

        Example:
            >>> MyPlugin.plugin_name()
            'my-runner'
        """
        ...

    @classmethod
    def runner_type(cls) -> str:
        """
        Return runner category.

        Returns:
            str: One of "api", "browser", "custom"

        Example:
            >>> OpenAIAPIPlugin.runner_type()
            'api'
        """
        ...

    @classmethod
    def create_runner(cls, config: dict) -> IntentRunner:
        """
        Factory method to create runner instance from configuration.

        Args:
            config: Configuration dictionary (validated via validate_config)

        Returns:
            IntentRunner: Configured runner instance

        Raises:
            ValueError: If configuration is invalid (should validate first)
            KeyError: If required config keys are missing
            Exception: Runner-specific initialization errors

        Example:
            >>> config = {"model_name": "gpt-4o-mini", "api_key": "sk-..."}
            >>> runner = OpenAIAPIPlugin.create_runner(config)
            >>> isinstance(runner, IntentRunner)
            True
        """
        ...

    @classmethod
    def validate_config(cls, config: dict) -> tuple[bool, str]:
        """
        Validate configuration before runner creation.

        Args:
            config: Configuration dictionary to validate

        Returns:
            tuple[bool, str]: (is_valid, error_message)
                - is_valid: True if config is valid, False otherwise
                - error_message: Empty string if valid, error description if invalid

        Example:
            >>> config = {"model_name": "gpt-4o-mini"}
            >>> is_valid, error = OpenAIAPIPlugin.validate_config(config)
            >>> if not is_valid:
            ...     print(f"Invalid config: {error}")
            Invalid config: Missing api_key
        """
        ...

    @classmethod
    def required_env_vars(cls) -> list[str]:
        """
        List required environment variables for this plugin.

        Used for documentation and validation. The list should include all
        environment variable names that must be set for the runner to work.

        Returns:
            list[str]: List of environment variable names

        Example:
            >>> OpenAIAPIPlugin.required_env_vars()
            ['OPENAI_API_KEY']
            >>> SteelChatGPTPlugin.required_env_vars()
            ['STEEL_API_KEY', 'CHATGPT_SESSION_TOKEN']
        """
        ...


class RunnerRegistry:
    """
    Central registry for managing runner plugins.

    This class maintains a global registry of available runner plugins and
    provides methods for:
    - Registering new plugins (via decorator)
    - Creating runner instances from plugin name + config
    - Listing available plugins
    - Querying plugin metadata

    Class attributes:
        _plugins: Dictionary mapping plugin names to plugin classes

    Class methods:
        register: Decorator to auto-register plugin classes
        create_runner: Create runner instance from plugin name and config
        list_plugins: List all registered plugins with metadata
        get_plugin: Get plugin class by name
        is_registered: Check if plugin name is registered

    Example:
        >>> # Register a plugin
        >>> @RunnerRegistry.register
        ... class MyPlugin:
        ...     # ... implement plugin methods ...
        ...     pass

        >>> # Create a runner
        >>> runner = RunnerRegistry.create_runner(
        ...     plugin_name="my-plugin",
        ...     config={"key": "value"}
        ... )

        >>> # List all plugins
        >>> plugins = RunnerRegistry.list_plugins()
        >>> for plugin in plugins:
        ...     print(f"{plugin['name']} ({plugin['type']})")
        my-plugin (custom)
        openai-api (api)
        steel-chatgpt (browser)

    Security:
        - Configuration validation is required before runner creation
        - API keys should never be logged or exposed in plugin metadata
        - Plugins should follow principle of least privilege
    """

    # Global registry of plugin name -> plugin class
    _plugins: dict[str, type] = {}

    @classmethod
    def register(cls, plugin_class: type) -> type:
        """
        Decorator to register a plugin class.

        This decorator is used at import time to automatically register plugins
        in the global registry. It validates that the plugin implements the
        required protocol methods before registration.

        Args:
            plugin_class: Plugin class implementing RunnerPlugin protocol

        Returns:
            type: The same plugin class (unmodified, for decorator chaining)

        Raises:
            ValueError: If plugin_name is already registered
            AttributeError: If plugin class doesn't implement required methods

        Example:
            >>> @RunnerRegistry.register
            ... class MyRunnerPlugin:
            ...     @classmethod
            ...     def plugin_name(cls) -> str:
            ...         return "my-runner"
            ...     # ... other methods ...

        Note:
            This decorator doesn't modify the plugin class - it just adds it
            to the registry. The class can still be used directly if needed.
        """
        # Validate plugin implements required methods
        required_methods = [
            "plugin_name",
            "runner_type",
            "create_runner",
            "validate_config",
            "required_env_vars",
        ]
        for method in required_methods:
            if not hasattr(plugin_class, method):
                raise AttributeError(
                    f"Plugin {plugin_class.__name__} missing required method: {method}"
                )

        # Get plugin name
        name = plugin_class.plugin_name()

        # Check for duplicate registration
        if name in cls._plugins:
            logger.warning(
                f"Plugin '{name}' already registered. "
                f"Overwriting with {plugin_class.__name__}"
            )

        # Register plugin
        cls._plugins[name] = plugin_class
        logger.debug(f"Registered runner plugin: {name} ({plugin_class.__name__})")

        return plugin_class

    @classmethod
    def create_runner(cls, plugin_name: str, config: dict) -> IntentRunner:
        """
        Create runner instance from plugin name and configuration.

        This is the primary entry point for creating runners. It:
        1. Looks up the plugin by name
        2. Validates the configuration
        3. Creates and returns the runner instance

        Args:
            plugin_name: Name of registered plugin (e.g., "openai-api")
            config: Configuration dictionary for the runner

        Returns:
            IntentRunner: Configured runner instance

        Raises:
            ValueError: If plugin name is unknown or config is invalid
            Exception: Runner-specific initialization errors

        Example:
            >>> config = {
            ...     "model_name": "gpt-4o-mini",
            ...     "api_key": "sk-...",
            ... }
            >>> runner = RunnerRegistry.create_runner("openai-api", config)
            >>> result = runner.run_intent("What are the best CRM tools?")

        Security:
            - Config validation is performed before runner creation
            - API keys in config should never be logged
        """
        # Check if plugin exists
        if plugin_name not in cls._plugins:
            available = ", ".join(cls._plugins.keys()) if cls._plugins else "none"
            raise ValueError(
                f"Unknown runner plugin: '{plugin_name}'. "
                f"Available plugins: {available}"
            )

        # Get plugin class
        plugin = cls._plugins[plugin_name]

        # Validate configuration
        is_valid, error_msg = plugin.validate_config(config)
        if not is_valid:
            raise ValueError(f"Invalid configuration for {plugin_name}: {error_msg}")

        # Create and return runner
        logger.debug(f"Creating runner: {plugin_name}")
        return plugin.create_runner(config)

    @classmethod
    def list_plugins(cls) -> list[dict]:
        """
        List all registered plugins with metadata.

        Returns detailed information about each registered plugin including
        name, type, and required environment variables.

        Returns:
            list[dict]: List of plugin metadata dictionaries with keys:
                - name: Plugin identifier
                - type: Runner type (api/browser/custom)
                - required_env_vars: List of required environment variables
                - class_name: Plugin class name (for debugging)

        Example:
            >>> plugins = RunnerRegistry.list_plugins()
            >>> for p in plugins:
            ...     print(f"{p['name']} ({p['type']})")
            ...     print(f"  Requires: {', '.join(p['required_env_vars'])}")
            openai-api (api)
              Requires: OPENAI_API_KEY
            steel-chatgpt (browser)
              Requires: STEEL_API_KEY
        """
        return [
            {
                "name": name,
                "type": plugin.runner_type(),
                "required_env_vars": plugin.required_env_vars(),
                "class_name": plugin.__name__,
            }
            for name, plugin in cls._plugins.items()
        ]

    @classmethod
    def get_plugin(cls, plugin_name: str) -> type:
        """
        Get plugin class by name.

        Args:
            plugin_name: Name of registered plugin

        Returns:
            type: Plugin class

        Raises:
            ValueError: If plugin name is not registered

        Example:
            >>> plugin = RunnerRegistry.get_plugin("openai-api")
            >>> plugin.runner_type()
            'api'
        """
        if plugin_name not in cls._plugins:
            raise ValueError(f"Unknown plugin: '{plugin_name}'")
        return cls._plugins[plugin_name]

    @classmethod
    def is_registered(cls, plugin_name: str) -> bool:
        """
        Check if plugin name is registered.

        Args:
            plugin_name: Plugin name to check

        Returns:
            bool: True if registered, False otherwise

        Example:
            >>> RunnerRegistry.is_registered("openai-api")
            True
            >>> RunnerRegistry.is_registered("unknown-plugin")
            False
        """
        return plugin_name in cls._plugins
