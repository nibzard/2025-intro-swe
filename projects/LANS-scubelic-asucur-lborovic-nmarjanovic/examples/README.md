# LLM Answer Watcher - Examples

Comprehensive examples demonstrating all features of LLM Answer Watcher.

## 🚀 Quick Start (New Users Start Here!)

**Never used LLM Answer Watcher before?** Start with these:

1. **[01-quickstart/minimal.config.yaml](01-quickstart/minimal.config.yaml)** - Run your first query in 5 minutes
2. **[01-quickstart/explained.config.yaml](01-quickstart/explained.config.yaml)** - Learn what each config option does
3. **[default.config.yaml](default.config.yaml)** - Copy this as your starting template

```bash
# Set your API key
export OPENAI_API_KEY="sk-..."

# Run the minimal example
llm-answer-watcher run --config examples/01-quickstart/minimal.config.yaml

# View results
open ./output/*/report.html
```

**Cost**: ~$0.001 | **Time**: ~5 seconds

---

## 📁 Directory Structure

### **[01-quickstart/](01-quickstart/)**
Start here! Minimal examples to get running fast.

- `minimal.config.yaml` - Simplest possible config (1 provider, 1 intent)
- `explained.config.yaml` - Same config with detailed inline comments
- `README.md` - Quick start guide

**When to use**: First-time setup, learning the basics

---

### **[02-providers/](02-providers/)**
Examples for all 6 supported LLM providers.

- `openai.config.yaml` - OpenAI GPT models
- `anthropic.config.yaml` - Anthropic Claude models
- `google-gemini.config.yaml` - Google Gemini models
- `mistral.config.yaml` - Mistral AI models
- `grok.config.yaml` - X.AI Grok models
- `perplexity.config.yaml` - Perplexity Sonar models
- `multi-provider-comparison.config.yaml` - Compare all 6 providers
- `README.md` - Provider comparison guide

**When to use**: Testing different providers, multi-provider monitoring

---

### **[03-web-search/](03-web-search/)**
Real-time web search across providers.

- `openai-websearch.config.yaml` - OpenAI Responses API with web search
- `google-grounding.config.yaml` - Google Gemini with Search grounding
- `perplexity-online.config.yaml` - Perplexity Sonar (built-in search)
- `websearch-comparison.config.yaml` - Compare all 3 approaches
- `README.md` - Web search guide

**When to use**: Monitoring new brands, tracking current information, 2025-specific queries

**Cost impact**: Adds ~$0.01 per query for real-time data

---

### **[04-extraction/](04-extraction/)**
Brand mention extraction methods.

- `regex-only.config.yaml` - Fast regex extraction (~85% accuracy) ✅
- `function-calling.config.yaml` - LLM-based extraction (~95% accuracy) ✅
- `hybrid-fallback.config.yaml` - Best of both worlds (RECOMMENDED) ✅
- `intent-classification.config.yaml` - Buyer stage detection ✅
- `sentiment-analysis.config.yaml` - Brand sentiment tracking ✅
- `README.md` - Extraction methods guide ✅

**When to use**: Need higher accuracy, sentiment analysis, buyer stage tracking

---

### **[05-operations/](05-operations/)**
Automated analysis with LLM operations.

- `basic-operations.config.yaml` - Simple operations (quality scoring) ✅
- `chained-dependencies.config.yaml` - Multi-step analysis pipeline ✅
- `content-strategy.config.yaml` - Generate content recommendations ✅
- `competitive-intel.config.yaml` - Track competitor positioning ✅
- `README.md` - Operations system guide ✅

**When to use**: Automated insights, content strategy, competitive intelligence

---

### **[06-advanced/](06-advanced/)**
Advanced features and production configurations.

- `budget-controls.config.yaml` - Cost management ✅
- `browser-automation.config.yaml` - Steel browser runners (see watcher.config.browser-runners.yaml)
- `high-concurrency.config.yaml` - Parallel processing at scale ✅
- `production-ready.config.yaml` - All features combined ✅
- `README.md` - Advanced features guide ✅

**When to use**: Production deployments, high-volume monitoring, cost control

---

### **[07-real-world/](07-real-world/)**
Complete use case templates.

- `saas-brand-monitoring.config.yaml` - Track SaaS product mentions ✅
- `content-gap-analysis.config.yaml` - Find content opportunities ✅
- `competitive-intelligence.config.yaml` - Monitor competitors ✅
- `llm-seo-optimization.config.yaml` - Optimize for LLM visibility ✅
- `README.md` - Use cases guide ✅

**When to use**: Copy-paste starting points for specific use cases

---

### **[code-examples/](code-examples/)**
Python scripts for programmatic usage.

- `basic_client_usage.py` - Direct LLM client usage (see ../openai_client_example.py) ✅
- `analyze_results.py` - Parse and analyze JSON output ✅
- `export_to_csv.py` - Export SQLite data to CSV ✅
- `automated_monitoring.py` - Cron job for daily monitoring ✅
- `slack_alerts.py` - Send Slack notifications (coming soon)
- `dashboard_integration.py` - Custom dashboard queries (coming soon)
- `README.md` - Programming guide ✅

**When to use**: Automation, custom integrations, data analysis

---

### **[internal/steel/](internal/steel/)**
Internal Steel team configurations.

*For Steel internal use - may reference non-standard setups*

---

## 📊 Example Selection Guide

### By Experience Level

**Beginner** (never used before):
1. `01-quickstart/minimal.config.yaml`
2. `02-providers/openai.config.yaml`
3. `code-examples/analyze_results.py`

**Intermediate** (familiar with basics):
1. `02-providers/multi-provider-comparison.config.yaml`
2. `03-web-search/websearch-comparison.config.yaml`
3. `04-extraction/function-calling.config.yaml`

**Advanced** (production deployment):
1. `06-advanced/production-ready.config.yaml`
2. `07-real-world/saas-brand-monitoring.config.yaml`
3. `code-examples/automated_monitoring.py`

### By Use Case

**Quick Testing**:
- `01-quickstart/minimal.config.yaml` (~$0.001, 5 seconds)

**Provider Comparison**:
- `02-providers/multi-provider-comparison.config.yaml` (~$0.037, 15 seconds)

**Real-time Data**:
- `03-web-search/websearch-comparison.config.yaml` (~$0.078, 20 seconds)

**High Accuracy**:
- `04-extraction/function-calling.config.yaml` (+$0.001/query for extraction)

**Automated Insights**:
- `05-operations/content-strategy.config.yaml` (+$0.005/query for operations)

**Production Monitoring**:
- `07-real-world/saas-brand-monitoring.config.yaml` (~$0.10/day)

### By Budget

**Free Tier** (Google Gemini):
- `02-providers/google-gemini.config.yaml`

**< $0.01 per run**:
- `01-quickstart/minimal.config.yaml`
- `02-providers/openai.config.yaml`

**< $0.10 per run**:
- `02-providers/multi-provider-comparison.config.yaml`
- `03-web-search/websearch-comparison.config.yaml`

**Production** ($1-10/day):
- `06-advanced/production-ready.config.yaml`
- `07-real-world/saas-brand-monitoring.config.yaml`

---

## 🔑 Environment Setup

Copy the environment template:

```bash
cp examples/.env.example .env
```

Edit `.env` and add your API keys:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
MISTRAL_API_KEY=...
GROK_API_KEY=xai-...
PERPLEXITY_API_KEY=pplx-...
```

---

## 💡 Common Workflows

### Daily Brand Monitoring

```bash
# Morning check: What are LLMs saying about us today?
llm-answer-watcher run --config examples/07-real-world/saas-brand-monitoring.config.yaml

# Analyze results
python examples/code-examples/analyze_results.py

# Export for stakeholders
python examples/code-examples/export_to_csv.py
```

### Weekly Competitive Analysis

```bash
# Compare all providers
llm-answer-watcher run --config examples/02-providers/multi-provider-comparison.config.yaml

# With real-time data
llm-answer-watcher run --config examples/03-web-search/websearch-comparison.config.yaml

# Generate content strategy
llm-answer-watcher run --config examples/05-operations/content-strategy.config.yaml
```

### One-time Research

```bash
# Quick test with minimal config
llm-answer-watcher run --config examples/01-quickstart/minimal.config.yaml
```

---

## 📖 Next Steps

1. **Try the quick start**: `examples/01-quickstart/minimal.config.yaml`
2. **Read the explained config**: `examples/01-quickstart/explained.config.yaml`
3. **Copy default.config.yaml** and customize for your brand
4. **Explore providers**: Try different LLM providers in `02-providers/`
5. **Enable features**: Add web search, operations, extraction as needed
6. **Automate**: Set up cron jobs with `code-examples/automated_monitoring.py`

---

## 🆘 Troubleshooting

**"OPENAI_API_KEY not set"**
```bash
export OPENAI_API_KEY="sk-..."
```

**"Invalid API key"**
- Check your key at provider's dashboard
- Ensure sufficient quota/credits

**"Rate limit exceeded"**
- Reduce `max_concurrent_requests` in config
- Add delays between runs
- Upgrade API tier

**"No output generated"**
- Check `./output/` directory
- Look for error files: `intent_*_error_*.json`
- Run with `--verbose` flag

---

## 📚 Additional Resources

- **Main README**: `../README.md` - Project overview
- **Specification**: `../SPECS.md` - Complete technical spec
- **System Prompts**: `../llm_answer_watcher/system_prompts/` - Prompt templates
- **.env Template**: `.env.example` - Environment variable setup

---

## ✅ Status Legend

- ✅ Complete with working examples
- 📝 Coming soon (lower priority features)

---

**Questions?** See the main project README or open an issue on GitHub.
