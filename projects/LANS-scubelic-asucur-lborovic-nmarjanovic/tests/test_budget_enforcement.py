"""
Tests for budget enforcement logic.

Tests various budget scenarios:
- Per-run budget limits
- Per-intent budget limits
- Warning thresholds
- Budget disabled scenarios
- Edge cases (zero budget, negative costs, etc.)
"""

import pytest

from llm_answer_watcher.config.schema import (
    Brands,
    BudgetConfig,
    Intent,
    ModelConfig,
    RunSettings,
    RuntimeConfig,
    RuntimeModel,
)
from llm_answer_watcher.exceptions import BudgetExceededError
from llm_answer_watcher.llm_runner.runner import estimate_run_cost, validate_budget


@pytest.fixture
def base_config(tmp_path):
    """Create a base runtime config for testing."""
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
        brands=Brands(mine=["MyBrand"], competitors=["Competitor"]),
        intents=[
            Intent(id="intent1", prompt="Test prompt 1"),
            Intent(id="intent2", prompt="Test prompt 2"),
        ],
        models=[
            RuntimeModel(
                provider="openai",
                model_name="gpt-4o-mini",
                api_key="test-key",
                system_prompt="Test prompt",
            )
        ],
    )


class TestBudgetEstimation:
    """Tests for cost estimation logic."""

    def test_estimate_cost_basic(self, base_config):
        """Basic cost estimation should work."""
        estimate = estimate_run_cost(base_config)

        assert "total_estimated_cost" in estimate
        assert "total_queries" in estimate
        assert "per_model_costs" in estimate
        assert estimate["total_queries"] == 2  # 2 intents × 1 model

    def test_estimate_cost_multiple_models(self, base_config):
        """Cost estimation with multiple models."""
        # Add another model
        base_config.models.append(
            RuntimeModel(
                provider="openai",
                model_name="gpt-4o",
                api_key="test-key",
                system_prompt="Test prompt",
            )
        )

        estimate = estimate_run_cost(base_config)
        assert estimate["total_queries"] == 4  # 2 intents × 2 models
        assert len(estimate["per_model_costs"]) == 2

    def test_estimate_includes_safety_buffer(self, base_config):
        """Cost estimate should include 20% safety buffer."""
        estimate = estimate_run_cost(base_config)

        base_cost = estimate["base_cost"]
        total_cost = estimate["total_estimated_cost"]
        buffer = estimate["buffer_percentage"]

        assert total_cost > base_cost
        assert buffer == 0.20  # 20%
        assert abs(total_cost - (base_cost * 1.20)) < 0.000001


class TestPerRunBudget:
    """Tests for per-run budget limits."""

    def test_under_budget_passes(self, base_config, monkeypatch):
        """Config under budget should pass validation."""
        # Set high budget
        base_config.run_settings.budget = BudgetConfig(
            enabled=True,
            max_per_run_usd=1.0,  # High limit
        )

        estimate = estimate_run_cost(base_config)

        # Should not raise
        validate_budget(base_config, estimate)

    def test_over_budget_raises_error(self, base_config, monkeypatch):
        """Config over budget should raise BudgetExceededError."""
        # Set very low budget
        base_config.run_settings.budget = BudgetConfig(
            enabled=True,
            max_per_run_usd=0.0001,  # Very low limit
        )

        estimate = estimate_run_cost(base_config)

        # Should raise BudgetExceededError
        with pytest.raises(BudgetExceededError) as exc_info:
            validate_budget(base_config, estimate)

        error = exc_info.value
        assert error.estimated_cost is not None
        assert error.budget_limit == 0.0001
        assert error.budget_type == "per_run"

    def test_exactly_at_budget_passes(self, base_config):
        """Config exactly at budget should pass."""
        estimate = estimate_run_cost(base_config)

        # Set budget to exact estimated cost
        base_config.run_settings.budget = BudgetConfig(
            enabled=True,
            max_per_run_usd=estimate["total_estimated_cost"],
        )

        # Should not raise
        validate_budget(base_config, estimate)

    def test_budget_disabled_always_passes(self, base_config):
        """When budget is disabled, should always pass."""
        # Set disabled budget with low limit
        base_config.run_settings.budget = BudgetConfig(
            enabled=False,
            max_per_run_usd=0.0001,
        )

        estimate = estimate_run_cost(base_config)

        # Should not raise even with low limit
        validate_budget(base_config, estimate)

    def test_no_budget_config_passes(self, base_config):
        """When no budget is configured, should pass."""
        # No budget set (None)
        base_config.run_settings.budget = None

        estimate = estimate_run_cost(base_config)

        # Should not raise
        validate_budget(base_config, estimate)


class TestPerIntentBudget:
    """Tests for per-intent budget limits."""

    def test_per_intent_under_budget_passes(self, base_config):
        """Per-intent budget under limit should pass."""
        estimate = estimate_run_cost(base_config)

        # Calculate max per-intent cost
        max_intent_cost = max(estimate["per_intent_costs"].values())

        # Set budget slightly higher than max intent
        base_config.run_settings.budget = BudgetConfig(
            enabled=True,
            max_per_intent_usd=max_intent_cost * 1.5,
        )

        # Should not raise
        validate_budget(base_config, estimate)

    def test_per_intent_over_budget_raises_error(self, base_config):
        """Per-intent budget over limit should raise error."""
        estimate = estimate_run_cost(base_config)

        # Calculate max per-intent cost
        max_intent_cost = max(estimate["per_intent_costs"].values())

        # Set budget lower than max intent
        base_config.run_settings.budget = BudgetConfig(
            enabled=True,
            max_per_intent_usd=max_intent_cost * 0.5,
        )

        # Should raise BudgetExceededError
        with pytest.raises(BudgetExceededError) as exc_info:
            validate_budget(base_config, estimate)

        error = exc_info.value
        assert error.budget_type == "per_intent"

    def test_both_per_run_and_per_intent_budgets(self, base_config):
        """Both per-run and per-intent budgets should be checked."""
        estimate = estimate_run_cost(base_config)

        max_intent_cost = max(estimate["per_intent_costs"].values())

        # Set both budgets - per_run is fine, per_intent is too low
        base_config.run_settings.budget = BudgetConfig(
            enabled=True,
            max_per_run_usd=1.0,  # High enough
            max_per_intent_usd=max_intent_cost * 0.5,  # Too low
        )

        # Should raise due to per_intent limit
        with pytest.raises(BudgetExceededError) as exc_info:
            validate_budget(base_config, estimate)

        assert exc_info.value.budget_type == "per_intent"


class TestWarningThresholds:
    """Tests for budget warning thresholds."""

    def test_warning_threshold_basic(self, base_config, caplog):
        """Warning threshold should log warning when exceeded."""
        estimate = estimate_run_cost(base_config)

        # Set warning threshold that will be exceeded
        base_config.run_settings.budget = BudgetConfig(
            enabled=True,
            max_per_run_usd=1.0,
            warn_threshold=0.0001,  # Very low threshold
        )

        # Should not raise but should log warning
        validate_budget(base_config, estimate)

        # Check that warning was logged
        assert any(
            "warning" in record.levelname.lower() or "warn" in record.message.lower()
            for record in caplog.records
        )

    def test_under_warning_threshold_no_warning(self, base_config, caplog):
        """Under warning threshold should not log warning."""
        estimate = estimate_run_cost(base_config)

        # Set high warning threshold
        base_config.run_settings.budget = BudgetConfig(
            enabled=True,
            max_per_run_usd=1.0,
            warn_threshold=0.999,  # 99.9% - won't be exceeded
        )

        # Should not raise and should not warn
        validate_budget(base_config, estimate)

        # No warnings should be logged
        warnings = [r for r in caplog.records if "warn" in r.levelname.lower()]
        assert len(warnings) == 0 or all(
            "budget" not in r.message.lower() for r in warnings
        )


class TestEdgeCases:
    """Tests for edge cases in budget enforcement."""

    def test_zero_budget_raises_error(self, base_config):
        """Zero budget should raise error."""
        base_config.run_settings.budget = BudgetConfig(
            enabled=True,
            max_per_run_usd=0.0,
        )

        estimate = estimate_run_cost(base_config)

        with pytest.raises(BudgetExceededError):
            validate_budget(base_config, estimate)

    def test_negative_budget_raises_error(self, base_config):
        """Negative budget should raise error."""
        base_config.run_settings.budget = BudgetConfig(
            enabled=True,
            max_per_run_usd=-0.01,
        )

        estimate = estimate_run_cost(base_config)

        with pytest.raises(BudgetExceededError):
            validate_budget(base_config, estimate)

    def test_very_large_budget_passes(self, base_config):
        """Very large budget should pass."""
        base_config.run_settings.budget = BudgetConfig(
            enabled=True,
            max_per_run_usd=999999.99,
        )

        estimate = estimate_run_cost(base_config)

        # Should not raise
        validate_budget(base_config, estimate)

    def test_single_query_budget(self, base_config):
        """Budget with single query should work."""
        # Reduce to 1 intent
        base_config.intents = [Intent(id="intent1", prompt="Test")]

        estimate = estimate_run_cost(base_config)
        assert estimate["total_queries"] == 1

        # Set budget for single query
        base_config.run_settings.budget = BudgetConfig(
            enabled=True,
            max_per_run_usd=estimate["total_estimated_cost"],
        )

        # Should not raise
        validate_budget(base_config, estimate)

    def test_many_queries_budget(self, base_config):
        """Budget with many queries should scale correctly."""
        # Add many intents
        for i in range(20):
            base_config.intents.append(
                Intent(id=f"intent{i}", prompt=f"Test prompt {i}")
            )

        estimate = estimate_run_cost(base_config)
        assert estimate["total_queries"] >= 20

        # Budget should scale with number of queries
        base_estimate_cost = estimate["total_estimated_cost"]

        base_config.run_settings.budget = BudgetConfig(
            enabled=True,
            max_per_run_usd=base_estimate_cost * 0.5,  # Too low
        )

        with pytest.raises(BudgetExceededError):
            validate_budget(base_config, estimate)


class TestBudgetWithDifferentModels:
    """Tests for budget with different model cost profiles."""

    def test_expensive_model_budget(self, base_config):
        """Budget should account for expensive models."""
        # Add expensive model (gpt-4)
        base_config.models.append(
            RuntimeModel(
                provider="openai",
                model_name="gpt-4",
                api_key="test-key",
                system_prompt="Test prompt",
            )
        )

        estimate = estimate_run_cost(base_config)

        # Expensive model should increase total cost
        assert estimate["total_estimated_cost"] > 0.001

        # Per-model costs should differ
        per_model = estimate["per_model_costs"]
        assert len(per_model) == 2
        # gpt-4 should cost more than gpt-4o-mini
        gpt4_cost = next(
            m["cost_per_query"] for m in per_model if m["model_name"] == "gpt-4"
        )
        gpt4o_mini_cost = next(
            m["cost_per_query"] for m in per_model if m["model_name"] == "gpt-4o-mini"
        )
        assert gpt4_cost > gpt4o_mini_cost

    def test_cheap_model_budget(self, base_config):
        """Budget with cheap model should have low cost."""
        estimate = estimate_run_cost(base_config)

        # gpt-4o-mini should be relatively cheap
        assert estimate["total_estimated_cost"] < 0.01
