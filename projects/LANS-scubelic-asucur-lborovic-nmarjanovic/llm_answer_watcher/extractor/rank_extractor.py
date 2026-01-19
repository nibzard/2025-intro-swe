"""
Rank extraction for LLM Answer Watcher.

This module extracts ranked lists of brands/tools from LLM responses.
It supports pattern-based extraction (default) and optional LLM-assisted
extraction for more accurate rankings.

Pattern-based extraction looks for:
- Numbered lists: 1. ToolName, 2. ToolName
- Bullet lists: - ToolName, " ToolName
- Markdown headers: ## ToolName

LLM-assisted extraction (optional, v1 stub):
- Makes a second LLM call to extract structured rankings
- More accurate for conversational responses
- Disabled by default (cost/latency tradeoff)

Key features:
- Word-boundary matching to avoid false positives
- Fuzzy matching against known brands
- Confidence scoring (1.0 = clear numbered list, 0.3 = no structure)
- First-seen deduplication

Example:
    >>> known_brands = ["Warmly", "HubSpot", "Instantly"]
    >>> text = "1. Warmly\\n2. HubSpot\\n3. Instantly"
    >>> ranked, confidence = extract_ranked_list_pattern(text, known_brands)
    >>> ranked[0].brand_name
    'Warmly'
    >>> ranked[0].rank_position
    1
    >>> confidence
    1.0
"""

import re
from dataclasses import dataclass
from difflib import SequenceMatcher

from .mention_detector import create_brand_pattern

# ============================================================================
# CONSTANTS
# ============================================================================

# Fuzzy matching threshold for brand name similarity (0.0 - 1.0)
# Brands must be at least 80% similar to match using SequenceMatcher
# Lower values increase false positives, higher values miss valid matches
FUZZY_THRESHOLD = 0.8


@dataclass
class RankedBrand:
    """
    Represents a brand in a ranked list with position and confidence.

    Attributes:
        brand_name: Canonical brand name (from known_brands)
        rank_position: Position in ranked list (1 = top/first, 2 = second, etc.)
        confidence: Confidence score for this ranking (0.0-1.0)
    """

    brand_name: str
    rank_position: int
    confidence: float

    def __post_init__(self):
        """Validate rank_position and confidence ranges."""
        if self.rank_position < 1:
            raise ValueError(f"rank_position must be >= 1, got: {self.rank_position}")
        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError(
                f"confidence must be in range [0.0, 1.0], got: {self.confidence}"
            )


def extract_ranked_list_pattern(
    text: str, known_brands: list[str]
) -> tuple[list[RankedBrand], float]:
    """
    Extract ranked brand list from text using pattern-based detection.

    Looks for structured lists (numbered, bullets, headers) and matches
    candidate names against known_brands. Returns ranked brands with
    confidence score based on list structure quality.

    Pattern matching (in priority order):
    1. Numbered lists: "1. ToolName" / "1) ToolName" / "1 ToolName"
    2. Bullet lists: "- ToolName" / "" ToolName" / "* ToolName"
    3. Markdown headers: "## ToolName" / "### ToolName"
    4. Fallback: Mention order (lowest confidence)

    Args:
        text: LLM response text to extract rankings from
        known_brands: List of brand names to match against

    Returns:
        Tuple of (ranked_brands, overall_confidence):
        - ranked_brands: List of RankedBrand objects in rank order
        - overall_confidence: 1.0 (numbered), 0.8 (bullets), 0.5 (inferred), 0.3 (none)

    Example:
        >>> brands = ["Warmly", "HubSpot", "Instantly"]
        >>> text = "1. Warmly\\n2. HubSpot\\n3. Instantly"
        >>> ranked, conf = extract_ranked_list_pattern(text, brands)
        >>> len(ranked)
        3
        >>> ranked[0].brand_name
        'Warmly'
        >>> ranked[0].rank_position
        1
        >>> conf
        1.0

    Note:
        - Uses fuzzy matching (80% similarity threshold) if exact match fails
        - Deduplicates in first-seen order
        - Returns empty list if no brands detected
    """
    if not text or not known_brands:
        return ([], 0.3)

    # Try pattern-based extraction in priority order
    ranked, confidence = _extract_numbered_list(text, known_brands)
    if ranked:
        return (ranked, confidence)

    ranked, confidence = _extract_bullet_list(text, known_brands)
    if ranked:
        return (ranked, confidence)

    ranked, confidence = _extract_headers(text, known_brands)
    if ranked:
        return (ranked, confidence)

    # Fallback: Use mention order (lowest confidence)
    ranked, confidence = _extract_from_mention_order(text, known_brands)
    return (ranked, confidence)


def _extract_numbered_list(
    text: str, known_brands: list[str]
) -> tuple[list[RankedBrand], float]:
    """
    Extract brands from numbered list patterns.

    Patterns matched:
    - "1. ToolName" / "1) ToolName" / "1 ToolName"
    - "2. ToolName" / "2) ToolName" / "2 ToolName"

    Returns:
        (ranked_brands, 1.0) if numbered list found, else ([], 0.0)
    """
    # Pattern: number (with optional period/paren) followed by text
    # Captures: (number, content after number)
    pattern = r"^\s*(\d+)[\.\)]\s+(.+)$"

    ranked_brands = []
    seen_brands = set()

    for line in text.split("\n"):
        match = re.match(pattern, line)
        if not match:
            continue

        rank_num = int(match.group(1))
        candidate = match.group(2).strip()

        # Match candidate against known_brands
        matched_brand = _match_brand(candidate, known_brands)
        if matched_brand and matched_brand not in seen_brands:
            ranked_brands.append(
                RankedBrand(
                    brand_name=matched_brand,
                    rank_position=rank_num,
                    confidence=1.0,
                )
            )
            seen_brands.add(matched_brand)

    # Only return if we found numbered list items
    if ranked_brands:
        # Sort by rank_position to ensure proper order
        ranked_brands.sort(key=lambda b: b.rank_position)
        return (ranked_brands, 1.0)

    return ([], 0.0)


def _extract_bullet_list(
    text: str, known_brands: list[str]
) -> tuple[list[RankedBrand], float]:
    """
    Extract brands from bullet list patterns.

    Patterns matched:
    - "- ToolName"
    - "" ToolName"
    - "* ToolName"

    Returns:
        (ranked_brands, 0.8) if bullet list found, else ([], 0.0)
    """
    # Pattern: bullet marker followed by text
    pattern = r"^\s*[-•*]\s+(.+)$"

    ranked_brands = []
    seen_brands = set()
    rank_position = 1

    for line in text.split("\n"):
        match = re.match(pattern, line)
        if not match:
            continue

        candidate = match.group(1).strip()

        # Match candidate against known_brands
        matched_brand = _match_brand(candidate, known_brands)
        if matched_brand and matched_brand not in seen_brands:
            ranked_brands.append(
                RankedBrand(
                    brand_name=matched_brand,
                    rank_position=rank_position,
                    confidence=0.8,
                )
            )
            seen_brands.add(matched_brand)
            rank_position += 1

    # Only return if we found bullet list items
    if ranked_brands:
        return (ranked_brands, 0.8)

    return ([], 0.0)


def _extract_headers(
    text: str, known_brands: list[str]
) -> tuple[list[RankedBrand], float]:
    """
    Extract brands from markdown header patterns.

    Patterns matched:
    - "## ToolName"
    - "### ToolName"

    Returns:
        (ranked_brands, 0.8) if headers found, else ([], 0.0)
    """
    # Pattern: markdown headers (## or ###) followed by text
    pattern = r"^\s*#{2,3}\s+(.+)$"

    ranked_brands = []
    seen_brands = set()
    rank_position = 1

    for line in text.split("\n"):
        match = re.match(pattern, line)
        if not match:
            continue

        candidate = match.group(1).strip()

        # Match candidate against known_brands
        matched_brand = _match_brand(candidate, known_brands)
        if matched_brand and matched_brand not in seen_brands:
            ranked_brands.append(
                RankedBrand(
                    brand_name=matched_brand,
                    rank_position=rank_position,
                    confidence=0.8,
                )
            )
            seen_brands.add(matched_brand)
            rank_position += 1

    # Only return if we found header items
    if ranked_brands:
        return (ranked_brands, 0.8)

    return ([], 0.0)


def _extract_from_mention_order(
    text: str, known_brands: list[str]
) -> tuple[list[RankedBrand], float]:
    """
    Extract brands from mention order (fallback, lowest confidence).

    Finds all known brands in text and ranks by first occurrence position.

    Returns:
        (ranked_brands, 0.5) if brands found, else ([], 0.3)
    """
    # Find all brand mentions with positions
    mentions = []

    for brand in known_brands:
        # Use consistent word-boundary pattern from mention_detector
        pattern = create_brand_pattern(brand)
        match = pattern.search(text)
        if match:
            mentions.append((brand, match.start()))

    if not mentions:
        return ([], 0.3)

    # Sort by position, deduplicate, assign ranks
    mentions.sort(key=lambda x: x[1])

    ranked_brands = []
    seen_brands = set()
    rank_position = 1

    for brand, _ in mentions:
        if brand not in seen_brands:
            ranked_brands.append(
                RankedBrand(
                    brand_name=brand,
                    rank_position=rank_position,
                    confidence=0.5,
                )
            )
            seen_brands.add(brand)
            rank_position += 1

    return (ranked_brands, 0.5)


def _match_brand(candidate: str, known_brands: list[str]) -> str | None:
    """
    Match candidate text against known brands list.

    Uses exact match first, then fuzzy matching with FUZZY_THRESHOLD (0.8).

    Args:
        candidate: Text extracted from list item
        known_brands: List of known brand names

    Returns:
        Matched brand name from known_brands, or None if no match

    Note:
        Fuzzy matching threshold is defined by FUZZY_THRESHOLD constant (0.8).
        This can be adjusted if more lenient or strict matching is needed.
    """
    candidate_lower = candidate.lower()

    # Try exact match first
    for brand in known_brands:
        if brand.lower() in candidate_lower:
            return brand

    # Try fuzzy matching using FUZZY_THRESHOLD constant
    best_match = None
    best_ratio = 0.0

    for brand in known_brands:
        ratio = SequenceMatcher(None, candidate_lower, brand.lower()).ratio()
        if ratio > best_ratio and ratio >= FUZZY_THRESHOLD:
            best_ratio = ratio
            best_match = brand

    return best_match


def extract_ranked_list_llm(
    text: str, known_brands: list[str], client: object
) -> tuple[list[RankedBrand], float]:
    """
    Extract ranked brand list using LLM-assisted extraction (stub for v1).

    This method makes a second LLM call to extract structured rankings from
    conversational responses. More accurate than pattern-based extraction but
    slower and more expensive.

    Args:
        text: LLM response text to extract rankings from
        known_brands: List of brand names to match against
        client: LLM client instance (from llm_runner.models.LLMClient)

    Returns:
        Tuple of (ranked_brands, 0.95) on success, else falls back to pattern-based

    Note:
        This is a STUB implementation for v1. The method:
        1. Would build a structured extraction prompt
        2. Call LLM with prompt + text
        3. Parse JSON response
        4. Match against known_brands
        5. Return (ranked_list, 0.95)
        6. Fallback to pattern-based on any error

        Disabled by default in v1 due to cost/latency tradeoff.
        Set use_llm_rank_extraction: true in config to enable in future versions.

    Example prompt (not yet implemented):
        "From the following text, extract a ranked list of tools/products
        mentioned. Return ONLY a JSON array of tool names in rank order.
        Text: {text}"
    """
    # v1 stub: Always fall back to pattern-based extraction
    # Future implementation would:
    # 1. Build extraction prompt with text
    # 2. client.generate_answer(prompt)
    # 3. Parse JSON response
    # 4. Match against known_brands
    # 5. Return (ranked_list, 0.95)

    return extract_ranked_list_pattern(text, known_brands)
