"""
Built-in function calling templates for common operation patterns.

This module provides pre-built OpenAI function calling schemas that can be
referenced in operation configurations using the function_template field.
This reduces boilerplate and ensures consistent schema definitions.

Available templates:
    - extract_features: Extract product features mentioned in text
    - analyze_brand_sentiment: Analyze sentiment for each brand mention
    - generate_action_items: Generate prioritized action items
    - extract_pricing: Extract pricing information for products
    - identify_gaps: Identify competitive gaps and opportunities
    - classify_mentions: Classify mention types and contexts

Usage in config:
    operations:
      - id: "extract-features"
        type: "structured"
        function_template: "extract_features"  # Reference template
        prompt: "Extract features from: {intent:response}"

Example with parameter overrides:
    operations:
      - id: "generate-actions"
        type: "structured"
        function_template: "generate_action_items"
        function_params:
          max_items: 5  # Override default max_items
        prompt: "Generate action items..."
"""

# Template: Extract product features
EXTRACT_FEATURES_TEMPLATE = {
    "type": "function",
    "name": "extract_features",
    "description": """Extract product features mentioned in the text.

    Identifies specific features, capabilities, and characteristics mentioned
    for each product or tool in the response. Useful for competitive analysis
    and feature gap identification.""",
    "parameters": {
        "type": "object",
        "properties": {
            "products": {
                "type": "array",
                "description": "List of products/tools with their mentioned features",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Product or tool name",
                        },
                        "features": {
                            "type": "array",
                            "description": "List of features explicitly mentioned",
                            "items": {"type": "string"},
                        },
                        "pricing_mentioned": {
                            "type": "boolean",
                            "description": "Whether pricing information was mentioned",
                        },
                        "integrations": {
                            "type": "array",
                            "description": "Integrations or compatible tools mentioned",
                            "items": {"type": "string"},
                        },
                    },
                    "required": ["name", "features", "pricing_mentioned"],
                    "additionalProperties": False,
                },
            }
        },
        "required": ["products"],
        "additionalProperties": False,
    },
}

# Template: Analyze brand sentiment
ANALYZE_BRAND_SENTIMENT_TEMPLATE = {
    "type": "function",
    "name": "analyze_sentiment",
    "description": """Analyze sentiment for each brand mention in the text.

    Evaluates how positively or negatively each brand is discussed,
    with confidence scores and reasoning. Useful for tracking brand
    perception across LLM responses.""",
    "parameters": {
        "type": "object",
        "properties": {
            "brand_sentiments": {
                "type": "array",
                "description": "Sentiment analysis for each brand mentioned",
                "items": {
                    "type": "object",
                    "properties": {
                        "brand": {
                            "type": "string",
                            "description": "Brand name",
                        },
                        "sentiment": {
                            "type": "string",
                            "enum": [
                                "very_positive",
                                "positive",
                                "neutral",
                                "negative",
                                "very_negative",
                            ],
                            "description": "Overall sentiment of the mention",
                        },
                        "confidence": {
                            "type": "number",
                            "minimum": 0.0,
                            "maximum": 1.0,
                            "description": "Confidence in sentiment classification (0.0-1.0)",
                        },
                        "reasoning": {
                            "type": "string",
                            "maxLength": 200,
                            "description": "Brief explanation of sentiment classification",
                        },
                        "key_phrases": {
                            "type": "array",
                            "description": "Key phrases that influenced sentiment",
                            "items": {"type": "string"},
                        },
                    },
                    "required": ["brand", "sentiment", "confidence"],
                    "additionalProperties": False,
                },
            }
        },
        "required": ["brand_sentiments"],
        "additionalProperties": False,
    },
}

# Template: Generate action items
GENERATE_ACTION_ITEMS_TEMPLATE = {
    "type": "function",
    "name": "generate_actions",
    "description": """Generate prioritized action items based on analysis.

    Creates specific, actionable tasks with priority levels, team assignments,
    and estimated impact. Useful for converting insights into concrete next steps.""",
    "parameters": {
        "type": "object",
        "properties": {
            "action_items": {
                "type": "array",
                "description": "List of prioritized action items",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {
                            "type": "string",
                            "description": "Clear, actionable title for the task",
                        },
                        "priority": {
                            "type": "integer",
                            "minimum": 1,
                            "maximum": 5,
                            "description": "Priority level (1=highest, 5=lowest)",
                        },
                        "team": {
                            "type": "string",
                            "enum": ["product", "marketing", "sales", "engineering", "leadership"],
                            "description": "Team responsible for this action",
                        },
                        "estimated_effort": {
                            "type": "string",
                            "enum": ["low", "medium", "high"],
                            "description": "Estimated effort required",
                        },
                        "impact": {
                            "type": "string",
                            "enum": ["high", "medium", "low"],
                            "description": "Expected impact on goals",
                        },
                        "timeframe": {
                            "type": "string",
                            "description": "Suggested timeframe (e.g., 'This week', 'Q1 2025')",
                        },
                    },
                    "required": ["title", "priority", "team", "impact"],
                    "additionalProperties": False,
                },
                "minItems": 1,
                "maxItems": 10,
            }
        },
        "required": ["action_items"],
        "additionalProperties": False,
    },
}

# Template: Extract pricing information
EXTRACT_PRICING_TEMPLATE = {
    "type": "function",
    "name": "extract_pricing",
    "description": """Extract pricing information mentioned for products.

    Identifies pricing details, tiers, and models mentioned in the text.
    Useful for competitive pricing analysis.""",
    "parameters": {
        "type": "object",
        "properties": {
            "pricing_info": {
                "type": "array",
                "description": "Pricing details for each product",
                "items": {
                    "type": "object",
                    "properties": {
                        "brand": {
                            "type": "string",
                            "description": "Product or brand name",
                        },
                        "has_free_tier": {
                            "type": "boolean",
                            "description": "Whether a free tier/trial was mentioned",
                        },
                        "starting_price": {
                            "type": "number",
                            "description": "Starting price if mentioned (numeric value only)",
                        },
                        "currency": {
                            "type": "string",
                            "description": "Currency code (e.g., 'USD', 'EUR')",
                        },
                        "pricing_model": {
                            "type": "string",
                            "enum": [
                                "per_user",
                                "per_email",
                                "per_contact",
                                "flat_rate",
                                "usage_based",
                                "unknown",
                            ],
                            "description": "Pricing model type",
                        },
                        "notes": {
                            "type": "string",
                            "description": "Additional pricing notes or details",
                        },
                    },
                    "required": ["brand", "has_free_tier"],
                    "additionalProperties": False,
                },
            }
        },
        "required": ["pricing_info"],
        "additionalProperties": False,
    },
}

# Template: Identify competitive gaps
IDENTIFY_GAPS_TEMPLATE = {
    "type": "function",
    "name": "identify_gaps",
    "description": """Identify competitive gaps and unique strengths.

    Analyzes what competitors have that we're missing, and what makes us unique.
    Useful for product roadmap planning and positioning.""",
    "parameters": {
        "type": "object",
        "properties": {
            "our_brand": {
                "type": "string",
                "description": "Our brand name",
            },
            "feature_gaps": {
                "type": "array",
                "description": "Features competitors have that we lack",
                "items": {
                    "type": "object",
                    "properties": {
                        "feature": {
                            "type": "string",
                            "description": "Missing feature or capability",
                        },
                        "offered_by": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Competitors offering this feature",
                        },
                        "priority": {
                            "type": "string",
                            "enum": ["high", "medium", "low"],
                            "description": "Priority for adding this feature",
                        },
                        "reasoning": {
                            "type": "string",
                            "description": "Why this priority level",
                        },
                    },
                    "required": ["feature", "offered_by", "priority"],
                    "additionalProperties": False,
                },
            },
            "unique_strengths": {
                "type": "array",
                "description": "Features or aspects where we're unique/better",
                "items": {"type": "string"},
            },
            "positioning_opportunities": {
                "type": "array",
                "description": "Strategic positioning opportunities identified",
                "items": {
                    "type": "object",
                    "properties": {
                        "opportunity": {"type": "string"},
                        "rationale": {"type": "string"},
                    },
                    "required": ["opportunity"],
                },
            },
        },
        "required": ["our_brand", "feature_gaps", "unique_strengths"],
        "additionalProperties": False,
    },
}

# Template: Classify mention types
CLASSIFY_MENTIONS_TEMPLATE = {
    "type": "function",
    "name": "classify_mentions",
    "description": """Classify how each brand is mentioned in the text.

    Categorizes mentions by type (primary recommendation, alternative, etc.)
    and context. Useful for understanding positioning in LLM responses.""",
    "parameters": {
        "type": "object",
        "properties": {
            "mention_classifications": {
                "type": "array",
                "description": "Classification for each brand mention",
                "items": {
                    "type": "object",
                    "properties": {
                        "brand": {
                            "type": "string",
                            "description": "Brand name",
                        },
                        "mention_type": {
                            "type": "string",
                            "enum": [
                                "primary_recommendation",
                                "top_alternative",
                                "alternative_option",
                                "specialized_use_case",
                                "negative_example",
                                "passing_reference",
                            ],
                            "description": "How the brand is positioned",
                        },
                        "use_case_context": {
                            "type": "string",
                            "description": "Specific use case or context for this mention",
                        },
                        "confidence": {
                            "type": "number",
                            "minimum": 0.0,
                            "maximum": 1.0,
                            "description": "Classification confidence",
                        },
                    },
                    "required": ["brand", "mention_type", "confidence"],
                    "additionalProperties": False,
                },
            }
        },
        "required": ["mention_classifications"],
        "additionalProperties": False,
    },
}

# Registry of all available templates
FUNCTION_TEMPLATES: dict[str, dict] = {
    "extract_features": EXTRACT_FEATURES_TEMPLATE,
    "analyze_brand_sentiment": ANALYZE_BRAND_SENTIMENT_TEMPLATE,
    "generate_action_items": GENERATE_ACTION_ITEMS_TEMPLATE,
    "extract_pricing": EXTRACT_PRICING_TEMPLATE,
    "identify_gaps": IDENTIFY_GAPS_TEMPLATE,
    "classify_mentions": CLASSIFY_MENTIONS_TEMPLATE,
}


def load_function_template(template_name: str) -> dict:
    """
    Load built-in function template by name.

    Args:
        template_name: Name of the template to load

    Returns:
        Function calling schema dict (copy, safe to modify)

    Raises:
        ValueError: If template_name not found

    Example:
        >>> schema = load_function_template("extract_features")
        >>> schema["name"]
        'extract_features'
    """
    if template_name not in FUNCTION_TEMPLATES:
        available = ", ".join(sorted(FUNCTION_TEMPLATES.keys()))
        raise ValueError(
            f"Unknown function template: '{template_name}'. "
            f"Available templates: {available}"
        )

    # Return a copy so caller can modify without affecting original
    return FUNCTION_TEMPLATES[template_name].copy()


def apply_function_params(schema: dict, params: dict) -> dict:
    """
    Apply parameter overrides to a function schema.

    Allows users to override specific schema properties via function_params
    in their operation configuration.

    Currently supported overrides:
        - max_items: Override maxItems for array properties
        - min_items: Override minItems for array properties

    Args:
        schema: Base function schema
        params: Parameter overrides

    Returns:
        Modified schema with overrides applied

    Example:
        >>> schema = load_function_template("generate_action_items")
        >>> modified = apply_function_params(schema, {"max_items": 5})
        >>> modified["parameters"]["properties"]["action_items"]["maxItems"]
        5
    """
    # Deep copy to avoid modifying original
    import copy

    result = copy.deepcopy(schema)

    # Apply max_items override if specified
    if "max_items" in params:
        # Find first array property and apply maxItems
        props = result.get("parameters", {}).get("properties", {})
        for prop_value in props.values():
            if prop_value.get("type") == "array":
                prop_value["maxItems"] = params["max_items"]
                break

    # Apply min_items override if specified
    if "min_items" in params:
        # Find first array property and apply minItems
        props = result.get("parameters", {}).get("properties", {})
        for prop_value in props.values():
            if prop_value.get("type") == "array":
                prop_value["minItems"] = params["min_items"]
                break

    return result


def list_available_templates() -> list[str]:
    """
    Get list of all available function template names.

    Returns:
        Sorted list of template names

    Example:
        >>> templates = list_available_templates()
        >>> "extract_features" in templates
        True
    """
    return sorted(FUNCTION_TEMPLATES.keys())
