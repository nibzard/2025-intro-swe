# CI Integration

Run evaluations in continuous integration.

## GitHub Actions

```yaml
- name: Run Evaluation Suite
  run: |
    uv run llm-answer-watcher eval       --fixtures evals/testcases/fixtures.yaml       --format json

- name: Check Results
  run: |
    if [ $? -ne 0 ]; then
      echo "Evaluations failed"
      exit 1
    fi
```

## Exit Codes

- `0`: All tests passed
- `1`: Tests failed (below thresholds)
- `2`: Configuration error

See [Running Evals](running-evals.md) for usage details.
