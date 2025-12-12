# Code Examples

Python scripts demonstrating programmatic usage of LLM Answer Watcher.

## Files

1. **`basic_client_usage.py`** - Direct API client usage (async/await)
2. **`analyze_results.py`** - Parse and analyze JSON output
3. **`export_to_csv.py`** - Export SQLite data to CSV
4. **`automated_monitoring.py`** - Cron job script for daily monitoring
5. **`slack_alerts.py`** - Send Slack alerts on rank changes
6. **`dashboard_integration.py`** - Query data for custom dashboards

## Quick Start

### Run a Code Example

```bash
# Make scripts executable
chmod +x examples/code-examples/*.py

# Set API key
export OPENAI_API_KEY="sk-..."

# Run basic client example
python examples/code-examples/basic_client_usage.py

# Analyze latest run results
python examples/code-examples/analyze_results.py

# Export to CSV
python examples/code-examples/export_to_csv.py
```

## Use Cases

### 1. Direct API Usage

Use the LLM clients directly in your Python code:

```python
import asyncio
from llm_answer_watcher.llm_runner.models import build_client

async def main():
    client = build_client("openai", "gpt-4o-mini", api_key, system_prompt)
    response = await client.generate_answer("What are the best CRM tools?")
    print(f"Cost: ${response.cost_usd:.4f}")

asyncio.run(main())
```

See: `basic_client_usage.py`

### 2. Automated Monitoring

Schedule daily brand monitoring with cron:

```bash
# Run every day at 9 AM
0 9 * * * /path/to/automated_monitoring.py
```

See: `automated_monitoring.py`

### 3. Data Analysis

Parse results programmatically:

```python
import json

with open("output/latest-run/run_meta.json") as f:
    meta = json.load(f)

print(f"Your brand: {meta['my_brands_count']} mentions")
print(f"Competitors: {meta['competitor_count']} mentions")
```

See: `analyze_results.py`

### 4. Custom Integrations

- Export to CSV for Excel analysis
- Send Slack/email alerts
- Build custom dashboards
- Integrate with BI tools

## Requirements

All scripts require the base package:

```bash
pip install -e .
```

Some scripts have additional dependencies:

```bash
# For Slack alerts
pip install slack-sdk

# For dashboard
pip install matplotlib pandas
```

## Next Steps

- Modify scripts for your specific use case
- Integrate with your existing monitoring stack
- Build custom dashboards and reports
