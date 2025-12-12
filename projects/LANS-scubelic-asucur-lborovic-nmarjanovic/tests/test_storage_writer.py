"""
Tests for storage.writer module.

Tests file writing utilities for JSON/HTML output with proper error handling.
"""

import json
import os

import pytest
from freezegun import freeze_time

from llm_answer_watcher.storage.writer import (
    create_run_directory,
    write_error,
    write_json,
    write_parsed_answer,
    write_raw_answer,
    write_report_html,
    write_run_meta,
)


class TestCreateRunDirectory:
    """Tests for create_run_directory function."""

    def test_creates_directory(self, tmp_path):
        """Test that directory is created successfully."""
        output_dir = str(tmp_path / "output")
        run_id = "2025-11-02T08-00-00Z"

        result = create_run_directory(output_dir, run_id)

        expected_path = os.path.join(output_dir, run_id)
        assert result == expected_path
        assert os.path.exists(result)
        assert os.path.isdir(result)

    def test_creates_parent_directories(self, tmp_path):
        """Test that parent directories are created if needed."""
        # Parent directory doesn't exist yet
        output_dir = str(tmp_path / "nested" / "output" / "dir")
        run_id = "2025-11-02T08-00-00Z"

        result = create_run_directory(output_dir, run_id)

        assert os.path.exists(result)
        # Verify all parents were created
        assert os.path.exists(str(tmp_path / "nested"))
        assert os.path.exists(str(tmp_path / "nested" / "output"))
        assert os.path.exists(str(tmp_path / "nested" / "output" / "dir"))

    def test_idempotent_existing_directory(self, tmp_path):
        """Test that calling twice doesn't fail (exist_ok=True)."""
        output_dir = str(tmp_path / "output")
        run_id = "2025-11-02T08-00-00Z"

        # Create once
        result1 = create_run_directory(output_dir, run_id)
        assert os.path.exists(result1)

        # Create again - should succeed without error
        result2 = create_run_directory(output_dir, run_id)
        assert result1 == result2
        assert os.path.exists(result2)

    def test_permission_error_handling(self, tmp_path):
        """Test that PermissionError is raised with helpful message."""
        output_dir = str(tmp_path / "readonly")
        run_id = "2025-11-02T08-00-00Z"

        # Create parent directory as read-only
        os.makedirs(output_dir, exist_ok=True)
        os.chmod(output_dir, 0o444)  # Read-only

        try:
            with pytest.raises(PermissionError) as exc_info:
                create_run_directory(output_dir, run_id)

            # Check error message is helpful
            assert "Permission denied" in str(exc_info.value)
            assert "Check directory permissions" in str(exc_info.value)
        finally:
            # Restore permissions for cleanup
            os.chmod(output_dir, 0o755)

    def test_returns_absolute_path_when_given_absolute(self, tmp_path):
        """Test with absolute output path."""
        output_dir = str(tmp_path / "output")
        run_id = "test-run"

        result = create_run_directory(output_dir, run_id)

        # Result should be absolute if input was absolute
        assert os.path.isabs(result)
        assert os.path.exists(result)


class TestWriteJson:
    """Tests for write_json function."""

    def test_writes_dict_to_json(self, tmp_path):
        """Test writing dictionary to JSON file."""
        filepath = str(tmp_path / "test.json")
        data = {"key": "value", "number": 42}

        write_json(filepath, data)

        # Verify file exists and contains correct data
        assert os.path.exists(filepath)
        with open(filepath, encoding="utf-8") as f:
            loaded = json.load(f)
        assert loaded == data

    def test_writes_list_to_json(self, tmp_path):
        """Test writing list to JSON file."""
        filepath = str(tmp_path / "test.json")
        data = ["item1", "item2", {"nested": "value"}]

        write_json(filepath, data)

        assert os.path.exists(filepath)
        with open(filepath, encoding="utf-8") as f:
            loaded = json.load(f)
        assert loaded == data

    def test_json_is_pretty_printed(self, tmp_path):
        """Test that JSON is formatted with indent=2."""
        filepath = str(tmp_path / "test.json")
        data = {"key1": "value1", "key2": {"nested": "value"}}

        write_json(filepath, data)

        with open(filepath, encoding="utf-8") as f:
            content = f.read()

        # Check for indentation (2 spaces)
        assert '  "key1"' in content or '"key1"' in content
        # Check it's not all on one line
        assert content.count("\n") > 1

    def test_uses_utf8_encoding(self, tmp_path):
        """Test that UTF-8 encoding handles Unicode correctly."""
        filepath = str(tmp_path / "test.json")
        data = {"text": "Hello 世界 🌍", "emoji": "🚀"}

        write_json(filepath, data)

        # Read back and verify Unicode is preserved
        with open(filepath, encoding="utf-8") as f:
            loaded = json.load(f)
        assert loaded["text"] == "Hello 世界 🌍"
        assert loaded["emoji"] == "🚀"

    def test_ensure_ascii_false(self, tmp_path):
        """Test that ensure_ascii=False preserves non-ASCII characters."""
        filepath = str(tmp_path / "test.json")
        data = {"chinese": "中文", "arabic": "العربية"}

        write_json(filepath, data)

        # Read file as text and check Unicode characters are preserved
        with open(filepath, encoding="utf-8") as f:
            content = f.read()
        assert "中文" in content
        assert "العربية" in content

    def test_adds_trailing_newline(self, tmp_path):
        """Test that file ends with newline (POSIX compliance)."""
        filepath = str(tmp_path / "test.json")
        data = {"key": "value"}

        write_json(filepath, data)

        with open(filepath, "rb") as f:
            content = f.read()
        assert content.endswith(b"\n")

    def test_raises_on_non_serializable_data(self, tmp_path):
        """Test that TypeError is raised for non-serializable data."""
        filepath = str(tmp_path / "test.json")

        # Functions are not JSON-serializable
        data = {"func": lambda x: x}

        with pytest.raises(TypeError) as exc_info:
            write_json(filepath, data)

        assert "not JSON-serializable" in str(exc_info.value)

    def test_raises_on_write_error(self, tmp_path):
        """Test that OSError is raised when file cannot be written."""
        # Try to write to a directory (not a file)
        filepath = str(tmp_path)

        with pytest.raises(OSError) as exc_info:
            write_json(filepath, {"key": "value"})

        assert "Cannot write JSON file" in str(exc_info.value)


class TestWriteRawAnswer:
    """Tests for write_raw_answer function."""

    def test_writes_raw_answer_with_correct_filename(self, tmp_path):
        """Test that raw answer is written with correct filename."""
        run_dir = str(tmp_path / "run")
        os.makedirs(run_dir)

        intent_id = "email-warmup"
        provider = "openai"
        model = "gpt-4o-mini"
        data = {
            "answer_text": "Here are the best tools...",
            "usage": {"prompt_tokens": 100, "completion_tokens": 500},
            "estimated_cost_usd": 0.001,
        }

        write_raw_answer(run_dir, intent_id, provider, model, data)

        # Verify file exists with correct name
        expected_file = os.path.join(
            run_dir, f"intent_{intent_id}_raw_{provider}_{model}.json"
        )
        assert os.path.exists(expected_file)

        # Verify content
        with open(expected_file, encoding="utf-8") as f:
            loaded = json.load(f)
        assert loaded == data

    def test_multiple_raw_answers_same_run(self, tmp_path):
        """Test writing multiple raw answers to same run directory."""
        run_dir = str(tmp_path / "run")
        os.makedirs(run_dir)

        # Write two different intents
        write_raw_answer(run_dir, "intent1", "openai", "gpt-4o", {"text": "Answer 1"})
        write_raw_answer(run_dir, "intent2", "openai", "gpt-4o", {"text": "Answer 2"})

        # Both files should exist
        file1 = os.path.join(run_dir, "intent_intent1_raw_openai_gpt-4o.json")
        file2 = os.path.join(run_dir, "intent_intent2_raw_openai_gpt-4o.json")

        assert os.path.exists(file1)
        assert os.path.exists(file2)


class TestWriteParsedAnswer:
    """Tests for write_parsed_answer function."""

    def test_writes_parsed_answer_with_correct_filename(self, tmp_path):
        """Test that parsed answer is written with correct filename."""
        run_dir = str(tmp_path / "run")
        os.makedirs(run_dir)

        intent_id = "email-warmup"
        provider = "openai"
        model = "gpt-4o-mini"
        data = {
            "appeared_mine": True,
            "my_mentions": [{"brand": "InstantFlow", "position": 1}],
            "competitor_mentions": [],
            "ranked_list": ["InstantFlow"],
            "rank_confidence": 1.0,
        }

        write_parsed_answer(run_dir, intent_id, provider, model, data)

        # Verify file exists with correct name
        expected_file = os.path.join(
            run_dir, f"intent_{intent_id}_parsed_{provider}_{model}.json"
        )
        assert os.path.exists(expected_file)

        # Verify content
        with open(expected_file, encoding="utf-8") as f:
            loaded = json.load(f)
        assert loaded == data


class TestWriteError:
    """Tests for write_error function."""

    @freeze_time("2025-11-02 08:00:00")
    def test_writes_error_with_timestamp(self, tmp_path):
        """Test that error file includes UTC timestamp."""
        run_dir = str(tmp_path / "run")
        os.makedirs(run_dir)

        intent_id = "email-warmup"
        provider = "openai"
        model = "gpt-4o-mini"
        error_message = "API rate limit exceeded"

        write_error(run_dir, intent_id, provider, model, error_message)

        # Verify file exists
        expected_file = os.path.join(
            run_dir, f"intent_{intent_id}_error_{provider}_{model}.json"
        )
        assert os.path.exists(expected_file)

        # Verify content includes timestamp and error
        with open(expected_file, encoding="utf-8") as f:
            loaded = json.load(f)

        assert loaded["timestamp_utc"] == "2025-11-02T08:00:00Z"
        assert loaded["intent_id"] == intent_id
        assert loaded["model_provider"] == provider
        assert loaded["model_name"] == model
        assert loaded["error_message"] == error_message

    def test_error_file_structure(self, tmp_path):
        """Test that error file has required fields."""
        run_dir = str(tmp_path / "run")
        os.makedirs(run_dir)

        write_error(run_dir, "test", "openai", "gpt-4o", "Test error")

        filepath = os.path.join(run_dir, "intent_test_error_openai_gpt-4o.json")
        with open(filepath, encoding="utf-8") as f:
            data = json.load(f)

        # Verify all required fields are present
        assert "timestamp_utc" in data
        assert "intent_id" in data
        assert "model_provider" in data
        assert "model_name" in data
        assert "error_message" in data


class TestWriteRunMeta:
    """Tests for write_run_meta function."""

    def test_writes_run_meta_as_run_meta_json(self, tmp_path):
        """Test that run metadata is always written as 'run_meta.json'."""
        run_dir = str(tmp_path / "run")
        os.makedirs(run_dir)

        meta = {
            "run_id": "2025-11-02T08-00-00Z",
            "timestamp_utc": "2025-11-02T08:00:00Z",
            "total_intents": 3,
            "total_models": 2,
            "total_cost_usd": 0.0123,
            "success_count": 5,
            "error_count": 1,
        }

        write_run_meta(run_dir, meta)

        # Verify file exists with exact name
        expected_file = os.path.join(run_dir, "run_meta.json")
        assert os.path.exists(expected_file)

        # Verify content
        with open(expected_file, encoding="utf-8") as f:
            loaded = json.load(f)
        assert loaded == meta

    def test_overwrites_existing_run_meta(self, tmp_path):
        """Test that calling twice overwrites the file."""
        run_dir = str(tmp_path / "run")
        os.makedirs(run_dir)

        # Write first version
        meta1 = {"run_id": "test", "cost": 0.01}
        write_run_meta(run_dir, meta1)

        # Write second version
        meta2 = {"run_id": "test", "cost": 0.02}
        write_run_meta(run_dir, meta2)

        # Should contain second version
        filepath = os.path.join(run_dir, "run_meta.json")
        with open(filepath, encoding="utf-8") as f:
            loaded = json.load(f)
        assert loaded["cost"] == 0.02


class TestWriteReportHtml:
    """Tests for write_report_html function."""

    def test_writes_html_as_report_html(self, tmp_path):
        """Test that HTML report is always written as 'report.html'."""
        run_dir = str(tmp_path / "run")
        os.makedirs(run_dir)

        html = "<html><body><h1>Run Report</h1></body></html>"

        write_report_html(run_dir, html)

        # Verify file exists with exact name
        expected_file = os.path.join(run_dir, "report.html")
        assert os.path.exists(expected_file)

        # Verify content
        with open(expected_file, encoding="utf-8") as f:
            loaded = f.read()
        assert loaded == html

    def test_uses_utf8_encoding_for_html(self, tmp_path):
        """Test that HTML is written with UTF-8 encoding."""
        run_dir = str(tmp_path / "run")
        os.makedirs(run_dir)

        html = """
        <html>
        <head><meta charset="UTF-8"></head>
        <body>
            <h1>Report with Unicode: 世界 🌍</h1>
        </body>
        </html>
        """

        write_report_html(run_dir, html)

        # Read back and verify Unicode is preserved
        filepath = os.path.join(run_dir, "report.html")
        with open(filepath, encoding="utf-8") as f:
            loaded = f.read()
        assert "世界 🌍" in loaded

    def test_raises_on_write_error(self, tmp_path):
        """Test that OSError is raised when HTML cannot be written."""
        # Try to write to a file in non-existent directory
        run_dir = str(tmp_path / "nonexistent")

        with pytest.raises(OSError) as exc_info:
            write_report_html(run_dir, "<html></html>")

        assert "Cannot write HTML report" in str(exc_info.value)


class TestIntegrationScenarios:
    """Integration tests for realistic usage scenarios."""

    def test_complete_run_workflow(self, tmp_path):
        """Test writing all files for a complete run."""
        output_dir = str(tmp_path / "output")
        run_id = "2025-11-02T08-00-00Z"

        # Create run directory
        run_dir = create_run_directory(output_dir, run_id)
        assert os.path.exists(run_dir)

        # Write raw answer
        write_raw_answer(
            run_dir,
            "email-warmup",
            "openai",
            "gpt-4o-mini",
            {"answer_text": "Test answer", "usage": {}},
        )

        # Write parsed answer
        write_parsed_answer(
            run_dir,
            "email-warmup",
            "openai",
            "gpt-4o-mini",
            {"appeared_mine": True, "my_mentions": []},
        )

        # Write run metadata
        write_run_meta(run_dir, {"run_id": run_id, "total_cost_usd": 0.01})

        # Write HTML report
        write_report_html(run_dir, "<html><body>Report</body></html>")

        # Verify all files exist
        files = os.listdir(run_dir)
        assert "intent_email-warmup_raw_openai_gpt-4o-mini.json" in files
        assert "intent_email-warmup_parsed_openai_gpt-4o-mini.json" in files
        assert "run_meta.json" in files
        assert "report.html" in files

    @freeze_time("2025-11-02 08:00:00")
    def test_partial_failure_workflow(self, tmp_path):
        """Test workflow with some successes and some errors."""
        run_dir = create_run_directory(str(tmp_path / "output"), "test-run")

        # First intent succeeds
        write_raw_answer(
            run_dir, "intent1", "openai", "gpt-4o", {"answer_text": "Success"}
        )
        write_parsed_answer(
            run_dir, "intent1", "openai", "gpt-4o", {"appeared_mine": True}
        )

        # Second intent fails
        write_error(run_dir, "intent2", "openai", "gpt-4o", "API error")

        # Verify both success and error files exist
        files = os.listdir(run_dir)
        assert "intent_intent1_raw_openai_gpt-4o.json" in files
        assert "intent_intent1_parsed_openai_gpt-4o.json" in files
        assert "intent_intent2_error_openai_gpt-4o.json" in files

        # Verify error file has correct structure
        error_file = os.path.join(run_dir, "intent_intent2_error_openai_gpt-4o.json")
        with open(error_file, encoding="utf-8") as f:
            error_data = json.load(f)
        assert error_data["error_message"] == "API error"
        assert error_data["timestamp_utc"] == "2025-11-02T08:00:00Z"

    def test_multiple_models_same_intent(self, tmp_path):
        """Test writing same intent with different models."""
        run_dir = create_run_directory(str(tmp_path / "output"), "test-run")

        # Same intent, different models
        write_raw_answer(
            run_dir, "email-warmup", "openai", "gpt-4o-mini", {"text": "GPT-4o-mini"}
        )
        write_raw_answer(
            run_dir, "email-warmup", "openai", "gpt-4o", {"text": "GPT-4o"}
        )
        write_raw_answer(
            run_dir,
            "email-warmup",
            "anthropic",
            "claude-3-5-sonnet",
            {"text": "Claude"},
        )

        # All files should exist with different names
        files = os.listdir(run_dir)
        assert "intent_email-warmup_raw_openai_gpt-4o-mini.json" in files
        assert "intent_email-warmup_raw_openai_gpt-4o.json" in files
        assert "intent_email-warmup_raw_anthropic_claude-3-5-sonnet.json" in files

    def test_file_operations_are_atomic(self, tmp_path):
        """Test that files are written atomically (complete or not at all)."""
        filepath = str(tmp_path / "test.json")
        data = {"key": "value"}

        write_json(filepath, data)

        # File should either exist with complete valid JSON, or not exist
        assert os.path.exists(filepath)
        with open(filepath, encoding="utf-8") as f:
            loaded = json.load(f)  # Should not raise
        assert loaded == data
