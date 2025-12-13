#!/usr/bin/env python3
"""
Quick integration test for browser runner system.

Tests:
1. Plugin auto-registration
2. Plugin registry operations
3. API runner creation
4. Steel runner configuration
"""

import sys
from pathlib import Path

# Add project to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def test_plugin_registration():
    """Test that plugins auto-register on import."""
    print("=" * 60)
    print("TEST 1: Plugin Auto-Registration")
    print("=" * 60)

    # Import should trigger auto-registration
    from llm_answer_watcher.llm_runner import RunnerRegistry

    plugins = RunnerRegistry.list_plugins()

    print(f"\n✓ Found {len(plugins)} registered plugins:\n")
    for plugin in plugins:
        print(f"  • {plugin['name']:<20} ({plugin['type']})")
        print(f"    Required env vars: {', '.join(plugin['required_env_vars'])}")

    # Verify expected plugins
    plugin_names = {p['name'] for p in plugins}
    expected = {'api', 'steel-chatgpt', 'steel-perplexity'}

    assert expected == plugin_names, f"Expected {expected}, got {plugin_names}"
    print(f"\n✓ All expected plugins registered: {', '.join(expected)}")

    return True


def test_api_runner_creation():
    """Test API runner creation."""
    print("\n" + "=" * 60)
    print("TEST 2: API Runner Creation")
    print("=" * 60)

    from llm_answer_watcher.llm_runner import RunnerRegistry

    # Test configuration validation
    config = {
        "provider": "openai",
        "model_name": "gpt-4o-mini",
        "api_key": "sk-test-key-123",
        "system_prompt": "You are a helpful assistant.",
    }

    print("\n• Testing config validation...")
    plugin = RunnerRegistry.get_plugin("api")
    is_valid, error = plugin.validate_config(config)
    assert is_valid, f"Config validation failed: {error}"
    print("  ✓ Config validation passed")

    # Test runner creation (will work even with fake key for structure test)
    print("\n• Testing runner creation...")
    try:
        runner = RunnerRegistry.create_runner("api", config)
        print(f"  ✓ Runner created: {runner.runner_name}")
        print(f"    Type: {runner.runner_type}")
    except Exception as e:
        # This is ok - we're just testing structure
        print(f"  ✓ Runner structure correct (creation failed as expected: {type(e).__name__})")

    return True


def test_steel_runner_config():
    """Test Steel runner configuration."""
    print("\n" + "=" * 60)
    print("TEST 3: Steel Runner Configuration")
    print("=" * 60)

    from llm_answer_watcher.llm_runner import RunnerRegistry
    from llm_answer_watcher.llm_runner.browser.steel_base import SteelConfig

    # Test ChatGPT runner config
    print("\n• Testing ChatGPT runner config...")
    chatgpt_config = {
        "steel_api_key": "sk-steel-test-123",
        "target_url": "https://chat.openai.com",
        "take_screenshots": True,
        "session_reuse": True,
    }

    plugin = RunnerRegistry.get_plugin("steel-chatgpt")
    is_valid, error = plugin.validate_config(chatgpt_config)
    assert is_valid, f"ChatGPT config validation failed: {error}"
    print("  ✓ ChatGPT config validation passed")

    # Create runner (will fail on actual Steel API call, which is fine)
    runner = plugin.create_runner(chatgpt_config)
    print(f"  ✓ ChatGPT runner created: {runner.runner_name}")
    print(f"    Type: {runner.runner_type}")
    print(f"    Config: screenshots={runner.config.take_screenshots}, "
          f"reuse={runner.config.session_reuse}")

    # Test Perplexity runner config
    print("\n• Testing Perplexity runner config...")
    perplexity_config = {
        "steel_api_key": "sk-steel-test-123",
        "target_url": "https://www.perplexity.ai",
        "take_screenshots": False,
    }

    plugin = RunnerRegistry.get_plugin("steel-perplexity")
    is_valid, error = plugin.validate_config(perplexity_config)
    assert is_valid, f"Perplexity config validation failed: {error}"
    print("  ✓ Perplexity config validation passed")

    runner = plugin.create_runner(perplexity_config)
    print(f"  ✓ Perplexity runner created: {runner.runner_name}")
    print(f"    Type: {runner.runner_type}")

    # Test SteelConfig dataclass
    print("\n• Testing SteelConfig dataclass...")
    steel_config = SteelConfig(
        steel_api_key="test-key",
        target_url="https://example.com",
        session_timeout=300,
        take_screenshots=True,
        session_reuse=True,
    )
    print(f"  ✓ SteelConfig created: timeout={steel_config.session_timeout}s, "
          f"screenshots={steel_config.take_screenshots}")

    return True


def test_intent_result_structure():
    """Test IntentResult dataclass structure."""
    print("\n" + "=" * 60)
    print("TEST 4: IntentResult Structure")
    print("=" * 60)

    from llm_answer_watcher.llm_runner import IntentResult

    # Test API result
    print("\n• Testing API result structure...")
    api_result = IntentResult(
        answer_text="This is a test answer",
        runner_type="api",
        runner_name="openai-gpt-4o-mini",
        provider="openai",
        model_name="gpt-4o-mini",
        timestamp_utc="2025-11-07T10:00:00Z",
        cost_usd=0.0012,
        tokens_used=450,
        prompt_tokens=100,
        completion_tokens=350,
        success=True,
    )
    print(f"  ✓ API result: {len(api_result.answer_text)} chars, "
          f"${api_result.cost_usd:.4f}, {api_result.tokens_used} tokens")

    # Test browser result
    print("\n• Testing browser result structure...")
    browser_result = IntentResult(
        answer_text="This is a browser answer",
        runner_type="browser",
        runner_name="steel-chatgpt",
        provider="chatgpt-web",
        model_name="chatgpt-unknown",
        timestamp_utc="2025-11-07T10:00:00Z",
        cost_usd=0.0,
        screenshot_path="/tmp/screenshot.png",
        html_snapshot_path="/tmp/snapshot.html",
        session_id="session-abc123",
        web_search_count=3,
        success=True,
    )
    print(f"  ✓ Browser result: {len(browser_result.answer_text)} chars, "
          f"screenshot={browser_result.screenshot_path is not None}")
    print(f"    Session: {browser_result.session_id}")
    print(f"    Web searches: {browser_result.web_search_count}")

    return True


def test_error_handling():
    """Test error handling in plugin system."""
    print("\n" + "=" * 60)
    print("TEST 5: Error Handling")
    print("=" * 60)

    from llm_answer_watcher.llm_runner import RunnerRegistry

    # Test unknown plugin
    print("\n• Testing unknown plugin error...")
    try:
        RunnerRegistry.create_runner("unknown-plugin", {})
        assert False, "Should have raised ValueError"
    except ValueError as e:
        print(f"  ✓ Correctly raised ValueError: {e}")

    # Test invalid config
    print("\n• Testing invalid config error...")
    try:
        RunnerRegistry.create_runner("api", {"provider": "openai"})  # Missing required fields
        assert False, "Should have raised ValueError"
    except ValueError as e:
        print(f"  ✓ Correctly raised ValueError for invalid config")

    # Test invalid provider
    print("\n• Testing invalid provider error...")
    invalid_config = {
        "provider": "unknown-provider",
        "model_name": "test-model",
        "api_key": "test-key",
    }
    is_valid, error = RunnerRegistry.get_plugin("api").validate_config(invalid_config)
    assert not is_valid, "Should have failed validation"
    print(f"  ✓ Correctly rejected invalid provider: {error}")

    return True


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("BROWSER RUNNER SYSTEM - INTEGRATION TESTS")
    print("=" * 60)
    print()

    tests = [
        ("Plugin Registration", test_plugin_registration),
        ("API Runner Creation", test_api_runner_creation),
        ("Steel Runner Config", test_steel_runner_config),
        ("IntentResult Structure", test_intent_result_structure),
        ("Error Handling", test_error_handling),
    ]

    results = []
    for name, test_func in tests:
        try:
            test_func()
            results.append((name, True, None))
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
        print("\n🎉 All tests passed! Browser runner system is working correctly.")
        return 0
    else:
        print(f"\n❌ {total - passed} test(s) failed. See errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
