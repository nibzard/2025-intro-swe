# New Model Compatibility Guide

## Overview

LLM Answer Watcher is designed to be compatible with new OpenAI models as they're released. However, newer models may have different parameter requirements than existing ones.

> **📅 Updated November 2025**: GPT-5 models (`gpt-5-mini`, `gpt-5-nano`) are now available and have different parameter requirements than GPT-4 models.

## The Temperature Parameter Issue

### Problem
**Current OpenAI GPT-5 models** (`gpt-5-mini`, `gpt-5-nano`) don't support custom temperature values and only work with the model's default temperature (1.0). This is a real limitation as of November 2025.

### Solution
The OpenAI client has been updated with dynamic parameter handling:

```python
# Models that require fixed temperature (don't support custom temperature)
TEMPERATURE_FIXED_MODELS = {
    "gpt-5-mini",
    "gpt-5-nano",
    # Add other models as they're released
}
```

### How It Works
1. **Check Model Support**: The client checks if the model is in `TEMPERATURE_FIXED_MODELS`
2. **Conditional Parameters**: Temperature is only added if the model supports it
3. **Graceful Fallback**: Uses model default temperature for restricted models

## Adding Support for New Models

### Step 1: Identify Model Requirements
When a new OpenAI model is released (beyond GPT-5-mini/nano), check:
- Does it support custom temperature values?
- Are there other parameter restrictions?
- Is it available via the standard OpenAI API?

### Step 2: Update Model Configuration
If the model has parameter restrictions (like GPT-5 models), add it to the appropriate configuration:

```python
# For models that don't support custom temperature
TEMPERATURE_FIXED_MODELS.add("new-model-name")

# For models with other parameter restrictions
MODEL_PARAMS = {
    "default": {
        "temperature": 0.7,
    },
    "temperature_fixed": {
        # No temperature parameter
    },
    "custom_category": {
        # Add model-specific parameters
    },
}
```

### Step 3: Test the Model
Create a test configuration:

```yaml
# test-new-model.yaml
models:
  - provider: "openai"
    model_name: "new-model-name"
    env_api_key: "OPENAI_API_KEY"

brands:
  mine:
    - "YourBrand"

intents:
  - id: "test-intent"
    prompt: "Test prompt for new model"
```

Run: `llm-answer-watcher run --config test-new-model.yaml --yes`

### Step 4: Update Documentation
Add the new model to:
- Configuration examples
- Documentation
- Default model lists (if appropriate)

## Current Model Support (November 2025)

### Fully Supported (Custom Temperature)
- `gpt-4o-mini` - Supports custom temperature (0.0-2.0)
- `gpt-4o` - Supports custom temperature (0.0-2.0)
- `gpt-4-turbo` - Supports custom temperature (0.0-2.0)
- `gpt-3.5-turbo` - Supports custom temperature (0.0-2.0)
- Most GPT-4 and earlier models

### Fixed Temperature Models (GPT-5 Series)
**These models are LIVE as of November 2025:**
- `gpt-5-mini` - Requires temperature=1.0 (default) - **Cannot customize**
- `gpt-5-nano` - Requires temperature=1.0 (default) - **Cannot customize**

The OpenAI client automatically detects these models and excludes the temperature parameter.

### Testing New Models
Always test new models with a simple configuration before adding them to production configs. Future GPT-5 models may have similar restrictions.

## Error Handling

### Common Errors and Solutions

#### 1. Temperature Parameter Error
```
Unsupported value: 'temperature' does not support 0.7 with this model. Only the default (1) value is supported.
```
**Solution**: Add model to `TEMPERATURE_FIXED_MODELS`

#### 2. Model Not Found
```
Model not found: gpt-new-model
```
**Solution**: Model may not be available yet or requires special access

#### 3. API Timeouts
```
The read operation timed out
```
**Solution**: Model may be in preview, slow, or unavailable

## Best Practices

1. **Test First**: Always test new models with simple configs
2. **Monitor Costs**: New models may have different pricing
3. **Check Performance**: Response times can vary significantly
4. **Review Documentation**: Check OpenAI's API docs for model-specific requirements
5. **Gradual Rollout**: Test in development before production use

## Future Enhancements

Potential improvements for model compatibility:

1. **Dynamic Model Detection**: Automatically detect model capabilities
2. **API Response Parsing**: Parse API responses to determine supported parameters
3. **Configuration Validation**: Validate model availability before runs
4. **Model-Specific Cost Calculation**: Different pricing for different models
5. **Fallback Mechanisms**: Gracefully fallback to compatible models

## Troubleshooting

If a new model doesn't work:

1. Check the error logs for specific parameter issues
2. Verify the model name spelling and availability
3. Test with a minimal configuration
4. Check OpenAI's status page for model availability
5. Ensure your API key has access to the new model

## Contributing

When adding support for new models:

1. Update the `TEMPERATURE_FIXED_MODELS` set if needed
2. Add any model-specific parameters to `MODEL_PARAMS`
3. Update test cases
4. Document any special requirements
5. Test with the complete configuration