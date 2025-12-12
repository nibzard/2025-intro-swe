# Basic Configuration

Learn how to create your first custom configuration file for LLM Answer Watcher.

## Configuration File Structure

LLM Answer Watcher uses YAML configuration files with three main sections:

```yaml
run_settings:    # How and where to run
brands:          # What brands to monitor
intents:         # What questions to ask
```

## Minimal Configuration

The simplest possible configuration:

```yaml
run_settings:
  output_dir: "./output"
  sqlite_db_path: "./output/watcher.db"

  models:
    - provider: "openai"
      model_name: "gpt-4o-mini"
      env_api_key: "OPENAI_API_KEY"

brands:
  mine:
    - "YourBrand"

  competitors:
    - "CompetitorA"
    - "CompetitorB"

intents:
  - id: "best-tools"
    prompt: "What are the best [your category] tools?"
```

This configuration:

- Uses OpenAI's `gpt-4o-mini` (cost-effective)
- Monitors 1 brand vs 2 competitors
- Asks 1 intent question
- Stores results in `./output/`

## Run Settings Section

### Basic Run Settings

```yaml
run_settings:
  # Where to store output files
  output_dir: "./output"

  # SQLite database path for historical tracking
  sqlite_db_path: "./output/watcher.db"

  # Use LLM for rank extraction (more accurate but costs more)
  use_llm_rank_extraction: false
```

### Model Configuration

Define which LLM providers and models to use:

```yaml
run_settings:
  models:
    # OpenAI configuration
    - provider: "openai"
      model_name: "gpt-4o-mini"
      env_api_key: "OPENAI_API_KEY"

    # Anthropic configuration
    - provider: "anthropic"
      model_name: "claude-3-5-haiku-20241022"
      env_api_key: "ANTHROPIC_API_KEY"
```

**Key Points:**

- **provider**: Must be one of: `openai`, `anthropic`, `mistral`, `grok`, `google`, `perplexity`
- **model_name**: Specific model identifier (see [Provider Guide](../providers/overview.md))
- **env_api_key**: Environment variable name containing your API key

!!! tip "Model Selection"
    Start with cost-effective models:

    - **OpenAI**: `gpt-4o-mini` ($0.15/1M input tokens)
    - **Anthropic**: `claude-3-5-haiku-20241022` ($0.80/1M input tokens)
    - **Mistral**: `mistral-small-latest` ($0.20/1M input tokens)
    - **Grok**: `grok-2-1212` ($2.00/1M input tokens)
    - **Google**: `gemini-2.0-flash-exp` (free tier available)

### Optional System Prompts

Customize the system prompt for each model:

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    system_prompt: "openai/gpt-4-default"  # Uses built-in prompt
```

If not specified, uses the provider's default prompt.

## Brands Section

### Your Brands

Define all variations of your brand name:

```yaml
brands:
  mine:
    - "YourBrand"
    - "YourBrand.io"
    - "YourBrand CRM"
    - "yourbrand.com"
```

**Why multiple aliases?**

LLMs might reference your brand differently:

- "HubSpot" vs "HubSpot CRM"
- "Lemwarm" vs "Lemwarm.io"
- Domain names: "acme.com"

!!! warning "Word Boundary Matching"
    Brands are matched using word boundaries. "Hub" will NOT match in "GitHub".
    Add specific variations if needed.

### Competitors

List all competitors to track:

```yaml
brands:
  competitors:
    - "CompetitorA"
    - "CompetitorB"
    - "IndustryTool"
    - "Alternative.io"
    - "BigPlayer CRM"
```

**Tips:**

- Include direct competitors (same category)
- Include indirect competitors (adjacent use cases)
- Use specific names, not generic terms
- Add variations for well-known competitors

### Complete Brands Example

```yaml
brands:
  mine:
    - "Lemwarm"
    - "Lemwarm.io"
    - "Lemlist"
    - "Lemlist.com"

  competitors:
    - "Instantly"
    - "Instantly.ai"
    - "Warmbox"
    - "Warmbox.ai"
    - "MailReach"
    - "HubSpot"
    - "Apollo.io"
    - "Woodpecker"
```

## Intents Section

Intents are the questions you want to ask LLMs.

### Basic Intent

```yaml
intents:
  - id: "best-tools"
    prompt: "What are the best email warmup tools?"
```

**Intent Structure:**

- **id**: Unique identifier (used in filenames and database)
- **prompt**: The exact question to ask the LLM

### Multiple Intents

Test different question types:

```yaml
intents:
  # Direct question
  - id: "best-email-warmup-tools"
    prompt: "What are the best email warmup tools?"

  # Comparison query
  - id: "comparison-warmup-tools"
    prompt: "Compare the top email warmup tools for improving deliverability"

  # Specific use case
  - id: "cold-outreach-tools"
    prompt: "Which email warmup tools are best for cold outreach campaigns?"

  # Alternative phrasing
  - id: "recommended-warmup-services"
    prompt: "What email warmup services do you recommend for startups?"
```

### Intent ID Best Practices

Use descriptive, URL-safe IDs:

✅ Good IDs:
- `best-crm-tools`
- `email-automation-comparison`
- `startup-friendly-options`

❌ Avoid:
- `query1` (not descriptive)
- `best CRM tools` (spaces)
- `what's-best?` (special characters)

### Crafting Effective Prompts

**Good prompts are:**

1. **Natural**: How a real user would ask
2. **Specific**: Target a particular use case or category
3. **Open-ended**: Allow for varied responses
4. **Buyer-intent**: Imply readiness to evaluate/purchase

Examples:

```yaml
intents:
  # ✅ Good: Natural buyer-intent query
  - id: "saas-analytics-tools"
    prompt: "What are the best analytics tools for SaaS companies?"

  # ✅ Good: Specific use case
  - id: "startup-crm-budget"
    prompt: "Which CRM is best for startups on a tight budget?"

  # ❌ Too broad
  - id: "software"
    prompt: "Tell me about software"

  # ❌ Not buyer-intent
  - id: "history"
    prompt: "What is the history of CRM software?"
```

## Complete Basic Configuration Example

Here's a complete, production-ready configuration:

```yaml
run_settings:
  output_dir: "./output"
  sqlite_db_path: "./output/watcher.db"

  models:
    # Cost-effective model for regular monitoring
    - provider: "openai"
      model_name: "gpt-4o-mini"
      env_api_key: "OPENAI_API_KEY"

    # High-quality model for comparison
    - provider: "anthropic"
      model_name: "claude-3-5-haiku-20241022"
      env_api_key: "ANTHROPIC_API_KEY"

  # Use regex-based extraction (faster, cheaper)
  use_llm_rank_extraction: false

brands:
  mine:
    - "Lemwarm"
    - "Lemwarm.io"
    - "Lemlist"
    - "lemlist.com"

  competitors:
    - "Instantly"
    - "Instantly.ai"
    - "Warmbox"
    - "Warmbox.ai"
    - "MailReach"
    - "HubSpot"
    - "Apollo.io"
    - "Woodpecker"

intents:
  # Direct question
  - id: "best-email-warmup-tools"
    prompt: "What are the best email warmup tools?"

  # Comparison query
  - id: "warmup-tools-comparison"
    prompt: "Compare the top email warmup tools for improving email deliverability"

  # Use case specific
  - id: "cold-outreach-warmup"
    prompt: "Which email warmup tools are best for cold outreach campaigns?"

  # Budget-conscious
  - id: "affordable-warmup-tools"
    prompt: "What are the most affordable email warmup tools for startups?"
```

## Testing Your Configuration

Always validate before running:

```bash
llm-answer-watcher validate --config my-config.yaml
```

Expected output:

```
✅ Configuration valid
├── Models: 2 configured
│   ├── openai: gpt-4o-mini
│   └── anthropic: claude-3-5-haiku-20241022
├── Brands: 4 mine, 8 competitors
├── Intents: 4 queries
└── Estimated cost: $0.016 (8 queries total)
```

## Next Steps

Now that you understand basic configuration:

<div class="grid cards" markdown>

-   :material-cog-outline: **Advanced Configuration**

    ---

    Budget controls, web search, custom operations

    [Configuration Guide →](../user-guide/configuration/overview.md)

-   :material-run-fast: **Run Your Config**

    ---

    Execute monitoring with your custom configuration

    [First Run →](first-run.md)

-   :material-google-circles-communities: **Add More Providers**

    ---

    Learn about Mistral, Grok, Google, Perplexity

    [Providers →](../providers/overview.md)

-   :material-file-document-multiple: **See Examples**

    ---

    Browse organized configuration examples

    [Quickstart Examples →](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/01-quickstart) | [All Examples →](https://github.com/nibzard/llm-answer-watcher/tree/main/examples)

</div>
