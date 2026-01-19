# Output Modes

LLM Answer Watcher supports three output modes to serve different use cases: humans, AI agents, and shell scripts.

## Human Mode (Default)

Beautiful Rich-formatted output designed for interactive terminal use.

### Usage

```bash
llm-answer-watcher run --config config.yaml
# or explicitly:
llm-answer-watcher run --config config.yaml --format human
```

### Features

- **Progress Spinners**: Real-time progress indication
- **Colors**: Status indicators (✅ green success, ❌ red errors)
- **Tables**: Formatted data presentation
- **Panels**: Organized information display
- **Live Updates**: Dynamic progress tracking

### Example Output

```
🔍 Running LLM Answer Watcher...
├── Configuration loaded from config.yaml
├── Models: 2 configured
├── Intents: 3 queries
└── Estimated cost: $0.012

📤 Query 1/3: "What are the best email warmup tools?"
├── Provider: OpenAI (gpt-4o-mini)
├── Sending request... ⏳
├── ✅ Response received (1.2s)
├── Tokens: 145 input, 387 output
├── Cost: $0.004
└── Brands detected: 3 found

✅ Run completed successfully!

📊 Summary:
├── Run ID: 2025-11-05T14-30-00Z
├── Queries: 3/3 completed (100%)
├── Total cost: $0.012
└── Output: ./output/2025-11-05T14-30-00Z/
```

## JSON Mode

Structured JSON output for programmatic consumption and AI agent automation.

### Usage

```bash
llm-answer-watcher run --config config.yaml --format json
```

### Features

- **Valid JSON**: Parseable by any JSON library
- **No ANSI Codes**: Clean output for parsing
- **Complete Metadata**: All run information included
- **Deterministic**: Same format every time

### Output Structure

```json
{
  "run_id": "2025-11-05T14-30-00Z",
  "status": "success",
  "timestamp_utc": "2025-11-05T14:30:00Z",
  "queries_completed": 3,
  "queries_failed": 0,
  "total_cost_usd": 0.012,
  "output_dir": "./output/2025-11-05T14-30-00Z",
  "brands_detected": {
    "mine": ["Lemwarm", "Lemlist"],
    "competitors": ["Instantly", "HubSpot", "Apollo.io"]
  },
  "per_intent_results": [
    {
      "intent_id": "best-email-warmup-tools",
      "status": "success",
      "cost_usd": 0.004,
      "brands_found": ["Lemwarm", "Instantly", "HubSpot"]
    }
  ]
}
```

### Use Cases

#### AI Agent Automation

```python
import subprocess
import json

result = subprocess.run([
    "llm-answer-watcher", "run",
    "--config", "config.yaml",
    "--format", "json",
    "--yes"
], capture_output=True, text=True)

data = json.loads(result.stdout)

if data["status"] == "success":
    print(f"Found {len(data['brands_detected']['mine'])} of our brands")
```

#### CI/CD Integration

```yaml
# .github/workflows/brand-monitoring.yml
- name: Run Brand Monitoring
  id: monitor
  run: |
    OUTPUT=$(llm-answer-watcher run --config config.yaml --format json --yes)
    echo "result=$OUTPUT" >> $GITHUB_OUTPUT

- name: Check Results
  run: |
    STATUS=$(echo '${{ steps.monitor.outputs.result }}' | jq -r '.status')
    if [ "$STATUS" != "success" ]; then
      exit 1
    fi
```

## Quiet Mode

Minimal tab-separated output for shell scripts and pipelines.

### Usage

```bash
llm-answer-watcher run --config config.yaml --quiet
```

### Output Format

```
RUN_ID	STATUS	QUERIES_COMPLETED	COST_USD	OUTPUT_DIR
```

### Example Output

```
2025-11-05T14-30-00Z	success	3	0.012	./output/2025-11-05T14-30-00Z
```

### Use Cases

#### Shell Scripts

```bash
#!/bin/bash
OUTPUT=$(llm-answer-watcher run --config config.yaml --quiet --yes)

RUN_ID=$(echo "$OUTPUT" | cut -f1)
STATUS=$(echo "$OUTPUT" | cut -f2)
COST=$(echo "$OUTPUT" | cut -f4)

echo "Run $RUN_ID completed with status $STATUS (cost: \$$ $COST)"
```

#### CSV Export

```bash
# Append to CSV file
echo "timestamp,run_id,status,queries,cost" > monitoring_log.csv
llm-answer-watcher run --config config.yaml --quiet --yes >> monitoring_log.csv
```

#### Pipeline Processing

```bash
# Process multiple configs
for config in configs/*.yaml; do
    llm-answer-watcher run --config "$config" --quiet --yes | \
        awk '{print $1 "\t" $2 "\t" $4}'
done
```

## Comparing Output Modes

| Feature | Human | JSON | Quiet |
|---------|-------|------|-------|
| **Colors/Emojis** | ✅ Yes | ❌ No | ❌ No |
| **Progress Indicators** | ✅ Yes | ❌ No | ❌ No |
| **Machine Parseable** | ❌ No | ✅ Yes | ✅ Yes |
| **Size** | Large | Medium | Minimal |
| **Use Case** | Interactive | Automation | Scripts |
| **ANSI Codes** | ✅ Yes | ❌ No | ❌ No |

## Verbose Logging

Enable verbose logging in any mode:

```bash
llm-answer-watcher run --config config.yaml --verbose
```

Adds detailed logging information:

```
[2025-11-05 14:30:00] INFO: Loading configuration from config.yaml
[2025-11-05 14:30:00] DEBUG: Validating YAML schema
[2025-11-05 14:30:00] DEBUG: Resolving environment variables
[2025-11-05 14:30:00] INFO: API key loaded for provider: openai
[2025-11-05 14:30:01] DEBUG: Sending request to OpenAI API
[2025-11-05 14:30:02] DEBUG: Response received: 200 OK
```

## Mode Selection Guide

### Choose Human Mode When:

- Running manually in terminal
- Debugging configuration issues
- Watching progress in real-time
- Presenting to stakeholders

### Choose JSON Mode When:

- Integrating with AI agents
- Building dashboards/UIs
- Processing results programmatically
- CI/CD automation

### Choose Quiet Mode When:

- Shell script automation
- Logging to files
- CSV/TSV export
- Minimal bandwidth/storage

## Next Steps

- [Learn about exit codes](exit-codes.md)
- [Automate monitoring runs](automation.md)
- [See CI/CD examples](../../examples/ci-cd-integration.md)
