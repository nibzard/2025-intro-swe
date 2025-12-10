# Python API

Using LLM Answer Watcher as a Python library.

## Programmatic Usage

```python
from llm_answer_watcher.config.loader import load_config_from_file
from llm_answer_watcher.llm_runner.runner import run_all

# Load configuration
config = load_config_from_file("config.yaml")

# Run monitoring
result = run_all(config)

print(f"Run ID: {result['run_id']}")
print(f"Cost: ${result['total_cost_usd']:.4f}")
print(f"Brands: {result['brands_detected']}")
```

## Core Modules

### Config Loading

```python
from llm_answer_watcher.config.loader import load_config_from_file
from llm_answer_watcher.config.schema import RuntimeConfig

config: RuntimeConfig = load_config_from_file("config.yaml")
```

### LLM Clients

```python
from llm_answer_watcher.llm_runner.models import build_client

client = build_client(
    provider="openai",
    model_name="gpt-4o-mini",
    api_key=api_key,
    system_prompt=prompt
)

response = client.generate_answer("What are the best tools?")
```

### Extraction

```python
from llm_answer_watcher.extractor.mention_detector import detect_mentions

mentions = detect_mentions(
    text=llm_response,
    brands_mine=["YourBrand"],
    brands_competitors=["CompetitorA"]
)
```

See [Architecture](../advanced/architecture.md) for design details.
