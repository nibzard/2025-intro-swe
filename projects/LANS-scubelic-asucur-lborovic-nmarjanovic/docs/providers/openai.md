# OpenAI Provider

Integration with OpenAI's GPT models.

## Supported Models

- `gpt-4o` - Latest GPT-4 Optimized
- `gpt-4o-mini` - Cost-effective model (recommended)
- `gpt-4-turbo` - Fast GPT-4
- `gpt-3.5-turbo` - Legacy model

## Configuration

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
```

## Getting API Key

1. Visit [platform.openai.com](https://platform.openai.com/api-keys)
2. Create new secret key
3. Export: `export OPENAI_API_KEY=sk-your-key`

## Pricing

- **gpt-4o-mini**: $0.15/1M input, $0.60/1M output
- **gpt-4o**: $2.50/1M input, $10/1M output

## Web Search Tool

OpenAI supports web search through the `web_search` tool in the Responses API.

### Basic Web Search Configuration

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    tools:
      - type: "web_search"
    tool_choice: "auto"  # Model decides when to search
```

### Tool Choice Options

- **`auto`** (recommended): Model decides when web search is needed
- **`required`**: Force web search for every query
- **`none`**: Disable web search

### Web Search Pricing

Web search adds **$10 per 1,000 calls** plus content token costs.

**Example cost** (gpt-4o-mini):
```
Base query: $0.0004 (tokens only)
+ Web search call: $0.01
+ Search content: $0.0012 (8k tokens @ $0.15/1M)
= Total: ~$0.0116 per query
```

### When to Use OpenAI Web Search

**Use OpenAI when**:
- ✅ Need explicit `tool_choice` control
- ✅ Prefer OpenAI's LLM reasoning quality
- ✅ Already invested in OpenAI ecosystem

**Consider alternatives**:
- **Google Gemini grounding**: 290x cheaper (~$0.00004 vs $0.0116)
- **Perplexity**: Built-in citations, always-on search

See [Web Search Configuration](../user-guide/configuration/web-search.md) for detailed setup and comparison.

## Further Reading

- [Web Search Configuration](../user-guide/configuration/web-search.md) - Detailed web search setup
- [Model Configuration](../user-guide/configuration/models.md) - Model selection guide
- [Providers Overview](overview.md) - Compare all providers
