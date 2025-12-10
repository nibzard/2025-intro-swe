# Anthropic Provider

Integration with Anthropic's Claude models.

## Supported Models

- `claude-3-5-sonnet-20241022` - Latest Sonnet
- `claude-3-5-haiku-20241022` - Fast and affordable
- `claude-3-opus-20240229` - Most capable

## Configuration

```yaml
models:
  - provider: "anthropic"
    model_name: "claude-3-5-haiku-20241022"
    env_api_key: "ANTHROPIC_API_KEY"
```

## Getting API Key

1. Visit [console.anthropic.com](https://console.anthropic.com/)
2. Get your API key
3. Export: `export ANTHROPIC_API_KEY=sk-ant-your-key`

## Pricing

- **Haiku**: $0.80/1M input, $4/1M output
- **Sonnet**: $3/1M input, $15/1M output

See [Providers Overview](overview.md) for comparison.
