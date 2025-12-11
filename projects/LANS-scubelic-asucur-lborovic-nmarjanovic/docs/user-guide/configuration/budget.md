# Budget Configuration

Budget controls prevent runaway costs by setting spending limits before execution starts. LLM Answer Watcher validates estimated costs against your budget and aborts if limits would be exceeded.

## Why Budget Controls?

LLM API costs can add up quickly:

- **Testing**: Multiple intents × multiple models = high query volume
- **Mistakes**: Accidental loops or configuration errors
- **Provider changes**: Pricing updates or model changes
- **Experimentation**: Trying new configurations without cost awareness

Budget controls ensure you never spend more than intended.

## Basic Budget Configuration

### Enabling Budget Controls

Add a `budget` section to `run_settings`:

```yaml
run_settings:
  output_dir: "./output"
  sqlite_db_path: "./output/watcher.db"

  models:
    - provider: "openai"
      model_name: "gpt-4o-mini"
      env_api_key: "OPENAI_API_KEY"

  budget:
    enabled: true
    max_per_run_usd: 1.00        # Hard limit: abort if total > $1.00
    max_per_intent_usd: 0.10     # Hard limit: abort if any intent > $0.10
    warn_threshold_usd: 0.50     # Warning: log if total > $0.50 (but continue)
```

### Disabling Budget Controls

For unlimited spending:

```yaml
run_settings:
  budget:
    enabled: false  # No cost limits
```

!!! warning "Disabled Budgets"
    Only disable budgets when:

    - You fully understand costs
    - Running production monitoring with known costs
    - Budget controls interfere with automation

    **Recommendation**: Keep budgets enabled even in production.

## Budget Parameters

### `enabled` (boolean)

Enable or disable budget enforcement.

```yaml
budget:
  enabled: true  # Enforce budget limits
```

**Default**: `false` (budgets disabled)

**Recommended**: `true` for all use cases

---

### `max_per_run_usd` (float)

Maximum total cost per run (all intents × all models).

```yaml
budget:
  max_per_run_usd: 1.00  # Abort if total estimated cost > $1.00
```

**Calculation**:
```
max_per_run = (num_intents × num_models) × avg_cost_per_query
```

**Example**:

- 3 intents × 2 models = 6 queries
- Average cost: $0.005 per query
- Total estimated cost: $0.03
- Budget limit: $1.00
- ✅ **Result**: Run proceeds

---

### `max_per_intent_usd` (float)

Maximum cost per single intent (across all models).

```yaml
budget:
  max_per_intent_usd: 0.10  # Abort if any single intent > $0.10
```

**Calculation**:
```
max_per_intent = num_models × avg_cost_per_query
```

**Example**:

- 3 models for one intent
- Average cost: $0.005 per query
- Intent cost: $0.015
- Budget limit: $0.10
- ✅ **Result**: Intent proceeds

**Use case**: Prevent expensive intents with long prompts or web search.

---

### `warn_threshold_usd` (float)

Warning threshold (logs warning but continues).

```yaml
budget:
  warn_threshold_usd: 0.50  # Log warning if total > $0.50
```

**Behavior**:

- If `estimated_cost <= warn_threshold`: Silent execution
- If `warn_threshold < estimated_cost <= max_per_run`: Log warning, continue
- If `estimated_cost > max_per_run`: Abort execution

**Example output**:

```
⚠️  Cost warning: Estimated run cost $0.75 exceeds warning threshold of $0.50
   Budget limit: $1.00 (OK to proceed)
   Run will execute 12 queries across 3 intents and 4 models.
```

## Budget Configuration Patterns

### Development / Testing

Strict limits for experimentation:

```yaml
run_settings:
  budget:
    enabled: true
    max_per_run_usd: 0.10         # Very low limit
    max_per_intent_usd: 0.05      # Catch expensive intents early
    warn_threshold_usd: 0.05      # Warn at same level as max
```

**Use when:**

- Testing configuration changes
- Developing new intents
- Running frequent test runs
- Learning the tool

---

### Production Monitoring

Balanced limits for regular monitoring:

```yaml
run_settings:
  budget:
    enabled: true
    max_per_run_usd: 5.00         # Reasonable daily limit
    max_per_intent_usd: 0.50      # Prevent runaway intent costs
    warn_threshold_usd: 2.50      # Alert if > $2.50
```

**Use when:**

- Daily/weekly monitoring
- Established configuration
- Known cost profile
- Production use

---

### CI/CD Pipelines

Conservative limits for automated runs:

```yaml
run_settings:
  budget:
    enabled: true
    max_per_run_usd: 0.50         # Low limit for automated runs
    max_per_intent_usd: 0.10
    warn_threshold_usd: 0.25
```

**Use when:**

- Automated testing
- Pull request checks
- Continuous monitoring
- High-frequency runs

---

### Executive Reports

Higher limits for comprehensive analysis:

```yaml
run_settings:
  budget:
    enabled: true
    max_per_run_usd: 25.00        # Higher limit for quality models
    max_per_intent_usd: 2.00
    warn_threshold_usd: 10.00
```

**Use when:**

- Monthly executive reports
- Using premium models (GPT-4, Claude Opus)
- Comprehensive competitive analysis
- Deep-dive research

---

### Warning-Only Mode

Logs warnings but never aborts:

```yaml
run_settings:
  budget:
    enabled: true
    max_per_run_usd: 999999.99    # Effectively unlimited
    max_per_intent_usd: 999999.99
    warn_threshold_usd: 1.00      # But warn at $1
```

**Use when:**

- Production monitoring with known costs
- Don't want aborts to break automation
- Still want cost visibility

!!! warning "Use with Caution"
    This defeats the purpose of budget controls. Only use when you fully understand cost implications.

## Cost Estimation

LLM Answer Watcher estimates costs **before** execution using:

### Estimation Formula

```python
estimated_cost = (
    (input_tokens × input_price_per_token) +
    (output_tokens × output_price_per_token)
) × safety_buffer
```

**Parameters:**

- `input_tokens`: Estimated from prompt length (~150 tokens)
- `output_tokens`: Estimated average response (~500 tokens)
- `input_price_per_token`: From llm-prices.com (cached 24h)
- `output_price_per_token`: From llm-prices.com (cached 24h)
- `safety_buffer`: 1.2 (20% buffer for variance)

### Estimation Accuracy

Cost estimates are **approximate**:

- **Actual costs**: May vary ±20% from estimates
- **Factors affecting accuracy**:
  - Prompt length (longer = higher input cost)
  - Response length (varies by model and prompt)
  - Web search usage (adds $10-$25 per 1k calls)
  - Function calling (may increase token usage)

!!! tip "Estimation Accuracy"
    Estimates are conservative (tend to overestimate). Actual costs are typically 10-20% lower than estimated.

### Checking Estimated Costs

**Before running:**

```bash
llm-answer-watcher run --config watcher.config.yaml --dry-run
```

Output:

```
💰 Cost Estimation:
   ├── OpenAI gpt-4o-mini: $0.0004 per query × 3 intents = $0.0012
   ├── Anthropic claude-3-5-haiku: $0.0022 per query × 3 intents = $0.0066
   ├── Safety buffer (20%): +$0.0016
   └── Total estimated cost: $0.0094

✅ Budget check passed:
   ├── Estimated cost: $0.0094
   ├── Budget limit: $1.00
   └── Remaining budget: $0.9906
```

**After running:**

Check actual costs in `run_meta.json`:

```json
{
  "run_id": "2025-11-01T08-00-00Z",
  "total_cost_usd": 0.0087,
  "estimated_cost_usd": 0.0094,
  "cost_accuracy": 92.6
}
```

## Dynamic Pricing

LLM Answer Watcher automatically loads current pricing from [llm-prices.com](https://www.llm-prices.com).

### How Dynamic Pricing Works

1. **On first run**: Fetch pricing from llm-prices.com
2. **Cache for 24 hours**: Store in `~/.cache/llm-answer-watcher/pricing.json`
3. **Auto-refresh**: Re-fetch after 24 hours
4. **Fallback**: Use hardcoded prices if API unavailable

### Viewing Current Pricing

```bash
# Show all models
llm-answer-watcher prices show

# Show specific provider
llm-answer-watcher prices show --provider openai

# Show specific model
llm-answer-watcher prices show --model gpt-4o-mini

# Export as JSON
llm-answer-watcher prices list --format json
```

Example output:

```
💰 Current LLM Pricing (as of 2025-11-01):

OpenAI:
  gpt-4o-mini:
    Input:  $0.15 per 1M tokens
    Output: $0.60 per 1M tokens

  gpt-4o:
    Input:  $2.50 per 1M tokens
    Output: $10.00 per 1M tokens

Anthropic:
  claude-3-5-haiku-20241022:
    Input:  $0.80 per 1M tokens
    Output: $4.00 per 1M tokens
```

### Forcing Pricing Refresh

```bash
# Force refresh (ignore cache)
llm-answer-watcher prices refresh --force

# Verify pricing updated
llm-answer-watcher prices show
```

### Pricing Cache Location

- **Linux/Mac**: `~/.cache/llm-answer-watcher/pricing.json`
- **Windows**: `%LOCALAPPDATA%/llm-answer-watcher/pricing.json`

Clear cache:

```bash
rm ~/.cache/llm-answer-watcher/pricing.json
```

## Web Search Costs

Web search adds additional costs beyond token usage.

### OpenAI Web Search Pricing

| Model Tier | Cost per 1,000 Calls | Content Tokens |
|------------|---------------------|----------------|
| Standard (all models) | $10 | @ model rate |
| gpt-4o-mini, gpt-4.1-mini | $10 | Fixed 8k tokens |
| Preview reasoning (o1, o3) | $10 | @ model rate |
| Preview non-reasoning | $25 | **FREE** |

### Web Search Cost Calculation

```python
# Standard model
web_search_cost = (
    (num_searches × $0.01) +  # $10 per 1k calls
    (search_tokens × input_price_per_token)
)

# Mini models (fixed 8k tokens)
web_search_cost = (
    (num_searches × $0.01) +
    (8000 × input_price_per_token)
)
```

### Estimating Web Search Costs

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    tools:
      - type: "web_search"
```

**Estimated cost per query** (with web search):

- Base query: $0.0004 (tokens)
- Web search call: $0.01 (per call)
- Web search content: $0.0012 (8k tokens @ $0.15/1M)
- **Total**: ~$0.0116 per query

See [Web Search Configuration](web-search.md) for details.

### Perplexity Request Fees

Perplexity charges **request fees** in addition to token costs:

- Basic searches: ~$0.005 per request
- Complex searches: ~$0.01-$0.03 per request

!!! warning "Perplexity Costs Not Fully Estimated"
    Request fees are **not yet included** in cost estimates. Budget accordingly when using Perplexity:

    ```yaml
    budget:
      max_per_run_usd: 2.00  # Higher buffer for Perplexity
    ```

## Budget Enforcement Behavior

### Pre-Execution Validation

Budget validation happens **before** any LLM calls:

1. Load configuration
2. Estimate total cost
3. Check against budget limits
4. If budget exceeded: **Abort immediately**
5. If budget OK: Proceed with execution

**No LLM calls are made if budget would be exceeded.**

### Abort on Budget Exceeded

When budget is exceeded:

```bash
llm-answer-watcher run --config watcher.config.yaml
```

Output:

```
❌ Budget exceeded: Estimated run cost $1.25 exceeds max_per_run_usd budget of $1.00.

   Run would execute 12 queries:
   ├── 3 intents × 4 models = 12 queries
   ├── Estimated cost: $1.25
   ├── Budget limit: $1.00
   └── Overage: $0.25

   Options:
   1. Reduce number of models or intents
   2. Increase budget limit in watcher.config.yaml
   3. Use --force to override budget (not recommended)
```

**Exit code**: `1` (configuration error)

### Force Override

Override budget limits (use with caution):

```bash
llm-answer-watcher run --config watcher.config.yaml --force
```

Output:

```
⚠️  Budget check OVERRIDDEN with --force flag

   Estimated cost: $1.25
   Budget limit: $1.00
   Overage: $0.25

   Proceeding anyway...
```

!!! danger "Force Override"
    Only use `--force` when:

    - You understand exact costs
    - Budget limit is incorrect
    - Emergency production run

    **Never** use `--force` in automated scripts.

### Warning Threshold Behavior

When cost exceeds warning threshold (but not max):

```bash
llm-answer-watcher run --config watcher.config.yaml
```

Output:

```
⚠️  Cost warning: Estimated run cost $0.75 exceeds warning threshold of $0.50

   ├── Estimated cost: $0.75
   ├── Warning threshold: $0.50
   ├── Budget limit: $1.00
   └── Status: OK to proceed

   Run will execute 12 queries. Continue? [Y/n]
```

**Behavior**:

- In human mode: Prompt for confirmation
- With `--yes` flag: Continue automatically
- In agent mode: Continue automatically (warning logged)

## Cost Tracking

### Per-Run Cost Summary

After each run, check `run_meta.json`:

```json
{
  "run_id": "2025-11-01T08-00-00Z",
  "timestamp_utc": "2025-11-01T08:00:00Z",
  "total_cost_usd": 0.0142,
  "estimated_cost_usd": 0.0168,
  "cost_accuracy_percent": 84.5,
  "queries_completed": 6,
  "queries_failed": 0,
  "cost_by_provider": {
    "openai": 0.0048,
    "anthropic": 0.0094
  },
  "cost_by_model": {
    "gpt-4o-mini": 0.0048,
    "claude-3-5-haiku-20241022": 0.0094
  }
}
```

### Historical Cost Analysis

Query SQLite database:

```sql
-- Total spending
SELECT SUM(total_cost_usd) as total_spent
FROM runs;

-- Spending by week
SELECT
    strftime('%Y-W%W', timestamp_utc) as week,
    SUM(total_cost_usd) as weekly_cost,
    COUNT(*) as runs
FROM runs
GROUP BY week
ORDER BY week DESC;

-- Spending by model
SELECT
    model_name,
    COUNT(*) as queries,
    SUM(estimated_cost_usd) as total_cost,
    AVG(estimated_cost_usd) as avg_cost_per_query
FROM answers_raw
GROUP BY model_name
ORDER BY total_cost DESC;

-- Spending by intent
SELECT
    intent_id,
    COUNT(*) as queries,
    SUM(estimated_cost_usd) as total_cost,
    AVG(estimated_cost_usd) as avg_cost_per_query
FROM answers_raw
GROUP BY intent_id
ORDER BY total_cost DESC;
```

### Monthly Budget Tracking

Track spending vs. monthly budget:

```sql
-- Current month spending
SELECT SUM(total_cost_usd) as month_to_date
FROM runs
WHERE strftime('%Y-%m', timestamp_utc) = strftime('%Y-%m', 'now');

-- Monthly trend
SELECT
    strftime('%Y-%m', timestamp_utc) as month,
    SUM(total_cost_usd) as monthly_cost,
    COUNT(*) as runs,
    AVG(total_cost_usd) as avg_cost_per_run
FROM runs
GROUP BY month
ORDER BY month DESC;
```

## Best Practices

### 1. Always Enable Budgets

Even in production:

```yaml
run_settings:
  budget:
    enabled: true
    max_per_run_usd: 10.00  # Reasonable safety limit
```

### 2. Set Conservative Limits

Start low, increase as needed:

```yaml
# Week 1: Very conservative
budget:
  max_per_run_usd: 0.10

# Week 2: Based on actual usage
budget:
  max_per_run_usd: 0.50

# Production: 2x observed average
budget:
  max_per_run_usd: 1.00
```

### 3. Use Warning Thresholds

Get alerts before hitting limits:

```yaml
budget:
  max_per_run_usd: 1.00
  warn_threshold_usd: 0.50  # Alert at 50% of limit
```

### 4. Separate Budgets by Environment

Different limits for different environments:

```yaml
# dev.config.yaml
run_settings:
  budget:
    max_per_run_usd: 0.10

# prod.config.yaml
run_settings:
  budget:
    max_per_run_usd: 5.00
```

### 5. Monitor Actual vs. Estimated Costs

Track estimation accuracy:

```sql
SELECT
    AVG(total_cost_usd / estimated_cost_usd) as avg_accuracy,
    MIN(total_cost_usd / estimated_cost_usd) as min_accuracy,
    MAX(total_cost_usd / estimated_cost_usd) as max_accuracy
FROM runs
WHERE estimated_cost_usd > 0;
```

Adjust safety buffer if needed.

### 6. Account for Web Search Costs

Budget higher when using web search:

```yaml
# Without web search
budget:
  max_per_run_usd: 0.50

# With web search (10x higher)
budget:
  max_per_run_usd: 5.00
```

### 7. Use Dry Runs

Check costs before running:

```bash
llm-answer-watcher run --config watcher.config.yaml --dry-run
```

## Troubleshooting

### Budget Always Exceeded

**Problem**: Every run exceeds budget

**Possible causes:**

1. Too many intents or models
2. Budget limit too low
3. Expensive models (GPT-4, Claude Opus)
4. Web search enabled

**Solutions:**

```yaml
# Reduce intents
intents:
  - id: "primary-intent"
    prompt: "Most important question"

# Reduce models
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"  # Cheapest option

# Increase budget
budget:
  max_per_run_usd: 2.00  # Higher limit

# Disable web search
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    # Remove tools section
```

---

### Estimated Costs Inaccurate

**Problem**: Actual costs differ significantly from estimates

**Possible causes:**

1. Longer/shorter responses than expected
2. Web search usage not estimated correctly
3. Pricing data outdated
4. Function calling adds tokens

**Solutions:**

```bash
# Refresh pricing
llm-answer-watcher prices refresh --force

# Check estimation accuracy
# (in run_meta.json after run)
cat output/2025-11-01T08-00-00Z/run_meta.json | jq '.cost_accuracy_percent'

# Adjust safety buffer if needed (future feature)
```

---

### Budget Blocks Valid Runs

**Problem**: Budget blocks run that should be allowed

**Cause**: Budget limit too conservative

**Solution**: Increase limit based on historical data:

```sql
-- Check average run cost
SELECT AVG(total_cost_usd) as avg_cost, MAX(total_cost_usd) as max_cost
FROM runs;
```

Set budget to 2x average or 1.5x max:

```yaml
budget:
  max_per_run_usd: 0.50  # 2x average of $0.25
```

## Next Steps

- **[Cost Management](../features/cost-management.md)**: Deep dive into cost tracking
- **[Web Search Configuration](web-search.md)**: Understand web search costs
- **[Model Configuration](models.md)**: Choose cost-effective models
- **[Automation](../usage/automation.md)**: Budget controls in CI/CD
