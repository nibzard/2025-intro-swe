# X.AI Grok Provider

Integration with X.AI's Grok models.

## Supported Models

- `grok-beta`
- `grok-2-1212`
- `grok-2-latest`
- `grok-3`
- `grok-3-mini`

## Configuration

```yaml
models:
  - provider: "grok"
    model_name: "grok-2-1212"
    env_api_key: "XAI_API_KEY"
```

## Getting API Key

1. Visit [x.ai/api](https://x.ai/api)
2. Get API access
3. Export: `export XAI_API_KEY=xai-your-key`

See [Providers Overview](overview.md) for comparison.
