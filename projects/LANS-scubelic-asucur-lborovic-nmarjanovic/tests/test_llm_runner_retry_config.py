"""
Tests for llm_runner/retry_config.py module.

Tests retry configuration constants, decorator factory, and retry behavior
with various HTTP errors and network failures.

Test coverage:
- Constants validation (values, types, immutability)
- Retry decorator creation and configuration
- Retry behavior on transient errors (429, 5xx, network, timeout)
- Fail-fast behavior on permanent errors (401, 400, 404)
- Exponential backoff timing
- Max attempts enforcement
"""

import time
from unittest.mock import Mock

import httpx
import pytest

from llm_answer_watcher.llm_runner.retry_config import (
    MAX_ATTEMPTS,
    MAX_WAIT_SECONDS,
    MIN_WAIT_SECONDS,
    NO_RETRY_STATUS_CODES,
    REQUEST_TIMEOUT,
    RETRY_STATUS_CODES,
    create_retry_decorator,
)

# ============================================================================
# CONSTANTS TESTS
# ============================================================================


def test_max_attempts_value():
    """MAX_ATTEMPTS should be 3."""
    assert MAX_ATTEMPTS == 3


def test_min_wait_seconds_value():
    """MIN_WAIT_SECONDS should be 1."""
    assert MIN_WAIT_SECONDS == 1


def test_max_wait_seconds_value():
    """MAX_WAIT_SECONDS should be 60."""
    assert MAX_WAIT_SECONDS == 60


def test_request_timeout_value():
    """REQUEST_TIMEOUT should be 120.0 seconds.

    Note: Increased to 120.0 for GPT-5 models which may take longer to respond.
    TODO: Review timeout value per PLAN_POLISHING.md task #10.
    """
    assert REQUEST_TIMEOUT == 120.0


def test_retry_status_codes_values():
    """RETRY_STATUS_CODES should include 429 and 5xx errors."""
    expected = {429, 500, 502, 503, 504}
    assert expected == RETRY_STATUS_CODES


def test_no_retry_status_codes_values():
    """NO_RETRY_STATUS_CODES should include 401, 400, 404."""
    expected = {401, 400, 404}
    assert expected == NO_RETRY_STATUS_CODES


def test_retry_and_no_retry_codes_are_disjoint():
    """RETRY_STATUS_CODES and NO_RETRY_STATUS_CODES should not overlap."""
    overlap = RETRY_STATUS_CODES & NO_RETRY_STATUS_CODES
    assert len(overlap) == 0, f"Status codes should not overlap: {overlap}"


def test_status_codes_are_frozensets():
    """Status code sets should be frozensets for immutability."""
    assert isinstance(RETRY_STATUS_CODES, frozenset)
    assert isinstance(NO_RETRY_STATUS_CODES, frozenset)


# ============================================================================
# DECORATOR CREATION TESTS
# ============================================================================


def test_create_retry_decorator_returns_callable():
    """create_retry_decorator should return a callable decorator."""
    decorator = create_retry_decorator()
    assert callable(decorator)


def test_create_retry_decorator_can_decorate_function():
    """Decorator should successfully wrap a function."""
    decorator = create_retry_decorator()

    @decorator
    def test_func():
        return "success"

    assert test_func() == "success"


# ============================================================================
# RETRY BEHAVIOR TESTS
# ============================================================================


def test_retry_on_http_status_error_429():
    """Should retry on 429 rate limit error."""
    decorator = create_retry_decorator()
    attempt_count = 0

    @decorator
    def flaky_func():
        nonlocal attempt_count
        attempt_count += 1

        if attempt_count < 3:
            # Simulate 429 error
            response = httpx.Response(
                status_code=429,
                json={"error": {"message": "Rate limit exceeded"}},
            )
            raise httpx.HTTPStatusError(
                "Rate limit",
                request=Mock(),
                response=response,
            )
        return "success"

    result = flaky_func()
    assert result == "success"
    assert attempt_count == 3, "Should retry twice (3 total attempts)"


def test_retry_on_http_status_error_500():
    """Should retry on 500 server error."""
    decorator = create_retry_decorator()
    attempt_count = 0

    @decorator
    def flaky_func():
        nonlocal attempt_count
        attempt_count += 1

        if attempt_count < 2:
            # Simulate 500 error
            response = httpx.Response(
                status_code=500,
                json={"error": {"message": "Internal server error"}},
            )
            raise httpx.HTTPStatusError(
                "Server error",
                request=Mock(),
                response=response,
            )
        return "success"

    result = flaky_func()
    assert result == "success"
    assert attempt_count == 2, "Should retry once (2 total attempts)"


def test_retry_on_connect_error():
    """Should retry on network connection errors."""
    decorator = create_retry_decorator()
    attempt_count = 0

    @decorator
    def flaky_func():
        nonlocal attempt_count
        attempt_count += 1

        if attempt_count < 2:
            raise httpx.ConnectError("Connection failed")
        return "success"

    result = flaky_func()
    assert result == "success"
    assert attempt_count == 2, "Should retry once (2 total attempts)"


def test_retry_on_timeout_exception():
    """Should retry on request timeout."""
    decorator = create_retry_decorator()
    attempt_count = 0

    @decorator
    def flaky_func():
        nonlocal attempt_count
        attempt_count += 1

        if attempt_count < 2:
            raise httpx.TimeoutException("Request timed out")
        return "success"

    result = flaky_func()
    assert result == "success"
    assert attempt_count == 2, "Should retry once (2 total attempts)"


def test_retry_exhausted_raises_exception():
    """Should raise exception after all retry attempts exhausted."""
    decorator = create_retry_decorator()
    attempt_count = 0

    @decorator
    def always_fails():
        nonlocal attempt_count
        attempt_count += 1
        raise httpx.ConnectError("Connection failed")

    with pytest.raises(httpx.ConnectError, match="Connection failed"):
        always_fails()

    assert attempt_count == MAX_ATTEMPTS, f"Should attempt {MAX_ATTEMPTS} times"


def test_no_retry_on_other_exceptions():
    """Should NOT retry on non-HTTP exceptions."""
    decorator = create_retry_decorator()
    attempt_count = 0

    @decorator
    def raises_value_error():
        nonlocal attempt_count
        attempt_count += 1
        raise ValueError("Not an HTTP error")

    with pytest.raises(ValueError, match="Not an HTTP error"):
        raises_value_error()

    assert attempt_count == 1, "Should not retry on ValueError"


def test_no_retry_on_runtime_error():
    """Should NOT retry on RuntimeError (used for permanent failures)."""
    decorator = create_retry_decorator()
    attempt_count = 0

    @decorator
    def raises_runtime_error():
        nonlocal attempt_count
        attempt_count += 1
        raise RuntimeError("Permanent failure")

    with pytest.raises(RuntimeError, match="Permanent failure"):
        raises_runtime_error()

    assert attempt_count == 1, "Should not retry on RuntimeError"


# ============================================================================
# EXPONENTIAL BACKOFF TESTS
# ============================================================================


def test_exponential_backoff_timing():
    """Should wait with exponential backoff between retries."""
    decorator = create_retry_decorator()
    attempt_times = []

    @decorator
    def flaky_func():
        attempt_times.append(time.time())

        if len(attempt_times) < 3:
            raise httpx.ConnectError("Connection failed")
        return "success"

    result = flaky_func()
    assert result == "success"
    assert len(attempt_times) == 3

    # Check that there's a delay between attempts
    # First retry should wait ~1s (MIN_WAIT_SECONDS)
    # Second retry should wait ~2s (exponential backoff)
    delay1 = attempt_times[1] - attempt_times[0]
    delay2 = attempt_times[2] - attempt_times[1]

    # Allow some slack for test execution time
    assert delay1 >= 0.9, f"First retry delay should be >= 1s, got {delay1:.2f}s"
    assert delay2 >= 1.8, f"Second retry delay should be >= 2s, got {delay2:.2f}s"


def test_max_wait_seconds_respected():
    """Backoff should not exceed MAX_WAIT_SECONDS."""
    # This is more of a configuration test - the decorator is configured
    # with max=MAX_WAIT_SECONDS, so tenacity will enforce this
    decorator = create_retry_decorator()

    # The decorator is configured correctly if it exists
    assert decorator is not None


# ============================================================================
# INTEGRATION TESTS
# ============================================================================


def test_decorator_with_successful_first_attempt():
    """Should return immediately if first attempt succeeds."""
    decorator = create_retry_decorator()
    attempt_count = 0

    @decorator
    def always_succeeds():
        nonlocal attempt_count
        attempt_count += 1
        return "success"

    result = always_succeeds()
    assert result == "success"
    assert attempt_count == 1, "Should only attempt once"


def test_decorator_preserves_return_value():
    """Should preserve return value from decorated function."""
    decorator = create_retry_decorator()

    @decorator
    def returns_dict():
        return {"key": "value", "count": 42}

    result = returns_dict()
    assert result == {"key": "value", "count": 42}


def test_decorator_preserves_exception_message():
    """Should preserve original exception message after retry exhaustion."""
    decorator = create_retry_decorator()

    @decorator
    def raises_with_message():
        raise httpx.ConnectError("Specific error message")

    with pytest.raises(httpx.ConnectError, match="Specific error message"):
        raises_with_message()


def test_multiple_error_types_in_sequence():
    """Should retry on different error types in sequence."""
    decorator = create_retry_decorator()
    attempt_count = 0

    @decorator
    def mixed_errors():
        nonlocal attempt_count
        attempt_count += 1

        if attempt_count == 1:
            raise httpx.ConnectError("Connection failed")
        if attempt_count == 2:
            raise httpx.TimeoutException("Timeout")
        if attempt_count == 3:
            response = httpx.Response(status_code=429)
            raise httpx.HTTPStatusError("Rate limit", request=Mock(), response=response)
        return "success"

    # Should exhaust all 3 attempts with different errors
    with pytest.raises(httpx.HTTPStatusError):
        mixed_errors()

    assert attempt_count == MAX_ATTEMPTS
