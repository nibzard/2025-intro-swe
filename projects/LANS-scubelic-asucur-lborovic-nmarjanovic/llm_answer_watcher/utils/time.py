"""
UTC timestamp utilities for LLM Answer Watcher.

All timestamps MUST be in UTC with explicit timezone markers.
Enforced by ruff DTZ rules to prevent naive datetime usage.

This module provides:
- utc_now(): Current time as timezone-aware datetime
- utc_timestamp(): ISO 8601 timestamp string with 'Z' suffix
- run_id_from_timestamp(): Filesystem-safe timestamp slug for run IDs
- parse_timestamp(): Parse ISO 8601 string to datetime

Examples:
    >>> from utils.time import utc_now, utc_timestamp, run_id_from_timestamp
    >>> now = utc_now()
    >>> now.tzinfo
    datetime.timezone.utc
    >>> timestamp = utc_timestamp()
    >>> timestamp
    '2025-11-02T08:30:45Z'
    >>> run_id = run_id_from_timestamp()
    >>> run_id
    '2025-11-02T08-30-45Z'
"""

from datetime import UTC, datetime


def utc_now() -> datetime:
    """
    Return current time in UTC with timezone info.

    Returns timezone-aware datetime object set to UTC.
    This is the canonical way to get current time in the codebase.

    Returns:
        datetime: Current UTC time with tzinfo=timezone.utc

    Example:
        >>> now = utc_now()
        >>> now.tzinfo == timezone.utc
        True
        >>> now.tzname()
        'UTC'

    Note:
        NEVER use datetime.now() without timezone parameter.
        NEVER use datetime.utcnow() (deprecated, returns naive datetime).
        Always use utc_now() for consistency and ruff DTZ compliance.
    """
    return datetime.now(UTC)


def utc_timestamp() -> str:
    """
    Return ISO 8601 timestamp string with 'Z' suffix.

    Format: YYYY-MM-DDTHH:MM:SSZ (with colons in time)
    Example: 2025-11-02T08:30:45Z

    Returns:
        str: ISO 8601 formatted timestamp in UTC

    Example:
        >>> timestamp = utc_timestamp()
        >>> timestamp.endswith('Z')
        True
        >>> 'T' in timestamp
        True

    Note:
        Used for database storage, JSON artifacts, and logging.
        The 'Z' suffix explicitly indicates UTC timezone.
    """
    return utc_now().strftime("%Y-%m-%dT%H:%M:%SZ")


def run_id_from_timestamp(dt: datetime | None = None) -> str:
    """
    Generate run_id slug from UTC timestamp.

    Format: YYYY-MM-DDTHH-MM-SSZ (hyphens instead of colons)
    Example: 2025-11-02T08-30-45Z

    This format is filesystem-safe (no colons) and sorts chronologically.
    Used for creating run output directories and as the primary key in SQLite.

    Args:
        dt: Optional datetime to convert. If None, uses utc_now().
            Must be timezone-aware if provided.

    Returns:
        str: Filesystem-safe timestamp slug

    Raises:
        ValueError: If dt is provided but is naive (missing timezone)

    Examples:
        >>> run_id = run_id_from_timestamp()
        >>> run_id.endswith('Z')
        True
        >>> '-' in run_id.split('T')[1]  # Time has hyphens, not colons
        True

        >>> from datetime import datetime, timezone
        >>> fixed_time = datetime(2025, 11, 2, 8, 30, 45, tzinfo=timezone.utc)
        >>> run_id_from_timestamp(fixed_time)
        '2025-11-02T08-30-45Z'

        >>> naive_time = datetime(2025, 11, 2, 8, 30, 45)
        >>> run_id_from_timestamp(naive_time)
        Traceback (most recent call last):
        ...
        ValueError: Datetime must be timezone-aware (use timezone.utc)

    Note:
        Hyphens replace colons to ensure compatibility with Windows filesystems
        and URLs. The format still maintains chronological sorting.
    """
    if dt is None:
        dt = utc_now()

    # Validate timezone awareness
    if dt.tzinfo is None:
        raise ValueError(
            "Datetime must be timezone-aware (use timezone.utc). "
            "Got naive datetime. Use utc_now() or ensure dt has tzinfo set."
        )

    return dt.strftime("%Y-%m-%dT%H-%M-%SZ")


def parse_timestamp(timestamp_str: str) -> datetime:
    """
    Parse ISO 8601 timestamp string to timezone-aware datetime.

    Expects format: YYYY-MM-DDTHH:MM:SSZ (with 'Z' suffix for UTC)
    Returns datetime with tzinfo=timezone.utc

    Args:
        timestamp_str: ISO 8601 timestamp string ending with 'Z'

    Returns:
        datetime: Timezone-aware datetime in UTC

    Raises:
        ValueError: If timestamp doesn't end with 'Z' or has invalid format

    Examples:
        >>> dt = parse_timestamp('2025-11-02T08:30:45Z')
        >>> dt.tzinfo == timezone.utc
        True
        >>> dt.year
        2025

        >>> parse_timestamp('2025-11-02T08:30:45')
        Traceback (most recent call last):
        ...
        ValueError: Timestamp must end with 'Z' (UTC): 2025-11-02T08:30:45

        >>> parse_timestamp('invalid')
        Traceback (most recent call last):
        ...
        ValueError: Invalid ISO 8601 timestamp format: invalid

    Note:
        This function is strict about the 'Z' suffix to ensure all timestamps
        are explicitly marked as UTC. Use this for parsing timestamps from
        database queries, JSON files, or user input.
    """
    if not timestamp_str.endswith("Z"):
        raise ValueError(f"Timestamp must end with 'Z' (UTC): {timestamp_str}")

    try:
        # Replace 'Z' with '+00:00' for fromisoformat compatibility
        # Python's fromisoformat doesn't handle 'Z' directly before 3.11
        return datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
    except ValueError as e:
        raise ValueError(f"Invalid ISO 8601 timestamp format: {timestamp_str}") from e
