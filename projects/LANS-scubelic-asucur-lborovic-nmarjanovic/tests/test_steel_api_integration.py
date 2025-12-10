#!/usr/bin/env python3
"""
Real Steel API integration test.

Tests actual Steel API calls with provided API key.
Updated to use Steel SDK instead of raw httpx.
"""

import os
import sys
import time
from pathlib import Path

# Add project to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Check if Steel API key is available
STEEL_API_KEY = os.getenv("STEEL_API_KEY") or "ste-6XExQVwZBn1808PgMwIdMwGceNSK4RX2CPYSkhZNWtVrj3g46pc6xAZedIiG0GCBybKSXyRS2W7xAYpTb4ZWFM77oEOaPgdjMRM"


def test_steel_session_creation():
    """Test real Steel session creation using Steel SDK."""
    print("=" * 60)
    print("TEST: Steel Session Creation (Steel SDK)")
    print("=" * 60)

    from llm_answer_watcher.llm_runner.browser.steel_base import (
        SteelBaseRunner,
        SteelConfig,
    )

    config = SteelConfig(
        steel_api_key=STEEL_API_KEY,
        target_url="https://example.com",  # Simple test page
        session_timeout=120,
        take_screenshots=True,
        save_html_snapshot=True,
        output_dir="/tmp/steel_test",
    )

    # Create a minimal test runner
    class TestRunner(SteelBaseRunner):
        @property
        def runner_name(self) -> str:
            return "test-runner"

        def _navigate_and_submit(self, session: dict, prompt: str):
            pass

        def _extract_answer(self, session: dict) -> str:
            return "Test answer"

    runner = TestRunner(config)

    print("\n• Creating Steel session...")
    try:
        session = runner._create_session()
        print(f"  ✓ Session created successfully!")
        print(f"    Session ID: {session.get('id', 'unknown')}")
        print(f"    Status: {session.get('status', 'unknown')}")

        if 'url' in session:
            print(f"    Viewer URL: {session['url']}")

        session_id = session.get("id")

        # Test screenshot capture
        print("\n• Testing screenshot capture...")
        time.sleep(3)  # Let page load
        screenshot_path = runner._take_screenshot(session_id, "test-intent")
        if screenshot_path:
            print(f"  ✓ Screenshot saved: {screenshot_path}")
            # Check file exists
            if Path(screenshot_path).exists():
                size = Path(screenshot_path).stat().st_size
                print(f"    File size: {size:,} bytes")
        else:
            print("  ⚠ Screenshot capture returned None (may be expected)")

        # Test HTML snapshot
        print("\n• Testing HTML snapshot...")
        html_path = runner._save_html(session_id, "test-intent")
        if html_path:
            print(f"  ✓ HTML saved: {html_path}")
            # Check file exists
            if Path(html_path).exists():
                size = Path(html_path).stat().st_size
                print(f"    File size: {size:,} bytes")
                # Show first 200 chars
                content = Path(html_path).read_text()[:200]
                print(f"    Preview: {content}...")
        else:
            print("  ⚠ HTML snapshot returned None (may be expected)")

        # Cleanup
        print("\n• Releasing session...")
        runner._release_session(session_id)
        print("  ✓ Session released")

        return True

    except Exception as e:
        print(f"\n✗ Steel API error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_chatgpt_runner_structure():
    """Test ChatGPT runner can be instantiated with Steel SDK."""
    print("\n" + "=" * 60)
    print("TEST: ChatGPT Runner Instantiation (Steel SDK)")
    print("=" * 60)

    from llm_answer_watcher.llm_runner.browser.steel_chatgpt import (
        SteelChatGPTRunner,
    )
    from llm_answer_watcher.llm_runner.browser.steel_base import SteelConfig

    config = SteelConfig(
        steel_api_key=STEEL_API_KEY,
        target_url="https://chat.openai.com",
        take_screenshots=True,
    )

    print("\n• Creating ChatGPT runner...")
    runner = SteelChatGPTRunner(config)
    print(f"  ✓ Runner created: {runner.runner_name}")
    print(f"    Type: {runner.runner_type}")
    print(f"    Target: {runner.config.target_url}")

    print("\n• Runner methods available:")
    methods = [m for m in dir(runner) if not m.startswith("_") and callable(getattr(runner, m))]
    for method in methods:
        print(f"    - {method}()")

    return True


def test_perplexity_runner_structure():
    """Test Perplexity runner can be instantiated with Steel SDK."""
    print("\n" + "=" * 60)
    print("TEST: Perplexity Runner Instantiation (Steel SDK)")
    print("=" * 60)

    from llm_answer_watcher.llm_runner.browser.steel_perplexity import (
        SteelPerplexityRunner,
    )
    from llm_answer_watcher.llm_runner.browser.steel_base import SteelConfig

    config = SteelConfig(
        steel_api_key=STEEL_API_KEY,
        target_url="https://www.perplexity.ai",
        take_screenshots=True,
    )

    print("\n• Creating Perplexity runner...")
    runner = SteelPerplexityRunner(config)
    print(f"  ✓ Runner created: {runner.runner_name}")
    print(f"    Type: {runner.runner_type}")
    print(f"    Target: {runner.config.target_url}")

    return True


def main():
    """Run Steel API integration tests."""
    print("\n" + "=" * 60)
    print("STEEL SDK - REAL INTEGRATION TESTS")
    print("=" * 60)
    print("\nNote: These tests use real Steel API calls via Steel SDK.")
    print("Expected cost: ~$0.01 (a few seconds of browser time)")
    print(f"Using API key: {STEEL_API_KEY[:20]}...")
    print()

    tests = [
        ("Steel Session Creation", test_steel_session_creation),
        ("ChatGPT Runner Structure", test_chatgpt_runner_structure),
        ("Perplexity Runner Structure", test_perplexity_runner_structure),
    ]

    results = []
    for name, test_func in tests:
        try:
            success = test_func()
            results.append((name, success, None))
        except Exception as e:
            results.append((name, False, e))
            print(f"\n✗ TEST FAILED: {e}")
            import traceback
            traceback.print_exc()

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    passed = sum(1 for _, success, _ in results if success)
    total = len(results)

    for name, success, error in results:
        status = "✓ PASS" if success else "✗ FAIL"
        print(f"{status:<10} {name}")
        if error:
            print(f"           Error: {error}")

    print(f"\nResults: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All Steel API tests passed! Integration is working.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. See errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
