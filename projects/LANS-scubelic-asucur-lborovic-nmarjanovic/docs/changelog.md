# Changelog

All notable changes to LLM Answer Watcher will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Additional browser runners (Claude, Gemini web UIs)
- Enhanced cost tracking for browser runners
- DeepEval integration for quality metrics
- Trends command for historical analysis

## [0.2.0] - 2025-11-08

### Added - Major Features

- **🌐 Browser Runners (BETA)**: Steel API integration for web-based LLM interfaces
  - ChatGPT web UI runner with session management
  - Perplexity web UI runner with citation extraction
  - Screenshot capture and HTML snapshot support
  - Session reuse for cost optimization
  - Plugin system for extensible browser automation
  - See [Browser Runners Guide](BROWSER_RUNNERS.md) for details

- **⚡ Async/Await Parallelization**: 3-4x performance improvement
  - Parallel query execution across models
  - Async progress callbacks
  - RuntimeWarning fixes for async operations

- **🔍 Google Search Grounding**: Enhanced Gemini model support
  - Google Search grounding for Gemini models
  - Accurate web search cost calculation
  - Grounded responses with citations

- **🎯 Post-Intent Operations**: Dynamic workflow support
  - Configurable operations to run after each intent
  - Operation models with validation
  - Config filename tracking in reports
  - Model capability detection

- **📊 Advanced Analysis Features**:
  - **Sentiment Analysis**: Analyze tone (positive/neutral/negative) and context of each brand mention
  - **Intent Classification**: Classify user queries by intent type, buyer journey stage, and urgency signals
    - Intent types: transactional, informational, navigational, commercial_investigation
    - Buyer stages: awareness, consideration, decision
    - Urgency signals: high, medium, low
    - Confidence scoring and reasoning explanations
  - Brand visibility score in reports
  - HTML report filtering and web search badges

- **📚 Documentation Expansion**:
  - Comprehensive MkDocs documentation with Material theme (60+ pages)
  - Browser runners guide with Steel integration
  - Google Search grounding documentation
  - 44 example configurations across 8 directories

### Added - Database & Storage

- New database tables and columns for sentiment and intent data
  - `mentions` table: `sentiment` and `mention_context` columns
  - `intent_classifications` table with query hash caching
  - 5 new indexes for filtering by sentiment, context, intent type, buyer stage, and urgency
- SQLite schema version 5 (migration support included)

### Added - Configuration

- Configuration options: `enable_sentiment_analysis` and `enable_intent_classification` (both default true)
- Runner plugin configuration system
- Browser runner specific settings (Steel API, screenshots, sessions)

### Changed

- **Breaking**: Configuration format updated to support runner plugins
- Improved test coverage to 100% for core modules
- Enhanced error messages for better debugging
- Function calling extraction schema expanded with sentiment/context fields
- Correct Responses API format with required type field
- Improved validation, error handling, and config validation

### Fixed

- Database schema mismatches and exception handling in CLI
- Rank display in HTML reports (shows actual positions not match positions)
- GPT-4.1 model support in OpenAI client
- Code review findings (validation, error handling, config)
- RuntimeWarnings for async operations
- Indentation in runner loop to process all models

### Cost Impact

- Intent classification: ~$0.00012 per query (one-time per unique query, cached)
- Sentiment extraction: ~33% increase per extraction call (integrated into function calling)
- Browser runners: $0.10-0.30/hour via Steel (not yet tracked in cost estimates)

### Known Limitations (v0.2.0)

- Browser runner cost tracking returns $0.00 (placeholder - actual Steel costs not calculated)
- Browser runners are BETA quality (added Nov 8, 2025)
- CSS selectors for browser runners may break if web UIs change
- No authentication handling documented for ChatGPT login
- Response completion detection is heuristic-based

## [0.1.0] - 2025-11-05

### Added
- Initial release of LLM Answer Watcher
- Multi-provider support: OpenAI, Anthropic, Mistral, X.AI Grok, Google Gemini, Perplexity
- Brand mention detection with word-boundary matching
- Rank extraction (pattern-based and LLM-assisted)
- SQLite database for historical tracking
- HTML report generation with Jinja2
- Dual-mode CLI (human-friendly Rich output, structured JSON for automation)
- Budget controls and cost estimation
- Dynamic pricing from llm-prices.com with 24-hour caching
- Web search cost calculation for OpenAI models
- Retry logic with exponential backoff
- Evaluation framework for extraction accuracy
- Configuration validation with Pydantic
- Exit codes for automation (0-4)
- Example configurations
- Comprehensive test suite (750+ tests)
- GitHub Actions CI/CD pipeline

### Core Modules
- `config/`: YAML loading and Pydantic validation
- `llm_runner/`: Multi-provider LLM client abstraction
- `extractor/`: Brand mention detection and rank extraction
- `storage/`: SQLite schema and JSON writers
- `report/`: HTML report generation
- `utils/`: Time utilities, logging, cost estimation, Rich console
- `evals/`: Evaluation framework

### Supported Models
- **OpenAI**: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
- **Anthropic**: claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus
- **Mistral**: mistral-large-latest, mistral-small-latest
- **X.AI**: grok-beta, grok-2-1212, grok-2-latest, grok-3
- **Google**: gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash
- **Perplexity**: sonar, sonar-pro, sonar-reasoning

### Documentation
- README with quick start and examples
- CLAUDE.md with development guidelines
- CONTRIBUTING.md with contribution guidelines
- SPECS.md with complete engineering specification
- TODO.md with milestone tracking

### Security
- Environment variable-based API key management
- SQL injection prevention (parameterized queries)
- XSS prevention (Jinja2 autoescaping)
- No API key logging

## Release Notes

### Version 0.1.0 - Production Ready

This is the first production-ready release of LLM Answer Watcher. The tool is feature-complete for core brand monitoring use cases:

**Highlights**:
- ✅ 8,200 lines of production Python code
- ✅ 17,400 lines of test code (750+ tests)
- ✅ 100% coverage on critical paths
- ✅ 6 LLM providers supported
- ✅ Complete evaluation framework
- ✅ Full documentation

**What's Working**:
- All core features tested and validated
- Multi-provider queries with retry logic
- Accurate brand mention detection (90%+ precision)
- Historical tracking in SQLite
- Professional HTML reports
- Budget protection
- CI/CD integration

**Known Limitations** (v0.1.0 - resolved in v0.2.0):
- ~~No async support (intentionally - keeping it simple)~~ - **ADDED in v0.2.0**
- ~~Web search only for OpenAI models~~ - **Google Search grounding added in v0.2.0**
- Perplexity request fees not yet in cost estimates
- Trends command not yet implemented (data collection works)

**Upgrade Notes**:
- This is the initial release - no upgrades needed
- SQLite schema version 1
- Configuration format stable

## Future Roadmap

### Planned Features

**v0.2.0** - ✅ **RELEASED 2025-11-08**:
- ✅ Async support for parallel queries (3-4x faster)
- ✅ Enhanced web search support (Google Search grounding)
- ✅ Browser runners (BETA)
- ⏳ `trends` command for historical analysis (moved to v0.3.0)
- ⏳ Dashboard UI for visualizing trends (moved to v0.3.0)
- ⏳ DeepEval integration for quality metrics (moved to v0.3.0)

**v0.3.0** (Q1 2025):
- `trends` command for historical analysis
- Dashboard UI for visualizing trends
- DeepEval integration for quality metrics
- Production-ready browser runners (cost tracking, authentication)
- Additional browser runners (Claude, Gemini web UIs)
- Cloud deployment option
- HTTP API (expose internal contract)
- Real-time alerts and webhooks
- Advanced analytics and insights
- Multi-user support

**v1.0.0** (Q3 2025):
- Enterprise features
- Advanced provider integrations
- Custom model support
- White-label options
- SaaS offering

## Contributing

We welcome contributions! See [CONTRIBUTING.md](contributing/development-setup.md) for guidelines.

## Links

- **Repository**: [github.com/nibzard/llm-answer-watcher](https://github.com/nibzard/llm-answer-watcher)
- **Issues**: [github.com/nibzard/llm-answer-watcher/issues](https://github.com/nibzard/llm-answer-watcher/issues)
- **Documentation**: This site
- **License**: MIT
