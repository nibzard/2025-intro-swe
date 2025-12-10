# Sentiment Analysis & Intent Classification

Advanced analysis features that extract sentiment, context, and intent from brand mentions and user queries using LLM function calling.

!!! info "New in v0.1.0"
    These features were added to enhance brand mention analysis and enable prioritization of high-value queries.

## Overview

LLM Answer Watcher includes two powerful analysis features:

1. **Sentiment Analysis**: Analyzes the tone and context of each brand mention
2. **Intent Classification**: Determines the user's intent and buyer journey stage for each query

Both features use OpenAI's function calling API for accurate, structured extraction.

## Sentiment Analysis

### What It Analyzes

For each brand mention, the system extracts:

**Sentiment** - Emotional tone:
- `positive`: Brand recommended or praised
- `neutral`: Brand mentioned without judgment
- `negative`: Brand criticized or not recommended

**Mention Context** - How the brand was mentioned:
- `primary_recommendation`: Brand is the top recommendation
- `alternative_listing`: Brand listed as one of several options
- `competitor_negative`: Brand mentioned as inferior to others
- `competitor_neutral`: Brand compared without negative bias
- `passing_reference`: Brief mention without detail

### Example

Query: *"What are the best email warmup tools?"*

LLM Response: *"The best tools are Lemwarm for automated warmup and Instantly for cold outreach. HubSpot is also an option but quite expensive."*

**Extracted Sentiments:**

| Brand | Sentiment | Context | Reasoning |
|-------|-----------|---------|-----------|
| Lemwarm | `positive` | `primary_recommendation` | Listed first with positive qualifier |
| Instantly | `positive` | `primary_recommendation` | Listed alongside Lemwarm with use case |
| HubSpot | `neutral` | `alternative_listing` | Mentioned as option with cost caveat |

### Configuration

Enable sentiment analysis in `extraction_settings`:

```yaml
extraction_settings:
  extraction_model:
    provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"

  method: "function_calling"

  # Enable sentiment analysis (default: true)
  enable_sentiment_analysis: true
```

!!! warning "Function Calling Required"
    Sentiment analysis only works with `method: "function_calling"`. Regex extraction does not support sentiment analysis (fields will be `None`).

### Cost Impact

Sentiment analysis is integrated into function calling extraction:

- **No extra LLM calls** - sentiment extracted in same call as brand mentions
- **Cost increase**: ~33% per extraction call due to larger response schema
- **Example**: $0.0002 → $0.00027 per extraction with gpt-4o-mini

### Database Storage

Sentiments are stored in the `mentions` table:

```sql
SELECT brand, sentiment, mention_context, timestamp_utc
FROM mentions
WHERE sentiment = 'positive'
  AND mention_context = 'primary_recommendation'
ORDER BY timestamp_utc DESC;
```

Schema:

```sql
ALTER TABLE mentions ADD COLUMN sentiment TEXT;
ALTER TABLE mentions ADD COLUMN mention_context TEXT;
```

## Intent Classification

### What It Classifies

For each user query, the system determines:

**Intent Type** - What the user wants:
- `transactional`: Ready to buy/use a tool
- `commercial_investigation`: Researching options before purchase
- `informational`: Learning about a topic
- `navigational`: Looking for a specific brand/site

**Buyer Journey Stage** - Where they are in the purchase process:
- `awareness`: Learning about the category
- `consideration`: Evaluating options
- `decision`: Ready to choose/purchase

**Urgency Signal** - How urgent is the need:
- `high`: Immediate need ("now", "urgent", "today")
- `medium`: Near-term need ("soon", "this week")
- `low`: Future or casual exploration

**Classification Confidence** - How confident the model is (0.0-1.0)

**Reasoning** - Explanation of why it was classified this way

### Examples

#### High-Value Query

Query: *"What are the best email warmup tools to buy now for my outreach campaign?"*

Classification:
```json
{
  "intent_type": "transactional",
  "buyer_stage": "decision",
  "urgency_signal": "high",
  "classification_confidence": 0.95,
  "reasoning": "Query contains 'buy now' and specific use case, indicating ready-to-purchase intent with high urgency"
}
```

#### Research Query

Query: *"How do email warmup tools work?"*

Classification:
```json
{
  "intent_type": "informational",
  "buyer_stage": "awareness",
  "urgency_signal": "low",
  "classification_confidence": 0.92,
  "reasoning": "Query seeks explanation, indicating learning phase without purchase intent"
}
```

#### Comparison Query

Query: *"Compare Lemwarm vs Instantly for cold email"*

Classification:
```json
{
  "intent_type": "commercial_investigation",
  "buyer_stage": "consideration",
  "urgency_signal": "medium",
  "classification_confidence": 0.88,
  "reasoning": "Direct comparison of specific brands indicates evaluation phase before purchase decision"
}
```

### Configuration

Enable intent classification in `extraction_settings`:

```yaml
extraction_settings:
  extraction_model:
    provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"

  # Enable intent classification (default: true)
  enable_intent_classification: true
```

### Cost Impact

Intent classification adds one extra LLM call per unique query:

- **Cost**: ~$0.00012 per query with gpt-4o-mini
- **When**: Before extracting brand mentions
- **Caching**: Results are cached by query hash, so repeated queries are free

**Example cost breakdown:**
- 3 intents × 1 model = 3 queries
- Intent classification: 3 × $0.00012 = $0.00036
- Extraction: 3 × $0.0002 = $0.0006
- **Total**: ~$0.001 per run

### Database Storage

Intent classifications are stored in `intent_classifications` table:

```sql
SELECT intent_id, intent_type, buyer_stage, urgency_signal, reasoning
FROM intent_classifications
WHERE buyer_stage = 'decision'
  AND urgency_signal = 'high'
ORDER BY classification_confidence DESC;
```

Schema:

```sql
CREATE TABLE intent_classifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    intent_id TEXT NOT NULL,
    query_text TEXT NOT NULL,
    query_hash TEXT NOT NULL,
    intent_type TEXT NOT NULL,
    buyer_stage TEXT NOT NULL,
    urgency_signal TEXT NOT NULL,
    classification_confidence REAL NOT NULL,
    reasoning TEXT,
    timestamp_utc TEXT NOT NULL,
    UNIQUE(run_id, intent_id)
);
```

### Query Hash Caching

Intent classifications are cached by query hash:

```python
# Normalized query → hash
"What are the best email warmup tools?"
→ "5d41402abc4b2a76b9719d911017c592..."

# Same hash for semantically identical queries
"  what are the BEST email warmup tools?  "
→ "5d41402abc4b2a76b9719d911017c592..." (same hash)
```

Caching benefits:
- **Saves API calls**: Repeated queries use cached results
- **Normalizes variations**: Whitespace/case differences don't matter
- **Persistent cache**: Stored in database across runs

## Use Cases

### 1. Prioritize High-Value Queries

Focus on queries with high buyer intent:

```sql
SELECT m.brand, ic.intent_type, ic.buyer_stage, ic.urgency_signal
FROM mentions m
JOIN intent_classifications ic ON m.intent_id = ic.intent_id
WHERE ic.intent_type = 'transactional'
  AND ic.buyer_stage = 'decision'
  AND ic.urgency_signal = 'high'
  AND m.sentiment = 'positive';
```

### 2. Track Sentiment Trends

Monitor how sentiment changes over time:

```sql
SELECT DATE(timestamp_utc) as date,
       sentiment,
       COUNT(*) as mentions
FROM mentions
WHERE normalized_name = 'yourbrand'
GROUP BY DATE(timestamp_utc), sentiment
ORDER BY date DESC;
```

### 3. Identify Context Patterns

See how your brand is typically mentioned:

```sql
SELECT mention_context,
       COUNT(*) as count,
       ROUND(AVG(CASE sentiment
           WHEN 'positive' THEN 1.0
           WHEN 'neutral' THEN 0.5
           WHEN 'negative' THEN 0.0
       END), 2) as sentiment_score
FROM mentions
WHERE normalized_name = 'yourbrand'
GROUP BY mention_context
ORDER BY count DESC;
```

### 4. ROI Analysis

Calculate value of brand mentions by intent:

```sql
SELECT ic.buyer_stage,
       COUNT(DISTINCT m.brand) as brands_mentioned,
       COUNT(*) as total_mentions
FROM mentions m
JOIN intent_classifications ic ON m.intent_id = ic.intent_id
WHERE m.is_mine = 1
GROUP BY ic.buyer_stage
ORDER BY CASE ic.buyer_stage
    WHEN 'decision' THEN 1
    WHEN 'consideration' THEN 2
    WHEN 'awareness' THEN 3
END;
```

## Disabling Features

### Disable Sentiment Analysis

```yaml
extraction_settings:
  enable_sentiment_analysis: false
```

**Result**: `sentiment` and `mention_context` fields will be `None` in database.

### Disable Intent Classification

```yaml
extraction_settings:
  enable_intent_classification: false
```

**Result**: No rows in `intent_classifications` table, queries classified as `None`.

### Disable Both

```yaml
extraction_settings:
  enable_sentiment_analysis: false
  enable_intent_classification: false
```

**Benefit**: Reduces costs by ~33% for extraction calls and eliminates intent classification calls.

## Limitations

### Function Calling Only

Both features require `method: "function_calling"`:

```yaml
extraction_settings:
  method: "function_calling"  # Required
  enable_sentiment_analysis: true
  enable_intent_classification: true
```

Regex extraction does not support these features.

### Provider Support

Currently only OpenAI supports function calling for extraction:

```yaml
extraction_model:
  provider: "openai"  # Required
  model_name: "gpt-4o-mini"
```

Anthropic, Mistral, and other providers coming soon.

### Confidence Thresholds

Low confidence classifications may be inaccurate:

```sql
-- Filter by confidence
SELECT *
FROM intent_classifications
WHERE classification_confidence >= 0.8;
```

## Best Practices

### 1. Enable for High-Value Monitoring

Use sentiment/intent for business-critical queries:

```yaml
# Production config - full analysis
extraction_settings:
  method: "function_calling"
  enable_sentiment_analysis: true
  enable_intent_classification: true
```

### 2. Disable for Cost Optimization

Skip for budget-constrained or high-frequency monitoring:

```yaml
# Cost-optimized config
extraction_settings:
  method: "regex"  # No function calling
  enable_sentiment_analysis: false
  enable_intent_classification: false
```

### 3. Review Classification Reasoning

Check why queries were classified:

```sql
SELECT query_text, intent_type, buyer_stage, reasoning
FROM intent_classifications
WHERE classification_confidence < 0.8;
```

### 4. Track Sentiment Distribution

Monitor the health of your brand's mentions:

```sql
SELECT sentiment,
       COUNT(*) as mentions,
       ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM mentions
WHERE normalized_name = 'yourbrand'
GROUP BY sentiment;
```

**Healthy distribution**: 70%+ positive, <10% negative

## Next Steps

<div class="grid cards" markdown>

-   :material-function-variant: **Function Calling**

    ---

    Learn how function calling works

    [Function Calling →](function-calling.md)

-   :material-database: **Query Examples**

    ---

    SQL queries for sentiment analysis

    [Query Examples →](../../data-analytics/query-examples.md)

-   :material-cash: **Cost Management**

    ---

    Understand cost implications

    [Cost Management →](cost-management.md)

-   :material-chart-line: **Trends Analysis**

    ---

    Track sentiment over time

    [Trends →](../../data-analytics/trends-analysis.md)

</div>
