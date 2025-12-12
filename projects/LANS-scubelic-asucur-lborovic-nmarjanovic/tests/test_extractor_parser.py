"""
Tests for extractor.parser module.

This test suite validates the answer parsing orchestration layer, including:
- parse_answer() main entry point (orchestrates mention + rank extraction)
- appeared_mine flag logic (True when our brands appear, False otherwise)
- my_mentions vs competitor_mentions separation
- ranked_list extraction with pattern-based and LLM-assisted methods
- ExtractionResult dataclass validation
- Integration between mention_detector and rank_extractor modules
- Edge cases and error handling

Test coverage targets:
- parse_answer() - main orchestration function
- ExtractionResult - dataclass validation
- Pattern-based extraction (default)
- LLM-assisted extraction (stub in v1)
- Edge cases (no mentions, only mine, only competitors, empty text)
"""

import pytest

from llm_answer_watcher.config.schema import Brands
from llm_answer_watcher.extractor.mention_detector import BrandMention
from llm_answer_watcher.extractor.parser import (
    ExtractionResult,
    parse_answer,
)
from llm_answer_watcher.extractor.rank_extractor import RankedBrand

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def brands_config() -> Brands:
    """Standard Brands configuration for testing."""
    return Brands(
        mine=["Warmly", "Warmly.io"],
        competitors=["HubSpot", "Instantly", "Lemlist", "Outreach"],
    )


@pytest.fixture
def brands_mine_only() -> Brands:
    """Brands configuration with only 'mine' brands."""
    return Brands(mine=["Warmly"], competitors=[])


@pytest.fixture
def brands_competitors_only() -> Brands:
    """Brands configuration with only competitor brands."""
    return Brands(mine=["Warmly"], competitors=["HubSpot", "Instantly"])


@pytest.fixture
def numbered_list_answer() -> str:
    """Sample LLM answer with numbered list (our brand appears first)."""
    return """
Here are the best email warmup tools for 2025:

1. Warmly - Best overall choice with excellent deliverability tracking
2. HubSpot - Comprehensive CRM with email capabilities
3. Instantly - Fast and reliable warmup service

These are my top recommendations based on extensive testing.
""".strip()


@pytest.fixture
def numbered_list_answer_no_mine() -> str:
    """Sample LLM answer with numbered list (our brand does NOT appear)."""
    return """
Based on market research, the top email warmup tools are:

1. HubSpot - Enterprise-grade CRM solution
2. Instantly - Fast warmup service
3. Lemlist - Great for customization

These are the industry leaders.
""".strip()


@pytest.fixture
def bullet_list_answer() -> str:
    """Sample LLM answer with bullet list."""
    return """
Best email warmup tools:

- HubSpot
- Warmly
- Instantly

All solid choices.
""".strip()


@pytest.fixture
def conversational_answer() -> str:
    """Sample LLM answer with no clear structure (conversational)."""
    return """
I'd recommend checking out Warmly first, as it has the best features for sales teams.
You might also want to look at HubSpot if you need a full CRM. Instantly is another
solid option if you prioritize speed.
""".strip()


@pytest.fixture
def answer_only_competitors() -> str:
    """Sample LLM answer mentioning only competitors (our brand NOT mentioned)."""
    return """
The best email warmup tools are HubSpot and Instantly. Both offer great features
and have proven track records in the industry.
""".strip()


@pytest.fixture
def answer_only_mine() -> str:
    """Sample LLM answer mentioning only our brand."""
    return """
The best email warmup tool is Warmly. It offers unparalleled features and
excellent deliverability tracking.
""".strip()


@pytest.fixture
def answer_no_brands() -> str:
    """Sample LLM answer with no brand mentions."""
    return """
Email warmup is an important practice for maintaining good sender reputation.
You should gradually increase your sending volume over several weeks.
""".strip()


@pytest.fixture
def answer_empty() -> str:
    """Empty answer text."""
    return ""


@pytest.fixture
def answer_markdown_headers() -> str:
    """Sample LLM answer with markdown header structure."""
    return """
## Warmly

Warmly is the top choice for email warmup with advanced tracking features.

## HubSpot

HubSpot offers comprehensive CRM capabilities including email tools.

## Instantly

Instantly provides fast and reliable email warmup service.
""".strip()


@pytest.fixture
def mock_llm_client():
    """Mock LLM client for testing LLM-assisted extraction."""

    class MockLLMClient:
        def generate_answer(self, prompt: str) -> tuple[str, dict]:
            # Stub implementation - not used in v1
            return "mock response", {"prompt_tokens": 100, "completion_tokens": 50}

    return MockLLMClient()


# ============================================================================
# ExtractionResult Dataclass Tests
# ============================================================================


def test_extraction_result_valid_creation():
    """Test ExtractionResult creation with valid parameters."""
    result = ExtractionResult(
        intent_id="email-warmup",
        model_provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
        appeared_mine=True,
        my_mentions=[],
        competitor_mentions=[],
        ranked_list=[],
        rank_extraction_method="pattern",
        rank_confidence=1.0,
    )

    assert result.intent_id == "email-warmup"
    assert result.model_provider == "openai"
    assert result.model_name == "gpt-4o-mini"
    assert result.timestamp_utc == "2025-11-02T08:00:00Z"
    assert result.appeared_mine is True
    assert result.my_mentions == []
    assert result.competitor_mentions == []
    assert result.ranked_list == []
    assert result.rank_extraction_method == "pattern"
    assert result.rank_confidence == 1.0


def test_extraction_result_invalid_rank_extraction_method():
    """Test ExtractionResult validation rejects invalid rank_extraction_method."""
    with pytest.raises(ValueError, match="rank_extraction_method must be"):
        ExtractionResult(
            intent_id="email-warmup",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc="2025-11-02T08:00:00Z",
            appeared_mine=True,
            my_mentions=[],
            competitor_mentions=[],
            ranked_list=[],
            rank_extraction_method="invalid",  # Invalid method
            rank_confidence=1.0,
        )


def test_extraction_result_pattern_method():
    """Test ExtractionResult accepts 'pattern' extraction method."""
    result = ExtractionResult(
        intent_id="email-warmup",
        model_provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
        appeared_mine=False,
        my_mentions=[],
        competitor_mentions=[],
        ranked_list=[],
        rank_extraction_method="pattern",
        rank_confidence=0.8,
    )

    assert result.rank_extraction_method == "pattern"


def test_extraction_result_llm_method():
    """Test ExtractionResult accepts 'llm' extraction method."""
    result = ExtractionResult(
        intent_id="email-warmup",
        model_provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
        appeared_mine=False,
        my_mentions=[],
        competitor_mentions=[],
        ranked_list=[],
        rank_extraction_method="llm",
        rank_confidence=0.9,
    )

    assert result.rank_extraction_method == "llm"


# ============================================================================
# parse_answer() Basic Functionality Tests
# ============================================================================


def test_parse_answer_numbered_list_with_mine(numbered_list_answer, brands_config):
    """Test parse_answer with numbered list where our brand appears first."""
    result = parse_answer(
        answer_text=numbered_list_answer,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    # Check metadata
    assert result.intent_id == "email-warmup"
    assert result.model_provider == "openai"
    assert result.model_name == "gpt-4o-mini"
    assert result.timestamp_utc == "2025-11-02T08:00:00Z"

    # Check appeared_mine flag (Warmly appears)
    assert result.appeared_mine is True

    # Check my_mentions (should include Warmly)
    assert len(result.my_mentions) == 1
    assert result.my_mentions[0].normalized_name == "Warmly"
    assert result.my_mentions[0].brand_category == "mine"

    # Check competitor_mentions (HubSpot, Instantly)
    assert len(result.competitor_mentions) == 2
    competitor_names = {m.normalized_name for m in result.competitor_mentions}
    assert "HubSpot" in competitor_names
    assert "Instantly" in competitor_names

    # Check ranked_list (numbered list should be detected)
    assert len(result.ranked_list) == 3
    assert result.ranked_list[0].brand_name == "Warmly"
    assert result.ranked_list[0].rank_position == 1
    assert result.ranked_list[1].brand_name == "HubSpot"
    assert result.ranked_list[1].rank_position == 2
    assert result.ranked_list[2].brand_name == "Instantly"
    assert result.ranked_list[2].rank_position == 3

    # Check extraction method and confidence
    assert result.rank_extraction_method == "pattern"
    assert result.rank_confidence == 1.0  # Numbered list has highest confidence


def test_parse_answer_numbered_list_no_mine(
    numbered_list_answer_no_mine, brands_config
):
    """Test parse_answer with numbered list where our brand does NOT appear."""
    result = parse_answer(
        answer_text=numbered_list_answer_no_mine,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    # Check appeared_mine flag (Warmly does NOT appear)
    assert result.appeared_mine is False

    # Check my_mentions (should be empty)
    assert len(result.my_mentions) == 0

    # Check competitor_mentions (HubSpot, Instantly, Lemlist)
    assert len(result.competitor_mentions) == 3
    competitor_names = {m.normalized_name for m in result.competitor_mentions}
    assert "HubSpot" in competitor_names
    assert "Instantly" in competitor_names
    assert "Lemlist" in competitor_names

    # Check ranked_list
    assert len(result.ranked_list) == 3
    assert result.ranked_list[0].brand_name == "HubSpot"
    assert result.ranked_list[1].brand_name == "Instantly"
    assert result.ranked_list[2].brand_name == "Lemlist"


def test_parse_answer_bullet_list(bullet_list_answer, brands_config):
    """Test parse_answer with bullet list structure."""
    result = parse_answer(
        answer_text=bullet_list_answer,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    # Check appeared_mine flag (Warmly appears)
    assert result.appeared_mine is True

    # Check mentions
    assert len(result.my_mentions) == 1
    assert len(result.competitor_mentions) == 2

    # Check ranked_list (bullet list should be detected)
    assert len(result.ranked_list) == 3
    brand_names = [b.brand_name for b in result.ranked_list]
    assert "HubSpot" in brand_names
    assert "Warmly" in brand_names
    assert "Instantly" in brand_names

    # Bullet list has 0.8 confidence
    assert result.rank_extraction_method == "pattern"
    assert result.rank_confidence == 0.8


def test_parse_answer_markdown_headers(answer_markdown_headers, brands_config):
    """Test parse_answer with markdown header structure."""
    result = parse_answer(
        answer_text=answer_markdown_headers,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    # Check appeared_mine flag
    assert result.appeared_mine is True

    # Check mentions
    assert len(result.my_mentions) == 1
    assert len(result.competitor_mentions) == 2

    # Check ranked_list (markdown headers should be detected)
    assert len(result.ranked_list) == 3
    assert result.ranked_list[0].brand_name == "Warmly"
    assert result.ranked_list[1].brand_name == "HubSpot"
    assert result.ranked_list[2].brand_name == "Instantly"

    # Headers have 0.8 confidence
    assert result.rank_extraction_method == "pattern"
    assert result.rank_confidence == 0.8


def test_parse_answer_conversational(conversational_answer, brands_config):
    """Test parse_answer with conversational text (no clear structure)."""
    result = parse_answer(
        answer_text=conversational_answer,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    # Check appeared_mine flag
    assert result.appeared_mine is True

    # Check mentions
    assert len(result.my_mentions) == 1
    assert len(result.competitor_mentions) == 2

    # Check ranked_list (mention order fallback)
    assert len(result.ranked_list) == 3
    # Brands should be ranked in order of appearance
    assert result.ranked_list[0].brand_name == "Warmly"
    assert result.ranked_list[1].brand_name == "HubSpot"
    assert result.ranked_list[2].brand_name == "Instantly"

    # Mention order fallback has 0.5 confidence
    assert result.rank_extraction_method == "pattern"
    assert result.rank_confidence == 0.5


# ============================================================================
# appeared_mine Flag Logic Tests
# ============================================================================


def test_parse_answer_appeared_mine_true(answer_only_mine, brands_config):
    """Test appeared_mine is True when only our brand is mentioned."""
    result = parse_answer(
        answer_text=answer_only_mine,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    assert result.appeared_mine is True
    assert len(result.my_mentions) == 1
    assert len(result.competitor_mentions) == 0


def test_parse_answer_appeared_mine_false(answer_only_competitors, brands_config):
    """Test appeared_mine is False when only competitors are mentioned."""
    result = parse_answer(
        answer_text=answer_only_competitors,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    assert result.appeared_mine is False
    assert len(result.my_mentions) == 0
    assert len(result.competitor_mentions) == 2


def test_parse_answer_appeared_mine_false_no_brands(answer_no_brands, brands_config):
    """Test appeared_mine is False when no brands are mentioned."""
    result = parse_answer(
        answer_text=answer_no_brands,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    assert result.appeared_mine is False
    assert len(result.my_mentions) == 0
    assert len(result.competitor_mentions) == 0
    assert len(result.ranked_list) == 0


# ============================================================================
# my_mentions vs competitor_mentions Separation Tests
# ============================================================================


def test_parse_answer_my_mentions_populated(numbered_list_answer, brands_config):
    """Test my_mentions is correctly populated with our brands."""
    result = parse_answer(
        answer_text=numbered_list_answer,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    # Check my_mentions contains Warmly
    assert len(result.my_mentions) == 1
    assert result.my_mentions[0].normalized_name == "Warmly"
    assert result.my_mentions[0].brand_category == "mine"
    assert isinstance(result.my_mentions[0], BrandMention)


def test_parse_answer_competitor_mentions_populated(
    numbered_list_answer, brands_config
):
    """Test competitor_mentions is correctly populated with competitor brands."""
    result = parse_answer(
        answer_text=numbered_list_answer,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    # Check competitor_mentions contains HubSpot and Instantly
    assert len(result.competitor_mentions) == 2
    competitor_names = {m.normalized_name for m in result.competitor_mentions}
    assert "HubSpot" in competitor_names
    assert "Instantly" in competitor_names

    # Check all are marked as "competitor" category
    for mention in result.competitor_mentions:
        assert mention.brand_category == "competitor"
        assert isinstance(mention, BrandMention)


def test_parse_answer_no_my_mentions(answer_only_competitors, brands_config):
    """Test my_mentions is empty when our brand not mentioned."""
    result = parse_answer(
        answer_text=answer_only_competitors,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    assert len(result.my_mentions) == 0
    assert len(result.competitor_mentions) == 2


def test_parse_answer_no_competitor_mentions(answer_only_mine, brands_config):
    """Test competitor_mentions is empty when no competitors mentioned."""
    result = parse_answer(
        answer_text=answer_only_mine,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    assert len(result.my_mentions) == 1
    assert len(result.competitor_mentions) == 0


# ============================================================================
# ranked_list Extraction Tests
# ============================================================================


def test_parse_answer_ranked_list_populated(numbered_list_answer, brands_config):
    """Test ranked_list is correctly populated from numbered list."""
    result = parse_answer(
        answer_text=numbered_list_answer,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    # Check ranked_list
    assert len(result.ranked_list) == 3

    # Check first ranked brand
    assert result.ranked_list[0].brand_name == "Warmly"
    assert result.ranked_list[0].rank_position == 1
    assert result.ranked_list[0].confidence == 1.0
    assert isinstance(result.ranked_list[0], RankedBrand)

    # Check second ranked brand
    assert result.ranked_list[1].brand_name == "HubSpot"
    assert result.ranked_list[1].rank_position == 2

    # Check third ranked brand
    assert result.ranked_list[2].brand_name == "Instantly"
    assert result.ranked_list[2].rank_position == 3


def test_parse_answer_ranked_list_empty_no_structure(answer_no_brands, brands_config):
    """Test ranked_list is empty when no brands mentioned."""
    result = parse_answer(
        answer_text=answer_no_brands,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    assert len(result.ranked_list) == 0
    # Confidence should be 0.3 (mention order fallback with no matches)
    assert result.rank_confidence == 0.3


def test_parse_answer_ranked_list_confidence_values(brands_config):
    """Test ranked_list confidence varies by extraction method."""
    # Numbered list: confidence = 1.0
    numbered_text = "1. Warmly\n2. HubSpot"
    result_numbered = parse_answer(
        answer_text=numbered_text,
        brands=brands_config,
        intent_id="test",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )
    assert result_numbered.rank_confidence == 1.0

    # Bullet list: confidence = 0.8
    bullet_text = "- Warmly\n- HubSpot"
    result_bullet = parse_answer(
        answer_text=bullet_text,
        brands=brands_config,
        intent_id="test",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )
    assert result_bullet.rank_confidence == 0.8

    # Conversational: confidence = 0.5 (mention order fallback)
    conversational_text = "I recommend Warmly and HubSpot."
    result_conversational = parse_answer(
        answer_text=conversational_text,
        brands=brands_config,
        intent_id="test",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )
    assert result_conversational.rank_confidence == 0.5


# ============================================================================
# LLM-Assisted Extraction Tests (v1 Stub)
# ============================================================================


def test_parse_answer_llm_extraction_requires_client(
    numbered_list_answer, brands_config
):
    """Test LLM extraction raises ValueError when client not provided."""
    with pytest.raises(ValueError, match="llm_client required"):
        parse_answer(
            answer_text=numbered_list_answer,
            brands=brands_config,
            intent_id="email-warmup",
            provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc="2025-11-02T08:00:00Z",
            use_llm_extraction=True,
            llm_client=None,  # Missing client
        )


def test_parse_answer_llm_extraction_with_client(
    numbered_list_answer, brands_config, mock_llm_client
):
    """Test LLM extraction works when client provided (v1 stub - falls back to pattern)."""
    result = parse_answer(
        answer_text=numbered_list_answer,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
        use_llm_extraction=True,
        llm_client=mock_llm_client,
    )

    # In v1, LLM extraction is a stub and falls back to pattern-based
    # So we still get pattern-based results, but method should be "llm"
    assert result.rank_extraction_method == "llm"

    # The results should still be valid (v1 stub uses pattern internally)
    assert result.appeared_mine is True
    assert len(result.ranked_list) == 3


def test_parse_answer_llm_extraction_disabled_by_default(
    numbered_list_answer, brands_config
):
    """Test LLM extraction is disabled by default (use_llm_extraction=False)."""
    result = parse_answer(
        answer_text=numbered_list_answer,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
        # use_llm_extraction not specified, defaults to False
    )

    # Should use pattern-based extraction
    assert result.rank_extraction_method == "pattern"


# ============================================================================
# Edge Cases Tests
# ============================================================================


def test_parse_answer_empty_text(answer_empty, brands_config):
    """Test parse_answer handles empty text gracefully."""
    result = parse_answer(
        answer_text=answer_empty,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    assert result.appeared_mine is False
    assert len(result.my_mentions) == 0
    assert len(result.competitor_mentions) == 0
    assert len(result.ranked_list) == 0
    assert result.rank_confidence == 0.3  # Mention order fallback


def test_parse_answer_whitespace_only_text(brands_config):
    """Test parse_answer handles whitespace-only text."""
    result = parse_answer(
        answer_text="   \n\t  ",
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    assert result.appeared_mine is False
    assert len(result.my_mentions) == 0
    assert len(result.competitor_mentions) == 0
    assert len(result.ranked_list) == 0


def test_parse_answer_no_competitors_configured(answer_only_mine, brands_mine_only):
    """Test parse_answer works when no competitors configured."""
    result = parse_answer(
        answer_text=answer_only_mine,
        brands=brands_mine_only,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    assert result.appeared_mine is True
    assert len(result.my_mentions) == 1
    assert len(result.competitor_mentions) == 0


def test_parse_answer_complex_timestamp_format(numbered_list_answer, brands_config):
    """Test parse_answer accepts any valid ISO 8601 timestamp."""
    result = parse_answer(
        answer_text=numbered_list_answer,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:30:45Z",
    )

    assert result.timestamp_utc == "2025-11-02T08:30:45Z"


def test_parse_answer_preserves_metadata_fields(numbered_list_answer, brands_config):
    """Test parse_answer preserves all metadata fields correctly."""
    result = parse_answer(
        answer_text=numbered_list_answer,
        brands=brands_config,
        intent_id="email-warmup-tools",
        provider="anthropic",
        model_name="claude-3-5-haiku-20241022",
        timestamp_utc="2025-11-02T10:15:30Z",
    )

    assert result.intent_id == "email-warmup-tools"
    assert result.model_provider == "anthropic"
    assert result.model_name == "claude-3-5-haiku-20241022"
    assert result.timestamp_utc == "2025-11-02T10:15:30Z"


# ============================================================================
# Integration Tests (Complex Scenarios)
# ============================================================================


def test_parse_answer_integration_real_world_llm_response(brands_config):
    """Test parse_answer with realistic LLM response format."""
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

    result = parse_answer(
        answer_text=text,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    # Check appeared_mine
    assert result.appeared_mine is True

    # Check mentions
    assert len(result.my_mentions) == 1
    assert result.my_mentions[0].normalized_name == "Warmly"
    assert len(result.competitor_mentions) >= 3

    # Check ranked_list (should detect numbered list)
    assert len(result.ranked_list) == 3
    assert result.ranked_list[0].brand_name == "Warmly"
    assert result.ranked_list[0].rank_position == 1
    assert result.ranked_list[1].brand_name == "HubSpot"
    assert result.ranked_list[1].rank_position == 2
    assert result.ranked_list[2].brand_name == "Instantly"
    assert result.ranked_list[2].rank_position == 3

    # Check confidence (numbered list = 1.0)
    assert result.rank_confidence == 1.0
    assert result.rank_extraction_method == "pattern"


def test_parse_answer_integration_our_brand_loses(brands_config):
    """Test parse_answer when our brand appears but not in top position."""
    text = """
Here are the best email warmup tools:

1. HubSpot - Industry leader
2. Instantly - Fast and reliable
3. Warmly - Good for sales teams
""".strip()

    result = parse_answer(
        answer_text=text,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    # Our brand still appeared
    assert result.appeared_mine is True
    assert len(result.my_mentions) == 1

    # But it's ranked 3rd
    assert result.ranked_list[2].brand_name == "Warmly"
    assert result.ranked_list[2].rank_position == 3


def test_parse_answer_integration_mixed_brand_formats(brands_config):
    """Test parse_answer handles brands with various text formatting."""
    text = """
Top choices:

1. **Warmly** (highly recommended)
2. _HubSpot_ - great CRM
3. `Instantly` for fast warmup
""".strip()

    result = parse_answer(
        answer_text=text,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    # Should detect all brands despite markdown formatting
    assert result.appeared_mine is True
    assert len(result.ranked_list) == 3
    assert result.ranked_list[0].brand_name == "Warmly"
    assert result.ranked_list[1].brand_name == "HubSpot"
    assert result.ranked_list[2].brand_name == "Instantly"


def test_parse_answer_integration_mention_deduplication(brands_config):
    """Test parse_answer deduplicates repeated brand mentions."""
    text = """
Warmly is the best. I use Warmly daily. Warmly has great features.
HubSpot is good too, and Instantly is fast.
""".strip()

    result = parse_answer(
        answer_text=text,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    # Each brand should only appear once in mentions
    assert len(result.my_mentions) == 1
    assert len(result.competitor_mentions) == 2

    # Ranked list should use first occurrence
    assert len(result.ranked_list) == 3
    assert result.ranked_list[0].brand_name == "Warmly"


def test_parse_answer_integration_case_insensitive_matching(brands_config):
    """Test parse_answer matches brands case-insensitively."""
    text = """
1. WARMLY - all caps
2. hubspot - lowercase
3. InStAnTlY - mixed case
""".strip()

    result = parse_answer(
        answer_text=text,
        brands=brands_config,
        intent_id="email-warmup",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-02T08:00:00Z",
    )

    # Should match all brands despite case differences
    assert result.appeared_mine is True
    assert len(result.ranked_list) == 3
    assert result.ranked_list[0].brand_name == "Warmly"
    assert result.ranked_list[1].brand_name == "HubSpot"
    assert result.ranked_list[2].brand_name == "Instantly"
