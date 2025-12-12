"""
SQLite database storage for evaluation framework results.

This module provides database setup and operations for persisting evaluation
results with schema versioning and migration support. All timestamps are stored
in ISO 8601 format with 'Z' suffix (UTC).

The database tracks:
- eval_runs: Each evaluation execution with summary statistics
- eval_results: Detailed metric results for each test case

Schema versioning ensures safe upgrades as features evolve.

Example usage:
    >>> from storage.eval_db import init_eval_db_if_needed, insert_eval_run
    >>> init_eval_db_if_needed("./output/evals/eval_results.db")
    >>> run_id = insert_eval_run(conn, summary_data)
    # Creates database with eval schema if needed

Security:
    - ALL queries use parameterized statements to prevent SQL injection
    - Connection context managers ensure proper cleanup
"""

import logging
import sqlite3
from pathlib import Path
from typing import Any

from ..utils.time import utc_timestamp

logger = logging.getLogger(__name__)

# Current schema version for eval database - increment when migrations are added
EVAL_CURRENT_SCHEMA_VERSION = 1


def init_eval_db_if_needed(db_path: str) -> None:
    """
    Initialize SQLite database for evaluation results with schema versioning.

    Creates the database file if it doesn't exist, initializes the schema_version
    table, checks the current schema version, and applies any needed migrations.

    This function is idempotent - safe to call multiple times. If the database
    already exists at the current schema version, it's a no-op.

    Args:
        db_path: Filesystem path to SQLite eval database file.
                 Parent directory must exist or be creatable.

    Raises:
        sqlite3.Error: If database creation or migration fails
        OSError: If parent directory cannot be created
        PermissionError: If database file is not writable

    Example:
        >>> init_eval_db_if_needed("./output/evals/eval_results.db")
        # First call: creates database with eval v1 schema
        # Subsequent calls: no-op if schema is current

    Note:
        Uses transactions to ensure atomic schema migrations.
        If migration fails, database is rolled back to previous state.
        Always call this before performing eval database operations.
    """
    # Ensure parent directory exists
    db_path_obj = Path(db_path)
    db_path_obj.parent.mkdir(parents=True, exist_ok=True)

    # Connect to database (creates file if doesn't exist)
    with sqlite3.connect(db_path) as conn:
        # Enable foreign key constraints (disabled by default in SQLite)
        conn.execute("PRAGMA foreign_keys = ON")

        # Initialize schema_version table if needed
        conn.execute("""
            CREATE TABLE IF NOT EXISTS eval_schema_version (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            )
        """)
        conn.commit()

        # Check current schema version
        current_version = get_eval_schema_version(conn)

        if current_version < EVAL_CURRENT_SCHEMA_VERSION:
            logger.info(
                f"Eval database schema upgrade needed: "
                f"v{current_version} -> v{EVAL_CURRENT_SCHEMA_VERSION}"
            )
            apply_eval_migrations(conn, current_version, EVAL_CURRENT_SCHEMA_VERSION)
            logger.info(
                f"Eval database schema upgraded to v{EVAL_CURRENT_SCHEMA_VERSION}"
            )
        elif current_version == EVAL_CURRENT_SCHEMA_VERSION:
            logger.debug(
                f"Eval database schema is current (v{EVAL_CURRENT_SCHEMA_VERSION})"
            )
        else:
            # This should never happen unless someone manually edited schema_version
            raise ValueError(
                f"Eval database schema version {current_version} is newer than "
                f"expected {EVAL_CURRENT_SCHEMA_VERSION}. Update your software or "
                f"use a different database file."
            )


def get_eval_schema_version(conn: sqlite3.Connection) -> int:
    """
    Get current eval schema version from database.

    Queries the eval_schema_version table to determine which version of the schema
    is currently applied. Returns 0 if no version has been recorded (fresh database).

    Args:
        conn: Active SQLite database connection

    Returns:
        int: Current eval schema version (0 if no migrations applied yet)

    Example:
        >>> with sqlite3.connect("eval_results.db") as conn:
        ...     version = get_eval_schema_version(conn)
        ...     print(f"Eval schema version: {version}")
        Eval schema version: 1

    Note:
        This function does NOT create the eval_schema_version table.
        Call init_eval_db_if_needed() first to ensure table exists.
    """
    cursor = conn.execute("SELECT MAX(version) FROM eval_schema_version")
    result = cursor.fetchone()[0]

    # MAX() returns None if table is empty
    return result if result is not None else 0


def apply_eval_migrations(
    conn: sqlite3.Connection, from_version: int, to_version: int
) -> None:
    """
    Apply eval schema migrations from one version to another.

    Upgrades the eval database schema by applying all migrations between from_version
    and to_version (inclusive). Each migration runs in a transaction and is
    committed atomically. The eval_schema_version table is updated after successful
    migration.

    Args:
        conn: Active SQLite database connection
        from_version: Starting eval schema version (0 for fresh database)
        to_version: Target eval schema version (usually EVAL_CURRENT_SCHEMA_VERSION)

    Raises:
        sqlite3.Error: If any migration SQL fails (transaction rolled back)
        ValueError: If from_version > to_version (downgrades not supported)

    Example:
        >>> with sqlite3.connect("eval_results.db") as conn:
        ...     # Upgrade from v0 to v1
        ...     apply_eval_migrations(conn, 0, 1)
        ...     # Database now has eval_runs, eval_results tables

    Note:
        Migrations are applied sequentially. If migration to version N fails,
        database remains at version N-1. Partial migrations are rolled back.
    """
    if from_version > to_version:
        raise ValueError(
            f"Cannot downgrade eval schema from v{from_version} to v{to_version}. "
            f"Downgrades are not supported. Use a database backup instead."
        )

    # Apply each migration in sequence
    for target_version in range(from_version + 1, to_version + 1):
        logger.info(f"Applying eval migration to schema version {target_version}")

        # Use transaction for atomic migration
        try:
            conn.execute("BEGIN")

            if target_version == 1:
                _migrate_eval_to_v1(conn)
            # Future migrations go here:
            # elif target_version == 2:
            #     _migrate_eval_to_v2(conn)
            else:
                raise ValueError(
                    f"No eval migration defined for version {target_version}"
                )

            # Record successful migration
            timestamp = utc_timestamp()
            conn.execute(
                "INSERT INTO eval_schema_version (version, applied_at) VALUES (?, ?)",
                (target_version, timestamp),
            )

            conn.commit()
            logger.info(
                f"Successfully migrated eval database to version {target_version} "
                f"at {timestamp}"
            )

        except Exception as e:
            conn.rollback()
            logger.error(
                f"Eval migration to version {target_version} failed: {e}", exc_info=True
            )
            raise sqlite3.Error(
                f"Failed to migrate eval database to version {target_version}: {e}"
            ) from e


def _migrate_eval_to_v1(conn: sqlite3.Connection) -> None:
    """
    Migrate eval database schema to version 1.

    Creates initial tables for the evaluation framework:
    - eval_runs: Track each evaluation execution with run_id, timestamp, summary stats
    - eval_results: Store detailed metric results for each test case

    Also creates indexes for common query patterns:
    - Timestamp-based queries (time series analysis of eval performance)
    - Test case filtering
    - Metric name lookups
    - Pass/fail status queries

    Args:
        conn: Active SQLite database connection in transaction

    Raises:
        sqlite3.Error: If table creation or index creation fails

    Note:
        This migration is called automatically by apply_eval_migrations().
        Do NOT call directly - use apply_eval_migrations() instead.

        Schema design principles:
        - UNIQUE constraints prevent duplicate eval runs
        - Foreign keys maintain referential integrity
        - Indexes optimize common query patterns
        - TEXT fields use ISO 8601 timestamps with 'Z' suffix
        - REAL fields store metric values between 0.0 and 1.0
        - INTEGER fields store boolean values (0/1) per SQLite convention
    """
    # Create eval_runs table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS eval_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT UNIQUE NOT NULL,
            timestamp_utc TEXT NOT NULL,
            total_test_cases INTEGER NOT NULL,
            total_passed INTEGER NOT NULL,
            total_failed INTEGER NOT NULL,
            pass_rate REAL NOT NULL,
            summary_json TEXT,
            created_at TEXT NOT NULL
        )
    """)

    # Create eval_results table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS eval_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            eval_run_id TEXT NOT NULL,
            test_description TEXT NOT NULL,
            overall_passed INTEGER NOT NULL,
            metric_name TEXT NOT NULL,
            metric_value REAL NOT NULL,
            metric_passed INTEGER NOT NULL,
            metric_details_json TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (eval_run_id) REFERENCES eval_runs(run_id),
            UNIQUE(eval_run_id, test_description, metric_name)
        )
    """)

    # Create indexes for common queries
    # Timestamp indexes for time series analysis
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_eval_runs_timestamp
        ON eval_runs(timestamp_utc)
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_eval_results_timestamp
        ON eval_results(created_at)
    """)

    # Run ID index for quick lookups
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_eval_results_run_id
        ON eval_results(eval_run_id)
    """)

    # Metric name index for filtering by metric type
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_eval_results_metric_name
        ON eval_results(metric_name)
    """)

    # Pass/fail status indexes for regression analysis
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_eval_runs_pass_rate
        ON eval_runs(pass_rate)
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_eval_results_passed
        ON eval_results(overall_passed)
    """)

    logger.debug("Created eval schema v1 tables and indexes")


# ============================================================================
# Eval Database Operations (CRUD)
# ============================================================================


def insert_eval_run(
    conn: sqlite3.Connection,
    run_id: str,
    summary: dict[str, Any],
) -> str:
    """
    Insert a new evaluation run record into the eval_runs table.

    Records the start of an evaluation execution with summary statistics.
    Returns the run_id for use in subsequent eval_results inserts.

    Args:
        conn: Active SQLite database connection
        run_id: Unique run identifier (usually timestamp-based)
        summary: Summary statistics from eval_results

    Returns:
        str: The run_id that was inserted

    Raises:
        sqlite3.Error: If database operation fails

    Example:
        >>> summary = {
        ...     "pass_rate": 0.85,
        ...     "total_test_cases": 10,
        ...     "total_passed": 8,
        ...     "total_failed": 2,
        ...     "average_scores": {"mention_precision": 0.9, "mention_recall": 0.8}
        ... }
        >>> run_id = insert_eval_run(conn, "2025-11-02T08-00-00Z", summary)
        >>> conn.commit()

    Security:
        Uses parameterized query to prevent SQL injection.

    Note:
        Always call conn.commit() after insert to persist changes.
        summary_json is stored as JSON string for flexible schema evolution.
    """
    import json

    timestamp = utc_timestamp()
    summary_json = json.dumps(summary, separators=(",", ":"))

    conn.execute(
        """
        INSERT OR REPLACE INTO eval_runs (
            run_id,
            timestamp_utc,
            total_test_cases,
            total_passed,
            total_failed,
            pass_rate,
            summary_json,
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            run_id,
            timestamp,
            summary.get("total_test_cases", 0),
            summary.get("total_passed", 0),
            summary.get("total_failed", 0),
            summary.get("pass_rate", 0.0),
            summary_json,
            timestamp,
        ),
    )
    logger.debug(
        f"Inserted eval run {run_id} with {summary.get('total_passed', 0)}/{summary.get('total_test_cases', 0)} passed"
    )
    return run_id


def insert_eval_result(
    conn: sqlite3.Connection,
    eval_run_id: str,
    test_description: str,
    overall_passed: bool,
    metric_name: str,
    metric_value: float,
    metric_passed: bool,
    metric_details: dict[str, Any] | None = None,
) -> None:
    """
    Insert a single evaluation metric result into the eval_results table.

    Records one metric for a test case. Call this multiple times for each test case
    to store all metrics (precision, recall, F1, etc.).

    Args:
        conn: Active SQLite database connection
        eval_run_id: Run identifier (foreign key to eval_runs.run_id)
        test_description: Description of the test case evaluated
        overall_passed: Whether the test case passed overall
        metric_name: Name of the metric (e.g., "mention_precision")
        metric_value: Numeric value of the metric (0.0 to 1.0)
        metric_passed: Whether the metric meets passing criteria
        metric_details: Optional additional details about the metric

    Raises:
        sqlite3.Error: If database operation fails

    Example:
        >>> insert_eval_result(
        ...     conn,
        ...     eval_run_id="2025-11-02T08-00-00Z",
        ...     test_description="HubSpot mention detection test",
        ...     overall_passed=True,
        ...     metric_name="mention_precision",
        ...     metric_value=0.95,
        ...     metric_passed=True,
        ...     metric_details={"true_positives": 5, "false_positives": 0}
        ... )
        >>> conn.commit()

    Security:
        Uses parameterized query to prevent SQL injection.

    Note:
        Always call conn.commit() after insert to persist changes.
        metric_details_json is stored as JSON string for flexible schema.
        overall_passed and metric_passed are stored as INTEGER (0/1).
    """
    import json

    timestamp = utc_timestamp()
    overall_passed_int = 1 if overall_passed else 0
    metric_passed_int = 1 if metric_passed else 0
    metric_details_json = (
        json.dumps(metric_details, separators=(",", ":")) if metric_details else None
    )

    conn.execute(
        """
        INSERT OR REPLACE INTO eval_results (
            eval_run_id,
            test_description,
            overall_passed,
            metric_name,
            metric_value,
            metric_passed,
            metric_details_json,
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            eval_run_id,
            test_description,
            overall_passed_int,
            metric_name,
            metric_value,
            metric_passed_int,
            metric_details_json,
            timestamp,
        ),
    )
    logger.debug(
        f"Inserted eval result: {metric_name}={metric_value:.3f} (passed={metric_passed}) "
        f"for test '{test_description}'"
    )


def store_eval_results(
    conn: sqlite3.Connection,
    eval_results: dict[str, Any],
    run_id: str | None = None,
) -> str:
    """
    Store complete evaluation results from run_eval_suite().

    Convenience function that stores both the eval run summary and all detailed
    metric results in a single transaction.

    Args:
        conn: Active SQLite database connection
        eval_results: Results dictionary from run_eval_suite()
        run_id: Optional run identifier (generated if not provided)

    Returns:
        str: The run_id that was used/created

    Raises:
        sqlite3.Error: If database operation fails

    Example:
        >>> from evals.runner import run_eval_suite
        >>> results = run_eval_suite("fixtures.yaml")
        >>> with sqlite3.connect("eval_results.db") as conn:
        ...     run_id = store_eval_results(conn, results)
        >>> conn.commit()

    Security:
        Uses parameterized queries to prevent SQL injection.

    Note:
        This function handles both insert_eval_run and multiple insert_eval_result
        calls in a single transaction for atomicity.
    """
    from ..utils.time import run_id_from_timestamp

    if run_id is None:
        run_id = run_id_from_timestamp()

    # Start transaction
    conn.execute("BEGIN")

    try:
        # Insert eval run summary
        insert_eval_run(conn, run_id, eval_results["summary"])

        # Insert detailed results for each test case
        for result in eval_results["results"]:
            test_description = result.test_description
            overall_passed = result.overall_passed

            for metric in result.metrics:
                insert_eval_result(
                    conn,
                    eval_run_id=run_id,
                    test_description=test_description,
                    overall_passed=overall_passed,
                    metric_name=metric.name,
                    metric_value=metric.value,
                    metric_passed=metric.passed,
                    metric_details=metric.details,
                )

        logger.info(
            f"Stored eval results for run {run_id}: "
            f"{eval_results['total_passed']}/{eval_results['total_test_cases']} passed"
        )

    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to store eval results: {e}", exc_info=True)
        raise sqlite3.Error(f"Failed to store eval results: {e}") from e

    return run_id


def get_recent_eval_runs(
    conn: sqlite3.Connection, limit: int = 10
) -> list[dict[str, Any]]:
    """
    Get recent evaluation runs ordered by timestamp.

    Args:
        conn: Active SQLite database connection
        limit: Maximum number of runs to return (default: 10)

    Returns:
        List of dictionaries with eval run information

    Example:
        >>> recent = get_recent_eval_runs(conn, limit=5)
        >>> for run in recent:
        ...     print(f"{run['run_id']}: {run['pass_rate']:.1%} passed")
    """
    import json

    cursor = conn.execute(
        """
        SELECT run_id, timestamp_utc, total_test_cases, total_passed, total_failed,
               pass_rate, summary_json, created_at
        FROM eval_runs
        ORDER BY timestamp_utc DESC
        LIMIT ?
    """,
        (limit,),
    )

    runs = []
    for row in cursor.fetchall():
        summary_json = row[6]
        summary = json.loads(summary_json) if summary_json else {}

        runs.append(
            {
                "run_id": row[0],
                "timestamp_utc": row[1],
                "total_test_cases": row[2],
                "total_passed": row[3],
                "total_failed": row[4],
                "pass_rate": row[5],
                "summary": summary,
                "created_at": row[7],
            }
        )

    return runs


def get_metric_trend(
    conn: sqlite3.Connection, metric_name: str, days: int = 30
) -> list[dict[str, Any]]:
    """
    Get trend data for a specific metric over time.

    Args:
        conn: Active SQLite database connection
        metric_name: Name of the metric to analyze (e.g., "mention_precision")
        days: Number of days to look back (default: 30)

    Returns:
        List of dictionaries with timestamp and average metric value

    Example:
        >>> trend = get_metric_trend(conn, "mention_precision", days=7)
        >>> for point in trend:
        ...     print(f"{point['date']}: {point['avg_value']:.3f}")
    """
    cursor = conn.execute(
        f"""
        SELECT DATE(timestamp_utc) as date, AVG(metric_value) as avg_value, COUNT(*) as count
        FROM eval_results er
        JOIN eval_runs r ON er.eval_run_id = r.run_id
        WHERE er.metric_name = ?
          AND r.timestamp_utc >= datetime('now', '-{days} days')
        GROUP BY DATE(timestamp_utc)
        ORDER BY date
    """,
        (metric_name,),
    )

    trend = []
    for row in cursor.fetchall():
        trend.append(
            {
                "date": row[0],
                "avg_value": row[1],
                "count": row[2],
            }
        )

    return trend


def get_failing_tests(
    conn: sqlite3.Connection, run_id: str | None = None
) -> list[dict[str, Any]]:
    """
    Get failing test cases, optionally filtered by a specific run.

    Args:
        conn: Active SQLite database connection
        run_id: Optional run ID to filter by (if None, gets most recent run)

    Returns:
        List of dictionaries with failing test information

    Example:
        >>> failing = get_failing_tests(conn)
        >>> for test in failing:
        ...     print(f"FAIL: {test['test_description']}")
    """
    if run_id is None:
        # Get most recent run ID
        cursor = conn.execute("""
            SELECT run_id FROM eval_runs
            ORDER BY timestamp_utc DESC
            LIMIT 1
        """)
        row = cursor.fetchone()
        if row is None:
            return []
        run_id = row[0]

    cursor = conn.execute(
        """
        SELECT DISTINCT test_description, COUNT(*) as failed_metrics
        FROM eval_results
        WHERE eval_run_id = ? AND overall_passed = 0
        GROUP BY test_description
        ORDER BY failed_metrics DESC
    """,
        (run_id,),
    )

    failing = []
    for row in cursor.fetchall():
        failing.append(
            {
                "test_description": row[0],
                "failed_metrics": row[1],
            }
        )

    return failing
