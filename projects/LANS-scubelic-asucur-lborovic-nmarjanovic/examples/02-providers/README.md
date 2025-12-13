# Provider Examples

Examples demonstrating all 6 supported LLM providers.

## Supported Providers

| Provider | Config File | Model | Cost/Query | Notes |
|----------|-------------|-------|------------|-------|
| **OpenAI** | `openai.config.yaml` | gpt-4o-mini | ~$0.0008 | Fastest, cheapest |
| **Anthropic** | `anthropic.config.yaml` | claude-3-5-haiku | ~$0.002 | Great quality/price |
| **Google** | `google-gemini.config.yaml` | gemini-2.0-flash-exp | ~$0.0005 | Very fast, free tier |
| **Mistral** | `mistral.config.yaml` | mistral-large-latest | ~$0.003 | European provider |
| **Grok** | `grok.config.yaml` | grok-beta | ~$0.005 | X.AI model |
| **Perplexity** | `perplexity.config.yaml` | sonar | ~$0.001 | Built-in citations |
| **All 6** | `multi-provider-comparison.config.yaml` | (all) | ~$0.06 | Compare all providers |

## Quick Start

### Test a Single Provider

```bash
# OpenAI (recommended for first test)
llm-answer-watcher run --config examples/02-providers/openai.config.yaml

# Anthropic (Claude)
llm-answer-watcher run --config examples/02-providers/anthropic.config.yaml

# Google Gemini
llm-answer-watcher run --config examples/02-providers/google-gemini.config.yaml
```

### Compare All Providers

```bash
# Run same queries across all 6 providers
llm-answer-watcher run --config examples/02-providers/multi-provider-comparison.config.yaml
```

This will show you how different LLMs mention your brand for the same questions.

## Provider-Specific Features

### OpenAI
- **Models**: gpt-4o, gpt-4o-mini, gpt-3.5-turbo
- **Special features**: Web search via Responses API
- **System prompts**: Supports custom system messages
- **Rate limits**: ~10 requests/second (tier 1)

### Anthropic
- **Models**: claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus
- **Special features**: Tool use, long context (200K tokens)
- **System prompts**: Full support
- **Rate limits**: Conservative (~5 requests/second)

### Google Gemini
- **Models**: gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash
- **Special features**: Google Search grounding (see `03-web-search/`)
- **System prompts**: Limited support (use instructions in prompt)
- **Rate limits**: ~3 requests/second per API key

### Mistral
- **Models**: mistral-large-latest, mistral-small-latest
- **Special features**: European data residency, function calling
- **System prompts**: Full support
- **Rate limits**: Standard tier limits

### Grok
- **Models**: grok-beta, grok-1
- **Special features**: Real-time Twitter/X data (via prompting)
- **System prompts**: Full support
- **Rate limits**: Check X.AI dashboard

### Perplexity
- **Models**: sonar, sonar-pro
- **Special features**: Always searches web, includes citations
- **System prompts**: Limited support
- **Rate limits**: Based on tier (check dashboard)

## Cost Comparison

Running the multi-provider comparison (3 intents × 6 providers):

```
OpenAI (gpt-4o-mini):     3 × $0.0008 = $0.0024
Anthropic (haiku):        3 × $0.002  = $0.006
Google (gemini-flash):    3 × $0.0005 = $0.0015
Mistral (large):          3 × $0.003  = $0.009
Grok (beta):              3 × $0.005  = $0.015
Perplexity (sonar):       3 × $0.001  = $0.003
                          ___________________
Total:                                  ~$0.037
```

Safe for daily monitoring!

## Environment Variables Required

```bash
# Set API keys for providers you want to use
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GEMINI_API_KEY="..."
export MISTRAL_API_KEY="..."
export GROK_API_KEY="xai-..."
export PERPLEXITY_API_KEY="pplx-..."
```

Copy `examples/.env.example` for a template.

## Which Provider Should I Use?

**For testing/development:**
- Use **OpenAI gpt-4o-mini** or **Google gemini-flash** (fastest, cheapest)

**For production monitoring:**
- Use **multi-provider comparison** to see all perspectives
- Track which providers consistently mention your brand

**For specific needs:**
- **Best quality**: Anthropic claude-3-5-sonnet, OpenAI gpt-4o
- **Cheapest**: Google gemini-flash, OpenAI gpt-4o-mini
- **Fastest**: Google gemini-flash
- **Citations**: Perplexity sonar
- **European data**: Mistral
- **Real-time data**: Grok (Twitter/X context)

## Next Steps

- **Enable web search**: See `03-web-search/` for real-time data
- **Improve extraction**: See `04-extraction/` for function calling
- **Add analysis**: See `05-operations/` for automated insights
