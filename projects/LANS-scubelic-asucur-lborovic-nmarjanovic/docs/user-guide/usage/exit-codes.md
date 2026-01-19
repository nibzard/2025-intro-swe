# Exit Codes

LLM Answer Watcher uses standardized exit codes for automation and error handling.

## Exit Code Reference

| Code | Status | Meaning | When It Occurs |
|------|--------|---------|----------------|
| **0** | Success | All queries completed successfully | No errors encountered |
| **1** | Configuration Error | Invalid configuration | YAML syntax errors, missing API keys, invalid schema |
| **2** | Database Error | Cannot access database | SQLite file locked, permissions issue, disk full |
| **3** | Partial Failure | Some queries failed | LLM API errors, rate limits, timeouts |
| **4** | Complete Failure | No queries succeeded | All queries failed, fatal errors |

## Exit Code 0: Success

All queries completed without errors.

**When**:
- All LLM API calls succeeded
- All brands extracted successfully
- All data written to database
- Reports generated

**Example**:

```bash
llm-answer-watcher run --config config.yaml
echo $?  # Prints: 0
```

## Exit Code 1: Configuration Error

Configuration file has issues.

**When**:
- YAML syntax errors
- Missing required fields
- Invalid provider names
- API keys not found in environment
- Invalid model names
- Budget misconfiguration

**Examples**:

```yaml
# Missing required field
run_settings:
  # output_dir missing!
  models:
    - provider: "openai"
```

```yaml
# Invalid provider
models:
  - provider: "invalid_provider"  # Not supported
```

**Handling**:

```bash
llm-answer-watcher run --config config.yaml
if [ $? -eq 1 ]; then
    echo "Configuration error - check your YAML file"
    exit 1
fi
```

## Exit Code 2: Database Error

Cannot create or access SQLite database.

**When**:
- Database file locked by another process
- Insufficient disk space
- Permission denied on output directory
- Corrupted database file

**Handling**:

```bash
llm-answer-watcher run --config config.yaml
case $? in
    2)
        echo "Database error - check permissions and disk space"
        # Try to fix permissions
        chmod 755 output/
        # Retry
        llm-answer-watcher run --config config.yaml
        ;;
esac
```

## Exit Code 3: Partial Failure

Some queries succeeded, others failed.

**When**:
- Rate limits hit mid-run
- Network timeouts
- Invalid API responses
- Model-specific errors

**Example Scenario**:

```
3 intents × 2 models = 6 total queries
✅ 4 succeeded
❌ 2 failed (rate limit)
Exit code: 3 (partial failure)
```

**Handling**:

```bash
llm-answer-watcher run --config config.yaml --format json > result.json
if [ $? -eq 3 ]; then
    echo "⚠️ Partial failure - some queries failed"
    # Check which queries failed
    jq '.per_intent_results[] | select(.status=="failed")' result.json
    # Continue with successful results
fi
```

**Best Practice**: Accept partial failures in production. The succeeded queries still provide value.

## Exit Code 4: Complete Failure

All queries failed.

**When**:
- All API keys invalid
- Network completely down
- All models unreachable
- Severe runtime errors

**Handling**:

```bash
llm-answer-watcher run --config config.yaml
if [ $? -eq 4 ]; then
    echo "❌ Complete failure - no queries succeeded"
    # Alert on-call engineer
    # Don't continue pipeline
    exit 1
fi
```

## Practical Examples

### Basic Error Handling

```bash
#!/bin/bash
llm-answer-watcher run --config config.yaml --yes

case $? in
    0)
        echo "✅ Success - all queries completed"
        ;;
    1)
        echo "❌ Configuration error - fix YAML file"
        exit 1
        ;;
    2)
        echo "❌ Database error - check permissions"
        exit 1
        ;;
    3)
        echo "⚠️ Partial failure - continuing"
        # Partial success is OK
        ;;
    4)
        echo "❌ Complete failure - aborting"
        exit 1
        ;;
esac
```

### Retry Logic

```bash
#!/bin/bash
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    llm-answer-watcher run --config config.yaml --yes
    EXIT_CODE=$?

    case $EXIT_CODE in
        0|3)
            # Success or partial success
            exit 0
            ;;
        1|2)
            # Config or DB error - don't retry
            exit $EXIT_CODE
            ;;
        4)
            # Complete failure - retry
            RETRY_COUNT=$((RETRY_COUNT + 1))
            echo "Retry $RETRY_COUNT/$MAX_RETRIES after complete failure"
            sleep $((2 ** RETRY_COUNT))  # Exponential backoff
            ;;
    esac
done

echo "Max retries exceeded"
exit 4
```

### CI/CD Integration

```yaml
# .github/workflows/monitoring.yml
- name: Run Monitoring
  id: monitor
  run: |
    llm-answer-watcher run --config config.yaml --format json --yes
    echo "exit_code=$?" >> $GITHUB_OUTPUT
  continue-on-error: true

- name: Handle Result
  run: |
    case ${{ steps.monitor.outputs.exit_code }} in
      0)
        echo "✅ Success"
        ;;
      1)
        echo "❌ Configuration error"
        exit 1
        ;;
      2)
        echo "❌ Database error"
        exit 1
        ;;
      3)
        echo "⚠️ Partial failure (acceptable)"
        ;;
      4)
        echo "❌ Complete failure"
        exit 1
        ;;
    esac
```

### Alerting Based on Exit Codes

```bash
#!/bin/bash
llm-answer-watcher run --config config.yaml --yes
EXIT_CODE=$?

if [ $EXIT_CODE -eq 4 ]; then
    # Send alert for complete failure
    curl -X POST https://alerts.example.com/webhook \
        -d '{"alert": "LLM monitoring complete failure", "severity": "critical"}'
elif [ $EXIT_CODE -eq 3 ]; then
    # Log partial failure (no alert)
    echo "$(date): Partial failure" >> /var/log/monitoring.log
fi
```

## Testing Exit Codes

### Simulate Errors

Test your error handling:

```bash
# Force configuration error
llm-answer-watcher run --config nonexistent.yaml
echo $?  # Should be 1

# Invalid API key
export OPENAI_API_KEY=invalid
llm-answer-watcher run --config config.yaml
echo $?  # Should be 1 or 4
```

### Validation Testing

```bash
# This should exit 0 (validation success)
llm-answer-watcher validate --config config.yaml
echo $?
```

## Best Practices

### 1. Always Check Exit Codes

```bash
# ❌ Bad - ignores errors
llm-answer-watcher run --config config.yaml

# ✅ Good - checks exit code
llm-answer-watcher run --config config.yaml
if [ $? -ne 0 ]; then
    handle_error
fi
```

### 2. Differentiate Error Types

Don't treat all non-zero exits the same:

```bash
# ✅ Good - handles each error type
case $? in
    1|2) exit 1 ;;      # Fatal - abort
    3) continue ;;      # Partial - OK
    4) retry ;;         # Complete - retry
esac
```

### 3. Log Exit Codes

```bash
EXIT_CODE=$?
echo "$(date): Exit code $EXIT_CODE" >> monitoring.log
```

### 4. Accept Partial Failures

In production, partial success is often acceptable:

```bash
if [ $EXIT_CODE -eq 0 ] || [ $EXIT_CODE -eq 3 ]; then
    echo "Run completed with usable results"
    continue_pipeline
fi
```

## Next Steps

- [Learn about output modes](output-modes.md)
- [Automate monitoring runs](automation.md)
- [See CI/CD examples](../../examples/ci-cd-integration.md)
