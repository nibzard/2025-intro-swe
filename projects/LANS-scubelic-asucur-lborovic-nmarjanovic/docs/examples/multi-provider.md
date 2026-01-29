# Multi-Provider Monitoring

Compare how different LLM providers represent your brand.

## Quick Start

The easiest way to compare multiple providers is with the pre-built multi-provider example:

**File**: [`examples/02-providers/multi-provider-comparison.config.yaml`](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/02-providers/multi-provider-comparison.config.yaml)

```bash
# Set API keys for providers you want to test
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GEMINI_API_KEY="..."
export MISTRAL_API_KEY="..."
export GROK_API_KEY="xai-..."
export PERPLEXITY_API_KEY="pplx-..."

# Run comparison across all 6 providers
llm-answer-watcher run --config examples/02-providers/multi-provider-comparison.config.yaml
```

**Cost**: ~$0.037 for 3 intents × 6 providers = 18 queries

## Supported Providers

All 6 providers are demonstrated in the `examples/02-providers/` directory:

| Provider | Example Config | Model | Cost/Query | Notes |
|----------|---------------|-------|------------|-------|
| **OpenAI** | `openai.config.yaml` | gpt-4o-mini | ~$0.0008 | Fastest, cheapest |
| **Anthropic** | `anthropic.config.yaml` | claude-3-5-haiku | ~$0.002 | Great quality/price |
| **Google** | `google-gemini.config.yaml` | gemini-2.0-flash-exp | ~$0.0005 | Very fast, free tier |
| **Mistral** | `mistral.config.yaml` | mistral-large-latest | ~$0.003 | European provider |
| **Grok** | `grok.config.yaml` | grok-beta | ~$0.005 | X.AI model |
| **Perplexity** | `perplexity.config.yaml` | sonar | ~$0.001 | Built-in citations |

See the [Providers README](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/02-providers) for detailed documentation.

## Individual Provider Examples

### Test a Single Provider

Each provider has its own example config for isolated testing:

```bash
# OpenAI (recommended for first test)
llm-answer-watcher run --config examples/02-providers/openai.config.yaml

# Anthropic (Claude)
llm-answer-watcher run --config examples/02-providers/anthropic.config.yaml

# Google Gemini
llm-answer-watcher run --config examples/02-providers/google-gemini.config.yaml

# Mistral
llm-answer-watcher run --config examples/02-providers/mistral.config.yaml

# Grok
llm-answer-watcher run --config examples/02-providers/grok.config.yaml

# Perplexity
llm-answer-watcher run --config examples/02-providers/perplexity.config.yaml
```

## Configuration Example

Here's a simplified multi-provider configuration:

```yaml
run_settings:
  output_dir: "./output"
  sqlite_db_path: "./output/watcher.db"

  models:
    # Fast and cheap
    - provider: "openai"
      model_name: "gpt-4o-mini"
      env_api_key: "OPENAI_API_KEY"

    # High quality
    - provider: "anthropic"
      model_name: "claude-3-5-haiku-20241022"
      env_api_key: "ANTHROPIC_API_KEY"

    # Free tier available
    - provider: "google"
      model_name: "gemini-2.0-flash-exp"
      env_api_key: "GEMINI_API_KEY"

brands:
  mine: ["YourBrand"]
  competitors: ["CompetitorA", "CompetitorB"]

intents:
  - id: "best-tools"
    prompt: "What are the best tools in this category?"
```

## Benefits of Multi-Provider Monitoring

- **See which providers favor your brand** - Different LLMs have different training data and biases
- **Identify provider-specific biases** - Track which providers consistently rank competitors higher
- **Optimize for specific LLM platforms** - If your users primarily use ChatGPT, focus on OpenAI optimization
- **Comprehensive coverage** - Different users use different LLMs, monitor them all

## Analyzing Multi-Provider Results

### Compare Brand Mentions Across Providers

```sql
-- How often does each provider mention us?
SELECT
    model_provider,
    COUNT(*) as total_queries,
    SUM(CASE WHEN EXISTS (
        SELECT 1 FROM mentions m
        WHERE m.run_id = answers_raw.run_id
          AND m.intent_id = answers_raw.intent_id
          AND m.model_provider = answers_raw.model_provider
          AND m.is_mine = 1
    ) THEN 1 ELSE 0 END) as queries_with_brand,
    ROUND(100.0 * SUM(CASE WHEN EXISTS (
        SELECT 1 FROM mentions m
        WHERE m.run_id = answers_raw.run_id
          AND m.intent_id = answers_raw.intent_id
          AND m.model_provider = answers_raw.model_provider
          AND m.is_mine = 1
    ) THEN 1 ELSE 0 END) / COUNT(*), 2) as mention_rate_pct
FROM answers_raw
WHERE run_id = '2025-11-05T14-30-00Z'
GROUP BY model_provider
ORDER BY mention_rate_pct DESC;
```

### Compare Average Rankings by Provider

```sql
-- Which provider ranks us highest?
SELECT
    model_provider,
    AVG(rank_position) as avg_rank,
    MIN(rank_position) as best_rank,
    COUNT(*) as total_mentions
FROM mentions
WHERE run_id = '2025-11-05T14-30-00Z'
  AND is_mine = 1
  AND rank_position IS NOT NULL
GROUP BY model_provider
ORDER BY avg_rank ASC;
```

### Provider Cost Comparison

```sql
-- Cost efficiency by provider
SELECT
    model_provider,
    COUNT(*) as queries,
    SUM(estimated_cost_usd) as total_cost,
    AVG(estimated_cost_usd) as avg_cost_per_query,
    SUM(tokens_used) as total_tokens
FROM answers_raw
WHERE run_id = '2025-11-05T14-30-00Z'
GROUP BY model_provider
ORDER BY total_cost ASC;
```

## Which Providers Should You Use?

### For Testing/Development
- Use **OpenAI gpt-4o-mini** or **Google gemini-flash** (fastest, cheapest)

### For Production Monitoring
- Use **multi-provider comparison** to see all perspectives
- Track which providers consistently mention your brand

### For Specific Needs
- **Best quality**: Anthropic claude-3-5-sonnet, OpenAI gpt-4o
- **Cheapest**: Google gemini-flash, OpenAI gpt-4o-mini
- **Fastest**: Google gemini-flash
- **Citations**: Perplexity sonar
- **European data**: Mistral
- **Real-time data**: Grok (Twitter/X context)

## Provider-Specific Features

See the [Providers README](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/02-providers) for detailed documentation on each provider's unique features:

- **OpenAI**: Web search via Responses API
- **Anthropic**: Tool use, 200K context
- **Google**: Search grounding
- **Mistral**: Function calling
- **Grok**: Twitter/X integration
- **Perplexity**: Built-in web search

## Next Steps

<div class="grid cards" markdown>

-   :material-web: **Add Web Search**

    ---

    Enable real-time web search for current data

    [Web Search Examples →](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/03-web-search)

-   :material-chart-bar: **Compare Results**

    ---

    Analyze differences across providers

    [Basic Monitoring →](basic-monitoring.md)

-   :material-book-open-variant: **Provider Guides**

    ---

    Deep dive into each provider's features

    [Provider Documentation →](../providers/overview.md)

-   :material-cog: **Advanced Config**

    ---

    Budget controls, operations, extraction

    [Advanced Examples →](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/06-advanced)

</div>

## Additional Resources

- **[Examples Directory](https://github.com/nibzard/llm-answer-watcher/tree/main/examples)** - All configuration examples
- **[Provider Comparison](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/02-providers)** - Detailed provider documentation
- **[Provider Guides](../providers/overview.md)** - Complete provider reference docs
