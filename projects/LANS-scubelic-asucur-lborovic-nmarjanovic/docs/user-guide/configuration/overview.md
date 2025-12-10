# Configuration Overview

LLM Answer Watcher uses a YAML configuration file to control all aspects of monitoring: which LLMs to query, which brands to track, what questions to ask, and how to manage costs.

## Configuration Structure

A complete configuration file has these main sections:

```yaml
run_settings:        # Output paths, models, and run behavior
extraction_settings: # Optional: advanced extraction configuration
brands:              # Your brand and competitors to track
intents:             # Questions to ask LLMs
global_operations:   # Optional: operations run for every intent
```

## Quick Start Example

Here's a minimal configuration to get started:

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
    - "MyBrand"
    - "MyBrand.io"

  competitors:
    - "CompetitorA"
    - "CompetitorB"

intents:
  - id: "best-tools"
    prompt: "What are the best tools for [your category]?"
```

!!! tip "Environment Variables"
    Set your API keys as environment variables before running:
    ```bash
    export OPENAI_API_KEY=sk-your-key-here
    export ANTHROPIC_API_KEY=sk-ant-your-key-here
    ```

## Configuration Sections Explained

### Run Settings

Controls where output is stored, which models to query, and runtime behavior.

**Key fields:**

- `output_dir`: Directory for run results (JSON files, HTML reports)
- `sqlite_db_path`: SQLite database path for historical tracking
- `models`: List of LLM models to query (see [Model Configuration](models.md))
- `use_llm_rank_extraction`: Use LLM to extract rankings (slower, more accurate)
- `budget`: Optional cost controls (see [Budget Configuration](budget.md))

**Example:**

```yaml
run_settings:
  output_dir: "./output"
  sqlite_db_path: "./output/watcher.db"

  models:
    - provider: "openai"
      model_name: "gpt-4o-mini"
      env_api_key: "OPENAI_API_KEY"

    - provider: "anthropic"
      model_name: "claude-3-5-haiku-20241022"
      env_api_key: "ANTHROPIC_API_KEY"

  use_llm_rank_extraction: false

  budget:
    enabled: true
    max_per_run_usd: 1.00
    warn_threshold_usd: 0.50
```

### Extraction Settings (Optional)

Advanced configuration for brand mention and rank extraction using function calling.

**Key fields:**

- `extraction_model`: Dedicated model for extraction (faster, cheaper than main models)
- `method`: Extraction method (`function_calling`, `regex`, or `hybrid`)
- `fallback_to_regex`: Fall back to regex if function calling fails
- `min_confidence`: Minimum confidence threshold (0.0-1.0)

**Example:**

```yaml
extraction_settings:
  extraction_model:
    provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    system_prompt: "openai/extraction-default"

  method: "function_calling"
  fallback_to_regex: true
  min_confidence: 0.7
```

!!! info "When to Use Extraction Settings"
    Use extraction settings when:

    - Regex extraction misses complex brand mentions
    - You need higher accuracy for ranking positions
    - You want to extract additional structured data

    Skip it when:

    - You're optimizing for cost (regex is free)
    - Your brand names are simple and unambiguous
    - You're running frequent monitoring jobs

### Brands

Defines which brands to track in LLM responses.

**Two categories:**

1. **mine**: Your brand aliases (at least one required)
2. **competitors**: Competitor brands to monitor

**Example:**

```yaml
brands:
  mine:
    - "Warmly"
    - "Warmly.io"
    - "Warmly AI"

  competitors:
    - "Instantly"
    - "Lemwarm"
    - "HubSpot"
    - "Apollo.io"
    - "Woodpecker"
```

!!! tip "Brand Alias Best Practices"
    - Include all variations (with/without TLD, with/without product name)
    - Use word-boundary matching to avoid false positives
    - Add common misspellings if relevant
    - Keep list focused (10-20 competitors maximum)

    See [Brand Configuration](brands.md) for detailed strategies.

### Intents

Questions you want to ask LLMs to test brand visibility.

**Key fields:**

- `id`: Unique identifier (alphanumeric, hyphens, underscores)
- `prompt`: Natural language question to ask
- `operations`: Optional post-query operations (see [Operations](operations.md))

**Example:**

```yaml
intents:
  - id: "best-email-warmup-tools"
    prompt: "What are the best email warmup tools?"

  - id: "email-warmup-comparison"
    prompt: "Compare the top email warmup tools for improving deliverability"

  - id: "hubspot-alternatives"
    prompt: "What are the best alternatives to HubSpot for small sales teams?"
```

!!! warning "Intent Prompt Design"
    Good prompts are:

    - **Natural**: How a real user would ask
    - **Specific**: Target a clear use case
    - **Buyer-focused**: Imply purchase intent
    - **Ranking-friendly**: Ask for "best" or "top" tools

    Bad prompts:

    - Too generic: "Tell me about CRM tools"
    - No ranking signal: "What is HubSpot?"
    - Biased: "Why is MyBrand better than CompetitorA?"

### Global Operations (Optional)

Operations that run for **every** intent across all models.

**Use cases:**

- Quality scoring for all LLM responses
- Sentiment analysis
- Content gap detection
- Consistent post-processing

**Example:**

```yaml
global_operations:
  - id: "quality-score"
    description: "Rate LLM response quality"
    prompt: |
      Rate this LLM response on a scale of 1-10 for accuracy and completeness:

      Question: {intent:prompt}
      Response: {intent:response}

      Provide a single number score (1-10) and brief justification.
    model: "gpt-4o-mini"
    enabled: true
```

!!! info "Global vs Intent-Specific Operations"
    Use **global operations** for:

    - Consistent quality checks
    - Standard metrics across all intents
    - Cost-effective batch analysis

    Use **intent-specific operations** for:

    - Detailed competitive analysis
    - Context-specific insights
    - Intent-dependent workflows

## Configuration Validation

Validate your configuration before running:

```bash
llm-answer-watcher validate --config watcher.config.yaml
```

**Common validation errors:**

1. **Missing API keys**: Environment variable not set
2. **Duplicate intent IDs**: Intent IDs must be unique
3. **Invalid provider**: Unsupported provider name
4. **Empty brand list**: At least one brand in `mine` required
5. **Invalid intent ID**: Must be alphanumeric with hyphens/underscores

!!! example "Validation Output"
    ```
    ✅ Configuration valid
    ├── 3 intents configured
    ├── 2 models configured (OpenAI, Anthropic)
    ├── 2 brands monitored
    ├── 5 competitors tracked
    └── Estimated cost: $0.0142 per run
    ```

## Configuration Best Practices

### 1. Start Small

Begin with one model and a few intents:

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"  # Cheapest option
    env_api_key: "OPENAI_API_KEY"

intents:
  - id: "primary-intent"
    prompt: "Your most important question"
```

### 2. Use Budget Controls

Prevent unexpected costs:

```yaml
run_settings:
  budget:
    enabled: true
    max_per_run_usd: 1.00
    warn_threshold_usd: 0.50
```

### 3. Keep Brand Lists Focused

Track 10-20 competitors maximum:

```yaml
brands:
  mine:
    - "YourBrand"      # Exact name
    - "YourBrand.io"   # With TLD

  competitors:
    # Top 5 direct competitors
    - "CompetitorA"
    - "CompetitorB"
    # Top 3 category leaders
    - "MarketLeader"
```

### 4. Design Intent Prompts Carefully

Ask natural questions with ranking signals:

```yaml
intents:
  # Good: Natural, specific, implies ranking
  - id: "best-crm-for-startups"
    prompt: "What are the best CRM tools for early-stage startups?"

  # Bad: Generic, no ranking signal
  - id: "crm-info"
    prompt: "Tell me about CRM software"
```

### 5. Use System Prompts

Customize model behavior with system prompts:

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    system_prompt: "openai/gpt-4-default"  # Uses default prompt
```

System prompts are stored in `llm_answer_watcher/system_prompts/{provider}/{prompt_name}.json`.

### 6. Enable Web Search for Fresh Data

Use web search for queries needing current information:

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
    Web search adds $10-$25 per 1,000 calls depending on the model. See [Web Search Configuration](web-search.md).

### 7. Version Your Config

Track configuration changes with git:

```bash
git add watcher.config.yaml
git commit -m "feat: add new competitor tracking"
```

This creates an audit trail of what you were monitoring when.

## Configuration Examples

### Production Monitoring

Multi-model, budget-controlled, comprehensive tracking:

```yaml
run_settings:
  output_dir: "./output"
  sqlite_db_path: "./output/watcher.db"

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

  budget:
    enabled: true
    max_per_run_usd: 5.00
    warn_threshold_usd: 2.50

extraction_settings:
  extraction_model:
    provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
  method: "function_calling"
  fallback_to_regex: true
  min_confidence: 0.7

brands:
  mine:
    - "MyBrand"
    - "MyBrand.io"

  competitors:
    - "TopCompetitor"
    - "MainRival"
    - "IndustryLeader"

intents:
  - id: "best-tools-general"
    prompt: "What are the best [category] tools?"

  - id: "best-tools-startups"
    prompt: "What are the best [category] tools for startups?"

  - id: "best-tools-enterprise"
    prompt: "What are the best [category] tools for enterprises?"
```

### Development Testing

Minimal config for fast iteration:

```yaml
run_settings:
  output_dir: "./output"
  sqlite_db_path: "./output/watcher.db"

  models:
    - provider: "openai"
      model_name: "gpt-4o-mini"
      env_api_key: "OPENAI_API_KEY"

  budget:
    enabled: true
    max_per_run_usd: 0.10

brands:
  mine:
    - "TestBrand"

  competitors:
    - "CompetitorA"

intents:
  - id: "test-intent"
    prompt: "What are the best tools for testing?"
```

### CI/CD Regression Testing

Automated monitoring with strict controls:

```yaml
run_settings:
  output_dir: "./ci-output"
  sqlite_db_path: "./ci-output/watcher.db"

  models:
    - provider: "openai"
      model_name: "gpt-4o-mini"
      env_api_key: "OPENAI_API_KEY"

  budget:
    enabled: true
    max_per_run_usd: 0.50

brands:
  mine:
    - "MyBrand"

  competitors:
    - "TopCompetitor"

intents:
  - id: "regression-test"
    prompt: "What are the best [category] tools?"
```

## Configuration File Location

LLM Answer Watcher looks for configuration in these locations (in order):

1. Path specified with `--config` flag
2. `watcher.config.yaml` in current directory
3. `~/.config/llm-answer-watcher/config.yaml`

**Best practice**: Keep config files in your project directory and specify explicitly:

```bash
llm-answer-watcher run --config watcher.config.yaml
```

## Environment Variables

### API Keys

All API keys are loaded from environment variables for security:

```bash
# OpenAI
export OPENAI_API_KEY=sk-your-key-here

# Anthropic
export ANTHROPIC_API_KEY=sk-ant-your-key-here

# Mistral
export MISTRAL_API_KEY=your-mistral-key-here

# X.AI Grok
export XAI_API_KEY=xai-your-key-here

# Google Gemini
export GOOGLE_API_KEY=AIza-your-key-here

# Perplexity
export PERPLEXITY_API_KEY=pplx-your-key-here
```

### Configuration Overrides

Override config values with environment variables:

```bash
# Override output directory
export LLM_WATCHER_OUTPUT_DIR="./custom-output"

# Override database path
export LLM_WATCHER_DB_PATH="./custom.db"

# Disable budget checks
export LLM_WATCHER_BUDGET_ENABLED=false
```

## Security Considerations

### Never Commit API Keys

Add `.env` files to `.gitignore`:

```gitignore
# .gitignore
.env
.env.local
*.env
watcher.config.local.yaml
```

### Use Environment-Specific Configs

Create separate configs for each environment:

```
configs/
├── watcher.config.dev.yaml      # Development
├── watcher.config.staging.yaml  # Staging
├── watcher.config.prod.yaml     # Production
```

Load the appropriate config:

```bash
llm-answer-watcher run --config configs/watcher.config.prod.yaml
```

### Rotate API Keys Regularly

Update API keys in your environment:

```bash
# Update key
export OPENAI_API_KEY=sk-new-key-here

# Verify it works
llm-answer-watcher validate --config watcher.config.yaml
```

## Troubleshooting

### Configuration Validation Fails

**Problem**: `Configuration error: Invalid YAML syntax`

**Solution**: Check YAML syntax with a validator:

```bash
python -c "import yaml; yaml.safe_load(open('watcher.config.yaml'))"
```

Common YAML errors:

- Inconsistent indentation (use 2 spaces)
- Missing colons after keys
- Unquoted strings with special characters
- Mixing tabs and spaces

---

**Problem**: `API key not found: OPENAI_API_KEY`

**Solution**: Set the environment variable:

```bash
export OPENAI_API_KEY=sk-your-key-here
```

Verify it's set:

```bash
echo $OPENAI_API_KEY
```

---

**Problem**: `Duplicate intent IDs found: best-tools`

**Solution**: Make each intent ID unique:

```yaml
intents:
  - id: "best-tools-general"      # Changed from "best-tools"
    prompt: "What are the best tools?"

  - id: "best-tools-startups"     # Changed from "best-tools"
    prompt: "What are the best tools for startups?"
```

### Output Directory Issues

**Problem**: `Cannot write to output directory: Permission denied`

**Solution**: Check directory permissions:

```bash
mkdir -p ./output
chmod 755 ./output
```

Or change to a directory you own:

```yaml
run_settings:
  output_dir: "~/llm-watcher-output"
```

---

**Problem**: `SQLite database is locked`

**Solution**: Ensure no other processes are using the database:

```bash
# Check for locks
lsof ./output/watcher.db

# Kill blocking processes if safe
kill -9 <PID>
```

Or use a separate database:

```yaml
run_settings:
  sqlite_db_path: "./output/watcher-$(date +%s).db"
```

### Model Configuration Issues

**Problem**: `Unsupported provider: openai-gpt4`

**Solution**: Use correct provider names:

```yaml
# ❌ Wrong
provider: "openai-gpt4"

# ✅ Correct
provider: "openai"
model_name: "gpt-4o-mini"
```

Supported providers: `openai`, `anthropic`, `mistral`, `grok`, `google`, `perplexity`

---

**Problem**: `Model not found: gpt-4o-mini-turbo`

**Solution**: Use valid model names:

```yaml
# ❌ Wrong (doesn't exist)
model_name: "gpt-4o-mini-turbo"

# ✅ Correct
model_name: "gpt-4o-mini"
```

Check [Model Configuration](models.md) for valid model names.

## Next Steps

Now that you understand the configuration structure, dive into specific sections:

- **[Model Configuration](models.md)**: Choose the right models for your use case
- **[Brand Configuration](brands.md)**: Optimize brand detection strategies
- **[Intent Configuration](intents.md)**: Design effective prompts
- **[Budget Configuration](budget.md)**: Control costs and prevent overruns
- **[Web Search Configuration](web-search.md)**: Enable real-time information retrieval
- **[Operations Configuration](operations.md)**: Automate post-query analysis

Or jump to usage guides:

- **[CLI Commands](../usage/cli-commands.md)**: Run your first monitoring job
- **[Output Modes](../usage/output-modes.md)**: Understand output formats
- **[Automation](../usage/automation.md)**: Set up scheduled monitoring
