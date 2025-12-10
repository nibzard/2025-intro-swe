"""
Tests for CLI module - comprehensive test coverage for all commands and modes.

This module tests the Typer CLI application with all commands, flags, and output modes:

Commands:
    - run: Main command with multiple flags and exit codes
    - validate: Config validation command
    - main callback: Version flag and help output

Output Modes:
    - Human mode (--format text): Rich output with spinners, tables, panels
    - Agent mode (--format json): Valid JSON with no ANSI codes
    - Quiet mode (--quiet): Minimal tab-separated output

Exit Codes:
    - 0: Success
    - 1: Configuration error
    - 2: Database error
    - 3: Partial failure (some queries failed)
    - 4: Complete failure (all queries failed)

Coverage target: 90%+ for cli.py
"""

import json
import re
from contextlib import contextmanager
from unittest.mock import MagicMock, patch

import pytest
import yaml
from typer.testing import CliRunner

from llm_answer_watcher.cli import (
    EXIT_COMPLETE_FAILURE,
    EXIT_CONFIG_ERROR,
    EXIT_DB_ERROR,
    EXIT_PARTIAL_FAILURE,
    EXIT_SUCCESS,
    app,
)
from llm_answer_watcher.config.schema import (
    Brands,
    Intent,
    ModelConfig,
    RunSettings,
    RuntimeConfig,
    RuntimeModel,
)

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def cli_runner():
    """Return CliRunner for testing Typer apps."""
    return CliRunner()


@pytest.fixture
def valid_config_yaml(tmp_path):
    """Create a valid YAML config file."""
    config_data = {
        "run_settings": {
            "output_dir": str(tmp_path / "output"),
            "sqlite_db_path": str(tmp_path / "watcher.db"),
            "models": [
                {
                    "provider": "openai",
                    "model_name": "gpt-4o-mini",
                    "env_api_key": "OPENAI_API_KEY",
                }
            ],
            "use_llm_rank_extraction": False,
        },
        "brands": {
            "mine": ["MyBrand"],
            "competitors": ["Competitor1"],
        },
        "intents": [
            {"id": "test-intent-1", "prompt": "What are the best tools?"},
        ],
    }

    config_file = tmp_path / "watcher.config.yaml"
    with config_file.open("w", encoding="utf-8") as f:
        yaml.dump(config_data, f)

    return config_file


@pytest.fixture
def invalid_config_yaml(tmp_path):
    """Create an invalid YAML config file."""
    config_file = tmp_path / "invalid.yaml"
    config_file.write_text("invalid: yaml: syntax: [", encoding="utf-8")
    return config_file


@pytest.fixture
def empty_config_yaml(tmp_path):
    """Create an empty YAML config file."""
    config_file = tmp_path / "empty.yaml"
    config_file.write_text("", encoding="utf-8")
    return config_file


@pytest.fixture
def mock_successful_run():
    """Mock a successful run_all() execution."""
    return {
        "run_id": "2025-11-02T08-00-00Z",
        "timestamp_utc": "2025-11-02T08:00:00Z",
        "output_dir": "./output/2025-11-02T08-00-00Z",
        "total_intents": 1,
        "total_models": 1,
        "total_queries": 1,
        "success_count": 1,
        "error_count": 0,
        "total_cost_usd": 0.001234,
        "errors": [],
    }


@pytest.fixture
def mock_partial_failure_run():
    """Mock a partial failure run_all() execution."""
    return {
        "run_id": "2025-11-02T08-00-00Z",
        "timestamp_utc": "2025-11-02T08:00:00Z",
        "output_dir": "./output/2025-11-02T08-00-00Z",
        "total_intents": 2,
        "total_models": 1,
        "total_queries": 2,
        "success_count": 1,
        "error_count": 1,
        "total_cost_usd": 0.000500,
        "errors": [
            {
                "intent_id": "test-intent-2",
                "model_provider": "openai",
                "model_name": "gpt-4o-mini",
                "error_message": "API rate limit exceeded",
            }
        ],
    }


@pytest.fixture
def mock_complete_failure_run():
    """Mock a complete failure run_all() execution."""
    return {
        "run_id": "2025-11-02T08-00-00Z",
        "timestamp_utc": "2025-11-02T08:00:00Z",
        "output_dir": "./output/2025-11-02T08-00-00Z",
        "total_intents": 1,
        "total_models": 1,
        "total_queries": 1,
        "success_count": 0,
        "error_count": 1,
        "total_cost_usd": 0.0,
        "errors": [
            {
                "intent_id": "test-intent-1",
                "model_provider": "openai",
                "model_name": "gpt-4o-mini",
                "error_message": "All queries failed",
            }
        ],
    }


@pytest.fixture
def reset_output_mode():
    """Reset global output_mode after each test."""
    from llm_answer_watcher.utils.console import output_mode

    original_format = output_mode.format
    original_quiet = output_mode.quiet
    output_mode._json_buffer.clear()

    yield

    output_mode.format = original_format
    output_mode.quiet = original_quiet
    output_mode._json_buffer.clear()


@pytest.fixture
def mock_runtime_config(tmp_path):
    """Create a mock RuntimeConfig."""
    return RuntimeConfig(
        run_settings=RunSettings(
            output_dir=str(tmp_path / "output"),
            sqlite_db_path=str(tmp_path / "watcher.db"),
            models=[
                ModelConfig(
                    provider="openai",
                    model_name="gpt-4o-mini",
                    env_api_key="OPENAI_API_KEY",
                )
            ],
            use_llm_rank_extraction=False,
        ),
        brands=Brands(mine=["MyBrand"], competitors=["Competitor1"]),
        intents=[Intent(id="test-intent-1", prompt="What are the best tools?")],
        models=[
            RuntimeModel(
                provider="openai",
                model_name="gpt-4o-mini",
                api_key="sk-test-key",
                system_prompt="You are ChatGPT, a helpful AI assistant.",
                tools=None,
                tool_choice="auto",
            )
        ],
    )


# ============================================================================
# Test Run Command - Basic Success
# ============================================================================


class TestRunCommandSuccess:
    """Test run command with successful execution."""

    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_with_valid_config_exits_success(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        mock_successful_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Run command with valid config should exit with code 0."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = mock_successful_run

        result = cli_runner.invoke(
            app, ["run", "--config", str(valid_config_yaml), "--yes"]
        )

        assert result.exit_code == EXIT_SUCCESS

    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_loads_config_from_file(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        mock_successful_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Run command should load config from specified file."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = mock_successful_run

        result = cli_runner.invoke(
            app, ["run", "--config", str(valid_config_yaml), "--yes"]
        )

        mock_load_config.assert_called_once()
        assert result.exit_code == EXIT_SUCCESS

    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_initializes_database(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        mock_successful_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Run command should initialize database."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = mock_successful_run

        result = cli_runner.invoke(
            app, ["run", "--config", str(valid_config_yaml), "--yes"]
        )

        mock_init_db.assert_called_once()
        assert result.exit_code == EXIT_SUCCESS

    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_executes_queries(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        mock_successful_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Run command should execute all queries via run_all()."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = mock_successful_run

        result = cli_runner.invoke(
            app, ["run", "--config", str(valid_config_yaml), "--yes"]
        )

        mock_run_all.assert_called_once_with(mock_runtime_config)
        assert result.exit_code == EXIT_SUCCESS

    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_generates_html_report(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        mock_successful_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Run command should generate HTML report."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = mock_successful_run

        result = cli_runner.invoke(
            app, ["run", "--config", str(valid_config_yaml), "--yes"]
        )

        mock_write_report.assert_called_once()
        assert result.exit_code == EXIT_SUCCESS


# ============================================================================
# Test Run Command - Exit Codes
# ============================================================================


class TestRunCommandExitCodes:
    """Test run command exit codes for different scenarios."""

    @patch("llm_answer_watcher.cli.load_config")
    def test_run_missing_config_file_exits_config_error(
        self, mock_load_config, cli_runner, tmp_path, reset_output_mode
    ):
        """Run with missing config file should exit with code 1."""
        # Create a file that exists but load_config will fail on
        temp_file = tmp_path / "config.yaml"
        temp_file.write_text("# temp config")

        mock_load_config.side_effect = FileNotFoundError("Config file not found")

        result = cli_runner.invoke(app, ["run", "--config", str(temp_file)])

        assert result.exit_code == EXIT_CONFIG_ERROR

    @patch("llm_answer_watcher.cli.load_config")
    def test_run_invalid_config_exits_config_error(
        self, mock_load_config, cli_runner, valid_config_yaml, reset_output_mode
    ):
        """Run with invalid config should exit with code 1."""
        mock_load_config.side_effect = ValueError("Configuration validation failed")

        result = cli_runner.invoke(app, ["run", "--config", str(valid_config_yaml)])

        assert result.exit_code == EXIT_CONFIG_ERROR

    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_database_error_exits_db_error(
        self,
        mock_load_config,
        mock_init_db,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        monkeypatch,
        reset_output_mode,
    ):
        """Run with database error should exit with code 2."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_init_db.side_effect = Exception("Database initialization failed")

        result = cli_runner.invoke(
            app, ["run", "--config", str(valid_config_yaml), "--yes"]
        )

        assert result.exit_code == EXIT_DB_ERROR

    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_partial_failure_exits_partial_failure(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        cli_runner,
        valid_config_yaml,
        tmp_path,
        mock_partial_failure_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Run with partial failure should exit with code 3."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        # Create config with 2 intents to match partial failure fixture
        config_with_2_intents = RuntimeConfig(
            run_settings=RunSettings(
                output_dir=str(tmp_path / "output"),
                sqlite_db_path=str(tmp_path / "watcher.db"),
                models=[
                    ModelConfig(
                        provider="openai",
                        model_name="gpt-4o-mini",
                        env_api_key="OPENAI_API_KEY",
                    )
                ],
                use_llm_rank_extraction=False,
            ),
            brands=Brands(mine=["MyBrand"], competitors=["Competitor1"]),
            intents=[
                Intent(id="test-intent-1", prompt="What are the best tools?"),
                Intent(id="test-intent-2", prompt="What are the top tools?"),
            ],
            models=[
                RuntimeModel(
                    provider="openai",
                    model_name="gpt-4o-mini",
                    api_key="sk-test-key",
                    system_prompt="You are a helpful assistant.",
                )
            ],
        )

        mock_load_config.return_value = config_with_2_intents
        mock_run_all.return_value = mock_partial_failure_run

        result = cli_runner.invoke(
            app, ["run", "--config", str(valid_config_yaml), "--yes"]
        )

        assert result.exit_code == EXIT_PARTIAL_FAILURE

    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_complete_failure_exits_complete_failure(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        mock_complete_failure_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Run with complete failure should exit with code 4."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = mock_complete_failure_run

        result = cli_runner.invoke(
            app, ["run", "--config", str(valid_config_yaml), "--yes"]
        )

        assert result.exit_code == EXIT_COMPLETE_FAILURE


# ============================================================================
# Test Run Command - Output Modes
# ============================================================================


class TestRunCommandOutputModes:
    """Test run command output in different modes."""

    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_human_mode_default(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        mock_successful_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Run without --format flag should use human mode (text)."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = mock_successful_run

        result = cli_runner.invoke(
            app, ["run", "--config", str(valid_config_yaml), "--yes"]
        )

        # Output should contain Rich formatting (human mode)
        assert result.exit_code == EXIT_SUCCESS
        # Human mode shows success messages
        assert "✓" in result.output or "success" in result.output.lower()

    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_agent_mode_json_output(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        mock_successful_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Run with --format json should output valid JSON."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = mock_successful_run

        result = cli_runner.invoke(
            app,
            ["run", "--config", str(valid_config_yaml), "--format", "json", "--yes"],
        )

        assert result.exit_code == EXIT_SUCCESS

        # Output should be valid JSON
        try:
            data = json.loads(result.output)
            assert "run_id" in data
            assert "output_dir" in data
            assert "total_cost_usd" in data
        except json.JSONDecodeError:
            pytest.fail("Output is not valid JSON")

    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_agent_mode_no_ansi_codes(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        mock_successful_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Run in agent mode should not output ANSI codes."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = mock_successful_run

        result = cli_runner.invoke(
            app,
            ["run", "--config", str(valid_config_yaml), "--format", "json", "--yes"],
        )

        assert result.exit_code == EXIT_SUCCESS

        # Check for ANSI escape codes
        ansi_pattern = re.compile(r"\x1b\[[0-9;]*m")
        assert not ansi_pattern.search(result.output), (
            "ANSI codes found in agent mode output"
        )

    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_agent_mode_json_has_required_fields(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        mock_successful_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Run in agent mode should output JSON with all required fields."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = mock_successful_run

        result = cli_runner.invoke(
            app,
            ["run", "--config", str(valid_config_yaml), "--format", "json", "--yes"],
        )

        assert result.exit_code == EXIT_SUCCESS

        data = json.loads(result.output)

        # Required fields from print_final_summary()
        assert "run_id" in data
        assert data["run_id"] == "2025-11-02T08-00-00Z"

        assert "output_dir" in data
        assert "total_cost_usd" in data
        assert data["total_cost_usd"] == 0.001234

        assert "successful_queries" in data
        assert data["successful_queries"] == 1

        assert "total_queries" in data
        assert data["total_queries"] == 1

    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_quiet_mode_minimal_output(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        mock_successful_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Run with --quiet should output minimal tab-separated values."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = mock_successful_run

        result = cli_runner.invoke(
            app, ["run", "--config", str(valid_config_yaml), "--quiet", "--yes"]
        )

        assert result.exit_code == EXIT_SUCCESS

        # Quiet mode outputs tab-separated final summary
        # Should contain tab characters
        assert "\t" in result.output


# ============================================================================
# Test Run Command - Flags
# ============================================================================


class TestRunCommandFlags:
    """Test run command with various flags."""

    @patch("llm_answer_watcher.cli.typer.confirm")
    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_yes_flag_skips_confirmation(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        mock_confirm,
        cli_runner,
        valid_config_yaml,
        monkeypatch,
        reset_output_mode,
    ):
        """Run with --yes should skip confirmation prompts."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        # Create config with many intents to trigger confirmation
        config = RuntimeConfig(
            run_settings=RunSettings(
                output_dir="./output",
                sqlite_db_path="./watcher.db",
                models=[
                    ModelConfig(
                        provider="openai",
                        model_name="gpt-4o-mini",
                        env_api_key="OPENAI_API_KEY",
                    )
                ],
                use_llm_rank_extraction=False,
            ),
            brands=Brands(mine=["MyBrand"], competitors=[]),
            intents=[Intent(id=f"intent-{i}", prompt=f"Prompt {i}") for i in range(20)],
            models=[
                RuntimeModel(
                    provider="openai",
                    model_name="gpt-4o-mini",
                    api_key="sk-test-key",
                    system_prompt="You are a helpful assistant.",
                )
            ],
        )

        mock_load_config.return_value = config
        mock_run_all.return_value = {
            "run_id": "2025-11-02T08-00-00Z",
            "timestamp_utc": "2025-11-02T08:00:00Z",
            "output_dir": "./output/2025-11-02T08-00-00Z",
            "total_intents": 20,
            "total_models": 1,
            "total_queries": 20,
            "success_count": 20,
            "error_count": 0,
            "total_cost_usd": 0.040,
            "errors": [],
        }

        result = cli_runner.invoke(
            app, ["run", "--config", str(valid_config_yaml), "--yes"]
        )

        assert result.exit_code == EXIT_SUCCESS

        # Confirmation should not be called with --yes
        mock_confirm.assert_not_called()

    @patch("llm_answer_watcher.cli.typer.confirm")
    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_shows_confirmation_for_expensive_queries(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        mock_confirm,
        cli_runner,
        valid_config_yaml,
        monkeypatch,
        reset_output_mode,
    ):
        """Run with many queries should show confirmation in human mode."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        # Create config with 15 intents (more than 10 triggers confirmation)
        config = RuntimeConfig(
            run_settings=RunSettings(
                output_dir="./output",
                sqlite_db_path="./watcher.db",
                models=[
                    ModelConfig(
                        provider="openai",
                        model_name="gpt-4o-mini",
                        env_api_key="OPENAI_API_KEY",
                    )
                ],
                use_llm_rank_extraction=False,
            ),
            brands=Brands(mine=["MyBrand"], competitors=[]),
            intents=[Intent(id=f"intent-{i}", prompt=f"Prompt {i}") for i in range(15)],
            models=[
                RuntimeModel(
                    provider="openai",
                    model_name="gpt-4o-mini",
                    api_key="sk-test-key",
                    system_prompt="You are a helpful assistant.",
                )
            ],
        )

        mock_load_config.return_value = config
        mock_confirm.return_value = True  # User confirms
        mock_run_all.return_value = {
            "run_id": "2025-11-02T08-00-00Z",
            "timestamp_utc": "2025-11-02T08:00:00Z",
            "output_dir": "./output/2025-11-02T08-00-00Z",
            "total_intents": 15,
            "total_models": 1,
            "total_queries": 15,
            "success_count": 15,
            "error_count": 0,
            "total_cost_usd": 0.030,
            "errors": [],
        }

        result = cli_runner.invoke(app, ["run", "--config", str(valid_config_yaml)])

        # Confirmation should be called (without --yes flag)
        mock_confirm.assert_called_once()

    @patch("llm_answer_watcher.cli.typer.confirm")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_user_cancels_confirmation(
        self,
        mock_load_config,
        mock_init_db,
        mock_confirm,
        cli_runner,
        valid_config_yaml,
        monkeypatch,
        reset_output_mode,
    ):
        """Run cancelled by user should exit with code 0."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        # Create config with many intents
        config = RuntimeConfig(
            run_settings=RunSettings(
                output_dir="./output",
                sqlite_db_path="./watcher.db",
                models=[
                    ModelConfig(
                        provider="openai",
                        model_name="gpt-4o-mini",
                        env_api_key="OPENAI_API_KEY",
                    )
                ],
                use_llm_rank_extraction=False,
            ),
            brands=Brands(mine=["MyBrand"], competitors=[]),
            intents=[Intent(id=f"intent-{i}", prompt=f"Prompt {i}") for i in range(15)],
            models=[
                RuntimeModel(
                    provider="openai",
                    model_name="gpt-4o-mini",
                    api_key="sk-test-key",
                    system_prompt="You are a helpful assistant.",
                )
            ],
        )

        mock_load_config.return_value = config
        mock_confirm.return_value = False  # User cancels

        result = cli_runner.invoke(app, ["run", "--config", str(valid_config_yaml)])

        assert result.exit_code == EXIT_SUCCESS
        assert (
            "Cancelled by user" in result.output or "cancelled" in result.output.lower()
        )

    @patch("llm_answer_watcher.cli.setup_logging")
    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_verbose_flag_enables_debug_logging(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        mock_setup_logging,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        mock_successful_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Run with --verbose should enable debug logging."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = mock_successful_run

        result = cli_runner.invoke(
            app, ["run", "--config", str(valid_config_yaml), "--verbose", "--yes"]
        )

        assert result.exit_code == EXIT_SUCCESS

        # setup_logging should be called with verbose=True
        # Note: quiet_logs is set based on output format (agent/quiet modes)
        mock_setup_logging.assert_called_once()
        call_kwargs = mock_setup_logging.call_args.kwargs
        assert call_kwargs["verbose"] is True

    @patch("llm_answer_watcher.cli.load_config")
    def test_run_verbose_shows_traceback_on_error(
        self, mock_load_config, cli_runner, valid_config_yaml, reset_output_mode
    ):
        """Run with --verbose should show traceback on config error."""
        mock_load_config.side_effect = ValueError(
            "Config validation failed: test error"
        )

        result = cli_runner.invoke(
            app, ["run", "--config", str(valid_config_yaml), "--verbose"]
        )

        assert result.exit_code == EXIT_CONFIG_ERROR
        # Verbose mode should show error message
        assert (
            "test error" in result.output.lower()
            or "validation" in result.output.lower()
        )


# ============================================================================
# Test Run Command - Error Handling
# ============================================================================


class TestRunCommandErrorHandling:
    """Test run command error handling."""

    @patch("llm_answer_watcher.cli.load_config")
    def test_run_file_not_found_error(
        self, mock_load_config, cli_runner, tmp_path, reset_output_mode
    ):
        """Run with FileNotFoundError should exit with config error."""
        # Create a file that exists but load_config will fail on
        temp_file = tmp_path / "config.yaml"
        temp_file.write_text("# temp config")

        mock_load_config.side_effect = FileNotFoundError(
            "Config file not found: test.yaml"
        )

        result = cli_runner.invoke(app, ["run", "--config", str(temp_file)])

        assert result.exit_code == EXIT_CONFIG_ERROR
        assert "not found" in result.output.lower()

    @patch("llm_answer_watcher.cli.load_config")
    def test_run_value_error(
        self, mock_load_config, cli_runner, valid_config_yaml, reset_output_mode
    ):
        """Run with ValueError should exit with config error."""
        mock_load_config.side_effect = ValueError("Invalid configuration")

        result = cli_runner.invoke(app, ["run", "--config", str(valid_config_yaml)])

        assert result.exit_code == EXIT_CONFIG_ERROR
        assert (
            "validation failed" in result.output.lower()
            or "invalid" in result.output.lower()
        )

    @patch("llm_answer_watcher.cli.load_config")
    def test_run_unexpected_error_during_config_load(
        self, mock_load_config, cli_runner, valid_config_yaml, reset_output_mode
    ):
        """Run with unexpected error during config load should exit with config error."""
        mock_load_config.side_effect = RuntimeError("Unexpected error")

        result = cli_runner.invoke(app, ["run", "--config", str(valid_config_yaml)])

        assert result.exit_code == EXIT_CONFIG_ERROR
        assert (
            "unexpected error" in result.output.lower()
            or "error" in result.output.lower()
        )

    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_database_initialization_error(
        self,
        mock_load_config,
        mock_init_db,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        monkeypatch,
        reset_output_mode,
    ):
        """Run with database initialization error should exit with db error."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_init_db.side_effect = Exception("Failed to initialize database")

        result = cli_runner.invoke(
            app, ["run", "--config", str(valid_config_yaml), "--yes"]
        )

        assert result.exit_code == EXIT_DB_ERROR
        assert "database" in result.output.lower()

    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_execution_error(
        self,
        mock_load_config,
        mock_init_db,
        mock_run_all,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        monkeypatch,
        reset_output_mode,
    ):
        """Run with execution error should exit with db error."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.side_effect = Exception("Run failed unexpectedly")

        result = cli_runner.invoke(
            app, ["run", "--config", str(valid_config_yaml), "--yes"]
        )

        assert result.exit_code == EXIT_DB_ERROR
        assert "failed" in result.output.lower()


# ============================================================================
# Test Validate Command
# ============================================================================


class TestValidateCommand:
    """Test validate command."""

    @patch("llm_answer_watcher.cli.spinner")
    @patch("llm_answer_watcher.cli.load_config")
    def test_validate_with_valid_config_exits_success(
        self,
        mock_load_config,
        mock_spinner,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        monkeypatch,
        reset_output_mode,
    ):
        """Validate with valid config should exit with code 0."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        # Mock spinner as no-op context manager
        @contextmanager
        def noop_spinner(*args, **kwargs):
            yield None

        mock_spinner.side_effect = noop_spinner

        mock_load_config.return_value = mock_runtime_config

        result = cli_runner.invoke(
            app, ["validate", "--config", str(valid_config_yaml)]
        )

        assert result.exit_code == EXIT_SUCCESS
        assert "valid" in result.output.lower()

    @patch("llm_answer_watcher.cli.spinner")
    @patch("llm_answer_watcher.cli.load_config")
    def test_validate_shows_config_counts(
        self,
        mock_load_config,
        mock_spinner,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        monkeypatch,
        reset_output_mode,
    ):
        """Validate should show intent, model, and brand counts."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        # Mock spinner as no-op context manager
        @contextmanager
        def noop_spinner(*args, **kwargs):
            yield None

        mock_spinner.side_effect = noop_spinner

        mock_load_config.return_value = mock_runtime_config

        result = cli_runner.invoke(
            app, ["validate", "--config", str(valid_config_yaml)]
        )

        assert result.exit_code == EXIT_SUCCESS
        # Should show counts
        assert "1" in result.output  # 1 intent, 1 model
        assert "intents" in result.output.lower() or "models" in result.output.lower()

    @patch("llm_answer_watcher.cli.load_config")
    def test_validate_with_invalid_config_exits_config_error(
        self, mock_load_config, cli_runner, invalid_config_yaml, reset_output_mode
    ):
        """Validate with invalid config should exit with code 1."""
        mock_load_config.side_effect = ValueError("Configuration validation failed")

        result = cli_runner.invoke(
            app, ["validate", "--config", str(invalid_config_yaml)]
        )

        assert result.exit_code == EXIT_CONFIG_ERROR
        assert (
            "validation failed" in result.output.lower()
            or "failed" in result.output.lower()
        )

    @patch("llm_answer_watcher.cli.load_config")
    def test_validate_with_missing_file_exits_config_error(
        self, mock_load_config, cli_runner, tmp_path, reset_output_mode
    ):
        """Validate with missing file should exit with code 1."""
        # Create a file that exists but load_config will fail on
        temp_file = tmp_path / "config.yaml"
        temp_file.write_text("# temp config")

        mock_load_config.side_effect = FileNotFoundError("Config file not found")

        result = cli_runner.invoke(app, ["validate", "--config", str(temp_file)])

        assert result.exit_code == EXIT_CONFIG_ERROR
        assert "not found" in result.output.lower()

    @patch("llm_answer_watcher.cli.spinner")
    @patch("llm_answer_watcher.cli.load_config")
    def test_validate_json_output_valid(
        self,
        mock_load_config,
        mock_spinner,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        monkeypatch,
        reset_output_mode,
    ):
        """Validate with --format json should output valid JSON."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        # Mock spinner as no-op context manager
        @contextmanager
        def noop_spinner(*args, **kwargs):
            yield None

        mock_spinner.side_effect = noop_spinner

        mock_load_config.return_value = mock_runtime_config

        result = cli_runner.invoke(
            app, ["validate", "--config", str(valid_config_yaml), "--format", "json"]
        )

        assert result.exit_code == EXIT_SUCCESS

        # Should be valid JSON
        data = json.loads(result.output)
        assert data["valid"] is True
        assert "intents_count" in data
        assert "models_count" in data
        assert data["intents_count"] == 1
        assert data["models_count"] == 1

    @patch("llm_answer_watcher.cli.load_config")
    def test_validate_json_output_invalid_config(
        self, mock_load_config, cli_runner, invalid_config_yaml, reset_output_mode
    ):
        """Validate with invalid config in JSON mode should output error JSON."""
        mock_load_config.side_effect = ValueError("Validation error")

        result = cli_runner.invoke(
            app, ["validate", "--config", str(invalid_config_yaml), "--format", "json"]
        )

        assert result.exit_code == EXIT_CONFIG_ERROR

        # Should be valid JSON with error
        data = json.loads(result.output)
        assert data["valid"] is False
        assert "error" in data
        assert data["error_type"] == "validation_error"

    @patch("llm_answer_watcher.cli.load_config")
    def test_validate_json_output_missing_file(
        self, mock_load_config, cli_runner, tmp_path, reset_output_mode
    ):
        """Validate with missing file in JSON mode should output error JSON."""
        # Create a file that exists but load_config will fail on
        temp_file = tmp_path / "config.yaml"
        temp_file.write_text("# temp config")

        mock_load_config.side_effect = FileNotFoundError("File not found")

        result = cli_runner.invoke(
            app, ["validate", "--config", str(temp_file), "--format", "json"]
        )

        assert result.exit_code == EXIT_CONFIG_ERROR

        # Should be valid JSON with error
        data = json.loads(result.output)
        assert data["valid"] is False
        assert "error" in data
        assert data["error_type"] == "file_not_found"

    @patch("llm_answer_watcher.cli.load_config")
    def test_validate_json_output_unexpected_error(
        self, mock_load_config, cli_runner, valid_config_yaml, reset_output_mode
    ):
        """Validate with unexpected error in JSON mode should output error JSON."""
        mock_load_config.side_effect = RuntimeError("Unexpected error")

        result = cli_runner.invoke(
            app, ["validate", "--config", str(valid_config_yaml), "--format", "json"]
        )

        assert result.exit_code == EXIT_CONFIG_ERROR

        # Should be valid JSON with error
        data = json.loads(result.output)
        assert data["valid"] is False
        assert "error" in data
        assert data["error_type"] == "unknown_error"


# ============================================================================
# Test Main Callback (Version)
# ============================================================================


class TestMainCallback:
    """Test main callback with --version flag."""

    def test_version_flag_prints_version(self, cli_runner, reset_output_mode):
        """--version flag should print version and exit with code 0."""
        result = cli_runner.invoke(app, ["--version"])

        assert result.exit_code == EXIT_SUCCESS
        assert "0.1.0" in result.output
        assert "llm-answer-watcher" in result.output.lower()

    def test_version_flag_reads_version_file(self, cli_runner, reset_output_mode):
        """--version should read VERSION file."""
        result = cli_runner.invoke(app, ["--version"])

        assert result.exit_code == EXIT_SUCCESS
        # VERSION file contains "0.1.0"
        assert "0.1.0" in result.output

    def test_no_command_shows_help(self, cli_runner, reset_output_mode):
        """Running without command should show help."""
        result = cli_runner.invoke(app, [])

        # Should not error, just show help
        assert "run" in result.output.lower()
        assert "validate" in result.output.lower()

    def test_help_flag(self, cli_runner, reset_output_mode):
        """--help flag should show help."""
        result = cli_runner.invoke(app, ["--help"])

        assert "run" in result.output.lower()
        assert "validate" in result.output.lower()


# ============================================================================
# Test Progress Bar Display
# ============================================================================


class TestProgressBarDisplay:
    """Test progress bar display in different modes."""

    @patch("llm_answer_watcher.cli.create_progress_bar")
    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_progress_bar_shown_in_human_mode(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        mock_create_progress_bar,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        mock_successful_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Progress bar should be shown in human mode."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = mock_successful_run

        # Mock progress bar
        mock_progress = MagicMock()
        mock_progress.__enter__ = MagicMock(return_value=mock_progress)
        mock_progress.__exit__ = MagicMock(return_value=False)
        mock_create_progress_bar.return_value = mock_progress

        result = cli_runner.invoke(
            app, ["run", "--config", str(valid_config_yaml), "--yes"]
        )

        assert result.exit_code == EXIT_SUCCESS

        # Progress bar should be created in human mode
        mock_create_progress_bar.assert_called_once()

    @patch("llm_answer_watcher.cli.create_progress_bar")
    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_progress_bar_hidden_in_agent_mode(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        mock_create_progress_bar,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        mock_successful_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Progress bar should be hidden in agent mode."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = mock_successful_run

        # Mock progress bar (should return NoOpProgress)
        from llm_answer_watcher.utils.console import NoOpProgress

        mock_create_progress_bar.return_value = NoOpProgress()

        result = cli_runner.invoke(
            app,
            ["run", "--config", str(valid_config_yaml), "--format", "json", "--yes"],
        )

        assert result.exit_code == EXIT_SUCCESS

        # Progress bar should still be created (but NoOp)
        mock_create_progress_bar.assert_called_once()


# ============================================================================
# Test Integration Scenarios
# ============================================================================


class TestIntegrationScenarios:
    """Integration tests combining multiple features."""

    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_full_successful_run_workflow(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        mock_successful_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Test complete successful run workflow."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = mock_successful_run

        result = cli_runner.invoke(
            app, ["run", "--config", str(valid_config_yaml), "--yes"]
        )

        assert result.exit_code == EXIT_SUCCESS

        # Verify all components were called
        mock_load_config.assert_called_once()
        mock_init_db.assert_called_once()
        mock_run_all.assert_called_once()
        mock_write_report.assert_called_once()

    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_agent_mode_json_complete_workflow(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        mock_successful_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Test complete workflow in agent mode with JSON output."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = mock_successful_run

        result = cli_runner.invoke(
            app,
            ["run", "--config", str(valid_config_yaml), "--format", "json", "--yes"],
        )

        assert result.exit_code == EXIT_SUCCESS

        # Output should be valid JSON
        data = json.loads(result.output)

        # Verify JSON structure
        assert data["run_id"] == "2025-11-02T08-00-00Z"
        assert data["total_cost_usd"] == 0.001234
        assert data["successful_queries"] == 1
        assert data["total_queries"] == 1

        # No ANSI codes
        ansi_pattern = re.compile(r"\x1b\[[0-9;]*m")
        assert not ansi_pattern.search(result.output)

    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_partial_failure_workflow_with_errors(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        cli_runner,
        valid_config_yaml,
        tmp_path,
        mock_partial_failure_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Test workflow with partial failures."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        # Create config with 2 intents to match partial failure fixture
        config_with_2_intents = RuntimeConfig(
            run_settings=RunSettings(
                output_dir=str(tmp_path / "output"),
                sqlite_db_path=str(tmp_path / "watcher.db"),
                models=[
                    ModelConfig(
                        provider="openai",
                        model_name="gpt-4o-mini",
                        env_api_key="OPENAI_API_KEY",
                    )
                ],
                use_llm_rank_extraction=False,
            ),
            brands=Brands(mine=["MyBrand"], competitors=["Competitor1"]),
            intents=[
                Intent(id="test-intent-1", prompt="What are the best tools?"),
                Intent(id="test-intent-2", prompt="What are the top tools?"),
            ],
            models=[
                RuntimeModel(
                    provider="openai",
                    model_name="gpt-4o-mini",
                    api_key="sk-test-key",
                    system_prompt="You are a helpful assistant.",
                )
            ],
        )

        mock_load_config.return_value = config_with_2_intents
        mock_run_all.return_value = mock_partial_failure_run

        result = cli_runner.invoke(
            app,
            ["run", "--config", str(valid_config_yaml), "--format", "json", "--yes"],
        )

        assert result.exit_code == EXIT_PARTIAL_FAILURE

        # Output should be valid JSON
        data = json.loads(result.output)

        # Verify partial success stats
        assert data["successful_queries"] == 1
        assert data["total_queries"] == 2


# ============================================================================
# Test Edge Cases
# ============================================================================


class TestEdgeCases:
    """Test edge cases and unusual scenarios."""

    @patch("llm_answer_watcher.cli.load_config")
    def test_run_with_empty_config_file(
        self, mock_load_config, cli_runner, empty_config_yaml, reset_output_mode
    ):
        """Run with empty config file should fail gracefully."""
        mock_load_config.side_effect = ValueError("Configuration file is empty")

        result = cli_runner.invoke(app, ["run", "--config", str(empty_config_yaml)])

        assert result.exit_code == EXIT_CONFIG_ERROR
        assert "empty" in result.output.lower() or "failed" in result.output.lower()

    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_with_zero_cost(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        monkeypatch,
        reset_output_mode,
    ):
        """Run with zero cost should succeed."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = {
            "run_id": "2025-11-02T08-00-00Z",
            "timestamp_utc": "2025-11-02T08:00:00Z",
            "output_dir": "./output/2025-11-02T08-00-00Z",
            "total_intents": 1,
            "total_models": 1,
            "total_queries": 1,
            "success_count": 1,
            "error_count": 0,
            "total_cost_usd": 0.0,  # Zero cost
            "errors": [],
        }

        result = cli_runner.invoke(
            app,
            ["run", "--config", str(valid_config_yaml), "--format", "json", "--yes"],
        )

        assert result.exit_code == EXIT_SUCCESS

        data = json.loads(result.output)
        assert data["total_cost_usd"] == 0.0

    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_with_very_large_cost(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        monkeypatch,
        reset_output_mode,
    ):
        """Run with very large cost should succeed."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = {
            "run_id": "2025-11-02T08-00-00Z",
            "timestamp_utc": "2025-11-02T08:00:00Z",
            "output_dir": "./output/2025-11-02T08-00-00Z",
            "total_intents": 1,
            "total_models": 1,
            "total_queries": 1,
            "success_count": 1,
            "error_count": 0,
            "total_cost_usd": 999999.999999,  # Very large cost
            "errors": [],
        }

        result = cli_runner.invoke(
            app,
            ["run", "--config", str(valid_config_yaml), "--format", "json", "--yes"],
        )

        assert result.exit_code == EXIT_SUCCESS

        data = json.loads(result.output)
        assert data["total_cost_usd"] == 999999.999999

    def test_run_with_nonexistent_config_path(self, cli_runner, reset_output_mode):
        """Run with completely nonexistent path should fail gracefully."""
        result = cli_runner.invoke(
            app, ["run", "--config", "/totally/nonexistent/path/config.yaml"]
        )

        # Should fail before even trying to load config (Typer validates exists=True)
        assert result.exit_code != EXIT_SUCCESS

    @patch("llm_answer_watcher.cli.load_config")
    def test_validate_with_nonexistent_config_path(
        self, mock_load_config, cli_runner, reset_output_mode
    ):
        """Validate with nonexistent path should fail gracefully."""
        mock_load_config.side_effect = FileNotFoundError("File not found")

        result = cli_runner.invoke(
            app, ["validate", "--config", "/nonexistent/config.yaml"]
        )

        # Typer exists=True validation will catch this before our code runs
        assert result.exit_code != EXIT_SUCCESS


# ============================================================================
# Test Console Output Functions
# ============================================================================


class TestConsoleOutputFunctions:
    """Test that console output functions are called correctly."""

    @patch("llm_answer_watcher.cli.print_banner")
    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_calls_print_banner(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        mock_print_banner,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        mock_successful_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Run should call print_banner with version."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = mock_successful_run

        result = cli_runner.invoke(
            app, ["run", "--config", str(valid_config_yaml), "--yes"]
        )

        assert result.exit_code == EXIT_SUCCESS

        # Banner should be called with version
        mock_print_banner.assert_called_once()
        call_args = mock_print_banner.call_args[0]
        assert "0.1.0" in call_args[0]

    @patch("llm_answer_watcher.cli.print_summary_table")
    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_calls_print_summary_table(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        mock_print_summary_table,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        mock_successful_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Run should call print_summary_table with results."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = mock_successful_run

        result = cli_runner.invoke(
            app, ["run", "--config", str(valid_config_yaml), "--yes"]
        )

        assert result.exit_code == EXIT_SUCCESS

        # Summary table should be called
        mock_print_summary_table.assert_called_once()

    @patch("llm_answer_watcher.cli.print_final_summary")
    @patch("llm_answer_watcher.cli.run_all")
    @patch("llm_answer_watcher.cli.write_report")
    @patch("llm_answer_watcher.cli.init_db_if_needed")
    @patch("llm_answer_watcher.cli.load_config")
    def test_run_calls_print_final_summary(
        self,
        mock_load_config,
        mock_init_db,
        mock_write_report,
        mock_run_all,
        mock_print_final_summary,
        cli_runner,
        valid_config_yaml,
        mock_runtime_config,
        mock_successful_run,
        monkeypatch,
        reset_output_mode,
    ):
        """Run should call print_final_summary with run stats."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

        mock_load_config.return_value = mock_runtime_config
        mock_run_all.return_value = mock_successful_run

        result = cli_runner.invoke(
            app, ["run", "--config", str(valid_config_yaml), "--yes"]
        )

        assert result.exit_code == EXIT_SUCCESS

        # Final summary should be called with correct args
        mock_print_final_summary.assert_called_once_with(
            run_id="2025-11-02T08-00-00Z",
            output_dir="./output/2025-11-02T08-00-00Z",
            total_cost=0.001234,
            successful=1,
            total=1,
        )
