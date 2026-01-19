"""
Function calling schemas for LLM Answer Watcher.

This module defines OpenAI function calling schemas used for structured
brand mention extraction. Function calling provides higher accuracy and
lower latency compared to regex-based parsing.

Key benefits of function calling:
- Structured output (JSON schema validated by LLM)
- Context-aware extraction (understands variations and synonyms)
- Rank detection without regex patterns
- Confidence scoring built-in
- 40-50% latency reduction vs separate LLM calls

Security:
- Uses OpenAI Structured Outputs (strict=true) for schema adherence
- No code execution (pure data extraction)
- Validated against Pydantic models

Example:
    >>> from llm_runner.models import build_client
    >>> client = build_client(
    ...     provider="openai",
    ...     model_name="gpt-5-nano",
    ...     api_key="sk-...",
    ...     system_prompt="You are a brand extraction assistant",
    ...     tools=[EXTRACT_BRAND_MENTIONS_FUNCTION],
    ...     tool_choice="required"
    ... )
"""

# OpenAI Responses API function schema for brand mention extraction
# NOTE: This uses the Responses API format (internally-tagged)
# NOT the Chat Completions API format (externally-tagged with nested "function" key)
EXTRACT_BRAND_MENTIONS_FUNCTION = {
    "type": "function",
    "name": "extract_brand_mentions",
    "description": """Extract all brand/product mentions from the given text answer, along with their rank/position if the answer presents them in a ranked or ordered format.

CRITICAL INSTRUCTIONS:
- Include EVERY brand/product mentioned, even if briefly
- Assign rank=null if no clear ranking/ordering is present
- If brands are numbered (1. Brand, 2. Brand), use that as rank
- If brands appear in a list without numbers, assign rank by order of appearance
- Set confidence based on how explicitly the brand is mentioned:
  * "high": Brand explicitly recommended or discussed in detail
  * "medium": Brand mentioned as an option or alternative
  * "low": Brand mentioned in passing or tangentially
- Normalize brand names to their canonical form (e.g., "hubspot" -> "HubSpot")
- Extract context snippets showing where each brand was mentioned
- Classify sentiment for each mention (positive/neutral/negative)
- Identify the context type (how the brand is positioned in the answer)""",
    "parameters": {
        "type": "object",
        "properties": {
            "brands_mentioned": {
                "type": "array",
                "description": "List of all brands/products mentioned in the answer",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Canonical brand name (e.g., 'HubSpot', 'Instantly', 'Lemwarm')",
                        },
                        "rank": {
                            "anyOf": [
                                {"type": "integer", "minimum": 1},
                                {"type": "null"},
                            ],
                            "description": "Position in ranking (1=best, 2=second, etc.). Null if no clear ranking.",
                        },
                        "confidence": {
                            "type": "string",
                            "enum": ["high", "medium", "low"],
                            "description": "Confidence level for this mention based on explicitness",
                        },
                        "context_snippet": {
                            "type": "string",
                            "description": "Brief excerpt (max 100 chars) from answer showing where brand was mentioned",
                            "maxLength": 100,
                        },
                        "sentiment": {
                            "type": "string",
                            "enum": ["positive", "neutral", "negative"],
                            "description": "Sentiment of the mention: positive (recommendation/praise), neutral (factual listing), negative (criticism/warning)",
                        },
                        "mention_context": {
                            "type": "string",
                            "enum": [
                                "primary_recommendation",
                                "alternative_listing",
                                "competitor_negative",
                                "competitor_neutral",
                                "passing_reference",
                            ],
                            "description": "How the brand is positioned: primary_recommendation (top choice/main suggestion), alternative_listing (also consider/alternative option), competitor_negative (mentioned with criticism), competitor_neutral (mentioned as option without bias), passing_reference (brief/tangential mention)",
                        },
                    },
                    "required": [
                        "name",
                        "confidence",
                        "context_snippet",
                        "sentiment",
                        "mention_context",
                    ],
                    "additionalProperties": False,
                },
            },
            "extraction_notes": {
                "type": "string",
                "description": "Optional notes about the extraction (e.g., 'No clear ranking', 'Brands as equals')",
            },
        },
        "required": ["brands_mentioned"],
        "additionalProperties": False,
    },
}


# OpenAI Responses API function schema for intent classification
CLASSIFY_QUERY_INTENT_FUNCTION = {
    "type": "function",
    "name": "classify_query_intent",
    "description": """Classify the user query intent to prioritize which mentions matter most.

INTENT TYPES:
- transactional: User wants to buy/sign up NOW ("best CRM to buy", "which email tool should I purchase")
- informational: User wants to learn/understand ("what is CRM", "how does email warmup work")
- navigational: User wants a specific product/brand ("HubSpot pricing", "Lemwarm login")
- commercial_investigation: User is researching before buying ("CRM comparison", "HubSpot vs Salesforce")

BUYER STAGES:
- awareness: User is discovering the problem/solution space
- consideration: User is evaluating options and alternatives
- decision: User is ready to make a purchase decision

URGENCY SIGNALS:
- high: Words like "now", "today", "immediately", "urgent", "ASAP"
- medium: Words like "soon", "this week", "planning to"
- low: General inquiry, no time pressure""",
    "parameters": {
        "type": "object",
        "properties": {
            "intent_type": {
                "type": "string",
                "enum": [
                    "transactional",
                    "informational",
                    "navigational",
                    "commercial_investigation",
                ],
                "description": "Primary intent of the query based on user's goal",
            },
            "buyer_stage": {
                "type": "string",
                "enum": ["awareness", "consideration", "decision"],
                "description": "Buyer journey stage based on query phrasing and specificity",
            },
            "urgency_signal": {
                "type": "string",
                "enum": ["high", "medium", "low"],
                "description": "Urgency level based on time-sensitive words and phrasing",
            },
            "classification_confidence": {
                "type": "number",
                "minimum": 0.0,
                "maximum": 1.0,
                "description": "Confidence score for this classification (0.0-1.0)",
            },
            "reasoning": {
                "type": "string",
                "description": "Brief explanation of why this classification was chosen (max 200 chars)",
                "maxLength": 200,
            },
        },
        "required": [
            "intent_type",
            "buyer_stage",
            "urgency_signal",
            "classification_confidence",
        ],
        "additionalProperties": False,
    },
}


def validate_function_response(function_result: dict) -> bool:
    """
    Validate function calling response matches expected schema.

    Args:
        function_result: Parsed function call result from LLM

    Returns:
        True if valid, raises ValueError if invalid

    Raises:
        ValueError: If schema validation fails

    Example:
        >>> result = {"brands_mentioned": [...], "extraction_notes": "..."}
        >>> validate_function_response(result)
        True
    """
    # Check required top-level fields
    if "brands_mentioned" not in function_result:
        raise ValueError("Missing required field: brands_mentioned")

    if not isinstance(function_result["brands_mentioned"], list):
        raise ValueError("brands_mentioned must be a list")

    # Validate each brand mention
    for i, mention in enumerate(function_result["brands_mentioned"]):
        if not isinstance(mention, dict):
            raise ValueError(f"Brand mention {i} must be a dict")

        # Check required fields
        if "name" not in mention:
            raise ValueError(f"Brand mention {i} missing required field: name")

        if "confidence" not in mention:
            raise ValueError(f"Brand mention {i} missing required field: confidence")

        if "context_snippet" not in mention:
            raise ValueError(
                f"Brand mention {i} missing required field: context_snippet"
            )

        if "sentiment" not in mention:
            raise ValueError(f"Brand mention {i} missing required field: sentiment")

        if "mention_context" not in mention:
            raise ValueError(
                f"Brand mention {i} missing required field: mention_context"
            )

        # Validate confidence values
        if mention["confidence"] not in {"high", "medium", "low"}:
            raise ValueError(
                f"Brand mention {i} has invalid confidence: {mention['confidence']}"
            )

        # Validate sentiment values
        if mention["sentiment"] not in {"positive", "neutral", "negative"}:
            raise ValueError(
                f"Brand mention {i} has invalid sentiment: {mention['sentiment']}"
            )

        # Validate mention_context values
        valid_contexts = {
            "primary_recommendation",
            "alternative_listing",
            "competitor_negative",
            "competitor_neutral",
            "passing_reference",
        }
        if mention["mention_context"] not in valid_contexts:
            raise ValueError(
                f"Brand mention {i} has invalid mention_context: {mention['mention_context']}"
            )

        # Validate rank if present
        if (
            "rank" in mention
            and mention["rank"] is not None
            and (not isinstance(mention["rank"], int) or mention["rank"] < 1)
        ):
            raise ValueError(f"Brand mention {i} has invalid rank: {mention['rank']}")

    return True


def validate_intent_classification_response(function_result: dict) -> bool:
    """
    Validate intent classification response matches expected schema.

    Args:
        function_result: Parsed function call result from LLM

    Returns:
        True if valid, raises ValueError if invalid

    Raises:
        ValueError: If schema validation fails

    Example:
        >>> result = {
        ...     "intent_type": "transactional",
        ...     "buyer_stage": "decision",
        ...     "urgency_signal": "high",
        ...     "classification_confidence": 0.92
        ... }
        >>> validate_intent_classification_response(result)
        True
    """
    # Check required fields
    required_fields = [
        "intent_type",
        "buyer_stage",
        "urgency_signal",
        "classification_confidence",
    ]
    for field in required_fields:
        if field not in function_result:
            raise ValueError(f"Missing required field: {field}")

    # Validate intent_type
    valid_intent_types = {
        "transactional",
        "informational",
        "navigational",
        "commercial_investigation",
    }
    if function_result["intent_type"] not in valid_intent_types:
        raise ValueError(
            f"Invalid intent_type: {function_result['intent_type']}. "
            f"Must be one of: {valid_intent_types}"
        )

    # Validate buyer_stage
    valid_buyer_stages = {"awareness", "consideration", "decision"}
    if function_result["buyer_stage"] not in valid_buyer_stages:
        raise ValueError(
            f"Invalid buyer_stage: {function_result['buyer_stage']}. "
            f"Must be one of: {valid_buyer_stages}"
        )

    # Validate urgency_signal
    valid_urgency_signals = {"high", "medium", "low"}
    if function_result["urgency_signal"] not in valid_urgency_signals:
        raise ValueError(
            f"Invalid urgency_signal: {function_result['urgency_signal']}. "
            f"Must be one of: {valid_urgency_signals}"
        )

    # Validate classification_confidence
    confidence = function_result["classification_confidence"]
    if not isinstance(confidence, (int, float)) or confidence < 0.0 or confidence > 1.0:
        raise ValueError(
            f"Invalid classification_confidence: {confidence}. Must be a number between 0.0 and 1.0"
        )

    return True
