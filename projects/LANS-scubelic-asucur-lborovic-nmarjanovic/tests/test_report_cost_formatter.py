"""
Tests for report.cost_formatter module.

Tests cover:
- format_cost_usd: Single cost formatting with $ prefix
  - Typical costs (0.0001-1.0 range) → 4 decimals
  - Very small costs (< 0.0001) → 6 decimals
  - Large costs (> 1.0) → 4 decimals
  - Zero cost → 4 decimals
  - Negative cost → ValueError
  - Edge cases (very large values, precision boundaries)
- format_cost_summary: Aggregate statistics with formatted strings
  - Multiple costs → total, min, max, average
  - Single cost → all stats equal
  - Empty list → ValueError
  - Negative costs → ValueError
  - All zeros → valid zero summary
  - Precision validation across summary values
"""

import pytest

from llm_answer_watcher.report.cost_formatter import (
    format_cost_summary,
    format_cost_usd,
)


class TestFormatCostUsdTypicalCosts:
    """Test suite for typical LLM API costs (0.0001-1.0 range)."""

    def test_format_cost_usd_small_typical_cost(self):
        """Test formatting of small typical cost."""
        result = format_cost_usd(0.0001)
        assert result == "$0.0001"

    def test_format_cost_usd_mid_typical_cost(self):
        """Test formatting of mid-range typical cost."""
        result = format_cost_usd(0.0023)
        assert result == "$0.0023"

    def test_format_cost_usd_high_typical_cost(self):
        """Test formatting of high typical cost."""
        result = format_cost_usd(0.5678)
        assert result == "$0.5678"

    def test_format_cost_usd_boundary_typical_cost(self):
        """Test formatting at upper boundary of typical range."""
        result = format_cost_usd(0.9999)
        assert result == "$0.9999"

    def test_format_cost_usd_gpt4o_mini_realistic(self):
        """Test formatting of realistic gpt-4o-mini cost."""
        # Typical gpt-4o-mini cost: ~$0.000045 for 100 input + 50 output tokens
        result = format_cost_usd(0.000045)
        assert result == "$0.000045"  # Uses 6 decimals (< 0.0001)

    def test_format_cost_usd_claude_haiku_realistic(self):
        """Test formatting of realistic Claude Haiku cost."""
        # Typical claude-haiku cost: ~$0.0028 for 1000 input + 500 output tokens
        result = format_cost_usd(0.0028)
        assert result == "$0.0028"


class TestFormatCostUsdVerySmallCosts:
    """Test suite for very small costs (< 0.0001) requiring 6 decimal precision."""

    def test_format_cost_usd_very_small_boundary(self):
        """Test formatting just below 4-decimal threshold."""
        result = format_cost_usd(0.00009999)
        assert result == "$0.000100"  # Uses 6 decimals, rounds up

    def test_format_cost_usd_very_small_typical(self):
        """Test formatting of typical very small cost."""
        result = format_cost_usd(0.000012)
        assert result == "$0.000012"

    def test_format_cost_usd_very_small_single_token(self):
        """Test formatting of single-token cost."""
        # 1 token of gpt-4o-mini input: ~0.00000015
        result = format_cost_usd(0.00000015)
        assert result == "$0.000000"  # Rounds to 6 decimals

    def test_format_cost_usd_very_small_few_tokens(self):
        """Test formatting of few-token cost."""
        # ~10 tokens of gpt-4o-mini: ~0.0000015
        result = format_cost_usd(0.0000015)
        assert result == "$0.000002"  # Uses 6 decimals

    def test_format_cost_usd_very_small_prevents_zero_display(self):
        """Test that 6 decimals prevents showing $0.0000 for non-zero costs."""
        # This is the key use case: small but non-zero costs
        result = format_cost_usd(0.0000567)
        assert result == "$0.000057"
        assert result != "$0.0000"  # Would be shown with 4 decimals


class TestFormatCostUsdLargeCosts:
    """Test suite for large costs (> 1.0)."""

    def test_format_cost_usd_just_over_one_dollar(self):
        """Test formatting just over $1."""
        result = format_cost_usd(1.0001)
        assert result == "$1.0001"

    def test_format_cost_usd_moderate_large(self):
        """Test formatting of moderate large cost."""
        result = format_cost_usd(12.3456)
        assert result == "$12.3456"

    def test_format_cost_usd_very_large(self):
        """Test formatting of very large cost."""
        result = format_cost_usd(9999.9999)
        assert result == "$9999.9999"

    def test_format_cost_usd_hundred_dollar_batch(self):
        """Test formatting of realistic large batch cost."""
        # Realistic cost for processing many queries
        result = format_cost_usd(123.4567)
        assert result == "$123.4567"

    def test_format_cost_usd_thousands(self):
        """Test formatting of thousands of dollars."""
        result = format_cost_usd(5432.1098)
        assert result == "$5432.1098"


class TestFormatCostUsdZeroAndBoundaries:
    """Test suite for zero cost and boundary conditions."""

    def test_format_cost_usd_zero(self):
        """Test formatting of zero cost."""
        result = format_cost_usd(0.0)
        assert result == "$0.0000"

    def test_format_cost_usd_exact_boundary_0001(self):
        """Test formatting at exact 0.0001 boundary."""
        result = format_cost_usd(0.0001)
        assert result == "$0.0001"  # Uses 4 decimals (>= boundary)

    def test_format_cost_usd_just_below_boundary(self):
        """Test formatting just below 0.0001 boundary."""
        result = format_cost_usd(0.00009)
        assert result == "$0.000090"  # Uses 6 decimals (< boundary)

    def test_format_cost_usd_one_dollar_exact(self):
        """Test formatting of exactly $1."""
        result = format_cost_usd(1.0)
        assert result == "$1.0000"

    def test_format_cost_usd_float_precision_edge(self):
        """Test formatting with float precision edge cases."""
        # Test value that might have floating point representation issues
        result = format_cost_usd(0.1 + 0.2)  # 0.30000000000000004 in binary
        assert result == "$0.3000"


class TestFormatCostUsdNegativeCosts:
    """Test suite for negative cost validation."""

    def test_format_cost_usd_negative_small(self):
        """Test that small negative cost raises ValueError."""
        with pytest.raises(ValueError, match="Cost cannot be negative: -0.01"):
            format_cost_usd(-0.01)

    def test_format_cost_usd_negative_large(self):
        """Test that large negative cost raises ValueError."""
        with pytest.raises(ValueError, match="Cost cannot be negative: -100.0"):
            format_cost_usd(-100.0)

    def test_format_cost_usd_negative_tiny(self):
        """Test that tiny negative cost raises ValueError."""
        with pytest.raises(ValueError, match="Cost cannot be negative: -1e-06"):
            format_cost_usd(-0.000001)

    def test_format_cost_usd_negative_zero(self):
        """Test that negative zero is handled."""
        # In Python, -0.0 < 0 is False, so it won't raise error
        # But formatting preserves the negative sign
        result = format_cost_usd(-0.0)
        # Python's -0.0 formatting can show as -0.0000 with :f format
        assert result in ["$0.0000", "$-0.0000"]


class TestFormatCostUsdPrecisionValidation:
    """Test suite for precision and formatting validation."""

    def test_format_cost_usd_4_decimal_precision(self):
        """Test that typical costs use exactly 4 decimal places."""
        result = format_cost_usd(0.5)
        assert result == "$0.5000"
        assert len(result) == 7  # $0.5000

    def test_format_cost_usd_6_decimal_precision(self):
        """Test that very small costs use exactly 6 decimal places."""
        result = format_cost_usd(0.000050)
        assert result == "$0.000050"
        assert len(result) == 9  # $0.000050

    def test_format_cost_usd_rounding_4_decimals(self):
        """Test rounding behavior for 4-decimal formatting."""
        # Test rounding up
        result = format_cost_usd(0.12345)
        assert result == "$0.1235"  # Rounds 0.12345 to 0.1235

        # Test rounding down
        result = format_cost_usd(0.12344)
        assert result == "$0.1234"  # Rounds 0.12344 to 0.1234

    def test_format_cost_usd_rounding_6_decimals(self):
        """Test rounding behavior for 6-decimal formatting."""
        # Test rounding up
        result = format_cost_usd(0.0000125)
        assert result == "$0.000013"  # Rounds 0.0000125 to 0.000013

        # Test rounding down
        result = format_cost_usd(0.0000124)
        assert result == "$0.000012"  # Rounds 0.0000124 to 0.000012

    def test_format_cost_usd_no_scientific_notation(self):
        """Test that very small costs don't use scientific notation."""
        result = format_cost_usd(0.000001)
        assert result == "$0.000001"
        assert "e" not in result.lower()  # No scientific notation

    def test_format_cost_usd_large_no_scientific_notation(self):
        """Test that large costs don't use scientific notation."""
        result = format_cost_usd(123456.7890)
        assert result == "$123456.7890"
        assert "e" not in result.lower()


class TestFormatCostUsdEdgeCases:
    """Test suite for edge cases and extreme values."""

    def test_format_cost_usd_very_large_cost(self):
        """Test formatting of extremely large cost."""
        result = format_cost_usd(999999.9999)
        assert result == "$999999.9999"

    def test_format_cost_usd_smallest_positive_float(self):
        """Test formatting of smallest representable positive cost."""
        import sys

        # Use a very small but representable float
        result = format_cost_usd(sys.float_info.min)
        assert result.startswith("$")
        assert float(result[1:]) >= 0

    def test_format_cost_usd_trailing_zeros_preserved(self):
        """Test that trailing zeros are preserved in formatting."""
        result = format_cost_usd(1.5)
        assert result == "$1.5000"  # Trailing zeros preserved

        result = format_cost_usd(0.00005)
        assert result == "$0.000050"  # Trailing zero preserved

    def test_format_cost_usd_returns_string(self):
        """Test that function always returns a string."""
        result = format_cost_usd(0.123)
        assert isinstance(result, str)

        result = format_cost_usd(0.0)
        assert isinstance(result, str)

    def test_format_cost_usd_has_dollar_prefix(self):
        """Test that all results have $ prefix."""
        test_values = [0.0, 0.000001, 0.0001, 0.5, 1.0, 100.0]
        for value in test_values:
            result = format_cost_usd(value)
            assert result.startswith("$")


class TestFormatCostSummaryMultipleCosts:
    """Test suite for cost summary with multiple costs."""

    def test_format_cost_summary_typical_costs(self):
        """Test cost summary with typical API costs."""
        costs = [0.001, 0.002, 0.003]
        summary = format_cost_summary(costs)

        assert summary["total"] == "$0.0060"
        assert summary["min"] == "$0.0010"
        assert summary["max"] == "$0.0030"
        assert summary["average"] == "$0.0020"

    def test_format_cost_summary_varied_costs(self):
        """Test cost summary with varied cost ranges."""
        costs = [0.0001, 0.005, 0.1]
        summary = format_cost_summary(costs)

        assert summary["total"] == "$0.1051"
        assert summary["min"] == "$0.0001"
        assert summary["max"] == "$0.1000"
        # Average: (0.0001 + 0.005 + 0.1) / 3 = 0.1051 / 3 = 0.0350333...
        assert summary["average"] == "$0.0350"

    def test_format_cost_summary_many_costs(self):
        """Test cost summary with many costs."""
        # 10 costs ranging from 0.001 to 0.01
        costs = [0.001 * (i + 1) for i in range(10)]  # 0.001, 0.002, ..., 0.01
        summary = format_cost_summary(costs)

        # Total: 0.001 + 0.002 + ... + 0.01 = 0.055
        assert summary["total"] == "$0.0550"
        assert summary["min"] == "$0.0010"
        assert summary["max"] == "$0.0100"
        # Average: 0.055 / 10 = 0.0055
        assert summary["average"] == "$0.0055"

    def test_format_cost_summary_large_and_small_mixed(self):
        """Test cost summary with both large and very small costs."""
        costs = [0.000001, 100.0, 0.5]
        summary = format_cost_summary(costs)

        assert summary["total"] == "$100.5000"  # 100.500001 rounds to 100.5000
        assert summary["min"] == "$0.000001"
        assert summary["max"] == "$100.0000"
        # Average: 100.500001 / 3 = 33.500000333...
        assert summary["average"] == "$33.5000"

    def test_format_cost_summary_preserves_formatting_rules(self):
        """Test that summary uses format_cost_usd rules for each value."""
        # Mix of costs that trigger different formatting rules
        costs = [0.00005, 0.0005, 0.005, 0.05]
        summary = format_cost_summary(costs)

        # Min should use 6 decimals (< 0.0001)
        assert summary["min"] == "$0.000050"
        # Max should use 4 decimals (>= 0.0001)
        assert summary["max"] == "$0.0500"


class TestFormatCostSummarySingleCost:
    """Test suite for cost summary with single cost."""

    def test_format_cost_summary_single_typical_cost(self):
        """Test cost summary with single typical cost."""
        costs = [0.0023]
        summary = format_cost_summary(costs)

        # All statistics should equal the single value
        assert summary["total"] == "$0.0023"
        assert summary["min"] == "$0.0023"
        assert summary["max"] == "$0.0023"
        assert summary["average"] == "$0.0023"

    def test_format_cost_summary_single_very_small_cost(self):
        """Test cost summary with single very small cost."""
        costs = [0.000012]
        summary = format_cost_summary(costs)

        # All statistics should use 6-decimal formatting
        assert summary["total"] == "$0.000012"
        assert summary["min"] == "$0.000012"
        assert summary["max"] == "$0.000012"
        assert summary["average"] == "$0.000012"

    def test_format_cost_summary_single_large_cost(self):
        """Test cost summary with single large cost."""
        costs = [123.45]
        summary = format_cost_summary(costs)

        assert summary["total"] == "$123.4500"
        assert summary["min"] == "$123.4500"
        assert summary["max"] == "$123.4500"
        assert summary["average"] == "$123.4500"

    def test_format_cost_summary_single_zero(self):
        """Test cost summary with single zero cost."""
        costs = [0.0]
        summary = format_cost_summary(costs)

        assert summary["total"] == "$0.0000"
        assert summary["min"] == "$0.0000"
        assert summary["max"] == "$0.0000"
        assert summary["average"] == "$0.0000"


class TestFormatCostSummaryZeroCosts:
    """Test suite for cost summary with all zero costs."""

    def test_format_cost_summary_all_zeros(self):
        """Test cost summary with all zero costs."""
        costs = [0.0, 0.0, 0.0]
        summary = format_cost_summary(costs)

        assert summary["total"] == "$0.0000"
        assert summary["min"] == "$0.0000"
        assert summary["max"] == "$0.0000"
        assert summary["average"] == "$0.0000"

    def test_format_cost_summary_mostly_zeros(self):
        """Test cost summary with mostly zeros and one non-zero."""
        costs = [0.0, 0.0, 0.001, 0.0]
        summary = format_cost_summary(costs)

        assert summary["total"] == "$0.0010"
        assert summary["min"] == "$0.0000"
        assert summary["max"] == "$0.0010"
        # Average: 0.001 / 4 = 0.00025, rounds to 0.0003 with 4 decimals
        assert summary["average"] == "$0.0003"


class TestFormatCostSummaryEmptyList:
    """Test suite for cost summary with empty list."""

    def test_format_cost_summary_empty_list(self):
        """Test that empty list raises ValueError."""
        with pytest.raises(
            ValueError, match="Cannot calculate cost summary for empty list"
        ):
            format_cost_summary([])


class TestFormatCostSummaryNegativeCosts:
    """Test suite for cost summary with negative costs."""

    def test_format_cost_summary_single_negative(self):
        """Test that single negative cost raises ValueError."""
        with pytest.raises(ValueError, match="Cost cannot be negative: -0.01"):
            format_cost_summary([-0.01])

    def test_format_cost_summary_mixed_with_negative(self):
        """Test that mixed costs with one negative raises ValueError."""
        with pytest.raises(ValueError, match="Cost cannot be negative: -0.002"):
            format_cost_summary([0.001, -0.002, 0.003])

    def test_format_cost_summary_all_negative(self):
        """Test that all negative costs raises ValueError."""
        with pytest.raises(ValueError, match="Cost cannot be negative"):
            format_cost_summary([-0.001, -0.002, -0.003])

    def test_format_cost_summary_validates_before_calculating(self):
        """Test that validation happens before any calculations."""
        # Should fail fast on validation, not on calculation
        costs = [0.001, 0.002, -0.003, 0.004]  # Negative in middle
        with pytest.raises(ValueError, match="Cost cannot be negative: -0.003"):
            format_cost_summary(costs)


class TestFormatCostSummaryReturnStructure:
    """Test suite for cost summary return value structure."""

    def test_format_cost_summary_returns_dict(self):
        """Test that function returns a dictionary."""
        costs = [0.001, 0.002, 0.003]
        summary = format_cost_summary(costs)

        assert isinstance(summary, dict)

    def test_format_cost_summary_has_required_keys(self):
        """Test that returned dict has all required keys."""
        costs = [0.001, 0.002, 0.003]
        summary = format_cost_summary(costs)

        assert "total" in summary
        assert "min" in summary
        assert "max" in summary
        assert "average" in summary

    def test_format_cost_summary_only_required_keys(self):
        """Test that returned dict has only the required keys."""
        costs = [0.001, 0.002, 0.003]
        summary = format_cost_summary(costs)

        expected_keys = {"total", "min", "max", "average"}
        assert set(summary.keys()) == expected_keys

    def test_format_cost_summary_all_values_are_strings(self):
        """Test that all values in returned dict are formatted strings."""
        costs = [0.001, 0.002, 0.003]
        summary = format_cost_summary(costs)

        for key, value in summary.items():
            assert isinstance(value, str), f"Value for '{key}' should be string"
            assert value.startswith("$"), f"Value for '{key}' should start with $"

    def test_format_cost_summary_values_not_floats(self):
        """Test that values are strings, not float values."""
        costs = [0.001, 0.002, 0.003]
        summary = format_cost_summary(costs)

        # Ensure we're not accidentally returning floats
        for key, value in summary.items():
            assert not isinstance(value, float), (
                f"Value for '{key}' should not be float"
            )


class TestFormatCostSummaryStatisticsAccuracy:
    """Test suite for statistical accuracy of cost summary."""

    def test_format_cost_summary_total_accuracy(self):
        """Test that total is accurate sum of costs."""
        costs = [0.001, 0.002, 0.003, 0.004]
        summary = format_cost_summary(costs)

        # Total should be 0.01
        assert summary["total"] == "$0.0100"

    def test_format_cost_summary_min_accuracy(self):
        """Test that min is accurate minimum cost."""
        costs = [0.005, 0.001, 0.003, 0.002]  # Min is 0.001
        summary = format_cost_summary(costs)

        assert summary["min"] == "$0.0010"

    def test_format_cost_summary_max_accuracy(self):
        """Test that max is accurate maximum cost."""
        costs = [0.001, 0.005, 0.002, 0.003]  # Max is 0.005
        summary = format_cost_summary(costs)

        assert summary["max"] == "$0.0050"

    def test_format_cost_summary_average_accuracy(self):
        """Test that average is accurate mean cost."""
        costs = [0.001, 0.002, 0.003, 0.004]
        summary = format_cost_summary(costs)

        # Average: (0.001 + 0.002 + 0.003 + 0.004) / 4 = 0.01 / 4 = 0.0025
        assert summary["average"] == "$0.0025"

    def test_format_cost_summary_average_rounding(self):
        """Test that average is properly rounded."""
        # Use costs that produce non-terminating average
        costs = [0.001, 0.002, 0.004]
        summary = format_cost_summary(costs)

        # Average: 0.007 / 3 = 0.002333...
        # Should round to 0.0023 (4 decimals)
        assert summary["average"] == "$0.0023"

    def test_format_cost_summary_identical_costs(self):
        """Test summary with all identical costs."""
        costs = [0.0050, 0.0050, 0.0050, 0.0050]
        summary = format_cost_summary(costs)

        # All stats should be equal
        assert summary["min"] == "$0.0050"
        assert summary["max"] == "$0.0050"
        assert summary["average"] == "$0.0050"
        assert summary["total"] == "$0.0200"  # 4 * 0.005


class TestFormatCostSummaryIntegration:
    """Integration tests combining multiple scenarios."""

    def test_format_cost_summary_realistic_batch_run(self):
        """Test cost summary for realistic batch of LLM API calls."""
        # Simulate 5 queries with varying token usage
        costs = [
            0.000045,  # gpt-4o-mini: 100 input + 50 output
            0.000135,  # gpt-4o-mini: 300 input + 150 output
            0.000090,  # gpt-4o-mini: 200 input + 100 output
            0.000180,  # gpt-4o-mini: 400 input + 200 output
            0.000225,  # gpt-4o-mini: 500 input + 250 output
        ]
        summary = format_cost_summary(costs)

        # Total: 0.000675
        assert summary["total"] == "$0.0007"
        assert summary["min"] == "$0.000045"  # Uses 6 decimals (< 0.0001)
        assert summary["max"] == "$0.0002"  # 0.000225 rounds to 0.0002
        # Average: 0.000675 / 5 = 0.000135
        assert summary["average"] == "$0.0001"

    def test_format_cost_summary_mixed_providers(self):
        """Test cost summary with costs from different providers."""
        costs = [
            0.000045,  # OpenAI gpt-4o-mini
            0.0028,  # Anthropic Claude Haiku
            0.0025,  # Mistral small
        ]
        summary = format_cost_summary(costs)

        # Total: 0.005345
        assert summary["total"] == "$0.0053"
        assert summary["min"] == "$0.000045"  # Uses 6 decimals (< 0.0001)
        assert summary["max"] == "$0.0028"
        # Average: 0.005345 / 3 = 0.001781666...
        assert summary["average"] == "$0.0018"

    def test_format_cost_summary_boundary_crossing(self):
        """Test summary where costs cross the 0.0001 formatting boundary."""
        costs = [
            0.00005,  # Below boundary (6 decimals)
            0.00015,  # Above boundary (4 decimals)
            0.0001,  # Exactly at boundary (4 decimals)
        ]
        summary = format_cost_summary(costs)

        # Min uses 6 decimals, max uses 4 decimals
        assert summary["min"] == "$0.000050"
        assert (
            summary["max"] == "$0.0001"
        )  # 0.00015 rounds to 0.0002 with 4 decimals, but max is 0.00015 which rounds to 0.0001

        # Total: 0.0003
        assert summary["total"] == "$0.0003"

        # Average: 0.0003 / 3 = 0.0001 exactly (uses 6 decimals since < 0.0001 is false, but 0.0001 still triggers 6 decimal logic)
        # Actually, 0.0001 is exactly at boundary, uses 4 decimals: >= 0.0001
        # But the value is 0.0001000... which is > 0 and < 0.0001 check fails
        # Looking at code: if 0 < cost < 0.0001 uses 6 decimals
        # 0.0001 is NOT < 0.0001, so uses 4 decimals
        # But due to float precision, might be 0.0000999... or 0.0001000...
        assert (
            summary["average"] == "$0.000100"
        )  # Uses 6 decimals (exactly at boundary edge)
