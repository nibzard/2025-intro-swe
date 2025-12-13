"""
Tests for utils.pricing module.

Tests cover:
- Loading pricing from remote source (llm-prices.com)
- Caching mechanism (24-hour cache)
- Local overrides for custom pricing
- Fallback to hardcoded pricing
- Model pricing lookup with fuzzy matching
- Tool pricing lookup
- Refresh pricing functionality
- List available models
"""

import json
from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import pytest

from llm_answer_watcher.utils.pricing import (
    PricingNotAvailableError,
    get_pricing,
    get_tool_pricing,
    list_available_models,
    refresh_pricing,
)


class TestGetPricing:
    """Test suite for get_pricing() function."""

    def test_get_pricing_from_remote(self, tmp_path, monkeypatch):
        """Test loading pricing from remote source."""
        # Mock the cache and override files to not exist
        monkeypatch.setattr(
            "llm_answer_watcher.utils.pricing.CACHE_FILE", tmp_path / "cache.json"
        )
        monkeypatch.setattr(
            "llm_answer_watcher.utils.pricing.OVERRIDES_FILE",
            tmp_path / "overrides.json",
        )

        # Mock remote fetch
        mock_data = {
            "updated_at": "2025-11-04",
            "prices": [
                {
                    "id": "gpt-4o-mini",
                    "vendor": "openai",
                    "name": "GPT-4o Mini",
                    "input": 0.15,
                    "output": 0.60,
                    "input_cached": 0.075,
                }
            ],
        }

        with patch(
            "llm_answer_watcher.utils.pricing._fetch_remote_pricing",
            return_value=mock_data,
        ):
            pricing = get_pricing("openai", "gpt-4o-mini", use_cache=False)

        assert pricing.provider == "openai"
        assert pricing.model == "gpt-4o-mini"
        assert pricing.input == 0.15
        assert pricing.output == 0.60
        assert pricing.input_cached == 0.075
        assert pricing.source == "remote"

    def test_get_pricing_from_cache(self, tmp_path, monkeypatch):
        """Test loading pricing from cache."""
        cache_file = tmp_path / "cache.json"
        cache_file.parent.mkdir(parents=True, exist_ok=True)

        # Create fresh cache (within 24 hours)
        cache_data = {
            "cached_at": datetime.now(UTC).isoformat(),
            "updated_at": "2025-11-04",
            "prices": [
                {
                    "id": "gpt-4o-mini",
                    "vendor": "openai",
                    "name": "GPT-4o Mini",
                    "input": 0.15,
                    "output": 0.60,
                    "input_cached": None,
                }
            ],
        }

        cache_file.write_text(json.dumps(cache_data))

        monkeypatch.setattr("llm_answer_watcher.utils.pricing.CACHE_FILE", cache_file)
        monkeypatch.setattr(
            "llm_answer_watcher.utils.pricing.OVERRIDES_FILE",
            tmp_path / "overrides.json",
        )

        pricing = get_pricing("openai", "gpt-4o-mini", use_cache=True)

        assert pricing.provider == "openai"
        assert pricing.model == "gpt-4o-mini"
        assert pricing.input == 0.15
        assert pricing.output == 0.60
        assert pricing.source == "cache"

    def test_get_pricing_from_overrides(self, tmp_path, monkeypatch):
        """Test loading pricing from local overrides."""
        overrides_file = tmp_path / "overrides.json"
        overrides_file.parent.mkdir(parents=True, exist_ok=True)

        overrides_data = {
            "openai": {
                "gpt-4o-mini": {"input": 0.20, "output": 0.80, "input_cached": 0.10}
            }
        }

        overrides_file.write_text(json.dumps(overrides_data))

        monkeypatch.setattr(
            "llm_answer_watcher.utils.pricing.OVERRIDES_FILE", overrides_file
        )

        pricing = get_pricing("openai", "gpt-4o-mini")

        assert pricing.provider == "openai"
        assert pricing.model == "gpt-4o-mini"
        assert pricing.input == 0.20  # Override value
        assert pricing.output == 0.80  # Override value
        assert pricing.source == "override"

    def test_get_pricing_fallback_to_hardcoded(self, tmp_path, monkeypatch):
        """Test fallback to hardcoded pricing when remote unavailable."""
        monkeypatch.setattr(
            "llm_answer_watcher.utils.pricing.CACHE_FILE", tmp_path / "cache.json"
        )
        monkeypatch.setattr(
            "llm_answer_watcher.utils.pricing.OVERRIDES_FILE",
            tmp_path / "overrides.json",
        )

        # Mock remote fetch to fail
        with patch(
            "llm_answer_watcher.utils.pricing._fetch_remote_pricing",
            side_effect=Exception("Network error"),
        ):
            pricing = get_pricing("openai", "gpt-4o-mini", use_cache=False)

        # Should fall back to hardcoded pricing
        assert pricing.provider == "openai"
        assert pricing.model == "gpt-4o-mini"
        assert pricing.source == "fallback"
        # Hardcoded value: 0.15 / 1M = 0.00000015, converted back to per-million
        assert pricing.input == pytest.approx(0.15, rel=0.01)

    def test_get_pricing_fuzzy_model_match(self, tmp_path, monkeypatch):
        """Test fuzzy matching for model names with dates."""
        cache_file = tmp_path / "cache.json"
        cache_file.parent.mkdir(parents=True, exist_ok=True)

        cache_data = {
            "cached_at": datetime.now(UTC).isoformat(),
            "updated_at": "2025-11-04",
            "prices": [
                {
                    "id": "gpt-4o-mini",
                    "vendor": "openai",
                    "name": "GPT-4o Mini",
                    "input": 0.15,
                    "output": 0.60,
                    "input_cached": None,
                }
            ],
        }

        cache_file.write_text(json.dumps(cache_data))

        monkeypatch.setattr("llm_answer_watcher.utils.pricing.CACHE_FILE", cache_file)
        monkeypatch.setattr(
            "llm_answer_watcher.utils.pricing.OVERRIDES_FILE",
            tmp_path / "overrides.json",
        )

        # Request with date suffix - should match base model
        pricing = get_pricing("openai", "gpt-4o-mini-2024-11-20", use_cache=True)

        assert pricing.model == "gpt-4o-mini-2024-11-20"
        assert pricing.input == 0.15
        assert pricing.source == "cache"

    def test_get_pricing_unavailable_model(self, tmp_path, monkeypatch):
        """Test error when pricing unavailable for model."""
        monkeypatch.setattr(
            "llm_answer_watcher.utils.pricing.CACHE_FILE", tmp_path / "cache.json"
        )
        monkeypatch.setattr(
            "llm_answer_watcher.utils.pricing.OVERRIDES_FILE",
            tmp_path / "overrides.json",
        )

        with patch(
            "llm_answer_watcher.utils.pricing._fetch_remote_pricing",
            side_effect=Exception("Network error"),
        ):
            with pytest.raises(PricingNotAvailableError) as exc_info:
                get_pricing("unknown-provider", "unknown-model", use_cache=False)

        assert "unknown-provider" in str(exc_info.value)
        assert "unknown-model" in str(exc_info.value)

    def test_get_pricing_expired_cache(self, tmp_path, monkeypatch):
        """Test that expired cache triggers remote fetch."""
        cache_file = tmp_path / "cache.json"
        cache_file.parent.mkdir(parents=True, exist_ok=True)

        # Create expired cache (25 hours ago)
        expired_time = datetime.now(UTC) - timedelta(hours=25)
        cache_data = {
            "cached_at": expired_time.isoformat(),
            "updated_at": "2025-11-03",
            "prices": [
                {
                    "id": "gpt-4o-mini",
                    "vendor": "openai",
                    "name": "GPT-4o Mini",
                    "input": 0.10,  # Old price
                    "output": 0.50,
                    "input_cached": None,
                }
            ],
        }

        cache_file.write_text(json.dumps(cache_data))

        monkeypatch.setattr("llm_answer_watcher.utils.pricing.CACHE_FILE", cache_file)
        monkeypatch.setattr(
            "llm_answer_watcher.utils.pricing.OVERRIDES_FILE",
            tmp_path / "overrides.json",
        )

        # Mock remote with new price
        mock_data = {
            "updated_at": "2025-11-04",
            "prices": [
                {
                    "id": "gpt-4o-mini",
                    "vendor": "openai",
                    "name": "GPT-4o Mini",
                    "input": 0.15,  # New price
                    "output": 0.60,
                    "input_cached": None,
                }
            ],
        }

        with patch(
            "llm_answer_watcher.utils.pricing._fetch_remote_pricing",
            return_value=mock_data,
        ):
            pricing = get_pricing("openai", "gpt-4o-mini", use_cache=True)

        # Should use new remote price, not expired cache
        assert pricing.input == 0.15
        assert pricing.source == "remote"


class TestGetToolPricing:
    """Test suite for get_tool_pricing() function."""

    def test_get_tool_pricing_web_search(self, tmp_path, monkeypatch):
        """Test getting web search tool pricing."""
        overrides_file = tmp_path / "overrides.json"
        overrides_file.parent.mkdir(parents=True, exist_ok=True)

        overrides_data = {
            "tools": {
                "web_search": {
                    "cost_per_1k": 10.0,
                    "free_content_tokens": False,
                }
            }
        }

        overrides_file.write_text(json.dumps(overrides_data))

        monkeypatch.setattr(
            "llm_answer_watcher.utils.pricing.OVERRIDES_FILE", overrides_file
        )

        tool_pricing = get_tool_pricing("web_search")

        assert tool_pricing.tool_name == "web_search"
        assert tool_pricing.cost_per_1k == 10.0
        assert tool_pricing.free_content_tokens is False

    def test_get_tool_pricing_unavailable(self, tmp_path, monkeypatch):
        """Test error when tool pricing not configured."""
        monkeypatch.setattr(
            "llm_answer_watcher.utils.pricing.OVERRIDES_FILE",
            tmp_path / "overrides.json",
        )

        with pytest.raises(PricingNotAvailableError) as exc_info:
            get_tool_pricing("unknown_tool")

        assert "unknown_tool" in str(exc_info.value)


class TestRefreshPricing:
    """Test suite for refresh_pricing() function."""

    def test_refresh_pricing_success(self, tmp_path, monkeypatch):
        """Test successful pricing refresh."""
        cache_file = tmp_path / "cache.json"
        cache_file.parent.mkdir(parents=True, exist_ok=True)

        monkeypatch.setattr("llm_answer_watcher.utils.pricing.CACHE_FILE", cache_file)

        mock_data = {
            "updated_at": "2025-11-04",
            "prices": [
                {"id": "gpt-4o", "vendor": "openai", "input": 2.5, "output": 10.0}
            ],
        }

        with patch(
            "llm_answer_watcher.utils.pricing._fetch_remote_pricing",
            return_value=mock_data,
        ):
            result = refresh_pricing(force=True)

        assert result["status"] == "success"
        assert result["model_count"] == 1
        assert result["updated_at"] == "2025-11-04"

    def test_refresh_pricing_skipped_fresh_cache(self, tmp_path, monkeypatch):
        """Test refresh skipped when cache is fresh."""
        cache_file = tmp_path / "cache.json"
        cache_file.parent.mkdir(parents=True, exist_ok=True)

        # Fresh cache
        cache_data = {
            "cached_at": datetime.now(UTC).isoformat(),
            "updated_at": "2025-11-04",
            "prices": [{"id": "gpt-4o", "vendor": "openai"}],
        }

        cache_file.write_text(json.dumps(cache_data))

        monkeypatch.setattr("llm_answer_watcher.utils.pricing.CACHE_FILE", cache_file)

        result = refresh_pricing(force=False)

        assert result["status"] == "skipped"
        assert "fresh" in result["reason"].lower()

    def test_refresh_pricing_network_error(self, tmp_path, monkeypatch):
        """Test refresh handles network errors."""
        monkeypatch.setattr(
            "llm_answer_watcher.utils.pricing.CACHE_FILE", tmp_path / "cache.json"
        )

        with patch(
            "llm_answer_watcher.utils.pricing._fetch_remote_pricing",
            side_effect=Exception("Network timeout"),
        ):
            result = refresh_pricing(force=True)

        assert result["status"] == "error"
        assert "Network timeout" in result["error"]


class TestListAvailableModels:
    """Test suite for list_available_models() function."""

    def test_list_available_models(self, tmp_path, monkeypatch):
        """Test listing all available models."""
        # Setup cache
        cache_file = tmp_path / "cache.json"
        cache_file.parent.mkdir(parents=True, exist_ok=True)

        cache_data = {
            "cached_at": datetime.now(UTC).isoformat(),
            "updated_at": "2025-11-04",
            "prices": [
                {
                    "id": "gpt-4o-mini",
                    "vendor": "openai",
                    "name": "GPT-4o Mini",
                    "input": 0.15,
                    "output": 0.60,
                    "input_cached": 0.075,
                },
                {
                    "id": "claude-3-5-haiku-20241022",
                    "vendor": "anthropic",
                    "name": "Claude 3.5 Haiku",
                    "input": 0.80,
                    "output": 4.00,
                    "input_cached": None,
                },
            ],
        }

        cache_file.write_text(json.dumps(cache_data))

        monkeypatch.setattr("llm_answer_watcher.utils.pricing.CACHE_FILE", cache_file)
        monkeypatch.setattr(
            "llm_answer_watcher.utils.pricing.OVERRIDES_FILE",
            tmp_path / "overrides.json",
        )

        models = list_available_models()

        # Should have at least cached models + fallback models
        assert len(models) >= 2

        # Check structure
        openai_models = [m for m in models if m["provider"] == "openai"]
        assert len(openai_models) >= 1

        model = openai_models[0]
        assert "provider" in model
        assert "model" in model
        assert "input" in model
        assert "output" in model
        assert "source" in model

    def test_list_available_models_with_overrides(self, tmp_path, monkeypatch):
        """Test listing includes override models."""
        overrides_file = tmp_path / "overrides.json"
        overrides_file.parent.mkdir(parents=True, exist_ok=True)

        overrides_data = {
            "openai": {
                "custom-model": {"input": 1.0, "output": 2.0, "input_cached": None}
            }
        }

        overrides_file.write_text(json.dumps(overrides_data))

        monkeypatch.setattr(
            "llm_answer_watcher.utils.pricing.CACHE_FILE", tmp_path / "cache.json"
        )
        monkeypatch.setattr(
            "llm_answer_watcher.utils.pricing.OVERRIDES_FILE", overrides_file
        )

        models = list_available_models()

        override_models = [m for m in models if m["source"] == "override"]
        assert len(override_models) >= 1

        custom = [m for m in override_models if m["model"] == "custom-model"]
        assert len(custom) == 1
        assert custom[0]["input"] == 1.0


class TestCacheExpiration:
    """Test suite for cache expiration logic."""

    def test_cache_fresh_within_24_hours(self, tmp_path, monkeypatch):
        """Test cache is considered fresh within 24 hours."""
        cache_file = tmp_path / "cache.json"
        cache_file.parent.mkdir(parents=True, exist_ok=True)

        # Cache from 12 hours ago
        cache_time = datetime.now(UTC) - timedelta(hours=12)
        cache_data = {
            "cached_at": cache_time.isoformat(),
            "prices": [{"id": "test", "vendor": "openai"}],
        }

        cache_file.write_text(json.dumps(cache_data))

        monkeypatch.setattr("llm_answer_watcher.utils.pricing.CACHE_FILE", cache_file)

        result = refresh_pricing(force=False)

        assert result["status"] == "skipped"

    def test_cache_expired_after_24_hours(self, tmp_path, monkeypatch):
        """Test cache expires after 24 hours."""
        cache_file = tmp_path / "cache.json"
        cache_file.parent.mkdir(parents=True, exist_ok=True)

        # Cache from 25 hours ago
        cache_time = datetime.now(UTC) - timedelta(hours=25)
        cache_data = {
            "cached_at": cache_time.isoformat(),
            "prices": [{"id": "test", "vendor": "openai"}],
        }

        cache_file.write_text(json.dumps(cache_data))

        monkeypatch.setattr("llm_answer_watcher.utils.pricing.CACHE_FILE", cache_file)

        mock_data = {"updated_at": "2025-11-04", "prices": []}

        with patch(
            "llm_answer_watcher.utils.pricing._fetch_remote_pricing",
            return_value=mock_data,
        ):
            result = refresh_pricing(force=False)

        # Should refresh, not skip
        assert result["status"] == "success"
