# Function Calling for Extraction

Function calling uses LLMs to extract structured data from responses with higher accuracy than regex-based extraction. This feature enables semantic understanding of brand mentions and rankings.

## Overview

Function calling instructs the LLM to output structured JSON matching a specific schema, ensuring consistent, parseable extraction results.

### When to Use

✅ **Use function calling when:**

- Regex extraction misses complex mentions
- You need contextual understanding
- Rankings are implicit (not in explicit lists)
- Budget allows for additional API calls

❌ **Skip function calling when:**

- Regex works well for your use case
- Optimizing for cost (regex is free)
- Brand names are simple and unambiguous
- Running frequent monitoring (hourly/daily)

## Configuration

### Basic Setup

```yaml
extraction_settings:
  extraction_model:
    provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    system_prompt: "openai/extraction-default"

  method: "function_calling"
  fallback_to_regex: true
  min_confidence: 0.7
```

### Advanced Configuration

```yaml
extraction_settings:
  extraction_model:
    provider: "openai"
    model_name: "gpt-4o-mini"  # Fast, cheap extraction model
    env_api_key: "OPENAI_API_KEY"
    system_prompt: "openai/extraction-default"

  # Extraction method
  method: "function_calling"  # Options: function_calling, regex, hybrid

  # Fall back to regex if function calling fails
  fallback_to_regex: true

  # Minimum confidence threshold (0.0-1.0)
  min_confidence: 0.7

  # Maximum extraction attempts
  max_retries: 2
```

## Extraction Methods

### Method 1: Function Calling Only

Use LLM for all extraction:

```yaml
extraction_settings:
  extraction_model:
    provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"

  method: "function_calling"
  fallback_to_regex: false  # Don't fall back
```

**Cost:** ~$0.001-0.003 per extraction

### Method 2: Regex Only

Use pattern matching (no LLM):

```yaml
run_settings:
  use_llm_rank_extraction: false

# No extraction_settings needed
```

**Cost:** Free

### Method 3: Hybrid (Recommended)

Try regex first, use LLM as fallback:

```yaml
extraction_settings:
  extraction_model:
    provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"

  method: "hybrid"
  fallback_to_regex: true
```

**Cost:** Variable (free for regex hits, paid for LLM fallback)

## Function Schema

### Competitor Detection Function

```json
{
  "name": "extract_competitor_mentions",
  "description": "Extract mentions of competitor brands from LLM response",
  "parameters": {
    "type": "object",
    "properties": {
      "competitors": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "brand": {
              "type": "string",
              "description": "Exact brand name as mentioned"
            },
            "rank_position": {
              "type": "integer",
              "description": "Position in ranked list (1=first, null=not ranked)"
            },
            "confidence": {
              "type": "number",
              "description": "Confidence score 0.0-1.0"
            },
            "context": {
              "type": "string",
              "description": "Surrounding context of the mention"
            }
          },
          "required": ["brand", "confidence"]
        }
      }
    },
    "required": ["competitors"]
  }
}
```

### Example LLM Response

**Input (LLM answer):**

```
The best email warmup tools are:
1. Instantly - Great for cold email
2. Warmly - Excellent personalization
3. Lemwarm - Simple and effective
```

**Function Call Output:**

```json
{
  "competitors": [
    {
      "brand": "Instantly",
      "rank_position": 1,
      "confidence": 0.95,
      "context": "Great for cold email"
    },
    {
      "brand": "Warmly",
      "rank_position": 2,
      "confidence": 0.95,
      "context": "Excellent personalization"
    },
    {
      "brand": "Lemwarm",
      "rank_position": 3,
      "confidence": 0.90,
      "context": "Simple and effective"
    }
  ]
}
```

## Confidence Scores

### Confidence Threshold

Only accept extractions above confidence threshold:

```yaml
extraction_settings:
  min_confidence: 0.7  # Reject extractions < 70% confidence
```

### Confidence Levels

| Range | Quality | Action |
|-------|---------|--------|
| 0.90-1.00 | High | Accept automatically |
| 0.70-0.89 | Medium | Accept with review |
| 0.50-0.69 | Low | Reject or flag for review |
| 0.00-0.49 | Very Low | Reject |

### Interpreting Confidence

**High confidence (0.9+):**

- Clear, unambiguous mention
- Explicit ranking
- Standard brand name

**Medium confidence (0.7-0.9):**

- Slight ambiguity
- Implicit ranking
- Brand name variation

**Low confidence (<0.7):**

- Ambiguous mention
- Unclear ranking
- Possible false positive

## Cost Management

### Extraction Costs

Function calling adds extra API calls:

| Model | Cost per 1K tokens | Typical Extraction Cost |
|-------|-------------------|------------------------|
| gpt-4o-mini | $0.15 input / $0.60 output | $0.001-0.002 |
| gpt-4o | $2.50 input / $10.00 output | $0.010-0.020 |
| claude-3-5-haiku | $0.80 input / $4.00 output | $0.003-0.005 |

### Cost Optimization

**1. Use cheap extraction models:**

```yaml
extraction_settings:
  extraction_model:
    provider: "openai"
    model_name: "gpt-4o-mini"  # Cheapest option
```

**2. Use hybrid method:**

```yaml
extraction_settings:
  method: "hybrid"  # Free regex first, LLM fallback
```

**3. Cache extraction results:**

Extraction results are stored in SQLite and reused.

**4. Limit extraction to important intents:**

```yaml
intents:
  - id: "high-priority"
    prompt: "..."
    use_extraction: true  # Enable for this intent

  - id: "low-priority"
    prompt: "..."
    use_extraction: false  # Skip for this intent
```

## Advantages Over Regex

### 1. Semantic Understanding

**Regex:**

```
"I recommend HubSpot" → Detected
"HubSpot is not recommended" → Detected (false positive)
```

**Function Calling:**

```
"I recommend HubSpot" → Detected with positive context
"HubSpot is not recommended" → Not detected (understands negation)
```

### 2. Implicit Rankings

**LLM Response:**

```
"While Salesforce is the market leader, I prefer HubSpot for startups."
```

**Regex:** No ranking detected (no list structure)

**Function Calling:** Detects HubSpot as preferred (rank 1)

### 3. Context Extraction

Function calling extracts surrounding context:

```json
{
  "brand": "HubSpot",
  "rank_position": 1,
  "context": "Great for startups with limited budget",
  "confidence": 0.92
}
```

### 4. Handles Variations

**LLM mentions:** "HS CRM", "HubSpot's CRM", "HubSpot platform"

**Regex:** Misses variations

**Function Calling:** Normalizes all to "HubSpot"

## Debugging Function Calling

### View Function Call Logs

```bash
# Enable verbose logging
export LOG_LEVEL=DEBUG

llm-answer-watcher run --config watcher.config.yaml --verbose
```

### Check Extraction Results

```bash
# View parsed results
cat output/2025-11-05T14-30-00Z/intent_*_parsed_*.json | jq '.extraction_method'
# Output: "function_calling" or "regex"
```

### Common Issues

**Issue: Low confidence scores**

**Solution:** Adjust threshold:

```yaml
extraction_settings:
  min_confidence: 0.6  # Lower threshold
```

**Issue: High costs**

**Solution:** Switch to hybrid:

```yaml
extraction_settings:
  method: "hybrid"  # Use regex when possible
```

**Issue: Inconsistent results**

**Solution:** Use specific system prompt:

```yaml
extraction_settings:
  extraction_model:
    system_prompt: "openai/extraction-strict"  # More consistent
```

## Best Practices

### 1. Start with Regex

Test regex extraction first:

```yaml
run_settings:
  use_llm_rank_extraction: false
```

If accuracy is insufficient, enable function calling.

### 2. Use Hybrid Method

Best of both worlds:

```yaml
extraction_settings:
  method: "hybrid"
  fallback_to_regex: true
```

### 3. Monitor Extraction Costs

```sql
SELECT
    DATE(timestamp_utc) as date,
    SUM(estimated_cost_usd) as total_cost,
    COUNT(*) as extractions
FROM answers_raw
WHERE extraction_method = 'function_calling'
  AND timestamp_utc >= datetime('now', '-30 days')
GROUP BY DATE(timestamp_utc);
```

### 4. Test with Eval Suite

```bash
llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml
```

### 5. Use Dedicated Extraction Model

Don't use expensive models for extraction:

```yaml
# ❌ Bad - expensive
extraction_model:
  model_name: "gpt-4o"

# ✅ Good - cheap and fast
extraction_model:
  model_name: "gpt-4o-mini"
```

## Next Steps

<div class="grid cards" markdown>

-   :material-magnify: **Brand Detection**

    ---

    Understanding brand mention detection

    [Brand Detection →](brand-detection.md)

-   :material-sort: **Rank Extraction**

    ---

    How rankings are extracted

    [Rank Extraction →](rank-extraction.md)

-   :material-cash: **Cost Management**

    ---

    Managing LLM costs

    [Cost Management →](cost-management.md)

-   :material-test-tube: **Evaluation**

    ---

    Test extraction accuracy

    [Evaluation →](../../evaluation/overview.md)

</div>
