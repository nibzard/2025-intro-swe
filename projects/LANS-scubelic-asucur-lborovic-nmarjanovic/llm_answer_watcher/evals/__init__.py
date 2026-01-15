"""
Evaluation Framework for LLM Answer Watcher.

This module provides comprehensive evaluation capabilities to test pipeline correctness,
catch extraction regressions, and future-proof the product for Cloud deployment.
"""

from .metrics import compute_mention_metrics, compute_rank_metrics
from .runner import run_eval_suite
from .schema import EvalMetricScore, EvalResult, EvalTestCase

__all__ = [
    "EvalMetricScore",
    "EvalResult",
    "EvalTestCase",
    "compute_mention_metrics",
    "compute_rank_metrics",
    "run_eval_suite",
]
