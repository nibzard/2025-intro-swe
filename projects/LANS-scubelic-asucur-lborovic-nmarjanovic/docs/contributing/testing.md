# Testing Guidelines

Writing and running tests.

## Test Structure

```
tests/
├── test_config_loader.py
├── test_openai_client.py
├── test_mention_detector.py
├── test_rank_extractor.py
└── ...
```

## Writing Tests

### Unit Tests

```python
def test_brand_detection():
    text = "Use HubSpot for CRM"
    brands = ["HubSpot", "Salesforce"]

    mentions = detect_mentions(text, brands)

    assert len(mentions) == 1
    assert mentions[0].brand == "HubSpot"
```

### Mocking LLM APIs

```python
def test_openai_client(httpx_mock):
    httpx_mock.add_response(
        method="POST",
        url="https://api.openai.com/v1/chat/completions",
        json={"choices": [{"message": {"content": "..."}}]}
    )

    client = OpenAIClient(...)
    response = client.generate_answer("test")

    assert response.provider == "openai"
```

### Time Mocking

```python
from freezegun import freeze_time

@freeze_time("2025-11-01 08:00:00")
def test_timestamp():
    run_id = run_id_from_timestamp()
    assert run_id == "2025-11-01T08-00-00Z"
```

## Running Tests

```bash
# All tests
pytest

# With coverage
pytest --cov=llm_answer_watcher

# Specific test
pytest tests/test_config_loader.py

# Verbose
pytest -v

# Skip slow tests
pytest -m "not slow"
```

## Coverage Requirements

- **Core modules**: 80%+
- **Critical paths**: 100%

```bash
pytest --cov=llm_answer_watcher --cov-report=html
open htmlcov/index.html
```

See [Code Standards](code-standards.md) for style guidelines.
