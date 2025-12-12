# Testing Utilities

LLM Answer Watcher provides specialized testing utilities to help you write reliable tests without making real API calls or dealing with brittle HTTP mocking.

## Overview

The testing utilities follow patterns inspired by modern LLM abstraction layers:

- **MockLLMClient**: Deterministic responses for testing extraction logic
- **ChaosLLMClient**: Resilience testing with controlled failure injection
- **Protocol-based**: Both implement the `LLMClient` protocol

## MockLLMClient

### Basic Usage

The `MockLLMClient` provides deterministic responses without making real API calls:

```python
from llm_answer_watcher.llm_runner.mock_client import MockLLMClient

# Create client with configured responses
client = MockLLMClient(
    responses={
        "What are the best CRM tools?": "HubSpot and Salesforce are leading CRM platforms.",
        "best email warmup": "Warmly, HubSpot, and Instantly are top choices."
    },
    default_response="No specific answer available.",
    tokens_per_response=300,
    cost_per_response=0.001
)

# Use in tests
response = await client.generate_answer("What are the best CRM tools?")
assert response.answer_text == "HubSpot and Salesforce are leading CRM platforms."
assert response.tokens_used == 300
assert response.cost_usd == 0.001
```

### Configuration Options

```python
MockLLMClient(
    responses={"prompt": "answer"},  # Dict mapping prompts to answers
    default_response="Default answer",  # Fallback when prompt not found
    model_name="mock-gpt-4",  # Model name in responses
    provider="mock-openai",  # Provider name in responses
    tokens_per_response=100,  # Token count to report
    cost_per_response=0.0,  # Cost to report
    streaming_chunk_size=None,  # Enable streaming (see below)
    streaming_delay_ms=50  # Delay between chunks
)
```

### Integration Testing

MockLLMClient works seamlessly with the extraction pipeline:

```python
from llm_answer_watcher.config.schema import Brands
from llm_answer_watcher.extractor.parser import parse_answer

# Create mock client
client = MockLLMClient(
    responses={"best CRM": "1. HubSpot\n2. Salesforce\n3. Warmly"}
)

# Generate answer
response = await client.generate_answer("best CRM")

# Test extraction
brands = Brands(mine=["Warmly"], competitors=["HubSpot", "Salesforce"])
extraction = parse_answer(response.answer_text, brands)

assert extraction.appeared_mine is True
assert len(extraction.my_mentions) == 1
assert len(extraction.competitor_mentions) == 2
```

### Streaming Support

MockLLMClient supports optional streaming for testing streaming workflows:

```python
chunks = []

client = MockLLMClient(
    responses={"test": "Hello world from LLM"},
    streaming_chunk_size=5,  # Stream in 5-char chunks
    streaming_delay_ms=10  # 10ms delay between chunks
)

response = await client.generate_answer(
    "test",
    on_chunk=lambda chunk: chunks.append(chunk)
)

# Chunks received during streaming
assert chunks == ['Hello', ' worl', 'd fro', 'm LLM']

# Full response still returned
assert response.answer_text == "Hello world from LLM"
```

## ChaosLLMClient

### Basic Usage

The `ChaosLLMClient` wraps any `LLMClient` and probabilistically injects failures:

```python
from llm_answer_watcher.llm_runner.chaos_client import ChaosLLMClient

# Wrap a base client (e.g., MockLLMClient)
base = MockLLMClient(responses={"test": "answer"})

chaos = ChaosLLMClient(
    base_client=base,
    success_rate=0.7,  # 70% success, 30% failure
    rate_limit_prob=0.1,  # 10% chance of 429 error
    server_error_prob=0.1,  # 10% chance of 5xx error
    timeout_prob=0.05,  # 5% chance of timeout
    auth_error_prob=0.05,  # 5% chance of 401 error
    seed=42  # Optional: reproducible chaos
)

# May succeed or fail
try:
    response = await chaos.generate_answer("test")
    print("Success!")
except RuntimeError as e:
    print(f"Chaos injected: {e}")
```

### Factory Function

Use `create_chaos_client()` for balanced error distribution:

```python
from llm_answer_watcher.llm_runner.chaos_client import create_chaos_client

chaos = create_chaos_client(
    base_client=base,
    failure_rate=0.3,  # 30% overall failures
    seed=42
)

# Failures distributed evenly:
# - 7.5% rate limit (429)
# - 7.5% server errors (500/502/503)
# - 7.5% timeout
# - 7.5% auth error (401)
```

### Testing Retry Logic

Validate your retry logic handles transient failures:

```python
# High failure rate to force retries
chaos = ChaosLLMClient(
    base_client=base,
    success_rate=0.3,  # 70% failure rate
    seed=42
)

# Retry loop
max_attempts = 3
for attempt in range(max_attempts):
    try:
        response = await chaos.generate_answer("test")
        break  # Success!
    except RuntimeError as e:
        if attempt == max_attempts - 1:
            raise  # Give up after max attempts
        # Otherwise retry
```

### Reproducible Chaos

Use `seed` for deterministic test runs:

```python
# Two clients with same seed produce identical behavior
chaos1 = ChaosLLMClient(base_client=base, success_rate=0.5, seed=123)
chaos2 = ChaosLLMClient(base_client=base, success_rate=0.5, seed=123)

# Same sequence of successes/failures
for i in range(10):
    result1 = await chaos1.generate_answer("test")
    result2 = await chaos2.generate_answer("test")
    # Both succeed or both fail identically
```

## Error Types Injected

ChaosLLMClient injects realistic errors:

| Error Type | Status Code | Description | Retryable? |
|------------|-------------|-------------|-----------|
| Rate Limit | 429 | Too many requests | Yes |
| Server Error | 500/502/503 | Server-side issues | Yes |
| Timeout | - | Network timeout | Yes |
| Auth Error | 401 | Invalid API key | No |

## Best Practices

### 1. Use MockLLMClient for Logic Tests

Test extraction, parsing, and business logic:

```python
def test_brand_detection():
    client = MockLLMClient(
        responses={"test": "Warmly and HubSpot are great tools."}
    )
    # Test extraction logic
```

### 2. Use ChaosLLMClient for Resilience Tests

Test error handling and retry logic:

```python
def test_retry_on_rate_limit():
    chaos = ChaosLLMClient(
        base_client=base,
        rate_limit_prob=1.0  # Always 429
    )
    # Test retry behavior
```

### 3. Avoid HTTP Mocking

Instead of:

```python
# ❌ Brittle HTTP mocking
httpx_mock.add_response(
    url="https://api.openai.com/...",
    json={"choices": [{"message": {"content": "..."}}]}
)
```

Use:

```python
# ✅ Clean protocol-based mocking
client = MockLLMClient(responses={"prompt": "answer"})
```

### 4. Test Statistical Distribution

For chaos testing, validate statistical properties:

```python
successes = 0
failures = 0
trials = 1000

chaos = ChaosLLMClient(base_client=base, success_rate=0.7, seed=42)

for _ in range(trials):
    try:
        await chaos.generate_answer("test")
        successes += 1
    except RuntimeError:
        failures += 1

success_rate = successes / trials
assert 0.65 <= success_rate <= 0.75  # Allow 5% tolerance
```

## Migration from HTTP Mocking

### Before (pytest-httpx)

```python
def test_openai_client(httpx_mock):
    httpx_mock.add_response(
        method="POST",
        url="https://api.openai.com/v1/chat/completions",
        json={
            "choices": [{"message": {"content": "test answer"}}],
            "usage": {"total_tokens": 100}
        }
    )

    client = OpenAIClient(...)
    response = await client.generate_answer("test")
    assert response.answer_text == "test answer"
```

### After (MockLLMClient)

```python
def test_extraction_pipeline():
    client = MockLLMClient(responses={"test": "test answer"})

    response = await client.generate_answer("test")
    assert response.answer_text == "test answer"

    # Now test the entire pipeline
    extraction = parse_answer(response.answer_text, brands)
    # ... test extraction logic
```

## See Also

- [Development Setup](development-setup.md) - Setting up your dev environment
- [Testing Guide](testing.md) - Overall testing strategy
- [Code Standards](code-standards.md) - Code quality requirements
