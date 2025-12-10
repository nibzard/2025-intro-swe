"""
Cost formatting utilities for HTML report generation.

Provides consistent formatting of USD costs across report templates.
All costs are displayed with $ prefix and appropriate decimal precision.

This module provides:
- format_cost_usd: Format a single cost with $ prefix
- format_cost_summary: Calculate and format aggregate cost statistics

Examples:
    >>> from report.cost_formatter import format_cost_usd, format_cost_summary
    >>> format_cost_usd(0.0023)
    '$0.0023'
    >>> costs = [0.001, 0.002, 0.003]
    >>> summary = format_cost_summary(costs)
    >>> summary['total']
    '$0.0060'
"""

import logging
from statistics import mean

# Get logger for this module
logger = logging.getLogger(__name__)


def format_cost_usd(cost: float) -> str:
    """
    Format a cost value in USD with $ prefix and appropriate precision.

    Uses 4 decimal places for typical LLM API costs in the $0.0001-$1.00 range.
    For very small costs (< $0.0001), uses 6 decimal places to avoid showing $0.0000.

    Args:
        cost: Cost value in USD (must be non-negative)

    Returns:
        str: Formatted cost string with $ prefix (e.g., "$0.0023" or "$0.000012")

    Raises:
        ValueError: If cost is negative

    Examples:
        >>> format_cost_usd(0.0023)
        '$0.0023'

        >>> format_cost_usd(1.5678)
        '$1.5678'

        >>> format_cost_usd(0.0)
        '$0.0000'

        >>> # Very small costs use 6 decimals
        >>> format_cost_usd(0.000012)
        '$0.000012'

        >>> # Large costs also use 4 decimals
        >>> format_cost_usd(123.4567)
        '$123.4567'

        >>> format_cost_usd(-0.01)
        Traceback (most recent call last):
        ...
        ValueError: Cost cannot be negative: -0.01

    Note:
        - Precision matches utils.cost.estimate_cost (6 decimals)
        - For display in reports, 4 decimals is usually sufficient
        - Very small costs (< $0.0001) use 6 decimals to show meaningful values
        - Costs are never rounded - precision is preserved from calculations
    """
    if cost < 0:
        raise ValueError(f"Cost cannot be negative: {cost}")

    # Use 6 decimals for very small costs to avoid showing $0.0000
    # Use 4 decimals for typical costs
    if 0 < cost < 0.0001:
        return f"${cost:.6f}"

    return f"${cost:.4f}"


def format_cost_summary(costs: list[float]) -> dict:
    """
    Calculate aggregate cost statistics and return formatted strings.

    Computes total, minimum, maximum, and average costs from a list
    of cost values. Returns a dictionary with formatted USD strings
    for each statistic.

    Args:
        costs: List of cost values in USD (must all be non-negative)

    Returns:
        dict: Dictionary with formatted cost strings:
            - "total": Sum of all costs
            - "min": Minimum cost
            - "max": Maximum cost
            - "average": Mean cost
            All values are formatted with format_cost_usd()

    Raises:
        ValueError: If any cost is negative
        ValueError: If costs list is empty

    Examples:
        >>> costs = [0.001, 0.002, 0.003]
        >>> summary = format_cost_summary(costs)
        >>> summary['total']
        '$0.0060'
        >>> summary['min']
        '$0.0010'
        >>> summary['max']
        '$0.0030'
        >>> summary['average']
        '$0.0020'

        >>> # Single cost
        >>> summary = format_cost_summary([0.0023])
        >>> summary['total']
        '$0.0023'
        >>> summary['average']
        '$0.0023'

        >>> # Edge case: all zeros
        >>> summary = format_cost_summary([0.0, 0.0, 0.0])
        >>> summary['total']
        '$0.0000'

        >>> # Edge case: empty list
        >>> format_cost_summary([])
        Traceback (most recent call last):
        ...
        ValueError: Cannot calculate cost summary for empty list

        >>> # Edge case: negative cost
        >>> format_cost_summary([0.001, -0.002])
        Traceback (most recent call last):
        ...
        ValueError: Cost cannot be negative: -0.002

    Note:
        - Uses statistics.mean for average calculation
        - All values are formatted with format_cost_usd() for consistency
        - Returns formatted strings, not float values (ready for HTML templates)
        - Empty list raises ValueError (cannot compute statistics)
    """
    if not costs:
        raise ValueError("Cannot calculate cost summary for empty list")

    # Validate all costs are non-negative
    for cost in costs:
        if cost < 0:
            raise ValueError(f"Cost cannot be negative: {cost}")

    # Calculate statistics
    total = sum(costs)
    minimum = min(costs)
    maximum = max(costs)
    average = mean(costs)

    # Return formatted strings
    return {
        "total": format_cost_usd(total),
        "min": format_cost_usd(minimum),
        "max": format_cost_usd(maximum),
        "average": format_cost_usd(average),
    }
