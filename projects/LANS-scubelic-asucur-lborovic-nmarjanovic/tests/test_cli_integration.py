"""
Integration tests for new CLI commands: export and costs.

Tests the newly added commands with various scenarios:
- Export mentions command (CSV and JSON)
- Export runs command (CSV and JSON)
- Costs show command (all time periods)
- Error handling for all commands
"""

import json
import sqlite3

import pytest
from typer.testing import CliRunner

from llm_answer_watcher.cli import EXIT_CONFIG_ERROR, EXIT_SUCCESS, app


@pytest.fixture
def cli_runner():
    """Return CliRunner for testing Typer apps."""
    return CliRunner()


@pytest.fixture
def populated_db(tmp_path):
    """Create a populated SQLite database with test data."""
    db_path = tmp_path / "test.db"
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    # Create schema
    cursor.execute("""
        CREATE TABLE runs (
            run_id TEXT PRIMARY KEY,
            timestamp_utc TEXT NOT NULL,
            total_intents INTEGER,
            total_models INTEGER,
            total_queries INTEGER,
            success_count INTEGER,
            error_count INTEGER,
            total_cost_usd REAL
        )
    """)

    cursor.execute("""
        CREATE TABLE answers_raw (
            run_id TEXT,
            intent_id TEXT,
            model_provider TEXT,
            model_name TEXT,
            timestamp_utc TEXT,
            prompt TEXT,
            answer_text TEXT,
            usage_meta_json TEXT,
            estimated_cost_usd REAL,
            web_search_count INTEGER,
            web_search_results_json TEXT,
            PRIMARY KEY (run_id, intent_id, model_provider, model_name)
        )
    """)

    cursor.execute("""
        CREATE TABLE mentions (
            run_id TEXT,
            intent_id TEXT,
            model_provider TEXT,
            model_name TEXT,
            brand TEXT,
            normalized_name TEXT,
            is_mine BOOLEAN,
            rank_position INTEGER,
            match_type TEXT,
            timestamp_utc TEXT,
            UNIQUE (run_id, intent_id, model_provider, model_name, normalized_name)
        )
    """)

    # Insert test data
    cursor.execute("""
        INSERT INTO runs VALUES
        ('2025-11-01T10-00-00Z', '2025-11-01T10:00:00Z', 2, 2, 4, 4, 0, 0.001234)
    """)

    cursor.execute("""
        INSERT INTO answers_raw VALUES
        ('2025-11-01T10-00-00Z', 'intent1', 'openai', 'gpt-4o-mini',
         '2025-11-01T10:00:00Z', 'test prompt', 'test answer',
         '{"prompt_tokens": 100, "completion_tokens": 200}', 0.0003, 0, NULL)
    """)

    cursor.execute("""
        INSERT INTO answers_raw VALUES
        ('2025-11-01T10-00-00Z', 'intent1', 'anthropic', 'claude-3-5-haiku',
         '2025-11-01T10:00:00Z', 'test prompt', 'test answer',
         '{"prompt_tokens": 100, "completion_tokens": 200}', 0.0008, 0, NULL)
    """)

    cursor.execute("""
        INSERT INTO mentions VALUES
        ('2025-11-01T10-00-00Z', 'intent1', 'openai', 'gpt-4o-mini',
         'MyBrand', 'MyBrand', 1, 1, 'exact', '2025-11-01T10:00:00Z')
    """)

    cursor.execute("""
        INSERT INTO mentions VALUES
        ('2025-11-01T10-00-00Z', 'intent1', 'openai', 'gpt-4o-mini',
         'Competitor', 'Competitor', 0, 2, 'exact', '2025-11-01T10:00:00Z')
    """)

    conn.commit()
    conn.close()

    return db_path


class TestExportMentionsCommand:
    """Tests for export mentions command."""

    def test_export_mentions_csv_success(self, cli_runner, populated_db, tmp_path):
        """Export mentions to CSV should succeed with populated database."""
        output_file = tmp_path / "mentions.csv"

        result = cli_runner.invoke(
            app,
            [
                "export",
                "mentions",
                "--output",
                str(output_file),
                "--db",
                str(populated_db),
            ],
        )

        assert result.exit_code == EXIT_SUCCESS
        assert output_file.exists()

        # Check CSV content
        content = output_file.read_text()
        assert "MyBrand" in content
        assert "Competitor" in content
        assert "openai" in content

    def test_export_mentions_json_success(self, cli_runner, populated_db, tmp_path):
        """Export mentions to JSON should succeed."""
        output_file = tmp_path / "mentions.json"

        result = cli_runner.invoke(
            app,
            [
                "export",
                "mentions",
                "--output",
                str(output_file),
                "--db",
                str(populated_db),
            ],
        )

        assert result.exit_code == EXIT_SUCCESS
        assert output_file.exists()

        # Check JSON is valid
        data = json.loads(output_file.read_text())
        assert isinstance(data, list)
        assert len(data) == 2
        assert data[0]["brand"] == "MyBrand"

    def test_export_mentions_invalid_extension(
        self, cli_runner, populated_db, tmp_path
    ):
        """Export with invalid extension should fail."""
        output_file = tmp_path / "mentions.txt"

        result = cli_runner.invoke(
            app,
            [
                "export",
                "mentions",
                "--output",
                str(output_file),
                "--db",
                str(populated_db),
            ],
        )

        assert result.exit_code == EXIT_CONFIG_ERROR
        assert "must have .csv or .json extension" in result.output.lower()

    def test_export_mentions_missing_db(self, cli_runner, tmp_path):
        """Export with missing database should fail."""
        output_file = tmp_path / "mentions.csv"
        missing_db = tmp_path / "missing.db"

        result = cli_runner.invoke(
            app,
            [
                "export",
                "mentions",
                "--output",
                str(output_file),
                "--db",
                str(missing_db),
            ],
        )

        # Should fail due to typer's exists=True check
        assert result.exit_code != EXIT_SUCCESS

    def test_export_mentions_with_run_id_filter(
        self, cli_runner, populated_db, tmp_path
    ):
        """Export with run_id filter should work."""
        output_file = tmp_path / "mentions.csv"

        result = cli_runner.invoke(
            app,
            [
                "export",
                "mentions",
                "--output",
                str(output_file),
                "--db",
                str(populated_db),
                "--run-id",
                "2025-11-01T10-00-00Z",
            ],
        )

        assert result.exit_code == EXIT_SUCCESS
        assert output_file.exists()

    def test_export_mentions_with_days_filter(self, cli_runner, populated_db, tmp_path):
        """Export with days filter should work."""
        output_file = tmp_path / "mentions.json"

        result = cli_runner.invoke(
            app,
            [
                "export",
                "mentions",
                "--output",
                str(output_file),
                "--db",
                str(populated_db),
                "--days",
                "30",
            ],
        )

        assert result.exit_code == EXIT_SUCCESS


class TestExportRunsCommand:
    """Tests for export runs command."""

    def test_export_runs_csv_success(self, cli_runner, populated_db, tmp_path):
        """Export runs to CSV should succeed."""
        output_file = tmp_path / "runs.csv"

        result = cli_runner.invoke(
            app,
            [
                "export",
                "runs",
                "--output",
                str(output_file),
                "--db",
                str(populated_db),
            ],
        )

        assert result.exit_code == EXIT_SUCCESS
        assert output_file.exists()

        # Check CSV content
        content = output_file.read_text()
        assert "2025-11-01T10-00-00Z" in content
        assert "0.001234" in content

    def test_export_runs_json_success(self, cli_runner, populated_db, tmp_path):
        """Export runs to JSON should succeed."""
        output_file = tmp_path / "runs.json"

        result = cli_runner.invoke(
            app,
            [
                "export",
                "runs",
                "--output",
                str(output_file),
                "--db",
                str(populated_db),
            ],
        )

        assert result.exit_code == EXIT_SUCCESS
        assert output_file.exists()

        # Check JSON is valid
        data = json.loads(output_file.read_text())
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["run_id"] == "2025-11-01T10-00-00Z"

    def test_export_runs_with_days_filter(self, cli_runner, populated_db, tmp_path):
        """Export runs with days filter should work."""
        output_file = tmp_path / "runs.csv"

        result = cli_runner.invoke(
            app,
            [
                "export",
                "runs",
                "--output",
                str(output_file),
                "--db",
                str(populated_db),
                "--days",
                "7",
            ],
        )

        assert result.exit_code == EXIT_SUCCESS


class TestCostsShowCommand:
    """Tests for costs show command."""

    def test_costs_show_month_success(self, cli_runner, populated_db):
        """Costs show with month period should succeed."""
        result = cli_runner.invoke(
            app,
            ["costs", "show", "--db", str(populated_db), "--period", "month"],
        )

        assert result.exit_code == EXIT_SUCCESS
        assert (
            "openai" in result.output.lower() or "no cost data" in result.output.lower()
        )

    def test_costs_show_week_success(self, cli_runner, populated_db):
        """Costs show with week period should succeed."""
        result = cli_runner.invoke(
            app,
            ["costs", "show", "--db", str(populated_db), "--period", "week"],
        )

        assert result.exit_code == EXIT_SUCCESS

    def test_costs_show_quarter_success(self, cli_runner, populated_db):
        """Costs show with quarter period should succeed."""
        result = cli_runner.invoke(
            app,
            ["costs", "show", "--db", str(populated_db), "--period", "quarter"],
        )

        assert result.exit_code == EXIT_SUCCESS

    def test_costs_show_all_success(self, cli_runner, populated_db):
        """Costs show with all period should succeed."""
        result = cli_runner.invoke(
            app,
            ["costs", "show", "--db", str(populated_db), "--period", "all"],
        )

        assert result.exit_code == EXIT_SUCCESS

    def test_costs_show_json_format(self, cli_runner, populated_db):
        """Costs show with JSON format should return valid JSON."""
        result = cli_runner.invoke(
            app,
            [
                "costs",
                "show",
                "--db",
                str(populated_db),
                "--period",
                "all",
                "--format",
                "json",
            ],
        )

        assert result.exit_code == EXIT_SUCCESS
        # Should be valid JSON
        try:
            json.loads(result.output)
        except json.JSONDecodeError:
            pytest.fail("Output is not valid JSON")

    def test_costs_show_invalid_period(self, cli_runner, populated_db):
        """Costs show with invalid period should fail."""
        result = cli_runner.invoke(
            app,
            ["costs", "show", "--db", str(populated_db), "--period", "invalid"],
        )

        assert result.exit_code == EXIT_CONFIG_ERROR

    def test_costs_show_missing_db(self, cli_runner, tmp_path):
        """Costs show with missing database should fail."""
        missing_db = tmp_path / "missing.db"

        result = cli_runner.invoke(
            app,
            ["costs", "show", "--db", str(missing_db)],
        )

        # Should fail due to typer's exists=True check
        assert result.exit_code != EXIT_SUCCESS


class TestExportIntegration:
    """Integration tests for export workflow."""

    def test_full_export_workflow(self, cli_runner, populated_db, tmp_path):
        """Full workflow: export mentions and runs."""
        mentions_csv = tmp_path / "mentions.csv"
        runs_json = tmp_path / "runs.json"

        # Export mentions
        result1 = cli_runner.invoke(
            app,
            [
                "export",
                "mentions",
                "--output",
                str(mentions_csv),
                "--db",
                str(populated_db),
            ],
        )
        assert result1.exit_code == EXIT_SUCCESS

        # Export runs
        result2 = cli_runner.invoke(
            app,
            [
                "export",
                "runs",
                "--output",
                str(runs_json),
                "--db",
                str(populated_db),
            ],
        )
        assert result2.exit_code == EXIT_SUCCESS

        # Both files should exist
        assert mentions_csv.exists()
        assert runs_json.exists()

        # Data should be correct
        mentions_data = mentions_csv.read_text()
        assert "MyBrand" in mentions_data

        runs_data = json.loads(runs_json.read_text())
        assert len(runs_data) == 1
