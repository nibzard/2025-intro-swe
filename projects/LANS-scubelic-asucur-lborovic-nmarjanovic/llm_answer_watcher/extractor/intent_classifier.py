"""
Intent classification using function calling for LLM Answer Watcher.

This module implements query intent classification using OpenAI's function calling API.
It analyzes user queries to determine:
- Intent type (transactional, informational, navigational, commercial_investigation)
- Buyer journey stage (awareness, consideration, decision)
- Urgency signals (high, medium, low)

This enables prioritization of high-value mentions and better ROI analysis.

Key features:
- Structured classification via function calling
- Confidence scoring for classification accuracy
- Reasoning explanations for transparency
- Cost tracking for extraction calls

Architecture:
    1. Build extraction client with CLASSIFY_QUERY_INTENT_FUNCTION
    2. Call LLM with user query
    3. LLM returns structured JSON via function calling
    4. Validate schema and return classification result

Example:
    >>> from config.schema import RuntimeExtractionSettings
    >>> result = await classify_intent(
    ...     query="What are the best email warmup tools to buy now?",
    ...     extraction_settings=settings,
    ...     intent_id="email-warmup",
    ...     db_path="./output/watcher.db"
    ... )
    >>> result.intent_type
    'transactional'
    >>> result.buyer_stage
    'decision'
    >>> result.urgency_signal
    'high'
"""

import hashlib
import json
import logging
import sqlite3
from dataclasses import dataclass

from ..config.schema import RuntimeExtractionSettings
from ..llm_runner.models import LLMResponse, build_client
from ..storage.db import (
    lookup_intent_classification_cache,
    store_intent_classification_cache,
)
from .function_schemas import (
    CLASSIFY_QUERY_INTENT_FUNCTION,
    validate_intent_classification_response,
)

logger = logging.getLogger(__name__)


def compute_query_hash(query: str) -> str:
    """
    Compute SHA256 hash of normalized query text for cache key.

    Normalizes the query by stripping whitespace and converting to lowercase
    to ensure consistent cache keys for semantically identical queries.

    Args:
        query: User query text

    Returns:
        64-character hexadecimal SHA256 hash string

    Example:
        >>> compute_query_hash("What are the best email warmup tools?")
        '5d41402abc4b2a76b9719d911017c592...'
        >>> compute_query_hash("  What are the best email warmup tools?  ")
        '5d41402abc4b2a76b9719d911017c592...'  # Same hash (normalized)

    Note:
        Normalization ensures cache hits for queries that differ only in
        whitespace or case. This maximizes cache effectiveness.
    """
    # Normalize: strip whitespace, lowercase
    normalized = query.strip().lower()

    # Compute SHA256 hash
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


@dataclass
class IntentClassificationResult:
    """
    Result from intent classification.

    Contains structured classification data about the user query, including
    intent type, buyer stage, and urgency signals for prioritization.

    Attributes:
        intent_type: Type of intent (transactional/informational/navigational/commercial_investigation)
        buyer_stage: Buyer journey stage (awareness/consideration/decision)
        urgency_signal: Urgency level (high/medium/low)
        classification_confidence: Confidence score 0.0-1.0
        reasoning: Optional explanation of classification
        extraction_cost_usd: Cost of classification call in USD

    Example:
        >>> result = IntentClassificationResult(
        ...     intent_type="transactional",
        ...     buyer_stage="decision",
        ...     urgency_signal="high",
        ...     classification_confidence=0.92,
        ...     reasoning="Query contains 'buy now' and 'best' indicators",
        ...     extraction_cost_usd=0.00012
        ... )
    """

    intent_type: str
    buyer_stage: str
    urgency_signal: str
    classification_confidence: float
    reasoning: str | None
    extraction_cost_usd: float


def build_classification_prompt(query: str) -> str:
    """
    Build prompt for intent classification model.

    The prompt includes the user query and instructions to classify it
    using the classify_query_intent function.

    Args:
        query: User query to classify

    Returns:
        Formatted prompt string for classification model

    Example:
        >>> prompt = build_classification_prompt("best CRM to buy now")
        >>> "QUERY:" in prompt
        True
    """
    return f"""You are analyzing a user search query to classify its intent.

QUERY TO ANALYZE:
"{query}"

Classify this query using the classify_query_intent function.

Consider:
- What is the user's primary goal? (buy, learn, find specific product, compare)
- Where are they in the buyer journey? (discovering, evaluating, deciding)
- How urgent is their need? (immediate, soon, general interest)

Use the function to return structured classification with your reasoning."""


def parse_classification_response(llm_response: LLMResponse) -> dict:
    """
    Parse function call result from LLM response.

    Extracts the function call arguments from the LLMResponse object.
    The OpenAIClient stores function call data in a special JSON format.

    Args:
        llm_response: LLMResponse from classification model

    Returns:
        Parsed function call arguments as dict

    Raises:
        ValueError: If response doesn't contain valid function call

    Example:
        >>> response = LLMResponse(answer_text='{"_function_call": {...}}', ...)
        >>> result = parse_classification_response(response)
        >>> "intent_type" in result
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
    if function_call_data.get("name") != "classify_query_intent":
        raise ValueError(
            f"Unexpected function called: {function_call_data.get('name')}"
        )

    # Extract and return function arguments
    return function_call_data.get("arguments", {})


async def classify_intent(
    query: str,
    extraction_settings: RuntimeExtractionSettings,
    intent_id: str,
    db_path: str,
) -> IntentClassificationResult:
    """
    Classify user query intent using function calling with caching (async).

    This is the main entry point for intent classification. It checks the cache
    first to avoid redundant API calls, then calls the extraction model with
    structured output requirements if needed, validates the result, stores it
    in cache, and returns classification data.

    Caching behavior:
    - Cache key: SHA256 hash of normalized query text
    - Cache hit: Returns cached result with 0 API cost (no LLM call)
    - Cache miss: Calls LLM, stores result in cache, returns result
    - Cache persists across runs in SQLite database

    Args:
        query: User query to classify
        extraction_settings: Extraction model config and settings
        intent_id: Intent ID for logging context
        db_path: Path to SQLite database for cache storage

    Returns:
        IntentClassificationResult with classification data
        Note: extraction_cost_usd will be 0.0 for cache hits

    Raises:
        RuntimeError: If classification fails
        ValueError: If extraction settings are invalid

    Example:
        >>> # First call - cache miss, calls LLM
        >>> result1 = await classify_intent(
        ...     query="What are the best email warmup tools to buy now?",
        ...     extraction_settings=settings,
        ...     intent_id="email-warmup",
        ...     db_path="./output/watcher.db"
        ... )
        >>> result1.extraction_cost_usd
        0.00011  # LLM call cost

        >>> # Second call with same query - cache hit, no LLM call
        >>> result2 = await classify_intent(
        ...     query="What are the best email warmup tools to buy now?",
        ...     extraction_settings=settings,
        ...     intent_id="email-warmup-2",
        ...     db_path="./output/watcher.db"
        ... )
        >>> result2.extraction_cost_usd
        0.0  # Cache hit, no cost!

    Note:
        This async function requires extraction_settings.extraction_model to be configured.
        If extraction_model is None, raises ValueError.

        Cache is based on query text only, not intent_id. Multiple intents with
        identical queries will share the same cached classification.
    """
    # Validate extraction settings
    if extraction_settings.extraction_model is None:
        raise ValueError(
            "Intent classification requires extraction_model to be configured. "
            "Set extraction_settings.extraction_model in config."
        )

    # Compute query hash for cache lookup
    query_hash = compute_query_hash(query)

    # Check cache first
    try:
        with sqlite3.connect(db_path) as conn:
            cached_result = lookup_intent_classification_cache(conn, query_hash)

            if cached_result is not None:
                logger.info(
                    f"Intent classification cache HIT for {intent_id}: "
                    f"{cached_result['intent_type']}/{cached_result['buyer_stage']}/{cached_result['urgency_signal']} "
                    f"(confidence={cached_result['classification_confidence']:.2f}, saved=${cached_result['extraction_cost_usd']:.6f})"
                )

                return IntentClassificationResult(
                    intent_type=cached_result["intent_type"],
                    buyer_stage=cached_result["buyer_stage"],
                    urgency_signal=cached_result["urgency_signal"],
                    classification_confidence=cached_result[
                        "classification_confidence"
                    ],
                    reasoning=cached_result["reasoning"],
                    extraction_cost_usd=0.0,  # Cache hit = 0 cost
                )

            logger.debug(
                f"Intent classification cache MISS for {intent_id} (query_hash={query_hash[:16]}...)"
            )

    except Exception as e:
        logger.warning(
            f"Cache lookup failed for {intent_id}: {e}. Proceeding with LLM call."
        )
        # Continue to LLM call on cache lookup failure

    # Build extraction client
    extraction_model = extraction_settings.extraction_model
    client = build_client(
        provider=extraction_model.provider,
        model_name=extraction_model.model_name,
        api_key=extraction_model.api_key,
        system_prompt="You are an expert at classifying user search intent for SEO and marketing analysis.",
        tools=[CLASSIFY_QUERY_INTENT_FUNCTION],
        tool_choice="required",  # FORCE function call
    )

    # Build prompt
    prompt = build_classification_prompt(query)

    try:
        # Call classification model
        logger.debug(
            f"Calling classification model {extraction_model.provider}/{extraction_model.model_name} "
            f"for intent {intent_id}"
        )
        response: LLMResponse = await client.generate_answer(prompt)

        # Parse function call result
        function_result = parse_classification_response(response)

        # Validate schema
        validate_intent_classification_response(function_result)

        logger.info(
            f"Intent classification succeeded for {intent_id}: "
            f"{function_result['intent_type']}/{function_result['buyer_stage']}/{function_result['urgency_signal']} "
            f"(confidence={function_result['classification_confidence']:.2f})"
        )

        # Store result in cache for future lookups
        try:
            with sqlite3.connect(db_path) as conn:
                store_intent_classification_cache(
                    conn=conn,
                    query_hash=query_hash,
                    query_text=query,
                    intent_type=function_result["intent_type"],
                    buyer_stage=function_result["buyer_stage"],
                    urgency_signal=function_result["urgency_signal"],
                    classification_confidence=function_result[
                        "classification_confidence"
                    ],
                    reasoning=function_result.get("reasoning"),
                    extraction_cost_usd=response.cost_usd,
                )
                conn.commit()
                logger.debug(
                    f"Stored classification result in cache for query_hash={query_hash[:16]}..."
                )
        except Exception as cache_error:
            logger.warning(
                f"Failed to cache classification result for {intent_id}: {cache_error}"
            )
            # Don't fail the classification if caching fails - just log warning

        return IntentClassificationResult(
            intent_type=function_result["intent_type"],
            buyer_stage=function_result["buyer_stage"],
            urgency_signal=function_result["urgency_signal"],
            classification_confidence=function_result["classification_confidence"],
            reasoning=function_result.get("reasoning"),
            extraction_cost_usd=response.cost_usd,
        )

    except Exception as e:
        logger.error(
            f"Intent classification failed for {intent_id}: {e}", exc_info=True
        )
        raise RuntimeError(f"Intent classification failed for {intent_id}: {e}") from e
