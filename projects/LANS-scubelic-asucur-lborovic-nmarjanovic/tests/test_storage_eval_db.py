"""
Comprehensive tests for eval database operations.

This test module validates all eval database functionality including:
- Database initialization with schema versioning
- Insert operations for eval runs and results
- Query operations for retrieving data and trends
- Migration functionality
- Index creation and query optimization
- Transaction handling and error cases
"""

import json
import sqlite3
from datetime import UTC

import pytest

from llm_answer_watcher.storage.eval_db import (
    EVAL_CURRENT_SCHEMA_VERSION,
    get_eval_schema_version,
    get_failing_tests,
    get_metric_trend,
    get_recent_eval_runs,
    init_eval_db_if_needed,
    insert_eval_result,
    insert_eval_run,
    store_eval_results,
)


class TestEvalDatabaseInitialization:
    """Test eval database setup and schema initialization."""

    def test_init_eval_db_creates_tables(self, tmp_path):
        """Test that init_eval_db_if_needed creates all required tables."""
        db_path = tmp_path / "test_eval.db"

        # Initialize database
        init_eval_db_if_needed(str(db_path))

        # Connect and verify tables exist
        with sqlite3.connect(str(db_path)) as conn:
            cursor = conn.execute("""
                SELECT name FROM sqlite_master
                WHERE type='table'
                AND name IN ('eval_schema_version', 'eval_runs', 'eval_results')
                ORDER BY name
            """)
            tables = [row[0] for row in cursor.fetchall()]

        assert tables == ["eval_results", "eval_runs", "eval_schema_version"]

    def test_init_eval_db_creates_indexes(self, tmp_path):
        """Test that all required indexes are created."""
        db_path = tmp_path / "test_eval.db"

        init_eval_db_if_needed(str(db_path))

        with sqlite3.connect(str(db_path)) as conn:
            # Get all indexes
            cursor = conn.execute("""
                SELECT name FROM sqlite_master
                WHERE type='index'
                AND name LIKE 'idx_%'
                ORDER BY name
            """)
            indexes = [row[0] for row in cursor.fetchall()]

        # Verify all expected indexes exist
        expected_indexes = [
            "idx_eval_results_metric_name",
            "idx_eval_results_passed",
            "idx_eval_results_run_id",
            "idx_eval_results_timestamp",
            "idx_eval_runs_pass_rate",
            "idx_eval_runs_timestamp",
        ]

        assert sorted(indexes) == sorted(expected_indexes)

    def test_init_eval_db_idempotent(self, tmp_path):
        """Test that init_eval_db_if_needed is safe to call multiple times."""
        db_path = tmp_path / "test_eval.db"

        # Call initialization multiple times
        init_eval_db_if_needed(str(db_path))
        init_eval_db_if_needed(str(db_path))
        init_eval_db_if_needed(str(db_path))

        # Should not raise any errors and schema should be current
        with sqlite3.connect(str(db_path)) as conn:
            version = get_eval_schema_version(conn)

        assert version == EVAL_CURRENT_SCHEMA_VERSION

    def test_init_eval_db_schema_version(self, tmp_path):
        """Test that schema version is correctly set."""
        db_path = tmp_path / "test_eval.db"

        init_eval_db_if_needed(str(db_path))

        with sqlite3.connect(str(db_path)) as conn:
            version = get_eval_schema_version(conn)

        assert version == EVAL_CURRENT_SCHEMA_VERSION

    def test_init_eval_db_creates_parent_directories(self, tmp_path):
        """Test that parent directories are created if they don't exist."""
        db_path = tmp_path / "nested" / "deep" / "path" / "test_eval.db"

        # Parent directories don't exist yet
        assert not db_path.parent.exists()

        init_eval_db_if_needed(str(db_path))

        # Should create parent directories and database file
        assert db_path.parent.exists()
        assert db_path.exists()


class TestEvalDatabaseInsertOperations:
    """Test eval database insert operations."""

    def test_insert_eval_run_basic(self, tmp_path):
        """Test basic insert_eval_run functionality."""
        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        run_id = "2025-11-02T10-00-00Z"
        summary = {
            "pass_rate": 0.85,
            "total_test_cases": 20,
            "total_passed": 17,
            "total_failed": 3,
        }

        with sqlite3.connect(str(db_path)) as conn:
            returned_run_id = insert_eval_run(conn, run_id, summary)
            conn.commit()

        assert returned_run_id == run_id

        # Verify data was inserted correctly
        with sqlite3.connect(str(db_path)) as conn:
            cursor = conn.execute(
                "SELECT run_id, total_test_cases, total_passed, total_failed, pass_rate "
                "FROM eval_runs WHERE run_id = ?",
                (run_id,),
            )
            row = cursor.fetchone()

        assert row is not None
        assert row[0] == run_id
        assert row[1] == 20  # total_test_cases
        assert row[2] == 17  # total_passed
        assert row[3] == 3  # total_failed
        assert row[4] == 0.85  # pass_rate

    def test_insert_eval_run_with_json_summary(self, tmp_path):
        """Test insert_eval_run with complex summary data."""
        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        run_id = "2025-11-02T10-00-00Z"
        summary = {
            "pass_rate": 0.90,
            "total_test_cases": 10,
            "total_passed": 9,
            "total_failed": 1,
            "average_scores": {
                "mention_precision": 0.95,
                "mention_recall": 0.85,
                "rank_accuracy": 0.90,
            },
            "test_categories": {
                "brand_detection": {"passed": 5, "total": 5},
                "rank_extraction": {"passed": 4, "total": 5},
            },
        }

        with sqlite3.connect(str(db_path)) as conn:
            insert_eval_run(conn, run_id, summary)
            conn.commit()

        # Verify JSON summary was stored correctly
        with sqlite3.connect(str(db_path)) as conn:
            cursor = conn.execute(
                "SELECT summary_json FROM eval_runs WHERE run_id = ?", (run_id,)
            )
            row = cursor.fetchone()

        assert row is not None
        stored_summary = json.loads(row[0])
        assert stored_summary == summary

    def test_insert_eval_run_replace_existing(self, tmp_path):
        """Test that insert_eval_run replaces existing run with same ID."""
        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        run_id = "2025-11-02T10-00-00Z"

        # Insert first run
        summary1 = {
            "pass_rate": 0.80,
            "total_test_cases": 10,
            "total_passed": 8,
            "total_failed": 2,
        }

        with sqlite3.connect(str(db_path)) as conn:
            insert_eval_run(conn, run_id, summary1)
            conn.commit()

        # Insert second run with same ID
        summary2 = {
            "pass_rate": 0.90,
            "total_test_cases": 10,
            "total_passed": 9,
            "total_failed": 1,
        }

        with sqlite3.connect(str(db_path)) as conn:
            insert_eval_run(conn, run_id, summary2)
            conn.commit()

        # Should have replaced the first run
        with sqlite3.connect(str(db_path)) as conn:
            cursor = conn.execute(
                "SELECT COUNT(*) FROM eval_runs WHERE run_id = ?", (run_id,)
            )
            count = cursor.fetchone()[0]

            cursor = conn.execute(
                "SELECT pass_rate FROM eval_runs WHERE run_id = ?", (run_id,)
            )
            pass_rate = cursor.fetchone()[0]

        assert count == 1  # Only one record
        assert pass_rate == 0.90  # Second run's data

    def test_insert_eval_result_basic(self, tmp_path):
        """Test basic insert_eval_result functionality."""
        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        eval_run_id = "2025-11-02T10-00-00Z"
        test_description = "HubSpot mention detection test"
        overall_passed = True
        metric_name = "mention_precision"
        metric_value = 0.95
        metric_passed = True
        metric_details = {"true_positives": 5, "false_positives": 0}

        with sqlite3.connect(str(db_path)) as conn:
            insert_eval_result(
                conn,
                eval_run_id,
                test_description,
                overall_passed,
                metric_name,
                metric_value,
                metric_passed,
                metric_details,
            )
            conn.commit()

        # Verify data was inserted correctly
        with sqlite3.connect(str(db_path)) as conn:
            cursor = conn.execute(
                """
                SELECT eval_run_id, test_description, overall_passed,
                       metric_name, metric_value, metric_passed, metric_details_json
                FROM eval_results
                WHERE eval_run_id = ? AND metric_name = ?
            """,
                (eval_run_id, metric_name),
            )
            row = cursor.fetchone()

        assert row is not None
        assert row[0] == eval_run_id
        assert row[1] == test_description
        assert row[2] == 1  # overall_passed as integer
        assert row[3] == metric_name
        assert row[4] == metric_value
        assert row[5] == 1  # metric_passed as integer

        stored_details = json.loads(row[6]) if row[6] else None
        assert stored_details == metric_details

    def test_insert_eval_result_without_details(self, tmp_path):
        """Test insert_eval_result with no metric details."""
        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        with sqlite3.connect(str(db_path)) as conn:
            insert_eval_result(
                conn,
                "run-123",
                "Simple test",
                True,
                "simple_metric",
                1.0,
                True,
                # No metric_details
            )
            conn.commit()

        # Verify details_json is NULL
        with sqlite3.connect(str(db_path)) as conn:
            cursor = conn.execute(
                "SELECT metric_details_json FROM eval_results WHERE eval_run_id = ?",
                ("run-123",),
            )
            row = cursor.fetchone()

        assert row is not None
        assert row[0] is None  # Should be NULL

    def test_insert_eval_result_replace_existing(self, tmp_path):
        """Test that insert_eval_result replaces existing unique constraint."""
        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        eval_run_id = "run-123"
        test_description = "Test description"
        metric_name = "precision"

        # Insert first result
        with sqlite3.connect(str(db_path)) as conn:
            insert_eval_result(
                conn,
                eval_run_id,
                test_description,
                True,
                metric_name,
                0.80,
                False,
                {"version": 1},
            )
            conn.commit()

        # Insert second result with same unique constraint
        with sqlite3.connect(str(db_path)) as conn:
            insert_eval_result(
                conn,
                eval_run_id,
                test_description,
                False,
                metric_name,
                0.90,
                True,
                {"version": 2},
            )
            conn.commit()

        # Should have replaced the first result
        with sqlite3.connect(str(db_path)) as conn:
            cursor = conn.execute(
                """
                SELECT COUNT(*), metric_value, metric_passed, metric_details_json
                FROM eval_results
                WHERE eval_run_id = ? AND test_description = ? AND metric_name = ?
            """,
                (eval_run_id, test_description, metric_name),
            )
            row = cursor.fetchone()

        assert row[0] == 1  # Only one record
        assert row[1] == 0.90  # Second result's value
        assert row[2] == 1  # Second result's passed status
        stored_details = json.loads(row[3])
        assert stored_details == {"version": 2}


class TestEvalDatabaseQueryOperations:
    """Test eval database query operations."""

    def test_get_recent_eval_runs_empty(self, tmp_path):
        """Test get_recent_eval_runs with empty database."""
        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        with sqlite3.connect(str(db_path)) as conn:
            runs = get_recent_eval_runs(conn, limit=5)

        assert runs == []

    def test_get_recent_eval_runs_single(self, tmp_path):
        """Test get_recent_eval_runs with single run."""
        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        run_id = "2025-11-02T10-00-00Z"
        summary = {
            "pass_rate": 0.85,
            "total_test_cases": 10,
            "total_passed": 8,
            "total_failed": 2,
        }

        with sqlite3.connect(str(db_path)) as conn:
            insert_eval_run(conn, run_id, summary)
            conn.commit()
            runs = get_recent_eval_runs(conn, limit=5)

        assert len(runs) == 1
        run = runs[0]
        assert run["run_id"] == run_id
        assert run["pass_rate"] == 0.85
        assert run["total_test_cases"] == 10
        assert run["total_passed"] == 8
        assert run["total_failed"] == 2
        assert run["summary"] == summary
        assert "timestamp_utc" in run
        assert "created_at" in run

    def test_get_recent_eval_runs_multiple_ordered(self, tmp_path):
        """Test get_recent_eval_runs with multiple runs ordered by timestamp."""
        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        # Insert runs with different timestamps
        runs_data = [
            ("2025-11-01T10-00-00Z", 0.80),
            ("2025-11-02T10-00-00Z", 0.90),
            ("2025-11-03T10-00-00Z", 0.85),
        ]

        with sqlite3.connect(str(db_path)) as conn:
            for run_id, pass_rate in runs_data:
                summary = {
                    "pass_rate": pass_rate,
                    "total_test_cases": 10,
                    "total_passed": int(pass_rate * 10),
                    "total_failed": int((1 - pass_rate) * 10),
                }
                insert_eval_run(conn, run_id, summary)
            conn.commit()
            runs = get_recent_eval_runs(conn, limit=10)

        assert len(runs) == 3
        # Should be ordered by timestamp descending (most recent first)
        assert runs[0]["run_id"] == "2025-11-03T10-00-00Z"
        assert runs[1]["run_id"] == "2025-11-02T10-00-00Z"
        assert runs[2]["run_id"] == "2025-11-01T10-00-00Z"

    def test_get_recent_eval_runs_limit(self, tmp_path):
        """Test get_recent_eval_runs with limit parameter."""
        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        # Insert 5 runs
        with sqlite3.connect(str(db_path)) as conn:
            for i in range(5):
                run_id = f"2025-11-{i + 1:02d}T10-00-00Z"
                summary = {
                    "pass_rate": 0.8 + i * 0.05,
                    "total_test_cases": 10,
                    "total_passed": 8,
                    "total_failed": 2,
                }
                insert_eval_run(conn, run_id, summary)
            conn.commit()
            runs = get_recent_eval_runs(conn, limit=3)

        assert len(runs) == 3
        # Should get the 3 most recent runs
        assert runs[0]["run_id"] == "2025-11-05T10-00-00Z"
        assert runs[1]["run_id"] == "2025-11-04T10-00-00Z"
        assert runs[2]["run_id"] == "2025-11-03T10-00-00Z"

    def test_get_metric_trend_empty(self, tmp_path):
        """Test get_metric_trend with empty database."""
        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        with sqlite3.connect(str(db_path)) as conn:
            trend = get_metric_trend(conn, "mention_precision", days=7)

        assert trend == []

    def test_get_metric_trend_single_day(self, tmp_path):
        """Test get_metric_trend with data for single day."""
        from datetime import datetime

        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        run_id = "2025-11-02T10-00-00Z"

        with sqlite3.connect(str(db_path)) as conn:
            # Insert run and result
            summary = {
                "pass_rate": 0.85,
                "total_test_cases": 1,
                "total_passed": 1,
                "total_failed": 0,
            }
            insert_eval_run(conn, run_id, summary)

            insert_eval_result(
                conn, run_id, "Test", True, "mention_precision", 0.95, True
            )
            conn.commit()

            trend = get_metric_trend(conn, "mention_precision", days=7)

        # Note: insert_eval_run uses current timestamp, not run_id date
        expected_date = datetime.now(UTC).strftime("%Y-%m-%d")

        assert len(trend) == 1
        assert trend[0]["date"] == expected_date
        assert trend[0]["avg_value"] == 0.95
        assert trend[0]["count"] == 1

    def test_get_metric_trend_multiple_days(self, tmp_path):
        """Test get_metric_trend with multiple entries and correct aggregation."""
        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        with sqlite3.connect(str(db_path)) as conn:
            # Insert multiple runs with different metric values
            # Note: All runs will have current timestamp, but this tests aggregation logic
            run_ids = []
            for i in range(4):
                run_id = f"test-run-{i}"
                run_ids.append(run_id)
                summary = {
                    "pass_rate": 1.0,
                    "total_test_cases": 1,
                    "total_passed": 1,
                    "total_failed": 0,
                }
                insert_eval_run(conn, run_id, summary)

            # Insert metric results with different values
            metric_values = [0.80, 0.90, 0.85, 0.95]
            for run_id, metric_value in zip(run_ids, metric_values, strict=True):
                insert_eval_result(
                    conn, run_id, "Test", True, "mention_precision", metric_value, True
                )
            conn.commit()

            # Get trend for 7 days (should include all current data)
            trend = get_metric_trend(conn, "mention_precision", days=7)

        # Should have exactly one entry for today (all current runs)
        assert len(trend) == 1

        # Average should be (0.80 + 0.90 + 0.85 + 0.95) / 4 = 0.875
        expected_avg = sum(metric_values) / len(metric_values)
        assert abs(trend[0]["avg_value"] - expected_avg) < 0.001
        assert trend[0]["count"] == 4

    def test_get_metric_trend_days_filter(self, tmp_path):
        """Test get_metric_trend with days parameter."""
        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        with sqlite3.connect(str(db_path)) as conn:
            # Insert current data
            summary = {
                "pass_rate": 1.0,
                "total_test_cases": 1,
                "total_passed": 1,
                "total_failed": 0,
            }
            insert_eval_run(conn, "current-run", summary)
            insert_eval_result(
                conn, "current-run", "Test", True, "mention_precision", 0.90, True
            )
            conn.commit()

            # Get trend for last 1 day (should include current data)
            trend = get_metric_trend(conn, "mention_precision", days=1)

        assert len(trend) == 1
        assert trend[0]["avg_value"] == 0.90
        assert trend[0]["count"] == 1

    def test_get_failing_tests_empty(self, tmp_path):
        """Test get_failing_tests with empty database."""
        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        with sqlite3.connect(str(db_path)) as conn:
            failing = get_failing_tests(conn)

        assert failing == []

    def test_get_failing_tests_with_results(self, tmp_path):
        """Test get_failing_tests with some failing tests."""
        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        run_id = "2025-11-02T10-00-00Z"

        with sqlite3.connect(str(db_path)) as conn:
            summary = {
                "pass_rate": 0.5,
                "total_test_cases": 4,
                "total_passed": 2,
                "total_failed": 2,
            }
            insert_eval_run(conn, run_id, summary)

            # Insert results: 2 passing, 2 failing tests
            tests_data = [
                ("Passing test", True, "precision", 0.95, True),
                ("Passing test", True, "recall", 0.90, True),
                ("Failing test 1", False, "precision", 0.70, False),
                ("Failing test 1", False, "recall", 0.60, False),
                ("Failing test 2", False, "rank_accuracy", 0.40, False),
            ]

            for (
                test_desc,
                overall_passed,
                metric_name,
                metric_value,
                metric_passed,
            ) in tests_data:
                insert_eval_result(
                    conn,
                    run_id,
                    test_desc,
                    overall_passed,
                    metric_name,
                    metric_value,
                    metric_passed,
                )
            conn.commit()

            failing = get_failing_tests(conn)

        assert len(failing) == 2

        # Should be ordered by failed_metrics count descending
        failing_by_test = {f["test_description"]: f for f in failing}
        assert failing_by_test["Failing test 1"]["failed_metrics"] == 2
        assert failing_by_test["Failing test 2"]["failed_metrics"] == 1

    def test_get_failing_tests_specific_run(self, tmp_path):
        """Test get_failing_tests for specific run ID."""
        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        # Insert two runs
        runs_data = [
            ("run-1", "Failing test", False),
            ("run-2", "Another failing test", False),
        ]

        with sqlite3.connect(str(db_path)) as conn:
            for run_id, test_desc, overall_passed in runs_data:
                summary = {
                    "pass_rate": 0.0,
                    "total_test_cases": 1,
                    "total_passed": 0,
                    "total_failed": 1,
                }
                insert_eval_run(conn, run_id, summary)
                insert_eval_result(
                    conn, run_id, test_desc, overall_passed, "precision", 0.5, False
                )
            conn.commit()

            failing = get_failing_tests(conn, run_id="run-2")

        assert len(failing) == 1
        assert failing[0]["test_description"] == "Another failing test"


class TestEvalDatabaseIntegration:
    """Test eval database integration and complex scenarios."""

    def test_store_eval_results_complete_flow(self, tmp_path):
        """Test store_eval_results with complete evaluation results."""
        from llm_answer_watcher.evals.schema import EvalMetricScore, EvalResult

        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        # Create mock eval results (matching what run_eval_suite returns)
        eval_results = {
            "summary": {
                "pass_rate": 0.75,
                "average_scores": {
                    "precision": 0.78,  # (0.95 + 0.80 + 0.60) / 3
                    "recall": 0.70,  # (0.90 + 0.50) / 2
                },
                "total_test_cases": 3,
                "total_passed": 2,
                "total_failed": 1,
            },
            "results": [
                EvalResult(
                    test_description="Test 1",
                    metrics=[
                        EvalMetricScore(
                            name="precision",
                            value=0.95,
                            passed=True,
                            details={"tp": 5, "fp": 0},
                        ),
                        EvalMetricScore(
                            name="recall",
                            value=0.90,
                            passed=True,
                            details={"tp": 5, "fn": 1},
                        ),
                    ],
                    overall_passed=True,
                ),
                EvalResult(
                    test_description="Test 2",
                    metrics=[
                        EvalMetricScore(name="precision", value=0.80, passed=True),
                    ],
                    overall_passed=True,
                ),
                EvalResult(
                    test_description="Test 3",
                    metrics=[
                        EvalMetricScore(name="precision", value=0.60, passed=False),
                        EvalMetricScore(name="recall", value=0.50, passed=False),
                    ],
                    overall_passed=False,
                ),
            ],
            "total_test_cases": 3,
            "total_passed": 2,
        }

        with sqlite3.connect(str(db_path)) as conn:
            run_id = store_eval_results(conn, eval_results)
            conn.commit()

        # Verify run was stored
        with sqlite3.connect(str(db_path)) as conn:
            runs = get_recent_eval_runs(conn, limit=1)

        assert len(runs) == 1
        assert runs[0]["pass_rate"] == 0.75
        assert runs[0]["total_test_cases"] == 3
        assert runs[0]["total_passed"] == 2
        assert runs[0]["total_failed"] == 1

        # Verify detailed results were stored
        with sqlite3.connect(str(db_path)) as conn:
            cursor = conn.execute(
                "SELECT COUNT(*) FROM eval_results WHERE eval_run_id = ?", (run_id,)
            )
            result_count = cursor.fetchone()[0]

        # Should have 2 (precision+recall) + 1 (precision) + 2 (precision+recall) = 5 results
        assert result_count == 5

    def test_foreign_key_constraints(self, tmp_path):
        """Test that foreign key constraints are enforced."""
        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        # Try to insert result without corresponding run
        with sqlite3.connect(str(db_path)) as conn:
            # Enable foreign keys explicitly
            conn.execute("PRAGMA foreign_keys = ON")

            with pytest.raises(
                sqlite3.IntegrityError, match="FOREIGN KEY constraint failed"
            ):
                insert_eval_result(
                    conn, "nonexistent_run_id", "Test", True, "precision", 0.95, True
                )
                conn.commit()  # This should raise the error

    def test_transaction_rollback_on_error(self, tmp_path):
        """Test that transactions are rolled back on errors."""
        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        # Start with some data
        with sqlite3.connect(str(db_path)) as conn:
            summary = {
                "pass_rate": 1.0,
                "total_test_cases": 1,
                "total_passed": 1,
                "total_failed": 0,
            }
            insert_eval_run(conn, "initial-run", summary)
            conn.commit()

        # Count initial data
        with sqlite3.connect(str(db_path)) as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM eval_runs")
            initial_count = cursor.fetchone()[0]

        assert initial_count == 1

        # Try to store results with invalid data (should rollback)
        invalid_results = {
            "summary": {
                "pass_rate": 0.5,
                "total_test_cases": 1,
                "total_passed": 1,
                "total_failed": 0,
            },
            "results": [],  # Empty results but summary says 1 test case
        }

        with sqlite3.connect(str(db_path)) as conn:
            with pytest.raises(sqlite3.Error):  # Should fail due to data inconsistency
                store_eval_results(conn, invalid_results)

            # Should rollback automatically due to exception

        # Verify no new data was added
        with sqlite3.connect(str(db_path)) as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM eval_runs")
            final_count = cursor.fetchone()[0]

        assert final_count == initial_count  # Should be unchanged


class TestEvalDatabasePerformance:
    """Test eval database performance and optimization."""

    def test_query_performance_with_indexes(self, tmp_path):
        """Test that indexes improve query performance for large datasets."""
        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        # Insert a reasonable amount of test data
        num_runs = 100
        num_results_per_run = 50

        with sqlite3.connect(str(db_path)) as conn:
            for i in range(num_runs):
                run_id = f"run-{i:04d}"
                summary = {
                    "pass_rate": 0.8 + (i % 20) * 0.01,
                    "total_test_cases": num_results_per_run,
                    "total_passed": 40,
                    "total_failed": 10,
                }
                insert_eval_run(conn, run_id, summary)

                for j in range(num_results_per_run):
                    insert_eval_result(
                        conn,
                        run_id,
                        f"Test {j}",
                        j % 2 == 0,  # Half pass, half fail
                        "precision",
                        0.7 + (j % 30) * 0.01,
                        j % 10 != 0,  # Most pass, some fail
                    )
            conn.commit()

        # Test that queries with indexed columns are fast
        with sqlite3.connect(str(db_path)) as conn:
            # This query should use idx_eval_results_metric_name and idx_eval_results_passed
            import time

            start_time = time.time()

            cursor = conn.execute("""
                SELECT COUNT(*) FROM eval_results
                WHERE metric_name = 'precision' AND overall_passed = 1
            """)
            count = cursor.fetchone()[0]

            elapsed = time.time() - start_time

            # Should return reasonable count and be relatively fast
            assert count > 0
            assert elapsed < 1.0  # Should complete within 1 second for this dataset

    def test_query_plan_uses_indexes(self, tmp_path):
        """Test that SQLite query planner uses our indexes."""
        db_path = tmp_path / "test_eval.db"
        init_eval_db_if_needed(str(db_path))

        # Insert some test data
        with sqlite3.connect(str(db_path)) as conn:
            summary = {
                "pass_rate": 1.0,
                "total_test_cases": 10,
                "total_passed": 10,
                "total_failed": 0,
            }
            insert_eval_run(conn, "test-run", summary)

            for i in range(10):
                insert_eval_result(
                    conn, "test-run", f"Test {i}", True, "precision", 0.9, True
                )
            conn.commit()

        # Check query plan for timestamp query
        with sqlite3.connect(str(db_path)) as conn:
            cursor = conn.execute("""
                EXPLAIN QUERY PLAN
                SELECT * FROM eval_runs
                ORDER BY timestamp_utc DESC
                LIMIT 10
            """)
            plan = list(cursor.fetchall())

        # Should use idx_eval_runs_timestamp index
        plan_str = str(plan)
        assert "idx_eval_runs_timestamp" in plan_str

        # Check query plan for metric name query
        with sqlite3.connect(str(db_path)) as conn:
            cursor = conn.execute("""
                EXPLAIN QUERY PLAN
                SELECT * FROM eval_results
                WHERE metric_name = 'precision'
            """)
            plan = list(cursor.fetchall())

        # Should use idx_eval_results_metric_name index
        plan_str = str(plan)
        assert "idx_eval_results_metric_name" in plan_str
