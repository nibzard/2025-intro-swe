#!/usr/bin/env python3
"""
End-to-end test for browser runner workflow.

Tests the complete workflow from configuration → runner execution → storage → artifacts.
"""

import json
import os
import sqlite3
import sys
import tempfile
from pathlib import Path

# Add project to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def test_e2e_browser_runner_workflow():
    """Test complete workflow with browser runner configuration."""
    from llm_answer_watcher.config.schema import (
        Brands,
        ExtractionSettings,
        Intent,
        RunnerConfig,
        RuntimeConfig,
        RunSettings,
    )
    from llm_answer_watcher.llm_runner.browser.steel_chatgpt import SteelChatGPTRunner
    from llm_answer_watcher.llm_runner.intent_runner import IntentResult
    from llm_answer_watcher.llm_runner.runner import run_all
    from llm_answer_watcher.storage.db import init_db_if_needed
    from llm_answer_watcher.utils.time import utc_timestamp

    # Create temporary directory for outputs
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        output_dir = tmp_path / "output"
        db_path = tmp_path / "test.db"

        # Initialize database
        init_db_if_needed(str(db_path))

        # Create minimal test configuration
        config = RuntimeConfig(
            run_settings=RunSettings(
                output_dir=str(output_dir),
                sqlite_db_path=str(db_path),
                models=[],  # No API models
            ),
            brands=Brands(
                mine=["TestBrand", "MyProduct"],
                competitors=["Competitor1", "Competitor2"],
            ),
            intents=[
                Intent(
                    id="test-intent",
                    prompt="What are the best CRM tools?",
                )
            ],
            runner_configs=[
                RunnerConfig(
                    runner_plugin="steel-chatgpt",
                    config={
                        "steel_api_key": "test-key",
                        "target_url": "https://chat.openai.com",
                        "session_timeout": 300,
                        "take_screenshots": True,
                        "save_html_snapshot": True,
                        "session_reuse": False,
                        "output_dir": str(output_dir),
                    },
                )
            ],
            extraction_settings=None,  # Use defaults (regex-only extraction)
            global_operations=[],
        )

        # Mock the runner's run_intent method to avoid actual Steel API calls
        original_run_intent = SteelChatGPTRunner.run_intent

        def mock_run_intent(self, prompt: str) -> IntentResult:
            """Mock runner execution with synthetic browser result."""
            timestamp = utc_timestamp()
            return IntentResult(
                answer_text="Based on web search, top CRM tools: TestBrand, Competitor1, Salesforce, HubSpot",
                runner_type="browser",
                runner_name="steel-chatgpt",
                provider="chatgpt-web",
                model_name="chatgpt-unknown",
                timestamp_utc=timestamp,
                cost_usd=0.0,  # Browser runners don't have token costs
                tokens_used=0,
                screenshot_path=f"{output_dir}/screenshot_chatgpt.png",
                html_snapshot_path=f"{output_dir}/html_chatgpt.html",
                session_id="mock-session-123",
                web_search_results=[
                    {"url": "https://example.com/crm1", "title": "Top CRMs"},
                    {"url": "https://example.com/crm2", "title": "CRM Comparison"},
                ],
                success=True,
                error_message=None,
            )

        # Patch the method
        SteelChatGPTRunner.run_intent = mock_run_intent

        try:
            # Execute workflow
            result = run_all(config)

            # Verify result structure
            assert result["run_id"], "Missing run_id"
            assert result["success_count"] == 1, f"Expected 1 success, got {result['success_count']}"
            assert result["error_count"] == 0, f"Expected 0 errors, got {result['error_count']}"
            assert result["total_queries"] == 1, f"Expected 1 query, got {result['total_queries']}"
            assert result["total_cost_usd"] == 0.0, f"Expected $0.0 cost, got ${result['total_cost_usd']}"

            run_id = result["run_id"]
            run_dir = result["output_dir"]

            print(f"✓ Workflow completed: run_id={run_id}")
            print(f"  - Success: {result['success_count']}/{result['total_queries']}")
            print(f"  - Cost: ${result['total_cost_usd']:.6f}")
            print(f"  - Output: {run_dir}")

            # Verify JSON artifacts were written
            raw_answer_file = Path(run_dir) / "intent_test-intent_raw_chatgpt-web_chatgpt-unknown.json"
            parsed_answer_file = (
                Path(run_dir) / "intent_test-intent_parsed_chatgpt-web_chatgpt-unknown.json"
            )
            run_meta_file = Path(run_dir) / "run_meta.json"

            assert raw_answer_file.exists(), f"Missing raw answer file: {raw_answer_file}"
            assert parsed_answer_file.exists(), f"Missing parsed answer file: {parsed_answer_file}"
            assert run_meta_file.exists(), f"Missing run_meta file: {run_meta_file}"

            print(f"\n✓ JSON artifacts written:")
            print(f"  - {raw_answer_file.name}")
            print(f"  - {parsed_answer_file.name}")
            print(f"  - {run_meta_file.name}")

            # Verify raw answer JSON contains browser metadata
            with open(raw_answer_file) as f:
                raw_data = json.load(f)
                assert raw_data["runner_type"] == "browser", "Wrong runner_type"
                assert raw_data["runner_name"] == "steel-chatgpt", "Wrong runner_name"
                assert raw_data["screenshot_path"], "Missing screenshot_path"
                assert raw_data["html_snapshot_path"], "Missing html_snapshot_path"
                assert raw_data["session_id"] == "mock-session-123", "Wrong session_id"
                assert raw_data["web_search_count"] == 2, "Wrong web_search_count"

            print(f"\n✓ Raw answer JSON verified:")
            print(f"  - runner_type: {raw_data['runner_type']}")
            print(f"  - runner_name: {raw_data['runner_name']}")
            print(f"  - screenshot_path: {raw_data['screenshot_path']}")
            print(f"  - html_snapshot_path: {raw_data['html_snapshot_path']}")
            print(f"  - session_id: {raw_data['session_id']}")

            # Verify database contains browser metadata
            with sqlite3.connect(str(db_path)) as conn:
                # Check answers_raw table
                cursor = conn.execute(
                    """
                    SELECT
                        runner_type,
                        runner_name,
                        screenshot_path,
                        html_snapshot_path,
                        session_id,
                        web_search_count,
                        model_provider,
                        model_name
                    FROM answers_raw
                    WHERE run_id = ? AND intent_id = ?
                    """,
                    (run_id, "test-intent"),
                )
                row = cursor.fetchone()

                assert row, "No row in answers_raw table"
                assert row[0] == "browser", f"Expected runner_type='browser', got '{row[0]}'"
                assert row[1] == "steel-chatgpt", f"Expected runner_name='steel-chatgpt', got '{row[1]}'"
                assert row[2], "Missing screenshot_path in database"
                assert row[3], "Missing html_snapshot_path in database"
                assert row[4] == "mock-session-123", f"Expected session_id='mock-session-123', got '{row[4]}'"
                assert row[5] == 2, f"Expected web_search_count=2, got {row[5]}"
                assert row[6] == "chatgpt-web", f"Expected provider='chatgpt-web', got '{row[6]}'"
                assert row[7] == "chatgpt-unknown", f"Expected model='chatgpt-unknown', got '{row[7]}'"

            print(f"\n✓ Database verified:")
            print(f"  - runner_type: {row[0]}")
            print(f"  - runner_name: {row[1]}")
            print(f"  - screenshot_path: {row[2]}")
            print(f"  - session_id: {row[4]}")

            # Verify mentions were extracted and stored
            with sqlite3.connect(str(db_path)) as conn:
                cursor = conn.execute(
                    """
                    SELECT COUNT(*) FROM mentions
                    WHERE run_id = ? AND intent_id = ?
                    """,
                    (run_id, "test-intent"),
                )
                mention_count = cursor.fetchone()[0]
                assert mention_count > 0, "No mentions extracted"

                # Check that our brand was detected
                cursor = conn.execute(
                    """
                    SELECT normalized_name, is_mine, rank_position
                    FROM mentions
                    WHERE run_id = ? AND intent_id = ? AND is_mine = 1
                    """,
                    (run_id, "test-intent"),
                )
                my_mentions = cursor.fetchall()

            print(f"\n✓ Mentions extracted: {mention_count} total")
            if my_mentions:
                for mention in my_mentions:
                    print(f"  - My brand: {mention[0]} (rank: {mention[2]})")

            # Verify run metadata
            cursor = conn.execute(
                "SELECT total_intents, total_models FROM runs WHERE run_id = ?", (run_id,)
            )
            run_row = cursor.fetchone()
            assert run_row[0] == 1, f"Expected 1 intent, got {run_row[0]}"
            assert run_row[1] == 1, f"Expected 1 execution unit, got {run_row[1]}"

            print(f"\n✓ Run metadata verified:")
            print(f"  - total_intents: {run_row[0]}")
            print(f"  - total_execution_units: {run_row[1]}")

            print(f"\n🎉 End-to-end workflow test PASSED!")
            return True

        finally:
            # Restore original method
            SteelChatGPTRunner.run_intent = original_run_intent


def main():
    """Run end-to-end test."""
    print("=" * 70)
    print("END-TO-END BROWSER RUNNER WORKFLOW TEST")
    print("=" * 70)
    print()

    try:
        test_e2e_browser_runner_workflow()
        return 0
    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback

        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
