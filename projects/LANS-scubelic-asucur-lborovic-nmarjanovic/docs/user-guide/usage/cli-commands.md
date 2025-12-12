# CLI Commands

Complete reference for all LLM Answer Watcher CLI commands.

## Command Structure

```bash
llm-answer-watcher [COMMAND] [OPTIONS]
```

## Global Options

Available for all commands:

| Option | Description |
|--------|-------------|
| `--help` | Show help message |
| `--version` | Show version information |

## Commands

### `run`

Execute a monitoring run with configured models and intents.

**Usage**:

```bash
llm-answer-watcher run --config CONFIG_PATH [OPTIONS]
```

**Required Arguments**:

- `--config PATH` - Path to YAML configuration file

**Options**:

| Option | Default | Description |
|--------|---------|-------------|
| `--format [human\|json\|quiet]` | `human` | Output format |
| `--yes, -y` | `false` | Skip confirmation prompts |
| `--force` | `false` | Override budget limits |
| `--verbose, -v` | `false` | Enable verbose logging |

**Examples**:

```bash
# Human-friendly output (default)
llm-answer-watcher run --config config.yaml

# JSON output for automation
llm-answer-watcher run --config config.yaml --format json

# Quiet mode for scripts
llm-answer-watcher run --config config.yaml --quiet

# Auto-confirm (no prompts)
llm-answer-watcher run --config config.yaml --yes

# Override budget limits
llm-answer-watcher run --config config.yaml --force

# Verbose logging
llm-answer-watcher run --config config.yaml --verbose
```

**Exit Codes**:

- `0`: Success
- `1`: Configuration error
- `2`: Database error
- `3`: Partial failure
- `4`: Complete failure

### `validate`

Validate configuration file without running queries.

**Usage**:

```bash
llm-answer-watcher validate --config CONFIG_PATH [OPTIONS]
```

**Required Arguments**:

- `--config PATH` - Path to YAML configuration file

**Options**:

| Option | Default | Description |
|--------|---------|-------------|
| `--verbose, -v` | `false` | Show detailed validation |

**Examples**:

```bash
# Basic validation
llm-answer-watcher validate --config config.yaml

# Detailed validation
llm-answer-watcher validate --config config.yaml --verbose
```

**Output**:

```
✅ Configuration valid
├── Models: 2 configured (openai gpt-4o-mini, anthropic claude-3-5-haiku)
├── Brands: 3 mine, 8 competitors
├── Intents: 4 queries
└── Estimated cost: $0.024 (8 queries total)
```

### `eval`

Run evaluation framework to test extraction accuracy.

**Usage**:

```bash
llm-answer-watcher eval --fixtures FIXTURES_PATH [OPTIONS]
```

**Required Arguments**:

- `--fixtures PATH` - Path to test fixtures YAML file

**Options**:

| Option | Default | Description |
|--------|---------|-------------|
| `--db PATH` | `./eval_results.db` | Evaluation database path |
| `--format [human\|json]` | `human` | Output format |

**Examples**:

```bash
# Run evaluation suite
llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml

# Custom database
llm-answer-watcher eval --fixtures fixtures.yaml --db my_evals.db

# JSON output for CI/CD
llm-answer-watcher eval --fixtures fixtures.yaml --format json
```

**Exit Codes**:

- `0`: All tests passed
- `1`: Tests failed (below thresholds)
- `2`: Configuration error

### `prices show`

Display current LLM pricing information.

**Usage**:

```bash
llm-answer-watcher prices show [OPTIONS]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--provider NAME` | Filter by provider |
| `--format [human\|json]` | Output format |

**Examples**:

```bash
# Show all pricing
llm-answer-watcher prices show

# OpenAI pricing only
llm-answer-watcher prices show --provider openai

# JSON format
llm-answer-watcher prices show --format json
```

### `prices refresh`

Refresh pricing cache from llm-prices.com.

**Usage**:

```bash
llm-answer-watcher prices refresh [OPTIONS]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--force` | Force refresh (ignore cache) |

**Examples**:

```bash
# Refresh if cache expired
llm-answer-watcher prices refresh

# Force refresh
llm-answer-watcher prices refresh --force
```

### `prices list`

List all available models with pricing.

**Usage**:

```bash
llm-answer-watcher prices list [OPTIONS]
```

**Options**:

| Option | Description |
|--------|-------------|
| `--provider NAME` | Filter by provider |
| `--format [human\|json]` | Output format |

**Examples**:

```bash
# List all models
llm-answer-watcher prices list

# Anthropic models only
llm-answer-watcher prices list --provider anthropic

# Export as JSON
llm-answer-watcher prices list --format json > models.json
```

## Output Modes

### Human Mode (Default)

Beautiful Rich-formatted output with colors, spinners, and tables.

```bash
llm-answer-watcher run --config config.yaml
```

**Features**:
- Progress spinners
- Colored status indicators
- Formatted tables
- Visual charts

**Best for**: Interactive terminal use

### JSON Mode

Structured JSON output for programmatic consumption.

```bash
llm-answer-watcher run --config config.yaml --format json
```

**Features**:
- Valid JSON output
- No ANSI codes
- Machine-readable
- Complete metadata

**Best for**: AI agents, scripts, APIs

### Quiet Mode

Minimal tab-separated output.

```bash
llm-answer-watcher run --config config.yaml --quiet
```

**Output format**:
```
RUN_ID	STATUS	QUERIES	COST	OUTPUT_DIR
```

**Best for**: Shell scripts, pipelines

## Common Workflows

### Development

```bash
# Validate config
llm-answer-watcher validate --config dev.yaml

# Run with verbose logging
llm-answer-watcher run --config dev.yaml --verbose
```

### Production

```bash
# Auto-confirm, JSON output
llm-answer-watcher run --config prod.yaml --yes --format json
```

### CI/CD

```bash
# Quiet mode with exit code checking
llm-answer-watcher run --config ci.yaml --quiet --yes
if [ $? -eq 0 ]; then
    echo "Success"
else
    echo "Failed" && exit 1
fi
```

## Next Steps

- [Learn about output modes](output-modes.md)
- [Understand exit codes](exit-codes.md)
- [Automate runs](automation.md)
