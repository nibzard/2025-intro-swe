# Cost Management

Control and monitor LLM API costs with built-in budget protection.

## Features

- Pre-run cost estimation
- Budget limits (per run, per intent)
- Real-time cost tracking
- Cost breakdowns by provider/model

## Budget Configuration

```yaml
run_settings:
  budget:
    enabled: true
    max_per_run_usd: 1.00
    max_per_intent_usd: 0.10
    warn_threshold_usd: 0.50
```

## Cost Estimation

Before running, the tool estimates costs based on:

- Number of intents
- Number of models
- Average tokens per query
- Provider pricing

See [Budget Controls](../configuration/budget.md) for detailed configuration.
