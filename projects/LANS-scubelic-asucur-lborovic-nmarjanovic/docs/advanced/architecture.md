# Architecture

LLM Answer Watcher follows Domain-Driven Design principles with strict separation of concerns.

## Core Domains

```
llm_answer_watcher/
├── config/         # Configuration loading and validation
├── llm_runner/     # LLM client abstraction
├── extractor/      # Brand mention detection
├── storage/        # SQLite and JSON persistence
├── report/         # HTML report generation
├── utils/          # Shared utilities
└── cli.py          # CLI interface
```

## Design Patterns

### 1. Provider Abstraction

```python
class LLMClient(Protocol):
    def generate_answer(self, prompt: str) -> LLMResponse:
        ...

def build_client(provider: str, model: str) -> LLMClient:
    ...
```

### 2. API-First Contract

```python
def run_all(config: RuntimeConfig) -> dict:
    # Internal "POST /run" contract
    # OSS CLI calls in-process
    # Cloud will expose over HTTP
    return {"run_id": "...", "cost_usd": 0.01}
```

### 3. Dual-Mode CLI

```python
class OutputMode(Enum):
    HUMAN = "human"  # Rich formatting
    JSON = "json"    # Structured output
    QUIET = "quiet"  # Minimal output
```

See [API Contract](api-contract.md) for internal API details.
