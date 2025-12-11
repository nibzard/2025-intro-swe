# Model Configuration

Model configuration controls which LLMs to query and how they're accessed. LLM Answer Watcher supports multiple providers with unified configuration.

## Supported Providers

| Provider | Models Available | Pricing | Best For |
|----------|-----------------|---------|----------|
| **OpenAI** | gpt-4o-mini, gpt-4o, gpt-4-turbo | $0.15-$10/1M tokens | Fast, cost-effective, production |
| **Anthropic** | claude-3-5-haiku, claude-3-5-sonnet, claude-3-opus | $0.80-$75/1M tokens | High-quality reasoning |
| **Mistral** | mistral-large, mistral-medium, mistral-small | $2-$8/1M tokens | European compliance |
| **X.AI Grok** | grok-beta, grok-2-1212, grok-3 | $2-$25/1M tokens | Real-time X integration |
| **Google** | gemini-2.0-flash, gemini-1.5-pro | $0.075-$7/1M tokens | Multimodal, fast |
| **Perplexity** | sonar, sonar-pro, sonar-reasoning | $1-$15/1M tokens | Web-grounded answers |

## Basic Model Configuration

### Single Model Setup

Minimal configuration with one model:

```yaml
run_settings:
  models:
    - provider: "openai"
      model_name: "gpt-4o-mini"
      env_api_key: "OPENAI_API_KEY"
```

**Required fields:**

- `provider`: Provider name (see supported providers above)
- `model_name`: Specific model identifier
- `env_api_key`: Environment variable name containing API key

### Multi-Model Setup

Query multiple models for comparison:

```yaml
run_settings:
  models:
    # Fast and cheap
    - provider: "openai"
      model_name: "gpt-4o-mini"
      env_api_key: "OPENAI_API_KEY"

    # High quality
    - provider: "anthropic"
      model_name: "claude-3-5-sonnet-20241022"
      env_api_key: "ANTHROPIC_API_KEY"

    # Web-grounded
    - provider: "perplexity"
      model_name: "sonar-pro"
      env_api_key: "PERPLEXITY_API_KEY"
```

!!! tip "Multi-Model Benefits"
    Querying multiple models helps you:

    - **Compare providers**: See which LLMs favor your brand
    - **Reduce variance**: Average rankings across models
    - **Hedge risk**: Don't depend on one provider's algorithm
    - **Track trends**: Monitor provider-specific changes over time

## Provider-Specific Configuration

### OpenAI

**Supported models:**

- `gpt-4o-mini`: Fast, cheap, production-ready ($0.15/$0.60 per 1M input/output tokens)
- `gpt-4o`: High quality, balanced cost ($2.50/$10 per 1M tokens)
- `gpt-4-turbo`: Fast GPT-4, good for complex tasks ($10/$30 per 1M tokens)
- `gpt-3.5-turbo`: Legacy, very cheap ($0.50/$1.50 per 1M tokens)

**Basic configuration:**

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
```

**With custom system prompt:**

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    system_prompt: "openai/gpt-4-default"
```

**With web search enabled:**

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    tools:
      - type: "web_search"
    tool_choice: "auto"
```

!!! warning "Web Search Costs"
    OpenAI web search adds $10-$25 per 1,000 calls. See [Web Search Configuration](web-search.md).

**API key setup:**

```bash
export OPENAI_API_KEY=sk-your-openai-key-here
```

Get your API key from: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

---

### Anthropic (Claude)

**Supported models:**

- `claude-3-5-haiku-20241022`: Fast, cheap, smart ($0.80/$4 per 1M tokens)
- `claude-3-5-sonnet-20241022`: Balanced quality/cost ($3/$15 per 1M tokens)
- `claude-3-opus-20240229`: Highest quality ($15/$75 per 1M tokens)

**Basic configuration:**

```yaml
models:
  - provider: "anthropic"
    model_name: "claude-3-5-haiku-20241022"
    env_api_key: "ANTHROPIC_API_KEY"
```

**With custom system prompt:**

```yaml
models:
  - provider: "anthropic"
    model_name: "claude-3-5-sonnet-20241022"
    env_api_key: "ANTHROPIC_API_KEY"
    system_prompt: "anthropic/default"
```

**API key setup:**

```bash
export ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
```

Get your API key from: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

!!! info "Claude Strengths"
    Claude models excel at:

    - **Nuanced reasoning**: Better at understanding context
    - **Longer responses**: More comprehensive answers
    - **Safety**: Strong content moderation
    - **Instruction following**: Precise adherence to prompts

---

### Mistral

**Supported models:**

- `mistral-large-latest`: Flagship model ($2/$6 per 1M tokens)
- `mistral-medium-latest`: Balanced ($2.50/$7.50 per 1M tokens)
- `mistral-small-latest`: Fast and cheap ($0.20/$0.60 per 1M tokens)

**Basic configuration:**

```yaml
models:
  - provider: "mistral"
    model_name: "mistral-large-latest"
    env_api_key: "MISTRAL_API_KEY"
```

**API key setup:**

```bash
export MISTRAL_API_KEY=your-mistral-api-key-here
```

Get your API key from: [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys)

!!! info "Mistral Strengths"
    Mistral models are ideal for:

    - **European compliance**: GDPR-friendly European provider
    - **Multilingual**: Strong performance in French, German, Spanish
    - **Cost efficiency**: Competitive pricing
    - **Open weights**: Some models have open weights available

---

### X.AI (Grok)

**Supported models:**

- `grok-beta`: Beta access model ($2/$10 per 1M tokens)
- `grok-2-1212`: Latest stable version ($2/$10 per 1M tokens)
- `grok-2-latest`: Always latest version ($2/$10 per 1M tokens)
- `grok-3`: Next-generation model ($5/$25 per 1M tokens)
- `grok-3-mini`: Fast, lightweight ($2/$8 per 1M tokens)

**Basic configuration:**

```yaml
models:
  - provider: "grok"
    model_name: "grok-2-1212"
    env_api_key: "XAI_API_KEY"
```

**API key setup:**

```bash
export XAI_API_KEY=xai-your-grok-key-here
```

Get your API key from: [console.x.ai](https://console.x.ai)

!!! info "Grok Strengths"
    Grok models offer:

    - **X platform integration**: Real-time data from X (Twitter)
    - **OpenAI compatibility**: Drop-in replacement for OpenAI API
    - **Current events**: Up-to-date information
    - **Humor**: Unique personality in responses

---

### Google (Gemini)

**Supported models:**

| Model | Cost (Input/Output) | Grounding | Best For |
|-------|---------------------|-----------|----------|
| `gemini-2.5-flash` | $0.04/$0.12 per 1M | ✅ Yes | **Recommended** - production |
| `gemini-2.5-flash-lite` | $0.02/$0.06 per 1M | ❌ No | High-volume, non-grounded |
| `gemini-2.5-pro` | $0.60/$1.80 per 1M | ✅ Yes | Highest quality |
| `gemini-2.0-flash-exp` | $0.075/$0.30 per 1M | ⚠️ Experimental | Testing |
| `gemini-1.5-pro` | $1.25/$5 per 1M | ❌ No | Legacy (not recommended) |

**Basic configuration** (without grounding):

```yaml
models:
  - provider: "google"
    model_name: "gemini-2.5-flash-lite"
    env_api_key: "GEMINI_API_KEY"
```

**With Google Search grounding** (recommended for brand monitoring):

```yaml
models:
  - provider: "google"
    model_name: "gemini-2.5-flash"
    env_api_key: "GEMINI_API_KEY"
    system_prompt: "google/gemini-grounding"
    tools:
      - google_search: {}  # Enable Google Search
```

**API key setup:**

```bash
export GEMINI_API_KEY=AIza-your-google-api-key-here
```

Get your API key from: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

!!! info "Gemini Strengths"
    Gemini models excel at:

    - **Google Search grounding**: Real-time web data with no per-request fees
    - **Speed**: Very fast inference
    - **Cost**: Most cost-effective for web-grounded queries
    - **Multimodal**: Built for text, image, video, audio
    - **Long context**: Up to 2M token context window

!!! tip "Configuration Format Difference"
    Google uses `google_search: {}` (dictionary format) while OpenAI uses `type: "web_search"` (typed format). This reflects different provider API specifications. See [Google provider docs](../../providers/google.md) for details.

---

### Perplexity

**Supported models:**

- `sonar`: Fast, web-grounded ($1/$1 per 1M tokens + request fees)
- `sonar-pro`: High-quality grounded ($3/$15 per 1M tokens + request fees)
- `sonar-reasoning`: Enhanced reasoning ($1/$5 per 1M tokens + request fees)
- `sonar-reasoning-pro`: Best reasoning ($3/$15 per 1M tokens + request fees)
- `sonar-deep-research`: In-depth research ($3/$15 per 1M tokens + request fees)

**Basic configuration:**

```yaml
models:
  - provider: "perplexity"
    model_name: "sonar-pro"
    env_api_key: "PERPLEXITY_API_KEY"
```

**API key setup:**

```bash
export PERPLEXITY_API_KEY=pplx-your-perplexity-key-here
```

Get your API key from: [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)

!!! warning "Perplexity Request Fees"
    Perplexity charges additional **request fees** based on search context:

    - Basic searches: ~$0.005 per request
    - Complex searches: ~$0.01-$0.03 per request

    These fees are **not yet included** in cost estimates. Budget accordingly.

!!! info "Perplexity Strengths"
    Perplexity models offer:

    - **Web grounding**: All answers cite web sources
    - **Fresh data**: Real-time web search
    - **Citations**: Transparent source attribution
    - **Research mode**: Deep-dive analysis

## Advanced Model Configuration

### Custom System Prompts

System prompts customize model behavior. LLM Answer Watcher includes default prompts for each provider.

**Using default provider prompt:**

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    # Uses openai/default.json automatically
```

**Using custom prompt:**

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    system_prompt: "openai/extraction-default"
```

**Prompt file structure:**

System prompts are stored in `llm_answer_watcher/system_prompts/{provider}/{prompt_name}.json`:

```json
{
  "role": "system",
  "content": "You are a helpful assistant that provides accurate, comprehensive answers to user questions about software tools and services. When asked for recommendations, provide a balanced view of multiple options with their strengths and weaknesses."
}
```

**Creating custom prompts:**

1. Create a new prompt file in the provider directory
2. Reference it in your configuration
3. Test with validation:

```bash
llm-answer-watcher validate --config watcher.config.yaml
```

!!! tip "System Prompt Best Practices"
    - **Be specific**: Clear instructions produce better results
    - **Stay neutral**: Don't bias toward your brand
    - **Request structure**: Ask for ranked lists, numbered items
    - **Test variations**: Try different prompts, measure impact

### Temperature and Sampling

Control response randomness (some providers only):

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    temperature: 0.7  # 0.0 = deterministic, 1.0 = creative
    top_p: 0.9        # Nucleus sampling
```

!!! info "Temperature Guide"
    - **0.0-0.3**: Deterministic, consistent answers (recommended for monitoring)
    - **0.4-0.7**: Balanced creativity and consistency
    - **0.8-1.0**: Creative, varied responses (not recommended for tracking)

### Max Tokens

Limit response length:

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    max_tokens: 1000  # Limit to ~750 words
```

!!! warning "Max Tokens and Cost"
    Setting `max_tokens` limits output cost but may truncate responses. For monitoring, allow enough tokens for complete answers (500-2000 recommended).

### Tools and Function Calling

Enable tools like web search:

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    tools:
      - type: "web_search"
    tool_choice: "auto"  # or "required", "none"
```

**Tool choice options:**

- `auto`: Model decides when to use tools (recommended)
- `required`: Model must use tools for every query
- `none`: Disable tools for this query

See [Web Search Configuration](web-search.md) for details.

## Model Selection Strategies

### Cost-Optimized

Minimize costs with cheap models:

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"  # $0.15/$0.60 per 1M tokens
    env_api_key: "OPENAI_API_KEY"

  - provider: "google"
    model_name: "gemini-2.0-flash-exp"  # $0.075/$0.30 per 1M tokens
    env_api_key: "GOOGLE_API_KEY"
```

**Estimated cost per run** (3 intents): ~$0.003-$0.005

**Use when:**

- Running frequent monitoring (hourly/daily)
- Testing configuration changes
- Limited budget
- High query volume

### Quality-Optimized

Best accuracy with premium models:

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o"  # $2.50/$10 per 1M tokens
    env_api_key: "OPENAI_API_KEY"

  - provider: "anthropic"
    model_name: "claude-3-5-sonnet-20241022"  # $3/$15 per 1M tokens
    env_api_key: "ANTHROPIC_API_KEY"
```

**Estimated cost per run** (3 intents): ~$0.05-$0.10

**Use when:**

- Weekly/monthly executive reports
- Competitive intelligence deep-dives
- High-stakes positioning decisions
- Complex queries requiring reasoning

### Balanced

Mix of cost and quality:

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"  # Fast, cheap baseline
    env_api_key: "OPENAI_API_KEY"

  - provider: "anthropic"
    model_name: "claude-3-5-haiku-20241022"  # Quality check
    env_api_key: "ANTHROPIC_API_KEY"

  - provider: "perplexity"
    model_name: "sonar-pro"  # Web-grounded
    env_api_key: "PERPLEXITY_API_KEY"
```

**Estimated cost per run** (3 intents): ~$0.02-$0.04

**Use when:**

- Regular monitoring (daily/weekly)
- Comparing provider perspectives
- Balanced budget
- Production use cases

### Fresh Data

Web-grounded models for current information:

```yaml
models:
  - provider: "perplexity"
    model_name: "sonar-pro"
    env_api_key: "PERPLEXITY_API_KEY"

  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    tools:
      - type: "web_search"
    tool_choice: "auto"
```

**Use when:**

- Monitoring recent product launches
- Tracking current events impact
- Detecting real-time ranking changes
- Competitive news monitoring

### Regional Compliance

Models for specific regulatory requirements:

```yaml
models:
  # European providers for GDPR
  - provider: "mistral"
    model_name: "mistral-large-latest"
    env_api_key: "MISTRAL_API_KEY"

  # Baseline comparison
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
```

**Use when:**

- GDPR compliance required
- Data residency requirements
- Regional preference testing

## Model Pricing Comparison

Current pricing as of November 2024:

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Cost per Query* |
|-------|----------------------|------------------------|-----------------|
| gpt-4o-mini | $0.15 | $0.60 | $0.0004 |
| gpt-4o | $2.50 | $10.00 | $0.0056 |
| claude-3-5-haiku | $0.80 | $4.00 | $0.0022 |
| claude-3-5-sonnet | $3.00 | $15.00 | $0.0090 |
| mistral-large | $2.00 | $6.00 | $0.0040 |
| grok-2-1212 | $2.00 | $10.00 | $0.0054 |
| gemini-2.0-flash | $0.075 | $0.30 | $0.0002 |
| sonar-pro | $3.00 | $15.00 | $0.0090** |

\* Assumes ~150 input tokens + ~500 output tokens per query
\** Plus request fees (~$0.005-$0.03 per query)

!!! info "Dynamic Pricing"
    LLM Answer Watcher automatically loads current pricing from [llm-prices.com](https://www.llm-prices.com) with 24-hour caching. Prices may change.

    Check current pricing:
    ```bash
    llm-answer-watcher prices show
    ```

## Extraction Model Configuration

Use a dedicated model for extraction (faster, cheaper than querying main models):

```yaml
extraction_settings:
  extraction_model:
    provider: "openai"
    model_name: "gpt-4o-mini"  # Fast, cheap model
    env_api_key: "OPENAI_API_KEY"
    system_prompt: "openai/extraction-default"

  method: "function_calling"
  fallback_to_regex: true
  min_confidence: 0.7
```

**Benefits:**

- **Cost savings**: Use cheap model for extraction
- **Speed**: Fast models for quick parsing
- **Separation**: Main models for quality, extraction model for structure
- **Accuracy**: Function calling more accurate than regex

**Recommended extraction models:**

- `gpt-4o-mini`: Best balance of speed, cost, accuracy
- `gpt-4.1-nano`: Ultra-fast, ultra-cheap (OpenAI only)
- `gemini-2.0-flash-exp`: Very fast, very cheap
- `claude-3-5-haiku-20241022`: High accuracy, reasonable cost

See [Function Calling](../features/function-calling.md) for details.

## Multi-Model Comparison Strategies

### A/B Testing

Compare two providers:

```yaml
models:
  # Variant A: OpenAI
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"

  # Variant B: Anthropic
  - provider: "anthropic"
    model_name: "claude-3-5-haiku-20241022"
    env_api_key: "ANTHROPIC_API_KEY"
```

Analyze results:

```sql
-- Compare brand mentions by provider
SELECT
    model_provider,
    COUNT(*) as total_mentions,
    AVG(rank_position) as avg_rank
FROM mentions
WHERE normalized_name = 'yourbrand'
GROUP BY model_provider;
```

### Provider Diversity

Query multiple providers for comprehensive coverage:

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"

  - provider: "anthropic"
    model_name: "claude-3-5-haiku-20241022"
    env_api_key: "ANTHROPIC_API_KEY"

  - provider: "perplexity"
    model_name: "sonar-pro"
    env_api_key: "PERPLEXITY_API_KEY"

  - provider: "google"
    model_name: "gemini-2.0-flash-exp"
    env_api_key: "GOOGLE_API_KEY"
```

**Benefits:**

- Reduce algorithm dependence
- Hedge against provider changes
- Capture diverse perspectives
- Build comprehensive dataset

### Model Size Comparison

Compare model sizes within a provider:

```yaml
models:
  # Small model
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"

  # Large model
  - provider: "openai"
    model_name: "gpt-4o"
    env_api_key: "OPENAI_API_KEY"
```

Analyze cost vs. quality trade-offs:

```sql
-- Compare cost and mention rates by model
SELECT
    model_name,
    COUNT(*) as queries,
    SUM(estimated_cost_usd) as total_cost,
    AVG(estimated_cost_usd) as avg_cost_per_query,
    SUM(CASE WHEN brand IN (SELECT * FROM mine_brands) THEN 1 ELSE 0 END) as my_brand_mentions
FROM answers_raw
GROUP BY model_name;
```

## Troubleshooting

### API Key Issues

**Problem**: `API key not found: OPENAI_API_KEY`

**Solution**: Set the environment variable:

```bash
export OPENAI_API_KEY=sk-your-key-here
```

Verify:

```bash
echo $OPENAI_API_KEY
llm-answer-watcher validate --config watcher.config.yaml
```

---

**Problem**: `Invalid API key for provider openai`

**Solution**: Check API key format and validity:

```bash
# Test with curl (OpenAI)
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test with curl (Anthropic)
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

Get a new API key from your provider's console.

### Model Not Found

**Problem**: `Model not found: gpt-4-mini`

**Solution**: Use correct model name:

```yaml
# ❌ Wrong (doesn't exist)
model_name: "gpt-4-mini"

# ✅ Correct
model_name: "gpt-4o-mini"
```

Check [provider documentation](https://platform.openai.com/docs/models) for valid models.

### Rate Limiting

**Problem**: `Rate limit exceeded for provider openai`

**Solution**: LLM Answer Watcher automatically retries with exponential backoff. If persistent:

1. Upgrade to higher rate limits (pay-as-you-go tier)
2. Reduce concurrent queries
3. Add delays between queries:

```yaml
run_settings:
  rate_limit_delay_seconds: 1  # Delay between queries
```

### Cost Overruns

**Problem**: Unexpected high costs

**Solution**: Enable budget controls:

```yaml
run_settings:
  budget:
    enabled: true
    max_per_run_usd: 1.00
    warn_threshold_usd: 0.50
```

Check estimated costs before running:

```bash
llm-answer-watcher run --config watcher.config.yaml --dry-run
```

See [Budget Configuration](budget.md) for details.

## Best Practices

### 1. Start with One Model

Begin with a single cheap model:

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
```

Validate your configuration, then expand to multiple models.

### 2. Use Cost-Optimized Models for Frequent Runs

Daily/hourly monitoring:

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"  # ~$0.0004 per query
    env_api_key: "OPENAI_API_KEY"
```

Weekly reports:

```yaml
models:
  - provider: "anthropic"
    model_name: "claude-3-5-sonnet-20241022"  # ~$0.009 per query
    env_api_key: "ANTHROPIC_API_KEY"
```

### 3. Enable Web Search for Fresh Data

When tracking current events:

```yaml
models:
  - provider: "perplexity"
    model_name: "sonar-pro"
    env_api_key: "PERPLEXITY_API_KEY"
```

Or:

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    tools:
      - type: "web_search"
    tool_choice: "auto"
```

### 4. Separate Extraction Models

Use dedicated model for extraction:

```yaml
# Main models for quality answers
run_settings:
  models:
    - provider: "anthropic"
      model_name: "claude-3-5-sonnet-20241022"
      env_api_key: "ANTHROPIC_API_KEY"

# Cheap model for extraction
extraction_settings:
  extraction_model:
    provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
  method: "function_calling"
```

### 5. Version Control Model Configs

Track model changes in git:

```bash
git add watcher.config.yaml
git commit -m "feat: add Claude 3.5 Sonnet for quality comparison"
```

This creates an audit trail of which models you were using when.

### 6. Monitor Provider Changes

Providers update models frequently. Subscribe to:

- [OpenAI Blog](https://openai.com/blog)
- [Anthropic Blog](https://www.anthropic.com/news)
- [Mistral Announcements](https://mistral.ai/news)
- [Google AI Blog](https://ai.google/blog)

Update your config when new models release.

### 7. Test Before Production

Validate new model configurations:

```bash
# Dry run to check costs
llm-answer-watcher run --config watcher.config.yaml --dry-run

# Validate configuration
llm-answer-watcher validate --config watcher.config.yaml

# Test with single intent
llm-answer-watcher run --config watcher.config.yaml --intent best-tools
```

## Next Steps

- **[Brand Configuration](brands.md)**: Optimize brand detection
- **[Intent Configuration](intents.md)**: Design effective prompts
- **[Budget Configuration](budget.md)**: Control costs
- **[Web Search Configuration](web-search.md)**: Enable real-time data
- **[Cost Management](../features/cost-management.md)**: Track spending
