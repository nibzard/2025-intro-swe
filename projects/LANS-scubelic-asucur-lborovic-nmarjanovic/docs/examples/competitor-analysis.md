# Competitor Analysis

Track competitors comprehensively across multiple queries and LLM providers.

## Quick Start

The best example for comprehensive competitive intelligence:

**File**: [`examples/07-real-world/competitive-intelligence.config.yaml`](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/07-real-world/competitive-intelligence.config.yaml)

```bash
# Set API keys
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."

# Run competitive intelligence monitoring
llm-answer-watcher run --config examples/07-real-world/competitive-intelligence.config.yaml
```

This template demonstrates:
- Comprehensive competitor tracking across multiple providers
- Diverse buyer-intent queries
- Competitive positioning analysis
- Rank comparison

## Use Case Templates

The `examples/07-real-world/` directory includes several competitive analysis templates:

| Template | Use Case | File |
|----------|----------|------|
| **Competitive Intelligence** | Monitor how competitors are positioned | `competitive-intelligence.config.yaml` |
| **Content Gap Analysis** | Find opportunities where competitors appear but you don't | `content-gap-analysis.config.yaml` |
| **Brand Monitoring** | Track your brand vs competitors | `saas-brand-monitoring.config.yaml` |
| **LLM SEO** | Optimize for LLM visibility | `llm-seo-optimization.config.yaml` |

See the [Real-World Examples README](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/07-real-world) for details.

## Example Configuration

Here's a simplified competitive analysis config:

```yaml
run_settings:
  output_dir: "./output"
  sqlite_db_path: "./output/watcher.db"

  models:
    - provider: "openai"
      model_name: "gpt-4o-mini"
      env_api_key: "OPENAI_API_KEY"

brands:
  mine: ["YourBrand"]

  # Comprehensive competitor list
  competitors:
    - "TopCompetitor"        # Direct competitor #1
    - "RisingStartup"        # Emerging threat
    - "IndustryLeader"       # Established player
    - "NichePlayer"          # Specialized competitor
    - "AlternativeTool"      # Adjacent category
    - "LegacyProvider"       # Traditional option

intents:
  # General category query
  - id: "best-overall"
    prompt: "What are the best tools in the category?"

  # Segment-specific queries
  - id: "for-startups"
    prompt: "Best tools for startups?"

  - id: "for-enterprise"
    prompt: "Best enterprise tools?"

  # Feature-specific queries
  - id: "affordable-options"
    prompt: "Most affordable tools?"

  - id: "easiest-to-use"
    prompt: "Which tools are easiest to use?"

  # Comparison queries
  - id: "vs-leader"
    prompt: "How does YourBrand compare to TopCompetitor?"
```

## Analyzing Competitive Results

### 1. Competitor Appearance Frequency

```sql
-- How often does each competitor appear?
SELECT
    brand,
    COUNT(*) as total_mentions,
    COUNT(DISTINCT intent_id) as intents_appeared,
    ROUND(100.0 * COUNT(DISTINCT intent_id) / (
        SELECT COUNT(DISTINCT intent_id) FROM mentions WHERE run_id = '2025-11-05T14-30-00Z'
    ), 2) as coverage_pct
FROM mentions
WHERE run_id = '2025-11-05T14-30-00Z'
  AND normalized_name != 'yourbrand'
  AND is_mine = 0
GROUP BY brand
ORDER BY total_mentions DESC;
```

**Example output:**
```
TopCompetitor   | 12 | 5 | 83.33%
IndustryLeader  |  9 | 4 | 66.67%
RisingStartup   |  6 | 3 | 50.00%
YourBrand       |  5 | 3 | 50.00%
```

**Interpretation:**
- TopCompetitor appears most frequently (83% of intents)
- You're tied with RisingStartup (50% coverage)
- Opportunity: Increase visibility in missing intent categories

### 2. Average Rankings by Competitor

```sql
-- Compare average rank positions
SELECT
    brand,
    COUNT(*) as mentions,
    AVG(rank_position) as avg_rank,
    MIN(rank_position) as best_rank,
    MAX(rank_position) as worst_rank
FROM mentions
WHERE run_id = '2025-11-05T14-30-00Z'
  AND rank_position IS NOT NULL
GROUP BY brand
ORDER BY avg_rank ASC;
```

**Example output:**
```
TopCompetitor   | 12 | 1.8 | 1 | 4
YourBrand       |  5 | 2.4 | 1 | 5
IndustryLeader  |  9 | 2.9 | 1 | 6
RisingStartup   |  6 | 3.2 | 2 | 5
```

**Interpretation:**
- TopCompetitor has best average rank (1.8)
- You rank 2.4 on average (room for improvement)
- Focus on improving from #2-3 to #1

### 3. Head-to-Head Comparisons

```sql
-- When you both appear, who ranks higher?
SELECT
    m1.intent_id,
    m1.brand as your_brand,
    m1.rank_position as your_rank,
    m2.brand as competitor_brand,
    m2.rank_position as competitor_rank,
    CASE
        WHEN m1.rank_position < m2.rank_position THEN 'You win'
        WHEN m1.rank_position > m2.rank_position THEN 'Competitor wins'
        ELSE 'Tie'
    END as outcome
FROM mentions m1
JOIN mentions m2
    ON m1.run_id = m2.run_id
    AND m1.intent_id = m2.intent_id
    AND m1.model_provider = m2.model_provider
    AND m1.model_name = m2.model_name
WHERE m1.run_id = '2025-11-05T14-30-00Z'
  AND m1.is_mine = 1
  AND m2.brand = 'TopCompetitor'
  AND m1.rank_position IS NOT NULL
  AND m2.rank_position IS NOT NULL
ORDER BY m1.intent_id;
```

### 4. Identify Content Gaps

```sql
-- Which intents do competitors appear in but you don't?
SELECT
    intent_id,
    GROUP_CONCAT(DISTINCT brand) as competitors_mentioned
FROM mentions
WHERE run_id = '2025-11-05T14-30-00Z'
  AND is_mine = 0
  AND intent_id NOT IN (
      SELECT DISTINCT intent_id
      FROM mentions
      WHERE run_id = '2025-11-05T14-30-00Z'
        AND is_mine = 1
  )
GROUP BY intent_id;
```

**Example output:**
```
for-enterprise | TopCompetitor, IndustryLeader
affordable-options | RisingStartup, NichePlayer
```

**Interpretation:**
- You're missing in "enterprise" queries → Create enterprise content
- Missing in "affordable" queries → Highlight pricing

### 5. Provider-Specific Competitive Positioning

```sql
-- Which providers favor which competitors?
SELECT
    model_provider,
    brand,
    COUNT(*) as mentions,
    AVG(rank_position) as avg_rank
FROM mentions
WHERE run_id = '2025-11-05T14-30-00Z'
  AND rank_position IS NOT NULL
GROUP BY model_provider, brand
ORDER BY model_provider, avg_rank ASC;
```

## Competitive Monitoring Strategies

### 1. Daily Competitive Tracking

Monitor key competitors daily:

```bash
# Run competitive intelligence
llm-answer-watcher run --config examples/07-real-world/competitive-intelligence.config.yaml --yes --quiet

# Analyze changes
python examples/code-examples/analyze_results.py
```

See [`examples/code-examples/automated_monitoring.py`](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/code-examples/automated_monitoring.py) for automation.

### 2. Weekly Deep Dives

Run comprehensive analysis weekly:

```bash
# Multi-provider comparison
llm-answer-watcher run --config examples/02-providers/multi-provider-comparison.config.yaml

# With web search for current data
llm-answer-watcher run --config examples/03-web-search/websearch-comparison.config.yaml
```

### 3. Content Gap Analysis

Identify where competitors appear but you don't:

```bash
llm-answer-watcher run --config examples/07-real-world/content-gap-analysis.config.yaml
```

### 4. Sentiment Comparison

Track how you're described vs competitors:

```bash
llm-answer-watcher run --config examples/04-extraction/sentiment-analysis.config.yaml
```

## Competitive Intelligence Dashboard

### Key Metrics to Track

1. **Mention Rate**: % of queries where you appear
2. **Win Rate**: % of head-to-head comparisons where you rank higher
3. **Average Rank**: Your mean position when mentioned
4. **Coverage Gap**: Intents where competitors appear but you don't
5. **Provider Bias**: Which LLMs favor which brands

### SQL Dashboard Query

```sql
-- Comprehensive competitive dashboard
WITH competitor_stats AS (
    SELECT
        brand,
        COUNT(*) as mentions,
        AVG(rank_position) as avg_rank,
        MIN(rank_position) as best_rank,
        COUNT(DISTINCT intent_id) as intent_coverage
    FROM mentions
    WHERE run_id = '2025-11-05T14-30-00Z'
      AND rank_position IS NOT NULL
    GROUP BY brand
)
SELECT
    brand,
    mentions,
    ROUND(avg_rank, 2) as avg_rank,
    best_rank,
    intent_coverage,
    ROUND(100.0 * intent_coverage / (
        SELECT COUNT(DISTINCT intent_id) FROM mentions WHERE run_id = '2025-11-05T14-30-00Z'
    ), 1) as coverage_pct
FROM competitor_stats
ORDER BY mentions DESC, avg_rank ASC;
```

## Actionable Insights

### If a Competitor Consistently Ranks Higher

1. **Analyze their positioning**: Read raw responses to understand why
2. **Create targeted content**: Address the specific use cases they dominate
3. **Monitor trends**: Track if gap is widening or narrowing

### If You're Missing in Key Intents

1. **Update your content**: Create pages targeting those queries
2. **Adjust brand aliases**: Add variations that LLMs might use
3. **Test different prompts**: Try alternative phrasings

### If Provider Bias Exists

1. **Optimize for specific LLMs**: If users primarily use ChatGPT, focus there
2. **Diversify content**: Different LLMs have different preferences
3. **Track changes**: Monitor if bias shifts over time

## Next Steps

<div class="grid cards" markdown>

-   :material-chart-bar: **Content Gap Analysis**

    ---

    Find opportunities where competitors appear but you don't

    [Content Gap Template →](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/07-real-world/content-gap-analysis.config.yaml)

-   :material-database: **Historical Trends**

    ---

    Track competitive position over time

    [Trends Analysis →](../data-analytics/trends-analysis.md)

-   :material-robot: **Automate Monitoring**

    ---

    Set up daily competitive tracking

    [Automation Guide →](../user-guide/usage/automation.md)

-   :material-lightbulb: **Operations**

    ---

    Generate competitive insights automatically

    [Operations Examples →](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/05-operations)

</div>

## Additional Resources

- **[Real-World Examples](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/07-real-world)** - Complete use case templates
- **[Code Examples](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/code-examples)** - Python analysis scripts
- **[Database Queries](../data-analytics/query-examples.md)** - More SQL query examples
- **[Trends Analysis](../data-analytics/trends-analysis.md)** - Historical tracking guide
