# Configuration Schema

Complete YAML configuration schema reference.

## Root Structure

```yaml
run_settings:  # Required
brands:        # Required
intents:       # Required
```

## `run_settings`

```yaml
run_settings:
  output_dir: string           # Required
  sqlite_db_path: string       # Required
  models: [ModelConfig]        # Required
  use_llm_rank_extraction: bool  # Optional, default: false
  extraction_settings: ExtractionSettings  # Optional
  budget: BudgetConfig         # Optional
  web_search: WebSearchConfig  # Optional
```

## `ModelConfig`

```yaml
provider: string              # Required: openai, anthropic, etc.
model_name: string            # Required
env_api_key: string           # Required
system_prompt: string         # Optional
```

## `brands`

```yaml
brands:
  mine: [string]              # Required
  competitors: [string]       # Required
```

## `intents`

```yaml
intents:
  - id: string                # Required
    prompt: string            # Required
    operations: [Operation]   # Optional
```

See [Configuration Overview](../user-guide/configuration/overview.md).
