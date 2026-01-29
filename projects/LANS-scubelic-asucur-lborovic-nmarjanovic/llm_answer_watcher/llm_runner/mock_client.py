"""
Mock LLM client for testing.

Provides MockLLMClient that implements the LLMClient protocol without making
real API calls. Used for deterministic testing of the entire pipeline without
needing to mock HTTP infrastructure.

Supports optional streaming via callback for testing streaming workflows.

Example:
    >>> from llm_runner.mock_client import MockLLMClient
    >>> client = MockLLMClient(
    ...     responses={"What are the best CRM tools?": "HubSpot and Salesforce are great."}
    ... )
    >>> response = await client.generate_answer("What are the best CRM tools?")
    >>> response.answer_text
    'HubSpot and Salesforce are great.'
    >>> response.cost_usd
    0.0

Streaming example:
    >>> chunks = []
    >>> def on_chunk(text: str):
    ...     chunks.append(text)
    >>> client = MockLLMClient(
    ...     responses={"test": "Hello world"},
    ...     streaming_chunk_size=5
    ... )
    >>> response = await client.generate_answer("test", on_chunk=on_chunk)
    >>> chunks
    ['Hello', ' worl', 'd']
"""

import asyncio
import logging
from collections.abc import Callable
from dataclasses import dataclass

from llm_answer_watcher.llm_runner.models import LLMResponse
from llm_answer_watcher.utils.time import utc_timestamp

logger = logging.getLogger(__name__)


@dataclass
class MockLLMClient:
    """
    Mock LLM client for testing that implements LLMClient protocol.

    Provides deterministic responses without making real API calls.
    Useful for testing extraction logic, storage, and orchestration
    without HTTP mocking.

    Supports optional streaming via callback for testing streaming workflows.

    Attributes:
        responses: Dict mapping prompts to answers. If prompt not found,
            returns default_response.
        default_response: Response to return when prompt not in responses dict.
            Defaults to "Mock LLM response."
        model_name: Model identifier to return in responses. Defaults to "mock-model"
        provider: Provider name to return in responses. Defaults to "mock"
        tokens_per_response: Number of tokens to report for each response. Defaults to 100
        cost_per_response: Cost in USD to report for each response. Defaults to 0.0
        streaming_chunk_size: Size of chunks when streaming. Defaults to 10 chars.
            If None, streaming is disabled.
        streaming_delay_ms: Delay in milliseconds between chunks. Defaults to 50ms.
            Simulates network latency for realistic streaming tests.

    Example:
        >>> client = MockLLMClient(
        ...     responses={
        ...         "best email tools": "Warmly, HubSpot, and Instantly are top choices.",
        ...         "best CRM": "HubSpot and Salesforce lead the market."
        ...     },
        ...     default_response="No specific answer available."
        ... )
        >>> response = await client.generate_answer("best email tools")
        >>> response.answer_text
        'Warmly, HubSpot, and Instantly are top choices.'
        >>> response = await client.generate_answer("unknown query")
        >>> response.answer_text
        'No specific answer available.'

    Streaming example:
        >>> chunks = []
        >>> client = MockLLMClient(
        ...     responses={"test": "Hello world"},
        ...     streaming_chunk_size=5
        ... )
        >>> response = await client.generate_answer(
        ...     "test",
        ...     on_chunk=lambda chunk: chunks.append(chunk)
        ... )
        >>> chunks
        ['Hello', ' worl', 'd']
    """

    responses: dict[str, str] | None = None
    default_response: str = "Mock LLM response."
    model_name: str = "mock-model"
    provider: str = "mock"
    tokens_per_response: int = 100
    cost_per_response: float = 0.0
    streaming_chunk_size: int | None = None
    streaming_delay_ms: int = 50

    def __post_init__(self):
        """Initialize responses dict if not provided."""
        if self.responses is None:
            self.responses = {}

        logger.info(
            f"Initialized MockLLMClient with {len(self.responses)} configured responses"
        )

    async def generate_answer(
        self,
        prompt: str,
        on_chunk: Callable[[str], None] | None = None,
    ) -> LLMResponse:
        """
        Generate mock answer for the given prompt with optional streaming.

        Looks up prompt in responses dict. If found, returns configured answer.
        If not found, returns default_response.

        If streaming is enabled (streaming_chunk_size is not None) and on_chunk
        callback is provided, the answer will be streamed in chunks.

        Args:
            prompt: User intent prompt
            on_chunk: Optional callback to receive text chunks during streaming.
                Called with each chunk as it's "generated". If None or streaming
                is disabled, the full answer is returned at once.

        Returns:
            LLMResponse: Mock response with configured answer and metadata

        Example:
            >>> client = MockLLMClient(responses={"test": "answer"})
            >>> response = await client.generate_answer("test")
            >>> response.answer_text
            'answer'
            >>> response.tokens_used
            100
            >>> response.cost_usd
            0.0

        Streaming example:
            >>> chunks = []
            >>> client = MockLLMClient(
            ...     responses={"test": "Hello world"},
            ...     streaming_chunk_size=5
            ... )
            >>> response = await client.generate_answer(
            ...     "test",
            ...     on_chunk=lambda c: chunks.append(c)
            ... )
            >>> chunks
            ['Hello', ' worl', 'd']
            >>> response.answer_text
            'Hello world'
        """
        # Look up response
        answer_text = self.responses.get(prompt, self.default_response)

        logger.debug(f"MockLLMClient returning answer for prompt: {prompt[:50]}...")

        # Stream if enabled and callback provided
        if self.streaming_chunk_size is not None and on_chunk is not None:
            logger.debug(
                f"Streaming enabled with chunk_size={self.streaming_chunk_size}, "
                f"delay={self.streaming_delay_ms}ms"
            )

            # Split answer into chunks
            for i in range(0, len(answer_text), self.streaming_chunk_size):
                chunk = answer_text[i : i + self.streaming_chunk_size]
                on_chunk(chunk)

                # Simulate network latency between chunks
                if self.streaming_delay_ms > 0 and i + self.streaming_chunk_size < len(answer_text):
                    await asyncio.sleep(self.streaming_delay_ms / 1000.0)

            logger.debug(f"Streaming complete: {len(answer_text)} chars in chunks")

        # Return structured response (full answer, even if streamed)
        return LLMResponse(
            answer_text=answer_text,
            tokens_used=self.tokens_per_response,
            prompt_tokens=self.tokens_per_response // 2,
            completion_tokens=self.tokens_per_response // 2,
            cost_usd=self.cost_per_response,
            provider=self.provider,
            model_name=self.model_name,
            timestamp_utc=utc_timestamp(),
            web_search_results=None,
            web_search_count=0,
        )
