# Budget-Constrained Monitoring

Minimize costs while maintaining monitoring quality.

## Quick Start

The best example for cost-optimized monitoring:

**File**: [`examples/06-advanced/budget-controls.config.yaml`](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/06-advanced/budget-controls.config.yaml)

```bash
# Set API key
export OPENAI_API_KEY="sk-..."

# Run with budget controls
llm-answer-watcher run --config examples/06-advanced/budget-controls.config.yaml
```

**Features:**
- Strict budget limits (abort if exceeded)
- Warning thresholds
- Cost-effective model selection
- Optimized configuration

## Budget Control Options

### Example Configuration

```yaml
run_settings:
  output_dir: "./output"

  models:
    # Use cheapest effective model
    - provider: "openai"
      model_name: "gpt-4o-mini"
      env_api_key: "OPENAI_API_KEY"

  # Regex extraction (no extra LLM calls)
  use_llm_rank_extraction: false

  # Set budget limits
  budget:
    enabled: true
    max_per_run_usd: 0.10       # Abort if total exceeds 10 cents
    warn_threshold_usd: 0.05    # Warn at 5 cents
    max_per_intent_usd: 0.02    # Abort if single intent exceeds 2 cents

brands:
  mine: ["YourBrand"]
  # Focus on top 3 competitors only
  competitors: ["TopCompetitor1", "TopCompetitor2", "TopCompetitor3"]

intents:
  # Single most valuable intent
  - id: "main-query"
    prompt: "What are the best tools in my category?"
```

## Cost Optimization Strategies

### 1. Use Cheapest Models

| Provider | Model | Cost per 1M input tokens | Recommended for |
|----------|-------|-------------------------|-----------------|
| **Google** | gemini-2.0-flash-exp | Free tier available | Testing, development |
| **OpenAI** | gpt-4o-mini | $0.15 | Production monitoring |
| **Perplexity** | sonar | ~$0.20 | With web search |
| **Anthropic** | claude-3-5-haiku | $0.80 | High quality needed |

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"  # Best value
```

### 2. Minimize Intent Count

Focus on highest-value buyer-intent queries:

```yaml
intents:
  # Single most important query
  - id: "primary-buyer-intent"
    prompt: "What are the best [your category] tools?"

  # Optional: Add 1-2 more if budget allows
  # - id: "secondary-query"
  #   prompt: "..."
```

### 3. Use Regex Extraction (Not LLM)

Disable LLM-based rank extraction to save costs:

```yaml
run_settings:
  use_llm_rank_extraction: false  # Use regex only (~85% accuracy)
```

This eliminates extra LLM calls for rank extraction.

### 4. Reduce Providers

Start with 1-2 providers instead of all 6:

```yaml
models:
  # Single provider for budget monitoring
  - provider: "openai"
    model_name: "gpt-4o-mini"
```

### 5. Enable Budget Controls

Set strict limits to prevent cost overruns:

```yaml
budget:
  enabled: true
  max_per_run_usd: 0.05      # Hard limit
  warn_threshold_usd: 0.02   # Early warning
```

## Cost Estimates

### Ultra-Minimal Config

**Config**: `examples/01-quickstart/minimal.config.yaml`

- 1 intent × 1 model (gpt-4o-mini)
- Cost: ~$0.001 per run
- Monthly (daily): ~$0.03/month

### Budget-Constrained Config

**Config**: `examples/06-advanced/budget-controls.config.yaml`

- 3 intents × 1 model (gpt-4o-mini)
- Cost: ~$0.006 per run
- Monthly (daily): ~$0.18/month

### Moderate Budget Config

- 3 intents × 2 models (gpt-4o-mini + claude-haiku)
- Cost: ~$0.012 per run
- Monthly (daily): ~$0.36/month

## Monitoring Actual Costs

### Track Costs in Database

```sql
-- Total cost last 30 days
SELECT SUM(total_cost_usd) as total_cost
FROM runs
WHERE timestamp_utc >= datetime('now', '-30 days');

-- Cost by provider
SELECT
    model_provider,
    SUM(estimated_cost_usd) as provider_cost,
    COUNT(*) as queries,
    AVG(estimated_cost_usd) as avg_per_query
FROM answers_raw
WHERE timestamp_utc >= datetime('now', '-30 days')
GROUP BY model_provider;

-- Cost trend over time
SELECT
    DATE(timestamp_utc) as date,
    SUM(total_cost_usd) as daily_cost
FROM runs
WHERE timestamp_utc >= datetime('now', '-30 days')
GROUP BY DATE(timestamp_utc)
ORDER BY date DESC;
```

### Set Budget Alerts

If costs exceed thresholds, the tool will:
- **Warn** at `warn_threshold_usd`
- **Abort** at `max_per_run_usd`

Example output:

```
⚠️  Warning: Cost approaching budget limit
   Current: $0.048
   Limit: $0.05
   Queries remaining: ~2
```

## Trade-offs: Cost vs. Features

| Feature | Cost Impact | Alternative |
|---------|-------------|-------------|
| **LLM rank extraction** | +$0.001/query | Use regex (85% accuracy) |
| **Web search** | +$0.01/query | Skip for non-time-sensitive |
| **Operations** | +$0.005/query | Run separately when needed |
| **Multiple providers** | ×N providers | Use 1-2 providers |
| **Function calling** | +$0.001/query | Use regex extraction |

## When to Increase Budget

Consider increasing your budget if:

1. **Low visibility**: Your brand rarely appears
   - Solution: Add more intents, try different phrasing

2. **Missing competitors**: Important competitors not tracked
   - Solution: Add more competitor brands

3. **Limited provider coverage**: Only testing 1 provider
   - Solution: Add 1-2 more providers for comparison

4. **Need real-time data**: Using stale LLM knowledge
   - Solution: Enable web search (see `examples/03-web-search/`)

## Free Tier Options

### Google Gemini Free Tier

Google offers free tier for Gemini models:

```yaml
models:
  - provider: "google"
    model_name: "gemini-2.0-flash-exp"
    env_api_key: "GEMINI_API_KEY"
```

**Free tier limits:**
- 15 requests/minute
- 1,500 requests/day
- 1 million requests/month

Perfect for testing and low-volume monitoring.

See [`examples/02-providers/google-gemini.config.yaml`](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/02-providers/google-gemini.config.yaml)

## Next Steps

<div class="grid cards" markdown>

-   :material-cash: **Cost Management**

    ---

    Learn more about budget controls and cost optimization

    [Cost Management Guide →](../user-guide/features/cost-management.md)

-   :material-rocket-launch: **Start Minimal**

    ---

    Try the absolute minimum config first

    [Quickstart Examples →](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/01-quickstart)

-   :material-chart-line: **Scale Up**

    ---

    When ready, add more providers and features

    [Multi-Provider Example →](multi-provider.md)

-   :material-database: **Track Costs**

    ---

    Query cost history in SQLite

    [Database Guide →](../data-analytics/sqlite-database.md)

</div>

## Additional Resources

- **[Budget Controls Example](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/06-advanced/budget-controls.config.yaml)** - Complete budget config
- **[Cost Management](../user-guide/features/cost-management.md)** - Full cost management documentation
- **[Provider Pricing](../providers/overview.md)** - Compare provider costs
