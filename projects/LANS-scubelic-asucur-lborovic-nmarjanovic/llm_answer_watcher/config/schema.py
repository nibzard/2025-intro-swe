"""
Configuration schema models for LLM Answer Watcher.

This module defines Pydantic models for validating and parsing the
watcher.config.yaml file. All models use Python 3.12+ type hints and
Pydantic v2 field validators for comprehensive validation.

Models:
    ModelConfig: LLM model configuration (provider, model_name, env_api_key) [LEGACY]
    RunnerConfig: Unified runner configuration for API and browser runners [NEW]
    RunSettings: Runtime settings (output paths, models, feature flags)
    ExtractionModelConfig: Extraction model configuration (project-level)
    ExtractionSettings: Extraction method configuration (function calling vs regex)
    Brands: Brand alias collections (mine vs competitors)
    Operation: Custom post-intent operation configuration
    Intent: Buyer-intent query configuration
    WatcherConfig: Root configuration model (validates entire YAML)
    RuntimeModel: Resolved model configuration with API key [LEGACY]
    RuntimeExtractionModel: Resolved extraction model with API key
    RuntimeOperation: Resolved operation with runtime model configuration
    RuntimeConfig: Runtime configuration with resolved API keys
"""

from typing import Literal

from pydantic import BaseModel, field_validator, model_validator


class ModelConfig(BaseModel):
    """
    LLM model configuration from watcher.config.yaml.

    Specifies which LLM to call and where to find its API key in the environment.

    Attributes:
        provider: LLM provider name (openai, anthropic, google, mistral)
        model_name: Specific model identifier (e.g., "gpt-4o-mini")
        env_api_key: Environment variable name containing the API key
        system_prompt: Optional relative path to system prompt JSON (e.g., "openai/gpt-4-default")
                      If not specified, uses provider default (e.g., "openai/default")
        tools: Optional list of tool configurations. Format differs by provider:
               - OpenAI: [{"type": "web_search"}] (typed tool specification)
               - Google: [{"google_search": {}}] (dictionary with tool name as key)
               - Perplexity: Not needed (native web search)
               Config is passed directly to provider API without translation.
        tool_choice: Tool selection mode ("auto", "required", "none"). Default: "auto"
                    Note: Only used by OpenAI. Google auto-decides when to use tools.
    """

    provider: Literal["openai", "anthropic", "google", "mistral", "grok", "perplexity"]
    model_name: str
    env_api_key: str
    system_prompt: str | None = None
    tools: list[dict] | None = None
    tool_choice: str = "auto"

    @field_validator("model_name")
    @classmethod
    def validate_model_name(cls, v: str) -> str:
        """Validate model_name is non-empty."""
        if not v or v.isspace():
            raise ValueError("model_name cannot be empty")
        return v

    @field_validator("env_api_key")
    @classmethod
    def validate_env_api_key(cls, v: str) -> str:
        """Validate env_api_key is non-empty."""
        if not v or v.isspace():
            raise ValueError("env_api_key cannot be empty")
        return v

    @field_validator("tool_choice")
    @classmethod
    def validate_tool_choice(cls, v: str) -> str:
        """Validate tool_choice is one of allowed values."""
        allowed = {"auto", "required", "none"}
        if v not in allowed:
            raise ValueError(f"tool_choice must be one of {allowed}, got: {v}")
        return v


class BudgetConfig(BaseModel):
    """
    Budget control settings to prevent runaway costs.

    Enables cost limits and warnings for LLM API usage. All costs are in USD.

    Attributes:
        enabled: Enable budget controls (default: True)
        max_per_run_usd: Maximum cost per run (abort if exceeded)
        max_per_intent_usd: Maximum cost per intent (abort if exceeded)
        warn_threshold_usd: Warn if estimated cost exceeds this (but continue)
    """

    enabled: bool = True
    max_per_run_usd: float | None = None
    max_per_intent_usd: float | None = None
    warn_threshold_usd: float | None = None

    @field_validator("max_per_run_usd", "max_per_intent_usd", "warn_threshold_usd")
    @classmethod
    def validate_positive(cls, v: float | None) -> float | None:
        """Validate budget values are positive if specified."""
        if v is not None and v <= 0:
            raise ValueError(f"Budget value must be positive, got: {v}")
        return v


class RunnerConfig(BaseModel):
    """
    Unified runner configuration for API-based and browser-based runners.

    This model supports the new plugin system where runners can be API clients
    (OpenAI, Anthropic, etc.) or browser automation (Steel ChatGPT, Perplexity).

    The runner_plugin field determines which plugin to use, and config contains
    plugin-specific configuration as a dictionary that gets validated by the plugin.

    Attributes:
        runner_plugin: Plugin identifier (e.g., "api", "steel-chatgpt", "steel-perplexity")
        config: Plugin-specific configuration dictionary

    Example:
        # API runner (wraps existing LLMClient)
        runners:
          - runner_plugin: "api"
            config:
              provider: "openai"
              model_name: "gpt-4o-mini"
              api_key: "${OPENAI_API_KEY}"
              system_prompt: "You are a helpful assistant."

        # Browser runner (Steel ChatGPT)
        runners:
          - runner_plugin: "steel-chatgpt"
            config:
              steel_api_key: "${STEEL_API_KEY}"
              target_url: "https://chat.openai.com"
              take_screenshots: true
              session_reuse: true
    """

    runner_plugin: str
    config: dict

    @field_validator("runner_plugin")
    @classmethod
    def validate_runner_plugin(cls, v: str) -> str:
        """Validate runner_plugin is non-empty."""
        if not v or v.isspace():
            raise ValueError("runner_plugin cannot be empty")
        return v

    @field_validator("config")
    @classmethod
    def validate_config(cls, v: dict) -> dict:
        """Validate config is a non-empty dictionary."""
        if not v:
            raise ValueError("config cannot be empty")
        return v


class ExtractionModelConfig(BaseModel):
    """
    Extraction model configuration (project-level).

    Defines which model performs structured extraction from LLM answers.
    Separate from answer-generating models for cost/latency optimization.

    Attributes:
        provider: LLM provider name (openai, anthropic, google, mistral)
        model_name: Specific model identifier (e.g., "gpt-5-nano")
        env_api_key: Environment variable name containing the API key
        system_prompt: Optional relative path to system prompt JSON
    """

    provider: Literal["openai", "anthropic", "google", "mistral", "grok", "perplexity"]
    model_name: str
    env_api_key: str
    system_prompt: str | None = None

    @field_validator("model_name")
    @classmethod
    def validate_model_name(cls, v: str) -> str:
        """Validate model_name is non-empty."""
        if not v or v.isspace():
            raise ValueError("model_name cannot be empty")
        return v

    @field_validator("env_api_key")
    @classmethod
    def validate_env_api_key(cls, v: str) -> str:
        """Validate env_api_key is non-empty."""
        if not v or v.isspace():
            raise ValueError("env_api_key cannot be empty")
        return v


class ExtractionSettings(BaseModel):
    """
    Extraction configuration (project-level).

    Controls HOW brand mentions are extracted from LLM answers.
    Function calling uses structured output for higher accuracy and lower latency.

    Attributes:
        extraction_model: Model configuration for extraction (e.g., gpt-5-nano)
        method: Extraction method - "function_calling", "regex", or "hybrid"
        fallback_to_regex: If true, fall back to regex when function calling fails
        min_confidence: Minimum confidence threshold (0.0-1.0) for accepting results
        enable_sentiment_analysis: Extract sentiment/context for each brand mention (default: True)
        enable_intent_classification: Classify user query intent before extraction (default: True)

    Example:
        # Optimized for cost and latency
        extraction_settings:
          extraction_model:
            provider: "openai"
            model_name: "gpt-5-nano"
            env_api_key: "OPENAI_API_KEY"
          method: "function_calling"
          fallback_to_regex: true
          min_confidence: 0.7
    """

    extraction_model: ExtractionModelConfig
    method: Literal["function_calling", "regex", "hybrid"] = "function_calling"
    fallback_to_regex: bool = True
    min_confidence: float = 0.7
    enable_sentiment_analysis: bool = True
    enable_intent_classification: bool = True

    @field_validator("min_confidence")
    @classmethod
    def validate_confidence(cls, v: float) -> float:
        """Validate min_confidence is between 0.0 and 1.0."""
        if not 0.0 <= v <= 1.0:
            raise ValueError(f"min_confidence must be between 0.0 and 1.0, got: {v}")
        return v


class RunSettings(BaseModel):
    """
    Runtime settings for watcher execution.

    Defines output locations, which models to use, and feature flags.

    Attributes:
        output_dir: Directory for run artifacts (JSON files, HTML reports)
        sqlite_db_path: Path to SQLite database for historical tracking
        max_concurrent_requests: Maximum number of parallel API requests (default: 10)
                                Respects provider rate limits. Range: 1-50.
        models: List of LLM models to query for each intent (LEGACY - use runners instead)
               Optional when using the new runners format
        operation_models: List of LLM models used ONLY for operations, not intent queries
                         Enables strategic model selection (e.g., reasoning models for analysis)
                         Optional - if empty, operations fall back to models list
        use_llm_rank_extraction: Enable LLM-assisted ranking (slower, more accurate)
        budget: Optional budget controls to prevent runaway costs
    """

    output_dir: str
    sqlite_db_path: str
    max_concurrent_requests: int = 10
    models: list[ModelConfig] = []  # Now optional with default empty list
    operation_models: list[ModelConfig] = []  # Models used only for operations
    use_llm_rank_extraction: bool = False
    budget: BudgetConfig | None = None

    @field_validator("output_dir")
    @classmethod
    def validate_output_dir(cls, v: str) -> str:
        """Validate output_dir is non-empty."""
        if not v or v.isspace():
            raise ValueError("output_dir cannot be empty")
        return v

    @field_validator("sqlite_db_path")
    @classmethod
    def validate_sqlite_db_path(cls, v: str) -> str:
        """Validate sqlite_db_path is non-empty."""
        if not v or v.isspace():
            raise ValueError("sqlite_db_path cannot be empty")
        return v

    @field_validator("max_concurrent_requests")
    @classmethod
    def validate_max_concurrent_requests(cls, v: int) -> int:
        """
        Validate max_concurrent_requests is within safe limits.

        Conservative range prevents overwhelming API rate limits while
        allowing reasonable parallelism. Based on provider rate limit research:
        - OpenAI: ~5-10 concurrent recommended
        - Anthropic: Limited concurrency reported
        - Google Gemini: 3 concurrent sessions per API key
        """
        if not 1 <= v <= 50:
            raise ValueError(
                f"max_concurrent_requests must be between 1 and 50 (got: {v})"
            )
        return v

    @field_validator("models")
    @classmethod
    def validate_models(cls, v: list[ModelConfig]) -> list[ModelConfig]:
        """
        Validate models list format (uniqueness check only).

        Note: Empty list is now valid when using the new runners format.
        The actual validation that either models or runners is configured
        happens at WatcherConfig level.
        """
        # Just return the list - WatcherConfig.validate_models_or_runners
        # will ensure either models or runners is configured
        return v

    @field_validator("operation_models")
    @classmethod
    def validate_operation_models(cls, v: list[ModelConfig]) -> list[ModelConfig]:
        """
        Validate operation_models list format.

        Note: Empty list is valid - operations will fall back to models list.
        This field enables strategic model selection where expensive/specialized
        models (e.g., o3-mini reasoning) are used only for post-query analysis,
        not for the initial intent queries.
        """
        return v


class Brands(BaseModel):
    """
    Brand alias collections for mention detection.

    Defines which brand names represent "us" vs competitors for tracking
    in LLM responses.

    IMPORTANT: Each brand in both 'mine' and 'competitors' is tracked separately.
    If you have multiple products to track (e.g., "ProductA" and "ProductB"),
    list them as separate items - they will be tracked independently.

    For brand aliases (e.g., "Warmly" and "Warmly.io" both refer to the same product),
    the system uses exact and fuzzy matching to detect variations. However, if you
    need explicit alias support, list the primary name first alphabetically.

    Attributes:
        mine: List of brands representing "us" (required, min 1)
              Each brand is tracked separately in database and reports
              Sorted alphabetically for deterministic processing
        competitors: List of competitor brand names (optional)
                    Each competitor is tracked separately
                    Sorted alphabetically for deterministic processing

    Example:
        # Single product with variations detected via fuzzy matching:
        brands:
          mine:
            - "Warmly"  # Fuzzy matching will catch "Warmly.io", "warmly", etc.
          competitors:
            - "HubSpot"
            - "Instantly"

        # Multiple products tracked separately:
        brands:
          mine:
            - "ProductA"  # Tracked independently
            - "ProductB"  # Tracked independently
          competitors:
            - "CompetitorX"
    """

    mine: list[str]
    competitors: list[str] = []

    @field_validator("mine")
    @classmethod
    def validate_mine(cls, v: list[str]) -> list[str]:
        """
        Validate and normalize 'mine' brand aliases with deterministic ordering.

        Removes empty/whitespace-only entries, ensures at least one valid alias,
        and sorts alphabetically for stable normalization across config changes.

        CRITICAL: Alphabetical sorting ensures the same primary brand name even if
        YAML order changes, preventing historical data inconsistencies.
        """
        # Remove empty/whitespace-only entries
        cleaned = [b.strip() for b in v if b and not b.isspace()]
        if not cleaned:
            raise ValueError("At least one brand alias required in 'mine'")

        # Sort alphabetically for deterministic normalization
        # Primary brand name will be the alphabetically first alias
        cleaned.sort()

        return cleaned

    @field_validator("competitors")
    @classmethod
    def validate_competitors(cls, v: list[str]) -> list[str]:
        """
        Validate competitor brand aliases with deterministic ordering.

        Removes empty/whitespace-only entries, sorts alphabetically for stability.
        Empty competitor list is allowed.
        """
        # Remove empty/whitespace-only entries
        cleaned = [b.strip() for b in v if b and not b.isspace()]

        # Sort alphabetically for deterministic processing
        cleaned.sort()

        return cleaned


class Operation(BaseModel):
    """
    Custom post-intent operation configuration.

    Operations allow users to perform additional LLM-based analysis on intent
    responses. They support template variables, dependency chaining, and
    conditional execution.

    Template variables available in prompt field:
        {brand:mine} - Primary brand name (alphabetically first)
        {brand:mine_all} - All brand aliases as comma-separated list
        {brand:competitors} - All competitor names as comma-separated list
        {competitors:mentioned} - Competitors detected in response
        {intent:id} - Intent identifier
        {intent:prompt} - Original intent prompt text
        {intent:response} - Raw LLM response text
        {rank:mine} - My brand's detected rank (or "not found")
        {mentions:mine} - All mentions of my brand
        {mentions:competitors} - All competitor mentions
        {operation:operation_id} - Output from previous operation (chaining)
        {model:provider} - Model provider (e.g., "openai")
        {model:name} - Model name (e.g., "gpt-4o-mini")
        {run:id} - Run ID timestamp
        {run:timestamp} - UTC timestamp

    Attributes:
        id: Unique operation identifier (alphanumeric, hyphens, underscores)
        description: Human-readable description for reports/logs
        prompt: Template prompt with variable substitution
        model: Optional model override (defaults to intent's model if not specified)
        enabled: Enable/disable operation without removing from config
        depends_on: List of operation IDs this depends on (for chaining)
        condition: Optional condition string for conditional execution
        output_format: Expected output format ("text" or "json")
        type: Operation type - "standard" (default), "structured" (function calling), or "webhook"
        function_schema: Optional inline function calling schema (for type="structured")
        function_template: Optional built-in function template name (for type="structured")
        function_params: Optional parameters to override in function template

    Example (standard operation - backward compatible):
        operations:
          - id: "content-gaps"
            description: "Identify content opportunities"
            prompt: |
              Analyze how to improve ranking for {brand:mine}.
              Current rank: {rank:mine}
              Response: {intent:response}
            model: "gpt-4o-mini"
            # type: "standard" is default, no need to specify

    Example (structured operation with inline schema):
        operations:
          - id: "extract-features"
            type: "structured"
            function_schema:
              type: "function"
              name: "extract_features"
              parameters:
                type: "object"
                properties:
                  products:
                    type: "array"
                    items:
                      type: "object"
                      properties:
                        name: {type: "string"}
                        features: {type: "array", items: {type: "string"}}
            prompt: "Extract features from: {intent:response}"

    Example (structured operation with built-in template):
        operations:
          - id: "generate-actions"
            type: "structured"
            function_template: "generate_action_items"
            prompt: "Generate action items based on: {operation:gap-analysis}"
    """

    id: str
    description: str | None = None
    prompt: str
    model: str | None = None
    enabled: bool = True
    depends_on: list[str] = []
    condition: str | None = None
    output_format: Literal["text", "json"] = "text"
    type: Literal["standard", "structured", "webhook"] = "standard"

    # Function calling support (for type="structured")
    function_schema: dict | None = None
    function_template: str | None = None
    function_params: dict | None = None

    @field_validator("id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        """
        Validate operation ID is a valid slug.

        Must be non-empty and contain only alphanumeric characters,
        hyphens, and underscores.
        """
        if not v or v.isspace():
            raise ValueError("Operation ID cannot be empty")
        # Check for valid slug format (alphanumeric, hyphens, underscores)
        if not all(c.isalnum() or c in "-_" for c in v):
            raise ValueError(
                f"Operation ID must be alphanumeric with hyphens/underscores: {v}"
            )
        return v

    @field_validator("prompt")
    @classmethod
    def validate_prompt(cls, v: str) -> str:
        """
        Validate prompt is non-empty and within length limits.

        Prevents excessively long prompts that could cause runaway API costs.
        """
        if not v or v.isspace():
            raise ValueError("Operation prompt cannot be empty")

        from llm_answer_watcher.config.constants import MAX_PROMPT_LENGTH

        if len(v) > MAX_PROMPT_LENGTH:
            raise ValueError(
                f"Operation prompt exceeds maximum length of {MAX_PROMPT_LENGTH:,} "
                f"characters (received {len(v):,} characters)"
            )
        return v

    @field_validator("depends_on")
    @classmethod
    def validate_depends_on(cls, v: list[str]) -> list[str]:
        """
        Validate depends_on list contains valid operation IDs.

        Checks for empty strings and duplicate dependencies.
        Circular dependency detection happens at WatcherConfig level.
        """
        if not v:
            return v

        # Remove empty/whitespace-only entries
        cleaned = [dep.strip() for dep in v if dep and not dep.strip().isspace()]

        # Check for duplicates
        if len(cleaned) != len(set(cleaned)):
            duplicates = {dep for dep in cleaned if cleaned.count(dep) > 1}
            raise ValueError(f"Duplicate operation dependencies found: {duplicates}")

        # Validate each dependency ID format
        for dep in cleaned:
            if not all(c.isalnum() or c in "-_" for c in dep):
                raise ValueError(
                    f"Dependency ID must be alphanumeric with hyphens/underscores: {dep}"
                )

        return cleaned

    @model_validator(mode="after")
    def validate_structured_operations(self) -> "Operation":
        """
        Validate structured operations have function schema or template.

        For type="structured", either function_schema or function_template
        must be specified. Standard operations don't need these fields.

        Raises:
            ValueError: If structured operation missing function definition
        """
        if self.type == "structured":
            if not self.function_schema and not self.function_template:
                raise ValueError(
                    f"Operation '{self.id}' has type='structured' but no "
                    f"function_schema or function_template defined. "
                    f"Structured operations require function calling schema."
                )

            # Warn if both are specified (function_schema takes precedence)
            if self.function_schema and self.function_template:
                import logging

                logging.warning(
                    f"Operation '{self.id}' has both function_schema and function_template. "
                    f"Using function_schema (function_template will be ignored)."
                )

        return self


class Intent(BaseModel):
    """
    Buyer-intent query configuration.

    Represents a question we repeatedly ask LLMs to monitor brand mentions
    and rankings. Can include custom operations for additional analysis.

    Attributes:
        id: Unique identifier slug (alphanumeric, hyphens, underscores)
        prompt: The actual question to ask the LLM
        operations: Optional list of custom operations to run after this intent completes
    """

    id: str
    prompt: str
    operations: list[Operation] = []

    @field_validator("id")
    @classmethod
    def validate_id(cls, v: str) -> str:
        """
        Validate intent ID is a valid slug.

        Must be non-empty and contain only alphanumeric characters,
        hyphens, and underscores.
        """
        if not v or v.isspace():
            raise ValueError("Intent ID cannot be empty")
        # Check for valid slug format (alphanumeric, hyphens, underscores)
        if not all(c.isalnum() or c in "-_" for c in v):
            raise ValueError(
                f"Intent ID must be alphanumeric with hyphens/underscores: {v}"
            )
        return v

    @field_validator("prompt")
    @classmethod
    def validate_prompt(cls, v: str) -> str:
        """
        Validate prompt is non-empty and within length limits.

        Prevents excessively long prompts that could cause runaway API costs.
        """
        if not v or v.isspace():
            raise ValueError("Intent prompt cannot be empty")

        from llm_answer_watcher.config.constants import MAX_PROMPT_LENGTH

        if len(v) > MAX_PROMPT_LENGTH:
            raise ValueError(
                f"Prompt exceeds maximum length of {MAX_PROMPT_LENGTH:,} characters "
                f"(received {len(v):,} characters)"
            )
        return v

    @field_validator("operations")
    @classmethod
    def validate_operations(cls, v: list[Operation]) -> list[Operation]:
        """
        Validate operations list has unique IDs.

        Circular dependency detection happens at WatcherConfig level
        where we have visibility into all operations.
        """
        if not v:
            return v

        # Check for duplicate operation IDs within this intent
        ids = [op.id for op in v]
        if len(ids) != len(set(ids)):
            duplicates = {op_id for op_id in ids if ids.count(op_id) > 1}
            raise ValueError(f"Duplicate operation IDs found in intent: {duplicates}")

        return v


class WatcherConfig(BaseModel):
    """
    Root configuration model for watcher.config.yaml.

    Validates the entire configuration file structure and enforces
    business rules like unique intent IDs and operation dependencies.

    Supports both legacy format (run_settings.models) and new format (runners)
    for backward compatibility. The new runners format enables browser-based
    runners alongside API-based runners through the plugin system.

    Attributes:
        run_settings: Runtime settings (output paths, models, feature flags)
                     If runners is specified, run_settings.models is optional
        extraction_settings: Optional extraction settings (defaults to regex with first model)
        brands: Brand alias collections (mine vs competitors)
        intents: List of buyer-intent queries to monitor
        global_operations: Operations that run for EVERY intent (applied automatically)
        runners: Optional list of unified runner configurations (NEW!)
                If specified, takes precedence over run_settings.models

    Example (legacy format):
        run_settings:
          models:
            - provider: "openai"
              model_name: "gpt-4o-mini"
              env_api_key: "OPENAI_API_KEY"

    Example (new format):
        runners:
          - runner_plugin: "api"
            config:
              provider: "openai"
              model_name: "gpt-4o-mini"
              api_key: "${OPENAI_API_KEY}"
          - runner_plugin: "steel-chatgpt"
            config:
              steel_api_key: "${STEEL_API_KEY}"
    """

    run_settings: RunSettings
    extraction_settings: ExtractionSettings | None = None
    brands: Brands
    intents: list[Intent]
    global_operations: list[Operation] = []
    runners: list[RunnerConfig] | None = None

    @field_validator("intents")
    @classmethod
    def validate_intents_unique(cls, v: list[Intent]) -> list[Intent]:
        """
        Validate intents list is non-empty and all IDs are unique.

        Raises:
            ValueError: If no intents configured or duplicate IDs found
        """
        if not v:
            raise ValueError("At least one intent must be configured")

        # Check for duplicate IDs
        ids = [intent.id for intent in v]
        if len(ids) != len(set(ids)):
            duplicates = {id for id in ids if ids.count(id) > 1}
            raise ValueError(f"Duplicate intent IDs found: {duplicates}")

        return v

    @field_validator("global_operations")
    @classmethod
    def validate_global_operations_unique(cls, v: list[Operation]) -> list[Operation]:
        """
        Validate global_operations list has unique IDs.

        Raises:
            ValueError: If duplicate operation IDs found in global_operations
        """
        if not v:
            return v

        # Check for duplicate operation IDs
        ids = [op.id for op in v]
        if len(ids) != len(set(ids)):
            duplicates = {op_id for op_id in ids if ids.count(op_id) > 1}
            raise ValueError(
                f"Duplicate operation IDs found in global_operations: {duplicates}"
            )

        return v

    @model_validator(mode="after")
    def validate_models_or_runners(self) -> "WatcherConfig":
        """
        Validate that either models or runners is configured (not both, not neither).

        This ensures backward compatibility while supporting the new runner system.

        Raises:
            ValueError: If neither or both are configured
        """
        has_models = self.run_settings.models and len(self.run_settings.models) > 0
        has_runners = self.runners and len(self.runners) > 0

        if not has_models and not has_runners:
            raise ValueError(
                "Either run_settings.models or runners must be configured. "
                "Use run_settings.models for legacy format, or runners for new format."
            )

        if has_models and has_runners:
            # Both specified - log warning and use runners
            import logging
            logging.warning(
                "Both run_settings.models and runners specified. "
                "Using runners (models will be ignored). "
                "To avoid this warning, remove run_settings.models when using runners."
            )

        return self

    @model_validator(mode="after")
    def validate_operation_dependencies(self) -> "WatcherConfig":
        """
        Validate operation dependencies and detect circular references.

        Checks:
        1. All operation IDs are unique across global_operations and all intents
        2. All depends_on references point to valid operation IDs
        3. No circular dependencies exist

        Raises:
            ValueError: If validation fails
        """
        # Collect all operations and their IDs
        all_operations: dict[str, Operation] = {}

        # Add global operations
        for op in self.global_operations:
            if op.id in all_operations:
                raise ValueError(
                    f"Operation ID '{op.id}' appears in global_operations "
                    "and also in an intent's operations"
                )
            all_operations[op.id] = op

        # Add intent-specific operations
        for intent in self.intents:
            for op in intent.operations:
                if op.id in all_operations:
                    raise ValueError(
                        f"Operation ID '{op.id}' is duplicated across "
                        "global_operations and/or multiple intents"
                    )
                all_operations[op.id] = op

        # Validate all depends_on references
        for op_id, op in all_operations.items():
            for dep_id in op.depends_on:
                if dep_id not in all_operations:
                    raise ValueError(
                        f"Operation '{op_id}' depends on '{dep_id}' "
                        "which does not exist"
                    )

        # Detect circular dependencies using DFS
        def has_cycle(op_id: str, visited: set[str], rec_stack: set[str]) -> bool:
            """
            Detect cycle in dependency graph using DFS.

            Args:
                op_id: Current operation ID being checked
                visited: Set of all visited operation IDs
                rec_stack: Recursion stack for cycle detection

            Returns:
                True if cycle detected, False otherwise
            """
            visited.add(op_id)
            rec_stack.add(op_id)

            # Check all dependencies
            op = all_operations[op_id]
            for dep_id in op.depends_on:
                if dep_id not in visited:
                    if has_cycle(dep_id, visited, rec_stack):
                        return True
                elif dep_id in rec_stack:
                    # Found a back edge - circular dependency
                    return True

            rec_stack.remove(op_id)
            return False

        # Check for cycles starting from each operation
        visited: set[str] = set()
        for op_id in all_operations:
            if op_id not in visited and has_cycle(op_id, visited, set()):
                raise ValueError(
                    f"Circular dependency detected involving operation '{op_id}'"
                )

        return self


class RuntimeModel(BaseModel):
    """
    Resolved model configuration with API key and system prompt.

    Created at runtime after loading API keys from environment variables
    and resolving system prompts from JSON files.
    This is what the LLM runner uses to make API calls.

    Attributes:
        provider: LLM provider name (openai, anthropic, mistral)
        model_name: Specific model identifier
        api_key: Resolved API key from environment (NEVER log this)
        system_prompt: Resolved system prompt text (loaded from JSON file or default)
        tools: Optional list of tool configurations (e.g., [{"type": "web_search"}])
        tool_choice: Tool selection mode ("auto", "required", "none")
    """

    provider: str
    model_name: str
    api_key: str
    system_prompt: str = "You are a helpful AI assistant."
    tools: list[dict] | None = None
    tool_choice: str = "auto"

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        """Validate provider is non-empty."""
        if not v or v.isspace():
            raise ValueError("provider cannot be empty")
        return v

    @field_validator("model_name")
    @classmethod
    def validate_model_name(cls, v: str) -> str:
        """Validate model_name is non-empty."""
        if not v or v.isspace():
            raise ValueError("model_name cannot be empty")
        return v

    @field_validator("api_key")
    @classmethod
    def validate_api_key(cls, v: str) -> str:
        """Validate API key is non-empty."""
        if not v or v.isspace():
            raise ValueError("API key cannot be empty")
        return v

    @field_validator("system_prompt")
    @classmethod
    def validate_system_prompt(cls, v: str) -> str:
        """Validate system prompt is non-empty."""
        if not v or v.isspace():
            raise ValueError("System prompt cannot be empty")
        return v


class RuntimeExtractionModel(BaseModel):
    """
    Resolved extraction model configuration with API key.

    Created at runtime after loading API keys from environment variables
    and resolving system prompts. Used for structured extraction.

    Attributes:
        provider: LLM provider name (openai, anthropic, mistral, google)
        model_name: Specific model identifier (e.g., "gpt-5-nano")
        api_key: Resolved API key from environment (NEVER log this)
        system_prompt: Resolved system prompt text
    """

    provider: str
    model_name: str
    api_key: str
    system_prompt: str = "You are a brand mention extraction assistant."

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        """Validate provider is non-empty."""
        if not v or v.isspace():
            raise ValueError("provider cannot be empty")
        return v

    @field_validator("model_name")
    @classmethod
    def validate_model_name(cls, v: str) -> str:
        """Validate model_name is non-empty."""
        if not v or v.isspace():
            raise ValueError("model_name cannot be empty")
        return v

    @field_validator("api_key")
    @classmethod
    def validate_api_key(cls, v: str) -> str:
        """Validate API key is non-empty."""
        if not v or v.isspace():
            raise ValueError("API key cannot be empty")
        return v

    @field_validator("system_prompt")
    @classmethod
    def validate_system_prompt(cls, v: str) -> str:
        """Validate system prompt is non-empty."""
        if not v or v.isspace():
            raise ValueError("System prompt cannot be empty")
        return v


class RuntimeExtractionSettings(BaseModel):
    """
    Runtime extraction settings with resolved extraction model.

    Created by config.loader after resolving API keys and system prompts.

    Attributes:
        extraction_model: Resolved extraction model configuration
        method: Extraction method ("function_calling", "regex", "hybrid")
        fallback_to_regex: Whether to fall back to regex on errors
        min_confidence: Minimum confidence threshold (0.0-1.0)
        enable_sentiment_analysis: Extract sentiment/context for each brand mention
        enable_intent_classification: Classify user query intent before extraction
    """

    extraction_model: RuntimeExtractionModel
    method: Literal["function_calling", "regex", "hybrid"]
    fallback_to_regex: bool
    min_confidence: float
    enable_sentiment_analysis: bool
    enable_intent_classification: bool


class RuntimeOperation(BaseModel):
    """
    Resolved operation configuration for runtime execution.

    Created by config.loader after resolving model overrides and validating
    dependencies. Contains all information needed to execute the operation.

    Attributes:
        id: Unique operation identifier
        description: Human-readable description
        prompt: Template prompt with variables (not yet rendered)
        runtime_model: Resolved model configuration for this operation
        enabled: Whether operation is enabled
        depends_on: List of operation IDs this depends on
        condition: Optional condition string for conditional execution
        output_format: Expected output format ("text" or "json")
        type: Operation type ("standard", "structured", or "webhook")
        function_schema: Resolved function calling schema (for type="structured")
        function_template: Function template name (for type="structured")
        function_params: Function template parameters (for type="structured")
    """

    id: str
    description: str | None = None
    prompt: str
    runtime_model: RuntimeModel | None = None
    enabled: bool = True
    depends_on: list[str] = []
    condition: str | None = None
    output_format: Literal["text", "json"] = "text"
    type: Literal["standard", "structured", "webhook"] = "standard"

    # Function calling support (for type="structured")
    function_schema: dict | None = None
    function_template: str | None = None
    function_params: dict | None = None


class RuntimeConfig(BaseModel):
    """
    Runtime configuration with resolved API keys.

    Created by config.loader after validating YAML and resolving
    environment variables. This is the contract passed to the runner.

    Supports both legacy format (models) and new format (runner_configs).
    If runner_configs is present, it takes precedence over models.

    Attributes:
        run_settings: Runtime settings from config
        extraction_settings: Extraction settings with resolved model (optional)
        brands: Brand aliases from config
        intents: Intent queries from config
        models: Resolved model configurations with API keys (LEGACY)
        operation_models: Resolved model configurations used ONLY for operations
                         Enables strategic model selection (e.g., reasoning models)
                         Optional - if empty, operations fall back to models list
        runner_configs: Resolved runner configurations (NEW)
        global_operations: Operations that run for every intent
    """

    run_settings: RunSettings
    extraction_settings: RuntimeExtractionSettings | None = None
    brands: Brands
    intents: list[Intent]
    models: list[RuntimeModel] = []  # Now optional for backward compatibility
    operation_models: list[RuntimeModel] = []  # Models used only for operations
    runner_configs: list[RunnerConfig] | None = None  # New format
    global_operations: list[RuntimeOperation] = []

    @model_validator(mode="after")
    def validate_models_or_runners(self) -> "RuntimeConfig":
        """
        Validate that either models, operation_models, or runner_configs is configured.

        Raises:
            ValueError: If none are configured
        """
        has_models = self.models and len(self.models) > 0
        has_operation_models = self.operation_models and len(self.operation_models) > 0
        has_runners = self.runner_configs and len(self.runner_configs) > 0

        if not has_models and not has_operation_models and not has_runners:
            raise ValueError(
                "At least one of models, operation_models, or runner_configs "
                "must be configured in runtime config"
            )

        return self
