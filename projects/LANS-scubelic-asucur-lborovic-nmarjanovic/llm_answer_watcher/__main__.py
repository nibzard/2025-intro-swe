"""
Entry point for running LLM Answer Watcher as a module.

Enables execution via:
    python -m llm_answer_watcher [command] [options]

This is equivalent to running the installed CLI:
    llm-answer-watcher [command] [options]

Examples:
    python -m llm_answer_watcher --help
    python -m llm_answer_watcher run --config examples/watcher.config.yaml
    python -m llm_answer_watcher demo
    python -m llm_answer_watcher validate --config config.yaml
"""

from llm_answer_watcher.cli import app

if __name__ == "__main__":
    app()
