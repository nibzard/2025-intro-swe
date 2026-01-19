# Quick Start

Get LLM Answer Watcher up and running in 5 minutes.

## Prerequisites

Before you begin, ensure you have:

- **Python 3.12 or 3.13** installed
- **API keys** for at least one LLM provider (OpenAI recommended for getting started)
- **Basic terminal knowledge**

## Installation

### Option 1: Using uv (Recommended)

[uv](https://github.com/astral-sh/uv) is a fast Python package installer and resolver.

```bash
# Clone the repository
git clone https://github.com/nibzard/llm-answer-watcher.git
cd llm-answer-watcher

# Install dependencies
uv sync

# Activate virtual environment (optional, uv handles this automatically)
source .venv/bin/activate
```

### Option 2: Using pip

```bash
# Clone the repository
git clone https://github.com/nibzard/llm-answer-watcher.git
cd llm-answer-watcher

# Create virtual environment
python3.12 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install in development mode
pip install -e .
```

## Set Up API Keys

LLM Answer Watcher uses environment variables for API keys. Set up at least one:

```bash
# OpenAI (recommended for getting started)
export OPENAI_API_KEY=sk-your-openai-key-here

# Optional: Add more providers
export ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
export MISTRAL_API_KEY=mistral-your-key-here
export XAI_API_KEY=xai-your-grok-key-here
export GOOGLE_API_KEY=AIza-your-google-api-key-here
export PERPLEXITY_API_KEY=pplx-your-perplexity-key-here
```

!!! tip "Persistent API Keys"
    Create a `.env` file to persist your keys:
    ```bash
    echo "OPENAI_API_KEY=sk-your-key" > .env
    source .env
    ```

    Add `.env` to your `.gitignore` to avoid accidentally committing secrets!

## Your First Run

LLM Answer Watcher includes example configurations you can use immediately.

### 1. Choose an Example Config

The repository includes organized example configs in the `examples/` directory:

- **Quick Start**: `examples/01-quickstart/minimal.config.yaml` - Simplest possible config (1 provider, 1 intent)
- **Explained**: `examples/01-quickstart/explained.config.yaml` - Same config with detailed comments
- **Multi-Provider**: `examples/02-providers/multi-provider-comparison.config.yaml` - Compare all 6 providers

Start with the minimal example:

### 2. Run the Tool

```bash
llm-answer-watcher run --config examples/01-quickstart/minimal.config.yaml
```

### 3. View the Output

You'll see a beautiful progress display:

```
🔍 Running LLM Answer Watcher...
├── Configuration loaded from examples/watcher.config.yaml
├── Query 1/2: "What are the best email warmup tools?"
├── Query 2/2: "Compare the top email warmup tools"
├── Models: OpenAI gpt-4o-mini
├── Brands: 2 monitored, 4 competitors
└── Output: ./output/2025-11-05T14-30-00Z/

✅ Queries completed: 2/2
💰 Total cost: $0.0042
📊 Report: ./output/2025-11-05T14-30-00Z/report.html
```

### 4. Explore Results

Open the HTML report in your browser:

```bash
open ./output/2025-11-05T14-30-00Z/report.html
# Or on Linux:
xdg-open ./output/2025-11-05T14-30-00Z/report.html
```

The report shows:

- **Summary**: Total costs, queries completed, brands found
- **Brand Mentions**: Which brands appeared in each response
- **Rank Distribution**: Visual charts of ranking positions
- **Raw Responses**: Full LLM outputs for inspection

## Understanding the Output

Each run creates a timestamped directory with:

```
output/2025-11-05T14-30-00Z/
├── run_meta.json                    # Run summary and stats
├── report.html                      # Interactive HTML report
├── intent_*_raw_*.json             # Raw LLM responses
├── intent_*_parsed_*.json          # Extracted brand mentions
└── intent_*_error_*.json           # Error details (if any)
```

All data is also stored in a SQLite database at `./output/watcher.db` for historical analysis.

## What's Next?

Now that you've run your first monitoring job, here are suggested next steps:

### Create Your Own Configuration

Create `my-watcher.config.yaml`:

```yaml
run_settings:
  output_dir: "./output"
  sqlite_db_path: "./output/watcher.db"

  models:
    - provider: "openai"
      model_name: "gpt-4o-mini"
      env_api_key: "OPENAI_API_KEY"

brands:
  mine:
    - "YourBrand"
    - "YourBrand.io"

  competitors:
    - "CompetitorA"
    - "CompetitorB"
    - "IndustryTool"

intents:
  - id: "best-tools-in-category"
    prompt: "What are the best [your category] tools?"

  - id: "comparison-query"
    prompt: "Compare the top [your category] tools"
```

Then run:

```bash
llm-answer-watcher run --config my-watcher.config.yaml
```

### Explore More Features

<div class="grid cards" markdown>

-   :material-cog: **Configuration Deep Dive**

    ---

    Learn about all configuration options

    [Configuration Guide →](../user-guide/configuration/overview.md)

-   :material-chart-bar: **Multiple Providers**

    ---

    Add Anthropic, Mistral, Grok, and more

    [Provider Guide →](../providers/overview.md)

-   :material-database: **Query Your Data**

    ---

    Use SQL to analyze historical trends

    [Data Analytics →](../data-analytics/sqlite-database.md)

-   :material-robot: **Automate Monitoring**

    ---

    Set up scheduled runs with cron or GitHub Actions

    [Automation Guide →](../user-guide/usage/automation.md)

</div>

## Common Issues

### "Command not found: llm-answer-watcher"

Make sure you've activated your virtual environment:

```bash
source .venv/bin/activate  # On macOS/Linux
# or
.venv\Scripts\activate     # On Windows
```

### "Configuration error: API key not found"

Ensure your API keys are exported:

```bash
echo $OPENAI_API_KEY  # Should print your key
```

If empty, export it:

```bash
export OPENAI_API_KEY=sk-your-key-here
```

### "ImportError: No module named 'llm_answer_watcher'"

Re-install the package:

```bash
pip install -e .
```

## Explore More Examples

The `examples/` directory is organized by use case:

- **[01-quickstart/](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/01-quickstart)** - Minimal examples for first-time users
- **[02-providers/](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/02-providers)** - All 6 LLM providers (OpenAI, Anthropic, Google, Mistral, Grok, Perplexity)
- **[03-web-search/](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/03-web-search)** - Real-time web search integration
- **[04-extraction/](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/04-extraction)** - Brand extraction methods (regex, function calling, hybrid)
- **[05-operations/](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/05-operations)** - Automated analysis and insights
- **[06-advanced/](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/06-advanced)** - Budget controls, high concurrency, production configs
- **[07-real-world/](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/07-real-world)** - Complete use case templates

Each directory includes a README with detailed explanations.

## Getting Help

- **Documentation**: Browse this site for comprehensive guides
- **Examples**: Check the `examples/` directory in the repository
- **Issues**: [Report bugs or ask questions](https://github.com/nibzard/llm-answer-watcher/issues)
- **Contributing**: [Read the contributing guide](../contributing/development-setup.md)

---

Ready to dive deeper? Continue to the [Installation Guide](installation.md) for more installation options.
