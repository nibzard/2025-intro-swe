# Frequently Asked Questions

## General

### What is LLM Answer Watcher?

LLM Answer Watcher is a CLI tool that monitors how large language models (like ChatGPT, Claude) talk about your brand versus competitors when answering buyer-intent queries.

### Why should I use this?

As AI-powered search becomes mainstream (ChatGPT, Perplexity, Google AI Overview), understanding your brand's presence in LLM responses is crucial for:

- Brand visibility tracking
- Competitive intelligence
- SEO for the AI era
- Market positioning

### Is it free?

The tool is **open source** (MIT license) and free to use. However, you pay for:

- LLM API calls (typically $0.001-$0.01 per query)
- Your own compute resources

### How much does it cost to run?

**Example costs per run**:

- 3 intents × 1 model (gpt-4o-mini): ~$0.006
- 5 intents × 2 models: ~$0.020
- 10 intents × 5 models: ~$0.150

See [Cost Management](user-guide/features/cost-management.md) for details.

## Installation & Setup

### What Python version do I need?

**Python 3.12 or 3.13** is required. The tool uses modern Python features.

### Can I use pip instead of uv?

Yes! Both work:

```bash
# With uv (recommended - faster)
uv sync

# With pip (traditional)
pip install -e .
```

### Which LLM providers are supported?

- OpenAI (GPT models)
- Anthropic (Claude models)
- Mistral AI
- X.AI (Grok models)
- Google (Gemini models)
- Perplexity

See [Providers](providers/overview.md) for complete list.

### Do I need API keys for all providers?

No! You only need API keys for providers you want to use. Start with just OpenAI if you want.

## Configuration

### How do I create a configuration file?

See [Basic Configuration](getting-started/basic-configuration.md). Minimum config:

```yaml
run_settings:
  output_dir: "./output"
  models:
    - provider: "openai"
      model_name: "gpt-4o-mini"
      env_api_key: "OPENAI_API_KEY"

brands:
  mine: ["YourBrand"]
  competitors: ["CompetitorA"]

intents:
  - id: "best-tools"
    prompt: "What are the best tools?"
```

### How many brands should I track?

**Your brands**: Include all variations (e.g., "HubSpot", "HubSpot CRM", "hubspot.com")

**Competitors**: Start with top 5-10 direct competitors. You can always add more.

### What makes a good intent prompt?

Good prompts are:

- **Natural**: How real users ask
- **Buyer-intent**: Imply evaluation/purchase
- **Specific**: Target a use case

Examples:

- ✅ "What are the best email warmup tools for startups?"
- ❌ "Tell me about email"

### Can I use the same config for multiple runs?

Yes! Configs are reusable. All data is timestamped and stored separately.

## Usage

### Why aren't my brands being detected?

Common causes:

1. **Name mismatch**: LLM used "HubSpot CRM" but you only configured "HubSpot"
   - **Solution**: Add all brand variations

2. **Brand not mentioned**: LLM didn't include your brand
   - **Solution**: This is valuable data! Your brand isn't top-of-mind for that query

3. **Word boundary issue**: "Hub" won't match in "GitHub"
   - **Solution**: This is intentional to prevent false positives

### How do I track historical trends?

All data is stored in SQLite at `./output/watcher.db`:

```sql
SELECT DATE(timestamp_utc), AVG(rank_position)
FROM mentions
WHERE normalized_name = 'yourbrand'
GROUP BY DATE(timestamp_utc);
```

See [Data Analytics](data-analytics/sqlite-database.md).

### Can I run this in CI/CD?

Yes! Use `--yes --format json` for automation:

```bash
llm-answer-watcher run --config config.yaml --yes --format json
```

See [Automation Guide](user-guide/usage/automation.md).

### What are the exit codes?

- `0`: Success
- `1`: Configuration error
- `2`: Database error
- `3`: Partial failure (acceptable)
- `4`: Complete failure

See [Exit Codes](user-guide/usage/exit-codes.md).

## Features

### What's the difference between regex and LLM extraction?

**Regex extraction** (default):
- Fast and cheap
- Pattern-based matching
- 90%+ accuracy

**LLM extraction** (`use_llm_rank_extraction: true`):
- More accurate for complex cases
- Costs extra (additional LLM calls)
- 95%+ accuracy

Start with regex. Only use LLM if needed.

### What is function calling?

Function calling uses LLM's built-in structured output feature for extraction. More accurate than regex.

Enable it:

```yaml
extraction_settings:
  method: "function_calling"
  extraction_model:
    provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
```

See [Function Calling](user-guide/features/function-calling.md).

### How do budget controls work?

Set spending limits:

```yaml
budget:
  enabled: true
  max_per_run_usd: 1.00
  max_per_intent_usd: 0.10
```

Tool validates **before running** and aborts if estimated cost exceeds limits.

See [Budget Controls](user-guide/configuration/budget.md).

### Can I use web search?

Yes, but it increases costs significantly ($10-$25 per 1,000 calls):

```yaml
web_search:
  enabled: true
  max_results: 10
```

See [Web Search](user-guide/configuration/web-search.md).

## Data & Privacy

### Where is my data stored?

**Locally on your machine**:

- SQLite database: `./output/watcher.db`
- JSON files: `./output/YYYY-MM-DDTHH-MM-SSZ/`
- HTML reports: `./output/YYYY-MM-DDTHH-MM-SSZ/report.html`

**No data leaves your machine** except LLM API calls.

### Is my data sent anywhere?

Only to configured LLM providers (OpenAI, Anthropic, etc.) for query processing. We don't collect any data.

### Are API keys secure?

API keys are:

- Loaded from environment variables
- Never logged or written to disk
- Never sent anywhere except the respective LLM provider

See [Security](advanced/security.md).

### Can I delete old data?

Yes! Simply delete directories or database records:

```bash
# Delete runs older than 90 days
find output/ -name "2024-*" -type d -mtime +90 -exec rm -rf {} +
```

## Troubleshooting

### "Configuration error: API key not found"

**Solution**:

```bash
# Check if key is set
echo $OPENAI_API_KEY

# If empty, export it
export OPENAI_API_KEY=sk-your-key-here
```

### "Rate limit exceeded"

**Solution**: LLM provider rate limit hit. Options:

1. Wait and retry
2. Reduce number of queries
3. Use slower model tiers
4. Upgrade API plan

### "No brands detected"

**Causes**:

1. Brand not mentioned by LLM
2. Brand name mismatch (add aliases)
3. Case sensitivity (should work - file a bug)

### "Database locked"

**Solution**: Another process is using the database:

```bash
# Find process
lsof output/watcher.db

# Kill if needed
kill -9 <PID>
```

### Build/Import Errors

**Solution**:

```bash
# Reinstall
pip install -e .

# Check Python version
python --version  # Should be 3.12+
```

## Advanced

### Can I extend it with new providers?

Yes! See [Extending Providers](advanced/extending-providers.md).

### Can I customize system prompts?

Yes! See [Custom System Prompts](advanced/custom-system-prompts.md).

### Is there a Python API?

Yes! See [Python API Reference](reference/python-api.md).

### Can I contribute?

Absolutely! See [Contributing Guide](contributing/development-setup.md).

## Still Have Questions?

- **GitHub Issues**: [Report bugs or ask questions](https://github.com/nibzard/llm-answer-watcher/issues)
- **Documentation**: Browse this site
- **Examples**: Check `examples/` directory in the repository
