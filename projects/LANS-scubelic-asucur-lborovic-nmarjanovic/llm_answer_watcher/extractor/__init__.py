"""
Extractor module for parsing LLM responses and detecting brand mentions.

This module provides functionality to extract structured signals from LLM
answers, including brand mention detection and rank extraction.

Public API:
    - BrandMention: Dataclass representing a detected brand mention
    - detect_mentions: Detect brand mentions using word-boundary regex
    - create_brand_pattern: Create regex pattern for brand matching
    - normalize_brand_name: Get canonical brand name from aliases
"""

from llm_answer_watcher.extractor.mention_detector import (
    BrandMention,
    create_brand_pattern,
    detect_mentions,
    normalize_brand_name,
)

__all__ = [
    "BrandMention",
    "create_brand_pattern",
    "detect_mentions",
    "normalize_brand_name",
]
