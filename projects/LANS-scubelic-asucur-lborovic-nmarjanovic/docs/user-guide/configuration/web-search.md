# Web Search Configuration

Web search enables LLMs to access real-time information from the web, providing current data beyond their training cutoff dates. This is crucial for monitoring brand visibility in fresh, up-to-date LLM responses.

## Why Use Web Search?

### Benefits

**Fresh Data**: Access information after LLM training cutoff

- Track recent product launches
- Monitor current competitive landscape
- Detect real-time ranking changes
- Capture latest industry trends

**Accurate Information**: Grounded in current web sources

- Real-time pricing and features
- Current company positioning
- Latest product updates
- Active competitor status

**Citations**: Transparent source attribution (Perplexity)

- See exactly which sources LLMs used
- Verify information accuracy
- Understand ranking drivers
- Track source patterns

### Trade-offs

**Higher Costs**: Web search adds significant costs

- OpenAI: +$10-$25 per 1,000 calls
- Perplexity: +$0.005-$0.03 per request
- 10-30x cost increase vs. base queries

**Slower Responses**: Web search takes longer

- Base query: ~1-2 seconds
- With web search: ~3-10 seconds
- May impact automation pipelines

**Variability**: Results can change frequently

- Web content changes constantly
- Less reproducible than static responses
- Harder to track trends

## Supported Providers

### OpenAI Web Search

OpenAI offers web search through the Responses API with the `web_search` tool.

**Configuration**:

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    tools:
      - type: "web_search"
    tool_choice: "auto"
```

**How it works**:

1. LLM receives user prompt
2. Decides whether to use web search (if `tool_choice: auto`)
3. Searches the web if needed
4. Incorporates search results into response
5. Returns answer with web context

**Pricing** (per 1,000 calls):

| Model Tier | Cost | Content Tokens |
|------------|------|----------------|
| Standard (all models) | $10 | @ model rate |
| gpt-4o-mini, gpt-4.1-mini | $10 | Fixed 8k tokens |
| Preview reasoning (o1, o3) | $10 | @ model rate |
| Preview non-reasoning | $25 | **FREE** |

---

### Perplexity (Native Web Search)

Perplexity models have built-in web search - no configuration needed.

**Configuration**:

```yaml
models:
  - provider: "perplexity"
    model_name: "sonar-pro"
    env_api_key: "PERPLEXITY_API_KEY"
```

**How it works**:

1. Every query automatically searches the web
2. LLM synthesizes answer from sources
3. Returns response with citations
4. Provides source URLs for verification

**Models**:

- `sonar`: Fast, web-grounded ($1/$1 per 1M tokens + request fees)
- `sonar-pro`: High-quality grounded ($3/$15 per 1M tokens + request fees)
- `sonar-reasoning`: Enhanced reasoning ($1/$5 per 1M tokens + request fees)
- `sonar-deep-research`: In-depth analysis ($3/$15 per 1M tokens + request fees)

**Pricing**: Token costs + request fees (~$0.005-$0.03 per request)

!!! warning "Perplexity Request Fees"
    Request fees are **not yet included** in cost estimates. Budget accordingly.

---

### Google Search Grounding

Google Gemini models support Google Search grounding, which enables the LLM to search the web and ground responses in current information.

**Configuration**:

```yaml
models:
  - provider: "google"
    model_name: "gemini-2.5-flash"
    env_api_key: "GEMINI_API_KEY"
    system_prompt: "google/gemini-grounding"  # Recommended
    tools:
      - google_search: {}  # Enable Google Search
```

**How it works**:

1. LLM receives user prompt
2. Gemini automatically decides if search is needed
3. Performs Google Search if beneficial
4. Grounds response in search results
5. Returns answer with grounding metadata

**Models**:

- `gemini-2.0-flash-lite`: Not supported (no grounding)
- `gemini-2.0-flash-exp`: Supported (experimental)
- `gemini-2.5-flash`: Supported (best for grounding)
- `gemini-2.5-flash-lite`: Not supported
- `gemini-2.5-pro`: Supported (highest quality)

**Pricing**: Base model token costs (no additional fees for grounding)

!!! tip "Configuration Format Difference"
    Google uses `google_search: {}` (dictionary format) while OpenAI uses `type: "web_search"` (typed format). This reflects different provider API specifications. See [detailed configuration](#google-search-grounding-configuration) below.

## OpenAI Web Search Configuration

### Basic Configuration

Enable web search with automatic activation:

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    tools:
      - type: "web_search"
    tool_choice: "auto"  # Let model decide
```

### Tool Choice Options

Control when web search is used:

**`auto` (Recommended)**: Model decides when to search

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    tools:
      - type: "web_search"
    tool_choice: "auto"
```

**Use when**: You want LLM to determine if fresh data is needed.

---

**`required`**: Force web search for every query

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    tools:
      - type: "web_search"
    tool_choice: "required"
```

**Use when**: You always want current information.

**Warning**: Significantly increases costs (every query uses web search).

---

**`none`**: Disable web search for specific queries

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    # No tools specified - web search disabled
```

**Use when**: Training data is sufficient, cost optimization priority.

### Comparing With and Without Web Search

Test impact of web search:

```yaml
models:
  # With web search
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    tools:
      - type: "web_search"
    tool_choice: "auto"

  # Without web search (control)
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    # No tools
```

Compare results to see web search impact on brand visibility.

### Web Search Metadata

LLM Answer Watcher tracks web search usage:

```json
{
  "intent_id": "best-email-tools",
  "model_provider": "openai",
  "model_name": "gpt-4o-mini",
  "answer_text": "The best email warmup tools are...",
  "web_search_used": true,
  "web_search_count": 3,
  "web_search_results": [
    {
      "url": "https://example.com/best-email-tools",
      "title": "Top Email Warmup Tools 2025",
      "snippet": "..."
    }
  ],
  "usage_meta": {
    "prompt_tokens": 150,
    "completion_tokens": 520,
    "web_search_tokens": 8000
  }
}
```

## Perplexity Configuration

### Basic Configuration

Use Perplexity for automatic web grounding:

```yaml
models:
  - provider: "perplexity"
    model_name: "sonar-pro"
    env_api_key: "PERPLEXITY_API_KEY"
```

**No additional configuration needed** - web search is automatic.

### Perplexity Model Selection

Choose model based on use case:

**`sonar`**: Fast, cost-effective

```yaml
models:
  - provider: "perplexity"
    model_name: "sonar"
    env_api_key: "PERPLEXITY_API_KEY"
```

- **Cost**: $1/$1 per 1M tokens + ~$0.005 per request
- **Speed**: ~2-4 seconds per query
- **Use when**: Daily monitoring, high-volume queries

---

**`sonar-pro`**: High-quality grounded answers

```yaml
models:
  - provider: "perplexity"
    model_name: "sonar-pro"
    env_api_key: "PERPLEXITY_API_KEY"
```

- **Cost**: $3/$15 per 1M tokens + ~$0.01 per request
- **Speed**: ~3-6 seconds per query
- **Use when**: Weekly reports, competitive analysis

---

**`sonar-reasoning`**: Enhanced reasoning with web search

```yaml
models:
  - provider: "perplexity"
    model_name: "sonar-reasoning"
    env_api_key: "PERPLEXITY_API_KEY"
```

- **Cost**: $1/$5 per 1M tokens + ~$0.015 per request
- **Speed**: ~4-8 seconds per query
- **Use when**: Complex queries, deep analysis

---

**`sonar-deep-research`**: Comprehensive research mode

```yaml
models:
  - provider: "perplexity"
    model_name: "sonar-deep-research"
    env_api_key: "PERPLEXITY_API_KEY"
```

- **Cost**: $3/$15 per 1M tokens + ~$0.02-$0.03 per request
- **Speed**: ~8-15 seconds per query
- **Use when**: Monthly executive reports, thorough research

### Perplexity Citations

Perplexity provides source citations:

```json
{
  "intent_id": "best-email-tools",
  "model_provider": "perplexity",
  "model_name": "sonar-pro",
  "answer_text": "The best email warmup tools are...",
  "citations": [
    {
      "index": 1,
      "url": "https://www.g2.com/categories/email-warmup",
      "title": "Best Email Warmup Software 2025",
      "used_in_response": true
    },
    {
      "index": 2,
      "url": "https://blog.competitor.com/warmup-guide",
      "title": "Email Warmup Best Practices",
      "used_in_response": true
    }
  ]
}
```

!!! info "Citation Analysis"
    Track which sources influence LLM recommendations:

    - Identify key industry publications
    - Monitor competitor content
    - Find content opportunities
    - Track source diversity

## Google Search Grounding Configuration

### Basic Configuration

Enable Google Search grounding for Gemini models:

```yaml
models:
  - provider: "google"
    model_name: "gemini-2.5-flash"
    env_api_key: "GEMINI_API_KEY"
    system_prompt: "google/gemini-grounding"
    tools:
      - google_search: {}
```

**Key configuration points**:

- **`model_name`**: Must be a grounding-capable model (see [supported models](#supported-models) below)
- **`system_prompt`**: Use `"google/gemini-grounding"` for optimized grounding behavior
- **`tools`**: Use `google_search: {}` format (Google API specification)

### Configuration Format

Google uses a different tools format than OpenAI:

**Google format** (dictionary with tool name as key):
```yaml
tools:
  - google_search: {}
```

**OpenAI format** (dictionary with `type` field):
```yaml
tools:
  - type: "web_search"
tool_choice: "auto"
```

**Why the difference?**

- Each provider has different API specifications
- OpenAI uses typed tool specification with `tool_choice` control
- Google uses named tool objects with automatic decision-making
- The config does direct passthrough to each provider's API

!!! tip "No Tool Choice"
    Google Gemini automatically decides when to use Google Search based on the query. There's no `tool_choice` parameter - the model intelligently determines when grounding would improve the response.

### Supported Models

Not all Gemini models support Google Search grounding:

| Model | Grounding Support | Best For |
|-------|-------------------|----------|
| `gemini-2.0-flash-lite` | ❌ No | Fast, non-grounded queries |
| `gemini-2.0-flash-exp` | ⚠️ Experimental | Testing new features |
| `gemini-2.5-flash` | ✅ Yes | **Recommended** - balanced speed/quality |
| `gemini-2.5-flash-lite` | ❌ No | Fast, non-grounded queries |
| `gemini-2.5-pro` | ✅ Yes | Highest quality grounding |

**Recommendation**: Use `gemini-2.5-flash` for production. It provides excellent grounding quality at reasonable cost.

### System Prompt Optimization

Use the specialized `google/gemini-grounding` system prompt:

```yaml
models:
  - provider: "google"
    model_name: "gemini-2.5-flash"
    env_api_key: "GEMINI_API_KEY"
    system_prompt: "google/gemini-grounding"  # Optimized for grounding
    tools:
      - google_search: {}
```

**What it does**:

- Instructs Gemini to use Google Search when beneficial
- Emphasizes grounding responses in search results
- Requests comprehensive source coverage
- Improves answer quality for brand monitoring

**Default system prompt** (`google/default.json`) also works but is less optimized for web search use cases.

### Configuration Examples

**With grounding** (recommended for brand monitoring):

```yaml
models:
  - provider: "google"
    model_name: "gemini-2.5-flash"
    env_api_key: "GEMINI_API_KEY"
    system_prompt: "google/gemini-grounding"
    tools:
      - google_search: {}

intents:
  - id: "email-warmup-tools"
    prompt: "What are the best email warmup tools in 2025?"
```

**Without grounding** (faster, uses only training data):

```yaml
models:
  - provider: "google"
    model_name: "gemini-2.5-flash-lite"
    env_api_key: "GEMINI_API_KEY"
    # No tools or system_prompt specified

intents:
  - id: "email-warmup-tools"
    prompt: "What are the best email warmup tools?"
```

### Grounding Metadata

When Google Search is used, the response includes grounding metadata:

```json
{
  "intent_id": "email-warmup-tools",
  "model_provider": "google",
  "model_name": "gemini-2.5-flash",
  "answer_text": "Based on current research, the best email warmup tools are...",
  "web_search_results": {
    "web_search_queries": [
      "best email warmup tools 2025",
      "email warmup service comparison"
    ],
    "grounding_chunks": [
      {
        "web_source": "https://www.g2.com/categories/email-warmup",
        "retrieved_context": "Top-rated email warmup tools include..."
      }
    ],
    "grounding_supports": [
      {
        "segment": {
          "start_index": 150,
          "end_index": 200,
          "text": "Warmly is a leading email warmup solution"
        },
        "grounding_chunk_indices": [0, 2],
        "confidence_scores": [0.95, 0.88]
      }
    ]
  },
  "web_search_count": 2
}
```

**Key fields**:

- **`web_search_queries`**: Google Search queries Gemini performed
- **`grounding_chunks`**: Source URLs and retrieved context
- **`grounding_supports`**: Which text segments were grounded in which sources
- **`confidence_scores`**: How confident Gemini is in the grounding (0.0-1.0)

### Pricing

**Good news**: Google Search grounding has **no additional per-request fees**.

You only pay standard token costs:

| Model | Input Cost | Output Cost |
|-------|------------|-------------|
| `gemini-2.5-flash` | $0.04 / 1M tokens | $0.12 / 1M tokens |
| `gemini-2.5-pro` | $0.60 / 1M tokens | $1.80 / 1M tokens |

**Example cost** (email warmup query with grounding):

```
Query: 100 tokens input
Response: 300 tokens output (with grounding context)

gemini-2.5-flash cost:
= (100 × $0.04/1M) + (300 × $0.12/1M)
= $0.000004 + $0.000036
= $0.00004 per query
```

**vs. OpenAI with web search**:
```
OpenAI gpt-4o-mini with web_search:
= $0.0116 per query (~290x more expensive)
```

!!! success "Cost Advantage"
    Google Search grounding is significantly cheaper than OpenAI web search for high-volume monitoring. Grounding tokens are included in base pricing.

### When to Use Google Search Grounding

**Use Google Search Grounding when**:

- ✅ You need current, real-time information
- ✅ You want Google's search quality and coverage
- ✅ You're running high-volume monitoring (cost-effective)
- ✅ You want automatic search decision-making
- ✅ You need grounding metadata with source attribution

**Use OpenAI web search when**:

- ✅ You need explicit `tool_choice` control (force or disable search)
- ✅ You prefer OpenAI's LLM reasoning quality
- ✅ You're already invested in OpenAI ecosystem

**Use Perplexity when**:

- ✅ You need explicit source citations with URLs
- ✅ You want always-on web search (no configuration)
- ✅ You prefer Perplexity's citation format

### Complete Example Configuration

Multi-provider comparison with side-by-side grounding:

```yaml
run_settings:
  output_dir: "./output"
  sqlite_db_path: "./output/watcher.db"

  models:
    # Google with grounding (cost-effective, automatic)
    - provider: "google"
      model_name: "gemini-2.5-flash"
      env_api_key: "GEMINI_API_KEY"
      system_prompt: "google/gemini-grounding"
      tools:
        - google_search: {}

    # OpenAI with controlled web search
    - provider: "openai"
      model_name: "gpt-4o-mini"
      env_api_key: "OPENAI_API_KEY"
      tools:
        - type: "web_search"
      tool_choice: "auto"

    # Perplexity with always-on citations
    - provider: "perplexity"
      model_name: "sonar-pro"
      env_api_key: "PERPLEXITY_API_KEY"

brands:
  mine:
    - "Warmly"
    - "Lemlist"
  competitors:
    - "HubSpot"
    - "Instantly"

intents:
  - id: "best-email-tools-2025"
    prompt: "What are the best email warmup tools in 2025?"
```

**This configuration enables**:

- Google: Automatic grounding with lowest cost
- OpenAI: LLM-controlled web search with reasoning
- Perplexity: Always-on search with explicit citations

Compare results across all three to understand:
- How each provider uses web search
- Cost vs. quality trade-offs
- Grounding vs. citation differences

## Cost Management for Web Search

### Web Search Cost Breakdown

**OpenAI gpt-4o-mini with web search**:

```
Base query: $0.0004 (tokens only)
+ Web search call: $0.01 (per 1k calls)
+ Web search content: $0.0012 (8k tokens @ $0.15/1M)
= Total: ~$0.0116 per query
```

**Perplexity sonar-pro**:

```
Base tokens: $0.0050 (500 output tokens @ $3/$15 per 1M)
+ Request fee: $0.01 (varies by complexity)
= Total: ~$0.015 per query
```

### Budget Configuration for Web Search

Adjust budgets to account for higher costs:

```yaml
run_settings:
  # Without web search
  budget:
    max_per_run_usd: 0.50

  # With web search (10-30x higher)
  budget:
    max_per_run_usd: 5.00
```

**Example calculation**:

- 3 intents × 2 models with web search = 6 queries
- ~$0.015 per query
- Total: $0.09 per run
- Recommended budget: $0.50 (5x safety margin)

### Optimizing Web Search Costs

**1. Use `auto` tool choice**:

```yaml
tools:
  - type: "web_search"
tool_choice: "auto"  # Only search when needed
```

Model only uses web search when beneficial, reducing unnecessary searches.

---

**2. Mix web and non-web models**:

```yaml
models:
  # Web-grounded for fresh data
  - provider: "perplexity"
    model_name: "sonar-pro"
    env_api_key: "PERPLEXITY_API_KEY"

  # Base model for comparison
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    # No web search
```

Compare web vs. non-web responses to validate web search value.

---

**3. Use web search selectively**:

```yaml
intents:
  # Fresh data needed
  - id: "current-best-tools"
    prompt: "What are the best email tools in 2025?"
    # Use web search models for this intent

  # Historical query
  - id: "email-warmup-concept"
    prompt: "What is email warmup?"
    # No web search needed
```

Separate configs for different intent types.

---

**4. Track web search usage**:

```sql
-- Web search usage rate
SELECT
    model_name,
    COUNT(*) as total_queries,
    SUM(web_search_used) as web_searches,
    (SUM(web_search_used) * 100.0 / COUNT(*)) as usage_rate,
    AVG(estimated_cost_usd) as avg_cost
FROM answers_raw
WHERE model_provider = 'openai'
GROUP BY model_name;
```

Optimize based on actual usage patterns.

## Use Cases for Web Search

### 1. Recent Product Launches

Track brand visibility after launches:

```yaml
intents:
  - id: "best-tools-2025"
    prompt: "What are the best email warmup tools launched in 2025?"

models:
  - provider: "perplexity"
    model_name: "sonar-pro"
    env_api_key: "PERPLEXITY_API_KEY"
```

Web search ensures LLM knows about recent launches.

### 2. Current Competitive Landscape

Monitor live market positioning:

```yaml
intents:
  - id: "current-market-leaders"
    prompt: "Who are the current market leaders in email warmup?"

models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    tools:
      - type: "web_search"
    tool_choice: "required"  # Always search
```

### 3. Pricing and Features

Track current pricing mentions:

```yaml
intents:
  - id: "pricing-comparison"
    prompt: "Compare pricing for email warmup tools in 2025"

models:
  - provider: "perplexity"
    model_name: "sonar-pro"
    env_api_key: "PERPLEXITY_API_KEY"
```

### 4. News and Events

Monitor impact of news on brand visibility:

```yaml
intents:
  - id: "post-acquisition"
    prompt: "What are the best email tools after HubSpot's recent acquisition?"

models:
  - provider: "perplexity"
    model_name: "sonar-reasoning"
    env_api_key: "PERPLEXITY_API_KEY"
```

### 5. Trend Analysis

Track emerging trends:

```yaml
intents:
  - id: "ai-email-tools"
    prompt: "What are the best AI-powered email warmup tools?"

models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    tools:
      - type: "web_search"
    tool_choice: "auto"
```

## Analyzing Web Search Results

### Web Search Metadata

Check if web search was used:

```python
import json

with open("output/2025-11-01T08-00-00Z/intent_best-tools_raw_openai_gpt-4o-mini.json") as f:
    data = json.load(f)
    print(f"Web search used: {data.get('web_search_used')}")
    print(f"Searches performed: {data.get('web_search_count')}")
```

### Citation Analysis (Perplexity)

Extract and analyze citations:

```python
import json

with open("output/2025-11-01T08-00-00Z/intent_best-tools_raw_perplexity_sonar-pro.json") as f:
    data = json.load(f)
    for citation in data.get('citations', []):
        print(f"{citation['index']}: {citation['title']}")
        print(f"   {citation['url']}\n")
```

### Source Patterns

Track which sources LLMs cite:

```sql
-- Citation frequency (future feature)
SELECT
    citation_domain,
    COUNT(*) as citation_count,
    COUNT(DISTINCT intent_id) as intents_cited_in
FROM citations
GROUP BY citation_domain
ORDER BY citation_count DESC
LIMIT 10;
```

!!! info "Citation Tracking"
    Full citation tracking is planned for a future release. Currently, citations are stored in JSON artifacts.

## Best Practices

### 1. Test With and Without Web Search

Compare to measure impact:

```yaml
models:
  # Baseline (no web search)
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"

  # Test (with web search)
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    tools:
      - type: "web_search"
    tool_choice: "auto"
```

### 2. Use Auto Tool Choice

Let model decide when to search:

```yaml
tools:
  - type: "web_search"
tool_choice: "auto"  # More cost-effective
```

### 3. Budget Appropriately

Account for 10-30x cost increase:

```yaml
budget:
  max_per_run_usd: 5.00  # vs. $0.50 without web search
```

### 4. Use for Time-Sensitive Queries

Enable web search when freshness matters:

- Recent product launches
- Current pricing
- Latest competitive moves
- Industry news impact

### 5. Track Citation Sources

Monitor which sources influence rankings:

- Identify key industry publications
- Find content gaps
- Track competitor content
- Understand ranking factors

### 6. Combine Providers

Use multiple web search approaches:

```yaml
models:
  # OpenAI: Selective web search
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    tools:
      - type: "web_search"
    tool_choice: "auto"

  # Perplexity: Always web-grounded
  - provider: "perplexity"
    model_name: "sonar-pro"
    env_api_key: "PERPLEXITY_API_KEY"
```

## Troubleshooting

### Web Search Not Working

**Problem**: Web search tool not being used

**Check**:

1. Tool configuration is correct:
   ```yaml
   tools:
     - type: "web_search"  # Correct
   # Not: tool_type or search_tool
   ```

2. Tool choice is set:
   ```yaml
   tool_choice: "auto"  # or "required"
   ```

3. Model supports web search:
   - OpenAI: All chat models
   - Perplexity: All models (automatic)

---

### High Costs

**Problem**: Web search costs higher than expected

**Solutions**:

1. Check tool choice:
   ```yaml
   tool_choice: "auto"  # Not "required"
   ```

2. Monitor usage:
   ```sql
   SELECT
       COUNT(*) as total,
       SUM(web_search_used) as searches,
       AVG(estimated_cost_usd) as avg_cost
   FROM answers_raw;
   ```

3. Use cheaper models:
   ```yaml
   models:
     - provider: "openai"
       model_name: "gpt-4o-mini"  # Cheapest with web search
   ```

---

### Inconsistent Results

**Problem**: Results vary between runs

**Cause**: Web content changes frequently

**Expected behavior**: Web-grounded responses will vary as web content updates.

**Mitigation**:

- Run multiple queries, average results
- Track trends over time vs. point-in-time snapshots
- Use non-web models for baseline comparison

## Next Steps

- **[Model Configuration](models.md)**: Choose models with web search
- **[Budget Configuration](budget.md)**: Budget for web search costs
- **[Cost Management](../features/cost-management.md)**: Track web search spending
- **[HTML Reports](../features/html-reports.md)**: View web search metadata
