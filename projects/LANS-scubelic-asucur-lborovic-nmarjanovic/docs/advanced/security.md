# Security

Security best practices for LLM Answer Watcher.

## API Key Management

### ✅ Do This

```bash
# Use environment variables
export OPENAI_API_KEY=sk-your-key

# Use secrets management
OPENAI_API_KEY=$(aws secretsmanager get-secret-value ...)

# Use .env files (add to .gitignore)
echo "OPENAI_API_KEY=sk-..." > .env
echo ".env" >> .gitignore
```

### ❌ Don't Do This

```yaml
# NEVER hardcode API keys in config files
models:
  - provider: "openai"
    api_key: "sk-hardcoded-key"  # DON'T DO THIS!
```

## SQL Injection Prevention

The tool uses parameterized queries:

```python
# ✅ Safe - parameterized
cursor.execute("SELECT * FROM runs WHERE id=?", (run_id,))

# ❌ Never done - string concatenation
cursor.execute(f"SELECT * FROM runs WHERE id='{run_id}'")
```

## XSS Prevention

Jinja2 autoescaping enabled:

```python
# ✅ Safe - autoescaping on
env = Environment(loader=..., autoescape=True)
```

## Best Practices

1. **Never commit secrets**
2. **Rotate API keys** regularly
3. **Use read-only file permissions** for configs
4. **Review logs** before sharing
5. **Keep dependencies updated**

## Reporting Security Issues

Email: [security contact] (replace with actual contact)

See [Contributing](../contributing/development-setup.md).
