# System Prompts Library

This directory contains system prompts for different LLM providers. System prompts are the instructions sent to LLMs to establish context, personality, and behavioral guidelines.

## Overview

The system prompts library supports:
- **Multiple prompts per provider** organized in provider-specific folders
- **User overrides** via `~/.config/llm-answer-watcher/system_prompts/`
- **Provider defaults** that are automatically applied when no specific prompt is configured
- **JSON-based storage** with metadata for versioning and compatibility tracking

## Directory Structure

```
llm_answer_watcher/system_prompts/          # Package defaults
├── openai/
│   ├── default.json                       # Default prompt for OpenAI models
│   ├── gpt-4-default.json                 # GPT-4 specific prompt
│   └── gpt-5-default.json                 # GPT-5 specific prompt
└── anthropic/
    └── default.json                       # Default prompt for Anthropic models

~/.config/llm-answer-watcher/system_prompts/  # User overrides (optional)
└── openai/
    └── custom-analyst.json                # Custom user-defined prompt
```

## JSON Schema

Each system prompt is a JSON file with the following structure:

```json
{
  "name": "gpt-4-default",
  "description": "ChatGPT default system prompt for GPT-4 models",
  "provider": "openai",
  "compatible_models": ["gpt-4", "gpt-4-turbo", "gpt-4o", "gpt-4o-mini"],
  "prompt": "You are ChatGPT, a large language model trained by OpenAI...",
  "metadata": {
    "version": "v2",
    "created": "2025-03-07",
    "author": "openai"
  }
}
```

### Required Fields

- **name**: Short identifier for this prompt (string)
- **description**: Human-readable description of the prompt's purpose (string)
- **provider**: LLM provider name (`"openai"`, `"anthropic"`, etc.)
- **prompt**: The actual system prompt text sent to the LLM (string)

### Optional Fields

- **compatible_models**: List of model names this prompt is designed for (array of strings)
- **metadata**: Additional metadata like version, author, creation date (object)

## Usage in Configuration

### Explicit Prompt Selection

Specify a system prompt in your `watcher.config.yaml`:

```yaml
run_settings:
  models:
    - provider: "openai"
      model_name: "gpt-4o-mini"
      env_api_key: "OPENAI_API_KEY"
      system_prompt: "openai/gpt-4-default"  # Relative path to JSON file
```

### Automatic Provider Default

If no `system_prompt` is specified, the provider's default is used automatically:

```yaml
run_settings:
  models:
    - provider: "openai"
      model_name: "gpt-4o-mini"
      env_api_key: "OPENAI_API_KEY"
      # Uses openai/default.json automatically
```

## Creating Custom Prompts

### Package-Level Prompts (for contributors)

1. Create a new JSON file in the appropriate provider directory:
   ```bash
   touch llm_answer_watcher/system_prompts/openai/my-custom-prompt.json
   ```

2. Use the JSON schema shown above

3. Reference it in config as `"openai/my-custom-prompt"`

### User-Level Prompts (for end users)

1. Create the user prompts directory:
   ```bash
   mkdir -p ~/.config/llm-answer-watcher/system_prompts/openai
   ```

2. Create your custom prompt JSON file:
   ```bash
   cat > ~/.config/llm-answer-watcher/system_prompts/openai/my-prompt.json << 'EOF'
   {
     "name": "my-custom-analyst",
     "description": "My custom market analyst prompt",
     "provider": "openai",
     "prompt": "You are an expert market analyst specializing in B2B SaaS...",
     "metadata": {
       "version": "1.0",
       "author": "my-name"
     }
   }
   EOF
   ```

3. Reference it in config as `"openai/my-prompt"`

**Note**: User prompts take precedence over package prompts with the same relative path.

## Path Resolution

When loading a system prompt, the loader checks paths in this order:

1. **User directory**: `~/.config/llm-answer-watcher/system_prompts/{relative_path}.json`
2. **Package directory**: `llm_answer_watcher/system_prompts/{relative_path}.json`

This allows users to override package defaults without modifying the installation.

## Provider-Specific Notes

### OpenAI

OpenAI models use the `messages` array format with a system role:

```json
{
  "messages": [
    {"role": "system", "content": "Your system prompt here"},
    {"role": "user", "content": "User query"}
  ]
}
```

**Available prompts:**
- `openai/default.json` - Unbiased market analyst (used by all OpenAI models by default)
- `openai/gpt-4-default.json` - ChatGPT personality for GPT-4 models
- `openai/gpt-5-default.json` - Enhanced ChatGPT personality for GPT-5 models

### Google (Gemini)

Google Gemini models use a `systemInstruction` parameter separate from the contents array:

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{"text": "User query"}]
    }
  ],
  "systemInstruction": {
    "parts": [{"text": "Your system prompt here"}]
  },
  "tools": [
    {"google_search": {}}  // Optional: Enable Google Search grounding
  ]
}
```

**Available prompts:**
- `google/default.json` - Unbiased market analyst (used by all Gemini models by default)
- `google/gemini-grounding.json` - Gemini prompt with Google Search grounding instructions

**Google Search Grounding:**

Gemini supports Google Search grounding for real-time web information. To enable:

1. Use the `gemini-grounding` system prompt (designed for grounding use cases)
2. Add `tools` configuration to your model config:

```yaml
models:
  - provider: "google"
    model_name: "gemini-2.5-flash"
    env_api_key: "GEMINI_API_KEY"
    system_prompt: "google/gemini-grounding"
    tools:
      - google_search: {}  # Enable Google Search grounding
```

When grounding is enabled, Gemini automatically:
- Determines when web search is needed based on the query
- Generates and executes search queries
- Provides grounded responses with citations

The grounding metadata includes:
- `webSearchQueries`: List of search queries performed
- `groundingChunks`: Web sources used (URLs and titles)
- `groundingSupports`: Citation mappings linking text segments to sources

**Note**: Google Search grounding incurs additional API costs. See [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) for details.

### Anthropic

Anthropic Claude models use a top-level `system` parameter:

```json
{
  "model": "claude-3-5-haiku-20241022",
  "system": "Your system prompt here",
  "messages": [
    {"role": "user", "content": "User query"}
  ]
}
```

**Note**: This architectural difference is handled automatically by the client implementation.

**Available prompts:**
- `anthropic/default.json` - Unbiased market analyst (used by all Anthropic models by default)

## Best Practices

### Prompt Design

1. **Be specific about the role**: "You are an unbiased market analyst" is better than "You are helpful"
2. **Set clear boundaries**: Specify what the LLM should and shouldn't do
3. **Include relevant constraints**: Knowledge cutoffs, tone guidelines, formatting rules
4. **Test across models**: Different models may interpret prompts differently

### Versioning

1. Use the `metadata.version` field to track prompt iterations
2. Include creation date in `metadata.created`
3. Document changes in git commit messages when updating prompts

### Organization

1. Use descriptive filenames: `gpt-4-default.json`, not `prompt1.json`
2. Group related prompts by provider
3. Create model-specific prompts only when necessary (prefer provider defaults)

## Validation

System prompts are validated on load using Pydantic models. Common validation errors:

- **Empty prompt text**: The `prompt` field cannot be empty or whitespace
- **Missing required fields**: `name`, `description`, `provider`, and `prompt` are required
- **Invalid JSON**: Files must be valid JSON (use a linter)
- **File not found**: Check the relative path and ensure the file exists

## Examples

### Minimal Prompt (Package Default)

```json
{
  "name": "openai-default",
  "description": "Default unbiased market analyst prompt",
  "provider": "openai",
  "prompt": "You are an unbiased market analyst. Provide factual, balanced recommendations."
}
```

### Detailed Prompt with Metadata (GPT-4 Specific)

```json
{
  "name": "gpt-4-default",
  "description": "ChatGPT default system prompt for GPT-4 models",
  "provider": "openai",
  "compatible_models": ["gpt-4", "gpt-4-turbo", "gpt-4o"],
  "prompt": "You are ChatGPT, a large language model trained by OpenAI.\nKnowledge cutoff: 2023-10\n\nPersonality: v2\nYou are thoughtful and precise...",
  "metadata": {
    "version": "v2",
    "created": "2025-03-07",
    "author": "openai",
    "knowledge_cutoff": "2023-10"
  }
}
```

### Custom User Prompt

```json
{
  "name": "enterprise-analyst",
  "description": "Enterprise-focused market analysis prompt",
  "provider": "openai",
  "compatible_models": ["gpt-4o", "gpt-4-turbo"],
  "prompt": "You are a senior market analyst specializing in enterprise B2B SaaS.\n\nFocus on:\n- Enterprise-grade solutions\n- Total cost of ownership\n- Compliance and security\n- Scalability considerations",
  "metadata": {
    "version": "1.0",
    "created": "2025-11-03",
    "author": "my-company",
    "use_case": "enterprise-saas-research"
  }
}
```

## Troubleshooting

### "Prompt not found" Error

**Symptom**: `PromptNotFoundError: System prompt not found: openai/my-prompt`

**Solution**:
1. Check the file exists at one of these paths:
   - `~/.config/llm-answer-watcher/system_prompts/openai/my-prompt.json`
   - `llm_answer_watcher/system_prompts/openai/my-prompt.json`
2. Verify the file has `.json` extension (it's added automatically if missing)
3. Check file permissions (must be readable)

### "Invalid JSON" Error

**Symptom**: `ValueError: Invalid JSON in prompt file`

**Solution**:
1. Validate JSON syntax using `jq` or an online validator:
   ```bash
   jq . llm_answer_watcher/system_prompts/openai/my-prompt.json
   ```
2. Common issues: trailing commas, unescaped quotes, missing brackets

### "System prompt cannot be empty" Error

**Symptom**: `ValueError: System prompt text cannot be empty`

**Solution**:
1. Ensure the `prompt` field contains non-whitespace text
2. Check for accidental empty strings: `"prompt": ""`

## API Reference

### `load_prompt(relative_path: str) -> SystemPrompt`

Load a system prompt from a JSON file.

```python
from llm_answer_watcher.system_prompts import load_prompt

prompt = load_prompt("openai/gpt-4-default")
print(prompt.prompt)  # "You are ChatGPT..."
```

### `get_provider_default(provider: str) -> SystemPrompt`

Load the default system prompt for a provider.

```python
from llm_answer_watcher.system_prompts import get_provider_default

prompt = get_provider_default("openai")
print(prompt.prompt)  # "You are an unbiased market analyst..."
```

## Contributing

When contributing new system prompts:

1. Follow the JSON schema exactly
2. Include descriptive `name` and `description` fields
3. Test with actual LLM calls to verify behavior
4. Add to appropriate provider directory
5. Update this README if adding new providers
6. Document any model-specific considerations

For provider-specific implementations (e.g., Anthropic client), ensure:
- System prompt handling matches the provider's API spec
- Error handling is consistent with other providers
- Logging never includes the prompt text (may contain sensitive instructions)
