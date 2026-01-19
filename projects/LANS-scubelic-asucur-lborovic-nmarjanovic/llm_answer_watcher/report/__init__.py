"""
HTML report generation module for LLM Answer Watcher.

This module generates beautiful, self-contained HTML reports from run results
with inline CSS, no external dependencies, and XSS protection via Jinja2 autoescaping.

Key exports:
    - generate_report: Generate HTML string from run data
    - write_report: Generate and write HTML report to disk
    - format_cost_usd: Format cost values for display
"""

from .cost_formatter import format_cost_summary, format_cost_usd
from .generator import generate_report, write_report

__all__ = [
    "format_cost_summary",
    "format_cost_usd",
    "generate_report",
    "write_report",
]
