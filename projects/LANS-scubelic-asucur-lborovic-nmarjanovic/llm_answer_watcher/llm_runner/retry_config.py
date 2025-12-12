"""
Retry configuration for LLM API calls.

Centralized retry logic configuration using tenacity for exponential backoff
and intelligent error handling. Used by all LLM client implementations to
ensure consistent retry behavior across providers.

Key features:
- Exponential backoff with configurable min/max wait times
- Differentiated handling of transient vs permanent errors
- Timeout configuration for HTTP requests
- Retry on network errors and server errors (429, 5xx)
- Fail fast on client errors (401, 400, 404)

Constants are designed to balance:
- User experience (don't wait too long)
- API rate limits (respect 429 responses)
- Cost optimization (don't burn tokens on repeated failures)
- Reliability (retry transient failures)

Example:
    >>> from llm_runner.retry_config import create_retry_decorator
    >>> @create_retry_decorator()
    ... def call_llm_api():
    ...     # Will retry on 429, 5xx with exponential backoff
    ...     pass
"""

import httpx
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

# ============================================================================
# RETRY CONSTANTS
# ============================================================================

# Maximum number of retry attempts (including initial attempt)
# Total attempts = 1 initial + 2 retries = 3 attempts
MAX_ATTEMPTS = 3

# Minimum wait time between retries (seconds)
# First retry waits at least this long
MIN_WAIT_SECONDS = 1

# Maximum wait time between retries (seconds)
# Caps exponential backoff to prevent excessive waiting
# With multiplier=1, backoff sequence: 2s, 4s, 8s, 16s, ...
# This caps it at 60s per SPECS.md recommendations
MAX_WAIT_SECONDS = 60

# HTTP status codes that should trigger a retry
# 429: Rate limit exceeded (temporary, will clear)
# 500-504: Server errors (temporary, might recover)
RETRY_STATUS_CODES = frozenset([429, 500, 502, 503, 504])

# HTTP status codes that should NOT trigger a retry
# 401: Unauthorized (API key invalid, won't fix with retry)
# 400: Bad request (malformed request, won't fix with retry)
# 404: Not found (endpoint doesn't exist, won't fix with retry)
NO_RETRY_STATUS_CODES = frozenset([401, 400, 404])

# HTTP request timeout in seconds
# Applies to each individual request attempt
# Protects against hung connections
# Increased for GPT-5 models which may take longer to respond
REQUEST_TIMEOUT = 120.0

# ============================================================================
# RETRY DECORATOR FACTORY
# ============================================================================


def create_retry_decorator():
    """
    Create a tenacity retry decorator for LLM API calls.

    Returns a configured retry decorator with:
    - Exponential backoff (1s min, 60s max)
    - Max 3 attempts total
    - Retry on: httpx.HTTPStatusError, httpx.ConnectError, httpx.TimeoutException
    - Caller must check status codes to fail fast on permanent errors

    Returns:
        Retry decorator configured for LLM API resilience

    Example:
        >>> @create_retry_decorator()
        ... def make_api_call():
        ...     # Check for non-retryable errors first
        ...     if response.status_code in NO_RETRY_STATUS_CODES:
        ...         raise RuntimeError("Permanent error")
        ...     # Raise for retryable errors (will be retried)
        ...     response.raise_for_status()

    Note:
        The caller is responsible for checking NO_RETRY_STATUS_CODES and
        raising RuntimeError (or other non-retryable exception) to prevent
        retries on permanent errors.

        The decorator will automatically retry on:
        - httpx.HTTPStatusError (for retryable status codes)
        - httpx.ConnectError (network issues)
        - httpx.TimeoutException (request timeouts)

    Design rationale:
        - Uses wait_exponential with multiplier=1 for simple 2^n backoff
        - Starts at MIN_WAIT_SECONDS (1s) to give servers time to recover
        - Caps at MAX_WAIT_SECONDS (60s) to prevent excessive waiting
        - Reraises exception after all attempts to preserve stack trace
    """
    return retry(
        stop=stop_after_attempt(MAX_ATTEMPTS),
        wait=wait_exponential(
            multiplier=1,
            min=MIN_WAIT_SECONDS,
            max=MAX_WAIT_SECONDS,
        ),
        retry=retry_if_exception_type(
            (
                httpx.HTTPStatusError,
                httpx.ConnectError,
                httpx.TimeoutException,
            )
        ),
        reraise=True,
    )
