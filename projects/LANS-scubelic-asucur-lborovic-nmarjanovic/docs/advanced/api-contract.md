# API Contract

Internal API designed for future HTTP exposure.

## Core Contract

```python
def run_all(config: RuntimeConfig) -> dict:
    """
    Execute monitoring run.

    Args:
        config: Validated runtime configuration

    Returns:
        {
            "run_id": "YYYY-MM-DDTHH-MM-SSZ",
            "status": "success" | "partial" | "failed",
            "queries_completed": int,
            "queries_failed": int,
            "total_cost_usd": float,
            "output_dir": str,
            "brands_detected": {...}
        }
    """
```

## Future HTTP API

The internal contract is designed to become an HTTP API:

```http
POST /api/v1/run
Content-Type: application/json

{
  "config": {...},
  "return_format": "json"
}
```

## Provider Interface

```python
@dataclass
class LLMResponse:
    answer_text: str
    tokens_used: int
    cost_usd: float
    provider: str
    model_name: str
    timestamp_utc: str
```

See [Architecture](architecture.md) for overall design.
