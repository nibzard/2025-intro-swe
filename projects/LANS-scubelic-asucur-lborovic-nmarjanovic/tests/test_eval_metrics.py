"""
Tests for eval metrics module (llm_answer_watcher.evals.metrics).

Tests cover all metric computation functions with various edge cases:
- compute_mention_metrics() - precision, recall, F1 for mention detection
- compute_rank_metrics() - position accuracy, list overlap, rank correlation
- compute_completeness_metrics() - brand coverage metrics
"""

import pytest

from llm_answer_watcher.evals.metrics import (
    compute_completeness_metrics,
    compute_mention_metrics,
    compute_rank_metrics,
)
from llm_answer_watcher.evals.schema import EvalTestCase


class TestComputeMentionMetrics:
    """Test cases for compute_mention_metrics() function."""

    def test_perfect_match(self):
        """Test with perfect mention detection (100% precision/recall/F1)."""
        test_case = EvalTestCase(
            description="Perfect match test",
            intent_id="test_001",
            llm_answer_text="Test answer",
            brands_mine=["HubSpot", "MyBrand"],
            brands_competitors=["Salesforce", "CompetitorA"],
            expected_my_mentions=["HubSpot"],
            expected_competitor_mentions=["Salesforce"],
            expected_ranked_list=["HubSpot", "Salesforce"],
        )

        actual_mentions = ["HubSpot", "Salesforce"]
        metrics = compute_mention_metrics(test_case, actual_mentions)

        # Should have 3 metrics: precision, recall, F1
        assert len(metrics) == 3

        # Check metric names
        metric_names = [m.name for m in metrics]
        assert "mention_precision" in metric_names
        assert "mention_recall" in metric_names
        assert "mention_f1" in metric_names

        # All should be perfect (1.0) and pass
        for metric in metrics:
            assert metric.value == 1.0
            assert metric.passed is True
            assert metric.details is not None

        # Check specific metric details (order doesn't matter for sets)
        precision_metric = next(m for m in metrics if m.name == "mention_precision")
        assert precision_metric.details["true_positives"] == 2
        assert precision_metric.details["false_positives"] == 0
        assert set(precision_metric.details["expected_mentions"]) == {
            "HubSpot",
            "Salesforce",
        }
        assert set(precision_metric.details["actual_mentions"]) == {
            "HubSpot",
            "Salesforce",
        }

    def test_false_positives(self):
        """Test with false positives (lower precision, high recall)."""
        test_case = EvalTestCase(
            description="False positives test",
            intent_id="test_002",
            llm_answer_text="Test answer",
            brands_mine=["HubSpot"],
            brands_competitors=["Salesforce"],
            expected_my_mentions=["HubSpot"],
            expected_competitor_mentions=["Salesforce"],
            expected_ranked_list=["HubSpot", "Salesforce"],
        )

        # Detected extra mentions that weren't expected
        actual_mentions = ["HubSpot", "Salesforce", "ExtraBrand", "AnotherBrand"]
        metrics = compute_mention_metrics(test_case, actual_mentions)

        precision_metric = next(m for m in metrics if m.name == "mention_precision")
        recall_metric = next(m for m in metrics if m.name == "mention_recall")
        f1_metric = next(m for m in metrics if m.name == "mention_f1")

        # Precision should be 2/4 = 0.5 (failed threshold)
        assert precision_metric.value == 0.5
        assert precision_metric.passed is False
        assert precision_metric.details["true_positives"] == 2
        assert precision_metric.details["false_positives"] == 2

        # Recall should be 2/2 = 1.0 (passed threshold)
        assert recall_metric.value == 1.0
        assert recall_metric.passed is True
        assert recall_metric.details["false_negatives"] == 0

        # F1 should be less than 1.0
        assert f1_metric.value < 1.0
        assert f1_metric.passed is False  # F1 threshold is 0.8

    def test_false_negatives(self):
        """Test with false negatives (high precision, lower recall)."""
        test_case = EvalTestCase(
            description="False negatives test",
            intent_id="test_003",
            llm_answer_text="Test answer",
            brands_mine=["HubSpot", "MyBrand"],
            brands_competitors=["Salesforce", "CompetitorA"],
            expected_my_mentions=["HubSpot", "MyBrand"],
            expected_competitor_mentions=["Salesforce"],
            expected_ranked_list=["HubSpot", "Salesforce", "MyBrand"],
        )

        # Missing some expected mentions
        actual_mentions = ["HubSpot"]  # Missing MyBrand and Salesforce
        metrics = compute_mention_metrics(test_case, actual_mentions)

        precision_metric = next(m for m in metrics if m.name == "mention_precision")
        recall_metric = next(m for m in metrics if m.name == "mention_recall")
        f1_metric = next(m for m in metrics if m.name == "mention_f1")

        # Precision should be 1.0 (no false positives)
        assert precision_metric.value == 1.0
        assert precision_metric.passed is True
        assert precision_metric.details["false_positives"] == 0

        # Recall should be 1/3 ≈ 0.333 (failed threshold)
        assert recall_metric.value == pytest.approx(0.333, rel=1e-2)
        assert recall_metric.passed is False
        assert recall_metric.details["false_negatives"] == 2

        # F1 should be exactly 0.5 (2 * 1.0 * 0.333 / (1.0 + 0.333) = 0.5)
        assert f1_metric.value == pytest.approx(0.5, rel=1e-2)
        assert f1_metric.passed is False

    def test_zero_division_edge_case(self):
        """Test edge case with no actual mentions (zero division)."""
        test_case = EvalTestCase(
            description="Zero division test",
            intent_id="test_004",
            llm_answer_text="Test answer",
            brands_mine=["HubSpot"],
            brands_competitors=["Salesforce"],
            expected_my_mentions=["HubSpot"],
            expected_competitor_mentions=["Salesforce"],
            expected_ranked_list=["HubSpot", "Salesforce"],
        )

        # No mentions detected
        actual_mentions = []
        metrics = compute_mention_metrics(test_case, actual_mentions)

        precision_metric = next(m for m in metrics if m.name == "mention_precision")
        recall_metric = next(m for m in metrics if m.name == "mention_recall")
        f1_metric = next(m for m in metrics if m.name == "mention_f1")

        # Precision should be 0.0 (no actual mentions)
        assert precision_metric.value == 0.0
        assert precision_metric.passed is False
        assert precision_metric.details["true_positives"] == 0
        assert precision_metric.details["false_positives"] == 0

        # Recall should be 0.0 (no expected mentions found)
        assert recall_metric.value == 0.0
        assert recall_metric.passed is False
        assert recall_metric.details["false_negatives"] == 2

        # F1 should be 0.0 when both precision and recall are 0
        assert f1_metric.value == 0.0
        assert f1_metric.passed is False

    def test_empty_expected_mentions(self):
        """Test edge case with no expected mentions."""
        test_case = EvalTestCase(
            description="Empty expected test",
            intent_id="test_005",
            llm_answer_text="Test answer",
            brands_mine=["HubSpot"],
            brands_competitors=["Salesforce"],
            expected_my_mentions=[],
            expected_competitor_mentions=[],
            expected_ranked_list=[],
        )

        actual_mentions = ["HubSpot", "Salesforce"]
        metrics = compute_mention_metrics(test_case, actual_mentions)

        precision_metric = next(m for m in metrics if m.name == "mention_precision")
        recall_metric = next(m for m in metrics if m.name == "mention_recall")

        # Precision should be 0.0 (all mentions are false positives)
        assert precision_metric.value == 0.0
        assert precision_metric.passed is False

        # Recall should be 0.0 (no true positives when no expected mentions)
        assert recall_metric.value == 0.0
        assert recall_metric.passed is False
        assert recall_metric.details["false_negatives"] == 0


class TestComputeRankMetrics:
    """Test cases for compute_rank_metrics() function."""

    def test_perfect_ranking(self):
        """Test with perfect ranking accuracy."""
        test_case = EvalTestCase(
            description="Perfect ranking test",
            intent_id="test_006",
            llm_answer_text="Test answer",
            brands_mine=["HubSpot"],
            brands_competitors=["Salesforce", "CompetitorA"],
            expected_my_mentions=["HubSpot"],
            expected_competitor_mentions=["Salesforce"],
            expected_ranked_list=["HubSpot", "Salesforce", "CompetitorA"],
        )

        actual_ranked_list = ["HubSpot", "Salesforce", "CompetitorA"]
        metrics = compute_rank_metrics(test_case, actual_ranked_list)

        # Should have 3 metrics: position accuracy, list overlap, rank correlation
        assert len(metrics) == 3

        # All should be perfect (1.0) and pass
        for metric in metrics:
            assert metric.value == 1.0
            assert metric.passed is True

    def test_wrong_ranking(self):
        """Test with incorrect ranking."""
        test_case = EvalTestCase(
            description="Wrong ranking test",
            intent_id="test_007",
            llm_answer_text="Test answer",
            brands_mine=["HubSpot"],
            brands_competitors=["Salesforce", "CompetitorA"],
            expected_my_mentions=["HubSpot"],
            expected_competitor_mentions=["Salesforce"],
            expected_ranked_list=["HubSpot", "Salesforce", "CompetitorA"],
        )

        # Completely wrong order
        actual_ranked_list = ["CompetitorA", "Salesforce", "HubSpot"]
        metrics = compute_rank_metrics(test_case, actual_ranked_list)

        position_metric = next(m for m in metrics if m.name == "rank_position_accuracy")
        overlap_metric = next(m for m in metrics if m.name == "rank_list_overlap")
        correlation_metric = next(m for m in metrics if m.name == "rank_correlation")

        # Position accuracy should be 1/3 ≈ 0.333 (only Salesforce in correct position)
        assert position_metric.value == pytest.approx(0.333, rel=1e-2)
        assert position_metric.passed is False  # Below 0.7 threshold

        # List overlap should be 1.0 (all items present, just wrong order)
        assert overlap_metric.value == 1.0
        assert overlap_metric.passed is True  # Above 0.8 threshold

        # Rank correlation should be low due to displacement
        assert correlation_metric.value < 1.0
        assert correlation_metric.passed is False  # Below 0.6 threshold

    def test_partial_ranking(self):
        """Test with partially correct ranking."""
        test_case = EvalTestCase(
            description="Partial ranking test",
            intent_id="test_008",
            llm_answer_text="Test answer",
            brands_mine=["HubSpot"],
            brands_competitors=["Salesforce", "CompetitorA"],
            expected_my_mentions=["HubSpot"],
            expected_competitor_mentions=["Salesforce"],
            expected_ranked_list=["HubSpot", "Salesforce"],
        )

        # First item correct, second item wrong
        actual_ranked_list = ["HubSpot", "CompetitorA", "ExtraBrand"]
        metrics = compute_rank_metrics(test_case, actual_ranked_list)

        position_metric = next(m for m in metrics if m.name == "rank_position_accuracy")
        overlap_metric = next(m for m in metrics if m.name == "rank_list_overlap")

        # Position accuracy should be 1/2 = 0.5 (HubSpot in correct position)
        assert position_metric.value == 0.5
        assert position_metric.passed is False  # Below 0.7 threshold

        # List overlap should be 1/4 = 0.25 (only HubSpot overlaps, Salesforce missing, extra items dilute)
        assert overlap_metric.value == 0.25
        assert overlap_metric.passed is False  # Below 0.8 threshold

    def test_missing_items(self):
        """Test ranking with missing expected items."""
        test_case = EvalTestCase(
            description="Missing items test",
            intent_id="test_009",
            llm_answer_text="Test answer",
            brands_mine=["HubSpot", "MyBrand"],
            brands_competitors=["Salesforce"],
            expected_my_mentions=["HubSpot"],
            expected_competitor_mentions=["Salesforce"],
            expected_ranked_list=["HubSpot", "Salesforce", "MyBrand"],
        )

        # Missing some expected items
        actual_ranked_list = ["HubSpot"]  # Missing Salesforce and MyBrand
        metrics = compute_rank_metrics(test_case, actual_ranked_list)

        overlap_metric = next(m for m in metrics if m.name == "rank_list_overlap")
        correlation_metric = next(m for m in metrics if m.name == "rank_correlation")

        # List overlap should be low (only 1 out of 3 expected items)
        assert overlap_metric.value == pytest.approx(0.333, rel=1e-2)
        assert overlap_metric.passed is False

        # Rank correlation should be very low due to missing items
        assert correlation_metric.value < 0.5
        assert correlation_metric.passed is False

    def test_empty_expected_ranking(self):
        """Test with empty expected ranking."""
        test_case = EvalTestCase(
            description="Empty ranking test",
            intent_id="test_010",
            llm_answer_text="Test answer",
            brands_mine=["HubSpot"],
            brands_competitors=["Salesforce"],
            expected_my_mentions=[],
            expected_competitor_mentions=[],
            expected_ranked_list=[],
        )

        actual_ranked_list = ["HubSpot", "Salesforce"]
        metrics = compute_rank_metrics(test_case, actual_ranked_list)

        # Position accuracy and rank correlation should be 1.0 (perfect when no expectations)
        position_metric = next(m for m in metrics if m.name == "rank_position_accuracy")
        correlation_metric = next(m for m in metrics if m.name == "rank_correlation")
        overlap_metric = next(m for m in metrics if m.name == "rank_list_overlap")

        assert position_metric.value == 1.0
        assert position_metric.passed is True
        assert correlation_metric.value == 1.0
        assert correlation_metric.passed is True

        # List overlap should be 0.0 (no overlap between empty expected set and actual items)
        assert overlap_metric.value == 0.0
        assert overlap_metric.passed is False  # Fails 0.8 threshold


class TestComputeCompletenessMetrics:
    """Test cases for compute_completeness_metrics() function."""

    def test_complete_coverage(self):
        """Test with complete brand coverage."""
        test_case = EvalTestCase(
            description="Complete coverage test",
            intent_id="test_011",
            llm_answer_text="Test answer",
            brands_mine=["HubSpot", "MyBrand"],
            brands_competitors=["Salesforce", "CompetitorA"],
            expected_my_mentions=["HubSpot"],
            expected_competitor_mentions=["Salesforce"],
            expected_ranked_list=["HubSpot", "Salesforce"],
        )

        actual_mentions = ["HubSpot", "MyBrand", "Salesforce", "CompetitorA"]
        metrics = compute_completeness_metrics(test_case, actual_mentions)

        # Should have 3 metrics: my brands, competitors, overall
        assert len(metrics) == 3

        # All should be perfect (1.0) and pass
        for metric in metrics:
            assert metric.value == 1.0
            assert metric.passed is True

    def test_partial_my_brands_coverage(self):
        """Test with partial coverage of my brands."""
        test_case = EvalTestCase(
            description="Partial my brands coverage",
            intent_id="test_012",
            llm_answer_text="Test answer",
            brands_mine=["HubSpot", "MyBrand", "AnotherBrand"],
            brands_competitors=["Salesforce"],
            expected_my_mentions=["HubSpot"],
            expected_competitor_mentions=["Salesforce"],
            expected_ranked_list=["HubSpot", "Salesforce"],
        )

        actual_mentions = ["HubSpot"]  # Missing MyBrand and AnotherBrand
        metrics = compute_completeness_metrics(test_case, actual_mentions)

        my_brands_metric = next(m for m in metrics if m.name == "my_brands_coverage")
        competitors_metric = next(
            m for m in metrics if m.name == "competitors_coverage"
        )
        overall_metric = next(m for m in metrics if m.name == "overall_brand_coverage")

        # My brands coverage should be 1/3 ≈ 0.333 (failed 90% threshold)
        assert my_brands_metric.value == pytest.approx(0.333, rel=1e-2)
        assert my_brands_metric.passed is False
        assert my_brands_metric.details["my_brands_mentioned"] == 1
        assert my_brands_metric.details["total_my_brands"] == 3

        # Competitors coverage should be 0/1 = 0.0 (failed 70% threshold)
        assert competitors_metric.value == 0.0
        assert competitors_metric.passed is False

        # Overall coverage should be 1/4 = 0.25 (failed 80% threshold)
        assert overall_metric.value == 0.25
        assert overall_metric.passed is False

    def test_no_my_brands_mentioned(self):
        """Test with no mention of my brands (critical failure)."""
        test_case = EvalTestCase(
            description="No my brands mentioned",
            intent_id="test_013",
            llm_answer_text="Test answer",
            brands_mine=["HubSpot", "MyBrand"],
            brands_competitors=["Salesforce"],
            expected_my_mentions=["HubSpot"],
            expected_competitor_mentions=["Salesforce"],
            expected_ranked_list=["HubSpot", "Salesforce"],
        )

        actual_mentions = ["Salesforce"]  # Only competitors mentioned
        metrics = compute_completeness_metrics(test_case, actual_mentions)

        my_brands_metric = next(m for m in metrics if m.name == "my_brands_coverage")
        competitors_metric = next(
            m for m in metrics if m.name == "competitors_coverage"
        )

        # My brands coverage should be 0.0 (critical failure)
        assert my_brands_metric.value == 0.0
        assert my_brands_metric.passed is False
        assert my_brands_metric.details["my_brands_mentioned"] == 0

        # Competitors coverage should be 1.0 (good)
        assert competitors_metric.value == 1.0
        assert competitors_metric.passed is True

    def test_no_expected_mentions(self):
        """Test with no expected mentions but having brand definitions."""
        test_case = EvalTestCase(
            description="No expected mentions test",
            intent_id="test_014",
            llm_answer_text="Test answer",
            brands_mine=["HubSpot"],
            brands_competitors=["Salesforce"],
            expected_my_mentions=[],
            expected_competitor_mentions=[],
            expected_ranked_list=[],
        )

        # Mentions of brands that weren't expected
        actual_mentions = ["HubSpot", "SomeOtherBrand"]
        metrics = compute_completeness_metrics(test_case, actual_mentions)

        my_brands_metric = next(m for m in metrics if m.name == "my_brands_coverage")
        competitors_metric = next(
            m for m in metrics if m.name == "competitors_coverage"
        )
        overall_metric = next(m for m in metrics if m.name == "overall_brand_coverage")

        # My brands: 1/1 = 1.0 (HubSpot mentioned, even though not expected)
        assert my_brands_metric.value == 1.0
        assert my_brands_metric.passed is True

        # Competitors: 0/1 = 0.0 (Salesforce not mentioned)
        assert competitors_metric.value == 0.0
        assert competitors_metric.passed is False

        # Overall: 1/2 = 0.5 (HubSpot mentioned, Salesforce not)
        assert overall_metric.value == 0.5
        assert overall_metric.passed is False

    def test_mixed_coverage_scenarios(self):
        """Test various mixed coverage scenarios."""
        test_case = EvalTestCase(
            description="Mixed coverage test",
            intent_id="test_015",
            llm_answer_text="Test answer",
            brands_mine=["HubSpot", "MyBrand"],
            brands_competitors=["Salesforce", "CompetitorA", "CompetitorB"],
            expected_my_mentions=["HubSpot"],
            expected_competitor_mentions=["Salesforce"],
            expected_ranked_list=["HubSpot", "Salesforce"],
        )

        actual_mentions = [
            "HubSpot",
            "CompetitorA",
        ]  # Good my brands, partial competitors
        metrics = compute_completeness_metrics(test_case, actual_mentions)

        my_brands_metric = next(m for m in metrics if m.name == "my_brands_coverage")
        competitors_metric = next(
            m for m in metrics if m.name == "competitors_coverage"
        )
        overall_metric = next(m for m in metrics if m.name == "overall_brand_coverage")

        # My brands: 1/2 = 0.5 (failed 90% threshold)
        assert my_brands_metric.value == 0.5
        assert my_brands_metric.passed is False

        # Competitors: 1/3 ≈ 0.333 (failed 70% threshold)
        assert competitors_metric.value == pytest.approx(0.333, rel=1e-2)
        assert competitors_metric.passed is False

        # Overall: 2/5 = 0.4 (failed 80% threshold)
        assert overall_metric.value == 0.4
        assert overall_metric.passed is False
