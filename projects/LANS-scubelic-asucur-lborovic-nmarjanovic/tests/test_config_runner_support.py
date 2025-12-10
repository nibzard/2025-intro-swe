#!/usr/bin/env python3
"""
Quick test for config loading with runner configuration.

Tests:
1. Legacy format (models) still works
2. New format (runners) works
3. Env var substitution works
"""

import sys
import os
import tempfile
from pathlib import Path

# Add project to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def test_legacy_format():
    """Test that legacy models format still works."""
    print("=" * 60)
    print("TEST 1: Legacy Format (models)")
    print("=" * 60)

    # Set test env var
    os.environ["TEST_OPENAI_KEY"] = "sk-test-12345"

    config_content = """
brands:
  mine: ["TestBrand"]
  competitors: ["Competitor1"]

intents:
  - id: "test"
    prompt: "What are the best tools?"

run_settings:
  output_dir: "./output"
  sqlite_db_path: "./test.db"
  models:
    - provider: "openai"
      model_name: "gpt-4o-mini"
      env_api_key: "TEST_OPENAI_KEY"
"""

    # Write temp config
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        f.write(config_content)
        temp_path = f.name

    try:
        from llm_answer_watcher.config.loader import load_config

        config = load_config(temp_path)

        # Verify
        assert len(config.models) == 1, f"Expected 1 model, got {len(config.models)}"
        assert config.models[0].api_key == "sk-test-12345"
        assert config.runner_configs is None or len(config.runner_configs) == 0

        print("✓ Legacy format works")
        print(f"  Models: {len(config.models)}")
        print(f"  API key resolved: {config.models[0].api_key[:10]}...")

        return True

    finally:
        os.unlink(temp_path)


def test_runner_format():
    """Test that new runners format works."""
    print("\n" + "=" * 60)
    print("TEST 2: New Format (runners)")
    print("=" * 60)

    # Set test env vars
    os.environ["TEST_STEEL_KEY"] = "ste-test-67890"
    os.environ["TEST_OPENAI_KEY2"] = "sk-test-api-key"

    config_content = """
brands:
  mine: ["TestBrand"]
  competitors: ["Competitor1"]

intents:
  - id: "test"
    prompt: "What are the best tools?"

run_settings:
  output_dir: "./output"
  sqlite_db_path: "./test.db"

runners:
  - runner_plugin: "api"
    config:
      provider: "openai"
      model_name: "gpt-4o-mini"
      api_key: "${TEST_OPENAI_KEY2}"
      system_prompt: "You are a helpful assistant."

  - runner_plugin: "steel-chatgpt"
    config:
      steel_api_key: "${TEST_STEEL_KEY}"
      target_url: "https://chat.openai.com"
      take_screenshots: true
      session_reuse: true
"""

    # Write temp config
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        f.write(config_content)
        temp_path = f.name

    try:
        from llm_answer_watcher.config.loader import load_config

        config = load_config(temp_path)

        # Verify
        assert config.runner_configs is not None, "runner_configs should not be None"
        assert len(config.runner_configs) == 2, f"Expected 2 runners, got {len(config.runner_configs)}"

        # Check API runner
        api_runner = config.runner_configs[0]
        assert api_runner.runner_plugin == "api"
        assert api_runner.config["api_key"] == "sk-test-api-key"
        assert api_runner.config["provider"] == "openai"

        # Check Steel runner
        steel_runner = config.runner_configs[1]
        assert steel_runner.runner_plugin == "steel-chatgpt"
        assert steel_runner.config["steel_api_key"] == "ste-test-67890"
        assert steel_runner.config["take_screenshots"] == True

        print("✓ Runner format works")
        print(f"  Runners: {len(config.runner_configs)}")
        print(f"  API runner: {api_runner.runner_plugin}")
        print(f"    API key resolved: {api_runner.config['api_key'][:10]}...")
        print(f"  Steel runner: {steel_runner.runner_plugin}")
        print(f"    Steel key resolved: {steel_runner.config['steel_api_key'][:10]}...")

        return True

    finally:
        os.unlink(temp_path)


def test_env_var_substitution():
    """Test that env var substitution works correctly."""
    print("\n" + "=" * 60)
    print("TEST 3: Env Var Substitution")
    print("=" * 60)

    from llm_answer_watcher.config.loader import _resolve_env_vars_recursive
    from llm_answer_watcher.exceptions import APIKeyMissingError

    # Set test env var
    os.environ["TEST_VAR"] = "test_value_123"

    # Test simple substitution
    result = _resolve_env_vars_recursive("${TEST_VAR}")
    assert result == "test_value_123"
    print("✓ Simple substitution works")

    # Test nested dict
    result = _resolve_env_vars_recursive({
        "key1": "${TEST_VAR}",
        "key2": "prefix-${TEST_VAR}-suffix",
        "nested": {
            "key3": "${TEST_VAR}"
        }
    })
    assert result["key1"] == "test_value_123"
    assert result["key2"] == "prefix-test_value_123-suffix"
    assert result["nested"]["key3"] == "test_value_123"
    print("✓ Nested dict substitution works")

    # Test list
    result = _resolve_env_vars_recursive([
        "${TEST_VAR}",
        "literal",
        {"key": "${TEST_VAR}"}
    ])
    assert result[0] == "test_value_123"
    assert result[1] == "literal"
    assert result[2]["key"] == "test_value_123"
    print("✓ List substitution works")

    # Test missing var (should raise)
    try:
        _resolve_env_vars_recursive("${MISSING_VAR}")
        assert False, "Should have raised APIKeyMissingError"
    except APIKeyMissingError as e:
        print(f"✓ Missing var raises error: {e}")

    return True


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("CONFIG LOADER - RUNNER SUPPORT TESTS")
    print("=" * 60)
    print()

    tests = [
        ("Legacy Format", test_legacy_format),
        ("Runner Format", test_runner_format),
        ("Env Var Substitution", test_env_var_substitution),
    ]

    results = []
    for name, test_func in tests:
        try:
            success = test_func()
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
        print("\n🎉 All config loader tests passed! Runner support is working.")
        return 0
    else:
        print(f"\n❌ {total - passed} test(s) failed. See errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
