"""
Tests for llm_runner.openai_client module.

Tests cover:
- OpenAIClient initialization and validation
- Successful API calls with proper response parsing
- Retry logic on transient failures (429, 5xx)
- Immediate failure on non-retryable errors (401, 400, 404)
- Token usage extraction and cost calculation
- Error handling and logging (without logging API keys)
- Edge cases (empty responses, malformed JSON, missing fields)
"""

import logging

import httpx
import pytest
from freezegun import freeze_time

from llm_answer_watcher.llm_runner.models import LLMResponse
from llm_answer_watcher.llm_runner.openai_client import (
    MAX_PROMPT_LENGTH,
    OPENAI_API_URL,
    OpenAIClient,
)

# Test system prompt for all tests
TEST_SYSTEM_PROMPT = "You are a test assistant."


class TestOpenAIClientInit:
    """Test suite for OpenAIClient initialization."""

    def test_init_success(self):
        """Test successful client initialization."""
        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)

        assert client.model_name == "gpt-4o-mini"
        assert client.api_key == "sk-test123"

    def test_init_different_model(self):
        """Test initialization with different model."""
        client = OpenAIClient("gpt-4o", "sk-prod456", TEST_SYSTEM_PROMPT)

        assert client.model_name == "gpt-4o"
        assert client.api_key == "sk-prod456"

    def test_init_empty_model_name(self):
        """Test that empty model_name raises ValueError."""
        with pytest.raises(ValueError, match="model_name cannot be empty"):
            OpenAIClient("", "sk-test123", TEST_SYSTEM_PROMPT)

    def test_init_whitespace_model_name(self):
        """Test that whitespace-only model_name raises ValueError."""
        with pytest.raises(ValueError, match="model_name cannot be empty"):
            OpenAIClient("   ", "sk-test123", TEST_SYSTEM_PROMPT)

    def test_init_empty_api_key(self):
        """Test that empty api_key raises ValueError."""
        with pytest.raises(ValueError, match="api_key cannot be empty"):
            OpenAIClient("gpt-4o-mini", "", TEST_SYSTEM_PROMPT)

    def test_init_whitespace_api_key(self):
        """Test that whitespace-only api_key raises ValueError."""
        with pytest.raises(ValueError, match="api_key cannot be empty"):
            OpenAIClient("gpt-4o-mini", "   ", TEST_SYSTEM_PROMPT)

    def test_init_empty_system_prompt(self):
        """Test that empty system_prompt raises ValueError."""
        with pytest.raises(ValueError, match="system_prompt cannot be empty"):
            OpenAIClient("gpt-4o-mini", "sk-test123", "")

    def test_init_whitespace_system_prompt(self):
        """Test that whitespace-only system_prompt raises ValueError."""
        with pytest.raises(ValueError, match="system_prompt cannot be empty"):
            OpenAIClient("gpt-4o-mini", "sk-test123", "   ")

    def test_init_logs_model_not_api_key(self, caplog):
        """Test that initialization logs model name but NEVER logs API key."""
        caplog.set_level(logging.INFO)

        OpenAIClient("gpt-4o-mini", "sk-secret123", TEST_SYSTEM_PROMPT)

        # Should log model name
        assert "gpt-4o-mini" in caplog.text

        # Should NEVER log API key
        assert "sk-secret123" not in caplog.text
        assert "secret" not in caplog.text


class TestGenerateAnswerSuccess:
    """Test suite for successful OpenAI API calls."""

    @freeze_time("2025-11-02T08:30:45Z")
    @pytest.mark.asyncio
    async def test_generate_answer_success(self, httpx_mock):
        """Test successful API call with complete response."""
        # Mock successful OpenAI Responses API response
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            json={
                "output": [
                    {
                        "role": "assistant",
                        "content": [
                            {
                                "type": "output_text",
                                "text": "Based on market research, the top CRM tools are Salesforce, HubSpot, and Zoho.",
                            }
                        ],
                    }
                ],
                "usage": {
                    "prompt_tokens": 100,
                    "completion_tokens": 50,
                    "total_tokens": 150,
                },
                "model": "gpt-4o-mini",
            },
        )

        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)
        response = await client.generate_answer("What are the best CRM tools?")

        # Verify response structure
        assert isinstance(response, LLMResponse)
        assert (
            response.answer_text
            == "Based on market research, the top CRM tools are Salesforce, HubSpot, and Zoho."
        )
        assert response.tokens_used == 150
        assert response.cost_usd > 0  # Should have calculated cost
        assert response.provider == "openai"
        assert response.model_name == "gpt-4o-mini"
        assert response.timestamp_utc == "2025-11-02T08:30:45Z"

    @pytest.mark.asyncio
    async def test_generate_answer_sends_correct_payload(self, httpx_mock):
        """Test that API request includes developer message and correct structure."""
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            json={
                "output": [
                    {
                        "role": "assistant",
                        "content": [{"type": "output_text", "text": "Test response"}],
                    }
                ],
                "usage": {"total_tokens": 100},
            },
        )

        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)
        await client.generate_answer("Test prompt")

        # Verify request was made
        request = httpx_mock.get_request()
        assert request is not None

        # Verify request structure for Responses API
        payload = request.read()
        import json

        data = json.loads(payload)

        assert data["model"] == "gpt-4o-mini"
        assert len(data["input"]) == 2
        assert data["input"][0]["type"] == "message"
        assert data["input"][0]["role"] == "developer"
        assert data["input"][0]["content"][0]["type"] == "input_text"
        assert data["input"][0]["content"][0]["text"] == TEST_SYSTEM_PROMPT
        assert data["input"][1]["type"] == "message"
        assert data["input"][1]["role"] == "user"
        assert data["input"][1]["content"][0]["type"] == "input_text"
        assert data["input"][1]["content"][0]["text"] == "Test prompt"
        assert data["temperature"] == 0.7

    @pytest.mark.asyncio
    async def test_generate_answer_sends_auth_header(self, httpx_mock):
        """Test that API request includes Bearer token in Authorization header."""
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            json={
                "output": [
                    {
                        "role": "assistant",
                        "content": [{"type": "output_text", "text": "Test"}],
                    }
                ],
                "usage": {"total_tokens": 10},
            },
        )

        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)
        await client.generate_answer("Test")

        # Verify Authorization header
        request = httpx_mock.get_request()
        assert request.headers["Authorization"] == "Bearer sk-test123"
        assert request.headers["Content-Type"] == "application/json"

    @pytest.mark.asyncio
    async def test_generate_answer_empty_content(self, httpx_mock):
        """Test handling of empty content in response (treated as no content)."""
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            json={
                "output": [
                    {
                        "role": "assistant",
                        "content": [{"type": "output_text", "text": ""}],
                    }
                ],
                "usage": {"total_tokens": 10},
            },
        )

        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)

        # Empty text is skipped, so this raises RuntimeError for no text content
        with pytest.raises(
            RuntimeError, match="OpenAI response contains no text content"
        ):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_generate_answer_large_response(self, httpx_mock):
        """Test handling of large response with high token count."""
        large_content = "A" * 10000
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            json={
                "output": [
                    {
                        "role": "assistant",
                        "content": [{"type": "output_text", "text": large_content}],
                    }
                ],
                "usage": {"total_tokens": 50000},
            },
        )

        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)
        response = await client.generate_answer("Generate large text")

        assert response.answer_text == large_content
        assert response.tokens_used == 50000


class TestGenerateAnswerValidation:
    """Test suite for input validation."""

    @pytest.mark.asyncio
    async def test_generate_answer_empty_prompt(self, httpx_mock):
        """Test that empty prompt raises ValueError."""
        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)

        with pytest.raises(ValueError, match="Prompt cannot be empty"):
            await client.generate_answer("")

    @pytest.mark.asyncio
    async def test_generate_answer_whitespace_prompt(self, httpx_mock):
        """Test that whitespace-only prompt raises ValueError."""
        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)

        with pytest.raises(ValueError, match="Prompt cannot be empty"):
            await client.generate_answer("   \n\t  ")


class TestPromptLengthValidation:
    """Test suite for prompt length validation in OpenAI client."""

    @pytest.mark.asyncio
    async def test_generate_answer_accepts_normal_prompt(self, httpx_mock):
        """Normal-length prompts should be accepted."""
        # Mock successful response
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            json={
                "output": [
                    {
                        "role": "assistant",
                        "content": [{"type": "output_text", "text": "Test response"}],
                    }
                ],
                "usage": {"total_tokens": 100},
            },
        )

        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)
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
            url=OPENAI_API_URL,
            json={
                "output": [
                    {
                        "role": "assistant",
                        "content": [{"type": "output_text", "text": "Test response"}],
                    }
                ],
                "usage": {"total_tokens": 100},
            },
        )

        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)
        prompt = "a" * MAX_PROMPT_LENGTH
        response = await client.generate_answer(prompt)

        # Should not raise ValueError for length
        assert response.answer_text == "Test response"

    @pytest.mark.asyncio
    async def test_generate_answer_rejects_over_limit_prompt(self):
        """Prompts over max length should raise ValueError."""
        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)
        prompt = "a" * (MAX_PROMPT_LENGTH + 1)

        with pytest.raises(ValueError, match=r"Prompt exceeds maximum length"):
            await client.generate_answer(prompt)

    @pytest.mark.asyncio
    async def test_generate_answer_rejects_very_long_prompt(self):
        """Very long prompts should raise ValueError with correct count."""
        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)
        prompt = "a" * (MAX_PROMPT_LENGTH * 2)

        with pytest.raises(ValueError, match=r"200,000 characters"):
            await client.generate_answer(prompt)

    @pytest.mark.asyncio
    async def test_generate_answer_error_message_shows_actual_length(self):
        """Error message should show actual received length."""
        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)
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
            url=OPENAI_API_URL,
            status_code=401,
            json={"error": {"message": "Invalid API key"}},
        )

        client = OpenAIClient("gpt-4o-mini", "sk-invalid", TEST_SYSTEM_PROMPT)

        with pytest.raises(RuntimeError, match="non-retryable"):
            await client.generate_answer("Test")

        # Verify only one request was made (no retry)
        assert len(httpx_mock.get_requests()) == 1

    @pytest.mark.asyncio
    async def test_generate_answer_400_bad_request(self, httpx_mock):
        """Test that 400 error raises RuntimeError immediately (no retry)."""
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            status_code=400,
            json={"error": {"message": "Invalid request format"}},
        )

        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)

        with pytest.raises(RuntimeError, match="non-retryable"):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_generate_answer_404_not_found(self, httpx_mock):
        """Test that 404 error raises RuntimeError immediately (no retry)."""
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            status_code=404,
            json={"error": {"message": "Endpoint not found"}},
        )

        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)

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
            url=OPENAI_API_URL,
            status_code=429,
            json={"error": {"message": "Rate limit exceeded"}},
        )

        # Second call: success
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            status_code=200,
            json={
                "output": [
                    {
                        "role": "assistant",
                        "content": [
                            {"type": "output_text", "text": "Success after retry"}
                        ],
                    }
                ],
                "usage": {"total_tokens": 50},
            },
        )

        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)
        response = await client.generate_answer("Test")

        assert response.answer_text == "Success after retry"
        assert len(httpx_mock.get_requests()) == 2  # Two attempts

    @pytest.mark.asyncio
    async def test_generate_answer_500_server_error_then_success(self, httpx_mock):
        """Test that 500 error is retried and succeeds."""
        # First call: server error
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            status_code=500,
            json={"error": {"message": "Internal server error"}},
        )

        # Second call: success
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            status_code=200,
            json={
                "output": [
                    {
                        "role": "assistant",
                        "content": [{"type": "output_text", "text": "Recovered"}],
                    }
                ],
                "usage": {"total_tokens": 30},
            },
        )

        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)
        response = await client.generate_answer("Test")

        assert response.answer_text == "Recovered"

    @pytest.mark.asyncio
    async def test_generate_answer_502_bad_gateway_exhausts_retries(self, httpx_mock):
        """Test that 502 exhausts retries and raises error."""
        # Mock 3 failed attempts (max retries from retry_config)
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            status_code=502,
            json={"error": {"message": "Bad gateway"}},
        )
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            status_code=502,
            json={"error": {"message": "Bad gateway"}},
        )
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            status_code=502,
            json={"error": {"message": "Bad gateway"}},
        )

        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)

        with pytest.raises(httpx.HTTPStatusError):
            await client.generate_answer("Test")


class TestGenerateAnswerResponseParsing:
    """Test suite for response parsing edge cases."""

    @pytest.mark.asyncio
    async def test_generate_answer_missing_output(self, httpx_mock):
        """Test that missing 'output' raises RuntimeError."""
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            json={"usage": {"total_tokens": 10}},  # Missing 'output'
        )

        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)

        with pytest.raises(RuntimeError, match="missing 'output' array"):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_generate_answer_empty_output(self, httpx_mock):
        """Test that empty output array raises RuntimeError."""
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            json={"output": [], "usage": {"total_tokens": 10}},
        )

        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)

        with pytest.raises(RuntimeError, match="missing 'output' array"):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_generate_answer_invalid_output_structure(self, httpx_mock):
        """Test that invalid output structure raises RuntimeError."""
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            json={"output": [{}], "usage": {"total_tokens": 10}},
        )

        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)

        # Empty output item has no content, resulting in "no text content" error
        with pytest.raises(
            RuntimeError, match="OpenAI response contains no text content"
        ):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_generate_answer_missing_content(self, httpx_mock):
        """Test that missing 'content' raises RuntimeError."""
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            json={
                "output": [{"role": "assistant"}],  # No 'content'
                "usage": {"total_tokens": 10},
            },
        )

        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)

        # Missing content field results in "no text content" error
        with pytest.raises(
            RuntimeError, match="OpenAI response contains no text content"
        ):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_generate_answer_missing_usage(self, httpx_mock, caplog):
        """Test that missing usage data returns 0 tokens with warning."""
        caplog.set_level(logging.WARNING)

        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            json={
                "output": [
                    {
                        "role": "assistant",
                        "content": [{"type": "output_text", "text": "Test"}],
                    }
                ]
            },  # No 'usage'
        )

        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)
        response = await client.generate_answer("Test")

        assert response.tokens_used == 0
        assert response.cost_usd == 0.0
        assert "missing 'usage' data" in caplog.text

    @pytest.mark.asyncio
    async def test_generate_answer_invalid_json(self, httpx_mock):
        """Test that invalid JSON raises RuntimeError."""
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            content=b"Not valid JSON",
        )

        client = OpenAIClient("gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)

        with pytest.raises(RuntimeError, match="Failed to parse OpenAI response JSON"):
            await client.generate_answer("Test")


class TestGenerateAnswerLogging:
    """Test suite for logging behavior (security-critical)."""

    @pytest.mark.asyncio
    async def test_generate_answer_never_logs_api_key(self, httpx_mock, caplog):
        """Test that API key is NEVER logged in any form."""
        caplog.set_level(logging.DEBUG)

        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            json={
                "output": [
                    {
                        "role": "assistant",
                        "content": [{"type": "output_text", "text": "Test"}],
                    }
                ],
                "usage": {"total_tokens": 10},
            },
        )

        client = OpenAIClient("gpt-4o-mini", "sk-secret123", TEST_SYSTEM_PROMPT)
        await client.generate_answer("Test prompt")

        # Should log model name
        assert "gpt-4o-mini" in caplog.text

        # Should NEVER log API key (not even partial)
        assert "sk-secret123" not in caplog.text
        assert "secret" not in caplog.text
        assert "Bearer" not in caplog.text  # Don't log auth header

    @pytest.mark.asyncio
    async def test_generate_answer_error_never_logs_api_key(self, httpx_mock, caplog):
        """Test that errors NEVER log API key."""
        caplog.set_level(logging.DEBUG)

        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            status_code=500,
            json={"error": {"message": "Internal server error"}},
        )
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            status_code=500,
            json={"error": {"message": "Internal server error"}},
        )
        httpx_mock.add_response(
            method="POST",
            url=OPENAI_API_URL,
            status_code=500,
            json={"error": {"message": "Internal server error"}},
        )

        client = OpenAIClient("gpt-4o-mini", "sk-secret123", TEST_SYSTEM_PROMPT)

        with pytest.raises(httpx.HTTPStatusError):
            await client.generate_answer("Test")

        # Should log error
        assert "500" in caplog.text or "error" in caplog.text.lower()

        # Should NEVER log API key
        assert "sk-secret123" not in caplog.text
        assert "secret" not in caplog.text


class TestExtractErrorDetail:
    """Test suite for error detail extraction."""

    def test_extract_error_detail_valid_json(self):
        """Test extracting error message from valid error response."""
        client = OpenAIClient("gpt-4o-mini", "sk-test", TEST_SYSTEM_PROMPT)

        response = httpx.Response(
            status_code=401,
            json={"error": {"message": "Invalid API key"}},
        )

        detail = client._extract_error_detail(response)
        assert detail == "Invalid API key"

    def test_extract_error_detail_missing_message(self):
        """Test fallback when error message is missing."""
        client = OpenAIClient("gpt-4o-mini", "sk-test", TEST_SYSTEM_PROMPT)

        response = httpx.Response(
            status_code=500,
            json={"error": {}},
        )

        detail = client._extract_error_detail(response)
        assert detail == "Unknown error"

    def test_extract_error_detail_invalid_json(self):
        """Test fallback when JSON parsing fails."""
        client = OpenAIClient("gpt-4o-mini", "sk-test", TEST_SYSTEM_PROMPT)

        response = httpx.Response(
            status_code=500,
            content=b"Not JSON",
        )

        detail = client._extract_error_detail(response)
        assert detail == "HTTP 500"
