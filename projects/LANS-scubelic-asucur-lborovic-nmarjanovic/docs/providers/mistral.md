# Mistral AI Provider

Integration with Mistral's models.

## Supported Models

- `mistral-large-latest`
- `mistral-small-latest`

## Configuration

```yaml
models:
  - provider: "mistral"
    model_name: "mistral-small-latest"
    env_api_key: "MISTRAL_API_KEY"
```

## Getting API Key

1. Visit [console.mistral.ai](https://console.mistral.ai/)
2. Generate API key
3. Export: `export MISTRAL_API_KEY=your-key`

See [Providers Overview](overview.md) for comparison.
