"""
Tests for utils.time module - UTC timestamp utilities.

This module tests all time utility functions to ensure:
- All timestamps are timezone-aware (UTC)
- Formats match specifications (ISO 8601 with 'Z' suffix)
- Filesystem-safe run_id format (hyphens instead of colons)
- Proper error handling for naive datetimes and invalid inputs
- Deterministic behavior with time mocking (freezegun)

Coverage target: 100% (critical utility module)
"""

from datetime import UTC, datetime

import pytest
from freezegun import freeze_time

from llm_answer_watcher.utils.time import (
    parse_timestamp,
    run_id_from_timestamp,
    utc_now,
    utc_timestamp,
)


class TestUtcNow:
    """Test utc_now() function."""

    def test_returns_datetime_object(self):
        """utc_now() should return a datetime instance."""
        result = utc_now()
        assert isinstance(result, datetime)

    def test_has_utc_timezone(self):
        """utc_now() should return timezone-aware datetime with UTC."""
        result = utc_now()
        assert result.tzinfo is not None
        assert result.tzinfo == UTC

    def test_tzname_is_utc(self):
        """utc_now() timezone name should be 'UTC'."""
        result = utc_now()
        assert result.tzname() == "UTC"

    @freeze_time("2025-11-02 08:30:45")
    def test_frozen_time_returns_expected_datetime(self):
        """utc_now() should return frozen time when using freezegun."""
        result = utc_now()
        assert result.year == 2025
        assert result.month == 11
        assert result.day == 2
        assert result.hour == 8
        assert result.minute == 30
        assert result.second == 45


class TestUtcTimestamp:
    """Test utc_timestamp() function."""

    @freeze_time("2025-11-02 08:30:45")
    def test_format_is_iso8601_with_z_suffix(self):
        """utc_timestamp() should return ISO 8601 format with 'Z' suffix."""
        result = utc_timestamp()
        assert result == "2025-11-02T08:30:45Z"

    def test_contains_t_separator(self):
        """utc_timestamp() should contain 'T' separator between date and time."""
        result = utc_timestamp()
        assert "T" in result

    def test_ends_with_z(self):
        """utc_timestamp() should end with 'Z' to indicate UTC."""
        result = utc_timestamp()
        assert result.endswith("Z")

    @freeze_time("2025-11-02 08:30:45")
    def test_time_has_colons(self):
        """utc_timestamp() time portion should use colons (HH:MM:SS)."""
        result = utc_timestamp()
        time_portion = result.split("T")[1].rstrip("Z")
        assert ":" in time_portion
        assert time_portion == "08:30:45"

    def test_format_length_is_20_characters(self):
        """utc_timestamp() should be exactly 20 characters (YYYY-MM-DDTHH:MM:SSZ)."""
        result = utc_timestamp()
        assert len(result) == 20

    @freeze_time("2025-01-01 00:00:00")
    def test_midnight_formatting(self):
        """utc_timestamp() should correctly format midnight."""
        result = utc_timestamp()
        assert result == "2025-01-01T00:00:00Z"

    @freeze_time("2025-12-31 23:59:59")
    def test_end_of_year_formatting(self):
        """utc_timestamp() should correctly format end of year."""
        result = utc_timestamp()
        assert result == "2025-12-31T23:59:59Z"


class TestRunIdFromTimestamp:
    """Test run_id_from_timestamp() function."""

    @freeze_time("2025-11-02 08:30:45")
    def test_format_with_hyphens_instead_of_colons(self):
        """run_id_from_timestamp() should use hyphens in time (HH-MM-SS)."""
        result = run_id_from_timestamp()
        assert result == "2025-11-02T08-30-45Z"

    @freeze_time("2025-11-02 08:30:45")
    def test_default_uses_current_time(self):
        """run_id_from_timestamp() should use current time when dt=None."""
        result = run_id_from_timestamp(None)
        assert result == "2025-11-02T08-30-45Z"

    def test_accepts_timezone_aware_datetime(self):
        """run_id_from_timestamp() should accept timezone-aware datetime."""
        dt = datetime(2025, 11, 2, 8, 30, 45, tzinfo=UTC)
        result = run_id_from_timestamp(dt)
        assert result == "2025-11-02T08-30-45Z"

    def test_raises_on_naive_datetime(self):
        """run_id_from_timestamp() should raise ValueError for naive datetime."""
        naive_dt = datetime(2025, 11, 2, 8, 30, 45)
        with pytest.raises(ValueError) as exc_info:
            run_id_from_timestamp(naive_dt)
        assert "timezone-aware" in str(exc_info.value)
        assert "naive datetime" in str(exc_info.value)

    def test_ends_with_z(self):
        """run_id_from_timestamp() should end with 'Z' suffix."""
        result = run_id_from_timestamp()
        assert result.endswith("Z")

    def test_contains_t_separator(self):
        """run_id_from_timestamp() should contain 'T' separator."""
        result = run_id_from_timestamp()
        assert "T" in result

    @freeze_time("2025-11-02 08:30:45")
    def test_no_colons_in_time_portion(self):
        """run_id_from_timestamp() should have NO colons in time (filesystem-safe)."""
        result = run_id_from_timestamp()
        time_portion = result.split("T")[1].rstrip("Z")
        assert ":" not in time_portion
        assert time_portion == "08-30-45"

    def test_chronological_sorting(self):
        """run_id_from_timestamp() should produce chronologically sortable strings."""
        dt1 = datetime(2025, 11, 1, 10, 0, 0, tzinfo=UTC)
        dt2 = datetime(2025, 11, 2, 10, 0, 0, tzinfo=UTC)
        dt3 = datetime(2025, 11, 3, 10, 0, 0, tzinfo=UTC)

        id1 = run_id_from_timestamp(dt1)
        id2 = run_id_from_timestamp(dt2)
        id3 = run_id_from_timestamp(dt3)

        assert id1 < id2 < id3

    @freeze_time("2025-01-01 00:00:00")
    def test_midnight_formatting(self):
        """run_id_from_timestamp() should correctly format midnight."""
        result = run_id_from_timestamp()
        assert result == "2025-01-01T00-00-00Z"

    @freeze_time("2025-12-31 23:59:59")
    def test_end_of_year_formatting(self):
        """run_id_from_timestamp() should correctly format end of year."""
        result = run_id_from_timestamp()
        assert result == "2025-12-31T23-59-59Z"


class TestParseTimestamp:
    """Test parse_timestamp() function."""

    def test_parses_valid_iso8601_with_z(self):
        """parse_timestamp() should parse valid ISO 8601 timestamp with 'Z'."""
        result = parse_timestamp("2025-11-02T08:30:45Z")
        assert isinstance(result, datetime)
        assert result.year == 2025
        assert result.month == 11
        assert result.day == 2
        assert result.hour == 8
        assert result.minute == 30
        assert result.second == 45

    def test_returns_timezone_aware_datetime(self):
        """parse_timestamp() should return timezone-aware datetime."""
        result = parse_timestamp("2025-11-02T08:30:45Z")
        assert result.tzinfo is not None
        assert result.tzinfo == UTC

    def test_raises_on_missing_z_suffix(self):
        """parse_timestamp() should raise ValueError if 'Z' suffix is missing."""
        with pytest.raises(ValueError) as exc_info:
            parse_timestamp("2025-11-02T08:30:45")
        assert "must end with 'Z'" in str(exc_info.value)
        assert "2025-11-02T08:30:45" in str(exc_info.value)

    def test_raises_on_invalid_format(self):
        """parse_timestamp() should raise ValueError for invalid format."""
        # Test with string that has 'Z' but is otherwise invalid
        with pytest.raises(ValueError) as exc_info:
            parse_timestamp("invalidZ")
        assert "Invalid ISO 8601 timestamp format" in str(exc_info.value)
        assert "invalidZ" in str(exc_info.value)

    def test_raises_on_malformed_date(self):
        """parse_timestamp() should raise ValueError for malformed date."""
        with pytest.raises(ValueError) as exc_info:
            parse_timestamp("2025-13-45T08:30:45Z")  # Invalid month and day
        assert "Invalid ISO 8601 timestamp format" in str(exc_info.value)

    def test_parses_midnight(self):
        """parse_timestamp() should correctly parse midnight."""
        result = parse_timestamp("2025-01-01T00:00:00Z")
        assert result.hour == 0
        assert result.minute == 0
        assert result.second == 0

    def test_parses_end_of_day(self):
        """parse_timestamp() should correctly parse end of day."""
        result = parse_timestamp("2025-12-31T23:59:59Z")
        assert result.hour == 23
        assert result.minute == 59
        assert result.second == 59

    def test_roundtrip_with_utc_timestamp(self):
        """parse_timestamp() should roundtrip with utc_timestamp()."""
        original_timestamp = "2025-11-02T08:30:45Z"
        parsed = parse_timestamp(original_timestamp)
        regenerated = parsed.strftime("%Y-%m-%dT%H:%M:%SZ")
        assert regenerated == original_timestamp

    def test_raises_on_empty_string(self):
        """parse_timestamp() should raise ValueError for empty string."""
        with pytest.raises(ValueError) as exc_info:
            parse_timestamp("")
        assert "must end with 'Z'" in str(exc_info.value)

    def test_raises_on_whitespace(self):
        """parse_timestamp() should raise ValueError for whitespace."""
        with pytest.raises(ValueError) as exc_info:
            parse_timestamp("   ")
        assert "must end with 'Z'" in str(exc_info.value)


class TestIntegration:
    """Integration tests for time utilities working together."""

    @freeze_time("2025-11-02 08:30:45")
    def test_all_functions_use_same_frozen_time(self):
        """All time functions should use the same frozen time."""
        now = utc_now()
        timestamp = utc_timestamp()
        run_id = run_id_from_timestamp()

        # Verify they all represent the same moment
        assert now.strftime("%Y-%m-%dT%H:%M:%SZ") == timestamp
        assert now.strftime("%Y-%m-%dT%H-%M-%SZ") == run_id

    def test_utc_timestamp_can_be_parsed(self):
        """utc_timestamp() output should be parseable by parse_timestamp()."""
        timestamp = utc_timestamp()
        parsed = parse_timestamp(timestamp)
        assert isinstance(parsed, datetime)
        assert parsed.tzinfo == UTC

    def test_run_id_format_is_filesystem_safe(self):
        """run_id_from_timestamp() should not contain filesystem-unsafe chars."""
        run_id = run_id_from_timestamp()
        # Colons are problematic on Windows
        assert ":" not in run_id
        # Common unsafe characters
        assert "/" not in run_id
        assert "\\" not in run_id
        assert "*" not in run_id
        assert "?" not in run_id
        assert '"' not in run_id
        assert "<" not in run_id
        assert ">" not in run_id
        assert "|" not in run_id

    @freeze_time("2025-11-02 08:30:45")
    def test_consistency_across_multiple_calls(self):
        """Multiple calls in frozen time should return identical values."""
        timestamp1 = utc_timestamp()
        timestamp2 = utc_timestamp()
        timestamp3 = utc_timestamp()

        assert timestamp1 == timestamp2 == timestamp3

        run_id1 = run_id_from_timestamp()
        run_id2 = run_id_from_timestamp()
        run_id3 = run_id_from_timestamp()

        assert run_id1 == run_id2 == run_id3
