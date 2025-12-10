"""
Tests for LLM provider error scenarios.

Tests error handling for various provider failures:
- Rate limit errors (429)
- Authentication errors (401)
- Timeout errors
- Malformed responses
- Connection errors
- Retry logic
"""

import pytest
from httpx import ConnectError, TimeoutException

from llm_answer_watcher.llm_runner.anthropic_client import AnthropicClient
from llm_answer_watcher.llm_runner.gemini_client import GeminiClient
from llm_answer_watcher.llm_runner.grok_client import GrokClient
from llm_answer_watcher.llm_runner.mistral_client import MistralClient
from llm_answer_watcher.llm_runner.openai_client import OpenAIClient


class TestOpenAIErrorHandling:
    """Tests for OpenAI client error handling."""

    def test_rate_limit_error_retries(self, httpx_mock):
        """Rate limit error (429) should trigger retries."""
        # First 2 requests fail with 429, third succeeds
        httpx_mock.add_response(
            method="POST",
            url="https://api.openai.com/v1/chat/completions",
            status_code=429,
            json={
                "error": {"message": "Rate limit exceeded", "type": "rate_limit_error"}
            },
        )
        httpx_mock.add_response(
            method="POST",
            url="https://api.openai.com/v1/chat/completions",
            status_code=429,
            json={
                "error": {"message": "Rate limit exceeded", "type": "rate_limit_error"}
            },
        )
        httpx_mock.add_response(
            method="POST",
            url="https://api.openai.com/v1/chat/completions",
            status_code=200,
            json={
                "id": "test-id",
                "choices": [
                    {"message": {"content": "Success after retries"}, "index": 0}
                ],
                "usage": {
                    "prompt_tokens": 10,
                    "completion_tokens": 5,
                    "total_tokens": 15,
                },
            },
        )

        client = OpenAIClient(
            model_name="gpt-4o-mini",
            api_key="test-key",
            system_prompt="You are a helpful assistant",
        )

        # Should eventually succeed after retries
        response = client.generate_answer("test prompt")
        assert response.answer_text == "Success after retries"
        assert response.tokens_used == 15

    def test_auth_error_fails_immediately(self, httpx_mock):
        """Authentication error (401) should fail without retries."""
        httpx_mock.add_response(
            method="POST",
            url="https://api.openai.com/v1/chat/completions",
            status_code=401,
            json={"error": {"message": "Invalid API key", "type": "invalid_api_key"}},
        )

        client = OpenAIClient(
            model_name="gpt-4o-mini",
            api_key="invalid-key",
            system_prompt="You are a helpful assistant",
        )

        # Should raise error immediately without retries
        with pytest.raises(Exception) as exc_info:
            client.generate_answer("test prompt")

        assert "401" in str(exc_info.value) or "Invalid API key" in str(exc_info.value)

    def test_timeout_error_retries(self, httpx_mock):
        """Timeout errors should trigger retries."""
        # First request times out, second succeeds
        httpx_mock.add_exception(
            TimeoutException("Request timed out"),
            method="POST",
            url="https://api.openai.com/v1/chat/completions",
        )
        httpx_mock.add_response(
            method="POST",
            url="https://api.openai.com/v1/chat/completions",
            status_code=200,
            json={
                "id": "test-id",
                "choices": [
                    {"message": {"content": "Success after timeout"}, "index": 0}
                ],
                "usage": {
                    "prompt_tokens": 10,
                    "completion_tokens": 5,
                    "total_tokens": 15,
                },
            },
        )

        client = OpenAIClient(
            model_name="gpt-4o-mini",
            api_key="test-key",
            system_prompt="You are a helpful assistant",
        )

        # Should eventually succeed after retry
        response = client.generate_answer("test prompt")
        assert response.answer_text == "Success after timeout"

    def test_malformed_response_raises_error(self, httpx_mock):
        """Malformed response (missing required fields) should raise error."""
        httpx_mock.add_response(
            method="POST",
            url="https://api.openai.com/v1/chat/completions",
            status_code=200,
            json={"id": "test-id"},  # Missing choices and usage
        )

        client = OpenAIClient(
            model_name="gpt-4o-mini",
            api_key="test-key",
            system_prompt="You are a helpful assistant",
        )

        # Should raise error due to missing fields
        with pytest.raises(Exception) as exc_info:
            client.generate_answer("test prompt")

        assert (
            "choices" in str(exc_info.value).lower()
            or "usage" in str(exc_info.value).lower()
        )

    def test_connection_error_retries(self, httpx_mock):
        """Connection errors should trigger retries."""
        # First request fails with connection error, second succeeds
        httpx_mock.add_exception(
            ConnectError("Connection refused"),
            method="POST",
            url="https://api.openai.com/v1/chat/completions",
        )
        httpx_mock.add_response(
            method="POST",
            url="https://api.openai.com/v1/chat/completions",
            status_code=200,
            json={
                "id": "test-id",
                "choices": [
                    {
                        "message": {"content": "Success after connection error"},
                        "index": 0,
                    }
                ],
                "usage": {
                    "prompt_tokens": 10,
                    "completion_tokens": 5,
                    "total_tokens": 15,
                },
            },
        )

        client = OpenAIClient(
            model_name="gpt-4o-mini",
            api_key="test-key",
            system_prompt="You are a helpful assistant",
        )

        # Should eventually succeed after retry
        response = client.generate_answer("test prompt")
        assert response.answer_text == "Success after connection error"


class TestAnthropicErrorHandling:
    """Tests for Anthropic client error handling."""

    def test_rate_limit_error_retries(self, httpx_mock):
        """Rate limit error (429) should trigger retries."""
        httpx_mock.add_response(
            method="POST",
            url="https://api.anthropic.com/v1/messages",
            status_code=429,
            json={
                "error": {"message": "Rate limit exceeded", "type": "rate_limit_error"}
            },
        )
        httpx_mock.add_response(
            method="POST",
            url="https://api.anthropic.com/v1/messages",
            status_code=200,
            json={
                "id": "test-id",
                "content": [{"text": "Success after rate limit"}],
                "usage": {"input_tokens": 10, "output_tokens": 5},
            },
        )

        client = AnthropicClient(
            model_name="claude-3-5-haiku-20241022",
            api_key="test-key",
            system_prompt="You are a helpful assistant",
        )

        response = client.generate_answer("test prompt")
        assert response.answer_text == "Success after rate limit"

    def test_auth_error_fails_immediately(self, httpx_mock):
        """Authentication error (401) should fail without retries."""
        httpx_mock.add_response(
            method="POST",
            url="https://api.anthropic.com/v1/messages",
            status_code=401,
            json={
                "error": {"message": "Invalid API key", "type": "authentication_error"}
            },
        )

        client = AnthropicClient(
            model_name="claude-3-5-haiku-20241022",
            api_key="invalid-key",
            system_prompt="You are a helpful assistant",
        )

        with pytest.raises(Exception) as exc_info:
            client.generate_answer("test prompt")

        assert (
            "401" in str(exc_info.value)
            or "authentication" in str(exc_info.value).lower()
        )


class TestMistralErrorHandling:
    """Tests for Mistral client error handling."""

    def test_rate_limit_error_retries(self, httpx_mock):
        """Rate limit error should trigger retries."""
        httpx_mock.add_response(
            method="POST",
            url="https://api.mistral.ai/v1/chat/completions",
            status_code=429,
            json={"error": "Rate limit exceeded"},
        )
        httpx_mock.add_response(
            method="POST",
            url="https://api.mistral.ai/v1/chat/completions",
            status_code=200,
            json={
                "id": "test-id",
                "choices": [{"message": {"content": "Success"}, "index": 0}],
                "usage": {
                    "prompt_tokens": 10,
                    "completion_tokens": 5,
                    "total_tokens": 15,
                },
            },
        )

        client = MistralClient(
            model_name="mistral-large-latest",
            api_key="test-key",
            system_prompt="You are a helpful assistant",
        )

        response = client.generate_answer("test prompt")
        assert response.answer_text == "Success"


class TestGrokErrorHandling:
    """Tests for Grok client error handling."""

    def test_rate_limit_error_retries(self, httpx_mock):
        """Rate limit error should trigger retries."""
        httpx_mock.add_response(
            method="POST",
            url="https://api.x.ai/v1/chat/completions",
            status_code=429,
            json={"error": {"message": "Rate limit exceeded"}},
        )
        httpx_mock.add_response(
            method="POST",
            url="https://api.x.ai/v1/chat/completions",
            status_code=200,
            json={
                "id": "test-id",
                "choices": [{"message": {"content": "Success"}, "index": 0}],
                "usage": {
                    "prompt_tokens": 10,
                    "completion_tokens": 5,
                    "total_tokens": 15,
                },
            },
        )

        client = GrokClient(
            model_name="grok-2-latest",
            api_key="test-key",
            system_prompt="You are a helpful assistant",
        )

        response = client.generate_answer("test prompt")
        assert response.answer_text == "Success"


class TestGeminiErrorHandling:
    """Tests for Google Gemini client error handling."""

    def test_rate_limit_error_retries(self, httpx_mock):
        """Rate limit error should trigger retries."""
        httpx_mock.add_response(
            method="POST",
            url="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
            status_code=429,
            json={"error": {"message": "Resource exhausted"}},
        )
        httpx_mock.add_response(
            method="POST",
            url="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
            status_code=200,
            json={
                "candidates": [{"content": {"parts": [{"text": "Success"}]}}],
                "usageMetadata": {
                    "promptTokenCount": 10,
                    "candidatesTokenCount": 5,
                    "totalTokenCount": 15,
                },
            },
        )

        client = GeminiClient(
            model_name="gemini-2.0-flash-exp",
            api_key="test-key",
            system_prompt="You are a helpful assistant",
        )

        response = client.generate_answer("test prompt")
        assert response.answer_text == "Success"

    def test_auth_error_fails_immediately(self, httpx_mock):
        """Authentication error should fail without retries."""
        httpx_mock.add_response(
            method="POST",
            url="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
            status_code=401,
            json={"error": {"message": "API key not valid"}},
        )

        client = GeminiClient(
            model_name="gemini-2.0-flash-exp",
            api_key="invalid-key",
            system_prompt="You are a helpful assistant",
        )

        with pytest.raises(Exception) as exc_info:
            client.generate_answer("test prompt")

        assert "401" in str(exc_info.value) or "api key" in str(exc_info.value).lower()


class TestRetryLogicIntegration:
    """Integration tests for retry logic across providers."""

    def test_max_retries_reached_openai(self, httpx_mock):
        """After max retries, should raise final error."""
        # Add 5 rate limit responses (more than default max retries)
        for _ in range(5):
            httpx_mock.add_response(
                method="POST",
                url="https://api.openai.com/v1/chat/completions",
                status_code=429,
                json={"error": {"message": "Rate limit exceeded"}},
            )

        client = OpenAIClient(
            model_name="gpt-4o-mini",
            api_key="test-key",
            system_prompt="You are a helpful assistant",
        )

        # Should eventually give up and raise error
        with pytest.raises(Exception) as exc_info:
            client.generate_answer("test prompt")

        assert (
            "429" in str(exc_info.value) or "rate limit" in str(exc_info.value).lower()
        )

    def test_500_error_retries(self, httpx_mock):
        """Server error (500) should trigger retries."""
        httpx_mock.add_response(
            method="POST",
            url="https://api.openai.com/v1/chat/completions",
            status_code=500,
            json={"error": {"message": "Internal server error"}},
        )
        httpx_mock.add_response(
            method="POST",
            url="https://api.openai.com/v1/chat/completions",
            status_code=200,
            json={
                "id": "test-id",
                "choices": [{"message": {"content": "Success after 500"}, "index": 0}],
                "usage": {
                    "prompt_tokens": 10,
                    "completion_tokens": 5,
                    "total_tokens": 15,
                },
            },
        )

        client = OpenAIClient(
            model_name="gpt-4o-mini",
            api_key="test-key",
            system_prompt="You are a helpful assistant",
        )

        response = client.generate_answer("test prompt")
        assert response.answer_text == "Success after 500"
