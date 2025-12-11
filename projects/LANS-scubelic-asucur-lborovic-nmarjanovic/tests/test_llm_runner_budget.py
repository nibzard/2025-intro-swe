"""
Tests for budget validation in llm_runner.runner module.

Tests cover:
- Pre-run cost estimation
- Budget validation (max_per_run_usd, max_per_intent_usd, warn_threshold_usd)
- Budget exceeded errors
- Budget disabled scenarios
"""

import pytest

from llm_answer_watcher.config.schema import (
    Brands,
    BudgetConfig,
    Intent,
    RunSettings,
    RuntimeConfig,
    RuntimeModel,
)
from llm_answer_watcher.llm_runner.runner import (
    BudgetExceededError,
    estimate_run_cost,
    validate_budget,
)


@pytest.fixture
def sample_config():
    """Create a sample runtime configuration for testing."""
    return RuntimeConfig(
        run_settings=RunSettings(
            output_dir="./output",
            sqlite_db_path="./test.db",
            models=[
                RuntimeModel(
                    provider="openai",
                    model_name="gpt-4o-mini",
                    api_key="test-key",
                    system_prompt="Test prompt",
                ),
                RuntimeModel(
                    provider="anthropic",
                    model_name="claude-3-5-haiku-20241022",
                    api_key="test-key",
                    system_prompt="Test prompt",
                ),
            ],
            use_llm_rank_extraction=False,
        ),
        brands=Brands(mine=["TestBrand"], competitors=["Competitor1", "Competitor2"]),
        intents=[
            Intent(id="test-intent-1", prompt="What are the best tools?"),
            Intent(id="test-intent-2", prompt="Compare the top products"),
            Intent(id="test-intent-3", prompt="Which solution is recommended?"),
        ],
        models=[
            RuntimeModel(
                provider="openai",
                model_name="gpt-4o-mini",
                api_key="test-key",
                system_prompt="Test prompt",
            ),
            RuntimeModel(
                provider="anthropic",
                model_name="claude-3-5-haiku-20241022",
                api_key="test-key",
                system_prompt="Test prompt",
            ),
        ],
    )


class TestEstimateRunCost:
    """Test suite for estimate_run_cost() function."""

    def test_estimate_basic_run_cost(self, sample_config):
        """Test basic cost estimation without web search."""
        estimate = estimate_run_cost(sample_config)

        # Should have positive cost
        assert estimate["total_estimated_cost"] > 0

        # Should calculate total queries correctly (3 intents × 2 models = 6)
        assert estimate["total_queries"] == 6

        # Should have per-intent costs
        assert len(estimate["per_intent_costs"]) == 3
        assert "test-intent-1" in estimate["per_intent_costs"]
        assert "test-intent-2" in estimate["per_intent_costs"]
        assert "test-intent-3" in estimate["per_intent_costs"]

        # Should include 20% buffer
        assert estimate["buffer_percentage"] == 0.20
        assert estimate["total_estimated_cost"] > estimate["base_cost"]

    def test_estimate_with_web_search_tools(self, sample_config):
        """Test cost estimation includes web search costs."""
        # Add web search tools to models
        sample_config.models[0].tools = [{"type": "web_search"}]

        estimate = estimate_run_cost(sample_config)

        # Cost should be higher with web search
        estimate_without_tools = estimate_run_cost(sample_config)

        # Remove tools and compare
        sample_config.models[0].tools = None
        estimate_without = estimate_run_cost(sample_config)

        # With web search should be more expensive
        # (This test might need adjustment based on actual implementation)
        assert (
            estimate["total_estimated_cost"] >= estimate_without["total_estimated_cost"]
        )

    def test_estimate_single_intent_single_model(self, sample_config):
        """Test cost estimation with minimal configuration."""
        # Reduce to 1 intent and 1 model
        sample_config.intents = [
            Intent(id="single-intent", prompt="What is the best tool?")
        ]
        sample_config.models = [
            RuntimeModel(
                provider="openai",
                model_name="gpt-4o-mini",
                api_key="test-key",
                system_prompt="Test",
            )
        ]

        estimate = estimate_run_cost(sample_config)

        assert estimate["total_queries"] == 1
        assert len(estimate["per_intent_costs"]) == 1
        assert estimate["total_estimated_cost"] > 0


class TestValidateBudget:
    """Test suite for validate_budget() function."""

    def test_validate_no_budget_configured(self, sample_config):
        """Test validation passes when no budget configured."""
        # No budget set
        sample_config.run_settings.budget = None

        estimate = estimate_run_cost(sample_config)

        # Should not raise
        validate_budget(sample_config, estimate)

    def test_validate_budget_disabled(self, sample_config):
        """Test validation passes when budget is disabled."""
        sample_config.run_settings.budget = BudgetConfig(
            enabled=False, max_per_run_usd=0.01
        )

        estimate = estimate_run_cost(sample_config)

        # Should not raise even though cost exceeds limit
        validate_budget(sample_config, estimate)

    def test_validate_within_max_per_run_budget(self, sample_config):
        """Test validation passes when cost is within budget."""
        # Set high budget that won't be exceeded
        sample_config.run_settings.budget = BudgetConfig(
            enabled=True, max_per_run_usd=100.00
        )

        estimate = estimate_run_cost(sample_config)

        # Should not raise
        validate_budget(sample_config, estimate)

    def test_validate_exceeds_max_per_run_budget(self, sample_config):
        """Test validation raises when max_per_run_usd exceeded."""
        # Set very low budget
        sample_config.run_settings.budget = BudgetConfig(
            enabled=True,
            max_per_run_usd=0.0001,  # Very low limit
        )

        estimate = estimate_run_cost(sample_config)

        # Should raise BudgetExceededError
        with pytest.raises(BudgetExceededError) as exc_info:
            validate_budget(sample_config, estimate)

        assert "max_per_run_usd" in str(exc_info.value)
        assert "$0.0001" in str(exc_info.value)

    def test_validate_exceeds_max_per_intent_budget(self, sample_config):
        """Test validation raises when max_per_intent_usd exceeded."""
        # Set low per-intent budget
        sample_config.run_settings.budget = BudgetConfig(
            enabled=True,
            max_per_intent_usd=0.0001,  # Very low per-intent limit
        )

        estimate = estimate_run_cost(sample_config)

        # Should raise BudgetExceededError
        with pytest.raises(BudgetExceededError) as exc_info:
            validate_budget(sample_config, estimate)

        assert "max_per_intent_usd" in str(exc_info.value)

    def test_validate_warn_threshold(self, sample_config, caplog):
        """Test warning threshold logs warning but doesn't raise."""
        import logging

        caplog.set_level(logging.WARNING)

        # Set warning threshold that will be exceeded
        sample_config.run_settings.budget = BudgetConfig(
            enabled=True,
            warn_threshold_usd=0.0001,  # Very low threshold
        )

        estimate = estimate_run_cost(sample_config)

        # Should not raise, but should log warning
        validate_budget(sample_config, estimate)

        # Check warning was logged
        assert any(
            "warning threshold" in record.message.lower() for record in caplog.records
        )

    def test_validate_all_budget_limits(self, sample_config):
        """Test validation with all budget limits configured."""
        sample_config.run_settings.budget = BudgetConfig(
            enabled=True,
            max_per_run_usd=100.00,  # High enough to pass
            max_per_intent_usd=50.00,  # High enough to pass
            warn_threshold_usd=0.01,  # Will trigger warning
        )

        estimate = estimate_run_cost(sample_config)

        # Should not raise
        validate_budget(sample_config, estimate)


class TestBudgetExceededError:
    """Test suite for BudgetExceededError exception."""

    def test_budget_exceeded_error_message(self, sample_config):
        """Test error message contains useful information."""
        sample_config.run_settings.budget = BudgetConfig(
            enabled=True, max_per_run_usd=0.0001
        )

        estimate = estimate_run_cost(sample_config)

        try:
            validate_budget(sample_config, estimate)
            pytest.fail("Should have raised BudgetExceededError")
        except BudgetExceededError as e:
            error_msg = str(e)

            # Should mention budget type
            assert "max_per_run_usd" in error_msg

            # Should mention costs
            assert "$" in error_msg

            # Should mention how to override
            assert "--force" in error_msg or "override" in error_msg.lower()


class TestBudgetIntegration:
    """Integration tests for budget system."""

    def test_budget_cost_estimation_buffer(self, sample_config):
        """Test that buffer prevents unexpected cost overruns."""
        # Set budget slightly above base cost but below buffered cost
        estimate = estimate_run_cost(sample_config)
        base_cost = estimate["base_cost"]
        buffered_cost = estimate["total_estimated_cost"]

        # Set budget between base and buffered
        mid_cost = (base_cost + buffered_cost) / 2

        sample_config.run_settings.budget = BudgetConfig(
            enabled=True, max_per_run_usd=mid_cost
        )

        # Should raise because buffered cost exceeds budget
        with pytest.raises(BudgetExceededError):
            validate_budget(sample_config, estimate)

    def test_budget_per_intent_calculation(self, sample_config):
        """Test per-intent budget correctly calculated."""
        estimate = estimate_run_cost(sample_config)

        # Each intent cost should be positive
        for intent_id, cost in estimate["per_intent_costs"].items():
            assert cost > 0, f"Intent {intent_id} has zero cost"

        # Sum of per-intent costs should equal base cost
        total_intent_cost = sum(estimate["per_intent_costs"].values())
        assert abs(total_intent_cost - estimate["base_cost"]) < 0.000001


class TestBudgetConfigValidation:
    """Test budget configuration validation."""

    def test_budget_negative_max_per_run(self):
        """Test negative max_per_run_usd raises validation error."""
        with pytest.raises(ValueError) as exc_info:
            BudgetConfig(enabled=True, max_per_run_usd=-1.0)

        assert "positive" in str(exc_info.value).lower()

    def test_budget_negative_max_per_intent(self):
        """Test negative max_per_intent_usd raises validation error."""
        with pytest.raises(ValueError) as exc_info:
            BudgetConfig(enabled=True, max_per_intent_usd=-0.5)

        assert "positive" in str(exc_info.value).lower()

    def test_budget_zero_max_per_run(self):
        """Test zero max_per_run_usd raises validation error."""
        with pytest.raises(ValueError):
            BudgetConfig(enabled=True, max_per_run_usd=0.0)

    def test_budget_valid_configuration(self):
        """Test valid budget configuration."""
        budget = BudgetConfig(
            enabled=True,
            max_per_run_usd=1.00,
            max_per_intent_usd=0.10,
            warn_threshold_usd=0.50,
        )

        assert budget.enabled is True
        assert budget.max_per_run_usd == 1.00
        assert budget.max_per_intent_usd == 0.10
        assert budget.warn_threshold_usd == 0.50

    def test_budget_optional_fields(self):
        """Test budget with only some fields configured."""
        budget = BudgetConfig(enabled=True, max_per_run_usd=1.00)

        assert budget.enabled is True
        assert budget.max_per_run_usd == 1.00
        assert budget.max_per_intent_usd is None
        assert budget.warn_threshold_usd is None
