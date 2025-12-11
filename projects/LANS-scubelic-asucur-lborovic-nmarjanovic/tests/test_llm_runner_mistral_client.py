"""
Tests for llm_runner.mistral_client module.

Tests cover:
- MistralClient initialization and validation
- Successful API calls with proper response parsing
- Retry logic on transient failures (429, 5xx)
- Immediate failure on non-retryable errors (401, 400, 404)
- Token usage extraction and cost calculation
- Error handling and logging (without logging API keys)
- Edge cases (empty responses, malformed JSON, missing fields)
"""

import contextlib
import logging

import httpx
import pytest
from freezegun import freeze_time

from llm_answer_watcher.llm_runner.mistral_client import (
    MAX_PROMPT_LENGTH,
    MISTRAL_API_URL,
    MistralClient,
)
from llm_answer_watcher.llm_runner.models import LLMResponse

# Test system prompt for all tests
TEST_SYSTEM_PROMPT = "You are a test assistant."


class TestMistralClientInit:
    """Test suite for MistralClient initialization."""

    def test_init_success(self):
        """Test successful client initialization."""
        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )

        assert client.model_name == "mistral-large-latest"
        assert client.api_key == "test-api-key"

    def test_init_different_model(self):
        """Test initialization with different model."""
        client = MistralClient("mistral-small-latest", "prod-key", TEST_SYSTEM_PROMPT)

        assert client.model_name == "mistral-small-latest"
        assert client.api_key == "prod-key"

    def test_init_empty_model_name(self):
        """Test that empty model_name raises ValueError."""
        with pytest.raises(ValueError, match="model_name cannot be empty"):
            MistralClient("", "test-api-key", TEST_SYSTEM_PROMPT)

    def test_init_whitespace_model_name(self):
        """Test that whitespace-only model_name raises ValueError."""
        with pytest.raises(ValueError, match="model_name cannot be empty"):
            MistralClient("   ", "test-api-key", TEST_SYSTEM_PROMPT)

    def test_init_empty_api_key(self):
        """Test that empty api_key raises ValueError."""
        with pytest.raises(ValueError, match="api_key cannot be empty"):
            MistralClient("mistral-large-latest", "", TEST_SYSTEM_PROMPT)

    def test_init_whitespace_api_key(self):
        """Test that whitespace-only api_key raises ValueError."""
        with pytest.raises(ValueError, match="api_key cannot be empty"):
            MistralClient("mistral-large-latest", "   ", TEST_SYSTEM_PROMPT)

    def test_init_empty_system_prompt(self):
        """Test that empty system_prompt raises ValueError."""
        with pytest.raises(ValueError, match="system_prompt cannot be empty"):
            MistralClient("mistral-large-latest", "test-api-key", "")

    def test_init_whitespace_system_prompt(self):
        """Test that whitespace-only system_prompt raises ValueError."""
        with pytest.raises(ValueError, match="system_prompt cannot be empty"):
            MistralClient("mistral-large-latest", "test-api-key", "   ")

    def test_init_logs_model_not_api_key(self, caplog):
        """Test that initialization logs model name but NEVER logs API key."""
        caplog.set_level(logging.INFO)

        MistralClient("mistral-large-latest", "secret-key-123", TEST_SYSTEM_PROMPT)

        # Should log model name
        assert "mistral-large-latest" in caplog.text

        # Should NEVER log API key
        assert "secret-key-123" not in caplog.text
        assert "secret" not in caplog.text


class TestGenerateAnswerSuccess:
    """Test suite for successful Mistral API calls."""

    @freeze_time("2025-11-02T08:30:45Z")
    @pytest.mark.asyncio
    async def test_generate_answer_success(self, httpx_mock):
        """Test successful API call with complete response."""
        # Mock successful Mistral Chat Completions API response
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            json={
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": "Based on market research, the top CRM tools are Salesforce, HubSpot, and Zoho.",
                        },
                        "finish_reason": "stop",
                    }
                ],
                "usage": {
                    "prompt_tokens": 100,
                    "completion_tokens": 50,
                    "total_tokens": 150,
                },
                "model": "mistral-large-latest",
            },
        )

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("What are the best CRM tools?")

        # Verify response structure
        assert isinstance(response, LLMResponse)
        assert (
            response.answer_text
            == "Based on market research, the top CRM tools are Salesforce, HubSpot, and Zoho."
        )
        assert response.tokens_used == 150
        assert response.prompt_tokens == 100
        assert response.completion_tokens == 50
        assert response.cost_usd > 0  # Should have calculated cost
        assert response.provider == "mistral"
        assert response.model_name == "mistral-large-latest"
        assert response.timestamp_utc == "2025-11-02T08:30:45Z"

    @pytest.mark.asyncio
    async def test_generate_answer_sends_correct_payload(self, httpx_mock):
        """Test that API request includes system message and correct structure."""
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            json={
                "choices": [
                    {"message": {"role": "assistant", "content": "Test response"}}
                ],
                "usage": {"total_tokens": 100},
            },
        )

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )
        await client.generate_answer("Test prompt")

        # Verify request was made
        request = httpx_mock.get_request()
        assert request is not None

        # Verify request structure
        payload = request.read()
        import json

        data = json.loads(payload)

        assert data["model"] == "mistral-large-latest"
        assert len(data["messages"]) == 2
        assert data["messages"][0]["role"] == "system"
        assert data["messages"][0]["content"] == TEST_SYSTEM_PROMPT
        assert data["messages"][1]["role"] == "user"
        assert data["messages"][1]["content"] == "Test prompt"
        assert data["temperature"] == 0.7

    @pytest.mark.asyncio
    async def test_generate_answer_sends_auth_header(self, httpx_mock):
        """Test that API request includes Bearer token in Authorization header."""
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            json={
                "choices": [{"message": {"role": "assistant", "content": "Test"}}],
                "usage": {"total_tokens": 10},
            },
        )

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )
        await client.generate_answer("Test")

        # Verify Authorization header
        request = httpx_mock.get_request()
        assert request.headers["Authorization"] == "Bearer test-api-key"
        assert request.headers["Content-Type"] == "application/json"

    @pytest.mark.asyncio
    async def test_generate_answer_large_response(self, httpx_mock):
        """Test handling of large response with high token count."""
        large_content = "A" * 10000
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            json={
                "choices": [
                    {"message": {"role": "assistant", "content": large_content}}
                ],
                "usage": {"total_tokens": 50000},
            },
        )

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Generate large text")

        assert response.answer_text == large_content
        assert response.tokens_used == 50000


class TestGenerateAnswerValidation:
    """Test suite for input validation."""

    @pytest.mark.asyncio
    async def test_generate_answer_empty_prompt(self, httpx_mock):
        """Test that empty prompt raises ValueError."""
        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(ValueError, match="Prompt cannot be empty"):
            await client.generate_answer("")

    @pytest.mark.asyncio
    async def test_generate_answer_whitespace_prompt(self, httpx_mock):
        """Test that whitespace-only prompt raises ValueError."""
        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(ValueError, match="Prompt cannot be empty"):
            await client.generate_answer("   \n\t  ")


class TestPromptLengthValidation:
    """Test suite for prompt length validation in Mistral client."""

    @pytest.mark.asyncio
    async def test_generate_answer_accepts_normal_prompt(self, httpx_mock):
        """Normal-length prompts should be accepted."""
        # Mock successful response
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            json={
                "choices": [
                    {"message": {"role": "assistant", "content": "Test response"}}
                ],
                "usage": {"total_tokens": 100},
            },
        )

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )
        # Test with a reasonable prompt (< 100k chars)
        prompt = "What are the best email warmup tools?" * 100  # ~4000 chars
        response = await client.generate_answer(prompt)

        assert response.answer_text == "Test response"
        assert len(httpx_mock.get_requests()) == 1

    @pytest.mark.asyncio
    async def test_generate_answer_accepts_max_length_prompt(self, httpx_mock):
        """Prompts exactly at max length should be accepted."""
        # Mock successful response
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            json={
                "choices": [
                    {"message": {"role": "assistant", "content": "Test response"}}
                ],
                "usage": {"total_tokens": 100},
            },
        )

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )
        prompt = "a" * MAX_PROMPT_LENGTH
        response = await client.generate_answer(prompt)

        # Should not raise ValueError for length
        assert response.answer_text == "Test response"

    @pytest.mark.asyncio
    async def test_generate_answer_rejects_over_limit_prompt(self):
        """Prompts over max length should raise ValueError."""
        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )
        prompt = "a" * (MAX_PROMPT_LENGTH + 1)

        with pytest.raises(ValueError, match=r"Prompt exceeds maximum length"):
            await client.generate_answer(prompt)

    @pytest.mark.asyncio
    async def test_generate_answer_rejects_very_long_prompt(self):
        """Very long prompts should raise ValueError with correct count."""
        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )
        prompt = "a" * (MAX_PROMPT_LENGTH * 2)

        with pytest.raises(ValueError, match=r"200,000 characters"):
            await client.generate_answer(prompt)

    @pytest.mark.asyncio
    async def test_generate_answer_error_message_shows_actual_length(self):
        """Error message should show actual received length."""
        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )
        prompt = "a" * (MAX_PROMPT_LENGTH + 5000)

        with pytest.raises(ValueError) as exc_info:
            await client.generate_answer(prompt)

        error_msg = str(exc_info.value)
        assert "105,000 characters" in error_msg
        assert "100,000 characters" in error_msg
        assert "shorten your prompt" in error_msg


class TestGenerateAnswerNonRetryableErrors:
    """Test suite for non-retryable errors (401, 400, 404)."""

    @pytest.mark.asyncio
    async def test_generate_answer_401_unauthorized(self, httpx_mock):
        """Test that 401 error raises RuntimeError immediately (no retry)."""
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            status_code=401,
            json={"message": "Invalid API key"},
        )

        client = MistralClient(
            "mistral-large-latest", "invalid-key", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="non-retryable"):
            await client.generate_answer("Test")

        # Verify only one request was made (no retry)
        assert len(httpx_mock.get_requests()) == 1

    @pytest.mark.asyncio
    async def test_generate_answer_400_bad_request(self, httpx_mock):
        """Test that 400 error raises RuntimeError immediately (no retry)."""
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            status_code=400,
            json={"message": "Invalid request format"},
        )

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="non-retryable"):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_generate_answer_404_not_found(self, httpx_mock):
        """Test that 404 error raises RuntimeError immediately (no retry)."""
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            status_code=404,
            json={"message": "Endpoint not found"},
        )

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="non-retryable"):
            await client.generate_answer("Test")


class TestGenerateAnswerRetryableErrors:
    """Test suite for retryable errors (429, 5xx) with retry logic."""

    @pytest.mark.asyncio
    async def test_generate_answer_429_rate_limit_then_success(self, httpx_mock):
        """Test that 429 error is retried and succeeds on second attempt."""
        # First call: rate limit
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            status_code=429,
            json={"message": "Rate limit exceeded"},
        )

        # Second call: success
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            status_code=200,
            json={
                "choices": [
                    {"message": {"role": "assistant", "content": "Success after retry"}}
                ],
                "usage": {"total_tokens": 50},
            },
        )

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        assert response.answer_text == "Success after retry"
        assert len(httpx_mock.get_requests()) == 2  # Two attempts

    @pytest.mark.asyncio
    async def test_generate_answer_500_server_error_then_success(self, httpx_mock):
        """Test that 500 error is retried and succeeds."""
        # First call: server error
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            status_code=500,
            json={"message": "Internal server error"},
        )

        # Second call: success
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            status_code=200,
            json={
                "choices": [
                    {"message": {"role": "assistant", "content": "Success after retry"}}
                ],
                "usage": {"total_tokens": 50},
            },
        )

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        assert response.answer_text == "Success after retry"
        assert len(httpx_mock.get_requests()) == 2

    @pytest.mark.asyncio
    async def test_generate_answer_503_service_unavailable(self, httpx_mock):
        """Test that 503 error is retried."""
        # All calls fail with 503
        for _ in range(3):
            httpx_mock.add_response(
                method="POST",
                url=MISTRAL_API_URL,
                status_code=503,
                json={"message": "Service unavailable"},
            )

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(httpx.HTTPStatusError):
            await client.generate_answer("Test")

        # Verify 3 retry attempts were made
        assert len(httpx_mock.get_requests()) == 3


class TestGenerateAnswerErrorHandling:
    """Test suite for error handling and edge cases."""

    @pytest.mark.asyncio
    async def test_generate_answer_missing_choices(self, httpx_mock):
        """Test handling of response missing 'choices' field."""
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            json={"usage": {"total_tokens": 10}},
        )

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="missing 'choices' array"):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_generate_answer_empty_choices(self, httpx_mock):
        """Test handling of empty choices array."""
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            json={"choices": [], "usage": {"total_tokens": 10}},
        )

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="missing 'choices' array"):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_generate_answer_missing_message(self, httpx_mock):
        """Test handling of choice missing 'message' field."""
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            json={
                "choices": [{"finish_reason": "stop"}],
                "usage": {"total_tokens": 10},
            },
        )

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="missing 'message' object"):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_generate_answer_missing_content(self, httpx_mock):
        """Test handling of message missing 'content' field."""
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            json={
                "choices": [{"message": {"role": "assistant"}}],
                "usage": {"total_tokens": 10},
            },
        )

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="missing 'content' field"):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_generate_answer_missing_usage(self, httpx_mock, caplog):
        """Test handling of response missing 'usage' field."""
        caplog.set_level(logging.WARNING)

        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            json={"choices": [{"message": {"role": "assistant", "content": "Test"}}]},
        )

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        # Should gracefully handle missing usage with warning
        assert "missing 'usage' data" in caplog.text
        assert response.tokens_used == 0
        assert response.cost_usd == 0.0

    @pytest.mark.asyncio
    async def test_generate_answer_malformed_json(self, httpx_mock):
        """Test handling of malformed JSON response."""
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            content=b"not valid json{",
        )

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="Failed to parse Mistral response JSON"):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_generate_answer_connection_error(self, httpx_mock):
        """Test handling of connection errors."""
        # Add exception 3 times (for retry attempts)
        for _ in range(3):
            httpx_mock.add_exception(httpx.ConnectError("Connection failed"))

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(httpx.ConnectError):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_generate_answer_timeout(self, httpx_mock):
        """Test handling of timeout errors."""
        # Add exception 3 times (for retry attempts)
        for _ in range(3):
            httpx_mock.add_exception(httpx.TimeoutException("Request timed out"))

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(httpx.TimeoutException):
            await client.generate_answer("Test")


class TestTokenUsageExtraction:
    """Test suite for token usage extraction."""

    @pytest.mark.asyncio
    async def test_extract_token_usage_all_fields_present(self, httpx_mock):
        """Test token extraction when all fields are present."""
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            json={
                "choices": [{"message": {"role": "assistant", "content": "Test"}}],
                "usage": {
                    "prompt_tokens": 100,
                    "completion_tokens": 50,
                    "total_tokens": 150,
                },
            },
        )

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        assert response.tokens_used == 150
        assert response.prompt_tokens == 100
        assert response.completion_tokens == 50

    @pytest.mark.asyncio
    async def test_extract_token_usage_without_total(self, httpx_mock):
        """Test token extraction when total_tokens is missing."""
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            json={
                "choices": [{"message": {"role": "assistant", "content": "Test"}}],
                "usage": {
                    "prompt_tokens": 100,
                    "completion_tokens": 50,
                },
            },
        )

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        # Should calculate total from prompt + completion
        assert response.tokens_used == 150
        assert response.prompt_tokens == 100
        assert response.completion_tokens == 50


class TestCostEstimation:
    """Test suite for cost estimation integration."""

    @pytest.mark.asyncio
    async def test_cost_calculation_mistral_large(self, httpx_mock):
        """Test cost calculation for mistral-large-latest."""
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            json={
                "choices": [{"message": {"role": "assistant", "content": "Test"}}],
                "usage": {
                    "prompt_tokens": 1000,
                    "completion_tokens": 500,
                },
            },
        )

        client = MistralClient(
            "mistral-large-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        # Mistral Large: $2.00/1M input, $6.00/1M output
        # Cost = (1000 * 0.000002) + (500 * 0.000006) = 0.002 + 0.003 = 0.005
        assert response.cost_usd == pytest.approx(0.005, rel=1e-6)

    @pytest.mark.asyncio
    async def test_cost_calculation_mistral_small(self, httpx_mock):
        """Test cost calculation for mistral-small-latest."""
        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            json={
                "choices": [{"message": {"role": "assistant", "content": "Test"}}],
                "usage": {
                    "prompt_tokens": 1000,
                    "completion_tokens": 500,
                },
            },
        )

        client = MistralClient(
            "mistral-small-latest", "test-api-key", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        # Mistral Small: $0.20/1M input, $0.60/1M output
        # Cost = (1000 * 0.0000002) + (500 * 0.0000006) = 0.0002 + 0.0003 = 0.0005
        assert response.cost_usd == pytest.approx(0.0005, rel=1e-6)


class TestLogging:
    """Test suite for logging behavior."""

    @pytest.mark.asyncio
    async def test_generate_answer_never_logs_api_key(self, httpx_mock, caplog):
        """Test that API key is NEVER logged in any form."""
        caplog.set_level(logging.DEBUG)

        httpx_mock.add_response(
            method="POST",
            url=MISTRAL_API_URL,
            json={
                "choices": [{"message": {"role": "assistant", "content": "Test"}}],
                "usage": {"total_tokens": 10},
            },
        )

        client = MistralClient(
            "mistral-large-latest", "super-secret-key", TEST_SYSTEM_PROMPT
        )
        await client.generate_answer("Test")

        # Should log model name
        assert "mistral-large-latest" in caplog.text

        # Should NEVER log API key
        assert "super-secret-key" not in caplog.text
        assert "secret" not in caplog.text

    @pytest.mark.asyncio
    async def test_generate_answer_logs_errors_without_api_key(self, httpx_mock, caplog):
        """Test that error logs do not contain API key."""
        caplog.set_level(logging.ERROR)

        # Add 3 error responses (for retry attempts)
        for _ in range(3):
            httpx_mock.add_response(
                method="POST",
                url=MISTRAL_API_URL,
                status_code=500,
                json={"message": "Internal server error"},
            )

        client = MistralClient("mistral-large-latest", "secret-key", TEST_SYSTEM_PROMPT)

        # Will fail after retries
        with contextlib.suppress(Exception):
            await client.generate_answer("Test")

        # Should log error details but not API key
        assert "secret-key" not in caplog.text
        assert "mistral-large-latest" in caplog.text
