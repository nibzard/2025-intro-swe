# Browser Runners Guide

> **⚠️ BETA FEATURE** - Browser runners were added on November 8, 2025 and are currently in BETA quality.
>
> **Known Limitations:**
> - Cost tracking returns $0.00 (placeholder - actual Steel API costs not yet calculated)
> - CSS selectors may break if web UIs change
> - ChatGPT authentication not fully documented
> - Response completion detection is heuristic-based
>
> **Suitable for:** Research, testing, screenshot capture, hobby/startup monitoring
> **Not recommended for:** Fully automated production systems relying on accurate cost tracking

## Overview

Browser runners enable LLM Answer Watcher to interact with web-based LLM interfaces like ChatGPT and Perplexity using headless browser automation. This captures the **true user experience** that differs from direct API access.

## Why Browser Runners?

### Key Differences: Browser UI vs API

| Aspect | API | Browser (ChatGPT/Perplexity) |
|--------|-----|------------------------------|
| **Web Search** | Optional tool calling | Integrated UI behavior |
| **Citations** | Structured JSON | Visual citations in response |
| **System Prompts** | Your control | Platform-specific defaults |
| **Rate Limits** | API quota | Web UI limits |
| **Cost** | Per token | Free tier or subscription |
| **Response Format** | Raw text | Formatted with markdown, links |

### Use Cases

1. **Verify API vs Web Consistency**: Check if your brand appears differently in ChatGPT web UI vs API
2. **Capture Visual Evidence**: Screenshots prove how brands are displayed
3. **Test Web-Specific Features**: Perplexity sources, ChatGPT citations
4. **Monitor Free Tier Behavior**: See what users without API access experience

## Supported Platforms

- ✅ **ChatGPT** (chat.openai.com) via Steel
- ✅ **Perplexity** (perplexity.ai) via Steel
- 🚧 **Claude** (claude.ai) - Coming soon
- 🚧 **Gemini** (gemini.google.com) - Coming soon

## Prerequisites

### 1. Steel API Account

Browser runners use [Steel](https://steel.dev) for headless browser automation.

```bash
# Sign up at https://steel.dev
# Get your API key from dashboard
export STEEL_API_KEY="your-steel-api-key"
```

**Steel Pricing** (as of 2025):
- **Hobby**: $0/month + $0.10/hour browser time (5 concurrent sessions)
- **Pro**: $49/month + $0.10/hour (20 concurrent sessions)
- **Enterprise**: Custom pricing

### 2. Optional: CAPTCHA Solver

Steel can integrate with CAPTCHA solvers for sites that require login:

```bash
# Optional: CapSolver API key
export CAPSOLVER_API_KEY="your-capsolver-key"
```

## Configuration

### Basic Example

```yaml
# watcher.config.yaml

runners:
  # Browser runner: ChatGPT via Steel
  - runner_plugin: "steel-chatgpt"
    config:
      steel_api_key: "${STEEL_API_KEY}"
      target_url: "https://chat.openai.com"
      session_timeout: 300
      wait_for_response_timeout: 60
      take_screenshots: true
      save_html_snapshot: true
      session_reuse: true

  # Browser runner: Perplexity via Steel
  - runner_plugin: "steel-perplexity"
    config:
      steel_api_key: "${STEEL_API_KEY}"
      target_url: "https://www.perplexity.ai"
      session_timeout: 300
      take_screenshots: true
      session_reuse: true

brands:
  mine: ["YourBrand"]
  competitors: ["CompetitorA", "CompetitorB"]

intents:
  - id: "crm-tools"
    prompt: "What are the best CRM tools?"
```

### Configuration Options

#### Common Options (All Browser Runners)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `steel_api_key` | string | **required** | Steel API key (use env var) |
| `target_url` | string | Platform URL | Starting URL for browser |
| `session_timeout` | int | 300 | Max session duration (seconds) |
| `wait_for_response_timeout` | int | 60 | Max wait for LLM response (seconds) |
| `take_screenshots` | bool | true | Capture screenshots |
| `save_html_snapshot` | bool | true | Save HTML snapshots |
| `session_reuse` | bool | true | Reuse sessions (faster, cheaper) |
| `solver` | string | "capsolver" | CAPTCHA solver service |
| `proxy` | string | null | Optional proxy config |
| `output_dir` | string | "./output" | Directory for artifacts |

#### ChatGPT-Specific Options

```yaml
- runner_plugin: "steel-chatgpt"
  config:
    steel_api_key: "${STEEL_API_KEY}"
    target_url: "https://chat.openai.com"
    # Add ChatGPT session token if needed
    # chatgpt_session_token: "${CHATGPT_SESSION_TOKEN}"
```

#### Perplexity-Specific Options

```yaml
- runner_plugin: "steel-perplexity"
  config:
    steel_api_key: "${STEEL_API_KEY}"
    target_url: "https://www.perplexity.ai"
    # Perplexity works without login
```

## Usage

### Run with Browser Runners

```bash
# Set environment variables
export STEEL_API_KEY="your-steel-api-key"

# Run with browser runner config
llm-answer-watcher run --config examples/watcher.config.browser-runners.yaml

# Output:
# ✓ Created Steel session: session-abc123
# ✓ Submitted prompt to ChatGPT: "What are the best CRM tools?"
# ✓ Extracted answer (2,345 chars)
# ✓ Screenshot saved: ./output/2025-11-06T10-30-00Z/screenshot_chatgpt_session-abc123.png
# ✓ HTML snapshot saved: ./output/2025-11-06T10-30-00Z/html_chatgpt_session-abc123.html
```

### Compare API vs Browser Results

```bash
# Run configuration with both API and browser runners
llm-answer-watcher run --config examples/watcher.config.browser-runners.yaml

# View comparison report
llm-answer-watcher report --run-id 2025-11-06T10-30-00Z
```

The HTML report will show:
- **API Response**: Direct from OpenAI API with web search
- **ChatGPT Browser**: Screenshot + extracted text from web UI
- **Perplexity Browser**: Screenshot + sources from Perplexity

### Artifacts Generated

Each browser run produces:

```
output/
└── 2025-11-06T10-30-00Z/
    ├── run_meta.json
    ├── screenshot_chatgpt_session-abc123.png     # Visual evidence
    ├── html_chatgpt_session-abc123.html          # Full HTML snapshot
    ├── intent_crm-tools_raw_chatgpt-web.json     # Structured data
    ├── intent_crm-tools_parsed_chatgpt-web.json  # Extracted mentions
    └── report.html                                # HTML report
```

## Architecture

### Plugin System

Browser runners integrate seamlessly via the plugin system:

```
IntentRunner (Protocol)
    ├── APIRunner (wraps LLMClient)
    │   ├── OpenAI
    │   ├── Anthropic
    │   └── Others...
    └── BrowserRunner (extends SteelBaseRunner)
        ├── SteelChatGPTRunner
        ├── SteelPerplexityRunner
        └── SteelClaudeRunner (coming soon)
```

### How It Works

1. **Session Creation**: Steel creates headless Chrome browser
2. **Navigation**: Runner navigates to target URL (chat.openai.com)
3. **Authentication**: Steel manages cookies/sessions automatically
4. **Prompt Submission**: Runner types prompt into UI
5. **Wait for Response**: Monitors DOM for response completion
6. **Extraction**: Scrapes answer text from page
7. **Artifacts**: Captures screenshot, HTML snapshot
8. **Cleanup**: Releases session (or reuses for next intent)

## Troubleshooting

### "Steel API key invalid"

```bash
# Verify your API key
echo $STEEL_API_KEY

# Test Steel access
curl -H "Authorization: Bearer $STEEL_API_KEY" https://api.steel.dev/v1/sessions
```

### "Session timeout exceeded"

Increase timeout if prompts are complex:

```yaml
config:
  session_timeout: 600  # 10 minutes
  wait_for_response_timeout: 120  # 2 minutes
```

### "CAPTCHA blocking"

Enable CAPTCHA solver:

```yaml
config:
  solver: "capsolver"  # or "2captcha", "anticaptcha"
  # Add solver API key to environment
```

### "Element not found"

Browser UI selectors may change. Check logs for details:

```bash
llm-answer-watcher run --config config.yaml --verbose
```

## Cost Management

> **⚠️ IMPORTANT**: Cost tracking for browser runners currently returns $0.00 in reports. This is a placeholder - you WILL be charged by Steel based on session duration. Monitor your Steel dashboard for actual costs.

### Browser Runner Costs

Browser runners have **zero LLM API cost** but incur Steel charges that are **not yet tracked** in LLM Answer Watcher cost estimates:

| Activity | Cost | Tracked in Reports? |
|----------|------|---------------------|
| API runners | Per token (normal rates) | ✅ Yes |
| Browser runners | $0.10-0.30/hour via Steel | ❌ **No** (shows $0.00) |
| CAPTCHA solving | $1-3 per 1,000 solves | ❌ No |

### Cost Optimization

1. **Enable Session Reuse**: Reuse sessions across intents
2. **Reduce Timeouts**: Lower `session_timeout` if possible
3. **Selective Screenshots**: Disable screenshots if not needed
4. **Batch Intents**: Run multiple intents per session

```yaml
config:
  session_reuse: true  # Reuse sessions (big cost savings)
  take_screenshots: false  # Skip if not needed
  session_timeout: 180  # Shorter timeout = lower cost
```

## Limitations

### Current Limitations (BETA Status)

1. **❌ No Cost Tracking**: Browser runner costs show $0.00 (placeholder - Steel charges not calculated)
2. **❌ No Token Tracking**: Browser responses don't expose token counts
3. **❌ No Model Detection**: Can't determine which ChatGPT model is used
4. **⚠️ Slower than API**: Browser automation adds 10-30s overhead per query
5. **⚠️ Rate Limits**: Subject to web UI rate limits (not API limits)
6. **⚠️ Fragile Selectors**: CSS selectors may break if ChatGPT/Perplexity UI changes
7. **⚠️ Limited CDP Implementation**: Full Steel CDP commands need implementation for advanced features

### Future Enhancements (Planned for v0.3.0)

- [ ] **Implement accurate cost tracking** based on Steel session duration (HIGH PRIORITY)
- [ ] Implement full Steel CDP commands for navigation/extraction
- [ ] Add web source extraction (citations, search results)
- [ ] Support Claude and Gemini web UIs
- [ ] Add browser action recording (interaction_steps)
- [ ] Add authentication documentation for ChatGPT login
- [ ] Add browser pool for parallel execution
- [ ] Support custom browser configurations (extensions, etc.)
- [ ] Implement retry logic for selector failures

## Plugin Development

Want to add a new browser runner? See [Plugin Development Guide](PLUGIN_DEVELOPMENT.md).

Example:

```python
from llm_answer_watcher.llm_runner.browser.steel_base import SteelBaseRunner
from llm_answer_watcher.llm_runner.plugin_registry import RunnerRegistry

@RunnerRegistry.register
class MyCustomBrowserPlugin:
    @classmethod
    def plugin_name(cls) -> str:
        return "my-browser"

    @classmethod
    def runner_type(cls) -> str:
        return "browser"

    # Implement other required methods...
```

## Resources

- [Steel Documentation](https://docs.steel.dev)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Plugin Development Guide](PLUGIN_DEVELOPMENT.md)
- [API vs Browser Comparison](../examples/comparison-report.html)

## Support

For issues with browser runners:

1. Check Steel API status: https://status.steel.dev
2. Review logs with `--verbose` flag
3. Report issues: https://github.com/nibzard/llm-answer-watcher/issues
4. Tag with `browser-runner` label
