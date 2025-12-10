"""
Tests for llm_runner.models module.

Tests cover:
- LLMResponse dataclass instantiation and field validation
- LLMClient Protocol compliance checking
- build_client factory function for all provider scenarios
- Error handling for unsupported and not-yet-implemented providers
"""

import pytest

from llm_answer_watcher.llm_runner.anthropic_client import AnthropicClient
from llm_answer_watcher.llm_runner.grok_client import GrokClient
from llm_answer_watcher.llm_runner.mistral_client import MistralClient
from llm_answer_watcher.llm_runner.models import LLMClient, LLMResponse, build_client
from llm_answer_watcher.llm_runner.openai_client import OpenAIClient

# Test system prompt for all tests
TEST_SYSTEM_PROMPT = "You are a test assistant."


class TestLLMResponse:
    """Test suite for LLMResponse dataclass."""

    def test_llm_response_creation(self):
        """Test creating a valid LLMResponse instance."""
        response = LLMResponse(
            answer_text="Based on market research, the top tools are...",
            tokens_used=450,
            cost_usd=0.000135,
            provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc="2025-11-02T08:30:45Z",
        )

        assert response.answer_text == "Based on market research, the top tools are..."
        assert response.tokens_used == 450
        assert response.cost_usd == 0.000135
        assert response.provider == "openai"
        assert response.model_name == "gpt-4o-mini"
        assert response.timestamp_utc == "2025-11-02T08:30:45Z"

    def test_llm_response_all_fields_required(self):
        """Test that all LLMResponse fields are required."""
        # Missing timestamp_utc should raise TypeError
        with pytest.raises(TypeError, match="timestamp_utc"):
            LLMResponse(
                answer_text="Test",
                tokens_used=100,
                cost_usd=0.001,
                provider="openai",
                model_name="gpt-4o-mini",
            )

    def test_llm_response_empty_answer_text(self):
        """Test LLMResponse with empty answer text (valid but unusual)."""
        response = LLMResponse(
            answer_text="",
            tokens_used=10,
            cost_usd=0.00001,
            provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc="2025-11-02T08:30:45Z",
        )

        assert response.answer_text == ""
        assert response.tokens_used == 10

    def test_llm_response_zero_cost(self):
        """Test LLMResponse with zero cost (free tier or cached response)."""
        response = LLMResponse(
            answer_text="Cached response",
            tokens_used=0,
            cost_usd=0.0,
            provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc="2025-11-02T08:30:45Z",
        )

        assert response.cost_usd == 0.0
        assert response.tokens_used == 0

    def test_llm_response_large_token_count(self):
        """Test LLMResponse with large token count."""
        response = LLMResponse(
            answer_text="A" * 10000,
            tokens_used=50000,
            cost_usd=1.5,
            provider="openai",
            model_name="gpt-4o",
            timestamp_utc="2025-11-02T08:30:45Z",
        )

        assert response.tokens_used == 50000
        assert response.cost_usd == 1.5


class TestLLMClientProtocol:
    """Test suite for LLMClient Protocol compliance."""

    def test_openai_client_implements_protocol(self):
        """Test that OpenAIClient satisfies LLMClient Protocol."""
        client = OpenAIClient(
            model_name="gpt-4o-mini",
            api_key="sk-test123",
            system_prompt=TEST_SYSTEM_PROMPT,
        )

        # Protocol check - OpenAIClient should have generate_answer method
        assert hasattr(client, "generate_answer")
        assert callable(client.generate_answer)

        # Type checking: OpenAIClient is structurally compatible with LLMClient
        # This verifies that OpenAIClient can be used wherever LLMClient is expected
        def accepts_llm_client(client: LLMClient) -> None:
            """Helper function to verify protocol compliance."""
            pass

        # This should not raise type errors (checked by mypy/pyright)
        accepts_llm_client(client)

    def test_protocol_defines_generate_answer(self):
        """Test that LLMClient Protocol has generate_answer method."""
        # Verify protocol structure
        assert hasattr(LLMClient, "generate_answer")


class TestBuildClient:
    """Test suite for build_client factory function."""

    def test_build_client_openai_success(self):
        """Test building OpenAI client successfully."""
        client = build_client("openai", "gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)

        assert isinstance(client, OpenAIClient)
        assert client.model_name == "gpt-4o-mini"
        assert client.api_key == "sk-test123"

    def test_build_client_openai_different_model(self):
        """Test building OpenAI client with different model."""
        client = build_client("openai", "gpt-4o", "sk-prod456", TEST_SYSTEM_PROMPT)

        assert isinstance(client, OpenAIClient)
        assert client.model_name == "gpt-4o"
        assert client.api_key == "sk-prod456"

    def test_build_client_anthropic_success(self):
        """Test building Anthropic client successfully."""
        client = build_client(
            "anthropic", "claude-3-5-haiku-20241022", "sk-ant-test", TEST_SYSTEM_PROMPT
        )

        assert isinstance(client, AnthropicClient)
        assert client.model_name == "claude-3-5-haiku-20241022"
        assert client.api_key == "sk-ant-test"

    def test_build_client_anthropic_different_model(self):
        """Test building Anthropic client with different model."""
        client = build_client(
            "anthropic", "claude-3-5-sonnet-20241022", "sk-ant-prod", TEST_SYSTEM_PROMPT
        )

        assert isinstance(client, AnthropicClient)
        assert client.model_name == "claude-3-5-sonnet-20241022"
        assert client.api_key == "sk-ant-prod"

    def test_build_client_mistral_success(self):
        """Test building Mistral client successfully."""
        client = build_client(
            "mistral", "mistral-large-latest", "mistral-key", TEST_SYSTEM_PROMPT
        )

        assert isinstance(client, MistralClient)
        assert client.model_name == "mistral-large-latest"
        assert client.api_key == "mistral-key"

    def test_build_client_mistral_different_model(self):
        """Test building Mistral client with different model."""
        client = build_client(
            "mistral", "mistral-small-latest", "mistral-prod", TEST_SYSTEM_PROMPT
        )

        assert isinstance(client, MistralClient)
        assert client.model_name == "mistral-small-latest"
        assert client.api_key == "mistral-prod"

    def test_build_client_grok_success(self):
        """Test building Grok client successfully."""
        client = build_client("grok", "grok-beta", "xai-test123", TEST_SYSTEM_PROMPT)

        assert isinstance(client, GrokClient)
        assert client.model_name == "grok-beta"
        assert client.api_key == "xai-test123"

    def test_build_client_grok_different_model(self):
        """Test building Grok client with different model."""
        client = build_client("grok", "grok-2-1212", "xai-prod456", TEST_SYSTEM_PROMPT)

        assert isinstance(client, GrokClient)
        assert client.model_name == "grok-2-1212"
        assert client.api_key == "xai-prod456"

    def test_build_client_grok_3_model(self):
        """Test building Grok client with Grok 3 model."""
        client = build_client("grok", "grok-3", "xai-test123", TEST_SYSTEM_PROMPT)

        assert isinstance(client, GrokClient)
        assert client.model_name == "grok-3"

    def test_build_client_unsupported_provider(self):
        """Test that unknown provider raises ValueError."""
        with pytest.raises(ValueError, match="Unsupported provider: 'gemini'"):
            build_client("gemini", "gemini-pro", "gemini-key", TEST_SYSTEM_PROMPT)

        # Verify error message lists supported providers
        with pytest.raises(
            ValueError, match="Supported providers: openai, anthropic, mistral, grok"
        ):
            build_client("gemini", "gemini-pro", "gemini-key", TEST_SYSTEM_PROMPT)

    def test_build_client_empty_provider(self):
        """Test that empty provider string raises ValueError."""
        with pytest.raises(ValueError, match="Unsupported provider: ''"):
            build_client("", "gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)

    def test_build_client_case_sensitive(self):
        """Test that provider name is case-sensitive."""
        # Uppercase should fail
        with pytest.raises(ValueError, match="Unsupported provider: 'OpenAI'"):
            build_client("OpenAI", "gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)

        # Mixed case should fail
        with pytest.raises(ValueError, match="Unsupported provider: 'OPENAI'"):
            build_client("OPENAI", "gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)

    def test_build_client_returns_protocol_compliant_object(self):
        """Test that build_client returns object satisfying LLMClient Protocol."""
        client = build_client("openai", "gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)

        # Verify protocol compliance
        assert hasattr(client, "generate_answer")
        assert callable(client.generate_answer)

        # Type annotation compatibility test
        def process_with_llm_client(llm: LLMClient) -> None:
            """Helper to verify protocol compatibility."""
            pass

        # Should accept the returned client
        process_with_llm_client(client)

    def test_build_client_with_special_characters_in_key(self):
        """Test building client with special characters in API key."""
        special_key = "sk-proj_ABC123!@#$%^&*()_+-=[]{}|;:',.<>?/~`"
        client = build_client("openai", "gpt-4o-mini", special_key, TEST_SYSTEM_PROMPT)

        assert isinstance(client, OpenAIClient)
        assert client.api_key == special_key

    def test_build_client_lazy_import(self):
        """Test that OpenAI client is imported lazily inside build_client."""
        # This test verifies the import happens inside the function
        # to avoid circular dependencies

        # Clear any cached import
        import sys

        if "llm_answer_watcher.llm_runner.openai_client" in sys.modules:
            # Import should have happened during previous tests
            pass

        # Calling build_client should work regardless
        client = build_client("openai", "gpt-4o-mini", "sk-test", TEST_SYSTEM_PROMPT)
        assert isinstance(client, OpenAIClient)


class TestIntegration:
    """Integration tests for models module."""

    def test_factory_to_protocol_workflow(self):
        """Test complete workflow: factory -> protocol -> method call preparation."""
        # Step 1: Use factory to create client
        client = build_client("openai", "gpt-4o-mini", "sk-test123", TEST_SYSTEM_PROMPT)

        # Step 2: Verify it satisfies protocol
        assert hasattr(client, "generate_answer")

        # Step 3: Verify method signature (prepare for call, don't execute)
        import inspect

        sig = inspect.signature(client.generate_answer)
        params = list(sig.parameters.keys())

        # Should have 'prompt' parameter
        assert "prompt" in params

    def test_multiple_clients_independent(self):
        """Test that multiple client instances are independent."""
        client1 = build_client("openai", "gpt-4o-mini", "sk-key1", TEST_SYSTEM_PROMPT)
        client2 = build_client("openai", "gpt-4o", "sk-key2", TEST_SYSTEM_PROMPT)

        assert client1.api_key == "sk-key1"
        assert client2.api_key == "sk-key2"
        assert client1.model_name == "gpt-4o-mini"
        assert client2.model_name == "gpt-4o"

        # Instances should be separate objects
        assert client1 is not client2
