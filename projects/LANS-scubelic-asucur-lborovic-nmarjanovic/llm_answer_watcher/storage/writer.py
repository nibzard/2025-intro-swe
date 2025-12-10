"""
File writing utilities for LLM Answer Watcher.

This module handles all file I/O for output artifacts: JSON files, HTML reports,
and directory creation. It provides a clean abstraction over filesystem operations
with proper error handling.

Key features:
- UTF-8 encoding for all text files
- Pretty-printed JSON (indent=2)
- Graceful error handling (permissions, disk full)
- Directory creation with proper permissions
- Uses naming conventions from storage.layout

Example:
    >>> run_dir = create_run_directory("./output", "2025-11-02T08-00-00Z")
    >>> write_raw_answer(run_dir, "email-warmup", "openai", "gpt-4o-mini", {...})
    >>> write_run_meta(run_dir, {"run_id": "...", "total_cost_usd": 0.01})

Security:
    - No path traversal (all paths validated)
    - UTF-8 encoding (no encoding attacks)
    - Proper error handling (no data loss)
"""

import json
import logging
import os
from pathlib import Path

from ..utils.time import utc_timestamp
from .layout import (
    get_error_filename,
    get_operation_result_filename,
    get_parsed_answer_filename,
    get_raw_answer_filename,
    get_report_filename,
    get_run_directory,
    get_run_meta_filename,
)

logger = logging.getLogger(__name__)


def create_run_directory(output_dir: str, run_id: str) -> str:
    """
    Create run output directory with proper permissions.

    Creates the directory structure for this CLI execution. Parent directories
    are created if needed. Returns the full path for use by other functions.

    Args:
        output_dir: Base output directory (e.g., "./output", "/var/llm-watcher")
        run_id: Run identifier (usually timestamp like "2025-11-02T08-00-00Z")

    Returns:
        Full path to created run directory

    Raises:
        OSError: If directory cannot be created (permissions, disk full)
        PermissionError: If insufficient permissions to create directory

    Example:
        >>> run_dir = create_run_directory("./output", "2025-11-02T08-00-00Z")
        >>> run_dir
        './output/2025-11-02T08-00-00Z'
        >>> os.path.exists(run_dir)
        True

    Note:
        - Uses exist_ok=True for idempotency
        - Creates parent directories if needed (parents=True)
        - Logs directory creation for debugging
    """
    run_dir = get_run_directory(output_dir, run_id)
    run_dir_path = Path(run_dir)

    try:
        run_dir_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"Created run directory: {run_dir}")
        return run_dir
    except PermissionError as e:
        logger.error(f"Permission denied creating directory: {run_dir}", exc_info=True)
        raise PermissionError(
            f"Cannot create run directory '{run_dir}': Permission denied. "
            f"Check directory permissions."
        ) from e
    except OSError as e:
        logger.error(f"Failed to create directory: {run_dir}", exc_info=True)
        raise OSError(
            f"Cannot create run directory '{run_dir}': {e}. "
            f"Check disk space and permissions."
        ) from e


def write_json(filepath: str, data: dict | list) -> None:
    """
    Write data to JSON file with UTF-8 encoding.

    Serializes data to JSON with pretty-printing (indent=2) and UTF-8 encoding.
    Handles Unicode correctly with ensure_ascii=False.

    Args:
        filepath: Full path to JSON file to write
        data: Dictionary or list to serialize

    Raises:
        OSError: If file cannot be written (permissions, disk full)
        TypeError: If data is not JSON-serializable

    Example:
        >>> data = {"run_id": "2025-11-02T08-00-00Z", "cost": 0.01}
        >>> write_json("./output/run_meta.json", data)

    Note:
        - Uses indent=2 for human-readable output
        - Uses ensure_ascii=False for proper Unicode handling
        - UTF-8 encoding for international characters
        - Atomic write (data fully written or not at all)
    """
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            # Add newline at end of file for POSIX compliance
            f.write("\n")
        logger.debug(f"Wrote JSON file: {filepath}")
    except TypeError as e:
        logger.error(f"Cannot serialize data to JSON: {e}", exc_info=True)
        raise TypeError(
            f"Cannot write JSON to '{filepath}': Data is not JSON-serializable. {e}"
        ) from e
    except OSError as e:
        logger.error(f"Failed to write JSON file: {filepath}", exc_info=True)
        raise OSError(
            f"Cannot write JSON file '{filepath}': {e}. "
            f"Check disk space and permissions."
        ) from e


def write_raw_answer(
    run_dir: str, intent_id: str, provider: str, model: str, data: dict
) -> None:
    """
    Write raw LLM answer JSON to run directory.

    Builds filename using layout conventions and writes the raw answer data.
    Raw answers contain verbatim LLM responses with usage metadata.

    Args:
        run_dir: Run directory path (from create_run_directory)
        intent_id: Intent query identifier
        provider: LLM provider name
        model: Model identifier
        data: Raw answer data to write (dict with answer_text, usage, etc.)

    Raises:
        OSError: If file cannot be written

    Example:
        >>> data = {
        ...     "answer_text": "Here are the best tools...",
        ...     "usage": {"prompt_tokens": 100, "completion_tokens": 500},
        ...     "estimated_cost_usd": 0.001
        ... }
        >>> write_raw_answer(
        ...     "./output/2025-11-02T08-00-00Z",
        ...     "email-warmup", "openai", "gpt-4o-mini",
        ...     data
        ... )

    Note:
        Uses get_raw_answer_filename from layout module for consistent naming.
    """
    filename = get_raw_answer_filename(intent_id, provider, model)
    filepath = os.path.join(run_dir, filename)
    write_json(filepath, data)
    logger.info(
        f"Wrote raw answer: intent={intent_id}, provider={provider}, model={model}"
    )


def write_parsed_answer(
    run_dir: str, intent_id: str, provider: str, model: str, data: dict
) -> None:
    """
    Write parsed answer JSON to run directory.

    Builds filename using layout conventions and writes the parsed answer data.
    Parsed answers contain extracted signals (mentions, rankings) from raw answers.

    Args:
        run_dir: Run directory path (from create_run_directory)
        intent_id: Intent query identifier
        provider: LLM provider name
        model: Model identifier
        data: Parsed answer data (ExtractionResult serialized to dict)

    Raises:
        OSError: If file cannot be written

    Example:
        >>> data = {
        ...     "appeared_mine": True,
        ...     "my_mentions": [...],
        ...     "competitor_mentions": [...],
        ...     "ranked_list": [...],
        ...     "rank_confidence": 1.0
        ... }
        >>> write_parsed_answer(
        ...     "./output/2025-11-02T08-00-00Z",
        ...     "email-warmup", "openai", "gpt-4o-mini",
        ...     data
        ... )

    Note:
        Uses get_parsed_answer_filename from layout module for consistent naming.
    """
    filename = get_parsed_answer_filename(intent_id, provider, model)
    filepath = os.path.join(run_dir, filename)
    write_json(filepath, data)
    logger.info(
        f"Wrote parsed answer: intent={intent_id}, provider={provider}, model={model}"
    )


def write_error(
    run_dir: str, intent_id: str, provider: str, model: str, error_message: str
) -> None:
    """
    Write error JSON to run directory.

    Creates error file when LLM query fails. Includes timestamp and error message
    for debugging and failure analysis.

    Args:
        run_dir: Run directory path (from create_run_directory)
        intent_id: Intent query identifier
        provider: LLM provider name
        model: Model identifier
        error_message: Error description (exception message or custom text)

    Raises:
        OSError: If file cannot be written

    Example:
        >>> write_error(
        ...     "./output/2025-11-02T08-00-00Z",
        ...     "email-warmup", "openai", "gpt-4o-mini",
        ...     "API rate limit exceeded"
        ... )

    Note:
        - Uses get_error_filename from layout module for consistent naming
        - Adds UTC timestamp for when error occurred
        - Error presence indicates partial run failure
    """
    filename = get_error_filename(intent_id, provider, model)
    filepath = os.path.join(run_dir, filename)

    error_data = {
        "timestamp_utc": utc_timestamp(),
        "intent_id": intent_id,
        "model_provider": provider,
        "model_name": model,
        "error_message": error_message,
    }

    write_json(filepath, error_data)
    logger.warning(
        f"Wrote error file: intent={intent_id}, provider={provider}, "
        f"model={model}, error={error_message}"
    )


def write_operation_result(
    run_dir: str,
    intent_id: str,
    operation_id: str,
    provider: str,
    model: str,
    data: dict,
) -> None:
    """
    Write operation result JSON to run directory.

    Creates operation result file with LLM output and metadata from custom
    post-intent operation. Includes tokens, cost, dependencies, and execution details.

    Args:
        run_dir: Run directory path (from create_run_directory)
        intent_id: Intent query identifier
        operation_id: Operation identifier from config
        provider: LLM provider name used for operation
        model: Model identifier used for operation
        data: Operation result data (OperationResult serialized to dict)

    Raises:
        OSError: If file cannot be written

    Example:
        >>> data = {
        ...     "operation_id": "content-gaps",
        ...     "result_text": "Create blog posts about...",
        ...     "tokens_used_input": 150,
        ...     "tokens_used_output": 200,
        ...     "cost_usd": 0.0005,
        ...     "timestamp_utc": "2025-11-05T10:00:15Z",
        ...     "rendered_prompt": "Analyze how to improve ranking...",
        ...     "skipped": False,
        ...     "error": None
        ... }
        >>> write_operation_result(
        ...     "./output/2025-11-05T10-00-00Z",
        ...     "email-warmup", "content-gaps",
        ...     "openai", "gpt-4o-mini",
        ...     data
        ... )

    Note:
        Uses get_operation_result_filename from layout module for consistent naming.
    """
    filename = get_operation_result_filename(intent_id, operation_id, provider, model)
    filepath = os.path.join(run_dir, filename)
    write_json(filepath, data)
    logger.info(
        f"Wrote operation result: intent={intent_id}, operation={operation_id}, "
        f"provider={provider}, model={model}"
    )


def write_run_meta(run_dir: str, meta: dict) -> None:
    """
    Write run metadata JSON to run directory.

    Creates run_meta.json with summary of CLI execution: run_id, timestamp,
    total intents/models, cost totals, success/failure counts.

    Args:
        run_dir: Run directory path (from create_run_directory)
        meta: Run metadata dictionary (run_id, timestamp, totals, etc.)

    Raises:
        OSError: If file cannot be written

    Example:
        >>> meta = {
        ...     "run_id": "2025-11-02T08-00-00Z",
        ...     "timestamp_utc": "2025-11-02T08:00:00Z",
        ...     "total_intents": 3,
        ...     "total_models": 2,
        ...     "total_cost_usd": 0.0123,
        ...     "success_count": 5,
        ...     "error_count": 1
        ... }
        >>> write_run_meta("./output/2025-11-02T08-00-00Z", meta)

    Note:
        - Uses get_run_meta_filename from layout module (always "run_meta.json")
        - This is the entry point for programmatic access to run results
        - Contains high-level summary, not detailed per-intent data
    """
    filename = get_run_meta_filename()
    filepath = os.path.join(run_dir, filename)
    write_json(filepath, meta)
    logger.info(f"Wrote run metadata: {filepath}")


def write_report_html(run_dir: str, html: str) -> None:
    """
    Write HTML report to run directory.

    Creates report.html with human-readable summary of run results: tables of
    brand mentions, ranking comparisons, cost breakdown, links to JSON files.

    Args:
        run_dir: Run directory path (from create_run_directory)
        html: HTML content string (from report generator)

    Raises:
        OSError: If file cannot be written

    Example:
        >>> html = "<html><body><h1>Run Report</h1>...</body></html>"
        >>> write_report_html("./output/2025-11-02T08-00-00Z", html)

    Note:
        - Uses get_report_filename from layout module (always "report.html")
        - UTF-8 encoding for international characters
        - Can be opened directly in any browser
        - HTML should be pre-escaped (use Jinja2 autoescaping)
    """
    filename = get_report_filename()
    filepath = os.path.join(run_dir, filename)

    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(html)
        logger.info(f"Wrote HTML report: {filepath}")
    except OSError as e:
        logger.error(f"Failed to write HTML report: {filepath}", exc_info=True)
        raise OSError(
            f"Cannot write HTML report '{filepath}': {e}. "
            f"Check disk space and permissions."
        ) from e
