"""
Browser-based intent runners for LLM Answer Watcher.

This package provides browser automation runners that interact with web-based
LLM interfaces like ChatGPT, Perplexity, and Claude. These runners use headless
browser automation (via Steel API or Playwright) to execute intents and extract
results from actual web UIs.

Modules:
    steel_base: Base class for Steel API browser automation
    steel_chatgpt: ChatGPT web interface runner using Steel
    steel_perplexity: Perplexity web interface runner using Steel

Why browser runners:
    - Capture true user experience (web UI behavior differs from API)
    - Access web search, plugins, and UI-specific features
    - Test what actual users see when searching for brands
    - Bypass API limitations or availability issues
"""
