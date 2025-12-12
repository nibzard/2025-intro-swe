"""
Brand mention detection for LLM Answer Watcher.

This module implements word-boundary regex matching to detect brand mentions
in LLM responses, avoiding false positives like "hub" matching in "GitHub".

Key features:
- Word-boundary matching (critical for accuracy)
- Case-insensitive detection
- Multiple aliases per brand support
- Structured mention data with position tracking
- Normalized brand names for deduplication
- Optional fuzzy matching for handling typos
- Overlapping match resolution (prefers longer matches)

Security:
- Always uses re.escape() to prevent regex injection
- Validates all inputs

Performance:
- Compiles regex patterns once for reuse
- Sorts results by position for deterministic output
"""

import re
from dataclasses import dataclass

from rapidfuzz import fuzz


@dataclass
class BrandMention:
    """
    Represents a detected brand mention in answer text.

    Attributes:
        original_text: How the brand appeared in the answer (preserves case)
        normalized_name: Canonical brand name (primary alias, first in list)
        brand_category: Either "mine" (our brand) or "competitor"
        match_position: Character offset where brand was found in text
        match_type: How the mention was matched - "exact" or "fuzzy"
        fuzzy_score: Similarity score if fuzzy matched (0-100), None if exact
        sentiment: Sentiment of mention ("positive", "neutral", "negative", None)
        mention_context: Context classification (None for regex extraction)
    """

    original_text: str
    normalized_name: str
    brand_category: str
    match_position: int
    match_type: str = "exact"
    fuzzy_score: float | None = None
    sentiment: str | None = None
    mention_context: str | None = None

    def __post_init__(self):
        """Validate brand_category and match_type are valid."""
        if self.brand_category not in ("mine", "competitor"):
            raise ValueError(
                f"brand_category must be 'mine' or 'competitor', "
                f"got: {self.brand_category}"
            )
        if self.match_type not in ("exact", "fuzzy"):
            raise ValueError(
                f"match_type must be 'exact' or 'fuzzy', got: {self.match_type}"
            )


def create_brand_pattern(alias: str) -> re.Pattern:
    """
    Create word-boundary regex pattern for brand alias matching.

    CRITICAL: Uses word boundaries to prevent false positives.
    - "HubSpot" matches in "I use HubSpot daily"
    - "hub" does NOT match in "GitHub"

    Security: Always escapes special regex characters to prevent injection.

    Args:
        alias: Brand alias to create pattern for (e.g., "HubSpot", "Warmly.io")

    Returns:
        Compiled regex pattern with word boundaries and case-insensitive flag

    Example:
        >>> pattern = create_brand_pattern("HubSpot")
        >>> bool(pattern.search("I recommend HubSpot"))
        True
        >>> bool(pattern.search("I use GitHub"))
        False
    """
    if not alias or alias.isspace():
        raise ValueError("Brand alias cannot be empty or whitespace")

    # SECURITY: Escape special regex characters before adding word boundaries
    escaped = re.escape(alias)

    # Add word boundaries to match whole words only
    pattern = r"\b" + escaped + r"\b"

    # Case-insensitive matching
    return re.compile(pattern, re.IGNORECASE)


def normalize_brand_name(brand_aliases: list[str]) -> str:
    """
    Get canonical brand name from brand aliases list.

    The primary brand name is the alphabetically first item in the list.
    This ensures deterministic normalization even if YAML order changes.

    CRITICAL: Config schema automatically sorts brand aliases alphabetically,
    so this function always receives a sorted list. The primary brand name
    is stable across config changes, preventing historical data inconsistencies.

    Args:
        brand_aliases: List of all aliases for this brand (pre-sorted alphabetically by config)

    Returns:
        Primary brand name (alphabetically first alias in list)

    Example:
        >>> normalize_brand_name(["HubSpot", "Hubspot", "hub spot"])  # Already sorted by config
        'HubSpot'
        >>> normalize_brand_name(["Warmly", "Warmly.io"])  # Already sorted by config
        'Warmly'
    """
    if not brand_aliases:
        raise ValueError("brand_aliases list cannot be empty")

    # Primary name is always the first alias (alphabetically due to config sorting)
    return brand_aliases[0]


def remove_overlapping_mentions(mentions: list[BrandMention]) -> list[BrandMention]:
    """
    Remove overlapping mentions, keeping the longest match.

    When two brand mentions overlap in position (e.g., "Hub" and "HubSpot" both
    matching at the same location), keep only the longer brand name. This prevents
    false positives where a substring brand matches within a longer brand name.

    Args:
        mentions: List of brand mentions (may contain overlaps)

    Returns:
        List of brand mentions with overlaps removed (prefers longer matches)

    Example:
        >>> mention1 = BrandMention("Hub", "Hub", "competitor", 10)
        >>> mention2 = BrandMention("HubSpot", "HubSpot", "competitor", 10)
        >>> result = remove_overlapping_mentions([mention1, mention2])
        >>> len(result)
        1
        >>> result[0].normalized_name
        'HubSpot'
    """
    if not mentions:
        return []

    # Sort by position first, then by length (longer first) for stable sorting
    sorted_mentions = sorted(
        mentions, key=lambda m: (m.match_position, -len(m.original_text))
    )

    # Remove overlapping mentions
    result = []
    for mention in sorted_mentions:
        # Check if this mention overlaps with any already-kept mention
        overlaps = False
        mention_end = mention.match_position + len(mention.original_text)

        for kept_mention in result:
            kept_end = kept_mention.match_position + len(kept_mention.original_text)

            # Check for overlap
            if (
                mention.match_position < kept_end
                and mention_end > kept_mention.match_position
            ):
                # Overlaps - keep the longer one
                if len(mention.original_text) > len(kept_mention.original_text):
                    # Replace kept mention with this longer one
                    result.remove(kept_mention)
                    result.append(mention)
                overlaps = True
                break

        if not overlaps:
            result.append(mention)

    # Re-sort by position for final output
    result.sort(key=lambda m: m.match_position)
    return result


def detect_mentions(
    answer_text: str,
    our_brands: list[str],
    competitor_brands: list[str],
    fuzzy_threshold: float = 0.0,
) -> list[BrandMention]:
    """
    Detect all brand mentions in LLM answer text using word-boundary matching.

    Uses regex with word boundaries to avoid false positives. Matches are
    case-insensitive but preserve original case in results. Optionally supports
    fuzzy matching for handling typos and misspellings.

    IMPORTANT: Each brand in both our_brands and competitor_brands is tracked
    SEPARATELY. If you have multiple products (e.g., ["ProductA", "ProductB"]),
    they will be treated as independent brands with separate tracking.

    Process:
    1. Create word-boundary patterns for all brands
    2. Search answer text for exact matches
    3. If fuzzy_threshold > 0, search for fuzzy matches in remaining text
    4. For each match:
       - Extract original text (preserving case)
       - Set normalized name (brand name itself)
       - Set category ("mine" or "competitor")
       - Record character position and match type
    5. Remove overlapping matches (prefer longer exact matches)
    6. Sort by position (order of appearance)

    Args:
        answer_text: Text from LLM response to search for mentions
        our_brands: List of brands representing "us" (each tracked separately)
        competitor_brands: List of competitor brands (each tracked separately)
        fuzzy_threshold: Minimum similarity score (0-100) for fuzzy matching.
            0 = disabled (default), 80-90 = recommended for typos.

    Returns:
        List of BrandMention objects sorted by appearance order (match_position)

    Example:
        >>> mentions = detect_mentions(
        ...     "I prefer HubSpot over Instantly for email warmup.",
        ...     our_brands=["Instantly"],
        ...     competitor_brands=["HubSpot", "Mailshake"]
        ... )
        >>> len(mentions)
        2
        >>> mentions[0].normalized_name
        'HubSpot'
        >>> mentions[0].brand_category
        'competitor'
        >>> mentions[1].normalized_name
        'Instantly'
        >>> mentions[1].brand_category
        'mine'

        # Multiple products tracked separately:
        >>> mentions = detect_mentions(
        ...     "Use ProductA or ProductB for best results.",
        ...     our_brands=["ProductA", "ProductB"],
        ...     competitor_brands=[]
        ... )
        >>> len(mentions)
        2
        >>> mentions[0].normalized_name
        'ProductA'
        >>> mentions[1].normalized_name
        'ProductB'
        >>> mentions[0].brand_category
        'mine'
        >>> mentions[1].brand_category
        'mine'

    Notes:
        - Empty answer_text returns empty list (not an error)
        - Only FIRST occurrence of each brand is kept (deduplicated by normalized_name)
        - If brand has multiple aliases, only one mention is returned
        - Word boundaries prevent "hub" from matching in "GitHub"
        - Case-insensitive: "hubspot", "HubSpot", "HUBSPOT" all match
    """
    # Handle empty input gracefully
    if not answer_text or answer_text.isspace():
        return []

    # Normalize empty lists
    our_brands = our_brands or []
    competitor_brands = competitor_brands or []

    # Build mapping of alias -> (primary_name, category, pattern)
    brand_patterns: list[tuple[str, str, str, re.Pattern]] = []

    # Add our brands (EACH is a SEPARATE brand tracked independently)
    for brand_name in our_brands:
        if not brand_name or brand_name.isspace():
            continue
        try:
            pattern = create_brand_pattern(brand_name)
            # Each "mine" brand is tracked separately (normalized name = itself)
            brand_patterns.append((brand_name, brand_name, "mine", pattern))
        except ValueError:
            # Skip invalid brand names
            continue

    # Add competitor brands (each is a SEPARATE brand tracked independently)
    for brand_name in competitor_brands:
        if not brand_name or brand_name.isspace():
            continue
        try:
            pattern = create_brand_pattern(brand_name)
            # Each competitor is tracked separately (normalized name = itself)
            brand_patterns.append((brand_name, brand_name, "competitor", pattern))
        except ValueError:
            # Skip invalid brand names
            continue

    # Find all matches
    all_matches: list[BrandMention] = []
    seen_brands: dict[
        str, BrandMention
    ] = {}  # Track first occurrence by normalized_name (case-insensitive)

    for _alias, primary_name, category, pattern in brand_patterns:
        # Find all occurrences of this alias
        for match in pattern.finditer(answer_text):
            # Get original text from answer (preserves case)
            original_text = match.group(0)
            match_position = match.start()

            # Deduplicate by normalized_name (case-insensitive) - keep only FIRST occurrence
            # Use lowercase for deduplication key so "HubSpot" and "Hubspot" are treated as same brand
            brand_key = primary_name.lower()

            if brand_key in seen_brands:
                # Already found this brand - keep the earlier occurrence
                existing_mention = seen_brands[brand_key]
                if match_position < existing_mention.match_position:
                    # This occurrence is earlier - replace it
                    # Use the PRIMARY_NAME that came first (preserve first pattern's normalization)
                    seen_brands[brand_key] = BrandMention(
                        original_text=original_text,
                        normalized_name=existing_mention.normalized_name,  # Keep first pattern's normalized name
                        brand_category=category,
                        match_position=match_position,
                    )
                # Skip if current occurrence is later
                continue

            # First time seeing this brand
            seen_brands[brand_key] = BrandMention(
                original_text=original_text,
                normalized_name=primary_name,
                brand_category=category,
                match_position=match_position,
            )

    # Fuzzy matching (optional) - only if threshold > 0 and no exact match found
    if fuzzy_threshold > 0:
        # Split text into words for fuzzy matching
        words = re.findall(r"\b\w+\b", answer_text)
        all_brands = [(name, name, "mine") for name in our_brands] + [
            (name, name, "competitor") for name in competitor_brands
        ]

        for word_match in re.finditer(r"\b\w+\b", answer_text):
            word = word_match.group(0)
            word_position = word_match.start()

            # Skip if this position already has an exact match
            if any(
                abs(m.match_position - word_position) < len(word)
                and m.match_type == "exact"
                for m in seen_brands.values()
            ):
                continue

            # Try fuzzy matching against all brands
            for brand_name, primary_name, category in all_brands:
                # Calculate similarity score
                score = fuzz.ratio(word.lower(), brand_name.lower())

                if score >= fuzzy_threshold:
                    brand_key = primary_name.lower()

                    # Only add if we don't have this brand already or this is a better match
                    if brand_key not in seen_brands:
                        seen_brands[brand_key] = BrandMention(
                            original_text=word,
                            normalized_name=primary_name,
                            brand_category=category,
                            match_position=word_position,
                            match_type="fuzzy",
                            fuzzy_score=score,
                        )
                        break  # Found a match, stop checking other brands for this word

    # Convert dict to list
    all_matches = list(seen_brands.values())

    # Remove overlapping mentions (prefers longer matches)
    all_matches = remove_overlapping_mentions(all_matches)

    # Sort by position for final output
    all_matches.sort(key=lambda m: m.match_position)

    return all_matches
