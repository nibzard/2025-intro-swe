# LLM Answer Watcher

<div align="center" markdown>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/nibzard/llm-answer-watcher/blob/main/LICENSE)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Tests](https://github.com/nibzard/llm-answer-watcher/workflows/Tests/badge.svg)](https://github.com/nibzard/llm-answer-watcher/actions/workflows/test.yml)
[![Coverage](https://codecov.io/gh/nibzard/llm-answer-watcher/branch/main/graph/badge.svg)](https://codecov.io/gh/nibzard/llm-answer-watcher)

**Monitor how Large Language Models talk about your brand versus competitors in buyer-intent queries**

[Get Started](getting-started/quick-start.md){ .md-button .md-button--primary }
[View on GitHub](https://github.com/nibzard/llm-answer-watcher){ .md-button }

</div>

---

## What is LLM Answer Watcher?

LLM Answer Watcher is a production-ready CLI tool that helps you understand how AI models like ChatGPT, Claude, and others represent your brand when users ask buyer-intent questions.

As AI-powered search becomes mainstream, monitoring your brand's presence in LLM responses is crucial for:

- **Brand Visibility**: Track if your product appears in AI recommendations
- **Competitive Intelligence**: See which competitors are mentioned alongside you
- **Market Positioning**: Understand your ranking compared to alternatives
- **Trend Analysis**: Historical data shows how your presence changes over time

## Demo

See LLM Answer Watcher in action:

<div align="center" markdown>

![LLM Answer Watcher Demo](assets/demo.gif)

</div>

**What you're seeing:**

- Configuration validation with brand and competitor definitions
- Real-time progress bars showing query execution across LLM providers
- Brand mention extraction and ranking from AI responses
- Cost tracking and results summary

**Try it yourself:** Run `llm-answer-watcher demo` for an interactive demo (no API keys needed!)

---

## Key Features

### 🔍 Brand Mention Detection
Advanced word-boundary regex matching prevents false positives while accurately identifying your brand and competitors in LLM responses.

### 📊 Historical Tracking
All responses are stored in a local SQLite database, enabling powerful trend analysis and long-term visibility tracking.

### 🤖 Multi-Provider Support
Works with **6+ LLM providers**: OpenAI, Anthropic, Mistral, X.AI Grok, Google Gemini, and Perplexity, with an extensible architecture for adding more.

### 🌐 Browser Runners (BETA - New in v0.2.0)
Interact with web-based LLM interfaces (ChatGPT, Perplexity) using headless browser automation via Steel API. Captures true user experience with screenshots and HTML snapshots.

### ⚡ Async Parallelization (New in v0.2.0)
3-4x faster performance with async/await parallel query execution across multiple models and providers.

### 📈 Intelligent Rank Extraction
Automatically detects where your brand appears in ranked lists using pattern-based extraction and optional LLM-assisted ranking.

### 🎭 Sentiment Analysis & Intent Classification
- **Sentiment Analysis**: Analyze the tone (positive/neutral/negative) and context of each brand mention
- **Intent Classification**: Determine user intent type, buyer journey stage, and urgency signals
- **Prioritization**: Focus on high-value queries with ready-to-buy intent
- **ROI Tracking**: Understand which mentions drive real business value

### 💰 Dynamic Pricing & Budget Protection
- Real-time pricing from [llm-prices.com](https://www.llm-prices.com)
- Pre-run cost estimation
- Configurable spending limits
- Accurate web search cost calculation

### 🎯 Dual-Mode CLI
- **Human Mode**: Beautiful Rich output with spinners, colors, and formatted tables
- **Agent Mode**: Structured JSON output for AI agent automation
- **Quiet Mode**: Minimal tab-separated output for scripts

### 📋 Professional HTML Reports
Auto-generated reports with:
- Brand mention visualizations
- Rank distribution charts
- Historical trends
- Raw response inspection

### 🔒 Local-First & Secure
- All data stored locally on your machine
- BYOK (Bring Your Own Keys) - use your own API keys
- No external dependencies except LLM APIs
- Built-in SQL injection and XSS protection

## Quick Example

```bash
# Set your API keys
export OPENAI_API_KEY=sk-your-key-here
export ANTHROPIC_API_KEY=sk-ant-your-key-here

# Run with a config file
llm-answer-watcher run --config watcher.config.yaml
```

**Output:**

```
🔍 Running LLM Answer Watcher...
├── Query: "What are the best email warmup tools?"
├── Models: OpenAI gpt-4o-mini, Anthropic claude-3-5-haiku
├── Brands: 2 monitored, 5 competitors
└── Output: ./output/2025-11-01T14-30-00Z/

✅ Queries completed: 6/6
💰 Total cost: $0.0142
📊 Report: ./output/2025-11-01T14-30-00Z/report.html
```

## Use Cases

### 1. Brand Monitoring
Track your product's visibility in AI-powered search results across multiple LLM providers.

### 2. Competitive Analysis
See which competitors appear most frequently and in what context they're recommended.

### 3. SEO for AI Era
Optimize your brand presence in LLM training data and real-time retrieval systems.

### 4. Market Research
Understand how AI models categorize and compare products in your space.

### 5. Product Development
Identify gaps where competitors are mentioned but your product isn't.

### 6. Sales Intelligence
Know what alternatives prospects might be comparing you against.

## Architecture Highlights

LLM Answer Watcher is built with production-ready patterns:

- **Domain-Driven Design**: Clear separation between config, LLM clients, extraction, storage, and reporting
- **Provider Abstraction**: Easy to add new LLM providers with unified interface
- **Plugin System**: Extensible runner architecture supporting both API and browser-based runners
- **Async/Await**: Parallel query execution for 3-4x performance improvement (v0.2.0+)
- **Retry Logic**: Exponential backoff with tenacity for resilient API calls
- **Type Safety**: Full Pydantic validation and modern Python 3.12+ type hints
- **Testability**: 750+ test cases with 100% coverage on critical paths
- **API-First Contract**: Internal structure designed to become HTTP API for Cloud product

## Documentation Structure

This documentation is organized progressively from beginner to advanced:

### [Getting Started](getting-started/quick-start.md)
Everything you need to get up and running in 5 minutes.

### [User Guide](user-guide/configuration/overview.md)
Comprehensive guides for configuration, usage, and features.

### [Supported Providers](providers/overview.md)
Detailed information about each LLM provider integration.

### [Examples](examples/basic-monitoring.md)
Real-world examples and use cases with complete configurations.

### [Data & Analytics](data-analytics/output-structure.md)
Understanding output structure and running SQL analytics.

### [Evaluation Framework](evaluation/overview.md)
Quality control and accuracy testing for extraction logic.

### [Advanced Topics](advanced/architecture.md)
Deep dives into architecture, security, and extending the system.

### [Reference](reference/cli-reference.md)
Complete CLI command reference and configuration schemas.

## For LLMs & AI Agents

This documentation is available in LLM-optimized formats following the [llmstxt.org](https://llmstxt.org) standard:

- **[llms.txt](https://nibzard.github.io/llm-answer-watcher/llms.txt)** - Concise navigation index (~800 tokens)
- **[llms-full.txt](https://nibzard.github.io/llm-answer-watcher/llms-full.txt)** - Complete documentation (~59K tokens)

These files are auto-generated on every documentation build and provide structured, markdown-formatted content optimized for LLM context injection.

## Philosophy

LLM Answer Watcher is built on these principles:

- **Boring is Good**: Simple, readable code over clever abstractions
- **Local-First**: Your data stays on your machine
- **Production-Ready**: Proper error handling, retry logic, and security from day one
- **Data is the Moat**: Historical SQLite tracking provides long-term value
- **Developer Experience**: Both human-friendly and AI agent-ready interfaces

## Next Steps

<div class="grid cards" markdown>

-   :material-rocket-launch: **Quick Start**

    ---

    Install and run your first monitoring job in minutes.

    [Get Started →](getting-started/quick-start.md)

-   :material-file-cog: **Configuration**

    ---

    Learn how to configure models, brands, and intents.

    [Configuration Guide →](user-guide/configuration/overview.md)

-   :material-code-braces: **Examples**

    ---

    See real-world examples for common use cases.

    [View Examples →](examples/basic-monitoring.md)

-   :material-chart-line: **Analytics**

    ---

    Query your data with SQL for powerful insights.

    [Data & Analytics →](data-analytics/sqlite-database.md)

</div>

## Community & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/nibzard/llm-answer-watcher/issues)
- **Contributing**: [Read our contributing guide](contributing/development-setup.md)
- **License**: MIT - see [LICENSE](https://github.com/nibzard/llm-answer-watcher/blob/main/LICENSE)

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/nibzard">Nikola Balić</a></sub>
</div>
