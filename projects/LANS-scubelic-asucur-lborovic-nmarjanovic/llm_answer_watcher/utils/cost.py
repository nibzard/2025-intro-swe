"""
Cost estimation utilities for LLM Answer Watcher.

Estimates USD costs based on provider pricing and token usage.
Pricing data is hardcoded based on public provider pricing as of the
update date. Users should verify costs on their provider's billing dashboard.

This module provides:
- PRICING: Public pricing table for all supported providers/models
- estimate_cost: Calculate estimated cost from token usage metadata

Important:
    Cost estimates are approximate and based on public pricing as of the
    update date. Actual costs may vary. Always check your provider's
    billing dashboard for accurate costs.

Example:
    >>> from utils.cost import estimate_cost
    >>> usage = {"prompt_tokens": 100, "completion_tokens": 50}
    >>> cost = estimate_cost("openai", "gpt-4o-mini", usage)
    >>> print(f"${cost:.6f}")
    $0.000045
"""

import logging

# Pricing table based on public provider pricing
# Updated: 2025-11-05
# All prices are USD per token (calculated as price_per_million / 1,000,000)
PRICING = {
    "openai": {
        "gpt-4o-mini": {
            "input": 0.150 / 1_000_000,  # $0.15 per 1M input tokens
            "output": 0.600 / 1_000_000,  # $0.60 per 1M output tokens
        },
        "gpt-4o": {
            "input": 2.50 / 1_000_000,  # $2.50 per 1M input tokens
            "output": 10.00 / 1_000_000,  # $10.00 per 1M output tokens
        },
        "gpt-4o-2024-11-20": {
            "input": 2.50 / 1_000_000,
            "output": 10.00 / 1_000_000,
        },
        "gpt-4o-2024-08-06": {
            "input": 2.50 / 1_000_000,
            "output": 10.00 / 1_000_000,
        },
        "gpt-4o-2024-05-13": {
            "input": 5.00 / 1_000_000,
            "output": 15.00 / 1_000_000,
        },
        "gpt-4-turbo": {
            "input": 10.00 / 1_000_000,
            "output": 30.00 / 1_000_000,
        },
        "gpt-4": {
            "input": 30.00 / 1_000_000,
            "output": 60.00 / 1_000_000,
        },
        "gpt-3.5-turbo": {
            "input": 0.50 / 1_000_000,
            "output": 1.50 / 1_000_000,
        },
        # GPT-5 models (based on public pricing information)
        "gpt-5": {
            "input": 1.25 / 1_000_000,  # $1.25 per 1M input tokens
            "output": 10.00 / 1_000_000,  # $10.00 per 1M output tokens
        },
        "gpt-5-mini": {
            "input": 0.25 / 1_000_000,  # $0.25 per 1M input tokens
            "output": 2.00 / 1_000_000,  # $2.00 per 1M output tokens
        },
        "gpt-5-nano": {
            "input": 0.05 / 1_000_000,  # $0.05 per 1M input tokens
            "output": 0.40 / 1_000_000,  # $0.40 per 1M output tokens
        },
        "gpt-5-pro": {
            "input": 5.00 / 1_000_000,  # $5.00 per 1M input tokens
            "output": 20.00 / 1_000_000,  # $20.00 per 1M output tokens
        },
        "gpt-5-chat-latest": {
            "input": 1.25 / 1_000_000,  # Same as gpt-5
            "output": 10.00 / 1_000_000,
        },
    },
    "anthropic": {
        "claude-3-5-haiku-20241022": {
            "input": 0.80 / 1_000_000,  # $0.80 per 1M input tokens
            "output": 4.00 / 1_000_000,  # $4.00 per 1M output tokens
        },
        "claude-3-5-sonnet-20241022": {
            "input": 3.00 / 1_000_000,  # $3.00 per 1M input tokens
            "output": 15.00 / 1_000_000,  # $15.00 per 1M output tokens
        },
        "claude-3-5-sonnet-20240620": {
            "input": 3.00 / 1_000_000,
            "output": 15.00 / 1_000_000,
        },
        "claude-3-opus-20240229": {
            "input": 15.00 / 1_000_000,
            "output": 75.00 / 1_000_000,
        },
        "claude-3-sonnet-20240229": {
            "input": 3.00 / 1_000_000,
            "output": 15.00 / 1_000_000,
        },
        "claude-3-haiku-20240307": {
            "input": 0.25 / 1_000_000,
            "output": 1.25 / 1_000_000,
        },
    },
    "google": {
        # Gemini 2.0 models
        "gemini-2.0-flash-exp": {
            "input": 0.0,  # Free during experimental preview
            "output": 0.0,  # Free during experimental preview
        },
        # Gemini 1.5 models
        "gemini-1.5-pro": {
            "input": 1.25 / 1_000_000,  # $1.25 per 1M input tokens (up to 128k)
            "output": 5.00 / 1_000_000,  # $5.00 per 1M output tokens
        },
        "gemini-1.5-pro-001": {
            "input": 1.25 / 1_000_000,
            "output": 5.00 / 1_000_000,
        },
        "gemini-1.5-pro-002": {
            "input": 1.25 / 1_000_000,
            "output": 5.00 / 1_000_000,
        },
        "gemini-1.5-flash": {
            "input": 0.075 / 1_000_000,  # $0.075 per 1M input tokens (up to 128k)
            "output": 0.30 / 1_000_000,  # $0.30 per 1M output tokens
        },
        "gemini-1.5-flash-001": {
            "input": 0.075 / 1_000_000,
            "output": 0.30 / 1_000_000,
        },
        "gemini-1.5-flash-002": {
            "input": 0.075 / 1_000_000,
            "output": 0.30 / 1_000_000,
        },
        "gemini-1.5-flash-8b": {
            "input": 0.0375 / 1_000_000,  # $0.0375 per 1M input tokens
            "output": 0.15 / 1_000_000,  # $0.15 per 1M output tokens
        },
        "gemini-1.5-flash-8b-001": {
            "input": 0.0375 / 1_000_000,
            "output": 0.15 / 1_000_000,
        },
        # Gemini 1.0 models (legacy)
        "gemini-1.0-pro": {
            "input": 0.50 / 1_000_000,  # $0.50 per 1M input tokens
            "output": 1.50 / 1_000_000,  # $1.50 per 1M output tokens
        },
        "gemini-1.0-pro-001": {
            "input": 0.50 / 1_000_000,
            "output": 1.50 / 1_000_000,
        },
    },
    "mistral": {
        "mistral-large-latest": {
            "input": 2.00 / 1_000_000,
            "output": 6.00 / 1_000_000,
        },
        "mistral-small-latest": {
            "input": 0.20 / 1_000_000,
            "output": 0.60 / 1_000_000,
        },
        "codestral-latest": {
            "input": 0.20 / 1_000_000,
            "output": 0.60 / 1_000_000,
        },
    },
    "grok": {
        # Grok Beta (Initial release - November 2024)
        "grok-beta": {
            "input": 5.00 / 1_000_000,  # $5.00 per 1M input tokens
            "output": 15.00 / 1_000_000,  # $15.00 per 1M output tokens
        },
        # Grok 2 Models (December 2024)
        "grok-2-1212": {
            "input": 2.00 / 1_000_000,  # $2.00 per 1M input tokens
            "output": 10.00 / 1_000_000,  # $10.00 per 1M output tokens
        },
        "grok-2-vision-1212": {
            "input": 2.00 / 1_000_000,
            "output": 10.00 / 1_000_000,
        },
        # Grok 2 latest (alias)
        "grok-2-latest": {
            "input": 2.00 / 1_000_000,
            "output": 10.00 / 1_000_000,
        },
        # Grok 3 Models (February 2025)
        "grok-3": {
            "input": 3.00 / 1_000_000,  # $3.00 per 1M input tokens
            "output": 15.00 / 1_000_000,  # $15.00 per 1M output tokens
        },
        "grok-3-mini": {
            "input": 3.00 / 1_000_000,  # $3.00 per 1M input tokens (same as grok-3)
            "output": 15.00 / 1_000_000,  # $15.00 per 1M output tokens
        },
        "grok-3-fast": {
            "input": 5.00 / 1_000_000,  # $5.00 per 1M input tokens
            "output": 25.00 / 1_000_000,  # $25.00 per 1M output tokens
        },
        # Grok 3 latest (alias)
        "grok-3-latest": {
            "input": 3.00 / 1_000_000,
            "output": 15.00 / 1_000_000,
        },
    },
    "perplexity": {
        # Sonar Models - Grounded LLMs with web search
        # Note: Sonar models also have request fees ($5-$14 per 1k requests)
        # that vary by search context size. Request fees not yet implemented in v1.
        "sonar": {
            "input": 1.00 / 1_000_000,  # $1.00 per 1M input tokens
            "output": 1.00 / 1_000_000,  # $1.00 per 1M output tokens
        },
        "sonar-pro": {
            "input": 3.00 / 1_000_000,  # $3.00 per 1M input tokens
            "output": 15.00 / 1_000_000,  # $15.00 per 1M output tokens
        },
        "sonar-reasoning": {
            "input": 1.00 / 1_000_000,  # $1.00 per 1M input tokens
            "output": 5.00 / 1_000_000,  # $5.00 per 1M output tokens
        },
        "sonar-reasoning-pro": {
            "input": 2.00 / 1_000_000,  # $2.00 per 1M input tokens
            "output": 8.00 / 1_000_000,  # $8.00 per 1M output tokens
        },
        # Sonar Deep Research has additional costs:
        # - Citations: $2 per 1M tokens
        # - Searches: $5 per 1k searches
        # - Reasoning: $3 per 1M tokens
        # These are not yet implemented in v1.
        "sonar-deep-research": {
            "input": 2.00 / 1_000_000,  # $2.00 per 1M input tokens
            "output": 8.00 / 1_000_000,  # $8.00 per 1M output tokens
        },
    },
}

# Get logger for this module
logger = logging.getLogger(__name__)


def estimate_cost(provider: str, model: str, usage_meta: dict) -> float:
    """
    Estimate cost in USD based on token usage and provider pricing.

    Looks up pricing for the provider/model combination and calculates
    cost based on prompt_tokens (input) and completion_tokens (output)
    from the usage metadata dictionary.

    Returns 0.0 if pricing is unavailable (with warning logged).

    Args:
        provider: Provider name (e.g., "openai", "anthropic", "mistral")
        model: Model identifier (e.g., "gpt-4o-mini", "claude-3-5-haiku-20241022")
        usage_meta: Dictionary containing token usage with keys:
            - "prompt_tokens" (int): Number of input tokens
            - "completion_tokens" (int): Number of output tokens
            Other keys are ignored.

    Returns:
        float: Estimated cost in USD, rounded to 6 decimal places.
               Returns 0.0 if pricing data is unavailable.

    Examples:
        >>> usage = {"prompt_tokens": 100, "completion_tokens": 50}
        >>> cost = estimate_cost("openai", "gpt-4o-mini", usage)
        >>> cost
        0.000045

        >>> # Cost = (100 * $0.15/1M) + (50 * $0.60/1M)
        >>> # Cost = $0.000015 + $0.000030 = $0.000045

        >>> # Unknown model returns 0.0 with warning
        >>> cost = estimate_cost("openai", "unknown-model", usage)
        >>> cost
        0.0

        >>> # Claude example
        >>> usage = {"prompt_tokens": 1000, "completion_tokens": 500}
        >>> cost = estimate_cost("anthropic", "claude-3-5-haiku-20241022", usage)
        >>> cost
        0.002800

    Note:
        - Costs are estimates based on public pricing (updated 2025-11-01)
        - Actual costs may vary due to volume discounts, special pricing, etc.
        - Always verify costs on your provider's billing dashboard
        - Missing token counts default to 0 (graceful handling)
        - Logs warning if pricing data unavailable for provider/model

    Warning:
        This function NEVER logs API keys or sensitive data.
        Only provider name and model name are logged in warnings.
    """
    # Look up pricing for provider and model
    pricing = PRICING.get(provider, {}).get(model)

    if not pricing:
        # Pricing unavailable - log warning and return 0.0
        available_providers = list(PRICING.keys())
        logger.warning(
            f"Pricing unavailable for provider='{provider}', model='{model}'. "
            f"Returning $0.00 cost estimate. Available providers: {available_providers}"
        )
        return 0.0

    # Extract token counts (default to 0 if missing)
    input_tokens = usage_meta.get("prompt_tokens", 0)
    output_tokens = usage_meta.get("completion_tokens", 0)

    # Calculate cost: (input tokens * input price) + (output tokens * output price)
    cost = (input_tokens * pricing["input"]) + (output_tokens * pricing["output"])

    # Round to 6 decimal places for consistency
    return round(cost, 6)


def estimate_cost_with_dynamic_pricing(
    provider: str,
    model: str,
    usage_meta: dict,
    web_search_count: int = 0,
    web_search_version: str = "web_search",
    use_dynamic_pricing: bool = True,
) -> dict:
    """
    Enhanced cost calculation with dynamic pricing and web search support.

    This function extends estimate_cost() with:
    - Dynamic pricing from llm-prices.com (optional)
    - Web search tool call costs
    - Detailed cost breakdown

    Args:
        provider: Provider name (e.g., "openai", "anthropic")
        model: Model identifier (e.g., "gpt-4o-mini")
        usage_meta: Token usage dictionary {"prompt_tokens": X, "completion_tokens": Y}
        web_search_count: Number of web search tool calls made (default: 0)
        web_search_version: Web search tool version:
            - "web_search" (standard, all models): $10/1k calls
            - "web_search_gpt4o_mini" (gpt-4o-mini, gpt-4.1-mini): $10/1k + 8k fixed tokens
            - "web_search_preview_reasoning" (o1, o3): $10/1k calls
            - "web_search_preview_non_reasoning": $25/1k calls, FREE content tokens
        use_dynamic_pricing: Use dynamic pricing from llm-prices.com (default: True)

    Returns:
        dict: Cost breakdown with keys:
            - token_cost_usd: Cost from token usage
            - web_search_tool_cost_usd: Cost from web search tool calls
            - web_search_content_cost_usd: Cost from web search content tokens
            - total_cost_usd: Total cost
            - pricing_source: Where pricing came from ("dynamic", "fallback")

    Example:
        >>> usage = {"prompt_tokens": 100, "completion_tokens": 50}
        >>> breakdown = estimate_cost_with_dynamic_pricing(
        ...     "openai", "gpt-4o-mini", usage,
        ...     web_search_count=2, web_search_version="web_search_gpt4o_mini"
        ... )
        >>> print(f"Total: ${breakdown['total_cost_usd']:.6f}")
        >>> print(f"  Token cost: ${breakdown['token_cost_usd']:.6f}")
        >>> print(f"  Web search tool: ${breakdown['web_search_tool_cost_usd']:.6f}")
        >>> print(f"  Web search content: ${breakdown['web_search_content_cost_usd']:.6f}")
    """
    # Try dynamic pricing first
    token_cost = 0.0
    pricing_source = "fallback"

    if use_dynamic_pricing:
        try:
            from llm_answer_watcher.utils.pricing import get_pricing

            pricing_info = get_pricing(provider, model)
            # Convert from $/1M to per-token
            input_rate = pricing_info.input / 1_000_000
            output_rate = pricing_info.output / 1_000_000

            input_tokens = usage_meta.get("prompt_tokens", 0)
            output_tokens = usage_meta.get("completion_tokens", 0)

            token_cost = (input_tokens * input_rate) + (output_tokens * output_rate)
            pricing_source = pricing_info.source

        except Exception as e:
            logger.warning(
                f"Dynamic pricing failed for {provider}/{model}: {e}. "
                "Falling back to hardcoded pricing."
            )
            # Fall through to hardcoded pricing below

    # Fallback to hardcoded pricing if dynamic failed
    if token_cost == 0.0:
        token_cost = estimate_cost(provider, model, usage_meta)
        pricing_source = "fallback"

    # Calculate web search costs
    web_search_tool_cost = 0.0
    web_search_content_cost = 0.0

    if web_search_count > 0:
        web_costs = calculate_web_search_cost(
            provider=provider,
            model=model,
            web_search_count=web_search_count,
            web_search_version=web_search_version,
            usage_meta=usage_meta,
        )
        web_search_tool_cost = web_costs["tool_call_cost_usd"]
        web_search_content_cost = web_costs["content_cost_usd"]

    total_cost = token_cost + web_search_tool_cost + web_search_content_cost

    return {
        "token_cost_usd": round(token_cost, 6),
        "web_search_tool_cost_usd": round(web_search_tool_cost, 6),
        "web_search_content_cost_usd": round(web_search_content_cost, 6),
        "total_cost_usd": round(total_cost, 6),
        "pricing_source": pricing_source,
    }


def calculate_web_search_cost(
    provider: str,
    model: str,
    web_search_count: int,
    web_search_version: str = "web_search",
    usage_meta: dict | None = None,
) -> dict:
    """
    Calculate web search tool call costs based on OpenAI pricing.

    OpenAI web search pricing has multiple tiers:
    1. Standard web_search (all models): $10/1k calls + content tokens @ model rate
    2. gpt-4o-mini/gpt-4.1-mini: $10/1k calls + fixed 8,000 tokens @ model rate
    3. Preview reasoning (o1, o3): $10/1k calls + content tokens @ model rate
    4. Preview non-reasoning: $25/1k calls + FREE content tokens

    Args:
        provider: Provider name (must be "openai" for web search)
        model: Model identifier
        web_search_count: Number of web search tool calls
        web_search_version: Tool version ("web_search", "web_search_gpt4o_mini",
                           "web_search_preview_reasoning", "web_search_preview_non_reasoning")
        usage_meta: Token usage (optional, for content token calculations)

    Returns:
        dict: Breakdown with keys:
            - tool_call_cost_usd: Cost from tool calls ($10 or $25 per 1k)
            - content_cost_usd: Cost from search content tokens
            - fixed_tokens: Fixed token count (for gpt-4o-mini)
            - total_cost_usd: Combined cost

    Raises:
        ValueError: If provider is not "openai" or web_search_count is negative

    Example:
        >>> # Standard web search (2 calls)
        >>> cost = calculate_web_search_cost("openai", "gpt-4o", 2, "web_search")
        >>> print(f"Tool calls: ${cost['tool_call_cost_usd']:.4f}")
        Tool calls: $0.0200

        >>> # gpt-4o-mini with fixed 8k tokens
        >>> cost = calculate_web_search_cost(
        ...     "openai", "gpt-4o-mini", 1, "web_search_gpt4o_mini"
        ... )
        >>> print(f"Fixed tokens: {cost['fixed_tokens']}")
        Fixed tokens: 8000
    """
    if provider.lower() != "openai":
        raise ValueError(
            f"Web search pricing only available for OpenAI (got: {provider})"
        )

    if web_search_count < 0:
        raise ValueError(f"web_search_count must be >= 0 (got: {web_search_count})")

    if web_search_count == 0:
        return {
            "tool_call_cost_usd": 0.0,
            "content_cost_usd": 0.0,
            "fixed_tokens": 0,
            "total_cost_usd": 0.0,
        }

    # Determine tool call cost per 1k calls
    tool_cost_per_1k = 10.0  # Default: $10/1k
    free_content_tokens = False
    fixed_tokens = 0

    if web_search_version == "web_search_preview_non_reasoning":
        tool_cost_per_1k = 25.0
        free_content_tokens = True
    elif web_search_version == "web_search_gpt4o_mini":
        fixed_tokens = 8000  # Fixed 8k token block per call

    # Calculate tool call cost
    tool_call_cost = (web_search_count / 1000) * tool_cost_per_1k

    # Calculate content token cost
    content_cost = 0.0
    if not free_content_tokens:
        if fixed_tokens > 0:
            # gpt-4o-mini: Fixed 8k tokens per call at model input rate
            total_fixed_tokens = fixed_tokens * web_search_count
            # Get model input rate
            pricing = PRICING.get(provider, {}).get(model)
            if pricing:
                input_rate = pricing["input"]
                content_cost = total_fixed_tokens * input_rate
            else:
                logger.warning(
                    f"Cannot calculate fixed token cost: pricing unavailable for {provider}/{model}"
                )
        else:
            # Content tokens already included in usage_meta, billed at model rate
            # No additional charge here (already counted in token_cost)
            content_cost = 0.0

    total_cost = tool_call_cost + content_cost

    return {
        "tool_call_cost_usd": round(tool_call_cost, 6),
        "content_cost_usd": round(content_cost, 6),
        "fixed_tokens": fixed_tokens * web_search_count if fixed_tokens > 0 else 0,
        "total_cost_usd": round(total_cost, 6),
    }


def detect_web_search_version(model: str, tool_version: str | None = None) -> str:
    """
    Detect the appropriate web search pricing version based on model.

    Args:
        model: Model identifier (e.g., "gpt-4o-mini", "o1-preview", "gpt-4o")
        tool_version: Explicit tool version if known (e.g., "preview", "standard")

    Returns:
        str: Web search version identifier for pricing lookup

    Example:
        >>> detect_web_search_version("gpt-4o-mini")
        'web_search_gpt4o_mini'

        >>> detect_web_search_version("o1-preview")
        'web_search_preview_reasoning'

        >>> detect_web_search_version("gpt-4o", "preview")
        'web_search_preview_non_reasoning'
    """
    model_lower = model.lower()

    # Special case: gpt-4o-mini and gpt-4.1-mini have fixed 8k tokens
    if "4o-mini" in model_lower or "4.1-mini" in model_lower:
        return "web_search_gpt4o_mini"

    # Reasoning models (o1, o3 families) with preview
    if tool_version == "preview":
        if any(x in model_lower for x in ["o1", "o3", "o4"]):
            return "web_search_preview_reasoning"
        return "web_search_preview_non_reasoning"

    # Default: standard web search
    return "web_search"
