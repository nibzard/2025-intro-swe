# Extending Providers

Add support for new LLM providers.

## Provider Interface

```python
from llm_answer_watcher.llm_runner.models import LLMClient, LLMResponse

class MyCustomClient:
    def __init__(self, model_name: str, api_key: str, system_prompt: str):
        self.model = model_name
        self.api_key = api_key
        self.system_prompt = system_prompt

    def generate_answer(self, prompt: str) -> LLMResponse:
        # Call your LLM API
        response = call_my_llm_api(prompt)

        return LLMResponse(
            answer_text=response.text,
            tokens_used=response.tokens,
            cost_usd=calculate_cost(response),
            provider="my_provider",
            model_name=self.model,
            timestamp_utc=utc_timestamp()
        )
```

## Registering Provider

```python
# llm_runner/models.py
def build_client(provider: str, model_name: str, ...) -> LLMClient:
    if provider == "my_provider":
        return MyCustomClient(...)
    # ...
```

## Testing Your Provider

```python
def test_my_provider(httpx_mock):
    httpx_mock.add_response(...)
    client = MyCustomClient(...)
    response = client.generate_answer("test")
    assert response.provider == "my_provider"
```

See [Architecture](architecture.md) for design patterns.
