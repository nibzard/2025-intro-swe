"""
Tests for llm_runner.anthropic_client module.

Tests cover:
- AnthropicClient initialization and validation
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

from llm_answer_watcher.llm_runner.anthropic_client import (
    ANTHROPIC_API_URL,
    ANTHROPIC_VERSION,
    MAX_PROMPT_LENGTH,
    AnthropicClient,
)
from llm_answer_watcher.llm_runner.models import LLMResponse

# Test system prompt for all tests
TEST_SYSTEM_PROMPT = "You are a test assistant."


class TestAnthropicClientInit:
    """Test suite for AnthropicClient initialization."""

    def test_init_success(self):
        """Test successful client initialization."""
        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )

        assert client.model_name == "claude-3-5-haiku-20241022"
        assert client.api_key == "sk-ant-test123"
        assert client.system_prompt == TEST_SYSTEM_PROMPT

    def test_init_different_model(self):
        """Test initialization with different model."""
        client = AnthropicClient(
            "claude-3-5-sonnet-20241022", "sk-ant-prod456", TEST_SYSTEM_PROMPT
        )

        assert client.model_name == "claude-3-5-sonnet-20241022"
        assert client.api_key == "sk-ant-prod456"

    def test_init_empty_model_name(self):
        """Test that empty model_name raises ValueError."""
        with pytest.raises(ValueError, match="model_name cannot be empty"):
            AnthropicClient("", "sk-ant-test123", TEST_SYSTEM_PROMPT)

    def test_init_whitespace_model_name(self):
        """Test that whitespace-only model_name raises ValueError."""
        with pytest.raises(ValueError, match="model_name cannot be empty"):
            AnthropicClient("   ", "sk-ant-test123", TEST_SYSTEM_PROMPT)

    def test_init_empty_api_key(self):
        """Test that empty api_key raises ValueError."""
        with pytest.raises(ValueError, match="api_key cannot be empty"):
            AnthropicClient("claude-3-5-haiku-20241022", "", TEST_SYSTEM_PROMPT)

    def test_init_whitespace_api_key(self):
        """Test that whitespace-only api_key raises ValueError."""
        with pytest.raises(ValueError, match="api_key cannot be empty"):
            AnthropicClient("claude-3-5-haiku-20241022", "   ", TEST_SYSTEM_PROMPT)

    def test_init_empty_system_prompt(self):
        """Test that empty system_prompt raises ValueError."""
        with pytest.raises(ValueError, match="system_prompt cannot be empty"):
            AnthropicClient("claude-3-5-haiku-20241022", "sk-ant-test123", "")

    def test_init_whitespace_system_prompt(self):
        """Test that whitespace-only system_prompt raises ValueError."""
        with pytest.raises(ValueError, match="system_prompt cannot be empty"):
            AnthropicClient("claude-3-5-haiku-20241022", "sk-ant-test123", "   ")

    def test_init_logs_model_not_api_key(self, caplog):
        """Test that initialization logs model name but NEVER logs API key."""
        caplog.set_level(logging.INFO)

        AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-secret123", TEST_SYSTEM_PROMPT
        )

        # Should log model name
        assert "claude-3-5-haiku-20241022" in caplog.text

        # Should NEVER log API key
        assert "sk-ant-secret123" not in caplog.text
        assert "secret" not in caplog.text

    def test_init_with_tools_logs_warning(self, caplog):
        """Test that initialization with tools logs a warning."""
        caplog.set_level(logging.WARNING)

        AnthropicClient(
            "claude-3-5-haiku-20241022",
            "sk-ant-test123",
            TEST_SYSTEM_PROMPT,
            tools=[{"type": "web_search"}],
        )

        # Should log warning about tools not being supported
        assert "Tools are not currently supported" in caplog.text


class TestGenerateAnswerSuccess:
    """Test suite for successful Anthropic API calls."""

    @freeze_time("2025-11-02T08:30:45Z")
    @pytest.mark.asyncio
    async def test_generate_answer_success(self, httpx_mock):
        """Test successful API call with complete response."""
        # Mock successful Anthropic Messages API response
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            json={
                "id": "msg_test123",
                "type": "message",
                "role": "assistant",
                "content": [
                    {
                        "type": "text",
                        "text": "Based on market research, the top CRM tools are Salesforce, HubSpot, and Zoho.",
                    }
                ],
                "model": "claude-3-5-haiku-20241022",
                "stop_reason": "end_turn",
                "usage": {
                    "input_tokens": 100,
                    "output_tokens": 50,
                },
            },
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("What are the best CRM tools?")

        # Verify response structure
        assert isinstance(response, LLMResponse)
        assert (
            response.answer_text
            == "Based on market research, the top CRM tools are Salesforce, HubSpot, and Zoho."
        )
        assert response.tokens_used == 150  # 100 input + 50 output
        assert response.prompt_tokens == 100
        assert response.completion_tokens == 50
        assert response.cost_usd > 0  # Should have calculated cost
        assert response.provider == "anthropic"
        assert response.model_name == "claude-3-5-haiku-20241022"
        assert response.timestamp_utc == "2025-11-02T08:30:45Z"
        assert response.web_search_results is None
        assert response.web_search_count == 0

    @pytest.mark.asyncio
    async def test_generate_answer_sends_correct_payload(self, httpx_mock):
        """Test that API request includes correct structure for Anthropic."""
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            json={
                "content": [{"type": "text", "text": "Test response"}],
                "usage": {"input_tokens": 10, "output_tokens": 5},
            },
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )
        await client.generate_answer("Test prompt")

        # Verify request was made
        request = httpx_mock.get_request()
        assert request is not None

        # Verify request structure for Messages API
        payload = request.read()
        import json

        data = json.loads(payload)

        assert data["model"] == "claude-3-5-haiku-20241022"
        assert data["system"] == TEST_SYSTEM_PROMPT
        assert data["max_tokens"] == 4096  # Default max_tokens
        assert data["temperature"] == 0.7
        assert len(data["messages"]) == 1
        assert data["messages"][0]["role"] == "user"
        assert data["messages"][0]["content"] == "Test prompt"

    @pytest.mark.asyncio
    async def test_generate_answer_sends_auth_header(self, httpx_mock):
        """Test that API request includes x-api-key and anthropic-version headers."""
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            json={
                "content": [{"type": "text", "text": "Test"}],
                "usage": {"input_tokens": 5, "output_tokens": 5},
            },
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )
        await client.generate_answer("Test")

        # Verify headers
        request = httpx_mock.get_request()
        assert request.headers["x-api-key"] == "sk-ant-test123"
        assert request.headers["anthropic-version"] == ANTHROPIC_VERSION
        assert request.headers["content-type"] == "application/json"

    @pytest.mark.asyncio
    async def test_generate_answer_large_response(self, httpx_mock):
        """Test handling of large response with high token count."""
        large_content = "A" * 10000
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            json={
                "content": [{"type": "text", "text": large_content}],
                "usage": {"input_tokens": 100, "output_tokens": 25000},
            },
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Generate large text")

        assert response.answer_text == large_content
        assert response.tokens_used == 25100  # 100 + 25000


class TestGenerateAnswerValidation:
    """Test suite for input validation."""

    @pytest.mark.asyncio
    async def test_generate_answer_empty_prompt(self):
        """Test that empty prompt raises ValueError."""
        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(ValueError, match="Prompt cannot be empty"):
            await client.generate_answer("")

    @pytest.mark.asyncio
    async def test_generate_answer_whitespace_prompt(self):
        """Test that whitespace-only prompt raises ValueError."""
        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(ValueError, match="Prompt cannot be empty"):
            await client.generate_answer("   \n\t  ")


class TestPromptLengthValidation:
    """Test suite for prompt length validation in Anthropic client."""

    @pytest.mark.asyncio
    async def test_generate_answer_accepts_normal_prompt(self, httpx_mock):
        """Normal-length prompts should be accepted."""
        # Mock successful response
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            json={
                "content": [{"type": "text", "text": "Test response"}],
                "usage": {"input_tokens": 100, "output_tokens": 10},
            },
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
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
            url=ANTHROPIC_API_URL,
            json={
                "content": [{"type": "text", "text": "Test response"}],
                "usage": {"input_tokens": 100, "output_tokens": 10},
            },
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )
        prompt = "a" * MAX_PROMPT_LENGTH
        response = await client.generate_answer(prompt)

        # Should not raise ValueError for length
        assert response.answer_text == "Test response"

    @pytest.mark.asyncio
    async def test_generate_answer_rejects_over_limit_prompt(self):
        """Prompts over max length should raise ValueError."""
        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )
        prompt = "a" * (MAX_PROMPT_LENGTH + 1)

        with pytest.raises(ValueError, match=r"Prompt exceeds maximum length"):
            await client.generate_answer(prompt)

    @pytest.mark.asyncio
    async def test_generate_answer_rejects_very_long_prompt(self):
        """Very long prompts should raise ValueError with correct count."""
        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )
        prompt = "a" * (MAX_PROMPT_LENGTH * 2)

        with pytest.raises(ValueError, match=r"200,000 characters"):
            await client.generate_answer(prompt)


class TestGenerateAnswerErrorHandling:
    """Test suite for error handling in API calls."""

    @pytest.mark.asyncio
    async def test_generate_answer_http_401_fails_immediately(self, httpx_mock):
        """Test that 401 (auth error) fails immediately without retry."""
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            status_code=401,
            json={"error": {"message": "Invalid API key"}},
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="non-retryable.*401"):
            await client.generate_answer("Test")

        # Should only attempt once (no retry)
        assert len(httpx_mock.get_requests()) == 1

    @pytest.mark.asyncio
    async def test_generate_answer_http_400_fails_immediately(self, httpx_mock):
        """Test that 400 (bad request) fails immediately without retry."""
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            status_code=400,
            json={"error": {"message": "Invalid request"}},
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="non-retryable.*400"):
            await client.generate_answer("Test")

        # Should only attempt once (no retry)
        assert len(httpx_mock.get_requests()) == 1

    @pytest.mark.asyncio
    async def test_generate_answer_http_404_fails_immediately(self, httpx_mock):
        """Test that 404 (not found) fails immediately without retry."""
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            status_code=404,
            json={"error": {"message": "Not found"}},
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="non-retryable.*404"):
            await client.generate_answer("Test")

        # Should only attempt once (no retry)
        assert len(httpx_mock.get_requests()) == 1

    @pytest.mark.asyncio
    async def test_generate_answer_http_429_retries(self, httpx_mock):
        """Test that 429 (rate limit) triggers retry logic."""
        # First attempt: 429
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            status_code=429,
            json={"error": {"message": "Rate limit exceeded"}},
        )

        # Second attempt: Success
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            json={
                "content": [{"type": "text", "text": "Success after retry"}],
                "usage": {"input_tokens": 10, "output_tokens": 5},
            },
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        # Should have retried and succeeded
        assert response.answer_text == "Success after retry"
        assert len(httpx_mock.get_requests()) == 2

    @pytest.mark.asyncio
    async def test_generate_answer_http_500_retries(self, httpx_mock):
        """Test that 500 (server error) triggers retry logic."""
        # First attempt: 500
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            status_code=500,
            json={"error": {"message": "Internal server error"}},
        )

        # Second attempt: Success
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            json={
                "content": [{"type": "text", "text": "Success after retry"}],
                "usage": {"input_tokens": 10, "output_tokens": 5},
            },
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        # Should have retried and succeeded
        assert response.answer_text == "Success after retry"
        assert len(httpx_mock.get_requests()) == 2

    @pytest.mark.asyncio
    async def test_generate_answer_connection_error_retries(self, httpx_mock):
        """Test that connection errors trigger retry logic."""
        # First attempt: Connection error
        httpx_mock.add_exception(httpx.ConnectError("Connection failed"))

        # Second attempt: Success
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            json={
                "content": [{"type": "text", "text": "Success after retry"}],
                "usage": {"input_tokens": 10, "output_tokens": 5},
            },
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        # Should have retried and succeeded
        assert response.answer_text == "Success after retry"

    @pytest.mark.asyncio
    async def test_generate_answer_invalid_json_response(self, httpx_mock):
        """Test that invalid JSON response raises RuntimeError."""
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            content=b"Not valid JSON",
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(
            RuntimeError, match="Failed to parse Anthropic response JSON"
        ):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_generate_answer_missing_content_field(self, httpx_mock):
        """Test that missing content field raises RuntimeError."""
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            json={
                "usage": {"input_tokens": 10, "output_tokens": 5},
            },
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="missing 'content' array"):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_generate_answer_empty_content_array(self, httpx_mock):
        """Test that empty content array raises RuntimeError."""
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            json={
                "content": [],
                "usage": {"input_tokens": 10, "output_tokens": 5},
            },
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="missing 'content' array"):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_generate_answer_missing_text_field(self, httpx_mock):
        """Test that missing text field in content block raises RuntimeError."""
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            json={
                "content": [{"type": "text"}],  # Missing 'text' field
                "usage": {"input_tokens": 10, "output_tokens": 5},
            },
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="missing 'text' field"):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_generate_answer_wrong_content_type(self, httpx_mock):
        """Test that wrong content type raises RuntimeError."""
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            json={
                "content": [{"type": "image", "data": "..."}],  # Wrong type
                "usage": {"input_tokens": 10, "output_tokens": 5},
            },
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="Expected content block type 'text'"):
            await client.generate_answer("Test")


class TestTokenUsageExtraction:
    """Test suite for token usage extraction."""

    @pytest.mark.asyncio
    async def test_extract_token_usage_success(self, httpx_mock):
        """Test successful token usage extraction."""
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            json={
                "content": [{"type": "text", "text": "Test"}],
                "usage": {"input_tokens": 100, "output_tokens": 50},
            },
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        assert response.prompt_tokens == 100
        assert response.completion_tokens == 50
        assert response.tokens_used == 150

    @pytest.mark.asyncio
    async def test_extract_token_usage_missing_usage(self, httpx_mock, caplog):
        """Test handling of missing usage field."""
        caplog.set_level(logging.WARNING)

        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            json={
                "content": [{"type": "text", "text": "Test"}],
                # Missing 'usage' field
            },
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        # Should default to 0 and log warning
        assert response.tokens_used == 0
        assert response.prompt_tokens == 0
        assert response.completion_tokens == 0
        assert "missing 'usage' data" in caplog.text

    @pytest.mark.asyncio
    async def test_extract_token_usage_partial_data(self, httpx_mock):
        """Test handling of partial token usage data."""
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            json={
                "content": [{"type": "text", "text": "Test"}],
                "usage": {"input_tokens": 100},  # Missing output_tokens
            },
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        # Should use available data and default missing to 0
        assert response.prompt_tokens == 100
        assert response.completion_tokens == 0
        assert response.tokens_used == 100


class TestCostEstimation:
    """Test suite for cost estimation."""

    @pytest.mark.asyncio
    async def test_cost_estimation_haiku(self, httpx_mock):
        """Test cost estimation for Claude 3.5 Haiku."""
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            json={
                "content": [{"type": "text", "text": "Test"}],
                "usage": {"input_tokens": 1000, "output_tokens": 500},
            },
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        # Cost = (1000 * $0.80/1M) + (500 * $4.00/1M) = $0.0008 + $0.002 = $0.0028
        assert response.cost_usd > 0
        assert response.cost_usd == pytest.approx(0.0028, rel=1e-6)

    @pytest.mark.asyncio
    async def test_cost_estimation_sonnet(self, httpx_mock):
        """Test cost estimation for Claude 3.5 Sonnet."""
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            json={
                "content": [{"type": "text", "text": "Test"}],
                "usage": {"input_tokens": 1000, "output_tokens": 500},
            },
        )

        client = AnthropicClient(
            "claude-3-5-sonnet-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )
        response = await client.generate_answer("Test")

        # Cost = (1000 * $3.00/1M) + (500 * $15.00/1M) = $0.003 + $0.0075 = $0.0105
        assert response.cost_usd > 0
        assert response.cost_usd == pytest.approx(0.0105, rel=1e-6)


class TestErrorDetailExtraction:
    """Test suite for error detail extraction."""

    @pytest.mark.asyncio
    async def test_extract_error_detail_with_message(self, httpx_mock):
        """Test error detail extraction with error message."""
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            status_code=401,
            json={"error": {"message": "Invalid API key provided"}},
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(RuntimeError, match="Invalid API key provided"):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_extract_error_detail_without_message(self, httpx_mock):
        """Test error detail extraction without error message."""
        # 500 error is retryable, so we need to mock it 3 times (max attempts)
        for _ in range(3):
            httpx_mock.add_response(
                method="POST",
                url=ANTHROPIC_API_URL,
                status_code=500,
                json={"error": {}},  # Empty error object
            )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(httpx.HTTPStatusError, match="500"):
            await client.generate_answer("Test")

    @pytest.mark.asyncio
    async def test_extract_error_detail_invalid_json(self, httpx_mock):
        """Test error detail extraction with invalid JSON."""
        # 500 error is retryable, so we need to mock it 3 times (max attempts)
        for _ in range(3):
            httpx_mock.add_response(
                method="POST",
                url=ANTHROPIC_API_URL,
                status_code=500,
                content=b"Not JSON",
            )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-test123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(httpx.HTTPStatusError, match="500"):
            await client.generate_answer("Test")


class TestLogging:
    """Test suite for logging behavior."""

    @pytest.mark.asyncio
    async def test_api_key_never_logged_on_success(self, httpx_mock, caplog):
        """Test that API key is NEVER logged on successful request."""
        caplog.set_level(logging.DEBUG)

        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            json={
                "content": [{"type": "text", "text": "Test"}],
                "usage": {"input_tokens": 10, "output_tokens": 5},
            },
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-secret123", TEST_SYSTEM_PROMPT
        )
        await client.generate_answer("Test")

        # Should log model name
        assert "claude-3-5-haiku-20241022" in caplog.text

        # Should NEVER log API key
        assert "sk-ant-secret123" not in caplog.text
        assert "secret" not in caplog.text

    @pytest.mark.asyncio
    async def test_api_key_never_logged_on_error(self, httpx_mock, caplog):
        """Test that API key is NEVER logged on retryable error (with logging)."""
        caplog.set_level(logging.ERROR)

        # Use retryable error (500) so it goes through the logging path
        # First two attempts fail with 500, will be logged
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            status_code=500,
            json={"error": {"message": "Server error"}},
        )
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            status_code=500,
            json={"error": {"message": "Server error"}},
        )
        httpx_mock.add_response(
            method="POST",
            url=ANTHROPIC_API_URL,
            status_code=500,
            json={"error": {"message": "Server error"}},
        )

        client = AnthropicClient(
            "claude-3-5-haiku-20241022", "sk-ant-secret123", TEST_SYSTEM_PROMPT
        )

        with pytest.raises(httpx.HTTPStatusError):
            await client.generate_answer("Test")

        # Should log model name and status (goes through HTTPStatusError handler)
        assert "claude-3-5-haiku-20241022" in caplog.text
        assert "500" in caplog.text

        # Should NEVER log API key
        assert "sk-ant-secret123" not in caplog.text
        assert "secret" not in caplog.text
