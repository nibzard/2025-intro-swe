# Perplexity Provider

Integration with Perplexity's search-grounded models.

## Supported Models

- `sonar`
- `sonar-pro`
- `sonar-reasoning`
- `sonar-reasoning-pro`
- `sonar-deep-research`

## Configuration

```yaml
models:
  - provider: "perplexity"
    model_name: "sonar-pro"
    env_api_key: "PERPLEXITY_API_KEY"
```

## Getting API Key

1. Visit [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Generate API key
3. Export: `export PERPLEXITY_API_KEY=pplx-your-key`

## Features

- Built-in web search
- Real-time information
- Citations included

See [Providers Overview](overview.md) for comparison.
