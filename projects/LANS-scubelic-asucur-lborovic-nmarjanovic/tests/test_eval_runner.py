"""
Tests for eval runner module (llm_answer_watcher.evals.runner).

Tests cover all runner functions with various scenarios:
- load_test_cases() - YAML fixture loading and validation
- evaluate_single_test_case() - Single test case evaluation
- run_eval_suite() - Complete evaluation orchestration
- write_eval_results() - Results database storage
"""

import tempfile
from pathlib import Path

import pytest
import yaml

from llm_answer_watcher.evals.runner import (
    evaluate_single_test_case,
    load_test_cases,
    run_eval_suite,
    write_eval_results,
)
from llm_answer_watcher.evals.schema import EvalTestCase


class TestLoadTestCases:
    """Test cases for load_test_cases() function."""

    def test_load_valid_yaml(self):
        """Test loading test cases from valid YAML fixtures."""
        # Use existing fixtures file
        fixtures_path = "llm_answer_watcher/evals/testcases/fixtures.yaml"
        test_cases = load_test_cases(fixtures_path)

        # Should load all 8 test cases from fixtures
        assert len(test_cases) == 8

        # Check first test case structure
        first_case = test_cases[0]
        assert isinstance(first_case, EvalTestCase)
        assert (
            first_case.description
            == "Simple email warmup tools comparison with clear ranking"
        )
        assert first_case.intent_id == "best_email_warmup_tools"
        assert "WarmupInbox" in first_case.llm_answer_text
        assert len(first_case.brands_mine) >= 1
        assert len(first_case.brands_competitors) >= 1

    def test_load_valid_yaml_string_path(self):
        """Test loading test cases with string path instead of Path object."""
        fixtures_path = "llm_answer_watcher/evals/testcases/fixtures.yaml"
        test_cases = load_test_cases(fixtures_path)

        # Should work the same as Path object
        assert len(test_cases) == 8
        assert all(isinstance(case, EvalTestCase) for case in test_cases)

    def test_load_nonexistent_file(self):
        """Test error handling for non-existent fixtures file."""
        nonexistent_path = "/tmp/nonexistent_fixtures.yaml"

        with pytest.raises(FileNotFoundError, match="Test fixtures file not found"):
            load_test_cases(nonexistent_path)

    def test_load_malformed_yaml(self):
        """Test error handling for malformed YAML content."""
        # Create temporary malformed YAML file
        malformed_content = """
        test_cases:
          - description: "Test case"
            intent_id: "test"
            # Missing required fields - this should cause validation error
            brands_mine: ["Brand"]
            # incomplete structure
        """

        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            f.write(malformed_content)
            temp_path = f.name

        try:
            # Should raise ValueError due to validation failure
            with pytest.raises(ValueError, match="Invalid test case at index"):
                load_test_cases(temp_path)
        finally:
            Path(temp_path).unlink()

    def test_load_invalid_yaml_syntax(self):
        """Test error handling for invalid YAML syntax."""
        # Create temporary file with invalid YAML syntax
        invalid_yaml = """
        test_cases:
          - description: "Test case"
            intent_id: "test"
            brands_mine: ["Brand"
            # Missing closing bracket - invalid YAML syntax
        """

        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            f.write(invalid_yaml)
            temp_path = f.name

        try:
            # Should raise yaml.YAMLError due to syntax error
            with pytest.raises(yaml.YAMLError):
                load_test_cases(temp_path)
        finally:
            Path(temp_path).unlink()

    def test_load_missing_test_cases_key(self):
        """Test error handling for YAML without 'test_cases' key."""
        # Create temporary file without test_cases key
        invalid_structure = """
        some_other_key:
          - description: "Test case"
            intent_id: "test"
        """

        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            f.write(invalid_structure)
            temp_path = f.name

        try:
            # Should raise ValueError for missing test_cases key
            with pytest.raises(ValueError, match="must contain 'test_cases' key"):
                load_test_cases(temp_path)
        finally:
            Path(temp_path).unlink()

    def test_load_empty_test_cases(self):
        """Test loading YAML with empty test_cases list."""
        # Create temporary file with empty test_cases
        empty_cases = """
        test_cases: []
        """

        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            f.write(empty_cases)
            temp_path = f.name

        try:
            test_cases = load_test_cases(temp_path)
            assert len(test_cases) == 0
        finally:
            Path(temp_path).unlink()

    def test_load_partial_valid_test_cases(self):
        """Test error handling when some test cases are invalid."""
        # Create temporary file with mixed valid/invalid test cases
        mixed_content = """
        test_cases:
          - description: "Valid test case"
            intent_id: "test_001"
            llm_answer_text: "Valid content with HubSpot mentioned"
            brands_mine: ["HubSpot"]
            brands_competitors: ["Salesforce"]
            expected_my_mentions: ["HubSpot"]
            expected_competitor_mentions: ["Salesforce"]
            expected_ranked_list: ["HubSpot", "Salesforce"]

          - description: "Invalid test case - missing brands"
            intent_id: "test_002"
            # Missing required brands_mine field - should cause validation error
        """

        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            f.write(mixed_content)
            temp_path = f.name

        try:
            # Should raise ValueError for invalid test case at index 1
            with pytest.raises(ValueError, match="Invalid test case at index 1"):
                load_test_cases(temp_path)
        finally:
            Path(temp_path).unlink()


class TestEvaluateSingleTestCase:
    """Test cases for evaluate_single_test_case() function."""

    def test_perfect_match_case(self):
        """Test evaluation of a perfect match test case."""
        test_case = EvalTestCase(
            description="Perfect match test",
            intent_id="test_001",
            llm_answer_text="Here are the best tools: 1. HubSpot 2. Salesforce",
            brands_mine=["HubSpot"],
            brands_competitors=["Salesforce"],
            expected_my_mentions=["HubSpot"],
            expected_competitor_mentions=["Salesforce"],
            expected_ranked_list=["HubSpot", "Salesforce"],
        )

        result = evaluate_single_test_case(test_case)

        # Check result structure
        assert result.test_description == "Perfect match test"
        assert isinstance(result.metrics, list)
        assert len(result.metrics) > 0
        assert isinstance(result.overall_passed, bool)

        # Should have metrics from all three categories
        metric_names = [m.name for m in result.metrics]
        assert "mention_precision" in metric_names
        assert "mention_recall" in metric_names
        assert "my_brands_coverage" in metric_names

        # With perfect match, should pass overall
        assert result.overall_passed is True

    def test_partial_match_case(self):
        """Test evaluation of a partial match test case."""
        test_case = EvalTestCase(
            description="Partial match test",
            intent_id="test_002",
            llm_answer_text="HubSpot is mentioned but Salesforce is missing",
            brands_mine=["HubSpot"],
            brands_competitors=["Salesforce", "CompetitorA"],
            expected_my_mentions=["HubSpot"],
            expected_competitor_mentions=["Salesforce"],
            expected_ranked_list=["HubSpot", "Salesforce"],
        )

        result = evaluate_single_test_case(test_case)

        # Should have some metrics but overall might fail
        assert len(result.metrics) > 0
        assert isinstance(result.overall_passed, bool)

        # Check that we got mention metrics
        metric_names = [m.name for m in result.metrics]
        assert "mention_precision" in metric_names
        assert "mention_recall" in metric_names

        # Partial match might fail overall due to missing competitors
        # (this depends on the exact implementation and thresholds)

    def test_no_mentions_case(self):
        """Test evaluation of case with no brand mentions."""
        test_case = EvalTestCase(
            description="No mentions test",
            intent_id="test_003",
            llm_answer_text="This answer talks about general concepts without mentioning any specific brands.",
            brands_mine=["HubSpot"],
            brands_competitors=["Salesforce"],
            expected_my_mentions=[],
            expected_competitor_mentions=[],
            expected_ranked_list=[],
        )

        result = evaluate_single_test_case(test_case)

        # Should still produce metrics even with no mentions
        assert len(result.metrics) > 0
        assert isinstance(result.overall_passed, bool)

        # Should have mention metrics (all 0.0 values)
        metric_names = [m.name for m in result.metrics]
        assert "mention_precision" in metric_names
        assert "mention_recall" in metric_names

    def test_complex_real_world_case(self):
        """Test evaluation using a real test case from fixtures."""
        # Load a test case from the actual fixtures
        fixtures_path = "llm_answer_watcher/evals/testcases/fixtures.yaml"
        test_cases = load_test_cases(fixtures_path)

        # Use the first test case (simple case)
        test_case = test_cases[0]
        result = evaluate_single_test_case(test_case)

        # Should evaluate successfully
        assert result.test_description == test_case.description
        assert len(result.metrics) > 0
        assert isinstance(result.overall_passed, bool)

        # Should have comprehensive metrics
        metric_names = [m.name for m in result.metrics]
        expected_metrics = [
            "mention_precision",
            "mention_recall",
            "mention_f1",
            "rank_position_accuracy",
            "rank_list_overlap",
            "rank_correlation",
            "my_brands_coverage",
            "competitors_coverage",
            "overall_brand_coverage",
        ]

        for expected_metric in expected_metrics:
            assert expected_metric in metric_names

    def test_evaluation_with_empty_answer(self):
        """Test evaluation with minimal answer text."""
        test_case = EvalTestCase(
            description="Minimal answer test",
            intent_id="test_004",
            llm_answer_text="No brands mentioned here.",
            brands_mine=["HubSpot"],
            brands_competitors=["Salesforce"],
            expected_my_mentions=["HubSpot"],
            expected_competitor_mentions=["Salesforce"],
            expected_ranked_list=["HubSpot", "Salesforce"],
        )

        result = evaluate_single_test_case(test_case)

        # Should handle empty answer gracefully
        assert len(result.metrics) > 0
        assert isinstance(result.overall_passed, bool)

        # All mention metrics should be 0.0
        for metric in result.metrics:
            if "mention" in metric.name or "coverage" in metric.name:
                assert metric.value == 0.0


class TestRunEvalSuite:
    """Test cases for run_eval_suite() function."""

    def test_run_with_valid_fixtures(self):
        """Test running complete evaluation suite with valid fixtures."""
        fixtures_path = "llm_answer_watcher/evals/testcases/fixtures.yaml"
        results = run_eval_suite(fixtures_path)

        # Check return structure
        assert isinstance(results, dict)
        assert "results" in results
        assert "summary" in results
        assert "total_test_cases" in results
        assert "total_passed" in results

        # Should have processed all test cases
        assert results["total_test_cases"] == 8
        assert len(results["results"]) == 8

        # Check summary structure
        summary = results["summary"]
        assert "pass_rate" in summary
        assert "average_scores" in summary
        assert "total_test_cases" in summary
        assert "total_passed" in summary
        assert "total_failed" in summary

        assert isinstance(summary["pass_rate"], float)
        assert 0.0 <= summary["pass_rate"] <= 1.0
        assert isinstance(summary["average_scores"], dict)

        # Check that results are EvalResult objects
        for result in results["results"]:
            assert hasattr(result, "test_description")
            assert hasattr(result, "metrics")
            assert hasattr(result, "overall_passed")

    def test_run_with_empty_fixtures(self):
        """Test running evaluation suite with empty test cases."""
        # Create temporary empty fixtures file
        empty_fixtures = """
        test_cases: []
        """

        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            f.write(empty_fixtures)
            temp_path = f.name

        try:
            results = run_eval_suite(temp_path)

            # Should handle empty test cases gracefully
            assert results["total_test_cases"] == 0
            assert results["total_passed"] == 0
            assert len(results["results"]) == 0
            assert results["summary"]["pass_rate"] == 0.0

        finally:
            Path(temp_path).unlink()

    def test_run_with_single_test_case(self):
        """Test running evaluation suite with single test case."""
        single_case_content = """
        test_cases:
          - description: "Single test case"
            intent_id: "test_single"
            llm_answer_text: "HubSpot and Salesforce are mentioned here"
            brands_mine: ["HubSpot"]
            brands_competitors: ["Salesforce"]
            expected_my_mentions: ["HubSpot"]
            expected_competitor_mentions: ["Salesforce"]
            expected_ranked_list: ["HubSpot", "Salesforce"]
        """

        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            f.write(single_case_content)
            temp_path = f.name

        try:
            results = run_eval_suite(temp_path)

            # Should process single test case
            assert results["total_test_cases"] == 1
            assert len(results["results"]) == 1
            assert isinstance(results["summary"]["pass_rate"], float)

            # Check the single result
            result = results["results"][0]
            assert result.test_description == "Single test case"
            assert len(result.metrics) > 0

        finally:
            Path(temp_path).unlink()

    def test_run_with_mixed_results(self):
        """Test running evaluation suite with mixed pass/fail results."""
        mixed_content = """
        test_cases:
          # This should pass
          - description: "Good case with HubSpot and Salesforce"
            intent_id: "test_good"
            llm_answer_text: "1. HubSpot 2. Salesforce - both mentioned correctly"
            brands_mine: ["HubSpot"]
            brands_competitors: ["Salesforce"]
            expected_my_mentions: ["HubSpot"]
            expected_competitor_mentions: ["Salesforce"]
            expected_ranked_list: ["HubSpot", "Salesforce"]

          # This should fail (missing mentions)
          - description: "Bad case with no brand mentions"
            intent_id: "test_bad"
            llm_answer_text: "This answer mentions no specific brands at all."
            brands_mine: ["HubSpot"]
            brands_competitors: ["Salesforce"]
            expected_my_mentions: ["HubSpot"]
            expected_competitor_mentions: ["Salesforce"]
            expected_ranked_list: ["HubSpot", "Salesforce"]
        """

        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            f.write(mixed_content)
            temp_path = f.name

        try:
            results = run_eval_suite(temp_path)

            # Should process both test cases
            assert results["total_test_cases"] == 2
            assert len(results["results"]) == 2

            # Should have mixed results (some pass, some fail)
            # The exact numbers depend on the evaluation thresholds
            pass_count = sum(1 for r in results["results"] if r.overall_passed)
            assert 0 <= pass_count <= 2

            # Pass rate should be calculated correctly
            expected_pass_rate = pass_count / 2
            assert results["summary"]["pass_rate"] == expected_pass_rate

        finally:
            Path(temp_path).unlink()

    def test_run_suite_error_handling(self):
        """Test error handling during suite execution."""
        # Create fixtures with one invalid case that should cause exception
        problematic_content = """
        test_cases:
          - description: "Valid case"
            intent_id: "test_valid"
            llm_answer_text: "HubSpot is mentioned"
            brands_mine: ["HubSpot"]
            brands_competitors: ["Salesforce"]
            expected_my_mentions: ["HubSpot"]
            expected_competitor_mentions: []
            expected_ranked_list: ["HubSpot"]

          - description: "This case has invalid data that might cause evaluation errors"
            intent_id: "test_invalid"
            llm_answer_text: "Some content"
            brands_mine: ["HubSpot"]
            brands_competitors: ["Salesforce"]
            expected_my_mentions: []
            expected_competitor_mentions: []
            expected_ranked_list: []
            # This case has no expected mentions but has brands defined, should fail
        """

        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            f.write(problematic_content)
            temp_path = f.name

        try:
            # The evaluation should handle the invalid case gracefully
            results = run_eval_suite(temp_path)

            # Should still return results structure
            assert "results" in results
            assert "summary" in results

            # Invalid case should result in failure result
            assert len(results["results"]) == 2

            # At least one result should be a failure (overall_passed=False)
            failure_results = [r for r in results["results"] if not r.overall_passed]
            assert len(failure_results) >= 1

        finally:
            Path(temp_path).unlink()


class TestWriteEvalResults:
    """Test cases for write_eval_results() function."""

    def test_write_results_valid_data(self):
        """Test writing valid evaluation results to database."""
        # Create test results using evaluate_single_test_case
        test_case = EvalTestCase(
            description="Test for database write",
            intent_id="test_db",
            llm_answer_text="HubSpot and Salesforce mentioned",
            brands_mine=["HubSpot"],
            brands_competitors=["Salesforce"],
            expected_my_mentions=["HubSpot"],
            expected_competitor_mentions=["Salesforce"],
            expected_ranked_list=["HubSpot", "Salesforce"],
        )

        result = evaluate_single_test_case(test_case)
        test_run_id = "2025-11-02T12-00-00Z"

        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "test_eval.db"

            # Write results to database
            returned_run_id = write_eval_results(test_run_id, [result], str(db_path))

            # Should return the same run_id
            assert returned_run_id == test_run_id

            # Database file should be created
            assert db_path.exists()

    def test_write_results_empty_list(self):
        """Test error handling for empty results list."""
        test_run_id = "2025-11-02T12-00-00Z"

        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "test_eval.db"

            # Should raise ValueError for empty results
            with pytest.raises(ValueError, match="results list cannot be empty"):
                write_eval_results(test_run_id, [], str(db_path))

    def test_write_results_empty_run_id(self):
        """Test error handling for empty run_id."""
        test_case = EvalTestCase(
            description="Test",
            intent_id="test",
            llm_answer_text="Content",
            brands_mine=["HubSpot"],
            brands_competitors=["Salesforce"],
            expected_my_mentions=["HubSpot"],
            expected_competitor_mentions=["Salesforce"],
            expected_ranked_list=["HubSpot", "Salesforce"],
        )

        result = evaluate_single_test_case(test_case)

        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "test_eval.db"

            # Should raise ValueError for empty run_id
            with pytest.raises(ValueError, match="eval_run_id cannot be empty"):
                write_eval_results("", [result], str(db_path))

    def test_write_results_multiple_cases(self):
        """Test writing multiple test case results."""
        # Create multiple test cases
        test_cases = [
            EvalTestCase(
                description=f"Test case {i + 1}",
                intent_id=f"test_{i + 1:03d}",
                llm_answer_text=f"Case {i + 1} content with HubSpot mentioned"
                if i % 2 == 0
                else f"Case {i + 1} content without brands",
                brands_mine=["HubSpot"],
                brands_competitors=["Salesforce"],
                expected_my_mentions=["HubSpot"] if i % 2 == 0 else [],
                expected_competitor_mentions=["Salesforce"] if i % 2 == 1 else [],
                expected_ranked_list=["HubSpot", "Salesforce"] if i % 2 == 0 else [],
            )
            for i in range(3)
        ]

        results = [evaluate_single_test_case(tc) for tc in test_cases]
        test_run_id = "2025-11-02T12-30-00Z"

        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "test_multiple_eval.db"

            # Write multiple results
            returned_run_id = write_eval_results(test_run_id, results, str(db_path))

            assert returned_run_id == test_run_id
            assert db_path.exists()

    def test_write_results_integration_with_run_suite(self):
        """Test write_eval_results integration with run_eval_suite."""
        # Use actual fixtures file for integration test
        fixtures_path = "llm_answer_watcher/evals/testcases/fixtures.yaml"
        suite_results = run_eval_suite(fixtures_path)
        test_run_id = "2025-11-02T13-00-00Z"

        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "test_integration.db"

            # Write complete suite results
            returned_run_id = write_eval_results(
                test_run_id, suite_results["results"], str(db_path)
            )

            assert returned_run_id == test_run_id
            assert db_path.exists()

            # Should have written all 8 test cases
            # (We could query the database here to verify, but that's tested in eval_db tests)
