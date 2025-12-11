"""
File naming conventions and path utilities for LLM Answer Watcher.

This module defines consistent naming conventions for output directories
and files. All storage operations use these functions to ensure predictable
file structure for both humans and programmatic access.

Output structure:
    output/
        {run_id}/
            run_meta.json
            report.html
            intent_{id}_raw_{provider}_{model}.json
            intent_{id}_parsed_{provider}_{model}.json
            intent_{id}_error_{provider}_{model}.json
            intent_{id}_operation_{operation_id}_{provider}_{model}.json

Key features:
- Deterministic file naming (no timestamps, no randomness)
- Human-readable structure
- Easy grep/search (intent_id always in filename)
- Safe for filesystem (no special chars)

Example:
    >>> get_run_directory("./output", "2025-11-02T08-00-00Z")
    './output/2025-11-02T08-00-00Z'
    >>> get_raw_answer_filename("email-warmup", "openai", "gpt-4o-mini")
    'intent_email-warmup_raw_openai_gpt-4o-mini.json'
    >>> get_operation_result_filename("email-warmup", "content-gaps", "openai", "gpt-4o-mini")
    'intent_email-warmup_operation_content-gaps_openai_gpt-4o-mini.json'
"""

import os


def get_run_directory(output_dir: str, run_id: str) -> str:
    """
    Get path to run output directory.

    Combines output_dir with run_id to create a unique directory for this
    CLI execution. All artifacts (JSON, HTML) for this run go in this directory.

    Args:
        output_dir: Base output directory path (e.g., "./output", "/var/llm-watcher")
        run_id: Run identifier (usually timestamp like "2025-11-02T08-00-00Z")

    Returns:
        Full path to run directory (e.g., "./output/2025-11-02T08-00-00Z")

    Example:
        >>> get_run_directory("./output", "2025-11-02T08-00-00Z")
        './output/2025-11-02T08-00-00Z'
        >>> get_run_directory("/var/data", "test-run")
        '/var/data/test-run'

    Note:
        Does NOT create the directory - use storage.writer.create_run_directory()
        for that. This function only generates the path string.
    """
    return os.path.join(output_dir, run_id)


def get_raw_answer_filename(intent_id: str, provider: str, model: str) -> str:
    """
    Get filename for raw LLM answer JSON.

    Raw answer file contains the verbatim LLM response with usage metadata
    but no extraction/parsing. Useful for debugging and reprocessing.

    Args:
        intent_id: Intent query identifier (e.g., "email-warmup")
        provider: LLM provider name (e.g., "openai", "anthropic")
        model: Model name (e.g., "gpt-4o-mini", "claude-3-5-sonnet")

    Returns:
        Filename string like "intent_{intent_id}_raw_{provider}_{model}.json"

    Example:
        >>> get_raw_answer_filename("email-warmup", "openai", "gpt-4o-mini")
        'intent_email-warmup_raw_openai_gpt-4o-mini.json'
        >>> get_raw_answer_filename("sales-tools", "anthropic", "claude-3-5-sonnet")
        'intent_sales-tools_raw_anthropic_claude-3-5-sonnet.json'

    Note:
        Filename is filesystem-safe. All parameters are sanitized by config
        validation before reaching this function.
    """
    return f"intent_{intent_id}_raw_{provider}_{model}.json"


def get_parsed_answer_filename(intent_id: str, provider: str, model: str) -> str:
    """
    Get filename for parsed answer JSON.

    Parsed answer file contains extracted signals (mentions, rankings)
    from the raw answer. This is the structured data used for analytics.

    Args:
        intent_id: Intent query identifier (e.g., "email-warmup")
        provider: LLM provider name (e.g., "openai", "anthropic")
        model: Model name (e.g., "gpt-4o-mini", "claude-3-5-sonnet")

    Returns:
        Filename string like "intent_{intent_id}_parsed_{provider}_{model}.json"

    Example:
        >>> get_parsed_answer_filename("email-warmup", "openai", "gpt-4o-mini")
        'intent_email-warmup_parsed_openai_gpt-4o-mini.json'
        >>> get_parsed_answer_filename("sales-tools", "anthropic", "claude-3-5-sonnet")
        'intent_sales-tools_parsed_anthropic_claude-3-5-sonnet.json'

    Note:
        Contains ExtractionResult serialized to JSON. Paired with raw answer
        file for complete data lineage.
    """
    return f"intent_{intent_id}_parsed_{provider}_{model}.json"


def get_error_filename(intent_id: str, provider: str, model: str) -> str:
    """
    Get filename for error JSON.

    Error file is created when LLM query fails (API error, timeout, etc).
    Contains error message and stack trace for debugging.

    Args:
        intent_id: Intent query identifier (e.g., "email-warmup")
        provider: LLM provider name (e.g., "openai", "anthropic")
        model: Model name (e.g., "gpt-4o-mini", "claude-3-5-sonnet")

    Returns:
        Filename string like "intent_{intent_id}_error_{provider}_{model}.json"

    Example:
        >>> get_error_filename("email-warmup", "openai", "gpt-4o-mini")
        'intent_email-warmup_error_openai_gpt-4o-mini.json'
        >>> get_error_filename("sales-tools", "anthropic", "claude-3-5-sonnet")
        'intent_sales-tools_error_anthropic_claude-3-5-sonnet.json'

    Note:
        Presence of error file indicates partial failure. CLI should report
        total error count in final summary.
    """
    return f"intent_{intent_id}_error_{provider}_{model}.json"


def get_run_meta_filename() -> str:
    """
    Get filename for run metadata JSON.

    Run metadata file contains summary of the entire CLI execution:
    - run_id, timestamp, total_intents, total_models
    - cost summary (total_cost_usd)
    - success/failure counts

    Returns:
        Constant filename "run_meta.json"

    Example:
        >>> get_run_meta_filename()
        'run_meta.json'

    Note:
        This file goes in the root of run directory, alongside intent files.
        Always named "run_meta.json" for easy discovery.
    """
    return "run_meta.json"


def get_report_filename() -> str:
    """
    Get filename for HTML report.

    HTML report provides human-readable summary of run results with:
    - Visual tables of brand mentions
    - Ranking comparisons across models
    - Cost breakdown
    - Links to raw JSON files

    Returns:
        Constant filename "report.html"

    Example:
        >>> get_report_filename()
        'report.html'

    Note:
        This file goes in the root of run directory, alongside run_meta.json.
        Always named "report.html" for easy discovery. Opens in any browser.
    """
    return "report.html"


def get_operation_result_filename(
    intent_id: str, operation_id: str, provider: str, model: str
) -> str:
    """
    Get filename for operation result JSON.

    Operation result file contains the output of a custom post-intent operation
    with metadata (tokens, cost, dependencies, etc.).

    Args:
        intent_id: Intent query identifier (e.g., "email-warmup")
        operation_id: Operation identifier (e.g., "content-gaps")
        provider: LLM provider name (e.g., "openai", "anthropic")
        model: Model name (e.g., "gpt-4o-mini", "claude-3-5-sonnet")

    Returns:
        Filename string like "intent_{intent_id}_operation_{operation_id}_{provider}_{model}.json"

    Example:
        >>> get_operation_result_filename("email-warmup", "content-gaps", "openai", "gpt-4o-mini")
        'intent_email-warmup_operation_content-gaps_openai_gpt-4o-mini.json'
        >>> get_operation_result_filename("sales-tools", "action-items", "anthropic", "claude-3-5-sonnet")
        'intent_sales-tools_operation_action-items_anthropic_claude-3-5-sonnet.json'

    Note:
        Filename is filesystem-safe. All parameters are sanitized by config
        validation before reaching this function.
    """
    return f"intent_{intent_id}_operation_{operation_id}_{provider}_{model}.json"
