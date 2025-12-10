"""
Answer parsing and extraction orchestration for LLM Answer Watcher.

This module ties together brand mention detection and rank extraction into
a unified parsing pipeline. It processes raw LLM answers and produces
structured ExtractionResult objects with all signals extracted.

The parser supports three extraction modes:
1. Function calling (recommended): Uses LLM structured output for high accuracy
2. Regex: Traditional word-boundary matching (backward compatible)
3. Hybrid: Function calling with regex fallback

Key features:
- Single entry point (parse_answer) for all extraction logic
- Structured output with all metadata
- Optional LLM-assisted extraction (disabled by default in v1)
- Function calling support for higher accuracy and lower latency
- Comprehensive signal capture (appeared_mine, mentions, rankings)

Example:
    >>> from config.schema import Brands, RuntimeExtractionSettings
    >>> brands = Brands(mine=["Warmly"], competitors=["HubSpot"])
    >>> result = parse_answer(
    ...     answer_text="I recommend 1. Warmly 2. HubSpot",
    ...     brands=brands,
    ...     intent_id="email-warmup",
    ...     provider="openai",
    ...     model_name="gpt-4o-mini",
    ...     timestamp_utc="2025-11-02T08:00:00Z",
    ...     extraction_settings=settings  # Optional: enables function calling
    ... )
    >>> result.appeared_mine
    True
    >>> len(result.ranked_list)
    2
"""

import logging
from dataclasses import dataclass

from ..config.schema import Brands, RuntimeExtractionSettings
from .mention_detector import BrandMention, detect_mentions
from .rank_extractor import (
    RankedBrand,
    extract_ranked_list_llm,
    extract_ranked_list_pattern,
)

logger = logging.getLogger(__name__)


@dataclass
class ExtractionResult:
    """
    Complete extraction result from LLM answer parsing.

    Contains all extracted signals: metadata, brand mentions, and rankings.
    Used for database storage and JSON artifact generation.

    Attributes:
        intent_id: Intent query identifier from config
        model_provider: LLM provider (e.g., "openai", "anthropic")
        model_name: Model identifier (e.g., "gpt-4o-mini")
        timestamp_utc: ISO 8601 timestamp when answer was parsed
        appeared_mine: True if any of our brands were mentioned
        my_mentions: List of mentions for our brands
        competitor_mentions: List of mentions for competitor brands
        ranked_list: Extracted ranked brands (if ranking structure detected)
        rank_extraction_method: Method used ("pattern", "llm", "function_calling", "regex_fallback")
        rank_confidence: Overall confidence in ranking (0.0-1.0)
        extraction_cost_usd: Cost of extraction in USD (0.0 for regex)
    """

    intent_id: str
    model_provider: str
    model_name: str
    timestamp_utc: str
    appeared_mine: bool
    my_mentions: list[BrandMention]
    competitor_mentions: list[BrandMention]
    ranked_list: list[RankedBrand]
    rank_extraction_method: str
    rank_confidence: float
    extraction_cost_usd: float = 0.0

    def __post_init__(self):
        """Validate rank_extraction_method."""
        valid_methods = {
            "pattern",
            "llm",
            "function_calling",
            "regex_fallback",
            "hybrid",
        }
        if self.rank_extraction_method not in valid_methods:
            raise ValueError(
                f"rank_extraction_method must be one of {valid_methods}, "
                f"got: {self.rank_extraction_method}"
            )


async def parse_answer(
    answer_text: str,
    brands: Brands,
    intent_id: str,
    provider: str,
    model_name: str,
    timestamp_utc: str,
    use_llm_extraction: bool = False,
    llm_client: object | None = None,
    extraction_settings: RuntimeExtractionSettings | None = None,
) -> ExtractionResult:
    """
    Parse LLM answer and extract all signals (async).

    Orchestrates mention detection and rank extraction to produce a complete
    ExtractionResult with all structured data extracted from the answer.

    This function is async when function calling is enabled because it calls
    LLM clients which are async.

    Processing pipeline (with function calling):
    1. If extraction_settings provided and method=function_calling:
       - Call extraction model with function calling
       - Get structured brand mentions with ranks
       - Fall back to regex if function calling fails (if enabled)
    2. Otherwise (backward compatible):
       - Detect brand mentions using regex (mine vs competitors)
       - Extract ranked list (pattern-based or LLM-assisted)
    3. Build ExtractionResult with all signals

    Args:
        answer_text: Raw LLM response text to parse
        brands: Brand configuration (mine + competitors)
        intent_id: Intent query identifier from config
        provider: LLM provider name (e.g., "openai", "anthropic")
        model_name: Model identifier (e.g., "gpt-4o-mini")
        timestamp_utc: ISO 8601 timestamp for this parse operation
        use_llm_extraction: If True, use LLM-assisted rank extraction (default: False)
        llm_client: LLM client for LLM-assisted extraction (required if use_llm_extraction=True)
        extraction_settings: Optional extraction settings (enables function calling)

    Returns:
        ExtractionResult with all extracted signals and metadata

    Raises:
        ValueError: If use_llm_extraction=True but llm_client=None

    Example:
        >>> from config.schema import Brands
        >>> brands = Brands(mine=["Warmly"], competitors=["HubSpot", "Instantly"])
        >>> text = "I recommend:\\n1. Warmly\\n2. HubSpot\\n3. Instantly"
        >>> result = await parse_answer(
        ...     answer_text=text,
        ...     brands=brands,
        ...     intent_id="email-warmup",
        ...     provider="openai",
        ...     model_name="gpt-4o-mini",
        ...     timestamp_utc="2025-11-02T08:00:00Z"
        ... )
        >>> result.appeared_mine
        True
        >>> result.ranked_list[0].brand_name
        'Warmly'

    Note:
        - Function calling provides higher accuracy and lower latency
        - Regex fallback ensures backward compatibility
        - LLM-assisted extraction is a stub in v1 (falls back to pattern-based)
    """
    # Validate LLM extraction parameters
    if use_llm_extraction and llm_client is None:
        raise ValueError("llm_client required when use_llm_extraction=True")

    # Check if function calling is enabled
    use_function_calling = (
        extraction_settings is not None
        and extraction_settings.method in {"function_calling", "hybrid"}
    )

    extraction_cost = 0.0

    if use_function_calling:
        # Use function calling for extraction
        logger.info(
            f"Using function calling extraction for {intent_id} "
            f"(method={extraction_settings.method})"
        )

        try:
            from .function_extractor import extract_with_function_calling

            func_result = await extract_with_function_calling(
                answer_text=answer_text,
                brands=brands,
                extraction_settings=extraction_settings,
                intent_id=intent_id,
            )

            extraction_cost = func_result.extraction_cost_usd

            # Convert function calling results to mentions and rankings
            my_mentions = []
            competitor_mentions = []
            ranked_list = []

            for brand_data in func_result.brands_mentioned:
                brand_name = brand_data["name"]
                rank = brand_data.get("rank")
                confidence_str = brand_data["confidence"]

                # Determine if this is our brand or competitor
                brand_category = "mine" if brand_name in brands.mine else "competitor"

                # Create BrandMention
                mention = BrandMention(
                    original_text=brand_name,
                    normalized_name=brand_name,
                    brand_category=brand_category,
                    match_position=0,  # Not applicable for function calling
                    match_type="exact",  # Function calling provides exact brand names
                    fuzzy_score=None,
                    sentiment=brand_data.get("sentiment"),
                    mention_context=brand_data.get("mention_context"),
                )

                if brand_category == "mine":
                    my_mentions.append(mention)
                else:
                    competitor_mentions.append(mention)

                # Add to ranked list if rank is present
                if rank is not None:
                    # Convert confidence string to float
                    confidence_map = {"high": 1.0, "medium": 0.7, "low": 0.3}
                    confidence_float = confidence_map.get(confidence_str, 0.5)

                    ranked_brand = RankedBrand(
                        brand_name=brand_name,
                        rank_position=rank,
                        confidence=confidence_float,
                    )
                    ranked_list.append(ranked_brand)

            # Sort ranked list by position
            ranked_list.sort(key=lambda b: b.rank_position)

            # Calculate overall rank confidence
            if ranked_list:
                rank_confidence = sum(b.confidence for b in ranked_list) / len(
                    ranked_list
                )
            else:
                rank_confidence = 0.0

            appeared_mine = len(my_mentions) > 0
            rank_method = func_result.method

        except Exception as e:
            logger.error(
                f"Function calling extraction failed for {intent_id}: {e}",
                exc_info=True,
            )

            # Fall back to regex if hybrid mode or fallback enabled
            if (
                extraction_settings.method == "hybrid"
                or extraction_settings.fallback_to_regex
            ):
                logger.info(f"Falling back to regex extraction for {intent_id}")
                use_function_calling = False
            else:
                raise

    # Regex-based extraction (backward compatible or fallback)
    if not use_function_calling:
        # Step 1: Detect brand mentions
        all_mentions = detect_mentions(
            answer_text=answer_text,
            our_brands=brands.mine,
            competitor_brands=brands.competitors,
        )

        # Step 2: Separate mentions into mine vs competitors
        my_mentions = [m for m in all_mentions if m.brand_category == "mine"]
        competitor_mentions = [
            m for m in all_mentions if m.brand_category == "competitor"
        ]

        # Step 3: Determine if our brand appeared
        appeared_mine = len(my_mentions) > 0

        # Step 4: Extract ranked list
        # Combine all brands for ranking (both mine and competitors)
        all_brands = brands.mine + brands.competitors

        if use_llm_extraction and llm_client is not None:
            # Use LLM-assisted extraction (v1 stub - falls back to pattern)
            ranked_list, rank_confidence = extract_ranked_list_llm(
                text=answer_text,
                known_brands=all_brands,
                client=llm_client,
            )
            rank_method = "llm"
        else:
            # Use pattern-based extraction (default)
            ranked_list, rank_confidence = extract_ranked_list_pattern(
                text=answer_text,
                known_brands=all_brands,
            )
            rank_method = "pattern"

    # Step 5: Build ExtractionResult
    return ExtractionResult(
        intent_id=intent_id,
        model_provider=provider,
        model_name=model_name,
        timestamp_utc=timestamp_utc,
        appeared_mine=appeared_mine,
        my_mentions=my_mentions,
        competitor_mentions=competitor_mentions,
        ranked_list=ranked_list,
        rank_extraction_method=rank_method,
        rank_confidence=rank_confidence,
        extraction_cost_usd=extraction_cost,
    )
