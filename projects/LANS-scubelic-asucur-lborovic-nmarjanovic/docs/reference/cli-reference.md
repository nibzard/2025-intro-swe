# CLI Reference

Complete command-line interface reference.

## Commands

### `run`

Execute monitoring run.

```bash
llm-answer-watcher run --config PATH [OPTIONS]
```

**Options**:
- `--config PATH` (required): Configuration file
- `--format [human|json|quiet]`: Output format
- `--yes, -y`: Skip prompts
- `--force`: Override budget limits
- `--verbose, -v`: Verbose logging

### `validate`

Validate configuration.

```bash
llm-answer-watcher validate --config PATH [OPTIONS]
```

### `eval`

Run evaluation suite.

```bash
llm-answer-watcher eval --fixtures PATH [OPTIONS]
```

### `prices show`

Display LLM pricing.

```bash
llm-answer-watcher prices show [OPTIONS]
```

See [CLI Commands](../user-guide/usage/cli-commands.md) for detailed usage.
