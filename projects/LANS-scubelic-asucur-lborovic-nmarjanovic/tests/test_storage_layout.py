"""
Tests for storage.layout module.

Tests file naming conventions and path utilities for deterministic output structure.
"""

import os

from llm_answer_watcher.storage.layout import (
    get_error_filename,
    get_parsed_answer_filename,
    get_raw_answer_filename,
    get_report_filename,
    get_run_directory,
    get_run_meta_filename,
)


class TestGetRunDirectory:
    """Tests for get_run_directory function."""

    def test_basic_path_joining(self):
        """Test basic output_dir + run_id joining."""
        result = get_run_directory("./output", "2025-11-02T08-00-00Z")
        expected = os.path.join("./output", "2025-11-02T08-00-00Z")
        assert result == expected

    def test_absolute_path(self):
        """Test with absolute output directory."""
        result = get_run_directory("/var/data", "test-run")
        expected = os.path.join("/var/data", "test-run")
        assert result == expected

    def test_nested_output_dir(self):
        """Test with nested output directory."""
        result = get_run_directory("./output/experiments", "2025-11-02T08-00-00Z")
        expected = os.path.join("./output/experiments", "2025-11-02T08-00-00Z")
        assert result == expected

    def test_windows_path(self):
        """Test with Windows-style path."""
        result = get_run_directory("C:\\data\\output", "2025-11-02T08-00-00Z")
        expected = os.path.join("C:\\data\\output", "2025-11-02T08-00-00Z")
        assert result == expected

    def test_trailing_slash_in_output_dir(self):
        """Test that trailing slash in output_dir doesn't create double slashes."""
        result = get_run_directory("./output/", "2025-11-02T08-00-00Z")
        expected = os.path.join("./output/", "2025-11-02T08-00-00Z")
        assert result == expected
        # Ensure no double slashes
        assert "//" not in result.replace("\\\\", "")  # Ignore Windows UNC paths

    def test_does_not_create_directory(self, tmp_path):
        """Verify function only generates path string, doesn't create directory."""
        output_dir = str(tmp_path / "output")
        run_id = "2025-11-02T08-00-00Z"

        result = get_run_directory(output_dir, run_id)

        # Verify path is returned
        assert result == os.path.join(output_dir, run_id)
        # Verify directory was NOT created
        assert not os.path.exists(result)


class TestGetRawAnswerFilename:
    """Tests for get_raw_answer_filename function."""

    def test_basic_filename_format(self):
        """Test basic filename format: intent_{id}_raw_{provider}_{model}.json"""
        result = get_raw_answer_filename("email-warmup", "openai", "gpt-4o-mini")
        assert result == "intent_email-warmup_raw_openai_gpt-4o-mini.json"

    def test_anthropic_provider(self):
        """Test with Anthropic provider and Claude model."""
        result = get_raw_answer_filename(
            "sales-tools", "anthropic", "claude-3-5-sonnet"
        )
        assert result == "intent_sales-tools_raw_anthropic_claude-3-5-sonnet.json"

    def test_intent_id_with_underscores(self):
        """Test intent_id containing underscores."""
        result = get_raw_answer_filename("email_warmup_tools", "openai", "gpt-4o")
        assert result == "intent_email_warmup_tools_raw_openai_gpt-4o.json"

    def test_model_name_with_hyphens(self):
        """Test model name with hyphens (typical format)."""
        result = get_raw_answer_filename("test", "openai", "gpt-4o-mini-2024-07-18")
        assert result == "intent_test_raw_openai_gpt-4o-mini-2024-07-18.json"

    def test_filename_always_has_json_extension(self):
        """Test that filename always ends with .json."""
        result = get_raw_answer_filename("test", "provider", "model")
        assert result.endswith(".json")

    def test_filename_structure_components(self):
        """Test that filename contains all required components."""
        intent_id = "my-intent"
        provider = "my-provider"
        model = "my-model"

        result = get_raw_answer_filename(intent_id, provider, model)

        # Check all components are present
        assert intent_id in result
        assert provider in result
        assert model in result
        assert "intent_" in result
        assert "_raw_" in result


class TestGetParsedAnswerFilename:
    """Tests for get_parsed_answer_filename function."""

    def test_basic_filename_format(self):
        """Test basic filename format: intent_{id}_parsed_{provider}_{model}.json"""
        result = get_parsed_answer_filename("email-warmup", "openai", "gpt-4o-mini")
        assert result == "intent_email-warmup_parsed_openai_gpt-4o-mini.json"

    def test_anthropic_provider(self):
        """Test with Anthropic provider and Claude model."""
        result = get_parsed_answer_filename(
            "sales-tools", "anthropic", "claude-3-5-sonnet"
        )
        assert result == "intent_sales-tools_parsed_anthropic_claude-3-5-sonnet.json"

    def test_filename_differs_from_raw_by_keyword(self):
        """Test that parsed filename differs from raw only by 'parsed' vs 'raw'."""
        intent_id = "test"
        provider = "openai"
        model = "gpt-4o"

        raw = get_raw_answer_filename(intent_id, provider, model)
        parsed = get_parsed_answer_filename(intent_id, provider, model)

        # Should differ only in 'raw' vs 'parsed'
        assert raw.replace("_raw_", "_parsed_") == parsed

    def test_filename_always_has_json_extension(self):
        """Test that filename always ends with .json."""
        result = get_parsed_answer_filename("test", "provider", "model")
        assert result.endswith(".json")

    def test_filename_structure_components(self):
        """Test that filename contains all required components."""
        intent_id = "my-intent"
        provider = "my-provider"
        model = "my-model"

        result = get_parsed_answer_filename(intent_id, provider, model)

        # Check all components are present
        assert intent_id in result
        assert provider in result
        assert model in result
        assert "intent_" in result
        assert "_parsed_" in result


class TestGetErrorFilename:
    """Tests for get_error_filename function."""

    def test_basic_filename_format(self):
        """Test basic filename format: intent_{id}_error_{provider}_{model}.json"""
        result = get_error_filename("email-warmup", "openai", "gpt-4o-mini")
        assert result == "intent_email-warmup_error_openai_gpt-4o-mini.json"

    def test_anthropic_provider(self):
        """Test with Anthropic provider and Claude model."""
        result = get_error_filename("sales-tools", "anthropic", "claude-3-5-sonnet")
        assert result == "intent_sales-tools_error_anthropic_claude-3-5-sonnet.json"

    def test_filename_differs_from_raw_by_keyword(self):
        """Test that error filename differs from raw only by 'error' vs 'raw'."""
        intent_id = "test"
        provider = "openai"
        model = "gpt-4o"

        raw = get_raw_answer_filename(intent_id, provider, model)
        error = get_error_filename(intent_id, provider, model)

        # Should differ only in 'raw' vs 'error'
        assert raw.replace("_raw_", "_error_") == error

    def test_filename_always_has_json_extension(self):
        """Test that filename always ends with .json."""
        result = get_error_filename("test", "provider", "model")
        assert result.endswith(".json")

    def test_filename_structure_components(self):
        """Test that filename contains all required components."""
        intent_id = "my-intent"
        provider = "my-provider"
        model = "my-model"

        result = get_error_filename(intent_id, provider, model)

        # Check all components are present
        assert intent_id in result
        assert provider in result
        assert model in result
        assert "intent_" in result
        assert "_error_" in result


class TestGetRunMetaFilename:
    """Tests for get_run_meta_filename function."""

    def test_constant_filename(self):
        """Test that function always returns 'run_meta.json'."""
        result = get_run_meta_filename()
        assert result == "run_meta.json"

    def test_filename_is_json(self):
        """Test that filename has .json extension."""
        result = get_run_meta_filename()
        assert result.endswith(".json")

    def test_multiple_calls_return_same_value(self):
        """Test that function is deterministic."""
        result1 = get_run_meta_filename()
        result2 = get_run_meta_filename()
        assert result1 == result2


class TestGetReportFilename:
    """Tests for get_report_filename function."""

    def test_constant_filename(self):
        """Test that function always returns 'report.html'."""
        result = get_report_filename()
        assert result == "report.html"

    def test_filename_is_html(self):
        """Test that filename has .html extension."""
        result = get_report_filename()
        assert result.endswith(".html")

    def test_multiple_calls_return_same_value(self):
        """Test that function is deterministic."""
        result1 = get_report_filename()
        result2 = get_report_filename()
        assert result1 == result2


class TestFilenameConsistency:
    """Tests for consistency across filename generation functions."""

    def test_all_intent_files_have_same_structure(self):
        """Test that raw, parsed, and error filenames follow same pattern."""
        intent_id = "test-intent"
        provider = "test-provider"
        model = "test-model"

        raw = get_raw_answer_filename(intent_id, provider, model)
        parsed = get_parsed_answer_filename(intent_id, provider, model)
        error = get_error_filename(intent_id, provider, model)

        # All should start with "intent_"
        assert raw.startswith("intent_")
        assert parsed.startswith("intent_")
        assert error.startswith("intent_")

        # All should contain intent_id, provider, model
        for filename in [raw, parsed, error]:
            assert intent_id in filename
            assert provider in filename
            assert model in filename

        # All should end with .json
        assert raw.endswith(".json")
        assert parsed.endswith(".json")
        assert error.endswith(".json")

    def test_filenames_are_filesystem_safe(self):
        """Test that generated filenames don't contain unsafe characters."""
        # Test with typical values
        intent_id = "email-warmup-tools"
        provider = "openai"
        model = "gpt-4o-mini"

        filenames = [
            get_raw_answer_filename(intent_id, provider, model),
            get_parsed_answer_filename(intent_id, provider, model),
            get_error_filename(intent_id, provider, model),
            get_run_meta_filename(),
            get_report_filename(),
        ]

        # Unsafe characters for most filesystems
        unsafe_chars = ["/", "\\", ":", "*", "?", '"', "<", ">", "|", "\0"]

        for filename in filenames:
            for char in unsafe_chars:
                assert char not in filename, (
                    f"Filename '{filename}' contains unsafe char '{char}'"
                )

    def test_filenames_are_grep_friendly(self):
        """Test that intent_id always appears in intent-related filenames."""
        intent_id = "specific-intent-123"
        provider = "openai"
        model = "gpt-4o"

        filenames = [
            get_raw_answer_filename(intent_id, provider, model),
            get_parsed_answer_filename(intent_id, provider, model),
            get_error_filename(intent_id, provider, model),
        ]

        # All intent files should be greppable by intent_id
        for filename in filenames:
            assert intent_id in filename

    def test_filenames_are_deterministic(self):
        """Test that same inputs always produce same outputs."""
        intent_id = "test"
        provider = "openai"
        model = "gpt-4o"

        # Call each function twice
        assert get_raw_answer_filename(
            intent_id, provider, model
        ) == get_raw_answer_filename(intent_id, provider, model)

        assert get_parsed_answer_filename(
            intent_id, provider, model
        ) == get_parsed_answer_filename(intent_id, provider, model)

        assert get_error_filename(intent_id, provider, model) == get_error_filename(
            intent_id, provider, model
        )

        assert get_run_meta_filename() == get_run_meta_filename()
        assert get_report_filename() == get_report_filename()


class TestIntegrationScenarios:
    """Integration tests for realistic usage scenarios."""

    def test_complete_run_output_structure(self):
        """Test generating all filenames for a complete run."""
        output_dir = "./output"
        run_id = "2025-11-02T08-00-00Z"
        intent_id = "email-warmup"
        provider = "openai"
        model = "gpt-4o-mini"

        # Generate all paths/filenames
        run_dir = get_run_directory(output_dir, run_id)
        raw_file = get_raw_answer_filename(intent_id, provider, model)
        parsed_file = get_parsed_answer_filename(intent_id, provider, model)
        error_file = get_error_filename(intent_id, provider, model)
        meta_file = get_run_meta_filename()
        report_file = get_report_filename()

        # Verify structure
        assert run_dir == "./output/2025-11-02T08-00-00Z"
        assert raw_file == "intent_email-warmup_raw_openai_gpt-4o-mini.json"
        assert parsed_file == "intent_email-warmup_parsed_openai_gpt-4o-mini.json"
        assert error_file == "intent_email-warmup_error_openai_gpt-4o-mini.json"
        assert meta_file == "run_meta.json"
        assert report_file == "report.html"

        # Verify full paths would be constructable
        full_raw = os.path.join(run_dir, raw_file)
        assert (
            full_raw
            == "./output/2025-11-02T08-00-00Z/intent_email-warmup_raw_openai_gpt-4o-mini.json"
        )

    def test_multiple_intents_same_run(self):
        """Test filename generation for multiple intents in same run."""
        provider = "openai"
        model = "gpt-4o-mini"

        intent_ids = ["email-warmup", "sales-tools", "crm-software"]

        raw_files = [
            get_raw_answer_filename(iid, provider, model) for iid in intent_ids
        ]
        parsed_files = [
            get_parsed_answer_filename(iid, provider, model) for iid in intent_ids
        ]

        # All filenames should be unique
        assert len(raw_files) == len(set(raw_files))
        assert len(parsed_files) == len(set(parsed_files))

        # Each intent_id should be in its corresponding filename
        for i, intent_id in enumerate(intent_ids):
            assert intent_id in raw_files[i]
            assert intent_id in parsed_files[i]

    def test_multiple_models_same_intent(self):
        """Test filename generation for same intent with multiple models."""
        intent_id = "email-warmup"

        configs = [
            ("openai", "gpt-4o-mini"),
            ("openai", "gpt-4o"),
            ("anthropic", "claude-3-5-sonnet"),
        ]

        raw_files = [get_raw_answer_filename(intent_id, p, m) for p, m in configs]

        # All filenames should be unique
        assert len(raw_files) == len(set(raw_files))

        # All should contain the intent_id
        for filename in raw_files:
            assert intent_id in filename
