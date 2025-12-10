"""
Tests for llm_runner.mock_client module.

Tests cover:
- MockLLMClient initialization
- Response lookup with configured prompts
- Default response fallback
- Token and cost configuration
- Protocol compliance
"""

import pytest

from llm_answer_watcher.llm_runner.mock_client import MockLLMClient
from llm_answer_watcher.llm_runner.models import LLMResponse


class TestMockLLMClientInit:
    """Test suite for MockLLMClient initialization."""

    def test_init_defaults(self):
        """Test initialization with default values."""
        client = MockLLMClient()

        assert client.responses == {}
        assert client.default_response == "Mock LLM response."
        assert client.model_name == "mock-model"
        assert client.provider == "mock"
        assert client.tokens_per_response == 100
        assert client.cost_per_response == 0.0

    def test_init_with_responses(self):
        """Test initialization with custom responses."""
        responses = {
            "test prompt": "test answer",
            "another prompt": "another answer",
        }
        client = MockLLMClient(responses=responses)

        assert client.responses == responses
        assert len(client.responses) == 2

    def test_init_with_custom_values(self):
        """Test initialization with custom configuration."""
        client = MockLLMClient(
            default_response="Custom default",
            model_name="custom-model",
            provider="custom-provider",
            tokens_per_response=500,
            cost_per_response=0.01,
        )

        assert client.default_response == "Custom default"
        assert client.model_name == "custom-model"
        assert client.provider == "custom-provider"
        assert client.tokens_per_response == 500
        assert client.cost_per_response == 0.01


class TestMockLLMClientGenerateAnswer:
    """Test suite for MockLLMClient.generate_answer()."""

    @pytest.mark.asyncio
    async def test_generate_answer_configured_prompt(self):
        """Test generating answer for configured prompt."""
        client = MockLLMClient(
            responses={"test prompt": "test answer"},
            tokens_per_response=200,
            cost_per_response=0.001,
        )

        response = await client.generate_answer("test prompt")

        assert isinstance(response, LLMResponse)
        assert response.answer_text == "test answer"
        assert response.tokens_used == 200
        assert response.prompt_tokens == 100  # Half of tokens_per_response
        assert response.completion_tokens == 100  # Half of tokens_per_response
        assert response.cost_usd == 0.001
        assert response.provider == "mock"
        assert response.model_name == "mock-model"
        assert response.web_search_results is None
        assert response.web_search_count == 0

    @pytest.mark.asyncio
    async def test_generate_answer_unconfigured_prompt(self):
        """Test generating answer for unconfigured prompt returns default."""
        client = MockLLMClient(
            responses={"known prompt": "known answer"},
            default_response="Default response",
        )

        response = await client.generate_answer("unknown prompt")

        assert response.answer_text == "Default response"

    @pytest.mark.asyncio
    async def test_generate_answer_empty_responses(self):
        """Test generating answer with no configured responses."""
        client = MockLLMClient()

        response = await client.generate_answer("any prompt")

        assert response.answer_text == "Mock LLM response."

    @pytest.mark.asyncio
    async def test_generate_answer_multiple_calls(self):
        """Test multiple calls return consistent results."""
        client = MockLLMClient(
            responses={
                "prompt1": "answer1",
                "prompt2": "answer2",
            }
        )

        response1a = await client.generate_answer("prompt1")
        response1b = await client.generate_answer("prompt1")
        response2 = await client.generate_answer("prompt2")

        assert response1a.answer_text == "answer1"
        assert response1b.answer_text == "answer1"
        assert response2.answer_text == "answer2"

    @pytest.mark.asyncio
    async def test_generate_answer_timestamp_present(self):
        """Test that response includes UTC timestamp."""
        client = MockLLMClient()

        response = await client.generate_answer("test")

        assert response.timestamp_utc.endswith("Z")
        assert "T" in response.timestamp_utc

    @pytest.mark.asyncio
    async def test_generate_answer_custom_model_provider(self):
        """Test custom model and provider names appear in response."""
        client = MockLLMClient(
            model_name="test-model-v2",
            provider="test-provider",
        )

        response = await client.generate_answer("test")

        assert response.model_name == "test-model-v2"
        assert response.provider == "test-provider"

    @pytest.mark.asyncio
    async def test_generate_answer_zero_cost(self):
        """Test mock client with zero cost."""
        client = MockLLMClient(cost_per_response=0.0)

        response = await client.generate_answer("test")

        assert response.cost_usd == 0.0

    @pytest.mark.asyncio
    async def test_generate_answer_multiline_response(self):
        """Test mock client handles multiline responses."""
        multiline_answer = """Line 1
Line 2
Line 3"""
        client = MockLLMClient(responses={"test": multiline_answer})

        response = await client.generate_answer("test")

        assert response.answer_text == multiline_answer
        assert "\n" in response.answer_text


class TestMockLLMClientProtocolCompliance:
    """Test that MockLLMClient conforms to LLMClient protocol."""

    @pytest.mark.asyncio
    async def test_implements_generate_answer(self):
        """Test client implements generate_answer method."""
        client = MockLLMClient()

        assert hasattr(client, "generate_answer")
        assert callable(client.generate_answer)

    @pytest.mark.asyncio
    async def test_returns_llm_response(self):
        """Test generate_answer returns LLMResponse instance."""
        client = MockLLMClient()

        response = await client.generate_answer("test")

        assert isinstance(response, LLMResponse)

    @pytest.mark.asyncio
    async def test_llm_response_has_required_fields(self):
        """Test returned LLMResponse has all required fields."""
        client = MockLLMClient()

        response = await client.generate_answer("test")

        # Check all required LLMResponse fields
        assert hasattr(response, "answer_text")
        assert hasattr(response, "tokens_used")
        assert hasattr(response, "prompt_tokens")
        assert hasattr(response, "completion_tokens")
        assert hasattr(response, "cost_usd")
        assert hasattr(response, "provider")
        assert hasattr(response, "model_name")
        assert hasattr(response, "timestamp_utc")
        assert hasattr(response, "web_search_results")
        assert hasattr(response, "web_search_count")


class TestMockLLMClientIntegration:
    """Integration tests for MockLLMClient with real use cases."""

    @pytest.mark.asyncio
    async def test_email_warmup_scenario(self):
        """Test realistic email warmup tool query scenario."""
        client = MockLLMClient(
            responses={
                "What are the best email warmup tools?": "Warmly, HubSpot, and Instantly are top choices."
            },
            model_name="gpt-4o-mini",
            provider="openai",
            tokens_per_response=450,
            cost_per_response=0.0012,
        )

        response = await client.generate_answer("What are the best email warmup tools?")

        assert "Warmly" in response.answer_text
        assert "HubSpot" in response.answer_text
        assert response.model_name == "gpt-4o-mini"
        assert response.provider == "openai"
        assert response.tokens_used == 450
        assert response.cost_usd == 0.0012

    @pytest.mark.asyncio
    async def test_use_with_extractor(self):
        """Test MockLLMClient can be used with extractor pipeline."""
        from llm_answer_watcher.config.schema import Brands
        from llm_answer_watcher.extractor.parser import parse_answer

        # Create mock client with brand mentions
        client = MockLLMClient(
            responses={
                "best CRM": "1. HubSpot\n2. Salesforce\n3. Warmly"
            }
        )

        # Generate answer
        response = await client.generate_answer("best CRM")

        # Parse with extractor
        brands = Brands(mine=["Warmly"], competitors=["HubSpot", "Salesforce"])
        extraction = parse_answer(response.answer_text, brands)

        # Verify extraction works
        assert extraction.appeared_mine is True
        assert len(extraction.my_mentions) == 1
        assert extraction.my_mentions[0].normalized_name == "Warmly"
        assert len(extraction.competitor_mentions) == 2
