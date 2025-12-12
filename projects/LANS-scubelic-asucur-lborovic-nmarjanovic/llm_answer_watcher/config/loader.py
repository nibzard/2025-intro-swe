"""
Configuration loader for LLM Answer Watcher.

This module loads YAML configuration files, validates them with Pydantic models,
and resolves API keys from environment variables to create a RuntimeConfig.

The loader implements a clear separation between configuration specification
(WatcherConfig from YAML) and runtime configuration (RuntimeConfig with resolved
API keys), ensuring secrets never get committed to version control.

Functions:
    load_config: Main entrypoint to load and validate watcher.config.yaml
    resolve_api_keys: Helper to resolve environment variables to API keys
"""

import os
from pathlib import Path

import yaml
from pydantic import ValidationError

from llm_answer_watcher.exceptions import (
    APIKeyMissingError,
    ConfigFileNotFoundError,
    ConfigValidationError,
)
from llm_answer_watcher.system_prompts import get_provider_default, load_prompt

from .schema import (
    RuntimeConfig,
    RuntimeExtractionModel,
    RuntimeExtractionSettings,
    RuntimeModel,
    RuntimeOperation,
    WatcherConfig,
)


def load_config(config_path: str | Path) -> RuntimeConfig:
    """
    Load watcher.config.yaml and resolve API keys from environment variables.

    This function:
    1. Loads YAML from the specified path
    2. Validates structure using WatcherConfig Pydantic model
    3. Resolves API key environment variables to actual secrets
    4. Returns RuntimeConfig with resolved API keys ready for LLM calls

    Args:
        config_path: Path to watcher.config.yaml file (relative or absolute)

    Returns:
        RuntimeConfig with resolved API keys and validated configuration

    Raises:
        ConfigFileNotFoundError: If config file doesn't exist at the specified path
        ConfigValidationError: If YAML is invalid or config validation fails
        APIKeyMissingError: If required API keys are missing from environment

    Example:
        >>> config = load_config("examples/watcher.config.yaml")
        >>> len(config.models)
        2
        >>> config.models[0].api_key  # Resolved from environment
        'sk-...'

    Security:
        - API keys are loaded from environment variables only
        - API keys are NEVER logged or written to disk
        - Uses yaml.safe_load() to prevent code injection
    """
    # Convert to Path object for robust path handling
    config_path = Path(config_path)

    # Check file exists before attempting to read
    if not config_path.exists():
        raise ConfigFileNotFoundError(f"Configuration file not found: {config_path}")

    # Load YAML content
    try:
        with config_path.open(encoding="utf-8") as f:
            raw_config = yaml.safe_load(f)
    except yaml.YAMLError as e:
        raise ConfigValidationError(f"Invalid YAML syntax in {config_path}: {e}") from e
    except Exception as e:
        raise ConfigValidationError(
            f"Failed to read configuration file {config_path}: {e}"
        ) from e

    # Handle empty YAML file
    if raw_config is None:
        raise ConfigValidationError(f"Configuration file is empty: {config_path}")

    # Validate configuration structure with Pydantic
    try:
        watcher_config = WatcherConfig.model_validate(raw_config)
    except ValidationError as e:
        # Format validation errors in a user-friendly way
        error_messages = []
        for error in e.errors():
            loc = ".".join(str(x) for x in error["loc"])
            msg = error["msg"]
            error_messages.append(f"  - {loc}: {msg}")

        raise ConfigValidationError(
            f"Configuration validation failed in {config_path}:\n"
            + "\n".join(error_messages)
        ) from e

    # Determine which format is used: legacy (models) or new (runners)
    has_runners = watcher_config.runners and len(watcher_config.runners) > 0
    has_models = watcher_config.run_settings.models and len(watcher_config.run_settings.models) > 0

    # Resolve API keys or runner configs based on format
    resolved_models = []
    resolved_runner_configs = None

    if has_runners:
        # New format: resolve runner configs
        try:
            resolved_runner_configs = resolve_runner_configs(watcher_config)
        except APIKeyMissingError as e:
            raise APIKeyMissingError(
                f"Failed to resolve API keys for runner configs in {config_path}: {e}"
            ) from e
        except ConfigValidationError as e:
            raise ConfigValidationError(
                f"Invalid runner configuration in {config_path}: {e}"
            ) from e
        except Exception as e:
            raise ConfigValidationError(
                f"Failed to resolve runner configs from {config_path}: {e}"
            ) from e
    else:
        # Legacy format: resolve API keys for models
        try:
            resolved_models = resolve_api_keys(watcher_config)
        except APIKeyMissingError as e:
            raise APIKeyMissingError(
                f"Failed to resolve API keys for models in {config_path}: {e}"
            ) from e
        except ConfigValidationError as e:
            raise ConfigValidationError(
                f"Invalid model configuration in {config_path}: {e}"
            ) from e
        except Exception as e:
            raise ConfigValidationError(
                f"Failed to resolve API keys from {config_path}: {e}"
            ) from e

    # Resolve operation models (used only for operations, not intent queries)
    resolved_operation_models = []
    try:
        resolved_operation_models = resolve_operation_api_keys(watcher_config)
    except APIKeyMissingError as e:
        raise APIKeyMissingError(
            f"Failed to resolve API keys for operation models in {config_path}: {e}"
        ) from e
    except ConfigValidationError as e:
        raise ConfigValidationError(
            f"Invalid operation model configuration in {config_path}: {e}"
        ) from e
    except Exception as e:
        raise ConfigValidationError(
            f"Failed to resolve operation models from {config_path}: {e}"
        ) from e

    # Resolve extraction settings if present
    resolved_extraction_settings = None
    if watcher_config.extraction_settings:
        try:
            resolved_extraction_settings = resolve_extraction_settings(watcher_config)
        except APIKeyMissingError as e:
            raise APIKeyMissingError(
                f"Failed to resolve API keys for extraction settings in {config_path}: {e}"
            ) from e
        except ConfigValidationError as e:
            raise ConfigValidationError(
                f"Invalid extraction settings configuration in {config_path}: {e}"
            ) from e
        except Exception as e:
            raise ConfigValidationError(
                f"Failed to resolve extraction settings from {config_path}: {e}"
            ) from e

    # Resolve global operations if present
    # Operations should use operation_models if available, otherwise fall back to models
    resolved_global_operations = []
    if watcher_config.global_operations:
        try:
            # Use operation_models for operations if configured, otherwise fall back to models
            operation_model_pool = resolved_operation_models if resolved_operation_models else resolved_models
            resolved_global_operations = resolve_operations(
                watcher_config.global_operations,
                operation_model_pool,
            )
        except APIKeyMissingError:
            raise
        except ConfigValidationError:
            raise
        except Exception as e:
            raise ConfigValidationError(
                f"Failed to resolve global operations from {config_path}: {e}"
            ) from e

    # Build RuntimeConfig with resolved API keys or runner configs
    return RuntimeConfig(
        run_settings=watcher_config.run_settings,
        extraction_settings=resolved_extraction_settings,
        brands=watcher_config.brands,
        intents=watcher_config.intents,
        models=resolved_models,
        operation_models=resolved_operation_models,
        runner_configs=resolved_runner_configs,
        global_operations=resolved_global_operations,
    )


def resolve_api_keys(config: WatcherConfig) -> list[RuntimeModel]:
    """
    Resolve API key environment variables and system prompts for runtime use.

    Takes the list of ModelConfig from WatcherConfig and resolves:
    1. env_api_key references to actual API keys from environment
    2. system_prompt references to actual prompt text from JSON files

    Args:
        config: Validated WatcherConfig with model configurations

    Returns:
        List of RuntimeModel instances with resolved API keys and system prompts

    Raises:
        APIKeyMissingError: If any required environment variable is not set
        ConfigValidationError: If provider is unsupported or system prompt files cannot be loaded

    Example:
        >>> # Assuming OPENAI_API_KEY is set in environment
        >>> config = WatcherConfig(...)
        >>> models = resolve_api_keys(config)
        >>> models[0].api_key  # Contains actual key from environment
        'sk-proj-...'
        >>> models[0].system_prompt  # Contains prompt text from JSON
        'You are ChatGPT...'

    Security:
        - NEVER logs API keys (not even partial values)
        - Fails fast if environment variable is missing
        - API keys are only held in memory, never persisted
    """
    # List of implemented providers (updated to include all current providers)
    IMPLEMENTED_PROVIDERS = {"openai", "anthropic", "mistral", "grok", "google"}
    PLANNED_PROVIDERS: set[str] = set()  # All planned providers are now implemented

    resolved_models: list[RuntimeModel] = []

    for model_config in config.run_settings.models:
        # Validate provider is implemented
        if model_config.provider not in IMPLEMENTED_PROVIDERS:
            if model_config.provider in PLANNED_PROVIDERS:
                raise ConfigValidationError(
                    f"Provider '{model_config.provider}' is not yet implemented. "
                    f"Currently supported providers: {', '.join(sorted(IMPLEMENTED_PROVIDERS))}. "
                    f"Planned providers: {', '.join(sorted(PLANNED_PROVIDERS))}. "
                    f"Please use an implemented provider or check back in a future release."
                )
            raise ConfigValidationError(
                f"Unknown provider '{model_config.provider}'. "
                f"Supported providers: {', '.join(sorted(IMPLEMENTED_PROVIDERS))}."
            )

        # Get environment variable name from config
        env_var_name = model_config.env_api_key

        # Resolve to actual API key value
        api_key = os.environ.get(env_var_name)

        # Fail fast if environment variable is not set
        if not api_key:
            raise APIKeyMissingError(
                f"Environment variable ${env_var_name} not set "
                f"(required for {model_config.provider}/{model_config.model_name}). "
                f"Please set it in your environment or .env file."
            )

        # Validate API key is not just whitespace
        if api_key.isspace():
            raise APIKeyMissingError(
                f"Environment variable ${env_var_name} is empty or whitespace "
                f"(required for {model_config.provider}/{model_config.model_name})"
            )

        # Resolve system prompt from JSON file
        try:
            if model_config.system_prompt:
                # Use specified system prompt
                prompt_obj = load_prompt(model_config.system_prompt)
            else:
                # Fall back to provider default
                prompt_obj = get_provider_default(model_config.provider)

            system_prompt_text = prompt_obj.prompt

        except Exception as e:
            raise ConfigValidationError(
                f"Failed to load system prompt for {model_config.provider}/{model_config.model_name}: {e}"
            ) from e

        # Build RuntimeModel with resolved API key, system prompt, and tools
        runtime_model = RuntimeModel(
            provider=model_config.provider,
            model_name=model_config.model_name,
            api_key=api_key,
            system_prompt=system_prompt_text,
            tools=model_config.tools,
            tool_choice=model_config.tool_choice,
        )

        resolved_models.append(runtime_model)

    return resolved_models


def resolve_operation_api_keys(config: WatcherConfig) -> list[RuntimeModel]:
    """
    Resolve API key environment variables and system prompts for operation models.

    Similar to resolve_api_keys() but processes config.run_settings.operation_models
    instead of config.run_settings.models. Operation models are used exclusively
    for post-query analysis operations, not for intent queries.

    Args:
        config: Validated WatcherConfig with operation model configurations

    Returns:
        List of RuntimeModel instances with resolved API keys and system prompts
        Empty list if no operation models are configured

    Raises:
        APIKeyMissingError: If any required environment variable is not set
        ConfigValidationError: If provider is unsupported or system prompt files cannot be loaded

    Example:
        >>> # Assuming OPENAI_API_KEY is set in environment
        >>> config = WatcherConfig(...)
        >>> operation_models = resolve_operation_api_keys(config)
        >>> operation_models[0].model_name  # e.g., "o3-mini"
        'o3-mini'

    Security:
        - NEVER logs API keys (not even partial values)
        - Fails fast if environment variable is missing
        - API keys are only held in memory, never persisted
    """
    # Return empty list if no operation models configured
    if not config.run_settings.operation_models:
        return []

    # List of implemented providers (must match resolve_api_keys)
    IMPLEMENTED_PROVIDERS = {"openai", "anthropic", "mistral", "grok", "google"}
    PLANNED_PROVIDERS: set[str] = set()

    resolved_operation_models: list[RuntimeModel] = []

    for model_config in config.run_settings.operation_models:
        # Validate provider is implemented
        if model_config.provider not in IMPLEMENTED_PROVIDERS:
            if model_config.provider in PLANNED_PROVIDERS:
                raise ConfigValidationError(
                    f"Provider '{model_config.provider}' is not yet implemented. "
                    f"Currently supported providers: {', '.join(sorted(IMPLEMENTED_PROVIDERS))}. "
                    f"Planned providers: {', '.join(sorted(PLANNED_PROVIDERS))}. "
                    f"Please use an implemented provider or check back in a future release."
                )
            raise ConfigValidationError(
                f"Unknown provider '{model_config.provider}'. "
                f"Supported providers: {', '.join(sorted(IMPLEMENTED_PROVIDERS))}."
            )

        # Get environment variable name from config
        env_var_name = model_config.env_api_key

        # Resolve to actual API key value
        api_key = os.environ.get(env_var_name)

        # Fail fast if environment variable is not set
        if not api_key:
            raise APIKeyMissingError(
                f"Environment variable ${env_var_name} not set "
                f"(required for operation model {model_config.provider}/{model_config.model_name}). "
                f"Please set it in your environment or .env file."
            )

        # Validate API key is not just whitespace
        if api_key.isspace():
            raise APIKeyMissingError(
                f"Environment variable ${env_var_name} is empty or whitespace "
                f"(required for operation model {model_config.provider}/{model_config.model_name})"
            )

        # Resolve system prompt from JSON file
        try:
            if model_config.system_prompt:
                # Use specified system prompt
                prompt_obj = load_prompt(model_config.system_prompt)
            else:
                # Fall back to provider default
                prompt_obj = get_provider_default(model_config.provider)

            system_prompt_text = prompt_obj.prompt

        except Exception as e:
            raise ConfigValidationError(
                f"Failed to load system prompt for operation model "
                f"{model_config.provider}/{model_config.model_name}: {e}"
            ) from e

        # Build RuntimeModel with resolved API key, system prompt, and tools
        runtime_model = RuntimeModel(
            provider=model_config.provider,
            model_name=model_config.model_name,
            api_key=api_key,
            system_prompt=system_prompt_text,
            tools=model_config.tools,
            tool_choice=model_config.tool_choice,
        )

        resolved_operation_models.append(runtime_model)

    return resolved_operation_models


def resolve_runner_configs(config: WatcherConfig) -> list:
    """
    Resolve environment variables in runner configurations.

    Takes RunnerConfig objects from WatcherConfig and resolves ${ENV_VAR}
    references in the config dictionaries to actual environment variable values.

    Supports env var substitution in string values like:
    - api_key: "${OPENAI_API_KEY}"
    - steel_api_key: "${STEEL_API_KEY}"

    Args:
        config: Validated WatcherConfig with runner configurations

    Returns:
        List of RunnerConfig instances with resolved environment variables

    Raises:
        APIKeyMissingError: If any referenced environment variable is not set
        ConfigValidationError: If env var format is invalid

    Example:
        >>> # config.yaml has: api_key: "${OPENAI_API_KEY}"
        >>> config = WatcherConfig(runners=[...])
        >>> runners = resolve_runner_configs(config)
        >>> runners[0].config["api_key"]  # Now contains actual key
        'sk-proj-...'

    Security:
        - NEVER logs resolved values (may contain API keys)
        - Fails fast if environment variable is missing
    """
    from .schema import RunnerConfig

    if not config.runners:
        return []

    resolved_runners: list[RunnerConfig] = []

    for runner_config in config.runners:
        # Deep copy config dict to avoid mutating original
        resolved_config = _resolve_env_vars_recursive(runner_config.config.copy())

        # Create new RunnerConfig with resolved values
        resolved_runner = RunnerConfig(
            runner_plugin=runner_config.runner_plugin,
            config=resolved_config
        )

        resolved_runners.append(resolved_runner)

    return resolved_runners


def _resolve_env_vars_recursive(obj):
    """
    Recursively resolve ${ENV_VAR} references in nested dicts/lists.

    Args:
        obj: Dict, list, or scalar value to process

    Returns:
        Object with all ${ENV_VAR} references resolved

    Raises:
        APIKeyMissingError: If referenced env var is not set
    """
    import re

    # Pattern to match ${ENV_VAR_NAME}
    env_var_pattern = re.compile(r'\$\{([A-Z_][A-Z0-9_]*)\}')

    if isinstance(obj, dict):
        # Recursively process dictionary values
        return {key: _resolve_env_vars_recursive(value) for key, value in obj.items()}

    if isinstance(obj, list):
        # Recursively process list items
        return [_resolve_env_vars_recursive(item) for item in obj]

    if isinstance(obj, str):
        # Check if string contains ${ENV_VAR} pattern
        match = env_var_pattern.search(obj)
        if match:
            env_var_name = match.group(1)

            # Get value from environment
            env_value = os.environ.get(env_var_name)

            if env_value is None:
                raise APIKeyMissingError(
                    f"Environment variable ${{{env_var_name}}} not set. "
                    f"Please set it in your environment or .env file."
                )

            # Replace ${ENV_VAR} with actual value
            # If the entire string is just ${ENV_VAR}, return the value directly
            # Otherwise, perform string substitution (allows "prefix-${VAR}-suffix")
            if obj == f"${{{env_var_name}}}":
                return env_value
            return env_var_pattern.sub(env_value, obj)

        return obj

    # Return scalar values as-is (int, bool, float, None)
    return obj


def resolve_extraction_settings(
    config: WatcherConfig,
) -> RuntimeExtractionSettings:
    """
    Resolve extraction settings with API keys and system prompts.

    Takes ExtractionSettings from WatcherConfig and resolves:
    1. env_api_key reference to actual API key from environment
    2. system_prompt reference to actual prompt text from JSON files

    Args:
        config: Validated WatcherConfig with extraction settings

    Returns:
        RuntimeExtractionSettings with resolved API key and system prompt

    Raises:
        APIKeyMissingError: If required environment variable is not set
        ConfigValidationError: If provider is unsupported or system prompt cannot be loaded

    Example:
        >>> # Assuming OPENAI_API_KEY is set
        >>> config = WatcherConfig(extraction_settings=...)
        >>> settings = resolve_extraction_settings(config)
        >>> settings.extraction_model.api_key  # Contains actual key
        'sk-proj-...'

    Security:
        - NEVER logs API keys
        - Fails fast if environment variable is missing
    """
    if not config.extraction_settings:
        raise ConfigValidationError(
            "extraction_settings is None - cannot resolve extraction settings"
        )

    extraction_config = config.extraction_settings
    model_config = extraction_config.extraction_model

    # List of implemented providers
    IMPLEMENTED_PROVIDERS = {"openai", "anthropic", "mistral", "grok", "google"}

    # Validate provider is implemented
    if model_config.provider not in IMPLEMENTED_PROVIDERS:
        raise ConfigValidationError(
            f"Unknown provider '{model_config.provider}' for extraction model. "
            f"Supported providers: {', '.join(sorted(IMPLEMENTED_PROVIDERS))}."
        )

    # Get environment variable name from config
    env_var_name = model_config.env_api_key

    # Resolve to actual API key value
    api_key = os.environ.get(env_var_name)

    # Fail fast if environment variable is not set
    if not api_key:
        raise APIKeyMissingError(
            f"Environment variable ${env_var_name} not set "
            f"(required for extraction model {model_config.provider}/{model_config.model_name}). "
            f"Please set it in your environment or .env file."
        )

    # Validate API key is not just whitespace
    if api_key.isspace():
        raise APIKeyMissingError(
            f"Environment variable ${env_var_name} is empty or whitespace "
            f"(required for extraction model {model_config.provider}/{model_config.model_name})"
        )

    # Resolve system prompt from JSON file
    try:
        if model_config.system_prompt:
            # Use specified system prompt
            prompt_obj = load_prompt(model_config.system_prompt)
        else:
            # Fall back to extraction default or provider default
            try:
                # Try extraction-specific prompt first
                prompt_obj = load_prompt(f"{model_config.provider}/extraction-default")
            except Exception:
                # Fall back to provider default
                prompt_obj = get_provider_default(model_config.provider)

        system_prompt_text = prompt_obj.prompt

    except Exception as e:
        raise ConfigValidationError(
            f"Failed to load system prompt for extraction model "
            f"{model_config.provider}/{model_config.model_name}: {e}"
        ) from e

    # Build RuntimeExtractionModel with resolved API key and prompt
    runtime_extraction_model = RuntimeExtractionModel(
        provider=model_config.provider,
        model_name=model_config.model_name,
        api_key=api_key,
        system_prompt=system_prompt_text,
    )

    # Build RuntimeExtractionSettings
    return RuntimeExtractionSettings(
        extraction_model=runtime_extraction_model,
        method=extraction_config.method,
        fallback_to_regex=extraction_config.fallback_to_regex,
        min_confidence=extraction_config.min_confidence,
        enable_sentiment_analysis=extraction_config.enable_sentiment_analysis,
        enable_intent_classification=extraction_config.enable_intent_classification,
    )


def resolve_operations(
    operations: list,  # list[Operation] from schema
    operation_models: list[RuntimeModel],
) -> list[RuntimeOperation]:
    """
    Resolve operations with model overrides.

    Takes list of Operation configurations and resolves any model overrides
    to RuntimeModel instances. Operations without model overrides will use
    the default model at runtime (first model in operation_models list).

    Args:
        operations: List of Operation configurations from WatcherConfig
        operation_models: List of resolved RuntimeModel instances from operation_models pool
                         (or models pool if operation_models is not configured)

    Returns:
        List of RuntimeOperation instances with resolved model overrides

    Raises:
        ConfigValidationError: If operation specifies unknown model

    Example:
        >>> # Operations with and without model overrides
        >>> operations = [
        ...     Operation(id="op1", model="o3-mini", ...),
        ...     Operation(id="op2", model=None, ...)  # Will use default
        ... ]
        >>> resolved = resolve_operations(operations, operation_models)
        >>> resolved[0].runtime_model  # Specific model
        RuntimeModel(provider='openai', model_name='o3-mini', ...)
        >>> resolved[1].runtime_model  # None - will use default at runtime
        None

    Note:
        - Operations with model=None will have runtime_model=None
        - Runtime executor will use first model from operation_models as default
        - Model string format: "model_name" (must match a configured model)
    """
    from .schema import Operation

    runtime_operations: list[RuntimeOperation] = []

    for operation in operations:
        # Type hint for IDE support
        op: Operation = operation

        # Resolve model override if specified
        runtime_model = None
        if op.model:
            # Find matching model by model_name
            matching_model = None
            for model in operation_models:
                if model.model_name == op.model:
                    matching_model = model
                    break

            if not matching_model:
                raise ConfigValidationError(
                    f"Operation '{op.id}' specifies model '{op.model}' "
                    f"which is not configured in run_settings.models or run_settings.operation_models. "
                    f"Available models: {', '.join(m.model_name for m in operation_models)}"
                )

            runtime_model = matching_model

        # Build RuntimeOperation
        runtime_operation = RuntimeOperation(
            id=op.id,
            description=op.description,
            prompt=op.prompt,
            runtime_model=runtime_model,
            enabled=op.enabled,
            depends_on=op.depends_on,
            condition=op.condition,
            output_format=op.output_format,
            type=op.type,
            # Function calling support
            function_schema=op.function_schema,
            function_template=op.function_template,
            function_params=op.function_params,
        )

        runtime_operations.append(runtime_operation)

    return runtime_operations
