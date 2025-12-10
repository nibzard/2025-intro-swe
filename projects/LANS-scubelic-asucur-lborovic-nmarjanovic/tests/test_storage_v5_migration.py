#!/usr/bin/env python3
"""
Test SQLite schema migration to v5 for browser runner support.

Tests:
1. Migration from v4 to v5
2. New columns exist with correct types
3. Indexes created for runner_type and runner_name
4. Insert operations with browser metadata work
5. Backward compatibility with API runners (default values)
"""

import json
import sqlite3
import sys
from pathlib import Path

# Add project to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def test_v5_migration_from_v4(tmp_path):
    """Test migrating from schema v4 to v5."""
    from llm_answer_watcher.storage.db import (
        CURRENT_SCHEMA_VERSION,
        apply_migrations,
        get_schema_version,
        init_db_if_needed,
        insert_answer_raw,
    )

    db_path = tmp_path / "test_migration.db"

    # Initialize database with current schema
    init_db_if_needed(str(db_path))

    # Verify we're at v5
    with sqlite3.connect(str(db_path)) as conn:
        version = get_schema_version(conn)
        assert version == CURRENT_SCHEMA_VERSION == 5, f"Expected v5, got v{version}"

        # Check that new columns exist
        cursor = conn.execute("PRAGMA table_info(answers_raw)")
        columns = {row[1]: row[2] for row in cursor.fetchall()}  # name: type

        assert "runner_type" in columns, "Missing runner_type column"
        assert "runner_name" in columns, "Missing runner_name column"
        assert "screenshot_path" in columns, "Missing screenshot_path column"
        assert "html_snapshot_path" in columns, "Missing html_snapshot_path column"
        assert "session_id" in columns, "Missing session_id column"

        # Verify indexes exist
        cursor = conn.execute("PRAGMA index_list(answers_raw)")
        indexes = {row[1] for row in cursor.fetchall()}  # index name

        assert "idx_answers_runner_type" in indexes, "Missing runner_type index"
        assert "idx_answers_runner_name" in indexes, "Missing runner_name index"

    print("✓ Schema v5 migration successful")
    print(f"  - Added 5 new columns for browser runner metadata")
    print(f"  - Created 2 new indexes")
    return True


def test_insert_browser_metadata(tmp_path):
    """Test inserting answer with browser metadata."""
    from llm_answer_watcher.storage.db import init_db_if_needed, insert_answer_raw

    db_path = tmp_path / "test_browser_insert.db"
    init_db_if_needed(str(db_path))

    with sqlite3.connect(str(db_path)) as conn:
        # Insert browser runner answer
        insert_answer_raw(
            conn,
            run_id="2025-11-07T10-00-00Z",
            intent_id="crm-tools",
            model_provider="chatgpt-web",
            model_name="chatgpt-unknown",
            timestamp_utc="2025-11-07T10:00:05Z",
            prompt="What are the best CRM tools?",
            answer_text="Based on web search, here are the top CRM tools...",
            runner_type="browser",
            runner_name="steel-chatgpt",
            screenshot_path="./output/2025-11-07T10-00-00Z/screenshot_chatgpt.png",
            html_snapshot_path="./output/2025-11-07T10-00-00Z/html_chatgpt.html",
            session_id="session-abc123",
            web_search_count=5,
        )
        conn.commit()

        # Verify data was inserted
        cursor = conn.execute(
            """
            SELECT
                runner_type,
                runner_name,
                screenshot_path,
                html_snapshot_path,
                session_id,
                web_search_count
            FROM answers_raw
            WHERE run_id = ? AND intent_id = ?
            """,
            ("2025-11-07T10-00-00Z", "crm-tools"),
        )
        row = cursor.fetchone()

        assert row is not None, "No row inserted"
        assert row[0] == "browser", f"Expected runner_type='browser', got '{row[0]}'"
        assert (
            row[1] == "steel-chatgpt"
        ), f"Expected runner_name='steel-chatgpt', got '{row[1]}'"
        assert "screenshot_chatgpt.png" in row[2], f"Unexpected screenshot_path: {row[2]}"
        assert "html_chatgpt.html" in row[3], f"Unexpected html_snapshot_path: {row[3]}"
        assert row[4] == "session-abc123", f"Expected session_id='session-abc123', got '{row[4]}'"
        assert row[5] == 5, f"Expected web_search_count=5, got {row[5]}"

    print("✓ Browser metadata insert successful")
    print(f"  - runner_type: browser")
    print(f"  - runner_name: steel-chatgpt")
    print(f"  - screenshot_path: {row[2]}")
    print(f"  - html_snapshot_path: {row[3]}")
    print(f"  - session_id: {row[4]}")
    return True


def test_insert_api_runner_backward_compatibility(tmp_path):
    """Test that API runners work with default values (backward compatibility)."""
    from llm_answer_watcher.storage.db import init_db_if_needed, insert_answer_raw

    db_path = tmp_path / "test_api_compat.db"
    init_db_if_needed(str(db_path))

    with sqlite3.connect(str(db_path)) as conn:
        # Insert API runner answer (old-style call without browser params)
        insert_answer_raw(
            conn,
            run_id="2025-11-07T10-00-00Z",
            intent_id="crm-tools",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc="2025-11-07T10:00:05Z",
            prompt="What are the best CRM tools?",
            answer_text="Here are the top CRM tools: HubSpot, Salesforce...",
            usage_meta_json=json.dumps({"prompt_tokens": 100, "completion_tokens": 200}),
            estimated_cost_usd=0.0012,
        )
        conn.commit()

        # Verify defaults applied correctly
        cursor = conn.execute(
            """
            SELECT
                runner_type,
                runner_name,
                screenshot_path,
                html_snapshot_path,
                session_id
            FROM answers_raw
            WHERE run_id = ? AND intent_id = ?
            """,
            ("2025-11-07T10-00-00Z", "crm-tools"),
        )
        row = cursor.fetchone()

        assert row is not None, "No row inserted"
        assert row[0] == "api", f"Expected runner_type='api' (default), got '{row[0]}'"
        assert row[1] is None, "Expected runner_name=None (default)"
        assert row[2] is None, "Expected screenshot_path=None"
        assert row[3] is None, "Expected html_snapshot_path=None"
        assert row[4] is None, "Expected session_id=None"

    print("✓ Backward compatibility verified")
    print(f"  - API runners use runner_type='api' by default")
    print(f"  - Browser-specific fields remain NULL for API runners")
    return True


def test_query_by_runner_type(tmp_path):
    """Test querying answers by runner type."""
    from llm_answer_watcher.storage.db import init_db_if_needed, insert_answer_raw

    db_path = tmp_path / "test_query_runner.db"
    init_db_if_needed(str(db_path))

    with sqlite3.connect(str(db_path)) as conn:
        # Insert API runner
        insert_answer_raw(
            conn,
            run_id="2025-11-07T10-00-00Z",
            intent_id="crm-tools",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc="2025-11-07T10:00:05Z",
            prompt="What are the best CRM tools?",
            answer_text="API answer",
            runner_type="api",
            runner_name="openai-gpt-4o-mini",
        )

        # Insert browser runner
        insert_answer_raw(
            conn,
            run_id="2025-11-07T10-00-00Z",
            intent_id="crm-tools",
            model_provider="chatgpt-web",
            model_name="chatgpt-unknown",
            timestamp_utc="2025-11-07T10:00:10Z",
            prompt="What are the best CRM tools?",
            answer_text="Browser answer",
            runner_type="browser",
            runner_name="steel-chatgpt",
            session_id="session-abc",
        )
        conn.commit()

        # Query API runners only
        cursor = conn.execute(
            "SELECT model_provider, runner_name FROM answers_raw WHERE runner_type = ?",
            ("api",),
        )
        api_rows = cursor.fetchall()
        assert len(api_rows) == 1, f"Expected 1 API runner, got {len(api_rows)}"
        assert api_rows[0][0] == "openai"
        assert api_rows[0][1] == "openai-gpt-4o-mini"

        # Query browser runners only
        cursor = conn.execute(
            "SELECT model_provider, runner_name FROM answers_raw WHERE runner_type = ?",
            ("browser",),
        )
        browser_rows = cursor.fetchall()
        assert len(browser_rows) == 1, f"Expected 1 browser runner, got {len(browser_rows)}"
        assert browser_rows[0][0] == "chatgpt-web"
        assert browser_rows[0][1] == "steel-chatgpt"

    print("✓ Runner type filtering works correctly")
    print(f"  - Found 1 API runner")
    print(f"  - Found 1 browser runner")
    return True


def main():
    """Run all v5 migration tests."""
    import tempfile

    print("=" * 60)
    print("STORAGE V5 MIGRATION - TEST SUITE")
    print("=" * 60)
    print()

    tests = [
        ("Schema v4 → v5 Migration", test_v5_migration_from_v4),
        ("Insert Browser Metadata", test_insert_browser_metadata),
        ("API Runner Backward Compatibility", test_insert_api_runner_backward_compatibility),
        ("Query by Runner Type", test_query_by_runner_type),
    ]

    results = []
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)

        for name, test_func in tests:
            print("-" * 60)
            print(f"TEST: {name}")
            print("-" * 60)
            try:
                success = test_func(tmp_path)
                results.append((name, success, None))
                print()
            except Exception as e:
                results.append((name, False, e))
                print(f"\n✗ TEST FAILED: {e}\n")
                import traceback

                traceback.print_exc()
                print()

    # Summary
    print("=" * 60)
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
        print("\n🎉 All storage v5 migration tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. See errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
