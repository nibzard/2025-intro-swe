# Your First Run

This guide walks you through running LLM Answer Watcher for the first time and understanding the results.

## Before You Start

Ensure you have:

- ✅ Installed LLM Answer Watcher ([Installation Guide](installation.md))
- ✅ Set up at least one API key
- ✅ Activated your virtual environment

## Step 1: Verify Installation

Check that everything is working:

```bash
# Verify the CLI is available
llm-answer-watcher --version

# Check help documentation
llm-answer-watcher --help
```

## Step 2: Validate Example Configuration

Before running, validate the configuration file:

```bash
llm-answer-watcher validate --config examples/watcher.config.yaml
```

Expected output:

```
✅ Configuration valid
├── Models: 1 configured (openai gpt-4o-mini)
├── Brands: 2 mine, 4 competitors
├── Intents: 2 queries
└── Estimated cost: $0.004
```

If validation fails, you'll see specific error messages about what needs to be fixed.

## Step 3: Run Your First Monitoring Job

Execute a monitoring run:

```bash
llm-answer-watcher run --config examples/watcher.config.yaml
```

### What Happens During a Run

#### 1. Configuration Loading

```
🔍 Loading configuration from examples/watcher.config.yaml...
├── ✅ YAML syntax valid
├── ✅ Schema validation passed
├── ✅ API keys found
└── ✅ Output directory accessible
```

#### 2. Cost Estimation

```
💰 Estimated cost breakdown:
├── OpenAI gpt-4o-mini: $0.002 × 2 intents = $0.004
└── Total estimated cost: $0.004

Continue with this run? [Y/n]:
```

Press `Y` to continue, or `n` to abort.

!!! tip "Skip confirmation prompts"
    Use `--yes` flag to auto-confirm in automated scripts:
    ```bash
    llm-answer-watcher run --config config.yaml --yes
    ```

#### 3. Query Execution

You'll see progress for each query:

```
📤 Query 1/2: "What are the best email warmup tools?"
├── Provider: OpenAI (gpt-4o-mini)
├── Sending request... ⏳
├── ✅ Response received (1.2s)
├── Tokens: 145 input, 387 output
├── Cost: $0.002
└── Brands detected: 3 found (Lemwarm, Instantly, HubSpot)

📤 Query 2/2: "Compare the top email warmup tools"
├── Provider: OpenAI (gpt-4o-mini)
├── Sending request... ⏳
├── ✅ Response received (1.4s)
├── Tokens: 152 input, 421 output
├── Cost: $0.002
└── Brands detected: 4 found (Lemwarm, Lemlist, Instantly, Apollo.io)
```

#### 4. Results Summary

```
✅ Run completed successfully!

📊 Summary:
├── Run ID: 2025-11-05T14-30-00Z
├── Queries: 2/2 completed (100%)
├── Total cost: $0.004
├── Brands found: 5 unique
├── Your brands mentioned: 2/2 queries
├── Competitor mentions: 4/2 queries
└── Output: ./output/2025-11-05T14-30-00Z/

📁 Artifacts created:
├── report.html - Interactive HTML report
├── run_meta.json - Run summary and metadata
├── *.raw.json - Raw LLM responses
├── *.parsed.json - Extracted brand mentions
└── watcher.db - Historical SQLite database
```

## Step 4: Explore the Results

### HTML Report

Open the interactive report:

```bash
# macOS
open ./output/2025-11-05T14-30-00Z/report.html

# Linux
xdg-open ./output/2025-11-05T14-30-00Z/report.html

# Windows
start ./output/2025-11-05T14-30-00Z/report.html
```

The report contains:

#### Summary Section
- Total cost breakdown
- Queries completed vs failed
- Unique brands detected
- Your brand mention rate

#### Brand Mentions Table
| Intent | Model | Your Brand | Competitors | Rank |
|--------|-------|------------|-------------|------|
| best-email-warmup-tools | gpt-4o-mini | Lemwarm (#1) | Instantly (#2), HubSpot (#3) | 1 |
| email-warmup-comparison | gpt-4o-mini | Lemwarm (#1), Lemlist (#2) | Instantly (#3), Apollo.io (#4) | 1 |

#### Rank Distribution Chart
Visual representation of where your brand appears in ranked lists.

#### Historical Trends
If you've run multiple times, you'll see trend charts showing:
- Brand mention frequency over time
- Average ranking position changes
- Competitor appearance patterns

#### Raw Responses
Expandable sections showing the full LLM response for each query.

### JSON Artifacts

Each run creates structured JSON files:

#### `run_meta.json`
Summary of the entire run:

```json
{
  "run_id": "2025-11-05T14-30-00Z",
  "timestamp_utc": "2025-11-05T14:30:00Z",
  "config_path": "examples/watcher.config.yaml",
  "total_cost_usd": 0.004,
  "queries_completed": 2,
  "queries_failed": 0,
  "brands_detected": {
    "mine": ["Lemwarm", "Lemlist"],
    "competitors": ["Instantly", "HubSpot", "Apollo.io"]
  }
}
```

#### `intent_*_raw_*.json`
Raw LLM response with metadata:

```json
{
  "intent_id": "best-email-warmup-tools",
  "provider": "openai",
  "model_name": "gpt-4o-mini",
  "prompt": "What are the best email warmup tools?",
  "answer_text": "Here are the best email warmup tools:\n\n1. Lemwarm...",
  "tokens_used": 532,
  "cost_usd": 0.002,
  "timestamp_utc": "2025-11-05T14:30:00Z"
}
```

#### `intent_*_parsed_*.json`
Extracted brand mentions and ranks:

```json
{
  "intent_id": "best-email-warmup-tools",
  "provider": "openai",
  "model_name": "gpt-4o-mini",
  "brands_found": {
    "mine": [
      {
        "brand": "Lemwarm",
        "normalized": "lemwarm",
        "rank_position": 1,
        "context": "1. Lemwarm - Best for automated warmup"
      }
    ],
    "competitors": [
      {
        "brand": "Instantly",
        "normalized": "instantly",
        "rank_position": 2,
        "context": "2. Instantly - Great deliverability features"
      }
    ]
  }
}
```

### SQLite Database

All data is stored in `./output/watcher.db` for historical tracking:

```bash
# Open the database
sqlite3 ./output/watcher.db

# View recent runs
SELECT run_id, timestamp_utc, total_cost_usd, queries_completed
FROM runs
ORDER BY timestamp_utc DESC
LIMIT 5;
```

## Step 5: Run with Different Modes

### Agent Mode (Structured JSON Output)

Perfect for automation and AI agents:

```bash
llm-answer-watcher run --config examples/watcher.config.yaml --format json
```

Output:

```json
{
  "run_id": "2025-11-05T14-30-00Z",
  "status": "success",
  "queries_completed": 2,
  "queries_failed": 0,
  "total_cost_usd": 0.004,
  "output_dir": "./output/2025-11-05T14-30-00Z",
  "brands_detected": {
    "mine": ["Lemwarm", "Lemlist"],
    "competitors": ["Instantly", "HubSpot", "Apollo.io"]
  }
}
```

### Quiet Mode (Minimal Output)

For scripts and pipelines:

```bash
llm-answer-watcher run --config examples/watcher.config.yaml --quiet
```

Output (tab-separated):

```
2025-11-05T14-30-00Z	success	2	0.004	./output/2025-11-05T14-30-00Z
```

### Automation Mode (No Prompts)

Skip confirmation prompts:

```bash
llm-answer-watcher run --config examples/watcher.config.yaml --yes --format json
```

## Understanding Exit Codes

LLM Answer Watcher uses exit codes for automation:

```bash
llm-answer-watcher run --config config.yaml
echo $?  # Print exit code
```

| Exit Code | Meaning | When It Happens |
|-----------|---------|-----------------|
| **0** | Success | All queries completed successfully |
| **1** | Configuration Error | Invalid YAML, missing API keys, bad schema |
| **2** | Database Error | Cannot create/access SQLite database |
| **3** | Partial Failure | Some queries failed, but run completed |
| **4** | Complete Failure | No queries succeeded |

Use in scripts:

```bash
#!/bin/bash
llm-answer-watcher run --config config.yaml --yes

case $? in
    0) echo "✅ Success!" ;;
    1) echo "❌ Configuration error" && exit 1 ;;
    2) echo "❌ Database error" && exit 1 ;;
    3) echo "⚠️  Partial failure" ;;
    4) echo "❌ Complete failure" && exit 1 ;;
esac
```

## Common First-Run Issues

### Issue: "API key not found"

**Solution**: Ensure API keys are exported:

```bash
echo $OPENAI_API_KEY  # Should print your key
export OPENAI_API_KEY=sk-your-key-here
```

### Issue: "Permission denied: ./output/"

**Solution**: Create output directory with correct permissions:

```bash
mkdir -p output
chmod 755 output
```

### Issue: "No brands detected"

**Possible causes**:

1. **Brand name mismatch**: LLM used different name (e.g., "HubSpot CRM" vs "HubSpot")
2. **Not mentioned**: Brand wasn't included in LLM response
3. **Word boundary issue**: Brand name contains special characters

**Solution**: Check raw response and add brand aliases:

```yaml
brands:
  mine:
    - "YourBrand"
    - "YourBrand.io"
    - "YourBrand CRM"  # Add variations
```

### Issue: "Rate limit exceeded"

**Solution**: LLM API rate limit hit. Wait and retry, or add retry configuration:

```yaml
run_settings:
  retry_max_attempts: 5
  retry_wait_exponential_multiplier: 2
```

## Next Steps

Now that you've completed your first run:

<div class="grid cards" markdown>

-   :material-cog: **Customize Configuration**

    ---

    Create your own config with your brands and intents

    [Basic Configuration →](basic-configuration.md)

-   :material-chart-line: **Query Your Data**

    ---

    Use SQL to analyze results and track trends

    [Data Analytics →](../data-analytics/sqlite-database.md)

-   :material-google-circles-communities: **Add More Providers**

    ---

    Compare results across OpenAI, Anthropic, Mistral, and more

    [Provider Guide →](../providers/overview.md)

-   :material-calendar-repeat: **Automate Runs**

    ---

    Set up scheduled monitoring with cron or GitHub Actions

    [Automation →](../user-guide/usage/automation.md)

</div>
