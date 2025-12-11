"""
Tests for llm_answer_watcher.extractor.rank_extractor module.

This test suite validates the pattern-based rank extraction system, including:
- Numbered list extraction (1. ToolName, 2. ToolName)
- Bullet list extraction (-, •, *)
- Markdown header extraction (##, ###)
- Mention order fallback (lowest confidence)
- Fuzzy matching against known brands
- Deduplication and confidence scoring
- Edge cases and error handling

Test coverage targets:
- extract_ranked_list_pattern() - main entry point
- _extract_numbered_list() - numbered list patterns
- _extract_bullet_list() - bullet patterns
- _extract_headers() - markdown headers
- _extract_from_mention_order() - fallback extraction
- _match_brand() - fuzzy brand matching
- RankedBrand dataclass validation
"""

import pytest

from llm_answer_watcher.extractor.rank_extractor import (
    RankedBrand,
    _extract_bullet_list,
    _extract_from_mention_order,
    _extract_headers,
    _extract_numbered_list,
    _match_brand,
    extract_ranked_list_pattern,
)

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def known_brands() -> list[str]:
    """Standard list of known brands for testing."""
    return ["Warmly", "HubSpot", "Instantly", "Lemlist", "Outreach"]


@pytest.fixture
def numbered_list_text() -> str:
    """Sample text with numbered list structure."""
    return """
Here are the best email warmup tools:

1. Warmly
2. HubSpot
3. Instantly

These are the top choices for 2025.
""".strip()


@pytest.fixture
def bullet_list_text() -> str:
    """Sample text with bullet list structure."""
    return """
Best email warmup tools:

- Warmly
- HubSpot
- Instantly

All great options.
""".strip()


@pytest.fixture
def markdown_headers_text() -> str:
    """Sample text with markdown header structure."""
    return """
## Warmly

Warmly is the top choice for email warmup.

## HubSpot

HubSpot offers comprehensive email tools.

## Instantly

Instantly provides fast warmup capabilities.
""".strip()


@pytest.fixture
def conversational_text() -> str:
    """Sample text with no clear structure (conversational)."""
    return """
I'd recommend checking out Warmly first, as it has the best features.
You might also want to look at HubSpot and Instantly.
Lemlist is another solid option if you need more customization.
""".strip()


# ============================================================================
# RankedBrand Dataclass Tests
# ============================================================================


def test_ranked_brand_valid_creation():
    """Test RankedBrand creation with valid parameters."""
    brand = RankedBrand(brand_name="Warmly", rank_position=1, confidence=1.0)

    assert brand.brand_name == "Warmly"
    assert brand.rank_position == 1
    assert brand.confidence == 1.0


def test_ranked_brand_invalid_rank_position():
    """Test RankedBrand validation rejects rank_position < 1."""
    with pytest.raises(ValueError, match="rank_position must be >= 1"):
        RankedBrand(brand_name="Warmly", rank_position=0, confidence=1.0)

    with pytest.raises(ValueError, match="rank_position must be >= 1"):
        RankedBrand(brand_name="Warmly", rank_position=-1, confidence=1.0)


def test_ranked_brand_invalid_confidence():
    """Test RankedBrand validation rejects confidence outside [0.0, 1.0]."""
    with pytest.raises(ValueError, match="confidence must be in range"):
        RankedBrand(brand_name="Warmly", rank_position=1, confidence=-0.1)

    with pytest.raises(ValueError, match="confidence must be in range"):
        RankedBrand(brand_name="Warmly", rank_position=1, confidence=1.5)


def test_ranked_brand_boundary_confidence():
    """Test RankedBrand accepts boundary confidence values (0.0, 1.0)."""
    brand_min = RankedBrand(brand_name="Warmly", rank_position=1, confidence=0.0)
    brand_max = RankedBrand(brand_name="Warmly", rank_position=1, confidence=1.0)

    assert brand_min.confidence == 0.0
    assert brand_max.confidence == 1.0


# ============================================================================
# Numbered List Extraction Tests
# ============================================================================


def test_extract_numbered_list_basic(numbered_list_text, known_brands):
    """Test extraction of numbered list with clear structure."""
    ranked, confidence = _extract_numbered_list(numbered_list_text, known_brands)

    assert len(ranked) == 3
    assert confidence == 1.0

    assert ranked[0].brand_name == "Warmly"
    assert ranked[0].rank_position == 1
    assert ranked[0].confidence == 1.0

    assert ranked[1].brand_name == "HubSpot"
    assert ranked[1].rank_position == 2

    assert ranked[2].brand_name == "Instantly"
    assert ranked[2].rank_position == 3


def test_extract_numbered_list_with_parentheses():
    """Test numbered list with parentheses format (1) ToolName)."""
    text = """
1) Warmly
2) HubSpot
3) Instantly
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly"]
    ranked, confidence = _extract_numbered_list(text, known_brands)

    assert len(ranked) == 3
    assert confidence == 1.0
    assert ranked[0].brand_name == "Warmly"


def test_extract_numbered_list_out_of_order():
    """Test numbered list handles out-of-order numbers (sorts by rank_position)."""
    text = """
3. Instantly
1. Warmly
2. HubSpot
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly"]
    ranked, confidence = _extract_numbered_list(text, known_brands)

    assert len(ranked) == 3
    # Should be sorted by rank_position
    assert ranked[0].rank_position == 1
    assert ranked[0].brand_name == "Warmly"
    assert ranked[1].rank_position == 2
    assert ranked[1].brand_name == "HubSpot"
    assert ranked[2].rank_position == 3
    assert ranked[2].brand_name == "Instantly"


def test_extract_numbered_list_with_descriptions():
    """Test numbered list with additional text after brand name."""
    text = """
1. Warmly - The best email warmup tool for sales teams
2. HubSpot - Comprehensive marketing platform with email features
3. Instantly - Fast and reliable email warmup service
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly"]
    ranked, confidence = _extract_numbered_list(text, known_brands)

    assert len(ranked) == 3
    assert ranked[0].brand_name == "Warmly"
    assert ranked[1].brand_name == "HubSpot"
    assert ranked[2].brand_name == "Instantly"


def test_extract_numbered_list_deduplication():
    """Test numbered list deduplicates repeated brands (first-seen wins)."""
    text = """
1. Warmly
2. HubSpot
3. Warmly
4. Instantly
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly"]
    ranked, confidence = _extract_numbered_list(text, known_brands)

    # Should only include Warmly once (at position 1)
    assert len(ranked) == 3
    assert ranked[0].brand_name == "Warmly"
    assert ranked[0].rank_position == 1
    assert ranked[1].brand_name == "HubSpot"
    assert ranked[2].brand_name == "Instantly"


def test_extract_numbered_list_unknown_brands_ignored():
    """Test numbered list ignores brands not in known_brands."""
    text = """
1. Warmly
2. UnknownTool
3. HubSpot
4. AnotherUnknown
5. Instantly
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly"]
    ranked, confidence = _extract_numbered_list(text, known_brands)

    # Should only match known brands
    assert len(ranked) == 3
    assert ranked[0].brand_name == "Warmly"
    assert ranked[1].brand_name == "HubSpot"
    assert ranked[2].brand_name == "Instantly"


def test_extract_numbered_list_no_matches():
    """Test numbered list returns empty when no brands match."""
    text = """
1. UnknownTool
2. AnotherUnknown
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly"]
    ranked, confidence = _extract_numbered_list(text, known_brands)

    assert len(ranked) == 0
    assert confidence == 0.0


def test_extract_numbered_list_empty_text():
    """Test numbered list handles empty text gracefully."""
    ranked, confidence = _extract_numbered_list("", ["Warmly"])

    assert len(ranked) == 0
    assert confidence == 0.0


# ============================================================================
# Bullet List Extraction Tests
# ============================================================================


def test_extract_bullet_list_basic(bullet_list_text, known_brands):
    """Test extraction of bullet list with hyphen markers."""
    ranked, confidence = _extract_bullet_list(bullet_list_text, known_brands)

    assert len(ranked) == 3
    assert confidence == 0.8

    assert ranked[0].brand_name == "Warmly"
    assert ranked[0].rank_position == 1
    assert ranked[0].confidence == 0.8

    assert ranked[1].brand_name == "HubSpot"
    assert ranked[1].rank_position == 2

    assert ranked[2].brand_name == "Instantly"
    assert ranked[2].rank_position == 3


def test_extract_bullet_list_with_asterisks():
    """Test bullet list with asterisk markers (* ToolName)."""
    text = """
* Warmly
* HubSpot
* Instantly
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly"]
    ranked, confidence = _extract_bullet_list(text, known_brands)

    assert len(ranked) == 3
    assert confidence == 0.8
    assert ranked[0].brand_name == "Warmly"


def test_extract_bullet_list_with_unicode_bullets():
    """Test bullet list with unicode bullet markers (• ToolName)."""
    text = """
• Warmly
• HubSpot
• Instantly
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly"]
    ranked, confidence = _extract_bullet_list(text, known_brands)

    assert len(ranked) == 3
    assert confidence == 0.8
    assert ranked[0].brand_name == "Warmly"


def test_extract_bullet_list_mixed_bullets():
    """Test bullet list handles mixed bullet types in same text."""
    text = """
- Warmly
* HubSpot
• Instantly
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly"]
    ranked, confidence = _extract_bullet_list(text, known_brands)

    assert len(ranked) == 3
    assert ranked[0].brand_name == "Warmly"
    assert ranked[1].brand_name == "HubSpot"
    assert ranked[2].brand_name == "Instantly"


def test_extract_bullet_list_with_descriptions():
    """Test bullet list with additional text after brand name."""
    text = """
- Warmly - Best for sales teams
- HubSpot - Marketing automation
- Instantly - Fast warmup
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly"]
    ranked, confidence = _extract_bullet_list(text, known_brands)

    assert len(ranked) == 3
    assert ranked[0].brand_name == "Warmly"
    assert ranked[1].brand_name == "HubSpot"
    assert ranked[2].brand_name == "Instantly"


def test_extract_bullet_list_deduplication():
    """Test bullet list deduplicates repeated brands."""
    text = """
- Warmly
- HubSpot
- Warmly
- Instantly
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly"]
    ranked, confidence = _extract_bullet_list(text, known_brands)

    assert len(ranked) == 3
    assert ranked[0].brand_name == "Warmly"
    assert ranked[1].brand_name == "HubSpot"
    assert ranked[2].brand_name == "Instantly"


def test_extract_bullet_list_no_matches():
    """Test bullet list returns empty when no brands match."""
    text = """
- UnknownTool
- AnotherUnknown
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly"]
    ranked, confidence = _extract_bullet_list(text, known_brands)

    assert len(ranked) == 0
    assert confidence == 0.0


# ============================================================================
# Markdown Headers Extraction Tests
# ============================================================================


def test_extract_headers_basic(markdown_headers_text, known_brands):
    """Test extraction of markdown headers (## ToolName)."""
    ranked, confidence = _extract_headers(markdown_headers_text, known_brands)

    assert len(ranked) == 3
    assert confidence == 0.8

    assert ranked[0].brand_name == "Warmly"
    assert ranked[0].rank_position == 1
    assert ranked[0].confidence == 0.8

    assert ranked[1].brand_name == "HubSpot"
    assert ranked[1].rank_position == 2

    assert ranked[2].brand_name == "Instantly"
    assert ranked[2].rank_position == 3


def test_extract_headers_h3_level():
    """Test extraction of H3 markdown headers (### ToolName)."""
    text = """
### Warmly
Description here.

### HubSpot
Description here.

### Instantly
Description here.
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly"]
    ranked, confidence = _extract_headers(text, known_brands)

    assert len(ranked) == 3
    assert confidence == 0.8
    assert ranked[0].brand_name == "Warmly"


def test_extract_headers_mixed_levels():
    """Test extraction handles mixed H2 and H3 headers."""
    text = """
## Warmly
Description here.

### HubSpot
Description here.

## Instantly
Description here.
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly"]
    ranked, confidence = _extract_headers(text, known_brands)

    assert len(ranked) == 3
    assert ranked[0].brand_name == "Warmly"
    assert ranked[1].brand_name == "HubSpot"
    assert ranked[2].brand_name == "Instantly"


def test_extract_headers_ignores_h1():
    """Test extraction ignores H1 headers (# Title)."""
    text = """
# Main Title

## Warmly
Description here.

## HubSpot
Description here.
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly"]
    ranked, confidence = _extract_headers(text, known_brands)

    # Should only match H2/H3, not H1
    assert len(ranked) == 2
    assert ranked[0].brand_name == "Warmly"
    assert ranked[1].brand_name == "HubSpot"


def test_extract_headers_deduplication():
    """Test headers deduplicates repeated brands."""
    text = """
## Warmly
First mention.

## HubSpot
Second mention.

## Warmly
Duplicate mention.
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly"]
    ranked, confidence = _extract_headers(text, known_brands)

    assert len(ranked) == 2
    assert ranked[0].brand_name == "Warmly"
    assert ranked[1].brand_name == "HubSpot"


def test_extract_headers_no_matches():
    """Test headers returns empty when no brands match."""
    text = """
## UnknownTool
Description here.

## AnotherUnknown
Description here.
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly"]
    ranked, confidence = _extract_headers(text, known_brands)

    assert len(ranked) == 0
    assert confidence == 0.0


# ============================================================================
# Mention Order Fallback Tests
# ============================================================================


def test_extract_from_mention_order_basic(conversational_text, known_brands):
    """Test extraction from mention order in conversational text."""
    ranked, confidence = _extract_from_mention_order(conversational_text, known_brands)

    assert len(ranked) >= 3  # At least Warmly, HubSpot, Instantly
    assert confidence == 0.5

    # Check that brands appear in order of first mention
    assert ranked[0].brand_name == "Warmly"
    assert ranked[0].rank_position == 1
    assert ranked[0].confidence == 0.5


def test_extract_from_mention_order_word_boundaries():
    """Test mention order uses word boundaries (no false positives)."""
    text = "HubSpot is great, but hub alone shouldn't match."
    known_brands = ["HubSpot", "hub"]

    ranked, confidence = _extract_from_mention_order(text, known_brands)

    # Should match both "HubSpot" and "hub" (as separate words)
    assert len(ranked) == 2
    assert "HubSpot" in [b.brand_name for b in ranked]
    assert "hub" in [b.brand_name for b in ranked]


def test_extract_from_mention_order_case_insensitive():
    """Test mention order matching is case-insensitive."""
    text = "I recommend WARMLY and hubspot for your needs."
    known_brands = ["Warmly", "HubSpot"]

    ranked, confidence = _extract_from_mention_order(text, known_brands)

    assert len(ranked) == 2
    assert ranked[0].brand_name == "Warmly"
    assert ranked[1].brand_name == "HubSpot"


def test_extract_from_mention_order_deduplication():
    """Test mention order uses first occurrence for ranking."""
    text = "Warmly is great. HubSpot is good. Warmly again. HubSpot again."
    known_brands = ["Warmly", "HubSpot"]

    ranked, confidence = _extract_from_mention_order(text, known_brands)

    # Should only include each brand once
    assert len(ranked) == 2
    assert ranked[0].brand_name == "Warmly"
    assert ranked[1].brand_name == "HubSpot"


def test_extract_from_mention_order_no_matches():
    """Test mention order returns empty list with 0.3 confidence when no brands found."""
    text = "This text contains no known brands."
    known_brands = ["Warmly", "HubSpot", "Instantly"]

    ranked, confidence = _extract_from_mention_order(text, known_brands)

    assert len(ranked) == 0
    assert confidence == 0.3


def test_extract_from_mention_order_empty_text():
    """Test mention order handles empty text gracefully."""
    ranked, confidence = _extract_from_mention_order("", ["Warmly"])

    assert len(ranked) == 0
    assert confidence == 0.3


# ============================================================================
# Brand Matching (Fuzzy) Tests
# ============================================================================


def test_match_brand_exact_match():
    """Test _match_brand returns exact match when available."""
    known_brands = ["Warmly", "HubSpot", "Instantly"]

    match = _match_brand("Warmly", known_brands)
    assert match == "Warmly"

    match = _match_brand("HubSpot is great", known_brands)
    assert match == "HubSpot"


def test_match_brand_case_insensitive():
    """Test _match_brand is case-insensitive."""
    known_brands = ["Warmly", "HubSpot"]

    match = _match_brand("warmly", known_brands)
    assert match == "Warmly"

    match = _match_brand("HUBSPOT", known_brands)
    assert match == "HubSpot"


def test_match_brand_fuzzy_match():
    """Test _match_brand uses fuzzy matching for typos (80% threshold)."""
    known_brands = ["Warmly", "HubSpot", "Instantly"]

    # "Warnly" is close to "Warmly" (5/6 chars match = 83%)
    match = _match_brand("Warnly", known_brands)
    assert match == "Warmly"

    # "HubSpott" is close to "HubSpot" (7/8 chars match = 87%)
    match = _match_brand("HubSpott", known_brands)
    assert match == "HubSpot"


def test_match_brand_no_match_below_threshold():
    """Test _match_brand returns None when similarity is below 80%."""
    known_brands = ["Warmly", "HubSpot"]

    # "RandomTool" has no similarity to known brands
    match = _match_brand("RandomTool", known_brands)
    assert match is None


def test_match_brand_empty_candidate():
    """Test _match_brand handles empty candidate gracefully."""
    known_brands = ["Warmly", "HubSpot"]

    match = _match_brand("", known_brands)
    assert match is None


def test_match_brand_empty_known_brands():
    """Test _match_brand handles empty known_brands list."""
    match = _match_brand("Warmly", [])
    assert match is None


def test_match_brand_returns_best_fuzzy_match():
    """Test _match_brand returns best match when multiple brands are similar."""
    known_brands = ["Warmly", "Warm", "Warmy"]

    # "Warnly" is most similar to "Warmly"
    match = _match_brand("Warnly", known_brands)
    assert match == "Warmly"


# ============================================================================
# Main Entry Point Tests (extract_ranked_list_pattern)
# ============================================================================


def test_extract_ranked_list_pattern_numbered_priority(
    numbered_list_text, known_brands
):
    """Test main function prioritizes numbered lists (highest confidence)."""
    ranked, confidence = extract_ranked_list_pattern(numbered_list_text, known_brands)

    assert len(ranked) == 3
    assert confidence == 1.0
    assert ranked[0].brand_name == "Warmly"


def test_extract_ranked_list_pattern_bullet_priority(bullet_list_text, known_brands):
    """Test main function falls back to bullets when no numbered list."""
    ranked, confidence = extract_ranked_list_pattern(bullet_list_text, known_brands)

    assert len(ranked) == 3
    assert confidence == 0.8
    assert ranked[0].brand_name == "Warmly"


def test_extract_ranked_list_pattern_header_priority(
    markdown_headers_text, known_brands
):
    """Test main function falls back to headers when no numbered/bullet list."""
    ranked, confidence = extract_ranked_list_pattern(
        markdown_headers_text, known_brands
    )

    assert len(ranked) == 3
    assert confidence == 0.8
    assert ranked[0].brand_name == "Warmly"


def test_extract_ranked_list_pattern_mention_order_fallback(
    conversational_text, known_brands
):
    """Test main function falls back to mention order when no structure."""
    ranked, confidence = extract_ranked_list_pattern(conversational_text, known_brands)

    assert len(ranked) >= 3
    assert confidence == 0.5
    assert ranked[0].brand_name == "Warmly"


def test_extract_ranked_list_pattern_numbered_overrides_bullets():
    """Test numbered list takes priority over bullets in same text."""
    text = """
Here are the rankings:

1. Warmly
2. HubSpot

Also worth mentioning:
- Instantly
- Lemlist
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly", "Lemlist"]
    ranked, confidence = extract_ranked_list_pattern(text, known_brands)

    # Should use numbered list (1.0 confidence) and ignore bullets
    assert confidence == 1.0
    assert len(ranked) == 2  # Only Warmly and HubSpot from numbered list
    assert ranked[0].brand_name == "Warmly"
    assert ranked[1].brand_name == "HubSpot"


def test_extract_ranked_list_pattern_empty_text():
    """Test main function handles empty text gracefully."""
    ranked, confidence = extract_ranked_list_pattern("", ["Warmly"])

    assert len(ranked) == 0
    assert confidence == 0.3


def test_extract_ranked_list_pattern_empty_known_brands():
    """Test main function handles empty known_brands list."""
    ranked, confidence = extract_ranked_list_pattern("Some text", [])

    assert len(ranked) == 0
    assert confidence == 0.3


def test_extract_ranked_list_pattern_none_text():
    """Test main function handles None text gracefully."""
    ranked, confidence = extract_ranked_list_pattern(None, ["Warmly"])

    assert len(ranked) == 0
    assert confidence == 0.3


def test_extract_ranked_list_pattern_none_known_brands():
    """Test main function handles None known_brands gracefully."""
    ranked, confidence = extract_ranked_list_pattern("Some text", None)

    assert len(ranked) == 0
    assert confidence == 0.3


# ============================================================================
# Integration Tests (Complex Scenarios)
# ============================================================================


def test_extract_ranked_list_pattern_mixed_content():
    """Test extraction from complex text with mixed content types."""
    text = """
# Email Warmup Tools Comparison

Here are my top recommendations for email warmup tools in 2025:

1. Warmly - Best overall choice with great features
2. HubSpot - Comprehensive marketing platform
3. Instantly - Fast and reliable

Some other tools worth mentioning:
- Lemlist (good for customization)
- Outreach (enterprise solution)

I've been using Warmly for 6 months now and it's been excellent.
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly", "Lemlist", "Outreach"]
    ranked, confidence = extract_ranked_list_pattern(text, known_brands)

    # Should prioritize numbered list (1.0 confidence)
    assert confidence == 1.0
    assert len(ranked) == 3
    assert ranked[0].brand_name == "Warmly"
    assert ranked[1].brand_name == "HubSpot"
    assert ranked[2].brand_name == "Instantly"


def test_extract_ranked_list_pattern_real_world_llm_response():
    """Test extraction from realistic LLM response format."""
    text = """
Based on your requirements for email warmup tools, here are my recommendations:

**Top 3 Email Warmup Tools:**

1. **Warmly** - Offers the most comprehensive features with excellent deliverability tracking.
   Great for sales teams that need real-time engagement insights.

2. **HubSpot** - While primarily a CRM, it includes robust email warmup capabilities and
   integrates seamlessly with your existing workflow.

3. **Instantly** - Best for speed and simplicity. Gets your email warmed up fast without
   complex configuration.

**Honorable Mentions:**
- Lemlist: Great for personalization and custom sequences
- Outreach: Best for enterprise teams with advanced needs

Each tool has its strengths, but Warmly would be my top pick for most use cases.
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly", "Lemlist", "Outreach"]
    ranked, confidence = extract_ranked_list_pattern(text, known_brands)

    # Should detect numbered list with confidence 1.0
    assert confidence == 1.0
    assert len(ranked) == 3
    assert ranked[0].brand_name == "Warmly"
    assert ranked[0].rank_position == 1
    assert ranked[1].brand_name == "HubSpot"
    assert ranked[1].rank_position == 2
    assert ranked[2].brand_name == "Instantly"
    assert ranked[2].rank_position == 3


def test_extract_ranked_list_pattern_no_structure_multiple_mentions():
    """Test extraction from conversational text with multiple brand mentions."""
    text = """
I've tested several email warmup tools over the years. My experience has been that
Warmly consistently delivers the best results. HubSpot is also solid if you're already
using their platform. I've heard good things about Instantly from colleagues, and
Lemlist has some interesting features for customization. Outreach is overkill unless
you're a large enterprise.

Overall, I'd start with Warmly, then consider HubSpot if it fits your stack.
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly", "Lemlist", "Outreach"]
    ranked, confidence = extract_ranked_list_pattern(text, known_brands)

    # Should fall back to mention order (0.5 confidence)
    assert confidence == 0.5
    assert len(ranked) == 5

    # Verify brands appear in order of first mention
    brand_names = [b.brand_name for b in ranked]
    assert brand_names.index("Warmly") < brand_names.index("HubSpot")
    assert brand_names.index("HubSpot") < brand_names.index("Instantly")
    assert brand_names.index("Instantly") < brand_names.index("Lemlist")
    assert brand_names.index("Lemlist") < brand_names.index("Outreach")


def test_extract_ranked_list_pattern_partial_brand_names():
    """Test extraction handles brand names embedded in larger text."""
    text = """
1. Warmly's platform is the most comprehensive
2. HubSpot's email tools are excellent
3. Instantly.ai provides fast warmup
""".strip()

    known_brands = ["Warmly", "HubSpot", "Instantly"]
    ranked, confidence = extract_ranked_list_pattern(text, known_brands)

    assert confidence == 1.0
    assert len(ranked) == 3
    assert ranked[0].brand_name == "Warmly"
    assert ranked[1].brand_name == "HubSpot"
    assert ranked[2].brand_name == "Instantly"
