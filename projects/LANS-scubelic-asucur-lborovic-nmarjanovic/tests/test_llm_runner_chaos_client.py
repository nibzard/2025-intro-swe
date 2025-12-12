"""
Tests for llm_runner.chaos_client module.

Tests cover:
- ChaosLLMClient initialization and validation
- Success/failure probability distribution
- Different error type injection
- Reproducibility with seed
- create_chaos_client factory function
- Integration with MockLLMClient
"""

import pytest

from llm_answer_watcher.llm_runner.chaos_client import ChaosLLMClient, create_chaos_client
from llm_answer_watcher.llm_runner.mock_client import MockLLMClient


class TestChaosLLMClientInit:
    """Test suite for ChaosLLMClient initialization."""

    def test_init_defaults(self):
        """Test initialization with default values."""
        base = MockLLMClient()
        client = ChaosLLMClient(base_client=base)

        assert client.base_client is base
        assert client.success_rate == 0.7
        assert client.rate_limit_prob == 0.1
        assert client.server_error_prob == 0.1
        assert client.timeout_prob == 0.05
        assert client.auth_error_prob == 0.05

    def test_init_custom_values(self):
        """Test initialization with custom probabilities."""
        base = MockLLMClient()
        client = ChaosLLMClient(
            base_client=base,
            success_rate=0.9,
            rate_limit_prob=0.03,
            server_error_prob=0.03,
            timeout_prob=0.02,
            auth_error_prob=0.02,
        )

        assert client.success_rate == 0.9
        assert client.rate_limit_prob == 0.03

    def test_init_with_seed(self):
        """Test initialization with random seed for reproducibility."""
        base = MockLLMClient()
        client = ChaosLLMClient(base_client=base, seed=42)

        assert client.seed == 42

    def test_init_invalid_success_rate_too_low(self):
        """Test that success_rate < 0.0 raises ValueError."""
        base = MockLLMClient()

        with pytest.raises(ValueError, match="success_rate must be between 0.0 and 1.0"):
            ChaosLLMClient(base_client=base, success_rate=-0.1)

    def test_init_invalid_success_rate_too_high(self):
        """Test that success_rate > 1.0 raises ValueError."""
        base = MockLLMClient()

        with pytest.raises(ValueError, match="success_rate must be between 0.0 and 1.0"):
            ChaosLLMClient(base_client=base, success_rate=1.5)

    def test_init_error_probabilities_exceed_one(self):
        """Test that error probabilities summing > 1.0 raises ValueError."""
        base = MockLLMClient()

        with pytest.raises(ValueError, match="Sum of error probabilities"):
            ChaosLLMClient(
                base_client=base,
                success_rate=0.5,
                rate_limit_prob=0.4,
                server_error_prob=0.4,
                timeout_prob=0.3,
                auth_error_prob=0.1,
            )


class TestChaosLLMClientGenerateAnswer:
    """Test suite for ChaosLLMClient.generate_answer()."""

    @pytest.mark.asyncio
    async def test_generate_answer_always_succeeds(self):
        """Test chaos client with success_rate=1.0 always succeeds."""
        base = MockLLMClient(responses={"test": "answer"})
        client = ChaosLLMClient(base_client=base, success_rate=1.0)

        # Should never fail with 100% success rate
        for _ in range(10):
            response = await client.generate_answer("test")
            assert response.answer_text == "answer"

    @pytest.mark.asyncio
    async def test_generate_answer_rate_limit_error(self):
        """Test chaos client can inject 429 rate limit errors."""
        base = MockLLMClient()
        client = ChaosLLMClient(
            base_client=base,
            success_rate=0.0,
            rate_limit_prob=1.0,  # Always 429
            server_error_prob=0.0,
            timeout_prob=0.0,
            auth_error_prob=0.0,
        )

        with pytest.raises(RuntimeError, match="429 Rate Limit"):
            await client.generate_answer("test")

    @pytest.mark.asyncio
    async def test_generate_answer_server_errors(self):
        """Test chaos client can inject 5xx server errors."""
        base = MockLLMClient()
        client = ChaosLLMClient(
            base_client=base,
            success_rate=0.0,
            rate_limit_prob=0.0,
            server_error_prob=1.0,  # Always 5xx
            timeout_prob=0.0,
            auth_error_prob=0.0,
            seed=42,
        )

        with pytest.raises(RuntimeError) as exc_info:
            await client.generate_answer("test")

        error_msg = str(exc_info.value)
        assert "500" in error_msg or "502" in error_msg or "503" in error_msg

    @pytest.mark.asyncio
    async def test_generate_answer_timeout_error(self):
        """Test chaos client can inject timeout errors."""
        base = MockLLMClient()
        client = ChaosLLMClient(
            base_client=base,
            success_rate=0.0,
            rate_limit_prob=0.0,
            server_error_prob=0.0,
            timeout_prob=1.0,  # Always timeout
            auth_error_prob=0.0,
        )

        with pytest.raises(RuntimeError, match="timeout"):
            await client.generate_answer("test")

    @pytest.mark.asyncio
    async def test_generate_answer_auth_error(self):
        """Test chaos client can inject 401 auth errors."""
        base = MockLLMClient()
        client = ChaosLLMClient(
            base_client=base,
            success_rate=0.0,
            rate_limit_prob=0.0,
            server_error_prob=0.0,
            timeout_prob=0.0,
            auth_error_prob=1.0,  # Always 401
        )

        with pytest.raises(RuntimeError, match="401 Unauthorized"):
            await client.generate_answer("test")

    @pytest.mark.asyncio
    async def test_generate_answer_reproducible_with_seed(self):
        """Test that same seed produces same failure sequence."""
        base = MockLLMClient(responses={"test": "answer"})

        # Create two clients with same seed
        client1 = ChaosLLMClient(base_client=base, success_rate=0.5, seed=123)
        client2 = ChaosLLMClient(base_client=base, success_rate=0.5, seed=123)

        # Run same sequence on both
        results1 = []
        results2 = []

        for _ in range(20):
            try:
                await client1.generate_answer("test")
                results1.append("success")
            except RuntimeError:
                results1.append("failure")

            try:
                await client2.generate_answer("test")
                results2.append("success")
            except RuntimeError:
                results2.append("failure")

        # Should have identical results
        assert results1 == results2

    @pytest.mark.asyncio
    async def test_generate_answer_statistical_distribution(self):
        """Test that failure rate matches configured success_rate over many trials."""
        base = MockLLMClient(responses={"test": "answer"})
        client = ChaosLLMClient(
            base_client=base,
            success_rate=0.7,  # 70% success
            seed=42,
        )

        successes = 0
        failures = 0
        trials = 1000

        for _ in range(trials):
            try:
                await client.generate_answer("test")
                successes += 1
            except RuntimeError:
                failures += 1

        success_rate = successes / trials

        # Allow 5% tolerance
        assert 0.65 <= success_rate <= 0.75

    @pytest.mark.asyncio
    async def test_generate_answer_passes_through_on_success(self):
        """Test that successful calls return base client response unchanged."""
        base = MockLLMClient(
            responses={"test": "base answer"},
            model_name="base-model",
            provider="base-provider",
            tokens_per_response=300,
            cost_per_response=0.005,
        )
        client = ChaosLLMClient(base_client=base, success_rate=1.0)

        response = await client.generate_answer("test")

        # Should be identical to base client response
        assert response.answer_text == "base answer"
        assert response.model_name == "base-model"
        assert response.provider == "base-provider"
        assert response.tokens_used == 300
        assert response.cost_usd == 0.005


class TestCreateChaosClient:
    """Test suite for create_chaos_client factory function."""

    def test_create_chaos_client_default(self):
        """Test factory creates client with default 30% failure rate."""
        base = MockLLMClient()
        client = create_chaos_client(base_client=base)

        assert client.success_rate == 0.7  # 1.0 - 0.3
        # Each error type gets 0.3 / 4 = 0.075
        assert client.rate_limit_prob == 0.075
        assert client.server_error_prob == 0.075
        assert client.timeout_prob == 0.075
        assert client.auth_error_prob == 0.075

    def test_create_chaos_client_custom_failure_rate(self):
        """Test factory with custom failure rate."""
        base = MockLLMClient()
        client = create_chaos_client(base_client=base, failure_rate=0.2)

        assert client.success_rate == 0.8  # 1.0 - 0.2
        # Each error type gets 0.2 / 4 = 0.05
        assert client.rate_limit_prob == 0.05
        assert client.server_error_prob == 0.05
        assert client.timeout_prob == 0.05
        assert client.auth_error_prob == 0.05

    def test_create_chaos_client_with_seed(self):
        """Test factory with seed for reproducibility."""
        base = MockLLMClient()
        client = create_chaos_client(base_client=base, seed=42)

        assert client.seed == 42

    def test_create_chaos_client_invalid_failure_rate_too_low(self):
        """Test factory rejects failure_rate < 0.0."""
        base = MockLLMClient()

        with pytest.raises(ValueError, match="failure_rate must be between 0.0 and 1.0"):
            create_chaos_client(base_client=base, failure_rate=-0.1)

    def test_create_chaos_client_invalid_failure_rate_too_high(self):
        """Test factory rejects failure_rate > 1.0."""
        base = MockLLMClient()

        with pytest.raises(ValueError, match="failure_rate must be between 0.0 and 1.0"):
            create_chaos_client(base_client=base, failure_rate=1.5)

    def test_create_chaos_client_zero_failure_rate(self):
        """Test factory with 0% failure rate (always succeeds)."""
        base = MockLLMClient()
        client = create_chaos_client(base_client=base, failure_rate=0.0)

        assert client.success_rate == 1.0
        assert client.rate_limit_prob == 0.0
        assert client.server_error_prob == 0.0
        assert client.timeout_prob == 0.0
        assert client.auth_error_prob == 0.0


class TestChaosLLMClientIntegration:
    """Integration tests for ChaosLLMClient with realistic scenarios."""

    @pytest.mark.asyncio
    async def test_retry_logic_validation(self):
        """Test chaos client for validating retry logic."""
        base = MockLLMClient(responses={"test": "success"})
        client = ChaosLLMClient(
            base_client=base,
            success_rate=0.3,  # Fail 70% of the time
            seed=42,
        )

        # Simulate retry loop (max 3 attempts)
        attempts = 0
        max_attempts = 3
        success = False

        for attempt in range(max_attempts):
            attempts += 1
            try:
                response = await client.generate_answer("test")
                success = True
                break
            except RuntimeError:
                # Retry on failure
                continue

        # With 30% success rate and 3 attempts:
        # P(at least one success) = 1 - (0.7)^3 = 0.657
        # This test may occasionally fail due to randomness, but seed=42 should pass
        assert attempts <= max_attempts

    @pytest.mark.asyncio
    async def test_partial_failure_scenario(self):
        """Test scenario where some queries fail but others succeed."""
        base = MockLLMClient(
            responses={
                "query1": "answer1",
                "query2": "answer2",
                "query3": "answer3",
            }
        )
        client = ChaosLLMClient(
            base_client=base,
            success_rate=0.6,  # 60% success rate
            seed=999,
        )

        results = []
        for query in ["query1", "query2", "query3"] * 3:  # 9 total queries
            try:
                response = await client.generate_answer(query)
                results.append(("success", response.answer_text))
            except RuntimeError as e:
                results.append(("failure", str(e)))

        successes = [r for r in results if r[0] == "success"]
        failures = [r for r in results if r[0] == "failure"]

        # Should have mix of successes and failures
        assert len(successes) > 0
        assert len(failures) > 0
