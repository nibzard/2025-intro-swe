"""
Dynamic pricing loader for LLM Answer Watcher.

This module handles:
- Loading pricing from https://www.llm-prices.com/current-v1.json
- Caching pricing data (24-hour cache)
- Local overrides for custom tools (web search, code interpreter, etc.)
- Fallback to hardcoded pricing if remote unavailable

The pricing system uses a three-tier approach:
1. Remote pricing (llm-prices.com) - Primary source
2. Local overrides (config/pricing_overrides.json) - For tools and custom pricing
3. Cached pricing (config/pricing_cache.json) - 24-hour cache
4. Hardcoded fallback (original PRICING dict) - Last resort

Example:
    >>> from utils.pricing import get_pricing, refresh_pricing
    >>> pricing = get_pricing("openai", "gpt-4o-mini")
    >>> print(f"Input: ${pricing.input}/1M, Output: ${pricing.output}/1M")
    Input: $0.15/1M, Output: $0.6/1M

    >>> # Refresh from remote
    >>> refresh_pricing(force=True)
    >>> pricing = get_pricing("openai", "gpt-4o-mini")
"""

import json
import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import httpx

from llm_answer_watcher.utils.time import utc_now

logger = logging.getLogger(__name__)

# Remote pricing source
PRICING_URL = "https://www.llm-prices.com/current-v1.json"

# Local file paths (relative to project root)
PROJECT_ROOT = Path(__file__).parent.parent.parent
CACHE_FILE = PROJECT_ROOT / "config" / "pricing_cache.json"
OVERRIDES_FILE = PROJECT_ROOT / "config" / "pricing_overrides.json"

# Cache duration (24 hours)
CACHE_DURATION = timedelta(hours=24)

# Provider name mapping (our names -> llm-prices.com vendor names)
PROVIDER_MAPPING = {
    "openai": "openai",
    "anthropic": "anthropic",
    "mistral": "mistral",
    "google": "google",
    "amazon": "amazon",
    "deepseek": "deepseek",
    "xai": "xai",
}


@dataclass
class ModelPricing:
    """Pricing information for a model."""

    provider: str
    model: str
    input: float  # $ per 1M tokens
    output: float  # $ per 1M tokens
    input_cached: float | None = None  # $ per 1M cached input tokens
    source: str = "remote"  # "remote", "override", "cache", or "fallback"


@dataclass
class ToolPricing:
    """Pricing for built-in tools (web search, code interpreter, etc.)."""

    tool_name: str
    cost_per_use: float | None = None  # Fixed cost per use
    cost_per_1k: float | None = None  # Cost per 1,000 calls
    fixed_tokens: int | None = None  # Fixed token count (for gpt-4o-mini web search)
    free_content_tokens: bool = False  # Whether content tokens are free


class PricingNotAvailableError(Exception):
    """Raised when pricing is not available for a model."""

    pass


def get_pricing(provider: str, model: str, use_cache: bool = True) -> ModelPricing:
    """
    Get pricing for a provider/model combination.

    Checks pricing in this order:
    1. Local overrides (config/pricing_overrides.json)
    2. Cached pricing (config/pricing_cache.json) - if less than 24 hours old
    3. Remote pricing (llm-prices.com) - fetches and caches
    4. Fallback hardcoded pricing (from original PRICING dict)

    Args:
        provider: Provider name (e.g., "openai", "anthropic")
        model: Model identifier (e.g., "gpt-4o-mini", "claude-3-5-haiku-20241022")
        use_cache: Whether to use cached pricing (default: True)

    Returns:
        ModelPricing: Pricing information for the model

    Raises:
        PricingNotAvailableError: If pricing is not available from any source

    Example:
        >>> pricing = get_pricing("openai", "gpt-4o-mini")
        >>> cost = (1000 * pricing.input / 1_000_000) + (500 * pricing.output / 1_000_000)
        >>> print(f"Cost for 1000 input + 500 output tokens: ${cost:.6f}")
    """
    # 1. Check local overrides first
    overrides = _load_overrides()
    if provider in overrides and model in overrides[provider]:
        override_data = overrides[provider][model]
        return ModelPricing(
            provider=provider,
            model=model,
            input=override_data["input"],
            output=override_data["output"],
            input_cached=override_data.get("input_cached"),
            source="override",
        )

    # 2. Check cache (if enabled and not expired)
    if use_cache:
        cached = _load_cache()
        if cached and not _is_cache_expired(cached.get("cached_at")):
            prices = cached.get("prices", [])
            vendor = PROVIDER_MAPPING.get(provider.lower())
            if vendor:
                # Try to find exact model match
                for price in prices:
                    if price["vendor"] == vendor and price["id"] == model.lower():
                        return ModelPricing(
                            provider=provider,
                            model=model,
                            input=price["input"],
                            output=price["output"],
                            input_cached=price.get("input_cached"),
                            source="cache",
                        )

                # Try model name variations (e.g., "gpt-4o-mini" vs "gpt-4o-mini-2024-11-20")
                model_base = model.lower().split("-2024")[0].split("-2025")[0]
                for price in prices:
                    price_base = price["id"].split("-2024")[0].split("-2025")[0]
                    if price["vendor"] == vendor and price_base == model_base:
                        logger.info(
                            f"Using approximate model match: {model} -> {price['id']}"
                        )
                        return ModelPricing(
                            provider=provider,
                            model=model,
                            input=price["input"],
                            output=price["output"],
                            input_cached=price.get("input_cached"),
                            source="cache",
                        )

    # 3. Fetch from remote (and cache)
    try:
        logger.info(f"Fetching pricing from remote: {PRICING_URL}")
        remote_data = _fetch_remote_pricing()
        if remote_data:
            # Cache the data
            _save_cache(remote_data)

            # Look up the model
            vendor = PROVIDER_MAPPING.get(provider.lower())
            if vendor:
                prices = remote_data.get("prices", [])
                # Try exact match
                for price in prices:
                    if price["vendor"] == vendor and price["id"] == model.lower():
                        return ModelPricing(
                            provider=provider,
                            model=model,
                            input=price["input"],
                            output=price["output"],
                            input_cached=price.get("input_cached"),
                            source="remote",
                        )

                # Try model name variations
                model_base = model.lower().split("-2024")[0].split("-2025")[0]
                for price in prices:
                    price_base = price["id"].split("-2024")[0].split("-2025")[0]
                    if price["vendor"] == vendor and price_base == model_base:
                        logger.info(
                            f"Using approximate model match: {model} -> {price['id']}"
                        )
                        return ModelPricing(
                            provider=provider,
                            model=model,
                            input=price["input"],
                            output=price["output"],
                            input_cached=price.get("input_cached"),
                            source="remote",
                        )
    except Exception as e:
        logger.warning(f"Failed to fetch remote pricing: {e}")

    # 4. Fallback to hardcoded pricing (from original cost.py)
    from llm_answer_watcher.utils.cost import PRICING as FALLBACK_PRICING

    if provider in FALLBACK_PRICING and model in FALLBACK_PRICING[provider]:
        pricing_data = FALLBACK_PRICING[provider][model]
        # Convert from per-token to per-million-tokens
        return ModelPricing(
            provider=provider,
            model=model,
            input=pricing_data["input"] * 1_000_000,
            output=pricing_data["output"] * 1_000_000,
            input_cached=None,
            source="fallback",
        )

    # No pricing available
    raise PricingNotAvailableError(
        f"Pricing not available for provider={provider}, model={model}. "
        f"Available providers: {list(PROVIDER_MAPPING.keys())}"
    )


def get_tool_pricing(tool_name: str) -> ToolPricing:
    """
    Get pricing for a built-in tool (web search, code interpreter, etc.).

    Args:
        tool_name: Tool identifier (e.g., "web_search", "web_search_preview", "code_interpreter")

    Returns:
        ToolPricing: Pricing information for the tool

    Raises:
        PricingNotAvailableError: If tool pricing is not configured

    Example:
        >>> tool_pricing = get_tool_pricing("web_search")
        >>> cost_per_call = tool_pricing.cost_per_1k / 1000
        >>> print(f"Cost per web search: ${cost_per_call:.4f}")
    """
    overrides = _load_overrides()
    tools = overrides.get("tools", {})

    if tool_name not in tools:
        raise PricingNotAvailableError(
            f"Tool pricing not available for: {tool_name}. "
            f"Available tools: {list(tools.keys())}"
        )

    tool_data = tools[tool_name]
    return ToolPricing(
        tool_name=tool_name,
        cost_per_use=tool_data.get("cost_per_use"),
        cost_per_1k=tool_data.get("cost_per_1k"),
        fixed_tokens=tool_data.get("fixed_tokens"),
        free_content_tokens=tool_data.get("free_content_tokens", False),
    )


def refresh_pricing(force: bool = False) -> dict[str, Any]:
    """
    Refresh pricing data from remote source.

    Args:
        force: Force refresh even if cache is fresh (default: False)

    Returns:
        dict: Refreshed pricing data with metadata

    Example:
        >>> result = refresh_pricing(force=True)
        >>> print(f"Updated {result['model_count']} models from {result['source']}")
    """
    # Check if refresh is needed
    if not force:
        cached = _load_cache()
        if cached and not _is_cache_expired(cached.get("cached_at")):
            return {
                "status": "skipped",
                "reason": "Cache is fresh (less than 24 hours old)",
                "cached_at": cached.get("cached_at"),
                "updated_at": cached.get("updated_at"),
                "model_count": len(cached.get("prices", [])),
                "source": "cache",
            }

    # Fetch from remote
    try:
        logger.info(f"Refreshing pricing from {PRICING_URL}")
        remote_data = _fetch_remote_pricing()
        if remote_data:
            _save_cache(remote_data)
            return {
                "status": "success",
                "cached_at": remote_data.get("cached_at", utc_now().isoformat()),
                "updated_at": remote_data.get("updated_at"),
                "model_count": len(remote_data.get("prices", [])),
                "source": "remote",
            }
    except Exception as e:
        logger.error(f"Failed to refresh pricing: {e}", exc_info=True)
        return {"status": "error", "error": str(e), "source": "remote"}

    return {"status": "error", "error": "Unknown error", "source": "remote"}


def list_available_models() -> list[dict[str, Any]]:
    """
    List all available models with pricing.

    Returns:
        list: List of dicts with model info (provider, model, input, output, source)

    Example:
        >>> models = list_available_models()
        >>> openai_models = [m for m in models if m['provider'] == 'openai']
        >>> print(f"Found {len(openai_models)} OpenAI models")
    """
    models = []

    # Load all pricing sources
    overrides = _load_overrides()
    cached = _load_cache()
    from llm_answer_watcher.utils.cost import PRICING as FALLBACK_PRICING

    # Add overrides
    for provider, provider_models in overrides.items():
        # Skip special keys (tools, comments, metadata)
        if provider.startswith("_") or provider == "tools":
            continue

        # Skip if provider_models is not a dict (malformed data)
        if not isinstance(provider_models, dict):
            continue

        for model, pricing in provider_models.items():
            # Skip metadata/comment keys
            if model.startswith("_"):
                continue

            # Skip if pricing is not a dict (malformed data)
            if not isinstance(pricing, dict):
                continue

            # Skip if required fields are missing
            if "input" not in pricing or "output" not in pricing:
                continue

            models.append(
                {
                    "provider": provider,
                    "model": model,
                    "input": pricing["input"],
                    "output": pricing["output"],
                    "input_cached": pricing.get("input_cached"),
                    "source": "override",
                }
            )

    # Add cached pricing
    if cached:
        for price in cached.get("prices", []):
            vendor = price["vendor"]
            # Map vendor back to provider name
            provider = next(
                (p for p, v in PROVIDER_MAPPING.items() if v == vendor), vendor
            )
            models.append(
                {
                    "provider": provider,
                    "model": price["id"],
                    "name": price.get("name", price["id"]),
                    "input": price["input"],
                    "output": price["output"],
                    "input_cached": price.get("input_cached"),
                    "source": "cache",
                }
            )

    # Add fallback pricing (only if not already in cache/overrides)
    cached_keys = {(m["provider"], m["model"]) for m in models}
    for provider, provider_models in FALLBACK_PRICING.items():
        for model, pricing in provider_models.items():
            if (provider, model) not in cached_keys:
                models.append(
                    {
                        "provider": provider,
                        "model": model,
                        "input": pricing["input"] * 1_000_000,
                        "output": pricing["output"] * 1_000_000,
                        "input_cached": None,
                        "source": "fallback",
                    }
                )

    return models


# Private helper functions


def _load_overrides() -> dict[str, Any]:
    """Load local pricing overrides from JSON file."""
    if not OVERRIDES_FILE.exists():
        logger.debug(f"No overrides file found at {OVERRIDES_FILE}")
        return {}

    try:
        with open(OVERRIDES_FILE) as f:
            data = json.load(f)
            logger.debug(f"Loaded pricing overrides from {OVERRIDES_FILE}")
            return data
    except Exception as e:
        logger.warning(f"Failed to load pricing overrides: {e}")
        return {}


def _load_cache() -> dict[str, Any] | None:
    """Load cached pricing data from JSON file."""
    if not CACHE_FILE.exists():
        logger.debug(f"No cache file found at {CACHE_FILE}")
        return None

    try:
        with open(CACHE_FILE) as f:
            data = json.load(f)
            logger.debug(
                f"Loaded pricing cache from {CACHE_FILE} "
                f"(cached at {data.get('cached_at')})"
            )
            return data
    except Exception as e:
        logger.warning(f"Failed to load pricing cache: {e}")
        return None


def _save_cache(data: dict[str, Any]) -> None:
    """Save pricing data to cache file."""
    try:
        # Ensure config directory exists
        CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)

        # Add caching metadata
        cache_data = {
            "cached_at": utc_now().isoformat(),
            "updated_at": data.get("updated_at"),
            "prices": data.get("prices", []),
        }

        with open(CACHE_FILE, "w") as f:
            json.dump(cache_data, f, indent=2)

        logger.info(f"Saved pricing cache to {CACHE_FILE}")
    except Exception as e:
        logger.warning(f"Failed to save pricing cache: {e}")


def _is_cache_expired(cached_at: str | None) -> bool:
    """Check if cache is expired (older than CACHE_DURATION)."""
    if not cached_at:
        return True

    try:
        cached_time = datetime.fromisoformat(cached_at.replace("Z", "+00:00"))
        now = datetime.now(UTC)
        age = now - cached_time
        expired = age > CACHE_DURATION

        if expired:
            logger.debug(f"Cache expired (age: {age}, max: {CACHE_DURATION})")
        else:
            logger.debug(f"Cache fresh (age: {age}, max: {CACHE_DURATION})")

        return expired
    except Exception as e:
        logger.warning(f"Failed to parse cache timestamp: {e}")
        return True


def _fetch_remote_pricing(timeout: float = 10.0) -> dict[str, Any] | None:
    """Fetch pricing data from remote source."""
    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.get(PRICING_URL)
            response.raise_for_status()
            data = response.json()

            logger.info(
                f"Fetched pricing for {len(data.get('prices', []))} models "
                f"(updated: {data.get('updated_at')})"
            )

            return data
    except httpx.HTTPError as e:
        logger.error(f"HTTP error fetching pricing: {e}")
        raise
    except Exception as e:
        logger.error(f"Error fetching pricing: {e}")
        raise
