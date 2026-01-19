# CI/CD Integration

Integrate brand monitoring into your continuous integration pipeline.

## Quick Start

See the automation examples:

- **[automated_monitoring.py](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/code-examples/automated_monitoring.py)** - Complete Python script for scheduled monitoring
- **[Code Examples README](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/code-examples)** - All automation examples

## GitHub Actions Example

`.github/workflows/monitoring.yml`:

```yaml
name: Brand Monitoring

on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
  workflow_dispatch:      # Allow manual triggers

jobs:
  monitor:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install uv
        run: |
          curl -LsSf https://astral.sh/uv/install.sh | sh
          echo "$HOME/.cargo/bin" >> $GITHUB_PATH

      - name: Install dependencies
        run: |
          uv sync

      - name: Run monitoring
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          uv run llm-answer-watcher run \
            --config examples/07-real-world/saas-brand-monitoring.config.yaml \
            --yes \
            --format json

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: monitoring-results-${{ github.run_id }}
          path: |
            output/
            !output/*.db

      - name: Check for visibility drops
        run: |
          # Custom script to analyze results and alert on issues
          python examples/code-examples/analyze_results.py
```

## Exit Code Handling

The CLI returns specific exit codes that can be used in CI/CD:

| Exit Code | Meaning | Action |
|-----------|---------|--------|
| `0` | Success | All queries completed successfully |
| `1` | Configuration error | Fix config file or API keys |
| `2` | Database error | Check database path/permissions |
| `3` | Partial failure | Some queries failed, investigate |
| `4` | Complete failure | All queries failed, critical issue |

### Example with Exit Code Handling

```yaml
- name: Run monitoring
  id: monitor
  run: |
    uv run llm-answer-watcher run --config config.yaml --yes --format json
    echo "exit_code=$?" >> $GITHUB_OUTPUT
  continue-on-error: true

- name: Check result
  run: |
    if [ "${{ steps.monitor.outputs.exit_code }}" == "0" ]; then
      echo "✅ Monitoring completed successfully"
    elif [ "${{ steps.monitor.outputs.exit_code }}" == "3" ]; then
      echo "⚠️ Partial failure - some queries failed"
      exit 0  # Don't fail the workflow
    else
      echo "❌ Monitoring failed with exit code ${{ steps.monitor.outputs.exit_code }}"
      exit 1
    fi
```

## Python Automation Script

Complete automation example with notifications:

```python
#!/usr/bin/env python3
"""
Automated brand monitoring with Slack notifications.

See: examples/code-examples/automated_monitoring.py for full implementation
"""

import subprocess
import json
import sqlite3
from datetime import datetime

def run_monitoring():
    """Run LLM Answer Watcher."""
    result = subprocess.run([
        "llm-answer-watcher", "run",
        "--config", "examples/07-real-world/saas-brand-monitoring.config.yaml",
        "--yes",
        "--format", "json"
    ], capture_output=True, text=True)

    return result.returncode, json.loads(result.stdout)

def check_visibility_drop(db_path, threshold=0.5):
    """Check if brand visibility has dropped."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get recent visibility rate
    cursor.execute("""
        SELECT
            COUNT(DISTINCT CASE WHEN is_mine = 1 THEN intent_id END) * 1.0 /
            COUNT(DISTINCT intent_id) as visibility_rate
        FROM mentions
        WHERE run_id IN (
            SELECT run_id FROM runs ORDER BY timestamp_utc DESC LIMIT 1
        )
    """)

    current_rate = cursor.fetchone()[0] or 0
    conn.close()

    return current_rate < threshold

def send_slack_alert(message):
    """Send alert to Slack (implement based on your setup)."""
    # See examples/code-examples/ for Slack integration
    pass

def main():
    exit_code, results = run_monitoring()

    if exit_code == 0:
        print(f"✅ Monitoring completed: {results['run_id']}")

        # Check for visibility drops
        if check_visibility_drop(results['sqlite_db_path']):
            send_slack_alert("⚠️ Brand visibility has dropped below 50%")
    else:
        print(f"❌ Monitoring failed with exit code {exit_code}")
        send_slack_alert(f"Monitoring failed: {exit_code}")

if __name__ == "__main__":
    main()
```

**Full implementation**: [`examples/code-examples/automated_monitoring.py`](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/code-examples/automated_monitoring.py)

## Cron Job Setup

### Daily Monitoring

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 9 AM)
0 9 * * * cd /path/to/llm-answer-watcher && .venv/bin/python examples/code-examples/automated_monitoring.py >> logs/cron.log 2>&1
```

### Weekly Report

```bash
# Weekly comprehensive analysis (Mondays at 9 AM)
0 9 * * 1 cd /path/to/llm-answer-watcher && .venv/bin/llm-answer-watcher run --config examples/02-providers/multi-provider-comparison.config.yaml --yes --quiet
```

## Docker Integration

### Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy project
COPY . .

# Install dependencies
RUN uv sync

# Set entrypoint
ENTRYPOINT ["uv", "run", "llm-answer-watcher"]
CMD ["--help"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  monitoring:
    build: .
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./output:/app/output
    command: >
      run
      --config examples/07-real-world/saas-brand-monitoring.config.yaml
      --yes
      --format json
```

Run with:

```bash
docker-compose run monitoring
```

## Monitoring Multiple Brands

### Matrix Strategy in GitHub Actions

```yaml
jobs:
  monitor:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        brand:
          - brand-a
          - brand-b
          - brand-c

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run monitoring for ${{ matrix.brand }}
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          llm-answer-watcher run \
            --config configs/${{ matrix.brand }}.config.yaml \
            --yes
```

## Data Export and Analysis

### Export Results to CSV

See [`examples/code-examples/export_to_csv.py`](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/code-examples/export_to_csv.py):

```python
#!/usr/bin/env python3
"""Export monitoring results to CSV for analysis."""

import sqlite3
import csv

def export_mentions_to_csv(db_path, output_path):
    """Export mentions table to CSV."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            run_id,
            intent_id,
            model_provider,
            brand,
            rank_position,
            is_mine,
            timestamp_utc
        FROM mentions
        ORDER BY timestamp_utc DESC
    """)

    with open(output_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['run_id', 'intent_id', 'provider', 'brand', 'rank', 'is_mine', 'timestamp'])
        writer.writerows(cursor.fetchall())

    conn.close()

if __name__ == "__main__":
    export_mentions_to_csv("output/watcher.db", "output/mentions.csv")
```

### Analyze Results

See [`examples/code-examples/analyze_results.py`](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/code-examples/analyze_results.py):

```python
#!/usr/bin/env python3
"""Analyze monitoring results and generate insights."""

import json
import sqlite3

def analyze_latest_run(db_path):
    """Analyze the most recent monitoring run."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get latest run
    cursor.execute("SELECT run_id FROM runs ORDER BY timestamp_utc DESC LIMIT 1")
    run_id = cursor.fetchone()[0]

    # Calculate metrics
    cursor.execute("""
        SELECT
            COUNT(DISTINCT CASE WHEN is_mine = 1 THEN intent_id END) as my_coverage,
            COUNT(DISTINCT intent_id) as total_intents,
            AVG(CASE WHEN is_mine = 1 THEN rank_position END) as my_avg_rank
        FROM mentions
        WHERE run_id = ?
    """, (run_id,))

    my_coverage, total_intents, my_avg_rank = cursor.fetchone()

    conn.close()

    print(f"📊 Analysis for {run_id}")
    print(f"  Coverage: {my_coverage}/{total_intents} intents ({my_coverage/total_intents*100:.1f}%)")
    print(f"  Average rank: {my_avg_rank:.2f}")

if __name__ == "__main__":
    analyze_latest_run("output/watcher.db")
```

## Alerting and Notifications

### Slack Webhook Integration

```python
import requests

def send_slack_notification(webhook_url, message):
    """Send notification to Slack."""
    payload = {
        "text": message,
        "blocks": [
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": message}
            }
        ]
    }
    requests.post(webhook_url, json=payload)

# Usage
if brand_visibility_dropped:
    send_slack_notification(
        os.getenv("SLACK_WEBHOOK_URL"),
        "⚠️ Brand visibility dropped to 30% (threshold: 50%)"
    )
```

### Email Alerts

```python
import smtplib
from email.message import EmailMessage

def send_email_alert(subject, body):
    """Send email alert."""
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = 'monitoring@yourdomain.com'
    msg['To'] = 'team@yourdomain.com'
    msg.set_content(body)

    with smtplib.SMTP('smtp.gmail.com', 587) as smtp:
        smtp.starttls()
        smtp.login(os.getenv('EMAIL_USER'), os.getenv('EMAIL_PASS'))
        smtp.send_message(msg)
```

## Best Practices

### 1. Store Secrets Securely

Use environment variables or secret managers:

```yaml
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  # Never hardcode API keys!
```

### 2. Rate Limiting

Avoid hitting API rate limits:

```yaml
run_settings:
  max_concurrent_requests: 2
  delay_between_queries: 1
```

### 3. Cost Controls

Enable budget limits in CI/CD:

```yaml
budget:
  enabled: true
  max_per_run_usd: 0.50  # Prevent runaway costs
```

### 4. Artifact Retention

Upload results but manage storage:

```yaml
- name: Upload results
  uses: actions/upload-artifact@v4
  with:
    name: results
    path: output/
    retention-days: 30  # Auto-delete after 30 days
```

## Next Steps

<div class="grid cards" markdown>

-   :material-code-braces: **Code Examples**

    ---

    Explore all automation scripts

    [Code Examples →](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/code-examples)

-   :material-robot: **Automation Guide**

    ---

    Complete automation documentation

    [Automation Guide →](../user-guide/usage/automation.md)

-   :material-database: **Database Queries**

    ---

    SQL examples for analysis

    [Query Examples →](../data-analytics/query-examples.md)

-   :material-chart-line: **Trends Analysis**

    ---

    Track changes over time

    [Trends Guide →](../data-analytics/trends-analysis.md)

</div>

## Additional Resources

- **[Code Examples](https://github.com/nibzard/llm-answer-watcher/tree/main/examples/code-examples)** - Python automation scripts
- **[Automation Guide](../user-guide/usage/automation.md)** - Complete automation documentation
- **[CLI Reference](../reference/cli-reference.md)** - All CLI options and exit codes
- **[Python API](../reference/python-api.md)** - Programmatic usage guide
