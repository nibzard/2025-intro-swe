# Rank Extraction

Rank extraction identifies where brands appear in ranked lists within LLM responses. This feature helps track competitive positioning and brand visibility.

## Overview

When LLMs generate lists like "The best tools are:", rank extraction determines:

1. **Position**: Where each brand appears (1st, 2nd, 3rd, etc.)
2. **Context**: Whether it's an explicit ranking or casual mention
3. **Competitors**: How your brand ranks against competitors

## How It Works

### Pattern-Based Extraction (Default)

Uses regex patterns to detect numbered or bulleted lists:

**Supported Patterns:**

```
# Numbered lists
1. HubSpot
2. Salesforce
3. Pipedrive

# With periods
1) HubSpot
2) Salesforce

# With dashes
- HubSpot
- Salesforce

# With asterisks
* HubSpot
* Salesforce

# With letters
a. HubSpot
b. Salesforce
```

### Ranking Algorithm

1. **Detect List Structure**: Find numbered/bulleted lists in response
2. **Extract Brand Names**: Match brands within list items
3. **Assign Positions**: Number brands sequentially (1, 2, 3...)
4. **Handle Ties**: Brands in same list item get same rank

## Configuration

### Use Regex Extraction (Free)

Default method - no additional configuration needed:

```yaml
run_settings:
  use_llm_rank_extraction: false  # Use pattern-based extraction
```

**Advantages:**

- ✅ Zero cost
- ✅ Fast
- ✅ Deterministic
- ✅ Works offline

**Limitations:**

- ❌ May miss implicit rankings
- ❌ Requires explicit list structure
- ❌ No semantic understanding

### Use LLM Extraction (Paid)

LLM-assisted extraction for complex rankings:

```yaml
run_settings:
  use_llm_rank_extraction: true  # Use LLM for extraction

extraction_settings:
  extraction_model:
    provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
  method: "function_calling"
  min_confidence: 0.7
```

**Advantages:**

- ✅ Understands context
- ✅ Extracts implicit rankings
- ✅ Handles complex formats
- ✅ Semantic understanding

**Limitations:**

- ❌ Costs money per query
- ❌ Slower than regex
- ❌ May be inconsistent

## Ranking Examples

### Example 1: Simple Numbered List

**LLM Response:**

```
The best email warmup tools are:
1. Instantly
2. Warmly
3. Lemwarm
```

**Extracted Rankings:**

```json
[
  {"brand": "Instantly", "rank_position": 1},
  {"brand": "Warmly", "rank_position": 2},
  {"brand": "Lemwarm", "rank_position": 3}
]
```

### Example 2: Descriptive List

**LLM Response:**

```
Top CRM tools:
1. HubSpot - Great for startups
2. Salesforce - Enterprise solution
3. Pipedrive - Sales-focused
```

**Extracted Rankings:**

```json
[
  {"brand": "HubSpot", "rank_position": 1},
  {"brand": "Salesforce", "rank_position": 2},
  {"brand": "Pipedrive", "rank_position": 3}
]
```

### Example 3: Multiple Brands Per Item

**LLM Response:**

```
Best tools for sales teams:
1. HubSpot and Salesforce for enterprise
2. Pipedrive for small teams
```

**Extracted Rankings:**

```json
[
  {"brand": "HubSpot", "rank_position": 1},
  {"brand": "Salesforce", "rank_position": 1},
  {"brand": "Pipedrive", "rank_position": 2}
]
```

### Example 4: Bulleted List

**LLM Response:**

```
- Instantly: Best for cold email
- Warmly: Great for personalization
- Lemwarm: Simple and effective
```

**Extracted Rankings:**

```json
[
  {"brand": "Instantly", "rank_position": 1},
  {"brand": "Warmly", "rank_position": 2},
  {"brand": "Lemwarm", "rank_position": 3}
]
```

### Example 5: Prose (No Ranking)

**LLM Response:**

```
I've used HubSpot, Salesforce, and Pipedrive. They're all good options.
```

**Extracted Rankings:**

```json
[
  {"brand": "HubSpot", "rank_position": null},
  {"brand": "Salesforce", "rank_position": null},
  {"brand": "Pipedrive", "rank_position": null}
]
```

**Note:** Mentions detected but no ranking assigned (not in a list).

## Rank Position Meanings

### Position 1

**Highest visibility** - First recommendation.

```sql
-- Count #1 rankings
SELECT brand, COUNT(*) as first_place_count
FROM mentions
WHERE rank_position = 1
  AND timestamp_utc >= datetime('now', '-30 days')
GROUP BY brand
ORDER BY first_place_count DESC;
```

### Positions 2-5

**High visibility** - Listed in top recommendations.

### Positions 6-10

**Medium visibility** - Included in comprehensive lists.

### Position NULL

**Mentioned but not ranked** - Appears in prose or examples.

## Analyzing Rankings

### Average Rank Position

Lower is better (1 is best):

```sql
SELECT
    brand,
    AVG(rank_position) as avg_rank,
    COUNT(*) as mentions,
    COUNT(CASE WHEN rank_position = 1 THEN 1 END) as first_place_count
FROM mentions
WHERE rank_position IS NOT NULL
  AND timestamp_utc >= datetime('now', '-30 days')
GROUP BY brand
ORDER BY avg_rank ASC;
```

### Rank Distribution

See where brands typically appear:

```sql
SELECT
    rank_position,
    COUNT(*) as mention_count,
    COUNT(DISTINCT brand) as unique_brands
FROM mentions
WHERE rank_position IS NOT NULL
GROUP BY rank_position
ORDER BY rank_position;
```

### Competitor Comparison

Compare your rank against competitors:

```sql
SELECT
    m1.run_id,
    m1.intent_id,
    my_brand.rank_position as my_rank,
    competitor.brand as competitor_name,
    competitor.rank_position as competitor_rank
FROM mentions m1
JOIN mentions my_brand ON m1.run_id = my_brand.run_id
  AND m1.intent_id = my_brand.intent_id
  AND my_brand.is_mine = 1
JOIN mentions competitor ON m1.run_id = competitor.run_id
  AND m1.intent_id = competitor.intent_id
  AND competitor.is_mine = 0
WHERE m1.timestamp_utc >= datetime('now', '-7 days')
ORDER BY m1.timestamp_utc DESC;
```

## Rank Trends

Track how rankings change over time:

```sql
SELECT
    DATE(timestamp_utc) as date,
    brand,
    AVG(rank_position) as avg_rank,
    COUNT(*) as mentions
FROM mentions
WHERE rank_position IS NOT NULL
  AND brand = 'YourBrand'
  AND timestamp_utc >= datetime('now', '-30 days')
GROUP BY DATE(timestamp_utc), brand
ORDER BY date DESC;
```

## Common Ranking Patterns

### Pattern 1: Direct Recommendation

**Prompt:** "What's the best CRM?"

**Response:** "I recommend HubSpot for most teams."

**Rank:** Position 1 (single recommendation)

### Pattern 2: Top 3 List

**Prompt:** "Top 3 CRM tools?"

**Response:**

```
1. HubSpot
2. Salesforce
3. Pipedrive
```

**Rank:** Explicit positions 1-3

### Pattern 3: Comprehensive List

**Prompt:** "List all major CRM tools"

**Response:** Lists 10+ tools

**Rank:** All assigned positions, less emphasis on specific rank

### Pattern 4: Categorized Lists

**Prompt:** "Best CRM by company size?"

**Response:**

```
For startups:
1. HubSpot
2. Pipedrive

For enterprise:
1. Salesforce
2. Microsoft Dynamics
```

**Rank:** Multiple brands at position 1 (different categories)

## Debugging Ranking Issues

### Issue: No Rankings Detected

**Problem:** Brands detected but `rank_position` is `null`.

**Cause:** Response doesn't contain explicit lists.

**Example Response:**

```
I've used HubSpot and Salesforce. Both are great options.
```

**Solution:**

1. Update intent prompts to encourage rankings:

```yaml
# ❌ Generic
prompt: "Tell me about CRM tools"

# ✅ Ranking-focused
prompt: "What are the top 5 CRM tools ranked by popularity?"
```

2. Enable LLM rank extraction:

```yaml
run_settings:
  use_llm_rank_extraction: true
```

### Issue: Incorrect Rankings

**Problem:** Rankings don't match actual LLM response order.

**Debugging:**

```bash
# View raw response
cat output/2025-11-05T14-30-00Z/intent_*_raw_*.json | jq '.answer_text'

# View extracted rankings
cat output/2025-11-05T14-30-00Z/intent_*_parsed_*.json | jq '.ranked_list'
```

**Solutions:**

1. Check for unusual list formatting
2. Enable LLM rank extraction
3. Add evaluation test case

### Issue: All Brands Ranked #1

**Problem:** Multiple brands get `rank_position: 1`.

**Cause:** Brands appear in separate lists or categories.

**Example:**

```
Best for startups: HubSpot
Best for enterprise: Salesforce
```

Both get rank 1 (different contexts).

**This is correct behavior** - each is #1 in its category.

## Best Practices

### 1. Design Ranking-Friendly Prompts

```yaml
intents:
  # ✅ Good - Encourages ranking
  - id: "top-5-crm-tools"
    prompt: "What are the top 5 CRM tools ranked by market share?"

  # ✅ Good - Specific ranking criteria
  - id: "best-for-startups"
    prompt: "Rank the best CRM tools for early-stage startups"

  # ❌ Bad - No ranking signal
  - id: "crm-info"
    prompt: "Tell me about CRM software"
```

### 2. Use Regex First, LLM as Fallback

```yaml
extraction_settings:
  method: "hybrid"  # Try regex, fallback to LLM
  fallback_to_regex: true
```

### 3. Track Rank Changes

```sql
-- Alert when rank drops
WITH latest_ranks AS (
  SELECT brand, AVG(rank_position) as current_avg
  FROM mentions
  WHERE timestamp_utc >= datetime('now', '-7 days')
    AND brand = 'YourBrand'
  GROUP BY brand
),
previous_ranks AS (
  SELECT brand, AVG(rank_position) as previous_avg
  FROM mentions
  WHERE timestamp_utc >= datetime('now', '-14 days')
    AND timestamp_utc < datetime('now', '-7 days')
    AND brand = 'YourBrand'
  GROUP BY brand
)
SELECT
  l.brand,
  p.previous_avg as previous_rank,
  l.current_avg as current_rank,
  l.current_avg - p.previous_avg as rank_change
FROM latest_ranks l
JOIN previous_ranks p ON l.brand = p.brand
WHERE l.current_avg > p.previous_avg;  -- Rank got worse (higher number)
```

### 4. Analyze by Intent

Some intents may favor certain brands:

```sql
SELECT
    intent_id,
    brand,
    AVG(rank_position) as avg_rank,
    COUNT(*) as mentions
FROM mentions
WHERE rank_position IS NOT NULL
GROUP BY intent_id, brand
ORDER BY intent_id, avg_rank;
```

### 5. Monitor First-Place Wins

```sql
-- Track #1 rankings over time
SELECT
    DATE(timestamp_utc) as date,
    COUNT(CASE WHEN is_mine = 1 THEN 1 END) as my_first_place,
    COUNT(CASE WHEN is_mine = 0 THEN 1 END) as competitor_first_place
FROM mentions
WHERE rank_position = 1
  AND timestamp_utc >= datetime('now', '-30 days')
GROUP BY DATE(timestamp_utc)
ORDER BY date DESC;
```

## Next Steps

<div class="grid cards" markdown>

-   :material-magnify: **Brand Detection**

    ---

    Learn how brands are detected

    [Brand Detection →](brand-detection.md)

-   :material-function: **Function Calling**

    ---

    Use LLM-assisted ranking extraction

    [Function Calling →](function-calling.md)

-   :material-database: **Query Examples**

    ---

    SQL queries for ranking analysis

    [Query Examples →](../../data-analytics/query-examples.md)

-   :material-chart-line: **Trends Analysis**

    ---

    Track ranking changes over time

    [Trends Analysis →](../../data-analytics/trends-analysis.md)

</div>
