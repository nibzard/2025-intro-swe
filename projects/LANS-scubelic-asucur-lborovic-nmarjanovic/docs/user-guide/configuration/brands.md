# Brand Configuration

Brand configuration defines which brands to track in LLM responses. Proper brand configuration is critical for accurate mention detection and false-positive prevention.

## Brand Categories

LLM Answer Watcher tracks two categories of brands:

### Mine

Your brand(s) that you want to monitor. **At least one required.**

```yaml
brands:
  mine:
    - "MyBrand"
    - "MyBrand.io"
    - "MyBrand CRM"
```

### Competitors

Competitor brands you want to track for comparison.

```yaml
brands:
  competitors:
    - "CompetitorA"
    - "CompetitorB"
    - "MarketLeader"
```

## Basic Brand Configuration

### Minimal Example

Simplest configuration with single brand:

```yaml
brands:
  mine:
    - "Warmly"

  competitors:
    - "Instantly"
    - "Lemwarm"
```

### Comprehensive Example

Full configuration with aliases:

```yaml
brands:
  mine:
    - "Warmly"          # Base name
    - "Warmly.io"       # With TLD
    - "Warmly AI"       # With product descriptor

  competitors:
    # Direct competitors
    - "Instantly"
    - "Lemwarm"
    - "Smartlead"

    # Indirect competitors
    - "HubSpot"
    - "Salesforce"

    # Category leaders
    - "Apollo.io"
```

!!! tip "How Many Competitors?"
    **Recommended**: 5-15 competitors

    - **Too few**: Miss important context
    - **Too many**: Dilutes focus, increases noise

    Focus on competitors that:

    - Directly compete for the same customers
    - Appear frequently in buyer comparisons
    - Represent different market segments

## Brand Alias Strategies

### Why Use Aliases?

LLMs may refer to your brand in different ways:

- With/without TLD: "Warmly" vs "Warmly.io"
- With/without product name: "HubSpot" vs "HubSpot CRM"
- Common variations: "Salesforce" vs "SFDC"
- Capitalization: "GitHub" vs "Github"

### Alias Best Practices

**Include common variations:**

```yaml
brands:
  mine:
    - "GitHub"
    - "Github"        # Common misspelling
    - "GitHub.com"
    - "GitHub Actions" # Product line
```

**TLD variations:**

```yaml
brands:
  mine:
    - "Stripe"
    - "Stripe.com"
    - "stripe.io"     # If you own it
```

**Product family variations:**

```yaml
brands:
  mine:
    - "HubSpot"
    - "HubSpot CRM"
    - "HubSpot Marketing Hub"
    - "HubSpot Sales Hub"
```

**Abbreviations and acronyms:**

```yaml
brands:
  mine:
    - "Salesforce"
    - "SFDC"          # Common abbreviation
    - "Salesforce.com"
```

!!! warning "Avoid Over-Aliasing"
    Don't include:

    - Generic terms: "CRM" (too broad)
    - Common words: "Hub" (false positives)
    - Competitor names: Track separately in competitors list

### Case Sensitivity

Brand matching is **case-insensitive** by default:

```yaml
brands:
  mine:
    - "GitHub"  # Matches: GitHub, github, GITHUB, GiTHuB
```

You only need one capitalization variant:

```yaml
# ❌ Redundant
brands:
  mine:
    - "GitHub"
    - "github"
    - "GITHUB"

# ✅ Sufficient
brands:
  mine:
    - "GitHub"
```

## Word-Boundary Matching

LLM Answer Watcher uses **word-boundary regex** to prevent false positives.

### How It Works

Word boundaries (`\b`) ensure brands match only as complete words:

```python
pattern = r'\b' + re.escape(brand_alias) + r'\b'
```

**Examples:**

| Text | Brand Alias | Matches? | Reason |
|------|-------------|----------|--------|
| "Use HubSpot daily" | "HubSpot" | ✅ Yes | Complete word |
| "GitHub and HubSpot" | "HubSpot" | ✅ Yes | Complete word |
| "Hubspot is great" | "HubSpot" | ✅ Yes | Case-insensitive |
| "Use hub for projects" | "Hub" | ✅ Yes | Complete word |
| "GitHub has features" | "Hub" | ❌ No | Inside "GitHub" |
| "rehub your content" | "Hub" | ❌ No | Inside "rehub" |

### Why Word Boundaries Matter

**Without word boundaries** (naive substring matching):

```yaml
brands:
  mine:
    - "Hub"  # ❌ BAD: Matches "GitHub", "HubSpot", "rehub", etc.
```

**With word boundaries** (LLM Answer Watcher default):

```yaml
brands:
  mine:
    - "Hub"  # ✅ GOOD: Only matches "Hub" as complete word
```

!!! info "Special Characters"
    Word boundaries work with special characters:

    - `Apollo.io` matches "Apollo.io" but not "Apolloio"
    - `Slack-Bot` matches "Slack-Bot" but not "SlackBot"

### Testing Word Boundaries

Test your brand aliases:

```python
import re

def test_brand_match(text: str, brand: str) -> bool:
    pattern = r'\b' + re.escape(brand) + r'\b'
    return bool(re.search(pattern, text, re.IGNORECASE))

# Test cases
print(test_brand_match("Use HubSpot daily", "HubSpot"))  # True
print(test_brand_match("GitHub and GitLab", "Git"))      # False
```

## Brand Normalization

Brands are normalized for deduplication and analysis.

### Normalization Process

1. **Case folding**: Convert to lowercase
2. **TLD removal**: Strip `.com`, `.io`, etc.
3. **Whitespace normalization**: Collapse multiple spaces
4. **Punctuation handling**: Preserve hyphens, remove others

**Examples:**

| Original | Normalized | Rationale |
|----------|------------|-----------|
| "HubSpot" | "hubspot" | Lowercase |
| "HubSpot.com" | "hubspot" | TLD removed |
| "Apollo.io" | "apollo" | TLD removed |
| "Slack  Bot" | "slackbot" | Spaces collapsed |
| "GitHub-Actions" | "github-actions" | Hyphens preserved |

### Why Normalization Matters

Prevents duplicate counting:

```yaml
brands:
  mine:
    - "Warmly"
    - "Warmly.io"
```

LLM response: "I recommend Warmly and Warmly.io for outreach."

**Without normalization**: 2 mentions counted
**With normalization**: 1 mention counted (both normalize to "warmly")

### Normalized Name in Database

The SQLite database stores both:

- `brand`: Original matched text
- `normalized_name`: Normalized version for deduplication

```sql
SELECT brand, normalized_name, COUNT(*) as mentions
FROM mentions
WHERE run_id = '2025-11-01T08-00-00Z'
GROUP BY normalized_name;
```

## Competitor Selection Strategies

### Direct Competitors

Brands solving the same problem for the same audience:

```yaml
brands:
  competitors:
    # Email warmup tools (if you're Warmly)
    - "Instantly"
    - "Lemwarm"
    - "Smartlead"
    - "Woodpecker"
```

### Indirect Competitors

Brands in adjacent categories:

```yaml
brands:
  competitors:
    # If you're an email warmup tool
    - "HubSpot"        # Full sales platform
    - "Apollo.io"      # Sales intelligence
    - "Salesforce"     # Enterprise CRM
```

### Category Leaders

Market-defining brands to benchmark against:

```yaml
brands:
  competitors:
    # Category leaders (if you're a startup CRM)
    - "Salesforce"     # Enterprise standard
    - "HubSpot"        # SMB leader
    - "Pipedrive"      # Sales-focused
```

### Segment-Specific Competitors

Brands targeting different segments:

```yaml
brands:
  competitors:
    # Startup segment
    - "Attio"
    - "Folk"

    # SMB segment
    - "Pipedrive"
    - "Copper"

    # Enterprise segment
    - "Salesforce"
    - "Microsoft Dynamics"
```

## Brand Configuration Patterns

### Single Product Company

Simple brand with variations:

```yaml
brands:
  mine:
    - "MyProduct"
    - "MyProduct.io"
    - "MyProduct.com"

  competitors:
    - "CompetitorA"
    - "CompetitorB"
    - "CompetitorC"
```

### Multi-Product Company

Track different product lines:

```yaml
brands:
  mine:
    - "MyCompany"
    - "MyCompany CRM"
    - "MyCompany Marketing"
    - "MyCompany Sales Hub"

  competitors:
    # CRM competitors
    - "Salesforce"
    - "HubSpot"

    # Marketing automation competitors
    - "Marketo"
    - "Pardot"
```

### Parent Company + Subsidiaries

Track corporate structure:

```yaml
brands:
  mine:
    - "ParentCo"
    - "ProductA"       # Subsidiary
    - "ProductB"       # Subsidiary

  competitors:
    - "CompetitorCorp"
    - "CompetitorProduct"
```

### Rebranded Company

Track both old and new names:

```yaml
brands:
  mine:
    - "NewBrand"       # Current name
    - "OldBrand"       # Legacy name (still in training data)
    - "NewBrand.io"

  competitors:
    - "Competitor"
```

### Regional Variations

Track region-specific brands:

```yaml
brands:
  mine:
    - "MyBrand"        # Global
    - "MyBrand US"
    - "MyBrand EU"

  competitors:
    - "GlobalCompetitor"
    - "USCompetitor"
    - "EUCompetitor"
```

## Advanced Brand Configuration

### Fuzzy Matching

Enable fuzzy matching for misspellings (optional):

```yaml
extraction_settings:
  fuzzy_matching:
    enabled: true
    threshold: 0.9     # Similarity threshold (0.0-1.0)

brands:
  mine:
    - "Warmly"         # Also matches: "Warmley", "Warmlly"
```

!!! warning "Fuzzy Matching Trade-offs"
    **Pros:**

    - Catches misspellings
    - More comprehensive tracking

    **Cons:**

    - Higher false-positive rate
    - Slower extraction
    - May match unrelated words

    **Recommended threshold**: 0.9 (very strict)

### Brand Exclusions

Exclude certain patterns (advanced):

```yaml
brands:
  mine:
    - "Apple"

  exclusions:
    - "apple pie"      # Don't match "apple" in "apple pie"
    - "apple juice"
```

!!! info "Exclusions Not Yet Implemented"
    This feature is planned for a future release. Currently, use word boundaries to minimize false positives.

### Brand Categories

Group brands by category (for analysis):

```yaml
brands:
  mine:
    - "MyBrand"

  competitors:
    # Tag with category (custom metadata)
    - name: "CompetitorA"
      category: "direct"

    - name: "CompetitorB"
      category: "direct"

    - name: "MarketLeader"
      category: "aspirational"
```

!!! info "Categories Not Yet Implemented"
    This feature is planned for a future release. Currently, track categories externally.

## Brand Mention Analysis

### Viewing Mentions

Query SQLite database:

```sql
-- All mentions for a run
SELECT brand, COUNT(*) as mentions
FROM mentions
WHERE run_id = '2025-11-01T08-00-00Z'
GROUP BY normalized_name
ORDER BY mentions DESC;
```

```sql
-- My brand mentions over time
SELECT DATE(timestamp_utc) as date, COUNT(*) as mentions
FROM mentions
WHERE normalized_name = 'mybrand'
GROUP BY DATE(timestamp_utc)
ORDER BY date DESC;
```

```sql
-- Competitor comparison
SELECT
    brand,
    COUNT(*) as total_mentions,
    AVG(rank_position) as avg_rank
FROM mentions
WHERE run_id = '2025-11-01T08-00-00Z'
GROUP BY normalized_name
ORDER BY avg_rank ASC;
```

### Mention Metrics

Key metrics to track:

- **Mention rate**: % of queries where brand appears
- **Average rank**: Mean position in ranked lists
- **Top-3 rate**: % of mentions in top 3
- **Share of voice**: Your mentions / total mentions

Calculate in SQL:

```sql
-- Mention rate
SELECT
    (COUNT(DISTINCT CASE WHEN normalized_name = 'mybrand' THEN intent_id END) * 100.0 / COUNT(DISTINCT intent_id)) as mention_rate
FROM mentions
WHERE run_id = '2025-11-01T08-00-00Z';
```

```sql
-- Top-3 rate
SELECT
    (SUM(CASE WHEN rank_position <= 3 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as top3_rate
FROM mentions
WHERE normalized_name = 'mybrand'
  AND run_id = '2025-11-01T08-00-00Z';
```

## Validation and Testing

### Validate Brand Configuration

Check for common issues:

```bash
llm-answer-watcher validate --config watcher.config.yaml
```

**Validation checks:**

- At least one brand in `mine` list
- No empty brand aliases
- No duplicate aliases (warning)
- Brand aliases >= 3 characters (warning)

### Test Brand Matching

Test your brands against sample text:

```bash
# Create test file
echo "I recommend HubSpot, Salesforce, and Warmly for CRM." > test.txt

# Test matching (hypothetical command)
llm-answer-watcher test-brands --config watcher.config.yaml --text test.txt
```

Expected output:

```
✅ Found 3 brand mentions:
   - HubSpot (competitor, position 16)
   - Salesforce (competitor, position 26)
   - Warmly (mine, position 42)
```

### Common Validation Errors

**Error**: `At least one brand required in 'mine'`

```yaml
# ❌ Wrong
brands:
  mine: []

# ✅ Correct
brands:
  mine:
    - "MyBrand"
```

---

**Error**: `Brand alias too short: "io"`

```yaml
# ❌ Warning (high false-positive risk)
brands:
  mine:
    - "io"

# ✅ Better
brands:
  mine:
    - "MyBrand.io"
```

---

**Warning**: `Duplicate brand alias: "HubSpot"`

```yaml
# ❌ Redundant
brands:
  mine:
    - "HubSpot"
  competitors:
    - "HubSpot"  # Same brand in both categories!

# ✅ Correct
brands:
  mine:
    - "MyBrand"
  competitors:
    - "HubSpot"
```

## Best Practices

### 1. Start with Core Brand Names

Begin with unambiguous brand names:

```yaml
brands:
  mine:
    - "Warmly"       # Clear, unambiguous

  competitors:
    - "Instantly"
    - "Lemwarm"
```

### 2. Add TLD Variations Gradually

Monitor results, then add TLDs if needed:

```yaml
# Week 1: Start simple
brands:
  mine:
    - "Warmly"

# Week 2: Add TLD after seeing LLM responses
brands:
  mine:
    - "Warmly"
    - "Warmly.io"
```

### 3. Use Specific Names, Not Generic Terms

```yaml
# ❌ Bad (too generic)
brands:
  mine:
    - "CRM"
    - "Email"
    - "Sales Tool"

# ✅ Good (specific)
brands:
  mine:
    - "Warmly CRM"
    - "Warmly Email"
```

### 4. Track 10-15 Competitors Maximum

Focus on key competitors:

```yaml
brands:
  competitors:
    # Top 5 direct competitors
    - "DirectA"
    - "DirectB"
    - "DirectC"
    - "DirectD"
    - "DirectE"

    # Top 3 category leaders
    - "LeaderA"
    - "LeaderB"
    - "LeaderC"
```

### 5. Review Mentions Regularly

Check for unexpected matches:

```sql
-- Find unexpected brand mentions
SELECT brand, answer_text
FROM mentions
JOIN answers_raw USING (run_id, intent_id)
WHERE normalized_name = 'mybrand'
  AND run_id = '2025-11-01T08-00-00Z';
```

Look for false positives or missing variations.

### 6. Version Brand Lists

Track brand list changes:

```bash
git add watcher.config.yaml
git commit -m "feat: add HubSpot as competitor"
```

### 7. Test Before Production

Validate brand configuration:

```bash
llm-answer-watcher validate --config watcher.config.yaml
llm-answer-watcher run --config watcher.config.yaml --dry-run
```

## Troubleshooting

### False Positives

**Problem**: Brand matches where it shouldn't

**Example**: "Hub" matches in "GitHub"

**Solution**: Use more specific aliases:

```yaml
# ❌ Too generic
brands:
  mine:
    - "Hub"

# ✅ More specific
brands:
  mine:
    - "MyHub"
    - "MyHub.io"
```

### False Negatives

**Problem**: Brand doesn't match when it should

**Example**: LLM says "Warmly.ai" but you only track "Warmly.io"

**Solution**: Add missing variation:

```yaml
brands:
  mine:
    - "Warmly"
    - "Warmly.io"
    - "Warmly.ai"    # Add missing TLD
```

### Duplicate Counting

**Problem**: Same brand counted multiple times

**Example**: "Warmly" and "Warmly.io" counted separately

**Solution**: This is expected! Normalization prevents duplicates in analysis:

```sql
-- Use normalized_name for deduplication
SELECT normalized_name, COUNT(*) as mentions
FROM mentions
GROUP BY normalized_name;

-- Use brand to see exact matches
SELECT brand, COUNT(*) as raw_mentions
FROM mentions
GROUP BY brand;
```

### Brand Not Found

**Problem**: Brand not detected in LLM response

**Possible causes:**

1. **LLM didn't mention it**: Check raw response
2. **Misspelling**: Add variations or enable fuzzy matching
3. **Different phrasing**: LLM used different name

**Debug:**

```sql
-- Check raw response
SELECT answer_text
FROM answers_raw
WHERE run_id = '2025-11-01T08-00-00Z'
  AND intent_id = 'best-tools';
```

Look for how LLM referred to your brand.

## Next Steps

- **[Intent Configuration](intents.md)**: Design prompts that surface your brand
- **[Rank Extraction](../features/rank-extraction.md)**: Understand how ranking works
- **[Brand Detection](../features/brand-detection.md)**: Deep dive into detection algorithms
- **[Historical Tracking](../features/historical-tracking.md)**: Analyze brand trends over time
