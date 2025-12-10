"""
Data export utilities for LLM Answer Watcher.

Exports data from SQLite database to various formats (CSV, JSON) for external analysis.
Supports filtering by run_id, date range, and data type.

Key features:
- Export mentions (brand mentions with rankings)
- Export runs (run summaries with costs)
- CSV format for spreadsheet analysis
- JSON format for programmatic processing
- Date range filtering
- UTF-8 encoding for international characters

Example:
    >>> export_mentions_csv("./output/mentions.csv", db_path="./output/watcher.db")
    >>> export_runs_json("./output/runs.json", db_path="./output/watcher.db", days=30)

Security:
    - Uses parameterized SQL queries (no injection)
    - UTF-8 encoding (no encoding attacks)
    - Read-only database access
"""

import csv
import json
import logging
import sqlite3
from datetime import UTC, datetime, timedelta

logger = logging.getLogger(__name__)


def export_mentions_csv(
    output_path: str,
    db_path: str,
    run_id: str | None = None,
    days: int | None = None,
) -> int:
    """
    Export brand mentions to CSV file.

    Exports the mentions table with all brand mention data including rankings,
    timestamps, and model information. Can filter by run_id or date range.

    Args:
        output_path: Path to output CSV file
        db_path: Path to SQLite database
        run_id: Optional run_id to filter by specific run
        days: Optional number of days to include (e.g., 30 for last 30 days)

    Returns:
        Number of rows exported

    Raises:
        sqlite3.Error: If database query fails
        OSError: If file cannot be written

    Example:
        >>> count = export_mentions_csv(
        ...     "./mentions.csv",
        ...     "./output/watcher.db",
        ...     days=30
        ... )
        >>> print(f"Exported {count} mentions")
        Exported 150 mentions
    """
    # Build query with optional filters
    query = """
        SELECT
            run_id,
            timestamp_utc,
            intent_id,
            model_provider,
            model_name,
            brand_name,
            normalized_name,
            is_mine,
            rank_position,
            match_type
        FROM mentions
        WHERE 1=1
    """
    params = []

    if run_id:
        query += " AND run_id = ?"
        params.append(run_id)

    if days:
        cutoff_date = (datetime.now(UTC) - timedelta(days=days)).isoformat()
        query += " AND timestamp_utc >= ?"
        params.append(cutoff_date)

    query += " ORDER BY timestamp_utc DESC, run_id, intent_id"

    logger.info(f"Exporting mentions to CSV: {output_path}")

    try:
        with sqlite3.connect(db_path) as conn:
            conn.row_factory = sqlite3.Row  # Enable column access by name
            cursor = conn.cursor()
            cursor.execute(query, params)

            rows = cursor.fetchall()
            row_count = len(rows)

            if row_count == 0:
                logger.warning("No mentions found matching criteria")
                # Still create empty file with headers
                rows = []

            # Write to CSV
            with open(output_path, "w", encoding="utf-8", newline="") as f:
                if rows:
                    fieldnames = rows[0].keys()
                else:
                    # Empty result - use known column names
                    fieldnames = [
                        "run_id",
                        "timestamp_utc",
                        "intent_id",
                        "model_provider",
                        "model_name",
                        "brand_name",
                        "normalized_name",
                        "is_mine",
                        "rank_position",
                        "match_type",
                    ]

                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()

                for row in rows:
                    writer.writerow(dict(row))

            logger.info(f"Exported {row_count} mentions to {output_path}")
            return row_count

    except sqlite3.Error as e:
        logger.error(f"Database error during export: {e}", exc_info=True)
        raise
    except OSError as e:
        logger.error(f"File write error: {e}", exc_info=True)
        raise


def export_mentions_json(
    output_path: str,
    db_path: str,
    run_id: str | None = None,
    days: int | None = None,
) -> int:
    """
    Export brand mentions to JSON file.

    Exports the mentions table as a JSON array. Each mention is a dict with
    all fields. Can filter by run_id or date range.

    Args:
        output_path: Path to output JSON file
        db_path: Path to SQLite database
        run_id: Optional run_id to filter by specific run
        days: Optional number of days to include

    Returns:
        Number of records exported

    Example:
        >>> count = export_mentions_json(
        ...     "./mentions.json",
        ...     "./output/watcher.db"
        ... )
    """
    # Build query with optional filters
    query = """
        SELECT
            run_id,
            timestamp_utc,
            intent_id,
            model_provider,
            model_name,
            brand_name,
            normalized_name,
            is_mine,
            rank_position,
            match_type
        FROM mentions
        WHERE 1=1
    """
    params = []

    if run_id:
        query += " AND run_id = ?"
        params.append(run_id)

    if days:
        cutoff_date = (datetime.now(UTC) - timedelta(days=days)).isoformat()
        query += " AND timestamp_utc >= ?"
        params.append(cutoff_date)

    query += " ORDER BY timestamp_utc DESC, run_id, intent_id"

    logger.info(f"Exporting mentions to JSON: {output_path}")

    try:
        with sqlite3.connect(db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(query, params)

            rows = cursor.fetchall()
            row_count = len(rows)

            # Convert to list of dicts
            mentions = [dict(row) for row in rows]

            # Write to JSON
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(mentions, f, indent=2, ensure_ascii=False)
                f.write("\n")  # POSIX compliance

            logger.info(f"Exported {row_count} mentions to {output_path}")
            return row_count

    except sqlite3.Error as e:
        logger.error(f"Database error during export: {e}", exc_info=True)
        raise
    except OSError as e:
        logger.error(f"File write error: {e}", exc_info=True)
        raise


def export_runs_csv(output_path: str, db_path: str, days: int | None = None) -> int:
    """
    Export run summaries to CSV file.

    Exports the runs table with summary information about each CLI execution:
    run_id, timestamp, costs, query counts, etc.

    Args:
        output_path: Path to output CSV file
        db_path: Path to SQLite database
        days: Optional number of days to include

    Returns:
        Number of rows exported

    Example:
        >>> count = export_runs_csv(
        ...     "./runs.csv",
        ...     "./output/watcher.db",
        ...     days=90
        ... )
    """
    query = """
        SELECT
            run_id,
            timestamp_utc,
            total_intents,
            total_models,
            total_cost_usd
        FROM runs
        WHERE 1=1
    """
    params = []

    if days:
        cutoff_date = (datetime.now(UTC) - timedelta(days=days)).isoformat()
        query += " AND timestamp_utc >= ?"
        params.append(cutoff_date)

    query += " ORDER BY timestamp_utc DESC"

    logger.info(f"Exporting runs to CSV: {output_path}")

    try:
        with sqlite3.connect(db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(query, params)

            rows = cursor.fetchall()
            row_count = len(rows)

            if row_count == 0:
                logger.warning("No runs found matching criteria")
                rows = []

            # Write to CSV
            with open(output_path, "w", encoding="utf-8", newline="") as f:
                if rows:
                    fieldnames = rows[0].keys()
                else:
                    fieldnames = [
                        "run_id",
                        "timestamp_utc",
                        "total_intents",
                        "total_models",
                        "total_cost_usd",
                    ]

                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()

                for row in rows:
                    writer.writerow(dict(row))

            logger.info(f"Exported {row_count} runs to {output_path}")
            return row_count

    except sqlite3.Error as e:
        logger.error(f"Database error during export: {e}", exc_info=True)
        raise
    except OSError as e:
        logger.error(f"File write error: {e}", exc_info=True)
        raise


def export_runs_json(output_path: str, db_path: str, days: int | None = None) -> int:
    """
    Export run summaries to JSON file.

    Exports the runs table as a JSON array of run summary objects.

    Args:
        output_path: Path to output JSON file
        db_path: Path to SQLite database
        days: Optional number of days to include

    Returns:
        Number of records exported

    Example:
        >>> count = export_runs_json("./runs.json", "./output/watcher.db")
    """
    query = """
        SELECT
            run_id,
            timestamp_utc,
            total_intents,
            total_models,
            total_cost_usd
        FROM runs
        WHERE 1=1
    """
    params = []

    if days:
        cutoff_date = (datetime.now(UTC) - timedelta(days=days)).isoformat()
        query += " AND timestamp_utc >= ?"
        params.append(cutoff_date)

    query += " ORDER BY timestamp_utc DESC"

    logger.info(f"Exporting runs to JSON: {output_path}")

    try:
        with sqlite3.connect(db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(query, params)

            rows = cursor.fetchall()
            row_count = len(rows)

            # Convert to list of dicts
            runs = [dict(row) for row in rows]

            # Write to JSON
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(runs, f, indent=2, ensure_ascii=False)
                f.write("\n")

            logger.info(f"Exported {row_count} runs to {output_path}")
            return row_count

    except sqlite3.Error as e:
        logger.error(f"Database error during export: {e}", exc_info=True)
        raise
    except OSError as e:
        logger.error(f"File write error: {e}", exc_info=True)
        raise
