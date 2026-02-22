# CLI Reference

This page provides a complete reference for the `llm-answer-watcher` command-line interface.

## Global Options

These options apply to most commands:

- `--help`: Show help message and exit.
- `--version`: Show version number and exit.

## Commands

### `run`

Execute queries and generate brand mention reports.

```bash
llm-answer-watcher run --config PATH [OPTIONS]
```

**Options:**

*   `--config, -c PATH` **(Required)**: Path to the YAML configuration file.
*   `--format, -f [text|json]`: Output format. `text` is human-friendly (default), `json` is machine-readable.
*   `--quiet, -q`: Minimal, tab-separated output. Useful for scripts.
*   `--yes, -y`: Skip all confirmation prompts (e.g., for cost approval). Recommended for automation.
*   `--verbose, -v`: Enable debug logging.

**Examples:**

```bash
# Standard run
llm-answer-watcher run --config watcher.config.yaml

# Automation mode (JSON output, no prompts)
llm-answer-watcher run --config watcher.config.yaml --format json --yes
```

---

### `demo`

Run an interactive demo with sample data. No API keys or configuration required.

```bash
llm-answer-watcher demo [OPTIONS]
```

**Options:**

*   `--mode, -m [human|agent|quiet]`: Output mode. Default is `human`.

**Example:**

```bash
llm-answer-watcher demo
```

---

### `validate`

Validate a configuration file without executing queries. Checks syntax, required fields, and API key presence.

```bash
llm-answer-watcher validate --config PATH [OPTIONS]
```

**Options:**

*   `--config, -c PATH` **(Required)**: Path to the YAML configuration file.
*   `--format, -f [text|json]`: Output format.

**Example:**

```bash
llm-answer-watcher validate --config watcher.config.yaml
```

---

### `eval`

Run the evaluation suite to test extraction accuracy against ground-truth fixtures.

```bash
llm-answer-watcher eval --fixtures PATH [OPTIONS]
```

**Options:**

*   `--fixtures, -f PATH` **(Required)**: Path to the YAML file containing test cases.
*   `--format [text|json]`: Output format.
*   `--save-results`: Save evaluation results to the database for historical tracking.
*   `--verbose, -v`: Enable debug logging.

**Example:**

```bash
llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml --save-results
```

---

### `prices`

Manage LLM pricing data.

#### `prices show`
Display current pricing for LLM models (cached + overrides).

```bash
llm-answer-watcher prices show [OPTIONS]
```

**Options:**
*   `--provider, -p TEXT`: Filter by provider (e.g., `openai`, `anthropic`).
*   `--format, -f [text|json]`: Output format.

#### `prices list`
List all supported models with pricing (alias for `prices show`).

```bash
llm-answer-watcher prices list [OPTIONS]
```

#### `prices refresh`
Download latest pricing from [llm-prices.com](https://llm-prices.com) and update local cache.

```bash
llm-answer-watcher prices refresh [OPTIONS]
```

**Options:**
*   `--force, -f`: Force refresh even if cache is fresh (< 24h).
*   `--format [text|json]`: Output format.

---

### `costs`

Analyze historical costs.

#### `costs show`
Show cost breakdown by provider and model.

```bash
llm-answer-watcher costs show [OPTIONS]
```

**Options:**
*   `--period [week|month|quarter|all]`: Time period to analyze. Default is `month`.
*   `--db PATH`: Path to SQLite database. Default: `./output/watcher.db`.
*   `--format, -f [text|json]`: Output format.

---

### `export`

Export data to external formats.

#### `export mentions`
Export individual brand mentions to CSV or JSON.

```bash
llm-answer-watcher export mentions --output PATH [OPTIONS]
```

**Options:**
*   `--output, -o PATH` **(Required)**: Output file path. Extension (`.csv` or `.json`) determines format.
*   `--db PATH`: Path to SQLite database. Default: `./output/watcher.db`.
*   `--run-id TEXT`: Filter by specific run ID.
*   `--days INTEGER`: Include only last N days of data.

#### `export runs`
Export run summaries to CSV or JSON.

```bash
llm-answer-watcher export runs --output PATH [OPTIONS]
```

**Options:**
*   `--output, -o PATH` **(Required)**: Output file path. Extension (`.csv` or `.json`) determines format.
*   `--db PATH`: Path to SQLite database. Default: `./output/watcher.db`.
*   `--days INTEGER`: Include only last N days of data.