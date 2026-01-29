"""
Function calling-based brand extraction for LLM Answer Watcher.

This module implements structured brand mention extraction using OpenAI's
function calling API. It provides higher accuracy and lower latency compared
to regex-based parsing by leveraging the LLM's semantic understanding.

Key features:
- Structured extraction via function calling (no regex needed)
- Automatic fallback to regex on errors
- Confidence-based filtering
- Context snippets for validation
- Cost tracking (extraction calls tracked separately)

Architecture:
    1. Call extraction model with answer text as input
    2. LLM returns structured JSON via function calling
    3. Validate schema and confidence thresholds
    4. Fall back to regex if function calling fails
    5. Return structured extraction result

Example:
    >>> from config.schema import Brands, RuntimeExtractionSettings
    >>> result = extract_with_function_calling(
    ...     answer_text="I recommend 1. Lemwarm 2. Instantly",
    ...     brands=Brands(mine=["Lemwarm"], competitors=["Instantly"]),
    ...     extraction_settings=settings,
    ...     intent_id="email-warmup"
    ... )
    >>> len(result.brands_mentioned)
    2
    >>> result.brands_mentioned[0]["rank"]
    1
"""

import json
import logging
from dataclasses import dataclass

from ..config.schema import Brands, RuntimeExtractionSettings
from ..llm_runner.models import LLMResponse, build_client
from .function_schemas import (
    EXTRACT_BRAND_MENTIONS_FUNCTION,
    validate_function_response,
)
from .mention_detector import detect_mentions

logger = logging.getLogger(__name__)


@dataclass
class FunctionExtractionResult:
    """
    Result from function calling extraction.

    Contains structured brand mentions extracted via function calling,
    along with metadata about the extraction process.

    Attributes:
        brands_mentioned: List of brand mention dicts with name, rank, confidence
        extraction_notes: Optional notes from the extraction process
        confidence_scores: Mapping of brand_name -> confidence level
        method: Extraction method used ("function_calling", "regex_fallback", "hybrid")
        fallback_used: True if regex fallback was triggered
        raw_function_call: Raw function call result for debugging
        extraction_cost_usd: Cost of extraction call in USD

    Example:
        >>> result = FunctionExtractionResult(
        ...     brands_mentioned=[
        ...         {"name": "Lemwarm", "rank": 1, "confidence": "high"},
        ...         {"name": "Instantly", "rank": 2, "confidence": "high"}
        ...     ],
        ...     extraction_notes="Clear ranking structure",
        ...     confidence_scores={"Lemwarm": "high", "Instantly": "high"},
        ...     method="function_calling",
        ...     fallback_used=False,
        ...     raw_function_call={...},
        ...     extraction_cost_usd=0.00018
        ... )
    """

    brands_mentioned: list[dict]
    extraction_notes: str | None
    confidence_scores: dict[str, str]
    method: str
    fallback_used: bool
    raw_function_call: dict | None = None
    extraction_cost_usd: float = 0.0


def build_extraction_prompt(
    answer_text: str,
    our_brands: list[str],
    competitor_brands: list[str],
) -> str:
    """
    Build prompt for extraction model with brand context.

    The prompt includes the answer text to analyze plus context about
    known brands (both ours and competitors) to help the LLM identify
    variations and normalize names.

    Args:
        answer_text: Raw LLM answer to analyze for brand mentions
        our_brands: List of our brand names (for context)
        competitor_brands: List of competitor brand names (for context)

    Returns:
        Formatted prompt string for extraction model

    Example:
        >>> prompt = build_extraction_prompt(
        ...     "I prefer HubSpot over Instantly",
        ...     our_brands=["Lemwarm"],
        ...     competitor_brands=["HubSpot", "Instantly"]
        ... )
        >>> "ANSWER TO ANALYZE" in prompt
        True
    """
    # Build brand context for better detection
    brand_context = ""
    if our_brands or competitor_brands:
        brand_context += "\n\nBRAND CONTEXT (helps identify variations):"
        if our_brands:
            brand_context += f"\n- Our brands: {', '.join(our_brands)}"
        if competitor_brands:
            brand_context += f"\n- Known competitors: {', '.join(competitor_brands)}"
        brand_context += (
            "\n\nNote: The answer may mention brands NOT in these lists. "
            "Extract ALL brands mentioned, not just those listed above."
        )

    return f"""You are analyzing an LLM's answer to extract brand/product mentions.

ANSWER TO ANALYZE:
\"\"\"
{answer_text}
\"\"\"{brand_context}

Extract ALL brand mentions using the extract_brand_mentions function.
Include brands even if they're not in the context lists above.
"""


def parse_function_call_response(llm_response: LLMResponse) -> dict:
    """
    Parse function call result from LLM response.

    Extracts the function call arguments from the LLMResponse object.
    The OpenAIClient stores function call data in a special JSON format.

    Args:
        llm_response: LLMResponse from extraction model

    Returns:
        Parsed function call arguments as dict

    Raises:
        ValueError: If response doesn't contain valid function call

    Example:
        >>> response = LLMResponse(answer_text='{"_function_call": {...}}', ...)
        >>> result = parse_function_call_response(response)
        >>> "brands_mentioned" in result
        True
    """
    # OpenAI client stores function calls as JSON in answer_text
    try:
        parsed = json.loads(llm_response.answer_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse function call response: {e}") from e

    # Check for function call marker
    if "_function_call" not in parsed:
        raise ValueError(
            "Response does not contain function call data. "
            "Ensure tool_choice='required' in client configuration."
        )

    function_call_data = parsed["_function_call"]

    # Validate function name
    if function_call_data.get("name") != "extract_brand_mentions":
        raise ValueError(
            f"Unexpected function called: {function_call_data.get('name')}"
        )

    # Extract and return function arguments
    return function_call_data.get("arguments", {})


async def extract_with_function_calling(
    answer_text: str,
    brands: Brands,
    extraction_settings: RuntimeExtractionSettings,
    intent_id: str,
) -> FunctionExtractionResult:
    """
    Extract brand mentions using OpenAI function calling (async).

    This is the main entry point for function calling-based extraction.
    It calls the extraction model with structured output requirements,
    validates the result, and falls back to regex if needed.

    This function is async because it calls LLM clients which are async.

    Args:
        answer_text: Raw LLM answer to analyze
        brands: Brand configuration (mine + competitors)
        extraction_settings: Extraction model config and settings
        intent_id: Intent ID for logging context

    Returns:
        FunctionExtractionResult with structured brands data

    Raises:
        RuntimeError: If extraction fails and fallback is disabled

    Example:
        >>> result = await extract_with_function_calling(
        ...     answer_text="I recommend 1. Lemwarm 2. Instantly",
        ...     brands=Brands(mine=["Lemwarm"], competitors=["Instantly"]),
        ...     extraction_settings=settings,
        ...     intent_id="email-warmup"
        ... )
        >>> result.method
        'function_calling'
        >>> len(result.brands_mentioned)
        2
    """
    # Build extraction client
    extraction_model = extraction_settings.extraction_model
    client = build_client(
        provider=extraction_model.provider,
        model_name=extraction_model.model_name,
        api_key=extraction_model.api_key,
        system_prompt=extraction_model.system_prompt,
        tools=[EXTRACT_BRAND_MENTIONS_FUNCTION],
        tool_choice="required",  # FORCE function call
    )

    # Build prompt with brand context
    prompt = build_extraction_prompt(
        answer_text=answer_text,
        our_brands=brands.mine,
        competitor_brands=brands.competitors,
    )

    try:
        # Call extraction model
        logger.debug(
            f"Calling extraction model {extraction_model.provider}/{extraction_model.model_name} "
            f"for intent {intent_id}"
        )
        response: LLMResponse = await client.generate_answer(prompt)

        # Parse function call result
        function_result = parse_function_call_response(response)

        # Validate schema
        validate_function_response(function_result)

        # Filter by confidence threshold
        min_confidence_rank = {"high": 3, "medium": 2, "low": 1}
        threshold_rank = min_confidence_rank.get(
            "high"
            if extraction_settings.min_confidence >= 0.8
            else "medium"
            if extraction_settings.min_confidence >= 0.5
            else "low"
        )

        filtered_brands = [
            brand
            for brand in function_result["brands_mentioned"]
            if min_confidence_rank[brand["confidence"]] >= threshold_rank
        ]

        logger.info(
            f"Function calling extraction succeeded for {intent_id}: "
            f"found {len(filtered_brands)} brands "
            f"(filtered from {len(function_result['brands_mentioned'])} total)"
        )

        return FunctionExtractionResult(
            brands_mentioned=filtered_brands,
            extraction_notes=function_result.get("extraction_notes"),
            confidence_scores={
                brand["name"]: brand["confidence"] for brand in filtered_brands
            },
            method="function_calling",
            fallback_used=False,
            raw_function_call=function_result,
            extraction_cost_usd=response.cost_usd,
        )

    except Exception as e:
        logger.warning(
            f"Function calling extraction failed for {intent_id}: {e}", exc_info=True
        )

        if extraction_settings.fallback_to_regex:
            logger.info(f"Falling back to regex extraction for {intent_id}")

            # Fall back to old method
            mentions = detect_mentions(answer_text, brands.mine, brands.competitors)

            return FunctionExtractionResult(
                brands_mentioned=[
                    {
                        "name": mention.normalized_name,
                        "rank": None,  # Regex can't determine ranking
                        "confidence": "medium",  # Conservative confidence
                        "context_snippet": answer_text[
                            mention.match_position : mention.match_position + 100
                        ],
                        "sentiment": None,  # Regex can't determine sentiment
                        "mention_context": None,  # Regex can't determine context
                    }
                    for mention in mentions
                ],
                extraction_notes=f"Regex fallback used due to: {type(e).__name__}",
                confidence_scores={m.normalized_name: "medium" for m in mentions},
                method="regex_fallback",
                fallback_used=True,
                extraction_cost_usd=0.0,  # No cost for regex
            )
        raise RuntimeError(
            f"Function calling extraction failed for {intent_id}: {e}"
        ) from e
