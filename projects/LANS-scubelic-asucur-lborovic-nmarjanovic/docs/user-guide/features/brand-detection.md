# Brand Mention Detection

Brand mention detection is the core feature of LLM Answer Watcher. It uses word-boundary regex matching to accurately identify brand mentions while preventing false positives.

## How It Works

### Word-Boundary Matching

The system uses **word-boundary regex** (`\b`) to ensure accurate matching:

```python
# Pattern: \bHubSpot\b
# Matches: "I use HubSpot daily"
# Doesn't match: "I use HubSpotter" or "hub" in "GitHub"
```

This prevents common false positives:

- ✅ "HubSpot" matches "HubSpot" exactly
- ❌ "Hub" does NOT match "HubSpot"
- ❌ "Spot" does NOT match "HubSpot"
- ❌ "hub" does NOT match "GitHub"

### Case-Insensitive Matching

All matching is case-insensitive:

```python
# All these match "HubSpot"
"HubSpot", "hubspot", "HUBSPOT", "HuBsPoT"
```

### Brand Aliases

Configure multiple aliases for each brand:

```yaml
brands:
  mine:
    - "Warmly"
    - "Warmly.io"
    - "Warmly AI"

  competitors:
    - "HubSpot"
    - "HubSpot CRM"
    - "Instantly"
    - "Instantly.ai"
```

## Configuration

### Basic Brand Configuration

Minimal configuration with your brand and competitors:

```yaml
brands:
  mine:
    - "YourBrand"

  competitors:
    - "CompetitorA"
    - "CompetitorB"
```

### Advanced Brand Configuration

Include all variations and common misspellings:

```yaml
brands:
  mine:
    - "Acme Corp"
    - "Acme"
    - "AcmeCorp"
    - "Acme.io"
    - "Acme Software"

  competitors:
    # Direct competitors
    - "Competitor One"
    - "CompetitorOne"
    - "Competitor1"

    # Market leaders
    - "Industry Leader"
    - "Big Player Inc"

    # Adjacent competitors
    - "Alternative Tool"
```

### Brand Normalization

Brands are normalized for storage and analysis:

```python
"HubSpot CRM" → "hubspot-crm"
"Instantly.ai" → "instantly-ai"
"Apollo.io" → "apollo-io"
```

This ensures consistent matching across different formats.

## Detection Methods

### Method 1: Regex (Default)

Fast, free, pattern-based detection.

**Advantages:**

- Zero cost (no API calls)
- Instant results
- 100% consistent
- Works offline

**Limitations:**

- May miss contextual mentions
- Requires exact alias match
- No semantic understanding

**Configuration:**

```yaml
run_settings:
  use_llm_rank_extraction: false
```

### Method 2: Function Calling

LLM-assisted detection using function calling for higher accuracy.

**Advantages:**

- Understands context
- Catches variations
- Semantic understanding
- Confidence scores

**Limitations:**

- Costs money per query
- Slower than regex
- Requires extraction model

**Configuration:**

```yaml
extraction_settings:
  extraction_model:
    provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"

  method: "function_calling"
  fallback_to_regex: true
  min_confidence: 0.7
```

### Method 3: Hybrid

Combines regex and function calling for best results.

**How it works:**

1. Try regex first (fast, free)
2. If regex fails, use function calling
3. Merge results with de-duplication

**Configuration:**

```yaml
extraction_settings:
  extraction_model:
    provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"

  method: "hybrid"
  fallback_to_regex: true
  min_confidence: 0.7
```

## Detection Results

### Mention Object

Each detected mention includes:

```json
{
  "brand": "HubSpot",
  "normalized_name": "hubspot",
  "is_mine": false,
  "rank_position": 1,
  "snippet": "...I recommend HubSpot for CRM needs...",
  "confidence": 1.0,
  "detection_method": "regex"
}
```

### My Brands vs Competitors

Mentions are categorized:

```json
{
  "my_mentions": [
    {
      "brand": "Warmly",
      "is_mine": true,
      "rank_position": 2
    }
  ],
  "competitor_mentions": [
    {
      "brand": "HubSpot",
      "is_mine": false,
      "rank_position": 1
    },
    {
      "brand": "Instantly",
      "is_mine": false,
      "rank_position": 3
    }
  ]
}
```

## Common Detection Patterns

### Pattern 1: Exact Brand Name

**LLM Response:**

> "The best email warmup tools are Warmly, Instantly, and Lemwarm."

**Detected:**

- ✅ Warmly
- ✅ Instantly
- ✅ Lemwarm

### Pattern 2: Brand with TLD

**LLM Response:**

> "Check out Warmly.io for email warmup."

**Detected:**

- ✅ Warmly.io

**Note:** Add both "Warmly" and "Warmly.io" as aliases to catch both.

### Pattern 3: Brand in Context

**LLM Response:**

> "Many sales teams use HubSpot CRM to manage leads."

**Detected:**

- ✅ HubSpot CRM
- ✅ HubSpot (if both aliases configured)

### Pattern 4: Case Variations

**LLM Response:**

> "HUBSPOT and hubspot are the same product."

**Detected:**

- ✅ HubSpot (both instances)

## Preventing False Positives

### Use Word Boundaries

**❌ Bad - Substring Matching:**

```yaml
brands:
  mine:
    - "Hub"  # Matches "GitHub", "HubSpot", "hub"
```

This creates false positives.

**✅ Good - Full Word Matching:**

```yaml
brands:
  mine:
    - "HubSpot"  # Only matches "HubSpot"
```

Word boundaries prevent substring matches.

### Avoid Overly Generic Names

**❌ Bad:**

```yaml
brands:
  competitors:
    - "AI"  # Too generic
    - "The"
    - "Pro"
```

**✅ Good:**

```yaml
brands:
  competitors:
    - "OpenAI"
    - "The Sales Platform"
    - "Pro CRM"
```

### Test Your Aliases

```bash
# Validate configuration
llm-answer-watcher validate --config watcher.config.yaml

# Run with example intents
llm-answer-watcher run --config watcher.config.yaml
```

## Detection Accuracy

### Evaluation Metrics

LLM Answer Watcher tracks detection accuracy:

| Metric | Description | Target |
|--------|-------------|--------|
| **Precision** | Correct mentions / Total detected | ≥ 90% |
| **Recall** | Correct mentions / Expected mentions | ≥ 80% |
| **F1 Score** | Harmonic mean of precision and recall | ≥ 85% |

### Run Evaluations

```bash
llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml
```

See [Evaluation Framework](../../evaluation/overview.md) for details.

## Advanced Detection

### Special Characters

Escape special characters in brand names:

```yaml
brands:
  mine:
    - "Brand (TM)"  # Automatically escaped
    - "Brand.io"
    - "Brand-Name"
```

The system handles escaping automatically.

### Multi-Word Brands

```yaml
brands:
  competitors:
    - "Acme Corp"
    - "Big Company Inc"
    - "The Sales Platform"
```

Word boundaries work across multiple words.

### Abbreviations

Add both full name and abbreviation:

```yaml
brands:
  competitors:
    - "Customer Relationship Management"
    - "CRM"
    - "HubSpot CRM"
```

## Debugging Detection Issues

### Issue: Brand Not Detected

**Problem:** Your brand appears in response but isn't detected.

**Solutions:**

1. Check brand alias spelling:

```bash
# View raw response
cat output/2025-11-05T14-30-00Z/intent_*_raw_*.json | jq '.answer_text'
```

2. Add alias variation:

```yaml
brands:
  mine:
    - "YourBrand"
    - "YourBrand.io"
    - "Your Brand"  # Add this
```

3. Check for special formatting:

```json
"Check out **YourBrand**"  // Bold formatting
"Visit `YourBrand.io`"     // Code formatting
```

### Issue: False Positives

**Problem:** Unrelated words are detected as brand mentions.

**Solutions:**

1. Remove overly generic aliases:

```yaml
# ❌ Remove this
brands:
  mine:
    - "AI"

# ✅ Use this instead
brands:
  mine:
    - "YourBrand AI"
```

2. Check word boundaries are working:

```bash
# Test with evaluation suite
llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml
```

### Issue: Case Sensitivity

**Problem:** Brand detected with wrong capitalization.

**Solution:** Matching is already case-insensitive, but display preserves original case from LLM response.

```python
# All match the same brand
"HubSpot" → normalized to "hubspot"
"hubspot" → normalized to "hubspot"
"HUBSPOT" → normalized to "hubspot"
```

## Best Practices

### 1. Start with Core Aliases

```yaml
brands:
  mine:
    - "YourBrand"      # Exact name
    - "YourBrand.io"   # With TLD
```

### 2. Add Variations Incrementally

Run monitoring, review results, add missing aliases:

```yaml
brands:
  mine:
    - "YourBrand"
    - "YourBrand.io"
    - "YourBrand AI"    # Added after reviewing results
    - "YB"              # Abbreviation if commonly used
```

### 3. Limit Competitor List

Track 10-20 key competitors:

```yaml
brands:
  competitors:
    # Top 5 direct competitors
    - "Competitor A"
    - "Competitor B"
    # Top 3 market leaders
    - "Market Leader"
```

### 4. Monitor Detection Metrics

```sql
-- Check detection rates
SELECT
    brand,
    COUNT(*) as total_mentions,
    COUNT(DISTINCT run_id) as runs_appeared,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM runs) as appearance_rate
FROM mentions
WHERE timestamp_utc >= datetime('now', '-30 days')
GROUP BY brand
ORDER BY total_mentions DESC;
```

### 5. Use Evaluation Suite

```bash
# Test detection before deploying
llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml

# Add custom test cases for your brands
# See: evals/testcases/fixtures.yaml
```

## Next Steps

<div class="grid cards" markdown>

-   :material-sort: **Rank Extraction**

    ---

    Learn how ranking positions are extracted

    [Rank Extraction →](rank-extraction.md)

-   :material-function: **Function Calling**

    ---

    Use LLM-assisted detection for higher accuracy

    [Function Calling →](function-calling.md)

-   :material-test-tube: **Evaluation Framework**

    ---

    Test and validate detection accuracy

    [Evaluation Guide →](../../evaluation/overview.md)

-   :material-cog: **Brand Configuration**

    ---

    Deep dive into brand configuration strategies

    [Brand Config →](../configuration/brands.md)

</div>
