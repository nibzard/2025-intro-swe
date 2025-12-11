# Basic Monitoring Example

A complete, production-ready guide for monitoring brand visibility across multiple LLM providers.

## Quick Start

The easiest way to get started is with the pre-built examples:

### 1. Minimal Example (First-Time Users)

**File**: [`examples/01-quickstart/minimal.config.yaml`](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/01-quickstart/minimal.config.yaml)

```bash
# Set API key
export OPENAI_API_KEY="sk-..."

# Run minimal example
llm-answer-watcher run --config examples/01-quickstart/minimal.config.yaml

# View results
open ./output/*/report.html
```

**Cost**: ~$0.001 | **Time**: ~5 seconds

### 2. Real-World SaaS Monitoring

**File**: [`examples/07-real-world/saas-brand-monitoring.config.yaml`](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/07-real-world/saas-brand-monitoring.config.yaml)

This template demonstrates complete production monitoring with:
- Multiple providers for comprehensive coverage
- Buyer-intent queries across different use cases
- Budget controls and cost management
- Competitor tracking

```bash
# Set required API keys
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."

# Run monitoring
llm-answer-watcher run --config examples/07-real-world/saas-brand-monitoring.config.yaml
```

**Cost**: ~$0.05-0.20 per run depending on providers and intents

## Configuration Overview

For a detailed explanation of each configuration option, see:
- [`examples/01-quickstart/explained.config.yaml`](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/01-quickstart/explained.config.yaml) - Same minimal config with inline comments

## Use Case Examples

The examples directory includes ready-to-use templates:

| Use Case | Example Config | Description |
|----------|---------------|-------------|
| **Quick Testing** | `01-quickstart/minimal.config.yaml` | Single provider, single intent |
| **Multi-Provider Comparison** | `02-providers/multi-provider-comparison.config.yaml` | Compare all 6 providers |
| **Real-Time Data** | `03-web-search/websearch-comparison.config.yaml` | Web search across providers |
| **High Accuracy** | `04-extraction/function-calling.config.yaml` | LLM-based brand extraction |
| **Automated Insights** | `05-operations/content-strategy.config.yaml` | Generate content recommendations |
| **Budget Controls** | `06-advanced/budget-controls.config.yaml` | Cost management features |
| **Production Ready** | `07-real-world/saas-brand-monitoring.config.yaml` | Complete monitoring setup |

## Environment Setup

Copy the environment template:

```bash
cp examples/.env.example .env
```

Edit `.env` and add your API keys:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
MISTRAL_API_KEY=...
GROK_API_KEY=xai-...
PERPLEXITY_API_KEY=pplx-...
```

## Understanding Output

Each run creates a timestamped directory with:

```
output/2025-11-05T14-30-00Z/
├── run_meta.json                    # Run summary and stats
├── report.html                      # Interactive HTML report
├── intent_*_raw_*.json             # Raw LLM responses
├── intent_*_parsed_*.json          # Extracted brand mentions
└── intent_*_error_*.json           # Error details (if any)
```

### HTML Report

Open the report in your browser:

```bash
open ./output/2025-11-05T14-30-00Z/report.html
```

**Report includes:**

- Summary statistics (costs, queries, mentions)
- Brand mention tables with ranks
- Rank distribution charts
- Cost breakdown by provider
- Raw LLM responses for verification

### JSON Results

View structured output:

```bash
# View run summary
cat ./output/2025-11-05T14-30-00Z/run_meta.json | jq '.'

# View specific intent results
cat ./output/*/intent_best-email-warmup-tools_parsed_openai_gpt-4o-mini.json | jq '.'
```

### SQLite Database

All data is stored in SQLite for historical tracking:

```bash
sqlite3 ./output/watcher.db

# View latest run
SELECT * FROM runs ORDER BY timestamp_utc DESC LIMIT 1;

# View your brand mentions
SELECT * FROM mentions WHERE is_mine = 1 ORDER BY timestamp_utc DESC;

# Compare competitors
SELECT brand, COUNT(*) as mentions, AVG(rank_position) as avg_rank
FROM mentions
WHERE is_mine = 0 AND rank_position IS NOT NULL
GROUP BY brand
ORDER BY mentions DESC;
```

See [SQLite Database Guide](../data-analytics/sqlite-database.md) for more queries.

## Analyzing Results

### Check Brand Visibility

```sql
-- Did we appear in any responses?
SELECT
    intent_id,
    model_provider,
    model_name,
    brand,
    rank_position
FROM mentions
WHERE is_mine = 1
  AND run_id = '2025-11-05T14-30-00Z'
ORDER BY intent_id, rank_position;
```

### Compare vs Competitors

```sql
-- How do we rank vs competitors?
SELECT
    brand,
    COUNT(*) as total_mentions,
    COUNT(DISTINCT intent_id) as intents_appeared,
    AVG(rank_position) as avg_rank,
    MIN(rank_position) as best_rank
FROM mentions
WHERE run_id = '2025-11-05T14-30-00Z'
  AND rank_position IS NOT NULL
GROUP BY brand
ORDER BY total_mentions DESC, avg_rank ASC;
```

### Identify Gaps

```sql
-- Which intents didn't mention us?
SELECT DISTINCT intent_id
FROM mentions
WHERE run_id = '2025-11-05T14-30-00Z'
  AND intent_id NOT IN (
    SELECT DISTINCT intent_id
    FROM mentions
    WHERE run_id = '2025-11-05T14-30-00Z'
      AND is_mine = 1
  );
```

## Schedule Regular Monitoring

### Daily Cron Job

See [`examples/code-examples/automated_monitoring.py`](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/code-examples/automated_monitoring.py) for a complete automation script.

Basic cron setup:

```bash
# Run daily at 9 AM
0 9 * * * cd /path/to/llm-answer-watcher && ./venv/bin/llm-answer-watcher run --config examples/07-real-world/saas-brand-monitoring.config.yaml --yes --quiet >> logs/monitoring.log 2>&1
```

See [Automation Guide](../user-guide/usage/automation.md) for more options.

## Cost Analysis

### Actual Costs

```sql
-- Total cost last 30 days
SELECT SUM(total_cost_usd) as total_cost
FROM runs
WHERE timestamp_utc >= datetime('now', '-30 days');

-- Cost by provider
SELECT
    model_provider,
    SUM(estimated_cost_usd) as provider_cost,
    COUNT(*) as queries
FROM answers_raw
WHERE timestamp_utc >= datetime('now', '-30 days')
GROUP BY model_provider;
```

### Cost Optimization

**Budget Examples:**

- **Minimal**: Use `01-quickstart/minimal.config.yaml` (~$0.001 per run)
- **Budget-Constrained**: Use `06-advanced/budget-controls.config.yaml` (~$0.01 per run)
- **Production**: Use `07-real-world/saas-brand-monitoring.config.yaml` (~$0.05-0.20 per run)

See [Budget Controls](../user-guide/configuration/budget.md) for more details.

## Troubleshooting

### No Brand Mentions

**Problem:** Your brand never appears

**Solutions:**

1. Check brand aliases in your config:

```yaml
brands:
  mine:
    - "YourBrand"
    - "YourBrand.io"
    - "YourBrand AI"
    - "yourbrand.com"  # Add domain variations
```

2. View raw responses to verify:

```bash
cat output/*/intent_*_raw_*.json | jq '.answer_text' | grep -i "yourbrand"
```

3. Try more specific prompts:

```yaml
intents:
  - id: "branded-comparison"
    prompt: "Compare YourBrand vs Competitor for [use case]"
```

### High Costs

**Problem:** Costs exceed budget

**Solutions:**

1. Use the budget-controls example:

```bash
llm-answer-watcher run --config examples/06-advanced/budget-controls.config.yaml
```

2. Switch to cheaper models:

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"  # Cheapest option
```

3. Reduce intent count or providers

### Rate Limiting

**Problem:** API rate limits hit

**Solution:** Reduce concurrency:

```yaml
run_settings:
  max_concurrent_requests: 1  # Sequential processing
  delay_between_queries: 2     # 2 second delay
```

## Next Steps

<div class="grid cards" markdown>

-   :material-compare: **Multi-Provider Comparison**

    ---

    Compare multiple LLM providers side-by-side

    [Multi-Provider Example →](multi-provider.md)

-   :material-chart-line: **Competitor Analysis**

    ---

    Deep dive into competitor positioning

    [Competitor Analysis →](competitor-analysis.md)

-   :material-database: **Historical Trends**

    ---

    Track changes over time with SQL

    [Trends Analysis →](../data-analytics/trends-analysis.md)

-   :material-robot: **Automation**

    ---

    Set up scheduled monitoring with cron or CI/CD

    [Automation Guide →](../user-guide/usage/automation.md)

</div>

## Additional Resources

- **[Examples Directory](https://github.com/nibzard/llm-answer-watcher/tree/main/examples)** - All configuration examples
- **[Code Examples](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/code-examples)** - Python automation scripts
- **[Configuration Reference](../reference/configuration-schema.md)** - Complete config schema
- **[Database Schema](../reference/database-schema.md)** - SQLite database structure
