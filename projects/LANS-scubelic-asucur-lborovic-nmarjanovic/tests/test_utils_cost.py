"""
Tests for utils.cost module.

Tests cover:
- Cost calculation accuracy for all supported providers and models
- Handling of missing pricing data (returns 0.0 with warning)
- Edge cases (zero tokens, missing token fields, large token counts)
- Proper rounding to 6 decimal places
- Logging behavior (warnings when pricing unavailable)
"""

import logging

import pytest

from llm_answer_watcher.utils.cost import PRICING, estimate_cost


class TestEstimateCostOpenAI:
    """Test suite for OpenAI cost calculations."""

    def test_estimate_cost_gpt4o_mini(self):
        """Test cost calculation for gpt-4o-mini."""
        usage = {"prompt_tokens": 100, "completion_tokens": 50}
        cost = estimate_cost("openai", "gpt-4o-mini", usage)

        # Calculate expected cost
        # Input: 100 * ($0.15 / 1M) = 100 * 0.00000015 = 0.000015
        # Output: 50 * ($0.60 / 1M) = 50 * 0.0000006 = 0.000030
        # Total: 0.000045
        expected = 0.000045

        assert cost == expected

    def test_estimate_cost_gpt4o(self):
        """Test cost calculation for gpt-4o."""
        usage = {"prompt_tokens": 1000, "completion_tokens": 500}
        cost = estimate_cost("openai", "gpt-4o", usage)

        # Calculate expected cost
        # Input: 1000 * ($2.50 / 1M) = 1000 * 0.0000025 = 0.0025
        # Output: 500 * ($10.00 / 1M) = 500 * 0.00001 = 0.005
        # Total: 0.0075
        expected = 0.0075

        assert cost == expected

    def test_estimate_cost_gpt4_turbo(self):
        """Test cost calculation for gpt-4-turbo."""
        usage = {"prompt_tokens": 500, "completion_tokens": 250}
        cost = estimate_cost("openai", "gpt-4-turbo", usage)

        # Input: 500 * ($10.00 / 1M) = 0.005
        # Output: 250 * ($30.00 / 1M) = 0.0075
        # Total: 0.0125
        expected = 0.0125

        assert cost == expected

    def test_estimate_cost_gpt4(self):
        """Test cost calculation for gpt-4 (most expensive)."""
        usage = {"prompt_tokens": 100, "completion_tokens": 100}
        cost = estimate_cost("openai", "gpt-4", usage)

        # Input: 100 * ($30.00 / 1M) = 0.003
        # Output: 100 * ($60.00 / 1M) = 0.006
        # Total: 0.009
        expected = 0.009

        assert cost == expected

    def test_estimate_cost_gpt35_turbo(self):
        """Test cost calculation for gpt-3.5-turbo (cheapest)."""
        usage = {"prompt_tokens": 1000, "completion_tokens": 500}
        cost = estimate_cost("openai", "gpt-3.5-turbo", usage)

        # Input: 1000 * ($0.50 / 1M) = 0.0005
        # Output: 500 * ($1.50 / 1M) = 0.00075
        # Total: 0.00125
        expected = 0.00125

        assert cost == expected


class TestEstimateCostAnthropic:
    """Test suite for Anthropic cost calculations."""

    def test_estimate_cost_claude_haiku(self):
        """Test cost calculation for claude-3-5-haiku-20241022."""
        usage = {"prompt_tokens": 1000, "completion_tokens": 500}
        cost = estimate_cost("anthropic", "claude-3-5-haiku-20241022", usage)

        # Input: 1000 * ($0.80 / 1M) = 0.0008
        # Output: 500 * ($4.00 / 1M) = 0.002
        # Total: 0.0028
        expected = 0.002800

        assert cost == expected

    def test_estimate_cost_claude_sonnet(self):
        """Test cost calculation for claude-3-5-sonnet-20241022."""
        usage = {"prompt_tokens": 1000, "completion_tokens": 500}
        cost = estimate_cost("anthropic", "claude-3-5-sonnet-20241022", usage)

        # Input: 1000 * ($3.00 / 1M) = 0.003
        # Output: 500 * ($15.00 / 1M) = 0.0075
        # Total: 0.0105
        expected = 0.0105

        assert cost == expected

    def test_estimate_cost_claude_opus(self):
        """Test cost calculation for claude-3-opus-20240229."""
        usage = {"prompt_tokens": 1000, "completion_tokens": 500}
        cost = estimate_cost("anthropic", "claude-3-opus-20240229", usage)

        # Input: 1000 * ($15.00 / 1M) = 0.015
        # Output: 500 * ($75.00 / 1M) = 0.0375
        # Total: 0.0525
        expected = 0.0525

        assert cost == expected


class TestEstimateCostMistral:
    """Test suite for Mistral cost calculations."""

    def test_estimate_cost_mistral_large(self):
        """Test cost calculation for mistral-large-latest."""
        usage = {"prompt_tokens": 1000, "completion_tokens": 500}
        cost = estimate_cost("mistral", "mistral-large-latest", usage)

        # Input: 1000 * ($2.00 / 1M) = 0.002
        # Output: 500 * ($6.00 / 1M) = 0.003
        # Total: 0.005
        expected = 0.005

        assert cost == expected

    def test_estimate_cost_mistral_small(self):
        """Test cost calculation for mistral-small-latest."""
        usage = {"prompt_tokens": 5000, "completion_tokens": 2500}
        cost = estimate_cost("mistral", "mistral-small-latest", usage)

        # Input: 5000 * ($0.20 / 1M) = 0.001
        # Output: 2500 * ($0.60 / 1M) = 0.0015
        # Total: 0.0025
        expected = 0.0025

        assert cost == expected

    def test_estimate_cost_codestral(self):
        """Test cost calculation for codestral-latest."""
        usage = {"prompt_tokens": 2000, "completion_tokens": 1000}
        cost = estimate_cost("mistral", "codestral-latest", usage)

        # Input: 2000 * ($0.20 / 1M) = 0.0004
        # Output: 1000 * ($0.60 / 1M) = 0.0006
        # Total: 0.001
        expected = 0.001

        assert cost == expected


class TestEstimateCostEdgeCases:
    """Test suite for edge cases and special scenarios."""

    def test_estimate_cost_zero_tokens(self):
        """Test cost calculation with zero tokens."""
        usage = {"prompt_tokens": 0, "completion_tokens": 0}
        cost = estimate_cost("openai", "gpt-4o-mini", usage)

        assert cost == 0.0

    def test_estimate_cost_only_input_tokens(self):
        """Test cost calculation with only input tokens."""
        usage = {"prompt_tokens": 1000, "completion_tokens": 0}
        cost = estimate_cost("openai", "gpt-4o-mini", usage)

        # Input: 1000 * ($0.15 / 1M) = 0.00015
        # Output: 0
        expected = 0.00015

        assert cost == expected

    def test_estimate_cost_only_output_tokens(self):
        """Test cost calculation with only output tokens."""
        usage = {"prompt_tokens": 0, "completion_tokens": 1000}
        cost = estimate_cost("openai", "gpt-4o-mini", usage)

        # Input: 0
        # Output: 1000 * ($0.60 / 1M) = 0.0006
        expected = 0.0006

        assert cost == expected

    def test_estimate_cost_missing_prompt_tokens(self):
        """Test graceful handling of missing prompt_tokens field."""
        usage = {"completion_tokens": 500}  # Missing prompt_tokens
        cost = estimate_cost("openai", "gpt-4o-mini", usage)

        # Should default prompt_tokens to 0
        # Output: 500 * ($0.60 / 1M) = 0.0003
        expected = 0.0003

        assert cost == expected

    def test_estimate_cost_missing_completion_tokens(self):
        """Test graceful handling of missing completion_tokens field."""
        usage = {"prompt_tokens": 500}  # Missing completion_tokens
        cost = estimate_cost("openai", "gpt-4o-mini", usage)

        # Should default completion_tokens to 0
        # Input: 500 * ($0.15 / 1M) = 0.000075
        expected = 0.000075

        assert cost == expected

    def test_estimate_cost_empty_usage_dict(self):
        """Test handling of empty usage dictionary."""
        usage = {}
        cost = estimate_cost("openai", "gpt-4o-mini", usage)

        # Both tokens default to 0
        assert cost == 0.0

    def test_estimate_cost_large_token_counts(self):
        """Test cost calculation with very large token counts."""
        usage = {"prompt_tokens": 1_000_000, "completion_tokens": 500_000}
        cost = estimate_cost("openai", "gpt-4o-mini", usage)

        # Input: 1M * ($0.15 / 1M) = 0.15
        # Output: 500K * ($0.60 / 1M) = 0.30
        # Total: 0.45
        expected = 0.45

        assert cost == expected

    def test_estimate_cost_rounding_to_6_decimals(self):
        """Test that costs are properly rounded to 6 decimal places."""
        # Use token counts that would produce more than 6 decimal places
        usage = {"prompt_tokens": 1, "completion_tokens": 1}
        cost = estimate_cost("openai", "gpt-4o-mini", usage)

        # Input: 1 * 0.00000015 = 0.00000015
        # Output: 1 * 0.0000006 = 0.0000006
        # Total: 0.00000075
        # Rounded to 6 decimals: 0.000001
        expected = 0.000001

        assert cost == expected

        # Verify it's actually rounded, not truncated
        assert isinstance(cost, float)
        assert len(str(cost).split(".")[-1]) <= 6  # Max 6 decimal places


class TestEstimateCostUnknownModels:
    """Test suite for unknown providers and models."""

    def test_estimate_cost_unknown_provider(self, caplog):
        """Test handling of unknown provider."""
        caplog.set_level(logging.WARNING)

        usage = {"prompt_tokens": 100, "completion_tokens": 50}
        cost = estimate_cost("unknown_provider", "some-model", usage)

        # Should return 0.0 with warning
        assert cost == 0.0

        # Should log warning
        assert "Pricing unavailable" in caplog.text
        assert "unknown_provider" in caplog.text
        assert "some-model" in caplog.text

    def test_estimate_cost_unknown_model(self, caplog):
        """Test handling of unknown model for known provider."""
        caplog.set_level(logging.WARNING)

        usage = {"prompt_tokens": 100, "completion_tokens": 50}
        cost = estimate_cost("openai", "gpt-unknown-model", usage)

        # Should return 0.0 with warning
        assert cost == 0.0

        # Should log warning
        assert "Pricing unavailable" in caplog.text
        assert "gpt-unknown-model" in caplog.text

    def test_estimate_cost_unknown_logs_available_providers(self, caplog):
        """Test that warning includes list of available providers."""
        caplog.set_level(logging.WARNING)

        usage = {"prompt_tokens": 100, "completion_tokens": 50}
        estimate_cost("gemini", "gemini-pro", usage)

        # Should list available providers
        assert "openai" in caplog.text
        assert "anthropic" in caplog.text
        assert "mistral" in caplog.text


class TestPricingTableStructure:
    """Test suite for PRICING table structure and completeness."""

    def test_pricing_table_has_required_providers(self):
        """Test that PRICING table includes all required providers."""
        required_providers = ["openai", "anthropic", "mistral"]

        for provider in required_providers:
            assert provider in PRICING

    def test_pricing_table_openai_models(self):
        """Test that OpenAI pricing includes expected models."""
        expected_models = [
            "gpt-4o-mini",
            "gpt-4o",
            "gpt-4-turbo",
            "gpt-4",
            "gpt-3.5-turbo",
        ]

        for model in expected_models:
            assert model in PRICING["openai"]

    def test_pricing_table_anthropic_models(self):
        """Test that Anthropic pricing includes expected models."""
        expected_models = [
            "claude-3-5-haiku-20241022",
            "claude-3-5-sonnet-20241022",
            "claude-3-opus-20240229",
        ]

        for model in expected_models:
            assert model in PRICING["anthropic"]

    def test_pricing_table_mistral_models(self):
        """Test that Mistral pricing includes expected models."""
        expected_models = [
            "mistral-large-latest",
            "mistral-small-latest",
            "codestral-latest",
        ]

        for model in expected_models:
            assert model in PRICING["mistral"]

    def test_pricing_table_model_structure(self):
        """Test that each model has 'input' and 'output' pricing."""
        for provider, models in PRICING.items():
            for model, pricing in models.items():
                assert "input" in pricing, f"{provider}/{model} missing 'input' price"
                assert "output" in pricing, f"{provider}/{model} missing 'output' price"
                assert isinstance(pricing["input"], float)
                assert isinstance(pricing["output"], float)
                assert pricing["input"] > 0
                assert pricing["output"] > 0

    def test_pricing_table_reasonable_prices(self):
        """Test that pricing values are in reasonable range."""
        # Prices should be small (per-token) but not zero
        for provider, models in PRICING.items():
            for model, pricing in models.items():
                # Input price should be between $0.0001 and $100 per 1M tokens
                assert 0.0001 / 1_000_000 <= pricing["input"] <= 100.0 / 1_000_000
                # Output price should be between $0.0001 and $100 per 1M tokens
                assert 0.0001 / 1_000_000 <= pricing["output"] <= 100.0 / 1_000_000


class TestEstimateCostSecurity:
    """Test suite for security-related behavior."""

    def test_estimate_cost_never_logs_sensitive_data(self, caplog):
        """Test that estimate_cost never logs API keys or sensitive data."""
        caplog.set_level(logging.DEBUG)

        # Even with unknown provider, should only log provider/model names
        usage = {"prompt_tokens": 100, "completion_tokens": 50}
        estimate_cost("openai", "gpt-4o-mini", usage)

        # Should not contain any fake API key patterns
        assert "sk-" not in caplog.text
        assert "key" not in caplog.text.lower() or "Available providers" in caplog.text

    def test_estimate_cost_warning_no_api_keys(self, caplog):
        """Test that warnings don't accidentally include API keys."""
        caplog.set_level(logging.WARNING)

        # Pass usage dict that might look like it has a key (it shouldn't be logged)
        usage = {"prompt_tokens": 100, "completion_tokens": 50, "api_key": "sk-secret"}
        estimate_cost("unknown", "model", usage)

        # Should log warning about pricing
        assert "Pricing unavailable" in caplog.text

        # Should NOT log any key-like strings
        assert "sk-secret" not in caplog.text


class TestEstimateCostIntegration:
    """Integration tests combining multiple scenarios."""

    def test_estimate_cost_multiple_providers_same_usage(self):
        """Test cost differences across providers for same usage."""
        usage = {"prompt_tokens": 1000, "completion_tokens": 500}

        cost_gpt4o_mini = estimate_cost("openai", "gpt-4o-mini", usage)
        cost_claude_haiku = estimate_cost(
            "anthropic", "claude-3-5-haiku-20241022", usage
        )
        cost_mistral_small = estimate_cost("mistral", "mistral-small-latest", usage)

        # All should be positive
        assert cost_gpt4o_mini > 0
        assert cost_claude_haiku > 0
        assert cost_mistral_small > 0

        # They should all be different (different pricing)
        assert cost_gpt4o_mini != cost_claude_haiku
        assert cost_gpt4o_mini != cost_mistral_small

    def test_estimate_cost_batch_calculation(self):
        """Test calculating costs for multiple requests."""
        requests = [
            {"prompt_tokens": 100, "completion_tokens": 50},
            {"prompt_tokens": 200, "completion_tokens": 100},
            {"prompt_tokens": 150, "completion_tokens": 75},
        ]

        total_cost = sum(
            estimate_cost("openai", "gpt-4o-mini", usage) for usage in requests
        )

        # Total should be sum of individual costs
        # Request 1: (100 * 0.15 + 50 * 0.60) / 1M = 0.000045
        # Request 2: (200 * 0.15 + 100 * 0.60) / 1M = 0.000090
        # Request 3: (150 * 0.15 + 75 * 0.60) / 1M = 0.000068
        # Total: 0.000203
        expected = 0.000203

        assert abs(total_cost - expected) < 0.000001  # Allow for rounding


class TestCalculateWebSearchCost:
    """Test suite for calculate_web_search_cost() function."""

    def test_web_search_standard_cost(self):
        """Test standard web search cost calculation."""
        from llm_answer_watcher.utils.cost import calculate_web_search_cost

        # 2 web searches at standard rate ($10/1k)
        result = calculate_web_search_cost(
            provider="openai",
            model="gpt-4o",
            web_search_count=2,
            web_search_version="web_search",
        )

        # Tool call cost: (2 / 1000) * $10 = $0.02
        assert result["tool_call_cost_usd"] == 0.02
        assert result["content_cost_usd"] == 0.0  # Included in token usage
        assert result["total_cost_usd"] == 0.02

    def test_web_search_gpt4o_mini_fixed_tokens(self):
        """Test gpt-4o-mini web search with fixed 8k tokens."""
        from llm_answer_watcher.utils.cost import calculate_web_search_cost

        # 1 web search for gpt-4o-mini
        result = calculate_web_search_cost(
            provider="openai",
            model="gpt-4o-mini",
            web_search_count=1,
            web_search_version="web_search_gpt4o_mini",
        )

        # Tool call cost: (1 / 1000) * $10 = $0.01
        # Content cost: 8000 tokens * ($0.15/1M) = $0.0012
        expected_tool = 0.01
        expected_content = 8000 * (0.15 / 1_000_000)
        expected_total = expected_tool + expected_content

        assert result["tool_call_cost_usd"] == expected_tool
        assert result["content_cost_usd"] == pytest.approx(
            expected_content, abs=0.000001
        )
        assert result["fixed_tokens"] == 8000
        assert result["total_cost_usd"] == pytest.approx(expected_total, abs=0.000001)

    def test_web_search_preview_reasoning(self):
        """Test preview reasoning model web search cost."""
        from llm_answer_watcher.utils.cost import calculate_web_search_cost

        # 3 web searches for o1 model
        result = calculate_web_search_cost(
            provider="openai",
            model="o1-preview",
            web_search_count=3,
            web_search_version="web_search_preview_reasoning",
        )

        # Tool call cost: (3 / 1000) * $10 = $0.03
        assert result["tool_call_cost_usd"] == 0.03
        assert result["content_cost_usd"] == 0.0  # Included in token usage
        assert result["total_cost_usd"] == 0.03

    def test_web_search_preview_non_reasoning_free_content(self):
        """Test preview non-reasoning with FREE content tokens."""
        from llm_answer_watcher.utils.cost import calculate_web_search_cost

        # 1 web search with free content
        result = calculate_web_search_cost(
            provider="openai",
            model="gpt-4o",
            web_search_count=1,
            web_search_version="web_search_preview_non_reasoning",
        )

        # Tool call cost: (1 / 1000) * $25 = $0.025
        # Content cost: FREE
        assert result["tool_call_cost_usd"] == 0.025
        assert result["content_cost_usd"] == 0.0
        assert result["total_cost_usd"] == 0.025

    def test_web_search_zero_searches(self):
        """Test zero web searches returns zero cost."""
        from llm_answer_watcher.utils.cost import calculate_web_search_cost

        result = calculate_web_search_cost(
            provider="openai",
            model="gpt-4o",
            web_search_count=0,
            web_search_version="web_search",
        )

        assert result["tool_call_cost_usd"] == 0.0
        assert result["content_cost_usd"] == 0.0
        assert result["total_cost_usd"] == 0.0

    def test_web_search_non_openai_provider(self):
        """Test error when provider is not OpenAI."""
        from llm_answer_watcher.utils.cost import calculate_web_search_cost

        with pytest.raises(ValueError) as exc_info:
            calculate_web_search_cost(
                provider="anthropic",
                model="claude-3-5-sonnet",
                web_search_count=1,
                web_search_version="web_search",
            )

        assert "openai" in str(exc_info.value).lower()

    def test_web_search_negative_count(self):
        """Test error when web_search_count is negative."""
        from llm_answer_watcher.utils.cost import calculate_web_search_cost

        with pytest.raises(ValueError) as exc_info:
            calculate_web_search_cost(
                provider="openai",
                model="gpt-4o",
                web_search_count=-1,
                web_search_version="web_search",
            )

        assert "must be >= 0" in str(exc_info.value)


class TestDetectWebSearchVersion:
    """Test suite for detect_web_search_version() function."""

    def test_detect_gpt4o_mini(self):
        """Test detection for gpt-4o-mini model."""
        from llm_answer_watcher.utils.cost import detect_web_search_version

        version = detect_web_search_version("gpt-4o-mini")
        assert version == "web_search_gpt4o_mini"

    def test_detect_gpt41_mini(self):
        """Test detection for gpt-4.1-mini model."""
        from llm_answer_watcher.utils.cost import detect_web_search_version

        version = detect_web_search_version("gpt-4.1-mini")
        assert version == "web_search_gpt4o_mini"

    def test_detect_reasoning_model_preview(self):
        """Test detection for reasoning models with preview."""
        from llm_answer_watcher.utils.cost import detect_web_search_version

        version = detect_web_search_version("o1-preview", tool_version="preview")
        assert version == "web_search_preview_reasoning"

        version = detect_web_search_version("o3-mini", tool_version="preview")
        assert version == "web_search_preview_reasoning"

    def test_detect_non_reasoning_preview(self):
        """Test detection for non-reasoning models with preview."""
        from llm_answer_watcher.utils.cost import detect_web_search_version

        version = detect_web_search_version("gpt-4o", tool_version="preview")
        assert version == "web_search_preview_non_reasoning"

    def test_detect_standard(self):
        """Test detection for standard web search."""
        from llm_answer_watcher.utils.cost import detect_web_search_version

        version = detect_web_search_version("gpt-4o")
        assert version == "web_search"

        version = detect_web_search_version("gpt-4-turbo")
        assert version == "web_search"


class TestEstimateCostWithDynamicPricing:
    """Test suite for estimate_cost_with_dynamic_pricing() function."""

    def test_cost_breakdown_without_web_search(self):
        """Test cost breakdown for standard query without web search."""
        from llm_answer_watcher.utils.cost import estimate_cost_with_dynamic_pricing

        usage = {"prompt_tokens": 100, "completion_tokens": 50}

        breakdown = estimate_cost_with_dynamic_pricing(
            provider="openai",
            model="gpt-4o-mini",
            usage_meta=usage,
            web_search_count=0,
            use_dynamic_pricing=False,  # Use fallback
        )

        # Should have token cost, no web search cost
        assert breakdown["token_cost_usd"] > 0
        assert breakdown["web_search_tool_cost_usd"] == 0.0
        assert breakdown["web_search_content_cost_usd"] == 0.0
        assert breakdown["total_cost_usd"] == breakdown["token_cost_usd"]
        assert breakdown["pricing_source"] in ["fallback", "remote", "cache"]

    def test_cost_breakdown_with_web_search(self):
        """Test cost breakdown including web search."""
        from llm_answer_watcher.utils.cost import estimate_cost_with_dynamic_pricing

        usage = {"prompt_tokens": 100, "completion_tokens": 50}

        breakdown = estimate_cost_with_dynamic_pricing(
            provider="openai",
            model="gpt-4o",
            usage_meta=usage,
            web_search_count=2,
            web_search_version="web_search",
            use_dynamic_pricing=False,  # Use fallback
        )

        # Should have both token and web search costs
        assert breakdown["token_cost_usd"] > 0
        assert breakdown["web_search_tool_cost_usd"] > 0
        assert breakdown["total_cost_usd"] == (
            breakdown["token_cost_usd"]
            + breakdown["web_search_tool_cost_usd"]
            + breakdown["web_search_content_cost_usd"]
        )

    def test_cost_breakdown_gpt4o_mini_web_search(self):
        """Test cost breakdown for gpt-4o-mini with web search."""
        from llm_answer_watcher.utils.cost import estimate_cost_with_dynamic_pricing

        usage = {"prompt_tokens": 100, "completion_tokens": 50}

        breakdown = estimate_cost_with_dynamic_pricing(
            provider="openai",
            model="gpt-4o-mini",
            usage_meta=usage,
            web_search_count=1,
            web_search_version="web_search_gpt4o_mini",
            use_dynamic_pricing=False,  # Use fallback
        )

        # Should have token cost, tool cost, and content cost (8k fixed tokens)
        assert breakdown["token_cost_usd"] > 0
        assert breakdown["web_search_tool_cost_usd"] == 0.01  # $10/1k for 1 call
        assert breakdown["web_search_content_cost_usd"] > 0  # 8k tokens
        assert (
            breakdown["total_cost_usd"]
            == breakdown["token_cost_usd"]
            + breakdown["web_search_tool_cost_usd"]
            + breakdown["web_search_content_cost_usd"]
        )
