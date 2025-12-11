# Custom System Prompts

Customize system prompts for LLM queries.

## Built-in Prompts

Located in `llm_answer_watcher/system_prompts/`:

```
system_prompts/
├── openai/
│   ├── gpt-4-default.json
│   └── extraction-default.json
├── anthropic/
│   └── default.json
└── mistral/
    └── default.json
```

## Using Custom Prompts

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    system_prompt: "openai/custom-prompt"
```

## Creating Custom Prompts

1. Create JSON file in `system_prompts/provider/`:

```json
{
  "role": "system",
  "content": "You are a helpful assistant focused on..."
}
```

2. Reference in config:

```yaml
system_prompt: "openai/custom-prompt"
```

## Prompt Guidelines

- Keep prompts neutral (avoid biasing toward your brand)
- Be concise yet comprehensive
- Test with evaluation framework

See [API Contract](api-contract.md) for technical details.
