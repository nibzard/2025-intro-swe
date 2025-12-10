#!/usr/bin/env python3
"""
Example usage of OpenAIClient for LLM Answer Watcher.

This script demonstrates how to use the OpenAIClient to query OpenAI's API
with automatic retry logic and cost tracking.

Usage:
    # Set your OpenAI API key
    export OPENAI_API_KEY="sk-..."

    # Run the example
    python examples/openai_client_example.py

Note:
    This example requires the OpenAI API key to be set in the environment.
    You will be charged for API usage based on OpenAI's pricing (~$0.001 per run).
"""

import asyncio
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from llm_answer_watcher.llm_runner.models import build_client
from llm_answer_watcher.llm_runner.openai_client import OpenAIClient


async def main():
    """Demonstrate OpenAIClient usage with async/await."""
    # Get API key from environment
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable not set")
        print("Usage: export OPENAI_API_KEY='sk-...'")
        sys.exit(1)

    # Example 1: Direct instantiation
    print("=" * 80)
    print("Example 1: Direct OpenAIClient instantiation")
    print("=" * 80)

    client = OpenAIClient(
        model_name="gpt-4o-mini",
        api_key=api_key,
        system_prompt="You are a helpful assistant that provides concise answers about software tools."
    )
    print(f"✓ Client created for model: {client.model_name}")

    prompt = "What are the best email warmup tools for 2025?"
    print(f"\nPrompt: {prompt}")
    print("\nSending request to OpenAI...")

    try:
        # IMPORTANT: Use await with async client
        response = await client.generate_answer(prompt)

        print("\n✓ Response received:")
        print(f"  - Provider: {response.provider}")
        print(f"  - Model: {response.model_name}")
        print(f"  - Tokens used: {response.tokens_used}")
        print(f"  - Prompt tokens: {response.prompt_tokens}")
        print(f"  - Completion tokens: {response.completion_tokens}")
        print(f"  - Cost: ${response.cost_usd:.6f}")
        print(f"  - Timestamp: {response.timestamp_utc}")
        print("\nAnswer (first 200 chars):")
        print(f"  {response.answer_text[:200]}...")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)

    # Example 2: Using factory function
    print("\n" + "=" * 80)
    print("Example 2: Using build_client() factory")
    print("=" * 80)

    client2 = build_client(
        provider="openai",
        model_name="gpt-4o-mini",
        api_key=api_key,
        system_prompt="You are a helpful assistant."
    )
    print("✓ Client created via factory")

    prompt2 = "What are the top CRM platforms?"
    print(f"\nPrompt: {prompt2}")
    print("\nSending request...")

    try:
        # IMPORTANT: Use await with async client
        response2 = await client2.generate_answer(prompt2)

        print("\n✓ Response received:")
        print(f"  - Tokens: {response2.tokens_used}")
        print(f"  - Cost: ${response2.cost_usd:.6f}")
        print("\nAnswer (first 200 chars):")
        print(f"  {response2.answer_text[:200]}...")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)

    # Example 3: Error handling
    print("\n" + "=" * 80)
    print("Example 3: Error handling demonstration")
    print("=" * 80)

    # Test empty prompt validation (runtime validation happens in generate_answer)
    try:
        await client.generate_answer("")
        print("✗ Should have raised ValueError for empty prompt")
    except ValueError as e:
        print(f"✓ Validation works: {e}")

    # Test empty model name validation (happens at instantiation)
    try:
        OpenAIClient("", api_key, "system prompt")
        print("✗ Should have raised ValueError for empty model_name")
    except ValueError as e:
        print(f"✓ Validation works: {e}")

    # Test empty API key validation (happens at instantiation)
    try:
        OpenAIClient("gpt-4o-mini", "", "system prompt")
        print("✗ Should have raised ValueError for empty api_key")
    except ValueError as e:
        print(f"✓ Validation works: {e}")

    # Test empty system prompt validation (happens at instantiation)
    try:
        OpenAIClient("gpt-4o-mini", api_key, "")
        print("✗ Should have raised ValueError for empty system_prompt")
    except ValueError as e:
        print(f"✓ Validation works: {e}")

    print("\n" + "=" * 80)
    print("All examples completed successfully!")
    print("=" * 80)


if __name__ == "__main__":
    # Run async main function
    asyncio.run(main())
