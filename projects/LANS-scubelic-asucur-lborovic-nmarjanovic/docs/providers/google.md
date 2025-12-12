# Google Gemini Provider

Integration with Google's Gemini models, including support for Google Search grounding.

## Overview

Google Gemini is a family of multimodal AI models that excels at understanding and generating text. Gemini models are available through Google AI Studio and support **Google Search grounding** for real-time web information.

**Key Features**:

- **Google Search Grounding**: Access real-time web data with no additional per-request fees
- **Competitive Pricing**: Among the most cost-effective LLMs with high quality
- **Automatic Search Decision**: Gemini intelligently decides when to use Google Search
- **Grounding Metadata**: Rich attribution showing which sources influenced responses

## Supported Models

### Gemini 2.5 Series (Recommended)

| Model | Speed | Quality | Grounding | Best For |
|-------|-------|---------|-----------|----------|
| `gemini-2.5-flash` | Fast | High | ✅ Yes | **Production** - balanced speed/quality/cost |
| `gemini-2.5-flash-lite` | Fastest | Medium | ❌ No | High-volume, non-grounded queries |
| `gemini-2.5-pro` | Slower | Highest | ✅ Yes | Complex reasoning, highest quality |

### Gemini 2.0 Series

| Model | Speed | Quality | Grounding | Best For |
|-------|-------|---------|-----------|----------|
| `gemini-2.0-flash-exp` | Fast | High | ⚠️ Experimental | Testing new features |
| `gemini-2.0-flash-lite` | Fastest | Medium | ❌ No | Fast, non-grounded queries |

### Legacy Models (Not Recommended)

- `gemini-1.5-pro` - Superseded by 2.5-pro
- `gemini-1.5-flash` - Superseded by 2.5-flash

**Recommendation**: Use `gemini-2.5-flash` for production workloads. It provides excellent performance with Google Search grounding support at competitive pricing.

## Basic Configuration

### Without Google Search Grounding

Standard Gemini usage with training data only:

```yaml
models:
  - provider: "google"
    model_name: "gemini-2.5-flash-lite"
    env_api_key: "GEMINI_API_KEY"
```

**Use when**:
- You don't need real-time information
- Faster response times are critical
- Cost optimization is priority

### With Google Search Grounding

Enable real-time web information:

```yaml
models:
  - provider: "google"
    model_name: "gemini-2.5-flash"
    env_api_key: "GEMINI_API_KEY"
    system_prompt: "google/gemini-grounding"
    tools:
      - google_search: {}
```

**Use when**:
- Brand monitoring requires current data
- Tracking real-time competitive landscape
- Need to detect recent changes
- Want Google's search quality

## Google Search Grounding

### Configuration Format

Google uses a unique tools configuration format:

```yaml
tools:
  - google_search: {}  # Dictionary with tool name as key
```

This differs from OpenAI's format:
```yaml
tools:
  - type: "web_search"  # Dictionary with 'type' field
tool_choice: "auto"
```

**Why the difference?** Each provider has different API specifications. Google uses named tool objects, OpenAI uses typed specifications. The config does direct passthrough to each API.

### Supported Models for Grounding

| Model | Grounding Support |
|-------|-------------------|
| `gemini-2.5-flash` | ✅ **Yes** (recommended) |
| `gemini-2.5-flash-lite` | ❌ No |
| `gemini-2.5-pro` | ✅ **Yes** (highest quality) |
| `gemini-2.0-flash-exp` | ⚠️ Experimental |
| `gemini-2.0-flash-lite` | ❌ No |

### System Prompt Optimization

Use the specialized `google/gemini-grounding` system prompt for best results:

```yaml
models:
  - provider: "google"
    model_name: "gemini-2.5-flash"
    env_api_key: "GEMINI_API_KEY"
    system_prompt: "google/gemini-grounding"  # Optimized for grounding
    tools:
      - google_search: {}
```

This prompt:
- Instructs Gemini to use Google Search when beneficial
- Emphasizes grounding responses in search results
- Requests comprehensive source coverage
- Improves answer quality for brand monitoring

### How Grounding Works

1. Gemini receives your query prompt
2. **Automatically decides** if Google Search would improve the answer
3. Performs search if beneficial (no `tool_choice` parameter needed)
4. Grounds response in search results
5. Returns answer with grounding metadata

**No explicit control**: Unlike OpenAI's `tool_choice: "required"`, Gemini intelligently determines when grounding helps. This is intentional - Gemini optimizes for quality and cost.

### Grounding Metadata

Responses include rich grounding attribution:

```json
{
  "web_search_results": {
    "web_search_queries": ["best email warmup tools 2025"],
    "grounding_chunks": [
      {
        "web_source": "https://www.g2.com/categories/email-warmup",
        "retrieved_context": "Top email warmup tools..."
      }
    ],
    "grounding_supports": [
      {
        "segment": {
          "text": "Warmly is a leading solution"
        },
        "grounding_chunk_indices": [0],
        "confidence_scores": [0.95]
      }
    ]
  },
  "web_search_count": 1
}
```

**Key fields**:
- `web_search_queries`: What Gemini searched for
- `grounding_chunks`: Source URLs and context
- `grounding_supports`: Which text segments came from which sources
- `confidence_scores`: How confident Gemini is (0.0-1.0)

## Pricing

### Token Costs

| Model | Input | Output |
|-------|-------|--------|
| `gemini-2.5-flash` | $0.04 / 1M tokens | $0.12 / 1M tokens |
| `gemini-2.5-flash-lite` | $0.02 / 1M tokens | $0.06 / 1M tokens |
| `gemini-2.5-pro` | $0.60 / 1M tokens | $1.80 / 1M tokens |

### Google Search Grounding Costs

**Good news**: No additional fees for grounding. You only pay token costs.

**Example** (email warmup query with grounding):
```
Input: 100 tokens @ $0.04/1M = $0.000004
Output: 300 tokens @ $0.12/1M = $0.000036
Total: $0.00004 per query
```

**Comparison**:
- **Gemini with grounding**: $0.00004 per query
- **OpenAI web search**: $0.0116 per query (~290x more)
- **Perplexity sonar-pro**: $0.005-$0.03 per query (125-750x more)

!!! success "Cost Advantage"
    Google Search grounding is **significantly cheaper** than alternatives. Grounding tokens are included in base pricing with no per-request fees.

## Complete Configuration Example

### Multi-Model Strategy

Use different models for different use cases:

```yaml
run_settings:
  output_dir: "./output"
  sqlite_db_path: "./output/watcher.db"

  models:
    # High-volume: Fast + cheap without grounding
    - provider: "google"
      model_name: "gemini-2.5-flash-lite"
      env_api_key: "GEMINI_API_KEY"

    # Brand monitoring: Balanced with grounding
    - provider: "google"
      model_name: "gemini-2.5-flash"
      env_api_key: "GEMINI_API_KEY"
      system_prompt: "google/gemini-grounding"
      tools:
        - google_search: {}

    # Premium: Highest quality with grounding
    - provider: "google"
      model_name: "gemini-2.5-pro"
      env_api_key: "GEMINI_API_KEY"
      system_prompt: "google/gemini-grounding"
      tools:
        - google_search: {}

brands:
  mine:
    - "Warmly"
  competitors:
    - "HubSpot"
    - "Instantly"

intents:
  - id: "email-warmup-tools"
    prompt: "What are the best email warmup tools in 2025?"
```

## Getting API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API key"
4. Copy the key (format: `AIza...`)
5. Export to environment:
   ```bash
   export GEMINI_API_KEY=AIza-your-key-here
   ```

!!! warning "API Key Security"
    - Never commit API keys to version control
    - Use environment variables or secret management
    - Rotate keys periodically
    - Monitor usage in AI Studio dashboard

## When to Use Gemini

### Choose Gemini When:

- ✅ **Cost optimization**: Among the cheapest high-quality LLMs
- ✅ **Google Search quality**: Want Google's search coverage and accuracy
- ✅ **High-volume monitoring**: Grounding with no per-request fees
- ✅ **Automatic search decision**: Trust Gemini to decide when to ground
- ✅ **Grounding metadata**: Need detailed source attribution

### Choose Other Providers When:

**OpenAI**:
- Need explicit `tool_choice` control (force/disable search)
- Prefer OpenAI's reasoning quality
- Already invested in OpenAI ecosystem

**Perplexity**:
- Need explicit source URLs in every response
- Want always-on web search with citations
- Prefer Perplexity's citation format

**Anthropic**:
- Need longest context windows (200K+)
- Prefer Claude's reasoning style
- Don't need web search

## Best Practices

### 1. Use Appropriate Model Tiers

```yaml
# High-volume, non-grounded queries
- model_name: "gemini-2.5-flash-lite"

# Production brand monitoring (recommended)
- model_name: "gemini-2.5-flash"
  tools: [google_search: {}]

# Premium quality for critical queries
- model_name: "gemini-2.5-pro"
  tools: [google_search: {}]
```

### 2. Enable Grounding for Brand Monitoring

```yaml
# ✅ GOOD - Grounding for current brand data
- provider: "google"
  model_name: "gemini-2.5-flash"
  system_prompt: "google/gemini-grounding"
  tools:
    - google_search: {}

intents:
  - id: "current-tools"
    prompt: "What are the best email tools in 2025?"
```

### 3. Skip Grounding for Historical/Generic Queries

```yaml
# ✅ GOOD - No grounding for general knowledge
- provider: "google"
  model_name: "gemini-2.5-flash-lite"

intents:
  - id: "email-best-practices"
    prompt: "What are email deliverability best practices?"
```

### 4. Use Grounding-Optimized System Prompt

```yaml
# ✅ GOOD
system_prompt: "google/gemini-grounding"  # Optimized

# ❌ SUBOPTIMAL
# (no system_prompt or using "google/default")
```

### 5. Monitor Grounding Usage

Track when Gemini uses grounding:

```python
# Check if grounding was used
if result["web_search_count"] > 0:
    print(f"Grounding used: {result['web_search_count']} searches")
    print(f"Queries: {result['web_search_results']['web_search_queries']}")
```

## Troubleshooting

### Grounding Not Working

**Problem**: `web_search_count` is always 0

**Solutions**:
1. Check you're using a grounding-capable model:
   ```yaml
   # ✅ Grounding supported
   model_name: "gemini-2.5-flash"

   # ❌ Grounding NOT supported
   model_name: "gemini-2.5-flash-lite"
   ```

2. Verify tools configuration format:
   ```yaml
   # ✅ Correct
   tools:
     - google_search: {}

   # ❌ Wrong (OpenAI format)
   tools:
     - type: "web_search"
   ```

3. Use grounding-optimized system prompt:
   ```yaml
   system_prompt: "google/gemini-grounding"
   ```

### API Authentication Errors

**Problem**: `401 Unauthorized` or `403 Forbidden`

**Solutions**:
1. Verify API key is correct:
   ```bash
   echo $GEMINI_API_KEY  # Should show AIza...
   ```

2. Check key is active in [AI Studio](https://aistudio.google.com/app/apikey)

3. Verify key has correct permissions

### Rate Limiting

**Problem**: `429 Too Many Requests`

**Solutions**:
1. Reduce `max_concurrent_requests` in config:
   ```yaml
   run_settings:
     max_concurrent_requests: 3  # Google limit
   ```

2. Add delay between requests

3. Upgrade to higher quota tier in AI Studio

## Further Reading

- [Web Search Configuration](../user-guide/configuration/web-search.md) - Detailed grounding setup
- [Model Configuration](../user-guide/configuration/models.md) - Model selection guide
- [Providers Overview](overview.md) - Compare all providers
- [Google AI Studio](https://aistudio.google.com) - Official documentation
