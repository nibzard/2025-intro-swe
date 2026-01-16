"""
Tests for llm_runner.groq_client module.

Tests cover:
- GroqClient initialization and validation
- Successful API calls with proper response parsing
- Retry logic on transient failures (429, 5xx)
- Immediate failure on non-retryable errors (401, 400, 404)
- Token usage extraction and cost calculation
- Error handling and logging (without logging API keys)
- Edge cases (empty responses, malformed JSON, missing fields)
- OpenAI-compatible response format
"""

import logging

import httpx
import pytest
from freezegun import freeze_time

from llm_answer_watcher.llm_runner.groq_client import (
    GROQ_API_BASE_URL,
    MAX_PROMPT_LENGTH,
    GroqClient,
)
from llm_answer_watcher.llm_runner.models import LLMResponse

# Test system prompt for all tests
TEST_SYSTEM_PROMPT = "You are a test assistant."


class TestGroqClientInit:
    """Test suite for GroqClient initialization."""

    def test_init_success(self):
        """Test successful client initialization."""
        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )

        assert client.model_name == "llama-3.1-8b-instant"
        assert client.api_key == "gsk-test123"
        assert client.system_prompt == TEST_SYSTEM_PROMPT

    def test_init_different_model(self):
        """Test initialization with different model."""
        client = GroqClient(
            "llama-3.3-70b-versatile", "gsk-prod456", TEST_SYSTEM_PROMPT
        )

        assert client.model_name == "llama-3.3-70b-versatile"
        assert client.api_key == "gsk-prod456"

    def test_init_mixtral_model(self):
        """Test initialization with Mixtral model."""
        client = GroqClient(
            "mixtral-8x7b-32768", "gsk-test123", TEST_SYSTEM_PROMPT
        )

        assert client.model_name == "mixtral-8x7b-32768"

    def test_init_gemma_model(self):
        """Test initialization with Gemma model."""
        client = GroqClient("gemma2-9b-it", "gsk-test123", TEST_SYSTEM_PROMPT)

        assert client.model_name == "gemma2-9b-it"

    def test_init_empty_model_name(self):
        """Test that empty model_name raises ValueError."""
        with pytest.raises(ValueError, match="model_name cannot be empty"):
            GroqClient("", "gsk-test123", TEST_SYSTEM_PROMPT)

    def test_init_whitespace_model_name(self):
        """Test that whitespace-only model_name raises ValueError."""
        with pytest.raises(ValueError, match="model_name cannot be empty"):
            GroqClient("   ", "gsk-test123", TEST_SYSTEM_PROMPT)

    def test_init_empty_api_key(self):
        """Test that empty api_key raises ValueError."""
        with pytest.raises(ValueError, match="api_key cannot be empty"):
            GroqClient("llama-3.1-8b-instant", "", TEST_SYSTEM_PROMPT)

    def test_init_whitespace_api_key(self):
        """Test that whitespace-only api_key raises ValueError."""
        with pytest.raises(ValueError, match="api_key cannot be empty"):
            GroqClient("llama-3.1-8b-instant", "   ", TEST_SYSTEM_PROMPT)

    def test_init_empty_system_prompt(self):
        """Test that empty system_prompt raises ValueError."""
        with pytest.raises(ValueError, match="system_prompt cannot be empty"):
            GroqClient("llama-3.1-8b-instant", "gsk-test123", "")

    def test_init_whitespace_system_prompt(self):
        """Test that whitespace-only system_prompt raises ValueError."""
        with pytest.raises(ValueError, match="system_prompt cannot be empty"):
            GroqClient("llama-3.1-8b-instant", "gsk-test123", "   ")

    def test_init_logs_model_not_api_key(self, caplog):
        """Test that initialization logs model name but NEVER logs API key."""
        caplog.set_level(logging.INFO)

        GroqClient("llama-3.1-8b-instant", "gsk-secret123", TEST_SYSTEM_PROMPT)

        # Should log model name
        assert "llama-3.1-8b-instant" in caplog.text

        # Should NEVER log API key
        assert "gsk-secret123" not in caplog.text
        assert "secret" not in caplog.text

    def test_init_with_tools_warns(self, caplog):
        """Test that providing tools logs a warning."""
        caplog.set_level(logging.WARNING)

        GroqClient(
            "llama-3.1-8b-instant",
            "gsk-test123",
            TEST_SYSTEM_PROMPT,
            tools=[{"type": "web_search"}],
        )

        assert "Tools provided to Groq client" in caplog.text
        assert "limited tool support" in caplog.text
        assert "llama-3.1-8b-instant" in caplog.text


class TestGenerateAnswerSuccess:
    """Test suite for successful Groq API calls."""

    @freeze_time("2025-11-05T14:20:15Z")
    @pytest.mark.asyncio
    async def test_generate_answer_success(self, httpx_mock):
        """Test successful API call with complete response."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        # Mock successful Groq Chat Completions API response (OpenAI-compatible)
        httpx_mock.add_response(
            method="POST",
            url=api_url,
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
                "model": "llama-3.1-8b-instant",
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
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
        assert response.provider == "groq"
        assert response.model_name == "llama-3.1-8b-instant"
        assert response.timestamp_utc == "2025-11-05T14:20:15Z"
        assert response.web_search_results is None
        assert response.web_search_count == 0

    @pytest.mark.asyncio
    async def test_generate_answer_llama_33_70b_model(self, httpx_mock):
        """Test successful API call with Llama 3.3 70B model."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": "Llama 3.3 70B response",
                        },
                        "finish_reason": "stop",
                    }
                ],
                "usage": {
                    "prompt_tokens": 50,
                    "completion_tokens": 25,
                    "total_tokens": 75,
                },
                "model": "llama-3.3-70b-versatile",
            },
        )

        client = GroqClient(
            "llama-3.3-70b-versatile", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test prompt")

        assert response.answer_text == "Llama 3.3 70B response"
        assert response.model_name == "llama-3.3-70b-versatile"
        assert response.provider == "groq"

    @pytest.mark.asyncio
    async def test_generate_answer_mixtral_model(self, httpx_mock):
        """Test successful API call with Mixtral model."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": "Mixtral response",
                        },
                        "finish_reason": "stop",
                    }
                ],
                "usage": {
                    "prompt_tokens": 60,
                    "completion_tokens": 30,
                    "total_tokens": 90,
                },
                "model": "mixtral-8x7b-32768",
            },
        )

        client = GroqClient(
            "mixtral-8x7b-32768", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        assert response.answer_text == "Mixtral response"
        assert response.model_name == "mixtral-8x7b-32768"

    @pytest.mark.asyncio
    async def test_generate_answer_sends_correct_payload(self, httpx_mock):
        """Test that API request includes system message and correct OpenAI-compatible structure."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": [
                    {"message": {"role": "assistant", "content": "Test response"}}
                ],
                "usage": {"total_tokens": 100},
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        await client.generate_answer("Test prompt")

        # Verify request was made
        request = httpx_mock.get_request()
        assert request is not None

        # Verify request structure (OpenAI-compatible)
        payload = request.read()
        import json

        data = json.loads(payload)

        assert data["model"] == "llama-3.1-8b-instant"
        assert len(data["messages"]) == 2
        assert data["messages"][0]["role"] == "system"
        assert data["messages"][0]["content"] == TEST_SYSTEM_PROMPT
        assert data["messages"][1]["role"] == "user"
        assert data["messages"][1]["content"] == "Test prompt"
        assert data["temperature"] == 0.7

    @pytest.mark.asyncio
    async def test_generate_answer_sends_auth_header(self, httpx_mock):
        """Test that API request includes Bearer token in Authorization header."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": [{"message": {"role": "assistant", "content": "Test"}}],
                "usage": {"total_tokens": 10},
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        await client.generate_answer("Test")

        # Verify Authorization header
        request = httpx_mock.get_request()
        assert request.headers["Authorization"] == "Bearer gsk-test123"
        assert request.headers["Content-Type"] == "application/json"

    @pytest.mark.asyncio
    async def test_generate_answer_empty_content(self, httpx_mock):
        """Test handling of empty content in response."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": [{"message": {"role": "assistant", "content": ""}}],
                "usage": {"total_tokens": 10},
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        # Empty content is valid (edge case)
        assert response.answer_text == ""

    @pytest.mark.asyncio
    async def test_generate_answer_large_response(self, httpx_mock):
        """Test handling of large response with high token count."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        large_content = "A" * 10000
        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": [
                    {"message": {"role": "assistant", "content": large_content}}
                ],
                "usage": {"total_tokens": 50000},
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Generate large text")

        assert response.answer_text == large_content
        assert response.tokens_used == 50000

    @pytest.mark.asyncio
    async def test_generate_answer_finish_reason_length(self, httpx_mock):
        """Test handling of finish_reason 'length' (max tokens reached)."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": "Truncated response",
                        },
                        "finish_reason": "length",
                    }
                ],
                "usage": {"total_tokens": 100},
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        # Should still return response (length is acceptable finish reason)
        assert response.answer_text == "Truncated response"


class TestGenerateAnswerValidation:
    """Test suite for input validation."""

    @pytest.mark.asyncio
    async def test_generate_answer_empty_prompt(self):
        """Test that empty prompt raises ValueError."""
        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(ValueError, match="Prompt cannot be empty"):
            await client.generate_answer("")

    @pytest.mark.asyncio
    async def test_generate_answer_whitespace_prompt(self):
        """Test that whitespace-only prompt raises ValueError."""
        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(ValueError, match="Prompt cannot be empty"):
            await client.generate_answer("   \n\t  ")


class TestPromptLengthValidation:
    """Test suite for prompt length validation in Groq client."""

    @pytest.mark.asyncio
    async def test_generate_answer_accepts_normal_prompt(self, httpx_mock):
        """Normal-length prompts should be accepted."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        # Mock successful response
        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": [
                    {"message": {"role": "assistant", "content": "Test response"}}
                ],
                "usage": {"total_tokens": 100},
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        # Test with a reasonable prompt (< 100k chars)
        prompt = "What are the best email warmup tools?" * 100  # ~4000 chars
        response = await client.generate_answer(prompt)

        assert response.answer_text == "Test response"
        assert len(httpx_mock.get_requests()) == 1

    @pytest.mark.asyncio
    async def test_generate_answer_accepts_max_length_prompt(self, httpx_mock):
        """Prompts exactly at max length should be accepted."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        # Mock successful response
        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": [
                    {"message": {"role": "assistant", "content": "Test response"}}
                ],
                "usage": {"total_tokens": 100},
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        prompt = "a" * MAX_PROMPT_LENGTH
        response = await client.generate_answer(prompt)

        # Should not raise ValueError for length
        assert response.answer_text == "Test response"

    @pytest.mark.asyncio
    async def test_generate_answer_rejects_over_limit_prompt(self):
        """Prompts over max length should raise ValueError."""
        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        prompt = "a" * (MAX_PROMPT_LENGTH + 1)

        with pytest.raises(ValueError, match=r"Prompt exceeds maximum length"):
            await client.generate_answer(prompt)

    @pytest.mark.asyncio
    async def test_generate_answer_rejects_very_long_prompt(self):
        """Very long prompts should raise ValueError with correct count."""
        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        prompt = "a" * (MAX_PROMPT_LENGTH * 2)

        with pytest.raises(ValueError, match=r"200,000 characters"):
            await client.generate_answer(prompt)

    @pytest.mark.asyncio
    async def test_generate_answer_error_message_shows_actual_length(self):
        """Error message should show actual received length."""
        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
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
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            status_code=401,
            json={"error": {"message": "Invalid API key"}},
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-invalid", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="non-retryable"):
            await client.generate_answer("Test")

        # Verify only one request was made (no retry)
        assert len(httpx_mock.get_requests()) == 1

    @pytest.mark.asyncio
    async def test_generate_answer_400_bad_request(self, httpx_mock):
        """Test that 400 error raises RuntimeError immediately (no retry)."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            status_code=400,
            json={"error": {"message": "Invalid request format"}},
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="non-retryable"):
            await client.generate_answer("Test")

        # Verify only one request was made (no retry)
        assert len(httpx_mock.get_requests()) == 1

    @pytest.mark.asyncio
    async def test_generate_answer_404_not_found(self, httpx_mock):
        """Test that 404 error raises RuntimeError immediately (no retry)."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            status_code=404,
            json={"error": {"message": "Endpoint not found"}},
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="non-retryable"):
            await client.generate_answer("Test")

        # Verify only one request was made (no retry)
        assert len(httpx_mock.get_requests()) == 1


class TestGenerateAnswerRetryableErrors:
    """Test suite for retryable errors (429, 5xx) with retry logic."""

    @pytest.mark.asyncio
    async def test_generate_answer_429_rate_limit_then_success(self, httpx_mock):
        """Test that 429 error is retried and succeeds on second attempt."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        # First call: rate limit
        httpx_mock.add_response(
            method="POST",
            url=api_url,
            status_code=429,
            json={"error": {"message": "Rate limit exceeded"}},
        )

        # Second call: success
        httpx_mock.add_response(
            method="POST",
            url=api_url,
            status_code=200,
            json={
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": "Success after retry",
                        }
                    }
                ],
                "usage": {"total_tokens": 50},
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        assert response.answer_text == "Success after retry"
        assert len(httpx_mock.get_requests()) == 2  # Two attempts

    @pytest.mark.asyncio
    async def test_generate_answer_429_logs_retry_after(self, httpx_mock, caplog):
        """Test that 429 error logs Retry-After header if present."""
        caplog.set_level(logging.WARNING)
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        # First call: rate limit with Retry-After header
        httpx_mock.add_response(
            method="POST",
            url=api_url,
            status_code=429,
            headers={"Retry-After": "60"},
            json={"error": {"message": "Rate limit exceeded"}},
        )

        # Second call: success
        httpx_mock.add_response(
            method="POST",
            url=api_url,
            status_code=200,
            json={
                "choices": [{"message": {"role": "assistant", "content": "Success"}}],
                "usage": {"total_tokens": 50},
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        await client.generate_answer("Test")

        # Should log rate limit warning with Retry-After
        assert "rate limit exceeded" in caplog.text.lower()
        assert "Retry-After: 60" in caplog.text

    @pytest.mark.asyncio
    async def test_generate_answer_500_server_error_then_success(self, httpx_mock):
        """Test that 500 error is retried and succeeds."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        # First call: server error
        httpx_mock.add_response(
            method="POST",
            url=api_url,
            status_code=500,
            json={"error": {"message": "Internal server error"}},
        )

        # Second call: success
        httpx_mock.add_response(
            method="POST",
            url=api_url,
            status_code=200,
            json={
                "choices": [
                    {"message": {"role": "assistant", "content": "Success"}},
                ],
                "usage": {"total_tokens": 30},
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        assert response.answer_text == "Success"
        assert len(httpx_mock.get_requests()) == 2

    @pytest.mark.asyncio
    async def test_generate_answer_502_bad_gateway_then_success(self, httpx_mock):
        """Test that 502 error is retried and succeeds."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        # First call: bad gateway
        httpx_mock.add_response(
            method="POST",
            url=api_url,
            status_code=502,
            json={"error": {"message": "Bad gateway"}},
        )

        # Second call: success
        httpx_mock.add_response(
            method="POST",
            url=api_url,
            status_code=200,
            json={
                "choices": [{"message": {"role": "assistant", "content": "Recovered"}}],
                "usage": {"total_tokens": 20},
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        assert response.answer_text == "Recovered"
        assert len(httpx_mock.get_requests()) == 2

    @pytest.mark.asyncio
    async def test_generate_answer_503_service_unavailable_then_success(
        self, httpx_mock
    ):
        """Test that 503 error is retried and succeeds."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        # First call: service unavailable
        httpx_mock.add_response(
            method="POST",
            url=api_url,
            status_code=503,
            json={"error": {"message": "Service temporarily unavailable"}},
        )

        # Second call: success
        httpx_mock.add_response(
            method="POST",
            url=api_url,
            status_code=200,
            json={
                "choices": [{"message": {"role": "assistant", "content": "Recovered"}}],
                "usage": {"total_tokens": 20},
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        assert response.answer_text == "Recovered"
        assert len(httpx_mock.get_requests()) == 2

    @pytest.mark.asyncio
    async def test_generate_answer_max_retries_exhausted(self, httpx_mock):
        """Test that HTTPStatusError is raised after max retries."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        # Mock 3 failed attempts (MAX_ATTEMPTS = 3)
        for _ in range(3):
            httpx_mock.add_response(
                method="POST",
                url=api_url,
                status_code=500,
                json={"error": {"message": "Server error"}},
            )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(httpx.HTTPStatusError):
            await client.generate_answer("Test")

        # Verify max attempts were made
        assert len(httpx_mock.get_requests()) == 3


class TestTokenUsageExtraction:
    """Test suite for token usage extraction."""

    @pytest.mark.asyncio
    async def test_extract_token_usage_complete(self, httpx_mock):
        """Test extraction with all token fields present."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": [{"message": {"role": "assistant", "content": "Test"}}],
                "usage": {
                    "prompt_tokens": 100,
                    "completion_tokens": 50,
                    "total_tokens": 150,
                },
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        assert response.tokens_used == 150
        assert response.prompt_tokens == 100
        assert response.completion_tokens == 50

    @pytest.mark.asyncio
    async def test_extract_token_usage_missing_total(self, httpx_mock):
        """Test extraction when total_tokens is missing (calculated from parts)."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": [{"message": {"role": "assistant", "content": "Test"}}],
                "usage": {
                    "prompt_tokens": 75,
                    "completion_tokens": 25,
                },
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        assert response.tokens_used == 100  # 75 + 25
        assert response.prompt_tokens == 75
        assert response.completion_tokens == 25

    @pytest.mark.asyncio
    async def test_extract_token_usage_missing_usage(self, httpx_mock, caplog):
        """Test graceful handling when usage data is missing."""
        caplog.set_level(logging.WARNING)
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": [{"message": {"role": "assistant", "content": "Test"}}],
                # No usage field
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        assert response.tokens_used == 0
        assert response.prompt_tokens == 0
        assert response.completion_tokens == 0
        assert "missing 'usage'" in caplog.text


class TestCostEstimation:
    """Test suite for cost estimation."""

    @pytest.mark.asyncio
    async def test_cost_estimation_llama_31_8b(self, httpx_mock):
        """Test cost calculation for llama-3.1-8b-instant model."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": [{"message": {"role": "assistant", "content": "Test"}}],
                "usage": {
                    "prompt_tokens": 1000,
                    "completion_tokens": 500,
                },
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        # llama-3.1-8b-instant: $0.05/1M input, $0.08/1M output
        # Cost = (1000 * 0.05/1M) + (500 * 0.08/1M) = 0.00005 + 0.00004 = 0.00009
        assert response.cost_usd == pytest.approx(0.00009, rel=1e-6)

    @pytest.mark.asyncio
    async def test_cost_estimation_llama_33_70b(self, httpx_mock):
        """Test cost calculation for llama-3.3-70b-versatile model."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": [{"message": {"role": "assistant", "content": "Test"}}],
                "usage": {
                    "prompt_tokens": 1000,
                    "completion_tokens": 500,
                },
            },
        )

        client = GroqClient(
            "llama-3.3-70b-versatile", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        # llama-3.3-70b-versatile: $0.59/1M input, $0.79/1M output
        # Cost = (1000 * 0.59/1M) + (500 * 0.79/1M) = 0.00059 + 0.000395 = 0.000985
        assert response.cost_usd == pytest.approx(0.000985, rel=1e-6)

    @pytest.mark.asyncio
    async def test_cost_estimation_mixtral(self, httpx_mock):
        """Test cost calculation for mixtral-8x7b-32768 model."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": [{"message": {"role": "assistant", "content": "Test"}}],
                "usage": {
                    "prompt_tokens": 1000,
                    "completion_tokens": 500,
                },
            },
        )

        client = GroqClient("mixtral-8x7b-32768", "gsk-test123", TEST_SYSTEM_PROMPT)
        response = await client.generate_answer("Test")

        # mixtral-8x7b-32768: $0.24/1M input, $0.24/1M output
        # Cost = (1000 * 0.24/1M) + (500 * 0.24/1M) = 0.00024 + 0.00012 = 0.00036
        assert response.cost_usd == pytest.approx(0.00036, rel=1e-6)


class TestErrorResponseParsing:
    """Test suite for error response parsing."""

    @pytest.mark.asyncio
    async def test_extract_error_detail_with_message(self, httpx_mock):
        """Test error detail extraction from API error response."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            status_code=401,
            json={"error": {"message": "Invalid API key provided"}},
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-invalid", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError) as exc_info:
            await client.generate_answer("Test")

        error_msg = str(exc_info.value)
        assert "Invalid API key provided" in error_msg

    @pytest.mark.asyncio
    async def test_extract_error_detail_malformed_json(self, httpx_mock):
        """Test error detail extraction with malformed error response."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        # Mock 3 attempts (MAX_ATTEMPTS = 3) with malformed JSON
        for _ in range(3):
            httpx_mock.add_response(
                method="POST",
                url=api_url,
                status_code=500,
                content=b"Not JSON",
            )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )

        # Should handle gracefully and raise HTTPStatusError after retries
        with pytest.raises(httpx.HTTPStatusError):
            await client.generate_answer("Test")

        # Verify max attempts were made
        assert len(httpx_mock.get_requests()) == 3


class TestResponseParsing:
    """Test suite for response parsing edge cases."""

    @pytest.mark.asyncio
    async def test_missing_choices_array(self, httpx_mock):
        """Test error handling when choices array is missing."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                # Missing choices field
                "usage": {"total_tokens": 10},
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="missing 'choices' array"):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_empty_choices_array(self, httpx_mock):
        """Test error handling when choices array is empty."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": [],  # Empty array
                "usage": {"total_tokens": 10},
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="missing 'choices' array"):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_missing_message_field(self, httpx_mock):
        """Test error handling when message field is missing."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": [
                    {
                        # Missing message field
                        "finish_reason": "stop",
                    }
                ],
                "usage": {"total_tokens": 10},
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="missing 'message'"):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_missing_content_field(self, httpx_mock):
        """Test error handling when content field is missing."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            # Missing content field
                        },
                    }
                ],
                "usage": {"total_tokens": 10},
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="missing 'content' field"):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_malformed_json_response(self, httpx_mock):
        """Test error handling with malformed JSON response."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            content=b"Not valid JSON",
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="Failed to parse Groq response JSON"):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_invalid_choice_structure_not_dict(self, httpx_mock):
        """Test error handling when choice is not a dict."""
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": ["not a dict"],  # Invalid: choice should be dict
                "usage": {"total_tokens": 10},
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="Invalid choice structure"):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_unexpected_finish_reason_logs_warning(self, httpx_mock, caplog):
        """Test that unexpected finish_reason values log a warning."""
        caplog.set_level(logging.WARNING)
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": "Test response",
                        },
                        "finish_reason": "content_filter",  # Unexpected finish reason
                    }
                ],
                "usage": {"total_tokens": 10},
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        # Should still return the response
        assert response.answer_text == "Test response"

        # Should log warning about unexpected finish reason
        assert "unexpected finish_reason" in caplog.text
        assert "content_filter" in caplog.text


class TestNetworkErrors:
    """Test suite for network-related errors."""

    @pytest.mark.asyncio
    async def test_connection_error(self, httpx_mock):
        """Test handling of connection errors with retry logic."""
        # Mock 3 connection errors (MAX_ATTEMPTS = 3)
        for _ in range(3):
            httpx_mock.add_exception(
                httpx.ConnectError("Connection refused"),
            )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(httpx.ConnectError):
            await client.generate_answer("Test")

        # Verify max attempts were made
        assert len(httpx_mock.get_requests()) == 3

    @pytest.mark.asyncio
    async def test_timeout_error(self, httpx_mock):
        """Test handling of timeout errors with retry logic."""
        # Mock 3 timeout errors (MAX_ATTEMPTS = 3)
        for _ in range(3):
            httpx_mock.add_exception(
                httpx.TimeoutException("Request timed out"),
            )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(httpx.TimeoutException):
            await client.generate_answer("Test")

        # Verify max attempts were made
        assert len(httpx_mock.get_requests()) == 3


class TestLogging:
    """Test suite for logging behavior."""

    @pytest.mark.asyncio
    async def test_never_logs_api_key(self, httpx_mock, caplog):
        """Test that API key is NEVER logged in any circumstances."""
        caplog.set_level(logging.DEBUG)
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            json={
                "choices": [{"message": {"role": "assistant", "content": "Test"}}],
                "usage": {"total_tokens": 10},
            },
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-secret-key", TEST_SYSTEM_PROMPT
        )
        await client.generate_answer("Test prompt")

        # Should NEVER log the API key
        assert "gsk-secret-key" not in caplog.text
        assert "secret-key" not in caplog.text

        # Should log model name
        assert "llama-3.1-8b-instant" in caplog.text

    @pytest.mark.asyncio
    async def test_never_logs_api_key_on_error(self, httpx_mock, caplog):
        """Test that API key is not logged even in error cases."""
        caplog.set_level(logging.ERROR)
        api_url = f"{GROQ_API_BASE_URL}/chat/completions"

        httpx_mock.add_response(
            method="POST",
            url=api_url,
            status_code=401,
            json={"error": {"message": "Invalid API key"}},
        )

        client = GroqClient(
            "llama-3.1-8b-instant", "gsk-secret-key", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError):
            await client.generate_answer("Test")

        # Should NEVER log the API key, even in errors
        assert "gsk-secret-key" not in caplog.text
        assert "secret-key" not in caplog.text
