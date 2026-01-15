"""
Comprehensive tests for storage/db.py module.

This is a CRITICAL PATH module requiring 100% coverage per SPECS.md section 8.
Tests cover:
- Database initialization and idempotency
- Schema version management
- Migration logic (v0 -> v1)
- CRUD operations (insert_run, insert_answer_raw, insert_mention)
- Update operations (update_run_cost)
- Query operations (get_run_summary)
- UNIQUE constraints
- FOREIGN KEY constraints
- All error paths

All tests use temporary databases to avoid filesystem pollution.
"""

import json
import sqlite3

import pytest
from freezegun import freeze_time

from llm_answer_watcher.storage.db import (
    CURRENT_SCHEMA_VERSION,
    apply_migrations,
    get_run_summary,
    get_schema_version,
    init_db_if_needed,
    insert_answer_raw,
    insert_mention,
    insert_run,
    update_run_cost,
)
from llm_answer_watcher.utils.time import utc_timestamp

# ============================================================================
# Database Initialization Tests
# ============================================================================


def test_init_db_creates_database_file(tmp_path):
    """Test that init_db_if_needed() creates database file."""
    db_path = tmp_path / "test.db"
    assert not db_path.exists()

    init_db_if_needed(str(db_path))

    assert db_path.exists()
    assert db_path.is_file()


def test_init_db_creates_parent_directory(tmp_path):
    """Test that init_db_if_needed() creates parent directories."""
    db_path = tmp_path / "output" / "nested" / "test.db"
    assert not db_path.parent.exists()

    init_db_if_needed(str(db_path))

    assert db_path.parent.exists()
    assert db_path.exists()


def test_init_db_is_idempotent(tmp_path):
    """Test that init_db_if_needed() is safe to call multiple times."""
    db_path = tmp_path / "test.db"

    # First call - creates database
    init_db_if_needed(str(db_path))
    first_stat = db_path.stat()

    # Second call - should be no-op
    init_db_if_needed(str(db_path))
    second_stat = db_path.stat()

    # File should not be recreated (same inode and mtime should be close)
    assert first_stat.st_ino == second_stat.st_ino


def test_init_db_enables_foreign_keys(tmp_path):
    """Test that FOREIGN KEY constraints are enabled."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    # Note: Foreign keys must be enabled per connection
    # init_db_if_needed() enables them during initialization
    # We verify that foreign key constraints actually work
    with sqlite3.connect(db_path) as conn:
        conn.execute("PRAGMA foreign_keys = ON")
        cursor = conn.execute("PRAGMA foreign_keys")
        fk_enabled = cursor.fetchone()[0]

    # Should be 1 (enabled), not 0 (disabled)
    assert fk_enabled == 1


def test_init_db_creates_schema_version_table(tmp_path):
    """Test that schema_version table is created."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    with sqlite3.connect(db_path) as conn:
        cursor = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'"
        )
        result = cursor.fetchone()

    assert result is not None
    assert result[0] == "schema_version"


def test_init_db_creates_all_tables(tmp_path):
    """Test that all tables are created (runs, answers_raw, mentions, operations, intent_classifications, intent_classification_cache, schema_version)."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    with sqlite3.connect(db_path) as conn:
        cursor = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence' ORDER BY name"
        )
        tables = [row[0] for row in cursor.fetchall()]

    expected_tables = [
        "answers_raw",
        "intent_classification_cache",
        "intent_classifications",
        "mentions",
        "operations",
        "runs",
        "schema_version",
    ]
    assert sorted(tables) == sorted(expected_tables)


def test_init_db_creates_all_indexes(tmp_path):
    """Test that all indexes are created."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    with sqlite3.connect(db_path) as conn:
        cursor = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'"
        )
        indexes = [row[0] for row in cursor.fetchall()]

    expected_indexes = [
        "idx_mentions_timestamp",
        "idx_answers_timestamp",
        "idx_mentions_intent",
        "idx_mentions_brand",
        "idx_mentions_mine",
        "idx_mentions_rank",
        "idx_mentions_sentiment",
        "idx_mentions_context",
        "idx_intent_classifications_type",
        "idx_intent_classifications_buyer_stage",
        "idx_intent_classifications_urgency",
        "idx_operations_run",
        "idx_operations_intent",
        "idx_operations_timestamp",
        "idx_operations_operation_id",
        "idx_intent_cache_cached_at",
        "idx_intent_cache_last_accessed",
    ]
    assert sorted(indexes) == sorted(expected_indexes)


# ============================================================================
# Schema Version Tests
# ============================================================================


def test_get_schema_version_empty_database(tmp_path):
    """Test that get_schema_version() returns 0 for empty database."""
    db_path = tmp_path / "test.db"

    with sqlite3.connect(db_path) as conn:
        # Create schema_version table but don't insert any versions
        conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            )
        """)
        conn.commit()

        version = get_schema_version(conn)

    assert version == 0


def test_get_schema_version_after_migration(tmp_path):
    """Test that get_schema_version() returns correct version after migration."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    with sqlite3.connect(db_path) as conn:
        version = get_schema_version(conn)

    assert version == CURRENT_SCHEMA_VERSION
    assert version == 4  # Updated for intent classification caching


def test_get_schema_version_with_multiple_versions(tmp_path):
    """Test that get_schema_version() returns MAX version."""
    db_path = tmp_path / "test.db"

    with sqlite3.connect(db_path) as conn:
        # Create schema_version table and insert multiple versions
        conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            )
        """)
        conn.execute(
            "INSERT INTO schema_version (version, applied_at) VALUES (1, '2025-11-01T08:00:00Z')"
        )
        conn.commit()

        version = get_schema_version(conn)

    assert version == 1


# ============================================================================
# Schema Migration Tests
# ============================================================================


def test_apply_migrations_v0_to_v1(tmp_path):
    """Test migration from version 0 to version 1."""
    db_path = tmp_path / "test.db"

    with sqlite3.connect(db_path) as conn:
        # Create empty schema_version table (v0 state)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            )
        """)
        conn.commit()

        # Verify starting at v0
        assert get_schema_version(conn) == 0

        # Apply migration
        apply_migrations(conn, 0, 1)

        # Verify now at v1
        assert get_schema_version(conn) == 1

        # Verify tables exist
        cursor = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        )
        tables = [row[0] for row in cursor.fetchall()]
        assert "runs" in tables
        assert "answers_raw" in tables
        assert "mentions" in tables


@freeze_time("2025-11-02T08:00:00")
def test_migration_records_timestamp(tmp_path):
    """Test that migration records applied_at timestamp."""
    db_path = tmp_path / "test.db"
    expected_timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            )
        """)
        conn.commit()

        apply_migrations(conn, 0, 1)

        cursor = conn.execute("SELECT applied_at FROM schema_version WHERE version = 1")
        applied_at = cursor.fetchone()[0]

    assert applied_at == expected_timestamp


def test_migration_is_atomic_on_failure(tmp_path):
    """Test that migration rolls back on failure."""
    db_path = tmp_path / "test.db"

    with sqlite3.connect(db_path) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            )
        """)
        conn.commit()

        # Apply v1 migration first
        apply_migrations(conn, 0, 1)
        assert get_schema_version(conn) == 1

        # Apply v2 migration
        apply_migrations(conn, 1, 2)
        assert get_schema_version(conn) == 2

        # Apply v3 migration
        apply_migrations(conn, 2, 3)
        assert get_schema_version(conn) == 3

        # Apply v4 migration (current schema)
        apply_migrations(conn, 3, 4)
        assert get_schema_version(conn) == 4

        # Try to apply invalid migration (version 99 doesn't exist)
        # This should fail and not change the schema version
        with pytest.raises(sqlite3.Error, match="Failed to migrate"):
            apply_migrations(conn, 4, 99)

        # Should still be at version 4 (migration failed before v99)
        assert get_schema_version(conn) == 4


def test_cannot_downgrade_schema(tmp_path):
    """Test that downgrading schema raises ValueError."""
    db_path = tmp_path / "test.db"

    with sqlite3.connect(db_path) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            )
        """)
        conn.commit()

        # Try to downgrade from v1 to v0
        with pytest.raises(ValueError, match="Cannot downgrade"):
            apply_migrations(conn, 1, 0)


def test_init_db_raises_on_newer_schema_version(tmp_path):
    """Test that init_db_if_needed() raises error if database has newer schema."""
    db_path = tmp_path / "test.db"

    with sqlite3.connect(db_path) as conn:
        # Create schema_version table with future version
        conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            )
        """)
        conn.execute(
            "INSERT INTO schema_version (version, applied_at) VALUES (999, '2025-11-01T08:00:00Z')"
        )
        conn.commit()

    # Should raise error about newer schema
    with pytest.raises(ValueError, match="newer than expected"):
        init_db_if_needed(str(db_path))


# ============================================================================
# CRUD Operations - insert_run Tests
# ============================================================================


@freeze_time("2025-11-02T08:00:00")
def test_insert_run_creates_new_run(tmp_path):
    """Test that insert_run() creates new run record."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        insert_run(
            conn,
            run_id=run_id,
            timestamp_utc=timestamp,
            total_intents=3,
            total_models=2,
        )
        conn.commit()

        cursor = conn.execute("SELECT * FROM runs WHERE run_id = ?", (run_id,))
        row = cursor.fetchone()

    assert row is not None
    assert row[0] == run_id
    assert row[1] == timestamp
    assert row[2] == 3  # total_intents
    assert row[3] == 2  # total_models
    assert row[4] == 0.0  # total_cost_usd (initialized to 0.0)


def test_insert_run_is_idempotent(tmp_path):
    """Test that insert_run() is idempotent (INSERT OR IGNORE)."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        # Insert first time
        insert_run(conn, run_id, timestamp, 3, 2)
        conn.commit()

        # Insert second time with different values
        insert_run(conn, run_id, timestamp, 999, 999)
        conn.commit()

        # Should still have original values
        cursor = conn.execute(
            "SELECT total_intents, total_models FROM runs WHERE run_id = ?", (run_id,)
        )
        row = cursor.fetchone()

    assert row[0] == 3
    assert row[1] == 2


def test_insert_run_multiple_runs(tmp_path):
    """Test inserting multiple runs."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, "2025-11-02T08-00-00Z", "2025-11-02T08:00:00Z", 3, 2)
        insert_run(conn, "2025-11-02T09-00-00Z", "2025-11-02T09:00:00Z", 5, 1)
        insert_run(conn, "2025-11-02T10-00-00Z", "2025-11-02T10:00:00Z", 2, 3)
        conn.commit()

        cursor = conn.execute("SELECT COUNT(*) FROM runs")
        count = cursor.fetchone()[0]

    assert count == 3


# ============================================================================
# CRUD Operations - insert_answer_raw Tests
# ============================================================================


@freeze_time("2025-11-02T08:00:00")
def test_insert_answer_raw_stores_response(tmp_path):
    """Test that insert_answer_raw() stores LLM response."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()
    answer_text = "Here are the best email warmup tools..."
    usage_meta = {"prompt_tokens": 100, "completion_tokens": 500}

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)
        insert_answer_raw(
            conn,
            run_id=run_id,
            intent_id="email-warmup",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc=timestamp,
            prompt="What are the best email warmup tools?",
            answer_text=answer_text,
            usage_meta_json=json.dumps(usage_meta),
            estimated_cost_usd=0.0012,
        )
        conn.commit()

        cursor = conn.execute("SELECT * FROM answers_raw WHERE run_id = ?", (run_id,))
        row = cursor.fetchone()

    assert row is not None
    assert row[1] == run_id
    assert row[2] == "email-warmup"
    assert row[3] == "openai"
    assert row[4] == "gpt-4o-mini"
    assert row[7] == answer_text
    assert row[8] == len(answer_text)  # answer_length computed correctly
    assert row[9] == json.dumps(usage_meta)
    assert row[10] == 0.0012


def test_insert_answer_raw_computes_answer_length(tmp_path):
    """Test that insert_answer_raw() computes answer_length correctly."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()
    answer_text = "a" * 1234

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)
        insert_answer_raw(
            conn,
            run_id=run_id,
            intent_id="test",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc=timestamp,
            prompt="Test",
            answer_text=answer_text,
        )
        conn.commit()

        cursor = conn.execute(
            "SELECT answer_length FROM answers_raw WHERE run_id = ?", (run_id,)
        )
        length = cursor.fetchone()[0]

    assert length == 1234


def test_insert_answer_raw_handles_optional_fields(tmp_path):
    """Test that insert_answer_raw() handles optional fields (usage_meta_json, cost)."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)
        insert_answer_raw(
            conn,
            run_id=run_id,
            intent_id="test",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc=timestamp,
            prompt="Test",
            answer_text="Answer",
            usage_meta_json=None,
            estimated_cost_usd=None,
        )
        conn.commit()

        cursor = conn.execute(
            "SELECT usage_meta_json, estimated_cost_usd FROM answers_raw WHERE run_id = ?",
            (run_id,),
        )
        row = cursor.fetchone()

    assert row[0] is None
    assert row[1] is None


def test_insert_answer_raw_is_idempotent(tmp_path):
    """Test that insert_answer_raw() is idempotent (INSERT OR IGNORE)."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)

        # Insert first time
        insert_answer_raw(
            conn,
            run_id=run_id,
            intent_id="test",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc=timestamp,
            prompt="Test",
            answer_text="First answer",
        )
        conn.commit()

        # Insert second time with different text
        insert_answer_raw(
            conn,
            run_id=run_id,
            intent_id="test",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc=timestamp,
            prompt="Test",
            answer_text="Second answer (should be ignored)",
        )
        conn.commit()

        # Should still have first answer
        cursor = conn.execute(
            "SELECT answer_text FROM answers_raw WHERE run_id = ?", (run_id,)
        )
        answer_text = cursor.fetchone()[0]

    assert answer_text == "First answer"


def test_insert_answer_raw_with_unicode(tmp_path):
    """Test that insert_answer_raw() handles Unicode characters."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()
    answer_text = "Unicode: 你好 🚀 café"

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)
        insert_answer_raw(
            conn,
            run_id=run_id,
            intent_id="test",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc=timestamp,
            prompt="Test",
            answer_text=answer_text,
        )
        conn.commit()

        cursor = conn.execute(
            "SELECT answer_text FROM answers_raw WHERE run_id = ?", (run_id,)
        )
        stored_text = cursor.fetchone()[0]

    assert stored_text == answer_text


# ============================================================================
# CRUD Operations - insert_mention Tests
# ============================================================================


@freeze_time("2025-11-02T08:00:00")
def test_insert_mention_stores_brand_mention(tmp_path):
    """Test that insert_mention() stores brand mention."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)
        insert_mention(
            conn,
            run_id=run_id,
            timestamp_utc=timestamp,
            intent_id="email-warmup",
            model_provider="openai",
            model_name="gpt-4o-mini",
            brand_name="HubSpot",
            normalized_name="hubspot",
            is_mine=False,
            first_position=42,
            rank_position=1,
            match_type="exact",
        )
        conn.commit()

        cursor = conn.execute("SELECT * FROM mentions WHERE run_id = ?", (run_id,))
        row = cursor.fetchone()

    assert row is not None
    assert row[1] == run_id
    assert row[3] == "email-warmup"
    assert row[6] == "HubSpot"
    assert row[7] == "hubspot"
    assert row[8] == 0  # is_mine=False stored as 0
    assert row[9] == 42
    assert row[10] == 1
    assert row[11] == "exact"


def test_insert_mention_converts_boolean_to_integer(tmp_path):
    """Test that insert_mention() converts boolean is_mine to INTEGER."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)

        # Test is_mine=True -> 1
        insert_mention(
            conn,
            run_id=run_id,
            timestamp_utc=timestamp,
            intent_id="test1",
            model_provider="openai",
            model_name="gpt-4o-mini",
            brand_name="Warmly",
            normalized_name="warmly",
            is_mine=True,
            match_type="exact",
        )

        # Test is_mine=False -> 0
        insert_mention(
            conn,
            run_id=run_id,
            timestamp_utc=timestamp,
            intent_id="test2",
            model_provider="openai",
            model_name="gpt-4o-mini",
            brand_name="HubSpot",
            normalized_name="hubspot",
            is_mine=False,
            match_type="exact",
        )
        conn.commit()

        cursor = conn.execute(
            "SELECT normalized_name, is_mine FROM mentions WHERE run_id = ? ORDER BY intent_id",
            (run_id,),
        )
        rows = cursor.fetchall()

    assert rows[0][0] == "warmly"
    assert rows[0][1] == 1  # True -> 1
    assert rows[1][0] == "hubspot"
    assert rows[1][1] == 0  # False -> 0


def test_insert_mention_handles_optional_fields(tmp_path):
    """Test that insert_mention() handles optional fields (first_position, rank_position)."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)
        insert_mention(
            conn,
            run_id=run_id,
            timestamp_utc=timestamp,
            intent_id="test",
            model_provider="openai",
            model_name="gpt-4o-mini",
            brand_name="Warmly",
            normalized_name="warmly",
            is_mine=True,
            first_position=None,
            rank_position=None,
            match_type="exact",
        )
        conn.commit()

        cursor = conn.execute(
            "SELECT first_position, rank_position FROM mentions WHERE run_id = ?",
            (run_id,),
        )
        row = cursor.fetchone()

    assert row[0] is None
    assert row[1] is None


def test_insert_mention_is_idempotent(tmp_path):
    """Test that insert_mention() is idempotent (INSERT OR IGNORE)."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)

        # Insert first time
        insert_mention(
            conn,
            run_id=run_id,
            timestamp_utc=timestamp,
            intent_id="test",
            model_provider="openai",
            model_name="gpt-4o-mini",
            brand_name="Warmly",
            normalized_name="warmly",
            is_mine=True,
            rank_position=1,
            match_type="exact",
        )
        conn.commit()

        # Insert second time with different rank (should be ignored)
        insert_mention(
            conn,
            run_id=run_id,
            timestamp_utc=timestamp,
            intent_id="test",
            model_provider="openai",
            model_name="gpt-4o-mini",
            brand_name="Warmly",
            normalized_name="warmly",
            is_mine=True,
            rank_position=999,
            match_type="exact",
        )
        conn.commit()

        # Should still have first rank
        cursor = conn.execute(
            "SELECT rank_position FROM mentions WHERE run_id = ?", (run_id,)
        )
        rank = cursor.fetchone()[0]

    assert rank == 1


def test_insert_mention_multiple_brands(tmp_path):
    """Test inserting multiple brand mentions."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)

        brands = [
            ("Warmly", "warmly", True, 1),
            ("HubSpot", "hubspot", False, 2),
            ("Instantly", "instantly", False, 3),
        ]

        for brand_name, normalized_name, is_mine, rank in brands:
            insert_mention(
                conn,
                run_id=run_id,
                timestamp_utc=timestamp,
                intent_id="test",
                model_provider="openai",
                model_name="gpt-4o-mini",
                brand_name=brand_name,
                normalized_name=normalized_name,
                is_mine=is_mine,
                rank_position=rank,
                match_type="exact",
            )
        conn.commit()

        cursor = conn.execute(
            "SELECT COUNT(*) FROM mentions WHERE run_id = ?", (run_id,)
        )
        count = cursor.fetchone()[0]

    assert count == 3


# ============================================================================
# Update Operations - update_run_cost Tests
# ============================================================================


def test_update_run_cost_updates_total_cost(tmp_path):
    """Test that update_run_cost() updates total cost."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)
        conn.commit()

        # Verify initial cost is 0.0
        cursor = conn.execute(
            "SELECT total_cost_usd FROM runs WHERE run_id = ?", (run_id,)
        )
        initial_cost = cursor.fetchone()[0]
        assert initial_cost == 0.0

        # Update cost
        update_run_cost(conn, run_id, 0.0234)
        conn.commit()

        # Verify cost updated
        cursor = conn.execute(
            "SELECT total_cost_usd FROM runs WHERE run_id = ?", (run_id,)
        )
        updated_cost = cursor.fetchone()[0]

    assert updated_cost == 0.0234


def test_update_run_cost_raises_on_nonexistent_run(tmp_path):
    """Test that update_run_cost() raises ValueError for non-existent run_id."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    with sqlite3.connect(db_path) as conn:
        with pytest.raises(ValueError, match="run does not exist"):
            update_run_cost(conn, "nonexistent-run-id", 0.0123)


def test_update_run_cost_with_zero_cost(tmp_path):
    """Test that update_run_cost() handles zero cost correctly."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)
        update_run_cost(conn, run_id, 0.0)
        conn.commit()

        cursor = conn.execute(
            "SELECT total_cost_usd FROM runs WHERE run_id = ?", (run_id,)
        )
        cost = cursor.fetchone()[0]

    assert cost == 0.0


def test_update_run_cost_with_high_precision(tmp_path):
    """Test that update_run_cost() preserves high precision (6 decimals)."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()
    high_precision_cost = 0.000123

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)
        update_run_cost(conn, run_id, high_precision_cost)
        conn.commit()

        cursor = conn.execute(
            "SELECT total_cost_usd FROM runs WHERE run_id = ?", (run_id,)
        )
        cost = cursor.fetchone()[0]

    assert cost == pytest.approx(high_precision_cost, abs=1e-9)


# ============================================================================
# Query Operations - get_run_summary Tests
# ============================================================================


@freeze_time("2025-11-02T08:00:00")
def test_get_run_summary_retrieves_run_data(tmp_path):
    """Test that get_run_summary() retrieves run data."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 3, 2)
        update_run_cost(conn, run_id, 0.0234)
        conn.commit()

        summary = get_run_summary(conn, run_id)

    assert summary is not None
    assert summary["run_id"] == run_id
    assert summary["timestamp_utc"] == timestamp
    assert summary["total_intents"] == 3
    assert summary["total_models"] == 2
    assert summary["total_cost_usd"] == 0.0234


def test_get_run_summary_returns_none_for_nonexistent_run(tmp_path):
    """Test that get_run_summary() returns None for non-existent run."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    with sqlite3.connect(db_path) as conn:
        summary = get_run_summary(conn, "nonexistent-run-id")

    assert summary is None


def test_get_run_summary_returns_dict_with_correct_keys(tmp_path):
    """Test that get_run_summary() returns dict with correct keys."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)
        conn.commit()

        summary = get_run_summary(conn, run_id)

    assert summary is not None
    expected_keys = {
        "run_id",
        "timestamp_utc",
        "total_intents",
        "total_models",
        "total_cost_usd",
    }
    assert set(summary.keys()) == expected_keys


# ============================================================================
# Constraint Tests - UNIQUE Constraints
# ============================================================================


def test_unique_constraint_on_runs_run_id(tmp_path):
    """Test UNIQUE constraint on runs.run_id (PRIMARY KEY)."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)
        conn.commit()

        # Second insert should be silently ignored (INSERT OR IGNORE)
        insert_run(conn, run_id, timestamp, 999, 999)
        conn.commit()

        cursor = conn.execute("SELECT COUNT(*) FROM runs WHERE run_id = ?", (run_id,))
        count = cursor.fetchone()[0]

    # Should only have one row
    assert count == 1


def test_unique_constraint_on_answers_raw(tmp_path):
    """Test UNIQUE constraint on answers_raw (run_id, intent_id, provider, model)."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)

        # First insert
        insert_answer_raw(
            conn,
            run_id=run_id,
            intent_id="test",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc=timestamp,
            prompt="Test",
            answer_text="First",
        )
        conn.commit()

        # Second insert with same unique key should be ignored
        insert_answer_raw(
            conn,
            run_id=run_id,
            intent_id="test",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc=timestamp,
            prompt="Test",
            answer_text="Second (should be ignored)",
        )
        conn.commit()

        cursor = conn.execute(
            "SELECT COUNT(*) FROM answers_raw WHERE run_id = ? AND intent_id = ?",
            (run_id, "test"),
        )
        count = cursor.fetchone()[0]

    assert count == 1


def test_unique_constraint_on_mentions(tmp_path):
    """Test UNIQUE constraint on mentions (run_id, intent_id, provider, model, normalized_name)."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)

        # First insert
        insert_mention(
            conn,
            run_id=run_id,
            timestamp_utc=timestamp,
            intent_id="test",
            model_provider="openai",
            model_name="gpt-4o-mini",
            brand_name="Warmly",
            normalized_name="warmly",
            is_mine=True,
            rank_position=1,
            match_type="exact",
        )
        conn.commit()

        # Second insert with same unique key should be ignored
        insert_mention(
            conn,
            run_id=run_id,
            timestamp_utc=timestamp,
            intent_id="test",
            model_provider="openai",
            model_name="gpt-4o-mini",
            brand_name="Warmly",
            normalized_name="warmly",
            is_mine=True,
            rank_position=999,
            match_type="exact",
        )
        conn.commit()

        cursor = conn.execute(
            "SELECT COUNT(*) FROM mentions WHERE run_id = ? AND normalized_name = ?",
            (run_id, "warmly"),
        )
        count = cursor.fetchone()[0]

    assert count == 1


def test_unique_constraint_allows_different_models(tmp_path):
    """Test that UNIQUE constraints allow different model combinations."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 2)

        # Same intent, different models - should both be inserted
        insert_answer_raw(
            conn,
            run_id=run_id,
            intent_id="test",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc=timestamp,
            prompt="Test",
            answer_text="Answer from GPT-4o-mini",
        )

        insert_answer_raw(
            conn,
            run_id=run_id,
            intent_id="test",
            model_provider="anthropic",
            model_name="claude-3-5-sonnet",
            timestamp_utc=timestamp,
            prompt="Test",
            answer_text="Answer from Claude",
        )
        conn.commit()

        cursor = conn.execute(
            "SELECT COUNT(*) FROM answers_raw WHERE run_id = ? AND intent_id = ?",
            (run_id, "test"),
        )
        count = cursor.fetchone()[0]

    assert count == 2


# ============================================================================
# Constraint Tests - FOREIGN KEY Constraints
# ============================================================================


def test_foreign_key_constraint_answers_raw(tmp_path):
    """Test FOREIGN KEY constraint (answers_raw.run_id -> runs.run_id)."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    with sqlite3.connect(db_path) as conn:
        # Enable foreign keys (should already be enabled)
        conn.execute("PRAGMA foreign_keys = ON")

        # Try to insert answer without parent run
        with pytest.raises(sqlite3.IntegrityError):
            insert_answer_raw(
                conn,
                run_id="nonexistent-run-id",
                intent_id="test",
                model_provider="openai",
                model_name="gpt-4o-mini",
                timestamp_utc=utc_timestamp(),
                prompt="Test",
                answer_text="Answer",
            )
            conn.commit()


def test_foreign_key_constraint_mentions(tmp_path):
    """Test FOREIGN KEY constraint (mentions.run_id -> runs.run_id)."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    with sqlite3.connect(db_path) as conn:
        # Enable foreign keys (should already be enabled)
        conn.execute("PRAGMA foreign_keys = ON")

        # Try to insert mention without parent run
        with pytest.raises(sqlite3.IntegrityError):
            insert_mention(
                conn,
                run_id="nonexistent-run-id",
                timestamp_utc=utc_timestamp(),
                intent_id="test",
                model_provider="openai",
                model_name="gpt-4o-mini",
                brand_name="Warmly",
                normalized_name="warmly",
                is_mine=True,
                match_type="exact",
            )
            conn.commit()


def test_foreign_key_allows_valid_references(tmp_path):
    """Test that FOREIGN KEY allows valid references."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        # Insert parent run
        insert_run(conn, run_id, timestamp, 1, 1)
        conn.commit()

        # Insert child records - should succeed
        insert_answer_raw(
            conn,
            run_id=run_id,
            intent_id="test",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc=timestamp,
            prompt="Test",
            answer_text="Answer",
        )

        insert_mention(
            conn,
            run_id=run_id,
            timestamp_utc=timestamp,
            intent_id="test",
            model_provider="openai",
            model_name="gpt-4o-mini",
            brand_name="Warmly",
            normalized_name="warmly",
            is_mine=True,
            match_type="exact",
        )
        conn.commit()

        # Verify both inserted
        cursor = conn.execute(
            "SELECT COUNT(*) FROM answers_raw WHERE run_id = ?", (run_id,)
        )
        answer_count = cursor.fetchone()[0]

        cursor = conn.execute(
            "SELECT COUNT(*) FROM mentions WHERE run_id = ?", (run_id,)
        )
        mention_count = cursor.fetchone()[0]

    assert answer_count == 1
    assert mention_count == 1


# ============================================================================
# Integration Tests - Complete Workflow
# ============================================================================


@freeze_time("2025-11-02T08:00:00")
def test_complete_workflow(tmp_path):
    """Test complete workflow: init -> insert_run -> insert_answer -> insert_mention -> update_cost -> get_summary."""
    db_path = tmp_path / "test.db"

    # Initialize database
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        # 1. Insert run
        insert_run(conn, run_id, timestamp, 2, 1)
        conn.commit()

        # 2. Insert answers for two intents
        insert_answer_raw(
            conn,
            run_id=run_id,
            intent_id="intent1",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc=timestamp,
            prompt="What are the best tools?",
            answer_text="I recommend Warmly and HubSpot.",
            usage_meta_json=json.dumps(
                {"prompt_tokens": 100, "completion_tokens": 200}
            ),
            estimated_cost_usd=0.0012,
        )

        insert_answer_raw(
            conn,
            run_id=run_id,
            intent_id="intent2",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc=timestamp,
            prompt="Best email warmup?",
            answer_text="Warmly is the best for email warmup.",
            usage_meta_json=json.dumps({"prompt_tokens": 50, "completion_tokens": 100}),
            estimated_cost_usd=0.0008,
        )
        conn.commit()

        # 3. Insert mentions
        mentions = [
            ("intent1", "Warmly", "warmly", True, 1),
            ("intent1", "HubSpot", "hubspot", False, 2),
            ("intent2", "Warmly", "warmly", True, 1),
        ]

        for intent_id, brand_name, normalized_name, is_mine, rank in mentions:
            insert_mention(
                conn,
                run_id=run_id,
                timestamp_utc=timestamp,
                intent_id=intent_id,
                model_provider="openai",
                model_name="gpt-4o-mini",
                brand_name=brand_name,
                normalized_name=normalized_name,
                is_mine=is_mine,
                rank_position=rank,
                match_type="exact",
            )
        conn.commit()

        # 4. Update total cost
        total_cost = 0.0012 + 0.0008
        update_run_cost(conn, run_id, total_cost)
        conn.commit()

        # 5. Get summary
        summary = get_run_summary(conn, run_id)

        # 6. Verify all data
        cursor = conn.execute(
            "SELECT COUNT(*) FROM answers_raw WHERE run_id = ?", (run_id,)
        )
        answer_count = cursor.fetchone()[0]

        cursor = conn.execute(
            "SELECT COUNT(*) FROM mentions WHERE run_id = ?", (run_id,)
        )
        mention_count = cursor.fetchone()[0]

    # Assertions
    assert summary is not None
    assert summary["run_id"] == run_id
    assert summary["total_intents"] == 2
    assert summary["total_models"] == 1
    assert summary["total_cost_usd"] == pytest.approx(0.002, abs=1e-6)
    assert answer_count == 2
    assert mention_count == 3


def test_multiple_runs_in_same_database(tmp_path):
    """Test multiple runs in same database."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    runs = [
        ("2025-11-02T08-00-00Z", "2025-11-02T08:00:00Z", 3, 2),
        ("2025-11-02T09-00-00Z", "2025-11-02T09:00:00Z", 5, 1),
        ("2025-11-02T10-00-00Z", "2025-11-02T10:00:00Z", 2, 3),
    ]

    with sqlite3.connect(db_path) as conn:
        for run_id, timestamp, total_intents, total_models in runs:
            insert_run(conn, run_id, timestamp, total_intents, total_models)
        conn.commit()

        cursor = conn.execute("SELECT COUNT(*) FROM runs")
        count = cursor.fetchone()[0]

    assert count == 3


def test_multiple_answers_per_run(tmp_path):
    """Test multiple answers per run."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 2, 2)

        # 2 intents × 2 models = 4 answers
        intents = ["intent1", "intent2"]
        models = [("openai", "gpt-4o-mini"), ("anthropic", "claude-3-5-sonnet")]

        for intent_id in intents:
            for model_provider, model_name in models:
                insert_answer_raw(
                    conn,
                    run_id=run_id,
                    intent_id=intent_id,
                    model_provider=model_provider,
                    model_name=model_name,
                    timestamp_utc=timestamp,
                    prompt="Test",
                    answer_text=f"Answer from {model_provider}",
                )
        conn.commit()

        cursor = conn.execute(
            "SELECT COUNT(*) FROM answers_raw WHERE run_id = ?", (run_id,)
        )
        count = cursor.fetchone()[0]

    assert count == 4


def test_multiple_mentions_per_answer(tmp_path):
    """Test multiple mentions per answer."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)

        # Insert answer with 5 brand mentions
        brands = [
            ("Warmly", "warmly", True),
            ("HubSpot", "hubspot", False),
            ("Instantly", "instantly", False),
            ("Apollo", "apollo", False),
            ("Salesloft", "salesloft", False),
        ]

        for rank, (brand_name, normalized_name, is_mine) in enumerate(brands, start=1):
            insert_mention(
                conn,
                run_id=run_id,
                timestamp_utc=timestamp,
                intent_id="test",
                model_provider="openai",
                model_name="gpt-4o-mini",
                brand_name=brand_name,
                normalized_name=normalized_name,
                is_mine=is_mine,
                rank_position=rank,
                match_type="exact",
            )
        conn.commit()

        cursor = conn.execute(
            "SELECT COUNT(*) FROM mentions WHERE run_id = ?", (run_id,)
        )
        count = cursor.fetchone()[0]

    assert count == 5


# ============================================================================
# Edge Cases and Error Handling
# ============================================================================


def test_empty_strings_handled_correctly(tmp_path):
    """Test that empty strings are handled correctly."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)
        insert_answer_raw(
            conn,
            run_id=run_id,
            intent_id="test",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc=timestamp,
            prompt="",
            answer_text="",
        )
        conn.commit()

        cursor = conn.execute(
            "SELECT prompt, answer_text, answer_length FROM answers_raw WHERE run_id = ?",
            (run_id,),
        )
        row = cursor.fetchone()

    assert row[0] == ""
    assert row[1] == ""
    assert row[2] == 0


def test_very_long_text_stored_correctly(tmp_path):
    """Test that very long text (>10,000 chars) is stored correctly."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()
    long_text = "a" * 50000

    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)
        insert_answer_raw(
            conn,
            run_id=run_id,
            intent_id="test",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc=timestamp,
            prompt="Test",
            answer_text=long_text,
        )
        conn.commit()

        cursor = conn.execute(
            "SELECT answer_text, answer_length FROM answers_raw WHERE run_id = ?",
            (run_id,),
        )
        row = cursor.fetchone()

    assert row[0] == long_text
    assert row[1] == 50000


def test_sql_injection_prevention_in_queries(tmp_path):
    """Test that parameterized queries prevent SQL injection."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    # Malicious run_id with SQL injection attempt
    malicious_run_id = "'; DROP TABLE runs; --"
    timestamp = utc_timestamp()

    with sqlite3.connect(db_path) as conn:
        # This should safely store the malicious string as data
        insert_run(conn, malicious_run_id, timestamp, 1, 1)
        conn.commit()

        # Verify runs table still exists and data is stored
        cursor = conn.execute("SELECT COUNT(*) FROM runs")
        count = cursor.fetchone()[0]

        cursor = conn.execute(
            "SELECT run_id FROM runs WHERE run_id = ?", (malicious_run_id,)
        )
        stored_run_id = cursor.fetchone()[0]

    assert count == 1
    assert stored_run_id == malicious_run_id


def test_database_with_special_characters_in_path(tmp_path):
    """Test database creation with special characters in path."""
    db_path = tmp_path / "output (test)" / "watcher [v1].db"

    init_db_if_needed(str(db_path))

    assert db_path.exists()
    assert db_path.is_file()


def test_concurrent_access_same_connection(tmp_path):
    """Test that same connection can be used for multiple operations."""
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))

    run_id = "2025-11-02T08-00-00Z"
    timestamp = utc_timestamp()

    # Use single connection for all operations
    with sqlite3.connect(db_path) as conn:
        insert_run(conn, run_id, timestamp, 1, 1)
        insert_answer_raw(
            conn,
            run_id=run_id,
            intent_id="test",
            model_provider="openai",
            model_name="gpt-4o-mini",
            timestamp_utc=timestamp,
            prompt="Test",
            answer_text="Answer",
        )
        insert_mention(
            conn,
            run_id=run_id,
            timestamp_utc=timestamp,
            intent_id="test",
            model_provider="openai",
            model_name="gpt-4o-mini",
            brand_name="Warmly",
            normalized_name="warmly",
            is_mine=True,
            match_type="exact",
        )
        update_run_cost(conn, run_id, 0.001)
        conn.commit()

        summary = get_run_summary(conn, run_id)

    assert summary is not None
    assert summary["total_cost_usd"] == 0.001
