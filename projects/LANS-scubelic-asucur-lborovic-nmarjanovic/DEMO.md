# LLM Answer Watcher - asciinema Demo

This directory contains an asciinema recording and animated GIF demonstrating the LLM Answer Watcher tool in action.

## Files

- **demo.cast** - asciinema recording (144KB, ~30 seconds, 80x24 terminal)
- **demo.gif** - Animated GIF for social media (266KB, 688x490px, Monokai theme)
- **demo.config.yaml** - Demo configuration file
- **demo-clean.sh** - Recording script

## What's in the Demo

The demo showcases:

1. **Configuration Validation** - Validates a YAML config with brand and competitor definitions
2. **Brand Monitoring Execution** - Runs queries against OpenAI GPT-4o-mini
3. **Rich CLI Output** - Beautiful progress bars and status indicators
4. **Results Summary** - Shows generated outputs (JSON, HTML reports, SQLite database)

## How to Play the Recording

### Option 1: Play Locally with asciinema

```bash
# Install asciinema
pip install asciinema

# Play the recording
asciinema play demo.cast
```

### Option 2: Upload to asciinema.org

```bash
# Upload to asciinema.org (requires account)
asciinema upload demo.cast
```

This will give you a shareable URL like: `https://asciinema.org/a/123456`

### Option 3: Embed in Website

```html
<script src="https://asciinema.org/a/123456.js" id="asciicast-123456" async></script>
```

### Option 4: Use the Pre-Generated GIF (Quickest!)

The `demo.gif` file is already included and ready to use on social media!

**To regenerate the GIF:**
```bash
# Install agg (asciinema GIF generator)
cargo install --git https://github.com/asciinema/agg

# Convert with custom settings
agg --theme monokai --font-size 14 --speed 1.2 demo.cast demo.gif

# Or use asciicast2gif (Python-based)
pip install asciicast2gif
asciicast2gif -s 2 demo.cast demo.gif
```

## Demo Configuration

The demo uses a simple configuration (`demo.config.yaml`):

- **Brand**: Firecrawl (web scraping tool)
- **Competitors**: Scrapy, Beautiful Soup, Puppeteer, Selenium, Playwright
- **Queries**: 2 buyer-intent questions about web scraping tools
- **Model**: OpenAI GPT-4o-mini (fast and cheap)

## Sharing on Social Media

### Twitter/X

```
🚀 Check out LLM Answer Watcher - monitor how AI recommends YOUR brand vs competitors!

📊 Track brand mentions across ChatGPT, Claude, Gemini & more
💾 Historical data in SQLite
📈 Beautiful HTML reports

Demo: [asciinema link]
Repo: https://github.com/nibzard/llm-answer-watcher
```

### LinkedIn

```
Introducing LLM Answer Watcher 🎯

As LLMs become the new search engines, monitoring your brand's presence in AI-generated recommendations is critical.

This open-source CLI tool helps you:
✅ Track brand mentions in LLM responses
✅ Compare against competitors
✅ Analyze trends over time
✅ Support for OpenAI, Anthropic, Google, Mistral, Grok, Perplexity

Watch the demo: [asciinema link]
```

### Reddit (r/programming, r/MachineLearning, r/Python)

```
[Show HN] LLM Answer Watcher - Monitor brand mentions in AI-generated recommendations

As LLMs replace search engines, tracking how they recommend your product vs competitors is becoming essential for SEO/marketing teams.

Built an open-source CLI tool that:
- Queries LLMs with buyer-intent questions
- Extracts brand mentions and rankings
- Stores results in SQLite for trend analysis
- Generates beautiful HTML reports

Tech stack: Python 3.12+, Pydantic, Rich, SQLite, Jinja2
Demo: [asciinema link]
```

## Re-recording the Demo

To create a new recording:

```bash
# Make sure you have the tool installed
source .venv/bin/activate

# Record a new demo
asciinema rec demo.cast --overwrite --idle-time-limit 2 --title "LLM Answer Watcher - Brand Monitoring Demo" --command "./demo-clean.sh"
```

## Files

- `demo.cast` - The asciinema recording
- `demo.config.yaml` - Demo configuration file
- `demo-clean.sh` - Script that runs the demo
- `DEMO.md` - This file
