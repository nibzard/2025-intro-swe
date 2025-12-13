"""
Evaluation runner for the LLM Answer Watcher evaluation framework.

This module provides the main orchestrator function `run_eval_suite()` that
loads test cases, executes the evaluation pipeline, and returns results.
"""

import sqlite3
from pathlib import Path
from typing import Any

import yaml

from ..extractor.mention_detector import detect_mentions
from ..extractor.rank_extractor import extract_ranked_list_pattern
from ..storage.eval_db import init_eval_db_if_needed, store_eval_results
from .metrics import (
    compute_completeness_metrics,
    compute_mention_metrics,
    compute_rank_metrics,
)
from .schema import EvalResult, EvalTestCase

# Evaluation quality thresholds
# These define the minimum acceptable quality levels for different metrics
# If evaluation results fall below these thresholds, the evaluation is considered failed

# Mention detection thresholds (how well we detect brand mentions)
MENTION_PRECISION_THRESHOLD = (
    0.9  # 90% - When we detect a mention, it's correct 90% of the time
)
MENTION_RECALL_THRESHOLD = 0.8  # 80% - We detect 80% of actual brand mentions
MENTION_F1_THRESHOLD = 0.85  # 85% - Combined precision/recall minimum

# Ranking accuracy thresholds (how well we extract ranked lists)
RANK_TOP1_ACCURACY_THRESHOLD = 0.85  # 85% - Top-ranked brand is correct 85% of the time
RANK_OVERLAP_THRESHOLD = 0.8  # 80% - Ranked lists have 80% overlap with expected
RANK_CORRELATION_THRESHOLD = 0.75  # 75% - Rank order correlation is at least 75%

# Brand coverage thresholds (how well we cover expected brands)
MY_BRANDS_COVERAGE_THRESHOLD = (
    0.9  # 90% - Our brands are detected 90% of the time (critical)
)
COMPETITORS_COVERAGE_THRESHOLD = (
    0.7  # 70% - Competitor brands are detected 70% of the time
)
OVERALL_BRAND_COVERAGE_THRESHOLD = 0.8  # 80% - Overall brand coverage is 80%

# Special threshold for false positive prevention (zero tolerance)
FALSE_IS_MINE_VIOLATIONS_THRESHOLD = (
    0.0  # 0% - Zero tolerance for false positive "my brand" mentions
)

# Overall evaluation thresholds
MINIMUM_PASS_RATE = 0.75  # 75% - At least 75% of test cases must pass overall


def load_test_cases(fixtures_path: str | Path) -> list[EvalTestCase]:
    """
    Load test cases from a YAML fixtures file.

    Args:
        fixtures_path: Path to the YAML file containing test cases

    Returns:
        List of EvalTestCase objects loaded from the file

    Raises:
        FileNotFoundError: If the fixtures file doesn't exist
        yaml.YAMLError: If the YAML file is malformed
        ValueError: If test case validation fails
    """
    fixtures_path = Path(fixtures_path)

    if not fixtures_path.exists():
        raise FileNotFoundError(f"Test fixtures file not found: {fixtures_path}")

    with open(fixtures_path, encoding="utf-8") as f:
        data = yaml.safe_load(f)

    if not data or "test_cases" not in data:
        raise ValueError("Invalid fixtures file: must contain 'test_cases' key")

    test_cases = []
    for i, case_data in enumerate(data["test_cases"]):
        try:
            test_case = EvalTestCase(**case_data)
            test_cases.append(test_case)
        except Exception as e:
            raise ValueError(f"Invalid test case at index {i}: {e}")

    return test_cases


def evaluate_single_test_case(
    test_case: EvalTestCase,
) -> EvalResult:
    """
    Evaluate a single test case using the extraction functions.

    Args:
        test_case: The test case to evaluate

    Returns:
        EvalResult containing all computed metrics for this test case
    """
    # Detect brand mentions
    mention_result = detect_mentions(
        answer_text=test_case.llm_answer_text,
        our_brands=test_case.brands_mine,
        competitor_brands=test_case.brands_competitors,
    )

    # Extract ranked list
    all_brands = test_case.brands_mine + test_case.brands_competitors
    rank_result, confidence = extract_ranked_list_pattern(
        text=test_case.llm_answer_text,
        known_brands=all_brands,
    )

    # Gather all detected mentions for metrics computation (use original text as it appeared)
    actual_mentions = [mention.original_text for mention in mention_result]

    # Compute all metric categories
    mention_metrics = compute_mention_metrics(test_case, actual_mentions)
    # Convert RankedBrand objects to strings for rank_metrics
    rank_result_strings = [brand.brand_name for brand in rank_result]
    rank_metrics = compute_rank_metrics(test_case, rank_result_strings)
    completeness_metrics = compute_completeness_metrics(test_case, actual_mentions)

    # Combine all metrics
    all_metrics = mention_metrics + rank_metrics + completeness_metrics

    # Determine overall pass status (all critical metrics must pass)
    critical_metric_names = {
        "mention_precision",
        "mention_recall",
        "mention_f1",
        "my_brands_coverage",
    }
    critical_metrics = [m for m in all_metrics if m.name in critical_metric_names]
    overall_passed = all(m.passed for m in critical_metrics)

    return EvalResult(
        test_description=test_case.description,
        metrics=all_metrics,
        overall_passed=overall_passed,
    )


def check_evaluation_thresholds(results: list[EvalResult]) -> dict[str, Any]:
    """
    Check evaluation results against defined quality thresholds.

    This function validates that the evaluation results meet minimum quality standards
    defined by the threshold constants. It provides detailed feedback about which
    metrics are failing and by how much.

    Args:
        results: List of EvalResult objects from run_eval_suite()

    Returns:
        Dictionary containing:
        - 'passes_thresholds': bool - Whether evaluation meets all quality thresholds
        - 'pass_rate': float - Overall pass rate
        - 'threshold_violations': list[dict] - Details of metric failures
        - 'summary': dict - Summary statistics about threshold compliance
    """
    total_cases = len(results)
    passed_cases = sum(1 for r in results if r.overall_passed)
    pass_rate = passed_cases / total_cases if total_cases > 0 else 0.0

    # Check overall pass rate threshold
    passes_thresholds = pass_rate >= MINIMUM_PASS_RATE

    threshold_violations = []
    metric_summary = {}

    # Collect all metric values for summary analysis
    all_metrics = {}
    metric_counts = {}

    for result in results:
        for metric in result.metrics:
            if metric.name not in all_metrics:
                all_metrics[metric.name] = []
                metric_counts[metric.name] = 0
            all_metrics[metric.name].append(metric.value)
            metric_counts[metric.name] += 1

    # Calculate average scores for each metric
    average_scores = {
        name: sum(values) / len(values) for name, values in all_metrics.items()
    }

    # Define threshold mapping
    threshold_map = {
        "mention_precision": MENTION_PRECISION_THRESHOLD,
        "mention_recall": MENTION_RECALL_THRESHOLD,
        "mention_f1": MENTION_F1_THRESHOLD,
        "rank_position_accuracy": RANK_TOP1_ACCURACY_THRESHOLD,  # Maps to top-1 accuracy
        "rank_list_overlap": RANK_OVERLAP_THRESHOLD,
        "rank_correlation": RANK_CORRELATION_THRESHOLD,
        "my_brands_coverage": MY_BRANDS_COVERAGE_THRESHOLD,
        "competitors_coverage": COMPETITORS_COVERAGE_THRESHOLD,
        "overall_brand_coverage": OVERALL_BRAND_COVERAGE_THRESHOLD,
    }

    # Check each metric against its threshold
    for metric_name, avg_value in average_scores.items():
        if metric_name in threshold_map:
            threshold = threshold_map[metric_name]
            passes = avg_value >= threshold

            metric_summary[metric_name] = {
                "average": avg_value,
                "threshold": threshold,
                "passes": passes,
                "gap": threshold - avg_value if not passes else 0.0,
                "gap_percent": ((threshold - avg_value) / threshold * 100)
                if not passes
                else 0.0,
            }

            if not passes:
                threshold_violations.append(
                    {
                        "metric": metric_name,
                        "average": avg_value,
                        "threshold": threshold,
                        "gap": threshold - avg_value,
                        "gap_percent": ((threshold - avg_value) / threshold * 100),
                        "severity": "critical"
                        if metric_name.startswith("my_brands")
                        else "warning",
                    }
                )

    # Check for critical failures (any critical metric below threshold)
    critical_violations = [
        v for v in threshold_violations if v.get("severity") == "critical"
    ]
    if critical_violations:
        passes_thresholds = False  # Critical failures override pass rate

    return {
        "passes_thresholds": passes_thresholds,
        "pass_rate": pass_rate,
        "passed_cases": passed_cases,
        "total_cases": total_cases,
        "threshold_violations": threshold_violations,
        "critical_violations": len(critical_violations),
        "metric_summary": metric_summary,
        "average_scores": average_scores,
        "summary": {
            "overall_status": "PASS" if passes_thresholds else "FAIL",
            "pass_rate_threshold": MINIMUM_PASS_RATE,
            "total_violations": len(threshold_violations),
            "critical_violations": len(critical_violations),
            "most_critical_metric": min(
                threshold_violations, key=lambda x: x["gap_percent"]
            )
            if threshold_violations
            else None,
        },
    }


def run_eval_suite(
    fixtures_path: str | Path,
) -> dict[str, Any]:
    """
    Run the complete evaluation suite on all test cases.

    This is the main entry point for the evaluation framework. It loads test cases,
    runs them through the extraction pipeline, computes metrics, and returns
    comprehensive results.

    Args:
        fixtures_path: Path to YAML file containing test cases

    Returns:
        Dictionary containing:
        - 'results': List of EvalResult objects for each test case
        - 'summary': Overall statistics (pass rate, average scores, etc.)
        - 'total_test_cases': Number of test cases evaluated
        - 'total_passed': Number of test cases that passed overall
    """
    # Load test cases
    test_cases = load_test_cases(fixtures_path)

    # Evaluate each test case
    results = []
    for test_case in test_cases:
        try:
            result = evaluate_single_test_case(test_case)
            results.append(result)
        except Exception as e:
            # Create a failure result for test cases that throw exceptions
            failure_result = EvalResult(
                test_description=test_case.description,
                metrics=[],
                overall_passed=False,
            )
            # Note: In a real implementation, you might want to include the error
            # information in the result, but the current schema doesn't support it
            results.append(failure_result)

    # Compute summary statistics
    total_test_cases = len(results)
    total_passed = sum(1 for r in results if r.overall_passed)
    pass_rate = total_passed / total_test_cases if total_test_cases > 0 else 0.0

    # Compute average scores for each metric type
    metric_scores = {}
    metric_counts = {}

    for result in results:
        for metric in result.metrics:
            if metric.name not in metric_scores:
                metric_scores[metric.name] = 0.0
                metric_counts[metric.name] = 0
            metric_scores[metric.name] += metric.value
            metric_counts[metric.name] += 1

    average_scores = {
        name: metric_scores[name] / metric_counts[name] for name in metric_scores
    }

    summary = {
        "pass_rate": pass_rate,
        "average_scores": average_scores,
        "total_test_cases": total_test_cases,
        "total_passed": total_passed,
        "total_failed": total_test_cases - total_passed,
    }

    # Check results against quality thresholds
    threshold_check = check_evaluation_thresholds(results)

    return {
        "results": results,
        "summary": summary,
        "threshold_check": threshold_check,
        "total_test_cases": total_test_cases,
        "total_passed": total_passed,
    }


def write_eval_results(
    eval_run_id: str,
    results: list[EvalResult],
    db_path: str,
) -> str:
    """
    Write evaluation results to the SQLite database for persistent storage.

    This function bridges the eval runner results with the database storage
    system, inserting both the run summary and detailed metric results.

    Args:
        eval_run_id: Unique identifier for this evaluation run
        results: List of EvalResult objects from run_eval_suite()
        db_path: Path to the SQLite database file for storage

    Returns:
        str: The run_id that was used for storage (same as input eval_run_id)

    Raises:
        sqlite3.Error: If database operation fails
        ValueError: If results are invalid or missing
        OSError: If database file cannot be created/accessed

    Example:
        >>> results = run_eval_suite("fixtures.yaml")
        >>> write_eval_results("2025-11-02T08-00-00Z", results["results"], "./eval_results.db")
        '2025-11-02T08-00-00Z'

    Security:
        - Uses parameterized queries via storage.eval_db functions
        - No SQL injection vulnerabilities
        - Database operations are wrapped in transactions

    Note:
        This function:
        1. Initializes the database if needed (creates tables, applies migrations)
        2. Creates the eval_results dictionary in the format expected by store_eval_results()
        3. Stores results atomically in a single transaction
        4. Returns the run_id for reference
    """
    if not eval_run_id:
        raise ValueError("eval_run_id cannot be empty")

    if not results:
        raise ValueError("results list cannot be empty")

    # Initialize database if needed (creates tables, applies migrations)
    init_eval_db_if_needed(db_path)

    # Convert EvalResult objects to the format expected by store_eval_results()
    # First, compute summary statistics from the results
    total_test_cases = len(results)
    total_passed = sum(1 for r in results if r.overall_passed)
    total_failed = total_test_cases - total_passed
    pass_rate = total_passed / total_test_cases if total_test_cases > 0 else 0.0

    # Compute average scores for each metric type
    metric_scores = {}
    metric_counts = {}

    for result in results:
        for metric in result.metrics:
            if metric.name not in metric_scores:
                metric_scores[metric.name] = 0.0
                metric_counts[metric.name] = 0
            metric_scores[metric.name] += metric.value
            metric_counts[metric.name] += 1

    average_scores = {
        name: metric_scores[name] / metric_counts[name] for name in metric_scores
    }

    # Create summary dictionary
    summary = {
        "pass_rate": pass_rate,
        "average_scores": average_scores,
        "total_test_cases": total_test_cases,
        "total_passed": total_passed,
        "total_failed": total_failed,
    }

    # Create eval_results dictionary in the expected format
    eval_results_dict = {
        "results": results,
        "summary": summary,
        "total_test_cases": total_test_cases,
        "total_passed": total_passed,
    }

    # Store results in database
    with sqlite3.connect(db_path) as conn:
        run_id = store_eval_results(conn, eval_results_dict, eval_run_id)
        conn.commit()

    return run_id
