# Quick Start Guide

Get started with LLM Answer Watcher in under 5 minutes.

## Files in This Directory

1. **`minimal.config.yaml`** - Absolute minimum configuration (1 provider, 1 intent)
   - Cost: ~$0.001 per run
   - Time: ~5 seconds
   - Best for: First-time users who want to see results immediately

2. **`explained.config.yaml`** - Same config with detailed inline comments
   - Best for: Understanding what each configuration option does
   - Learn about all available fields and their purposes

## Quick Start Steps

### 1. Set Up API Key

```bash
# Export your OpenAI API key
export OPENAI_API_KEY="sk-..."
```

### 2. Run the Minimal Example

```bash
llm-answer-watcher run --config examples/01-quickstart/minimal.config.yaml
```

### 3. View Results

```bash
# Results are saved to timestamped directory
ls ./output/

# Open the HTML report in your browser
open ./output/YYYY-MM-DDTHH-MM-SSZ/report.html
```

## What You'll See

The tool will:
1. Query OpenAI's GPT-4o-mini with your intent
2. Extract brand mentions from the response
3. Save results to JSON and SQLite
4. Generate an HTML report

**Expected output:**
```
✓ Run started: 2025-11-08T12-00-00Z
✓ Processing: best-tools (openai/gpt-4o-mini)
✓ Query successful: $0.0008
✓ Found 3 brand mentions
✓ Report generated: ./output/2025-11-08T12-00-00Z/report.html
```

## Next Steps

After your first successful run:

1. **Customize brands** - Edit `minimal.config.yaml` with your actual brands
2. **Add more intents** - Add real buyer-intent queries
3. **Try more providers** - See `02-providers/` for multi-provider examples
4. **Enable features** - See `03-web-search/`, `04-extraction/` for advanced features
5. **Read the explained config** - Open `explained.config.yaml` to learn all options

## Common Issues

**"OPENAI_API_KEY not set"**
```bash
export OPENAI_API_KEY="sk-..."
```

**"Invalid API key"**
- Check your key at https://platform.openai.com/api-keys
- Ensure key has sufficient quota

**"Rate limit exceeded"**
- Wait a few seconds and retry
- Reduce `max_concurrent_requests` in config

## Cost Estimation

The minimal example costs approximately:
- **$0.001 per run** (1 intent × 1 model × gpt-4o-mini pricing)
- **~50 tokens input** (prompt + system message)
- **~300 tokens output** (answer)

Running 100 times = **~$0.10 total**

Safe for experimentation!
