"""
Pydantic schema models for the evaluation framework.

This module defines the core data structures used throughout the evaluation system:
- EvalTestCase: A single test case with input and expected output
- EvalMetricScore: A single metric with score and pass/fail status
- EvalResult: Complete result for a test case with all metrics
"""

from typing import Any

from pydantic import BaseModel, Field, field_validator


class EvalTestCase(BaseModel):
    """
    A single evaluation test case.

    Contains the input LLM answer text, brand definitions, and ground truth
    expected outputs for validation.
    """

    description: str = Field(
        ..., description="Human-readable description of the test case"
    )
    intent_id: str = Field(
        ..., description="Intent identifier this test case belongs to"
    )
    llm_answer_text: str = Field(..., description="Raw LLM answer text to evaluate")

    # Brand definitions
    brands_mine: list[str] = Field(..., description="List of my brand names/aliases")
    brands_competitors: list[str] = Field(
        ..., description="List of competitor brand names/aliases"
    )

    # Ground truth expected outputs
    expected_my_mentions: list[str] = Field(
        ..., description="Expected mentions of my brands"
    )
    expected_competitor_mentions: list[str] = Field(
        ..., description="Expected mentions of competitor brands"
    )
    expected_ranked_list: list[str] = Field(
        ..., description="Expected ranked list of all mentioned brands"
    )

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        """Ensure description is not empty."""
        if not v or v.strip() == "":
            raise ValueError("Test case description cannot be empty")
        return v.strip()

    @field_validator("brands_mine", "brands_competitors")
    @classmethod
    def validate_brand_lists(cls, v: list[str]) -> list[str]:
        """Ensure brand lists are not empty and contain valid entries."""
        if not v:
            raise ValueError("Brand lists cannot be empty")

        # Remove empty strings and whitespace-only entries
        cleaned = [brand.strip() for brand in v if brand and brand.strip()]
        if not cleaned:
            raise ValueError("Brand lists must contain valid brand names")

        return cleaned

    @field_validator("llm_answer_text")
    @classmethod
    def validate_answer_text(cls, v: str) -> str:
        """Ensure answer text is not empty."""
        if not v or v.strip() == "":
            raise ValueError("LLM answer text cannot be empty")
        return v

    @field_validator(
        "expected_my_mentions", "expected_competitor_mentions", "expected_ranked_list"
    )
    @classmethod
    def validate_expected_lists(cls, v: list[str]) -> list[str]:
        """Normalize expected mention lists."""
        return [item.strip() for item in v if item is not None]


class EvalMetricScore(BaseModel):
    """
    A single evaluation metric with score and pass/fail determination.

    Represents one aspect of evaluation (e.g., precision, recall, F1) with
    its computed value and whether it meets the passing threshold.
    """

    name: str = Field(..., description="Name of the metric (e.g., 'mention_precision')")
    value: float = Field(
        ..., ge=0.0, le=1.0, description="Metric value between 0.0 and 1.0"
    )
    passed: bool = Field(..., description="Whether the metric meets passing criteria")
    details: dict[str, Any] | None = Field(
        None, description="Additional details about the metric computation"
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Ensure metric name is not empty."""
        if not v or v.strip() == "":
            raise ValueError("Metric name cannot be empty")
        return v.strip()


class EvalResult(BaseModel):
    """
    Complete evaluation result for a single test case.

    Contains all metric scores for a test case and an overall pass/fail
    determination based on whether all critical metrics pass.
    """

    test_description: str = Field(
        ..., description="Description of the test case evaluated"
    )
    metrics: list[EvalMetricScore] = Field(
        ..., description="All computed metrics for this test"
    )
    overall_passed: bool = Field(
        ..., description="Whether the test case passed overall"
    )

    @field_validator("test_description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        """Ensure test description is not empty."""
        if not v or v.strip() == "":
            raise ValueError("Test description cannot be empty")
        return v.strip()

    def get_metric_by_name(self, name: str) -> EvalMetricScore | None:
        """Get a specific metric by name."""
        for metric in self.metrics:
            if metric.name == name:
                return metric
        return None

    def get_critical_metrics(self) -> list[EvalMetricScore]:
        """Get all critical metrics that must pass for overall success."""
        # Define which metrics are critical for overall success
        critical_names = {"mention_precision", "mention_recall", "mention_f1"}
        return [m for m in self.metrics if m.name in critical_names]
