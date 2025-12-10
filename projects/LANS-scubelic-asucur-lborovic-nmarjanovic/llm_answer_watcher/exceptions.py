"""
Custom exceptions for LLM Answer Watcher.

This module provides a hierarchy of exceptions that enable type-safe error
handling throughout the application. All exceptions inherit from the base
LLMAnswerWatcherError for consistent catching.

Exception Hierarchy:
    LLMAnswerWatcherError (base)
    ├── ConfigurationError
    │   ├── ConfigFileNotFoundError
    │   ├── ConfigValidationError
    │   └── APIKeyMissingError
    ├── DatabaseError
    │   ├── DatabaseInitError
    │   ├── DatabaseMigrationError
    │   └── DatabaseQueryError
    ├── LLMProviderError
    │   ├── LLMAuthenticationError
    │   ├── LLMRateLimitError
    │   ├── LLMTimeoutError
    │   └── LLMResponseError
    ├── BudgetExceededError
    ├── ExtractionError
    │   ├── MentionDetectionError
    │   └── RankExtractionError
    └── ResumeError

Usage:
    from llm_answer_watcher.exceptions import ConfigurationError

    try:
        config = load_config(path)
    except ConfigFileNotFoundError as e:
        logger.error(f"Config file not found: {e}")
        sys.exit(1)
"""


class LLMAnswerWatcherError(Exception):
    """
    Base exception for all LLM Answer Watcher errors.

    All custom exceptions in this application should inherit from this class.
    This enables catching all application-specific errors with a single except clause.

    Example:
        try:
            # application code
            pass
        except LLMAnswerWatcherError as e:
            logger.error(f"Application error: {e}")
    """

    pass


# ============================================================================
# Configuration Errors
# ============================================================================


class ConfigurationError(LLMAnswerWatcherError):
    """
    Base class for configuration-related errors.

    Raised when configuration loading, parsing, or validation fails.
    Should be caught and result in exit code 1 (configuration error).
    """

    pass


class ConfigFileNotFoundError(ConfigurationError):
    """
    Configuration file does not exist at the specified path.

    Example:
        raise ConfigFileNotFoundError("/path/to/config.yaml")
    """

    pass


class ConfigValidationError(ConfigurationError):
    """
    Configuration file is invalid (schema validation failed).

    Should include details about which field(s) failed validation.

    Example:
        raise ConfigValidationError("Field 'intents' must be a non-empty list")
    """

    pass


class APIKeyMissingError(ConfigurationError):
    """
    Required API key environment variable is not set.

    Example:
        raise APIKeyMissingError("OPENAI_API_KEY environment variable not set")
    """

    pass


# ============================================================================
# Database Errors
# ============================================================================


class DatabaseError(LLMAnswerWatcherError):
    """
    Base class for database-related errors.

    Should be caught and result in exit code 2 (database error).
    """

    pass


class DatabaseInitError(DatabaseError):
    """
    Database initialization failed.

    Raised when SQLite database cannot be created or opened.

    Example:
        raise DatabaseInitError("Failed to create database: permission denied")
    """

    pass


class DatabaseMigrationError(DatabaseError):
    """
    Database schema migration failed.

    Raised when migrating from one schema version to another fails.

    Example:
        raise DatabaseMigrationError("Failed to migrate from v1 to v2")
    """

    pass


class DatabaseQueryError(DatabaseError):
    """
    Database query execution failed.

    Raised when a SQL query fails to execute.

    Example:
        raise DatabaseQueryError("Failed to insert run data: constraint violation")
    """

    pass


# ============================================================================
# LLM Provider Errors
# ============================================================================


class LLMProviderError(LLMAnswerWatcherError):
    """
    Base class for LLM provider API errors.

    Should be caught and handled with retry logic or result in partial failure.
    """

    pass


class LLMAuthenticationError(LLMProviderError):
    """
    LLM provider authentication failed (invalid API key).

    This error should NOT be retried as it indicates a configuration issue.

    Example:
        raise LLMAuthenticationError("OpenAI API key is invalid")
    """

    pass


class LLMRateLimitError(LLMProviderError):
    """
    LLM provider rate limit exceeded.

    This error SHOULD be retried with exponential backoff.

    Example:
        raise LLMRateLimitError("OpenAI rate limit exceeded, retry after 60s")
    """

    pass


class LLMTimeoutError(LLMProviderError):
    """
    LLM provider request timed out.

    This error SHOULD be retried a limited number of times.

    Example:
        raise LLMTimeoutError("OpenAI request timed out after 30s")
    """

    pass


class LLMResponseError(LLMProviderError):
    """
    LLM provider returned an invalid or malformed response.

    This includes missing required fields, invalid JSON, or unexpected structure.

    Example:
        raise LLMResponseError("OpenAI response missing 'choices' field")
    """

    pass


# ============================================================================
# Budget Errors
# ============================================================================


class BudgetExceededError(LLMAnswerWatcherError):
    """
    Estimated cost exceeds configured budget limit.

    Raised before execution starts if estimated cost would exceed budget.
    Should result in exit code 1 (configuration error) unless --force used.

    Attributes:
        estimated_cost: float - Estimated cost in USD
        budget_limit: float - Configured budget limit in USD
        budget_type: str - Type of budget exceeded ("per_run" or "per_intent")

    Example:
        raise BudgetExceededError(
            "Estimated cost $1.50 exceeds max_per_run_usd budget of $1.00",
            estimated_cost=1.50,
            budget_limit=1.00,
            budget_type="per_run"
        )
    """

    def __init__(
        self,
        message: str,
        estimated_cost: float | None = None,
        budget_limit: float | None = None,
        budget_type: str | None = None,
    ):
        super().__init__(message)
        self.estimated_cost = estimated_cost
        self.budget_limit = budget_limit
        self.budget_type = budget_type


# ============================================================================
# Extraction Errors
# ============================================================================


class ExtractionError(LLMAnswerWatcherError):
    """
    Base class for brand mention and rank extraction errors.

    These are usually non-fatal and should result in partial data being stored.
    """

    pass


class MentionDetectionError(ExtractionError):
    """
    Failed to detect brand mentions in LLM response.

    This is usually non-fatal; the response is stored but no mentions extracted.

    Example:
        raise MentionDetectionError("Invalid regex pattern for brand 'Hub$pot'")
    """

    pass


class RankExtractionError(ExtractionError):
    """
    Failed to extract ranking information from LLM response.

    This is non-fatal; mentions are stored but without rank positions.

    Example:
        raise RankExtractionError("No numbered list found in response")
    """

    pass


# ============================================================================
# Resume Errors
# ============================================================================


class ResumeError(LLMAnswerWatcherError):
    """
    Failed to resume a previous run.

    Raised when --resume flag is used but previous run cannot be loaded or validated.

    Example:
        raise ResumeError("Cannot resume: run_meta.json not found for run 2025-11-01T08-00-00Z")
    """

    pass
