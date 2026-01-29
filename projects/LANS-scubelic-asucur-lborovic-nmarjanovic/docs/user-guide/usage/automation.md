# Automation

Automate LLM Answer Watcher runs with cron, GitHub Actions, or custom schedulers.

## Quick Start

```bash
# Run with no prompts
llm-answer-watcher run --config config.yaml --yes --format json
```

## Cron Jobs

### Basic Cron Setup

Edit crontab:

```bash
crontab -e
```

Add scheduled job:

```cron
# Run daily at 9 AM
0 9 * * * /path/to/.venv/bin/llm-answer-watcher run --config /path/to/config.yaml --yes --quiet >> /var/log/monitoring.log 2>&1

# Run weekly on Monday
0 9 * * 1 /path/to/.venv/bin/llm-answer-watcher run --config /path/to/config.yaml --yes --format json > /path/to/results/$(date +\%Y-\%m-\%d).json
```

### Production Cron Script

```bash
#!/bin/bash
# /usr/local/bin/run-monitoring.sh

set -euo pipefail

# Configuration
CONFIG="/home/user/monitoring/config.yaml"
VENV="/home/user/llm-answer-watcher/.venv"
LOG_DIR="/var/log/monitoring"

# Load environment
source "$VENV/bin/activate"
source /home/user/.env  # API keys

# Run with error handling
"$VENV/bin/llm-answer-watcher" run \
    --config "$CONFIG" \
    --yes \
    --format json \
    > "$LOG_DIR/$(date +%Y-%m-%d).json" 2>&1

EXIT_CODE=$?

# Alert on failure
if [ $EXIT_CODE -eq 4 ]; then
    echo "Monitoring failed" | mail -s "Alert: Monitoring Failure" ops@example.com
fi

exit $EXIT_CODE
```

Make executable and schedule:

```bash
chmod +x /usr/local/bin/run-monitoring.sh

# Add to crontab
0 9 * * * /usr/local/bin/run-monitoring.sh
```

## GitHub Actions

### Basic Workflow

`.github/workflows/brand-monitoring.yml`:

```yaml
name: Brand Monitoring

on:
  schedule:
    # Run daily at 9 AM UTC
    - cron: '0 9 * * *'
  workflow_dispatch:  # Manual trigger

jobs:
  monitor:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: |
          pip install uv
          uv sync

      - name: Run monitoring
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          uv run llm-answer-watcher run \
            --config configs/production.yaml \
            --yes \
            --format json \
            > results.json

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: monitoring-results
          path: |
            results.json
            output/

      - name: Commit database
        run: |
          git config --local user.email "bot@example.com"
          git config --local user.name "Monitoring Bot"
          git add output/watcher.db
          git commit -m "Update monitoring data"
          git push
```

### Advanced Workflow with Notifications

```yaml
name: Advanced Brand Monitoring

on:
  schedule:
    - cron: '0 9 * * *'

jobs:
  monitor:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install
        run: |
          pip install uv
          uv sync

      - name: Run monitoring
        id: monitor
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          uv run llm-answer-watcher run \
            --config config.yaml \
            --yes \
            --format json | tee results.json
          echo "exit_code=$?" >> $GITHUB_OUTPUT
        continue-on-error: true

      - name: Parse results
        id: parse
        run: |
          COST=$(jq -r '.total_cost_usd' results.json)
          BRANDS=$(jq -r '.brands_detected.mine | length' results.json)
          echo "cost=$COST" >> $GITHUB_OUTPUT
          echo "brands_found=$BRANDS" >> $GITHUB_OUTPUT

      - name: Slack notification
        if: steps.monitor.outputs.exit_code == '0'
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Brand monitoring completed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Brand Monitoring Results*\n• Cost: $$${{ steps.parse.outputs.cost }}\n• Brands found: ${{ steps.parse.outputs.brands_found }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}

      - name: Alert on failure
        if: steps.monitor.outputs.exit_code == '4'
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "❌ Brand monitoring failed completely"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## Docker Automation

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
CMD ["run", "--config", "config.yaml", "--yes", "--format", "json"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  monitoring:
    build: .
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./output:/app/output
      - ./configs:/app/configs
    command: run --config configs/production.yaml --yes --format json
```

Run:

```bash
docker-compose up
```

## Best Practices

### 1. Use --yes Flag

Skip confirmation prompts:

```bash
llm-answer-watcher run --config config.yaml --yes
```

### 2. Use JSON or Quiet Mode

For parsing:

```bash
llm-answer-watcher run --config config.yaml --yes --format json
```

### 3. Handle Exit Codes

```bash
llm-answer-watcher run --config config.yaml --yes
case $? in
    0|3) echo "Success or partial success" ;;
    *) echo "Error occurred" && exit 1 ;;
esac
```

### 4. Secure API Keys

Never hardcode API keys:

```bash
# ✅ Good - from environment
export OPENAI_API_KEY=sk-...

# ✅ Good - from secrets management
OPENAI_API_KEY=$(aws secretsmanager get-secret-value --secret-id openai-key)
```

### 5. Log Output

```bash
llm-answer-watcher run --config config.yaml --yes \
    --format json \
    > /var/log/monitoring/$(date +%Y-%m-%d).json 2>&1
```

### 6. Rotate Logs

```bash
# Keep last 30 days
find /var/log/monitoring -name "*.json" -mtime +30 -delete
```

## Next Steps

- [See CI/CD examples](../../examples/ci-cd-integration.md)
- [Learn about output modes](output-modes.md)
- [Understand exit codes](exit-codes.md)
