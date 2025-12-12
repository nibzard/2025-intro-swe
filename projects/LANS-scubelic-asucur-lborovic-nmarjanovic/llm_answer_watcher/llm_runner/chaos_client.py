"""
Chaos LLM client for resilience testing.

Provides ChaosLLMClient that randomly injects failures to test retry logic,
error handling, and system resilience under adverse conditions.

Example:
    >>> from llm_runner.chaos_client import ChaosLLMClient
    >>> client = ChaosLLMClient(
    ...     success_rate=0.5,  # 50% success rate
    ...     base_client=mock_client
    ... )
    >>> response = await client.generate_answer("test prompt")
    # May succeed or raise RuntimeError randomly
"""

import logging
import random
from dataclasses import dataclass

from llm_answer_watcher.llm_runner.models import LLMClient, LLMResponse

logger = logging.getLogger(__name__)


@dataclass
class ChaosLLMClient:
    """
    Chaos engineering client that randomly injects failures.

    Wraps a real LLMClient and probabilistically injects different types
    of failures to test retry logic, error handling, and resilience.

    Attributes:
        base_client: The underlying LLMClient to wrap
        success_rate: Probability of success (0.0 to 1.0). Default: 0.7 (70% success)
        rate_limit_prob: Probability of 429 rate limit error. Default: 0.1
        server_error_prob: Probability of 5xx server error. Default: 0.1
        timeout_prob: Probability of timeout error. Default: 0.05
        auth_error_prob: Probability of 401 auth error (non-retryable). Default: 0.05
        seed: Random seed for reproducible chaos. If None, uses random seed.

    Error types injected:
        - 429 Rate Limit: Simulates rate limiting (retryable)
        - 500 Internal Server Error: Simulates server issues (retryable)
        - 502 Bad Gateway: Simulates proxy issues (retryable)
        - 503 Service Unavailable: Simulates overload (retryable)
        - Timeout: Simulates network timeout (retryable)
        - 401 Unauthorized: Simulates auth failure (non-retryable)

    Example:
        >>> from llm_runner.mock_client import MockLLMClient
        >>> base = MockLLMClient(responses={"test": "answer"})
        >>> chaos = ChaosLLMClient(
        ...     base_client=base,
        ...     success_rate=0.5,  # 50% success
        ...     rate_limit_prob=0.2,  # 20% rate limits
        ...     seed=42  # Reproducible
        ... )
        >>> # May succeed or fail
        >>> try:
        ...     response = await chaos.generate_answer("test")
        ... except RuntimeError as e:
        ...     print(f"Chaos injected: {e}")
    """

    base_client: LLMClient
    success_rate: float = 0.7
    rate_limit_prob: float = 0.1
    server_error_prob: float = 0.1
    timeout_prob: float = 0.05
    auth_error_prob: float = 0.05
    seed: int | None = None

    def __post_init__(self):
        """Validate probabilities and initialize random state."""
        # Validate success_rate
        if not 0.0 <= self.success_rate <= 1.0:
            raise ValueError(f"success_rate must be between 0.0 and 1.0, got {self.success_rate}")

        # Validate individual error probabilities
        total_error_prob = (
            self.rate_limit_prob
            + self.server_error_prob
            + self.timeout_prob
            + self.auth_error_prob
        )

        if total_error_prob > 1.0:
            raise ValueError(
                f"Sum of error probabilities ({total_error_prob}) cannot exceed 1.0"
            )

        # Initialize random state
        if self.seed is not None:
            random.seed(self.seed)
            logger.info(f"ChaosLLMClient initialized with seed={self.seed} for reproducibility")
        else:
            logger.info("ChaosLLMClient initialized with random seed")

        logger.info(
            f"ChaosLLMClient configured: success_rate={self.success_rate}, "
            f"rate_limit={self.rate_limit_prob}, server_error={self.server_error_prob}, "
            f"timeout={self.timeout_prob}, auth_error={self.auth_error_prob}"
        )

    async def generate_answer(self, prompt: str) -> LLMResponse:
        """
        Generate answer with chaos injection.

        Randomly decides whether to:
        1. Succeed and call base_client (probability: success_rate)
        2. Inject a specific failure type (probability: failure_rate)

        Args:
            prompt: User intent prompt

        Returns:
            LLMResponse: Response from base_client if successful

        Raises:
            RuntimeError: If chaos injects a failure

        Example:
            >>> chaos = ChaosLLMClient(base_client=mock, success_rate=0.8)
            >>> response = await chaos.generate_answer("test")
            # 80% chance of success, 20% chance of error
        """
        # Decide outcome
        roll = random.random()

        # Success case
        if roll < self.success_rate:
            logger.debug("ChaosLLMClient: SUCCESS (calling base client)")
            return await self.base_client.generate_answer(prompt)

        # Failure case - determine which failure type
        failure_roll = random.random()
        cumulative_prob = 0.0

        # 429 Rate Limit
        cumulative_prob += self.rate_limit_prob
        if failure_roll < cumulative_prob:
            logger.warning("ChaosLLMClient: Injecting 429 Rate Limit error")
            raise RuntimeError(
                "Chaos injection: 429 Rate Limit - Too many requests. Please retry later."
            )

        # 5xx Server Error (500, 502, 503)
        cumulative_prob += self.server_error_prob
        if failure_roll < cumulative_prob:
            error_code = random.choice([500, 502, 503])
            error_messages = {
                500: "Internal Server Error - The server encountered an error",
                502: "Bad Gateway - Upstream server error",
                503: "Service Unavailable - Server is temporarily overloaded",
            }
            logger.warning(f"ChaosLLMClient: Injecting {error_code} error")
            raise RuntimeError(f"Chaos injection: {error_code} {error_messages[error_code]}")

        # Timeout
        cumulative_prob += self.timeout_prob
        if failure_roll < cumulative_prob:
            logger.warning("ChaosLLMClient: Injecting timeout error")
            raise RuntimeError("Chaos injection: Request timeout - Connection timed out")

        # 401 Unauthorized (non-retryable)
        cumulative_prob += self.auth_error_prob
        if failure_roll < cumulative_prob:
            logger.warning("ChaosLLMClient: Injecting 401 Unauthorized error (non-retryable)")
            raise RuntimeError(
                "Chaos injection: 401 Unauthorized - Invalid API key or authentication failed"
            )

        # If we get here, success (edge case due to floating point arithmetic)
        logger.debug("ChaosLLMClient: SUCCESS (fallback)")
        return await self.base_client.generate_answer(prompt)


def create_chaos_client(
    base_client: LLMClient,
    failure_rate: float = 0.3,
    seed: int | None = None,
) -> ChaosLLMClient:
    """
    Convenience factory to create ChaosLLMClient with balanced error distribution.

    Distributes the failure_rate evenly across different error types.

    Args:
        base_client: The underlying LLMClient to wrap
        failure_rate: Overall failure rate (0.0 to 1.0). Default: 0.3 (30% failures)
        seed: Random seed for reproducibility. If None, uses random seed.

    Returns:
        ChaosLLMClient: Configured chaos client

    Example:
        >>> chaos = create_chaos_client(
        ...     base_client=mock_client,
        ...     failure_rate=0.2,  # 20% overall failures
        ...     seed=42
        ... )
        >>> # Failures distributed evenly: ~5% each for rate limit, server error, timeout, auth
    """
    if not 0.0 <= failure_rate <= 1.0:
        raise ValueError(f"failure_rate must be between 0.0 and 1.0, got {failure_rate}")

    success_rate = 1.0 - failure_rate

    # Distribute failure rate evenly across 4 error types
    error_prob = failure_rate / 4.0

    return ChaosLLMClient(
        base_client=base_client,
        success_rate=success_rate,
        rate_limit_prob=error_prob,
        server_error_prob=error_prob,
        timeout_prob=error_prob,
        auth_error_prob=error_prob,
        seed=seed,
    )
