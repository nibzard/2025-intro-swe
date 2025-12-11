# Web Search Examples

Demonstrate real-time web search capabilities across different providers.

## Files

1. **`openai-websearch.config.yaml`** - OpenAI Responses API with web search
2. **`google-grounding.config.yaml`** - Google Gemini with Search grounding
3. **`perplexity-online.config.yaml`** - Perplexity Sonar (always searches)
4. **`websearch-comparison.config.yaml`** - Compare all 3 approaches

## Why Use Web Search?

Without web search, LLMs rely on training data (often 6-12 months old).
With web search, they access real-time information about your brand.

**Impact:**
- **Newer brands**: Much more likely to be mentioned with web search
- **Recent updates**: Product launches, features reflected immediately
- **Accuracy**: Current pricing, availability, reviews

## Cost Comparison

| Provider | Without Search | With Search | Difference |
|----------|----------------|-------------|------------|
| OpenAI gpt-4o-mini | $0.0008 | $0.010 | +$0.009 |
| Google Gemini | $0.0005 | $0.015 | +$0.014 |
| Perplexity Sonar | N/A | $0.001 | Always searches |

Web search adds ~$0.01 per query but provides real-time data.

## Quick Start

```bash
# OpenAI with web search
llm-answer-watcher run --config examples/03-web-search/openai-websearch.config.yaml

# Compare all 3 providers
llm-answer-watcher run --config examples/03-web-search/websearch-comparison.config.yaml
```

## When to Use Web Search

**Use web search for:**
- Queries about current events or recent launches
- "What are the best [tools] in 2025?"
- Tracking real-time brand mentions
- Monitoring competitor news

**Skip web search for:**
- Generic category queries
- Historical comparisons
- Cost-sensitive monitoring
- High-volume testing
