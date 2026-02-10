"""
SQLite database initialization and schema management for LLM Answer Watcher.

This module provides database setup with schema versioning and migration support.
All timestamps are stored in ISO 8601 format with 'Z' suffix (UTC).

The database tracks:
- runs: Each CLI execution with metadata and totals
- answers_raw: Full LLM responses with usage and cost data
- mentions: Exploded brand mentions for analytics

Schema versioning ensures safe upgrades as features evolve.

Example usage:
    >>> from storage.db import init_db_if_needed
    >>> init_db_if_needed("./output/watcher.db")
    # Creates database with version 1 schema if needed
    # Or applies migrations if schema is outdated

Security:
    - ALL queries use parameterized statements to prevent SQL injection
    - NO API keys are ever stored in the database
    - Connection context managers ensure proper cleanup
"""

import logging
import sqlite3
from pathlib import Path

from ..utils.time import utc_timestamp

logger = logging.getLogger(__name__)

# Current schema version - increment when migrations are added
CURRENT_SCHEMA_VERSION = 10


def init_db_if_needed(db_path: str) -> None:
    """
    Initialize SQLite database with schema versioning.

    Creates the database file if it doesn't exist, initializes the schema_version
    table, checks the current schema version, and applies any needed migrations.

    This function is idempotent - safe to call multiple times. If the database
    already exists at the current schema version, it's a no-op.

    Args:
        db_path: Filesystem path to SQLite database file.
                 Parent directory must exist or be creatable.

    Raises:
        sqlite3.Error: If database creation or migration fails
        OSError: If parent directory cannot be created
        PermissionError: If database file is not writable

    Example:
        >>> init_db_if_needed("./output/watcher.db")
        # First call: creates database with v1 schema
        # Subsequent calls: no-op if schema is current

        >>> init_db_if_needed("/tmp/test.db")
        # Creates parent directory if needed

    Note:
        Uses transactions to ensure atomic schema migrations.
        If migration fails, database is rolled back to previous state.
        Always call this before performing database operations.
    """
    # Ensure parent directory exists
    db_path_obj = Path(db_path)
    db_path_obj.parent.mkdir(parents=True, exist_ok=True)

    # Connect to database (creates file if doesn't exist)
    with sqlite3.connect(db_path) as conn:
        # Enable foreign key constraints (disabled by default in SQLite)
        conn.execute("PRAGMA foreign_keys = ON")

        # Initialize schema_version table if needed
        conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            )
        """)
        conn.commit()

        # Check current schema version
        current_version = get_schema_version(conn)

        if current_version < CURRENT_SCHEMA_VERSION:
            logger.info(
                f"Database schema upgrade needed: "
                f"v{current_version} -> v{CURRENT_SCHEMA_VERSION}"
            )
            apply_migrations(conn, current_version, CURRENT_SCHEMA_VERSION)
            logger.info(f"Database schema upgraded to v{CURRENT_SCHEMA_VERSION}")
        elif current_version == CURRENT_SCHEMA_VERSION:
            logger.debug(f"Database schema is current (v{CURRENT_SCHEMA_VERSION})")
        else:
            # This should never happen unless someone manually edited schema_version
            raise ValueError(
                f"Database schema version {current_version} is newer than "
                f"expected {CURRENT_SCHEMA_VERSION}. Update your software or "
                f"use a different database file."
            )


def get_schema_version(conn: sqlite3.Connection) -> int:
    """
    Get current schema version from database.

    Queries the schema_version table to determine which version of the schema
    is currently applied. Returns 0 if no version has been recorded (fresh database).

    Args:
        conn: Active SQLite database connection

    Returns:
        int: Current schema version (0 if no migrations applied yet)

    Example:
        >>> with sqlite3.connect("watcher.db") as conn:
        ...     version = get_schema_version(conn)
        ...     print(f"Schema version: {version}")
        Schema version: 1

    Note:
        This function does NOT create the schema_version table.
        Call init_db_if_needed() first to ensure table exists.
    """
    cursor = conn.execute("SELECT MAX(version) FROM schema_version")
    result = cursor.fetchone()[0]

    # MAX() returns None if table is empty
    return result if result is not None else 0


def apply_migrations(
    conn: sqlite3.Connection, from_version: int, to_version: int
) -> None:
    """
    Apply schema migrations from one version to another.

    Upgrades the database schema by applying all migrations between from_version
    and to_version (inclusive). Each migration runs in a transaction and is
    committed atomically. The schema_version table is updated after successful
    migration.

    Args:
        conn: Active SQLite database connection
        from_version: Starting schema version (0 for fresh database)
        to_version: Target schema version (usually CURRENT_SCHEMA_VERSION)

    Raises:
        sqlite3.Error: If any migration SQL fails (transaction rolled back)
        ValueError: If from_version > to_version (downgrades not supported)

    Example:
        >>> with sqlite3.connect("watcher.db") as conn:
        ...     # Upgrade from v0 to v1
        ...     apply_migrations(conn, 0, 1)
        ...     # Database now has runs, answers_raw, mentions tables

    Note:
        Migrations are applied sequentially. If migration to version N fails,
        database remains at version N-1. Partial migrations are rolled back.

        Future versions add more migration logic:
        - v1 -> v2: Add new columns or indexes
        - v2 -> v3: Modify constraints or add tables
    """
    if from_version > to_version:
        raise ValueError(
            f"Cannot downgrade schema from v{from_version} to v{to_version}. "
            f"Downgrades are not supported. Use a database backup instead."
        )

    # Apply each migration in sequence
    for target_version in range(from_version + 1, to_version + 1):
        logger.info(f"Applying migration to schema version {target_version}")

        # Use transaction for atomic migration
        try:
            conn.execute("BEGIN")

            if target_version == 1:
                _migrate_to_v1(conn)
            elif target_version == 2:
                _migrate_to_v2(conn)
            elif target_version == 3:
                _migrate_to_v3(conn)
            elif target_version == 4:
                _migrate_to_v4(conn)
            elif target_version == 5:
                _migrate_to_v5(conn)
            elif target_version == 6:
                _migrate_to_v6(conn)
            elif target_version == 7:
                _migrate_to_v7(conn)
            elif target_version == 8:
                _migrate_to_v8(conn)
            elif target_version == 9:
                _migrate_to_v9(conn)
            elif target_version == 10:
                _migrate_to_v10(conn)
            # Future migrations go here:
            # elif target_version == 11:
            #     _migrate_to_v10(conn)
            else:
                raise ValueError(f"No migration defined for version {target_version}")

            # Record successful migration
            timestamp = utc_timestamp()
            conn.execute(
                "INSERT INTO schema_version (version, applied_at) VALUES (?, ?)",
                (target_version, timestamp),
            )

            conn.commit()
            logger.info(
                f"Successfully migrated to schema version {target_version} "
                f"at {timestamp}"
            )

        except Exception as e:
            conn.rollback()
            logger.error(
                f"Migration to version {target_version} failed: {e}", exc_info=True
            )
            raise sqlite3.Error(
                f"Failed to migrate database to version {target_version}: {e}"
            ) from e


def _migrate_to_v1(conn: sqlite3.Connection) -> None:
    """
    Migrate database schema to version 1.

    Creates initial tables for the LLM Answer Watcher:
    - runs: Track each CLI execution with run_id, timestamp, totals
    - answers_raw: Store full LLM responses with usage metadata
    - mentions: Exploded brand mentions for analytics queries

    Also creates indexes for common query patterns:
    - Timestamp-based queries (time series analysis)
    - Intent-based filtering
    - Brand name lookups
    - Rank position analysis

    Args:
        conn: Active SQLite database connection in transaction

    Raises:
        sqlite3.Error: If table creation or index creation fails

    Note:
        This migration is called automatically by apply_migrations().
        Do NOT call directly - use apply_migrations() instead.

        Schema design principles:
        - UNIQUE constraints prevent duplicate data
        - Foreign keys maintain referential integrity
        - Indexes optimize common query patterns
        - TEXT fields use ISO 8601 timestamps with 'Z' suffix
        - REAL fields store costs as USD with 6 decimal precision
    """
    # Create runs table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS runs (
            run_id TEXT PRIMARY KEY,
            timestamp_utc TEXT NOT NULL,
            total_intents INTEGER NOT NULL,
            total_models INTEGER NOT NULL,
            total_cost_usd REAL DEFAULT 0.0
        )
    """)

    # Create answers_raw table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS answers_raw (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT NOT NULL,
            intent_id TEXT NOT NULL,
            model_provider TEXT NOT NULL,
            model_name TEXT NOT NULL,
            timestamp_utc TEXT NOT NULL,
            prompt TEXT NOT NULL,
            answer_text TEXT NOT NULL,
            answer_length INTEGER NOT NULL,
            usage_meta_json TEXT,
            estimated_cost_usd REAL,
            FOREIGN KEY (run_id) REFERENCES runs(run_id),
            UNIQUE(run_id, intent_id, model_provider, model_name)
        )
    """)

    # Create mentions table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS mentions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT NOT NULL,
            timestamp_utc TEXT NOT NULL,
            intent_id TEXT NOT NULL,
            model_provider TEXT NOT NULL,
            model_name TEXT NOT NULL,
            brand_name TEXT NOT NULL,
            normalized_name TEXT NOT NULL,
            is_mine INTEGER NOT NULL,
            first_position INTEGER,
            rank_position INTEGER,
            match_type TEXT NOT NULL,
            FOREIGN KEY (run_id) REFERENCES runs(run_id),
            UNIQUE(run_id, intent_id, model_provider, model_name, normalized_name)
        )
    """)

    # Create indexes for common queries
    # Timestamp indexes for time series analysis
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_mentions_timestamp
        ON mentions(timestamp_utc)
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_answers_timestamp
        ON answers_raw(timestamp_utc)
    """)

    # Intent index for filtering by search query
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_mentions_intent
        ON mentions(intent_id)
    """)

    # Brand index for competitor analysis
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_mentions_brand
        ON mentions(normalized_name)
    """)

    # is_mine index for filtering own vs competitor mentions
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_mentions_mine
        ON mentions(is_mine)
    """)

    # Rank index for position-based queries
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_mentions_rank
        ON mentions(rank_position)
    """)

    logger.debug("Created schema v1 tables and indexes")


def _migrate_to_v2(conn: sqlite3.Connection) -> None:
    """
    Migrate database schema to version 2.

    Adds web search support to the answers_raw table:
    - web_search_count: Number of web searches performed for this answer
    - web_search_results_json: JSON array of web search results (if any)

    This migration uses ALTER TABLE to add columns to existing tables,
    which is safe for existing data (new columns are nullable).

    Args:
        conn: Active SQLite database connection in transaction

    Raises:
        sqlite3.Error: If table alteration fails

    Note:
        This migration is called automatically by apply_migrations().
        Do NOT call directly - use apply_migrations() instead.

        Existing rows will have NULL values for these columns, which
        will be treated as 0 and NULL respectively in queries.
    """
    # Add web search columns to answers_raw table
    conn.execute("""
        ALTER TABLE answers_raw
        ADD COLUMN web_search_count INTEGER DEFAULT 0
    """)

    conn.execute("""
        ALTER TABLE answers_raw
        ADD COLUMN web_search_results_json TEXT
    """)

    logger.debug("Added web search columns to answers_raw table (schema v2)")


def _migrate_to_v3(conn: sqlite3.Connection) -> None:
    """
    Migrate database schema to version 3.

    Adds two major feature sets:

    1. Operations support (custom post-intent operations):
       - operations table: Store custom operation results with metadata
       - Enables tracking of post-intent operations that perform additional
         analysis on LLM responses (content gaps, action items, etc.)

    2. Sentiment/context analysis and intent classification:
       - Adds sentiment and mention_context columns to mentions table
       - Creates intent_classifications table for query intent metadata
       - Enables per-mention sentiment tagging (positive/neutral/negative)
       - Context classification (primary_recommendation, alternative_listing, etc.)
       - Query intent classification (transactional, informational, navigational)
       - Buyer journey stage tracking (awareness, consideration, decision)

    Args:
        conn: Active SQLite database connection in transaction

    Raises:
        sqlite3.Error: If table alteration or creation fails

    Note:
        This migration is called automatically by apply_migrations().
        Do NOT call directly - use apply_migrations() instead.

        Existing rows in mentions table will have NULL values for new columns.
    """
    # ==== PART 1: Operations Support ====
    # Create operations table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS operations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT NOT NULL,
            intent_id TEXT NOT NULL,
            model_provider TEXT NOT NULL,
            model_name TEXT NOT NULL,
            operation_id TEXT NOT NULL,
            operation_description TEXT,
            operation_prompt TEXT NOT NULL,
            result_text TEXT,
            tokens_used_input INTEGER DEFAULT 0,
            tokens_used_output INTEGER DEFAULT 0,
            cost_usd REAL DEFAULT 0.0,
            timestamp_utc TEXT NOT NULL,
            depends_on TEXT,
            execution_order INTEGER NOT NULL,
            skipped INTEGER DEFAULT 0,
            error TEXT,
            FOREIGN KEY (run_id) REFERENCES runs(run_id),
            UNIQUE(run_id, intent_id, model_provider, model_name, operation_id)
        )
    """)

    # Create indexes for common queries
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_operations_run
        ON operations(run_id)
    """)

    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_operations_intent
        ON operations(intent_id)
    """)

    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_operations_timestamp
        ON operations(timestamp_utc)
    """)

    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_operations_operation_id
        ON operations(operation_id)
    """)

    logger.debug("Created operations table and indexes (schema v3 part 1)")

    # ==== PART 2: Sentiment/Intent Classification Support ====
    # Add sentiment and context columns to mentions table
    conn.execute("""
        ALTER TABLE mentions
        ADD COLUMN sentiment TEXT CHECK(sentiment IN ('positive', 'neutral', 'negative') OR sentiment IS NULL)
    """)

    conn.execute("""
        ALTER TABLE mentions
        ADD COLUMN mention_context TEXT CHECK(mention_context IN (
            'primary_recommendation',
            'alternative_listing',
            'competitor_negative',
            'competitor_neutral',
            'passing_reference'
        ) OR mention_context IS NULL)
    """)

    # Create index for sentiment filtering
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_mentions_sentiment
        ON mentions(sentiment)
    """)

    # Create index for mention context filtering
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_mentions_context
        ON mentions(mention_context)
    """)

    # Create intent_classifications table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS intent_classifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id TEXT NOT NULL,
            intent_id TEXT NOT NULL,
            intent_type TEXT NOT NULL CHECK(intent_type IN (
                'transactional',
                'informational',
                'navigational',
                'commercial_investigation'
            )),
            buyer_stage TEXT NOT NULL CHECK(buyer_stage IN (
                'awareness',
                'consideration',
                'decision'
            )),
            urgency_signal TEXT NOT NULL CHECK(urgency_signal IN (
                'high',
                'medium',
                'low'
            )),
            classification_confidence REAL NOT NULL,
            reasoning TEXT,
            extraction_cost_usd REAL DEFAULT 0.0,
            timestamp_utc TEXT NOT NULL,
            FOREIGN KEY (run_id) REFERENCES runs(run_id),
            UNIQUE(run_id, intent_id)
        )
    """)

    # Create indexes for intent classification queries
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_intent_classifications_type
        ON intent_classifications(intent_type)
    """)

    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_intent_classifications_buyer_stage
        ON intent_classifications(buyer_stage)
    """)

    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_intent_classifications_urgency
        ON intent_classifications(urgency_signal)
    """)

    logger.debug("Added sentiment/intent classification support (schema v3 part 2)")


def _migrate_to_v4(conn: sqlite3.Connection) -> None:
    """
    Migrate database schema to version 4.

    Adds intent classification caching to avoid redundant API calls for identical queries.
    This optimization reduces costs and latency for static query sets.

    Creates:
    - intent_classification_cache table: Stores classification results by query hash
    - Cache lookup prevents re-classifying identical query text
    - Timestamp tracking for TTL support and LRU eviction

    Cache design:
    - query_hash: SHA256 of normalized query text (primary key, ensures uniqueness)
    - query_text: Original query for debugging/validation
    - Classification fields: intent_type, buyer_stage, urgency_signal, confidence, reasoning
    - cached_at: When result was first cached (for TTL-based expiration)
    - last_accessed_at: Most recent cache hit (for LRU eviction strategies)

    Args:
        conn: Active SQLite database connection in transaction

    Raises:
        sqlite3.Error: If table creation or index creation fails

    Note:
        This migration is called automatically by apply_migrations().
        Do NOT call directly - use apply_migrations() instead.

        Cache hits avoid LLM API calls entirely, providing 0-cost classifications
        for repeated queries. Particularly valuable for static query sets where
        queries don't change between runs.
    """
    # Create intent classification cache table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS intent_classification_cache (
            query_hash TEXT PRIMARY KEY,
            query_text TEXT NOT NULL,
            intent_type TEXT NOT NULL CHECK(intent_type IN (
                'transactional',
                'informational',
                'navigational',
                'commercial_investigation'
            )),
            buyer_stage TEXT NOT NULL CHECK(buyer_stage IN (
                'awareness',
                'consideration',
                'decision'
            )),
            urgency_signal TEXT NOT NULL CHECK(urgency_signal IN (
                'high',
                'medium',
                'low'
            )),
            classification_confidence REAL NOT NULL,
            reasoning TEXT,
            extraction_cost_usd REAL DEFAULT 0.0,
            cached_at TEXT NOT NULL,
            last_accessed_at TEXT NOT NULL
        )
    """)

    # Index for timestamp-based queries (TTL cleanup, if implemented)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_intent_cache_cached_at
        ON intent_classification_cache(cached_at)
    """)

    # Index for last access time (LRU eviction, if implemented)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_intent_cache_last_accessed
        ON intent_classification_cache(last_accessed_at)
    """)

    logger.debug("Created intent_classification_cache table and indexes (schema v4)")


def _migrate_to_v5(conn: sqlite3.Connection) -> None:
    """
    Migrate database schema to version 5.

    Adds browser runner metadata columns to support browser-based intent execution.
    Enables tracking of browser automation runs alongside API-based runs.

    Changes:
    - Add runner_type column to answers_raw (default 'api' for backward compatibility)
    - Add runner_name column for human-readable runner identification
    - Add screenshot_path, html_snapshot_path, session_id for browser runners
    - Create indexes for runner_type and runner_name queries

    Args:
        conn: Active SQLite database connection

    Note:
        All existing rows will default to runner_type='api' for backward compatibility.
    """
    # Add runner type tracking
    conn.execute("ALTER TABLE answers_raw ADD COLUMN runner_type TEXT DEFAULT 'api'")
    conn.execute("ALTER TABLE answers_raw ADD COLUMN runner_name TEXT")

    # Add browser-specific metadata columns
    conn.execute("ALTER TABLE answers_raw ADD COLUMN screenshot_path TEXT")
    conn.execute("ALTER TABLE answers_raw ADD COLUMN html_snapshot_path TEXT")
    conn.execute("ALTER TABLE answers_raw ADD COLUMN session_id TEXT")

    # Create indexes for filtering/grouping by runner type
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_answers_runner_type ON answers_raw(runner_type)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_answers_runner_name ON answers_raw(runner_name)"
    )

    logger.debug("Added browser runner metadata columns to answers_raw (schema v5)")


def _migrate_to_v6(conn: sqlite3.Connection) -> None:
    """
    Migrate database schema to version 6.

    Adds run_insights table to store AI-generated executive summaries/insights
    for the entire run. This enables displaying a "Conclusion" section
    in the UI.

    Args:
        conn: Active SQLite database connection
    """
    conn.execute("""
        CREATE TABLE IF NOT EXISTS run_insights (
            run_id TEXT PRIMARY KEY,
            insight_text TEXT NOT NULL,
            model_provider TEXT NOT NULL,
            model_name TEXT NOT NULL,
            input_tokens INTEGER NOT NULL DEFAULT 0,
            output_tokens INTEGER NOT NULL DEFAULT 0,
            cost_usd REAL NOT NULL DEFAULT 0.0,
            timestamp_utc TEXT NOT NULL,
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        )
    """)
    
    logger.debug("Created run_insights table (schema v6)")


def _migrate_to_v7(conn: sqlite3.Connection) -> None:
    """
    Migrate database schema to version 7.

    Adds user authentication and secure API key storage tables:
    - users: User accounts with hashed passwords
    - user_api_keys: Encrypted API keys per user per provider
    - refresh_tokens: JWT refresh token tracking for secure auth

    This enables multi-user support where each user can securely store
    their own LLM provider API keys.

    Args:
        conn: Active SQLite database connection in transaction

    Raises:
        sqlite3.Error: If table creation or index creation fails

    Note:
        This migration is called automatically by apply_migrations().
        Do NOT call directly - use apply_migrations() instead.

        Security considerations:
        - Passwords are stored as bcrypt hashes (not plaintext)
        - API keys are encrypted with Fernet (AES-128-CBC + HMAC)
        - Refresh tokens are stored as SHA256 hashes
        - Email and username have UNIQUE constraints
    """
    # Create users table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            last_login_at TEXT
        )
    """)

    # Create indexes for user lookups
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_users_username
        ON users(username)
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_users_email
        ON users(email)
    """)

    logger.debug("Created users table and indexes (schema v7 part 1)")

    # Create user_api_keys table for encrypted API key storage
    conn.execute("""
        CREATE TABLE IF NOT EXISTS user_api_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            provider TEXT NOT NULL,
            encrypted_key TEXT NOT NULL,
            key_name TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            last_used_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, provider, key_name)
        )
    """)

    # Create indexes for API key lookups
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_api_keys_user
        ON user_api_keys(user_id)
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider
        ON user_api_keys(provider)
    """)

    logger.debug("Created user_api_keys table and indexes (schema v7 part 2)")

    # Create refresh_tokens table for JWT refresh token management
    conn.execute("""
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token_hash TEXT UNIQUE NOT NULL,
            expires_at TEXT NOT NULL,
            created_at TEXT NOT NULL,
            revoked_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    # Create indexes for token lookups
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user
        ON refresh_tokens(user_id)
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires
        ON refresh_tokens(expires_at)
    """)

    logger.debug("Created refresh_tokens table and indexes (schema v7 part 3)")


def _migrate_to_v8(conn: sqlite3.Connection) -> None:
    """
    Migrate database schema to version 8.

    Adds user-specific configuration tables:
    - user_brands: User's owned brands and competitors
    - user_intents: User's saved search queries/intents

    This allows each user to have their own personalized dashboard configuration
    persisted in the database.

    Args:
        conn: Active SQLite database connection in transaction
    """
    # Create user_brands table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS user_brands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            brand_name TEXT NOT NULL,
            is_mine INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, brand_name)
        )
    """)

    # Create indexes for brand lookups
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_brands_user
        ON user_brands(user_id)
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_brands_mine
        ON user_brands(is_mine)
    """)

    # Create user_intents table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS user_intents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            intent_alias TEXT NOT NULL,
            prompt TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, intent_alias)
        )
    """)

    # Create indexes for intent lookups
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_intents_user
        ON user_intents(user_id)
    """)

    logger.debug("Created user_brands and user_intents tables (schema v8)")


def _migrate_to_v9(conn: sqlite3.Connection) -> None:
    """
    Migrate database schema to version 9.

    Adds user isolation to runs:
    - Adds user_id column to runs table (nullable for backward compatibility)
    - Creates index on user_id

    Args:
        conn: Active SQLite database connection in transaction
    """
    # Add user_id column to runs table
    conn.execute("ALTER TABLE runs ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE")

    # Create index for user filtering
    conn.execute("CREATE INDEX IF NOT EXISTS idx_runs_user ON runs(user_id)")

    logger.debug("Added user_id to runs table (schema v9)")


def _migrate_to_v10(conn: sqlite3.Connection) -> None:
    """
    Migrate database schema to version 10.

    Adds user_settings table to store user preferences.

    Args:
        conn: Active SQLite database connection in transaction
    """
    conn.execute("""
        CREATE TABLE IF NOT EXISTS user_settings (
            user_id INTEGER PRIMARY KEY,
            settings_json TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    logger.debug("Created user_settings table (schema v10)")


# ============================================================================
# Database Operations (CRUD)
# ============================================================================


def insert_run(
    conn: sqlite3.Connection,
    run_id: str,
    timestamp_utc: str,
    total_intents: int,
    total_models: int,
    user_id: int | None = None,
) -> None:
    """
    Insert a new run record into the runs table.

    Records the start of a CLI execution with metadata about the planned work
    (number of intents and models to query). The total_cost_usd field is
    initialized to 0.0 and updated later via update_run_cost().

    This function is idempotent - if a run with the same run_id already exists,
    the insert is skipped (due to PRIMARY KEY constraint).

    Args:
        conn: Active SQLite database connection
        run_id: Unique run identifier (usually timestamp-based)
        timestamp_utc: ISO 8601 timestamp with 'Z' suffix (e.g., "2025-11-02T08:00:00Z")
        total_intents: Number of buyer-intent queries in this run
        total_models: Number of LLM models being queried per intent
        user_id: Optional user ID for multi-user isolation

    Raises:
        sqlite3.Error: If database operation fails

    Example:
        >>> with sqlite3.connect("watcher.db") as conn:
        ...     insert_run(
        ...         conn,
        ...         run_id="2025-11-02T08-00-00Z",
        ...         timestamp_utc="2025-11-02T08:00:00Z",
        ...         total_intents=3,
        ...         total_models=2,
        ...         user_id=1
        ...     )
        ...     conn.commit()

    Security:
        Uses parameterized query to prevent SQL injection.

    Note:
        Always call conn.commit() after insert to persist changes.
        Uses INSERT OR IGNORE to make operation idempotent.
    """
    # Validate required string parameters are not empty or whitespace
    if not run_id or run_id.isspace():
        raise ValueError("run_id cannot be empty or whitespace")
    if not timestamp_utc or timestamp_utc.isspace():
        raise ValueError("timestamp_utc cannot be empty or whitespace")
    if total_intents < 0:
        raise ValueError("total_intents cannot be negative")
    if total_models < 0:
        raise ValueError("total_models cannot be negative")

    conn.execute(
        """
        INSERT OR IGNORE INTO runs (
            run_id,
            timestamp_utc,
            total_intents,
            total_models,
            total_cost_usd,
            user_id
        ) VALUES (?, ?, ?, ?, 0.0, ?)
        """,
        (run_id, timestamp_utc, total_intents, total_models, user_id),
    )
    logger.debug(
        f"Inserted run {run_id} with {total_intents} intents, {total_models} models (user_id={user_id})"
    )


def insert_answer_raw(
    conn: sqlite3.Connection,
    run_id: str,
    intent_id: str,
    model_provider: str,
    model_name: str,
    timestamp_utc: str,
    prompt: str,
    answer_text: str,
    usage_meta_json: str | None = None,
    estimated_cost_usd: float | None = None,
    web_search_count: int = 0,
    web_search_results_json: str | None = None,
    runner_type: str = "api",
    runner_name: str | None = None,
    screenshot_path: str | None = None,
    html_snapshot_path: str | None = None,
    session_id: str | None = None,
) -> None:
    """
    Insert a raw LLM answer into the answers_raw table.

    Stores the complete LLM response with metadata for historical tracking.
    The answer_length is computed automatically from answer_text.

    This function is idempotent - if an answer for the same (run_id, intent_id,
    model_provider, model_name) already exists, the insert is skipped (due to
    UNIQUE constraint).

    Args:
        conn: Active SQLite database connection
        run_id: Run identifier (foreign key to runs.run_id)
        intent_id: Intent query identifier from config
        model_provider: LLM provider (e.g., "openai", "anthropic")
        model_name: Model identifier (e.g., "gpt-4o-mini")
        timestamp_utc: ISO 8601 timestamp when answer was generated
        prompt: Full prompt sent to LLM
        answer_text: Raw LLM response text
        usage_meta_json: Optional JSON-encoded usage metadata (tokens, etc.)
        estimated_cost_usd: Optional estimated cost in USD
        web_search_count: Number of web searches performed (default 0)
        web_search_results_json: Optional JSON-encoded web search results
        runner_type: Runner type ("api", "browser", or "custom", default "api")
        runner_name: Optional human-readable runner name (e.g., "steel-chatgpt")
        screenshot_path: Optional path to screenshot file (browser runners only)
        html_snapshot_path: Optional path to HTML snapshot file (browser runners only)
        session_id: Optional browser session ID (browser runners only)

    Raises:
        sqlite3.Error: If database operation fails

    Example:
        >>> import json
        >>> usage = {"prompt_tokens": 100, "completion_tokens": 500}
        >>> # API runner example:
        >>> insert_answer_raw(
        ...     conn,
        ...     run_id="2025-11-02T08-00-00Z",
        ...     intent_id="email-warmup",
        ...     model_provider="openai",
        ...     model_name="gpt-4o-mini",
        ...     timestamp_utc="2025-11-02T08:00:05Z",
        ...     prompt="What are the best email warmup tools?",
        ...     answer_text="Here are top email warmup tools: ...",
        ...     usage_meta_json=json.dumps(usage),
        ...     estimated_cost_usd=0.0012,
        ...     runner_type="api",
        ...     runner_name="openai-gpt-4o-mini"
        ... )
        >>> # Browser runner example:
        >>> insert_answer_raw(
        ...     conn,
        ...     run_id="2025-11-02T08-00-00Z",
        ...     intent_id="email-warmup",
        ...     model_provider="chatgpt-web",
        ...     model_name="chatgpt-unknown",
        ...     timestamp_utc="2025-11-02T08:00:05Z",
        ...     prompt="What are the best email warmup tools?",
        ...     answer_text="Based on web search: ...",
        ...     runner_type="browser",
        ...     runner_name="steel-chatgpt",
        ...     screenshot_path="./output/2025-11-02T08-00-00Z/screenshot_chatgpt.png",
        ...     html_snapshot_path="./output/2025-11-02T08-00-00Z/html_chatgpt.html",
        ...     session_id="session-abc123"
        ... )
        >>> conn.commit()

    Security:
        Uses parameterized query to prevent SQL injection.
        Does NOT log answer_text (may contain sensitive info).

    Note:
        Always call conn.commit() after insert to persist changes.
        Uses INSERT OR IGNORE to make operation idempotent.
    """
    # Validate required string parameters are not empty or whitespace
    if not run_id or run_id.isspace():
        raise ValueError("run_id cannot be empty or whitespace")
    if not intent_id or intent_id.isspace():
        raise ValueError("intent_id cannot be empty or whitespace")
    if not model_provider or model_provider.isspace():
        raise ValueError("model_provider cannot be empty or whitespace")
    if not model_name or model_name.isspace():
        raise ValueError("model_name cannot be empty or whitespace")
    if not timestamp_utc or timestamp_utc.isspace():
        raise ValueError("timestamp_utc cannot be empty or whitespace")
    if not prompt or prompt.isspace():
        raise ValueError("prompt cannot be empty or whitespace")
    if not answer_text or answer_text.isspace():
        raise ValueError("answer_text cannot be empty or whitespace")

    answer_length = len(answer_text)

    conn.execute(
        """
        INSERT OR IGNORE INTO answers_raw (
            run_id,
            intent_id,
            model_provider,
            model_name,
            timestamp_utc,
            prompt,
            answer_text,
            answer_length,
            usage_meta_json,
            estimated_cost_usd,
            web_search_count,
            web_search_results_json,
            runner_type,
            runner_name,
            screenshot_path,
            html_snapshot_path,
            session_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            run_id,
            intent_id,
            model_provider,
            model_name,
            timestamp_utc,
            prompt,
            answer_text,
            answer_length,
            usage_meta_json,
            estimated_cost_usd,
            web_search_count,
            web_search_results_json,
            runner_type,
            runner_name,
            screenshot_path,
            html_snapshot_path,
            session_id,
        ),
    )

    # Log with web search info if applicable
    if web_search_count > 0:
        logger.debug(
            f"Inserted answer for intent={intent_id}, model={model_provider}/{model_name}, "
            f"length={answer_length} chars, web_searches={web_search_count}"
        )
    else:
        logger.debug(
            f"Inserted answer for intent={intent_id}, model={model_provider}/{model_name}, "
            f"length={answer_length} chars"
        )


def insert_mention(
    conn: sqlite3.Connection,
    run_id: str,
    timestamp_utc: str,
    intent_id: str,
    model_provider: str,
    model_name: str,
    brand_name: str,
    normalized_name: str,
    is_mine: bool,
    first_position: int | None = None,
    rank_position: int | None = None,
    match_type: str = "exact",
    sentiment: str | None = None,
    mention_context: str | None = None,
) -> None:
    """
    Insert a brand mention into the mentions table.

    Records a single brand mention found in an LLM answer. This is the "exploded"
    view of answers - each brand gets its own row for analytics queries.

    This function is idempotent - if a mention for the same (run_id, intent_id,
    model_provider, model_name, normalized_name) already exists, the insert is
    skipped (due to UNIQUE constraint).

    Args:
        conn: Active SQLite database connection
        run_id: Run identifier (foreign key to runs.run_id)
        timestamp_utc: ISO 8601 timestamp when mention was extracted
        intent_id: Intent query identifier from config
        model_provider: LLM provider (e.g., "openai", "anthropic")
        model_name: Model identifier (e.g., "gpt-4o-mini")
        brand_name: Original brand name/alias as found in text
        normalized_name: Normalized brand name for grouping (lowercase)
        is_mine: True if this is our brand, False if competitor
        first_position: Character position of first occurrence in text (0-indexed)
        rank_position: Rank/position in ordered list (1-indexed, None if not ranked)
        match_type: Type of match ("exact", "fuzzy", "llm_assisted")
        sentiment: Sentiment of mention ("positive", "neutral", "negative", None)
        mention_context: Context classification ("primary_recommendation",
            "alternative_listing", "competitor_negative", "competitor_neutral",
            "passing_reference", None)

    Raises:
        sqlite3.Error: If database operation fails

    Example:
        >>> insert_mention(
        ...     conn,
        ...     run_id="2025-11-02T08-00-00Z",
        ...     timestamp_utc="2025-11-02T08:00:05Z",
        ...     intent_id="email-warmup",
        ...     model_provider="openai",
        ...     model_name="gpt-4o-mini",
        ...     brand_name="HubSpot",
        ...     normalized_name="hubspot",
        ...     is_mine=False,
        ...     first_position=42,
        ...     rank_position=1,
        ...     match_type="exact"
        ... )
        >>> conn.commit()

    Security:
        Uses parameterized query to prevent SQL injection.

    Note:
        Always call conn.commit() after insert to persist changes.
        Uses INSERT OR IGNORE to make operation idempotent.
        is_mine is stored as INTEGER (0/1) per SQLite convention.
    """
    # Validate required string parameters are not empty or whitespace
    if not run_id or run_id.isspace():
        raise ValueError("run_id cannot be empty or whitespace")
    if not timestamp_utc or timestamp_utc.isspace():
        raise ValueError("timestamp_utc cannot be empty or whitespace")
    if not intent_id or intent_id.isspace():
        raise ValueError("intent_id cannot be empty or whitespace")
    if not model_provider or model_provider.isspace():
        raise ValueError("model_provider cannot be empty or whitespace")
    if not model_name or model_name.isspace():
        raise ValueError("model_name cannot be empty or whitespace")
    if not brand_name or brand_name.isspace():
        raise ValueError("brand_name cannot be empty or whitespace")
    if not normalized_name or normalized_name.isspace():
        raise ValueError("normalized_name cannot be empty or whitespace")
    if not match_type or match_type.isspace():
        raise ValueError("match_type cannot be empty or whitespace")

    is_mine_int = 1 if is_mine else 0

    conn.execute(
        """
        INSERT OR IGNORE INTO mentions (
            run_id,
            timestamp_utc,
            intent_id,
            model_provider,
            model_name,
            brand_name,
            normalized_name,
            is_mine,
            first_position,
            rank_position,
            match_type,
            sentiment,
            mention_context
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            run_id,
            timestamp_utc,
            intent_id,
            model_provider,
            model_name,
            brand_name,
            normalized_name,
            is_mine_int,
            first_position,
            rank_position,
            match_type,
            sentiment,
            mention_context,
        ),
    )
    logger.debug(
        f"Inserted mention: {normalized_name} (is_mine={is_mine}, rank={rank_position})"
    )


def insert_intent_classification(
    conn: sqlite3.Connection,
    run_id: str,
    intent_id: str,
    intent_type: str,
    buyer_stage: str,
    urgency_signal: str,
    classification_confidence: float,
    timestamp_utc: str,
    reasoning: str | None = None,
    extraction_cost_usd: float = 0.0,
) -> None:
    """
    Insert an intent classification into the intent_classifications table.

    Records the classification result for a user query, including intent type,
    buyer journey stage, and urgency signals. This enables filtering and
    prioritization of high-value mentions.

    This function is idempotent - if a classification for the same (run_id, intent_id)
    already exists, the insert is skipped (due to UNIQUE constraint).

    Args:
        conn: Active SQLite database connection
        run_id: Run identifier (foreign key to runs.run_id)
        intent_id: Intent query identifier from config
        intent_type: Type of intent ("transactional", "informational",
            "navigational", "commercial_investigation")
        buyer_stage: Buyer journey stage ("awareness", "consideration", "decision")
        urgency_signal: Urgency level ("high", "medium", "low")
        classification_confidence: Confidence score (0.0-1.0)
        timestamp_utc: ISO 8601 timestamp when classification was performed
        reasoning: Optional explanation of classification decision
        extraction_cost_usd: Cost of classification call in USD

    Raises:
        sqlite3.Error: If database operation fails

    Example:
        >>> insert_intent_classification(
        ...     conn,
        ...     run_id="2025-11-02T08-00-00Z",
        ...     intent_id="email-warmup",
        ...     intent_type="transactional",
        ...     buyer_stage="decision",
        ...     urgency_signal="high",
        ...     classification_confidence=0.92,
        ...     timestamp_utc="2025-11-02T08:00:01Z",
        ...     reasoning="Query contains 'buy now' and 'best' indicators",
        ...     extraction_cost_usd=0.00012
        ... )
        >>> conn.commit()

    Security:
        Uses parameterized query to prevent SQL injection.

    Note:
        Always call conn.commit() after insert to persist changes.
        Uses INSERT OR IGNORE to make operation idempotent.
    """
    conn.execute(
        """
        INSERT OR IGNORE INTO intent_classifications (
            run_id,
            intent_id,
            intent_type,
            buyer_stage,
            urgency_signal,
            classification_confidence,
            reasoning,
            extraction_cost_usd,
            timestamp_utc
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            run_id,
            intent_id,
            intent_type,
            buyer_stage,
            urgency_signal,
            classification_confidence,
            reasoning,
            extraction_cost_usd,
            timestamp_utc,
        ),
    )
    logger.debug(
        f"Inserted intent classification: {intent_id} -> {intent_type}/{buyer_stage}/{urgency_signal} "
        f"(confidence={classification_confidence:.2f})"
    )


def lookup_intent_classification_cache(
    conn: sqlite3.Connection, query_hash: str
) -> dict | None:
    """
    Look up cached intent classification result by query hash.

    Checks the intent_classification_cache table for a previously classified
    identical query. If found, updates last_accessed_at timestamp to track
    cache usage (useful for LRU eviction).

    Args:
        conn: Active SQLite database connection
        query_hash: SHA256 hash of normalized query text

    Returns:
        dict with classification data if cache hit, None if cache miss
        Cache hit dict contains:
        - intent_type: str
        - buyer_stage: str
        - urgency_signal: str
        - classification_confidence: float
        - reasoning: str | None
        - extraction_cost_usd: float
        - query_text: str (for validation)

    Example:
        >>> query_hash = compute_query_hash("What are the best email warmup tools?")
        >>> cached = lookup_intent_classification_cache(conn, query_hash)
        >>> if cached:
        ...     print(f"Cache hit: {cached['intent_type']}")
        ... else:
        ...     print("Cache miss - need to classify")

    Note:
        Updates last_accessed_at timestamp on cache hit to track usage.
        This enables LRU-based cache eviction strategies.
    """
    cursor = conn.execute(
        """
        SELECT
            query_text,
            intent_type,
            buyer_stage,
            urgency_signal,
            classification_confidence,
            reasoning,
            extraction_cost_usd
        FROM intent_classification_cache
        WHERE query_hash = ?
        """,
        (query_hash,),
    )

    row = cursor.fetchone()

    if row is None:
        return None

    # Update last_accessed_at timestamp for LRU tracking
    conn.execute(
        """
        UPDATE intent_classification_cache
        SET last_accessed_at = ?
        WHERE query_hash = ?
        """,
        (utc_timestamp(), query_hash),
    )

    # Return cached result
    return {
        "query_text": row[0],
        "intent_type": row[1],
        "buyer_stage": row[2],
        "urgency_signal": row[3],
        "classification_confidence": row[4],
        "reasoning": row[5],
        "extraction_cost_usd": row[6],
    }


def store_intent_classification_cache(
    conn: sqlite3.Connection,
    query_hash: str,
    query_text: str,
    intent_type: str,
    buyer_stage: str,
    urgency_signal: str,
    classification_confidence: float,
    reasoning: str | None = None,
    extraction_cost_usd: float = 0.0,
) -> None:
    """
    Store intent classification result in cache for future lookups.

    Caches the classification result keyed by query hash to avoid redundant
    API calls for identical queries. Sets both cached_at and last_accessed_at
    to current timestamp.

    This function is idempotent - if the same query_hash already exists,
    the insert is skipped (due to PRIMARY KEY constraint on query_hash).

    Args:
        conn: Active SQLite database connection
        query_hash: SHA256 hash of normalized query text (unique key)
        query_text: Original query text for debugging/validation
        intent_type: Classified intent type
        buyer_stage: Classified buyer journey stage
        urgency_signal: Classified urgency level
        classification_confidence: Confidence score (0.0-1.0)
        reasoning: Optional classification explanation
        extraction_cost_usd: Original classification API cost

    Raises:
        sqlite3.Error: If database operation fails

    Example:
        >>> query_hash = compute_query_hash("What are the best email warmup tools?")
        >>> store_intent_classification_cache(
        ...     conn,
        ...     query_hash=query_hash,
        ...     query_text="What are the best email warmup tools?",
        ...     intent_type="transactional",
        ...     buyer_stage="decision",
        ...     urgency_signal="high",
        ...     classification_confidence=0.95,
        ...     reasoning="Query contains buying intent",
        ...     extraction_cost_usd=0.00011
        ... )
        >>> conn.commit()

    Security:
        Uses parameterized query to prevent SQL injection.

    Note:
        Always call conn.commit() after insert to persist changes.
        Uses INSERT OR IGNORE to make operation idempotent.
    """
    timestamp = utc_timestamp()

    conn.execute(
        """
        INSERT OR IGNORE INTO intent_classification_cache (
            query_hash,
            query_text,
            intent_type,
            buyer_stage,
            urgency_signal,
            classification_confidence,
            reasoning,
            extraction_cost_usd,
            cached_at,
            last_accessed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            query_hash,
            query_text,
            intent_type,
            buyer_stage,
            urgency_signal,
            classification_confidence,
            reasoning,
            extraction_cost_usd,
            timestamp,
            timestamp,
        ),
    )

    logger.debug(
        f"Cached intent classification for query hash {query_hash[:16]}...: "
        f"{intent_type}/{buyer_stage}/{urgency_signal}"
    )


def insert_operation(
    conn: sqlite3.Connection,
    run_id: str,
    intent_id: str,
    model_provider: str,
    model_name: str,
    operation_id: str,
    operation_description: str | None,
    operation_prompt: str,
    result_text: str,
    tokens_used_input: int,
    tokens_used_output: int,
    cost_usd: float,
    timestamp_utc: str,
    depends_on: list[str],
    execution_order: int,
    skipped: bool = False,
    error: str | None = None,
) -> None:
    """
    Insert an operation result into the operations table.

    Stores the result of a custom post-intent operation with all metadata
    for historical tracking and cost analysis.

    This function is idempotent - if an operation for the same (run_id, intent_id,
    model_provider, model_name, operation_id) already exists, the insert is skipped
    (due to UNIQUE constraint).

    Args:
        conn: Active SQLite database connection
        run_id: Run identifier (foreign key to runs.run_id)
        intent_id: Intent query identifier from config
        model_provider: LLM provider used for operation (e.g., "openai")
        model_name: Model identifier used (e.g., "gpt-4o-mini")
        operation_id: Operation identifier from config
        operation_description: Optional human-readable description
        operation_prompt: Rendered prompt (with variables substituted)
        result_text: LLM output for this operation
        tokens_used_input: Input tokens consumed
        tokens_used_output: Output tokens generated
        cost_usd: Estimated cost in USD
        timestamp_utc: ISO 8601 timestamp when operation executed
        depends_on: List of operation IDs this depends on
        execution_order: Order in which operation was executed
        skipped: Whether operation was skipped (condition not met)
        error: Error message if operation failed

    Raises:
        sqlite3.Error: If database operation fails

    Example:
        >>> insert_operation(
        ...     conn,
        ...     run_id="2025-11-05T10-00-00Z",
        ...     intent_id="email-warmup",
        ...     model_provider="openai",
        ...     model_name="gpt-4o-mini",
        ...     operation_id="content-gaps",
        ...     operation_description="Identify content opportunities",
        ...     operation_prompt="Analyze how to improve ranking...",
        ...     result_text="Create blog posts about...",
        ...     tokens_used_input=150,
        ...     tokens_used_output=200,
        ...     cost_usd=0.0005,
        ...     timestamp_utc="2025-11-05T10:00:15Z",
        ...     depends_on=[],
        ...     execution_order=0,
        ...     skipped=False
        ... )
        >>> conn.commit()

    Security:
        Uses parameterized query to prevent SQL injection.
        Does NOT log result_text (may contain sensitive info).

    Note:
        Always call conn.commit() after insert to persist changes.
        Uses INSERT OR IGNORE to make operation idempotent.
    """
    # Validate required string parameters are not empty or whitespace
    if not run_id or run_id.isspace():
        raise ValueError("run_id cannot be empty or whitespace")
    if not intent_id or intent_id.isspace():
        raise ValueError("intent_id cannot be empty or whitespace")
    if not model_provider or model_provider.isspace():
        raise ValueError("model_provider cannot be empty or whitespace")
    if not model_name or model_name.isspace():
        raise ValueError("model_name cannot be empty or whitespace")
    if not operation_id or operation_id.isspace():
        raise ValueError("operation_id cannot be empty or whitespace")
    if not operation_prompt or operation_prompt.isspace():
        raise ValueError("operation_prompt cannot be empty or whitespace")
    if not result_text or result_text.isspace():
        raise ValueError("result_text cannot be empty or whitespace")
    if not timestamp_utc or timestamp_utc.isspace():
        raise ValueError("timestamp_utc cannot be empty or whitespace")

    import json

    # Convert depends_on list to JSON
    depends_on_json = json.dumps(depends_on) if depends_on else None

    # Convert boolean to integer for SQLite
    skipped_int = 1 if skipped else 0

    conn.execute(
        """
        INSERT OR IGNORE INTO operations (
            run_id,
            intent_id,
            model_provider,
            model_name,
            operation_id,
            operation_description,
            operation_prompt,
            result_text,
            tokens_used_input,
            tokens_used_output,
            cost_usd,
            timestamp_utc,
            depends_on,
            execution_order,
            skipped,
            error
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            run_id,
            intent_id,
            model_provider,
            model_name,
            operation_id,
            operation_description,
            operation_prompt,
            result_text,
            tokens_used_input,
            tokens_used_output,
            cost_usd,
            timestamp_utc,
            depends_on_json,
            execution_order,
            skipped_int,
            error,
        ),
    )

    if skipped:
        logger.debug(f"Inserted operation: {operation_id} (skipped)")
    elif error:
        logger.debug(f"Inserted operation: {operation_id} (error: {error})")
    else:
        logger.debug(
            f"Inserted operation: {operation_id} "
            f"(tokens={tokens_used_input + tokens_used_output}, cost=${cost_usd:.6f})"
        )


def update_run_cost(
    conn: sqlite3.Connection, run_id: str, total_cost_usd: float
) -> None:
    """
    Update the total cost for a run in the runs table.

    Updates the total_cost_usd field after all LLM queries have completed
    and individual costs have been calculated. This is typically called at
    the end of a CLI execution.

    Args:
        conn: Active SQLite database connection
        run_id: Run identifier to update
        total_cost_usd: Total estimated cost in USD across all queries

    Raises:
        sqlite3.Error: If database operation fails
        ValueError: If run_id does not exist (rowcount == 0)

    Example:
        >>> update_run_cost(conn, "2025-11-02T08-00-00Z", 0.0234)
        >>> conn.commit()

    Security:
        Uses parameterized query to prevent SQL injection.

    Note:
        Always call conn.commit() after update to persist changes.
        Raises ValueError if run_id doesn't exist (catches logic errors early).
    """
    cursor = conn.execute(
        "UPDATE runs SET total_cost_usd = ? WHERE run_id = ?",
        (total_cost_usd, run_id),
    )

    if cursor.rowcount == 0:
        raise ValueError(
            f"Cannot update cost for run_id={run_id}: run does not exist. "
            f"Call insert_run() first."
        )

    logger.debug(f"Updated run {run_id} total cost: ${total_cost_usd:.6f}")


def get_run_summary(conn: sqlite3.Connection, run_id: str) -> dict | None:
    """
    Retrieve summary information for a specific run.

    Fetches the run record with all metadata. Useful for reporting and
    debugging.

    Args:
        conn: Active SQLite database connection
        run_id: Run identifier to retrieve

    Returns:
        dict with keys: run_id, timestamp_utc, total_intents, total_models, total_cost_usd
        None if run_id does not exist

    Example:
        >>> summary = get_run_summary(conn, "2025-11-02T08-00-00Z")
        >>> print(summary)
        {
            "run_id": "2025-11-02T08-00-00Z",
            "timestamp_utc": "2025-11-02T08:00:00Z",
            "total_intents": 3,
            "total_models": 2,
            "total_cost_usd": 0.0234
        }

    Security:
        Uses parameterized query to prevent SQL injection.

    Note:
        Returns None if run doesn't exist (not an error condition).
    """
    cursor = conn.execute(
        """
        SELECT run_id, timestamp_utc, total_intents, total_models, total_cost_usd
        FROM runs
        WHERE run_id = ?
        """,
        (run_id,),
    )

    row = cursor.fetchone()
    if row is None:
        return None

    return {
        "run_id": row[0],
        "timestamp_utc": row[1],
        "total_intents": row[2],
        "total_models": row[3],
        "total_cost_usd": row[4],
    }


def insert_run_insight(
    conn: sqlite3.Connection,
    run_id: str,
    insight_text: str,
    model_provider: str,
    model_name: str,
    input_tokens: int,
    output_tokens: int,
    cost_usd: float,
    timestamp_utc: str,
) -> None:
    """
    Insert a run insight record.
    """
    conn.execute(
        """
        INSERT OR REPLACE INTO run_insights (
            run_id,
            insight_text,
            model_provider,
            model_name,
            input_tokens,
            output_tokens,
            cost_usd,
            timestamp_utc
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            run_id,
            insight_text,
            model_provider,
            model_name,
            input_tokens,
            output_tokens,
            cost_usd,
            timestamp_utc,
        ),
    )
    logger.debug(f"Inserted insight for run {run_id}")


def get_run_insight(conn: sqlite3.Connection, run_id: str) -> dict | None:
    """
    Retrieve the insight for a run.
    """
    cursor = conn.execute(
        """
        SELECT
            insight_text,
            model_provider,
            model_name,
            cost_usd,
            timestamp_utc
        FROM run_insights
        WHERE run_id = ?
        """,
        (run_id,),
    )
    row = cursor.fetchone()
    if row is None:
        return None
        
    return {
        "insight_text": row[0],
        "model_provider": row[1],
        "model_name": row[2],
        "cost_usd": row[3],
        "timestamp_utc": row[4],
    }


# ============================================================================
# User Authentication CRUD Operations
# ============================================================================


def create_user(
    conn: sqlite3.Connection,
    username: str,
    email: str,
    password_hash: str,
) -> int:
    """
    Create a new user in the database.

    Args:
        conn: Active SQLite database connection
        username: Unique username (will be lowercased)
        email: Unique email address
        password_hash: Bcrypt hash of the password

    Returns:
        The new user's ID

    Raises:
        sqlite3.IntegrityError: If username or email already exists
    """
    timestamp = utc_timestamp()
    cursor = conn.execute(
        """
        INSERT INTO users (username, email, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (username.lower(), email.lower(), password_hash, timestamp, timestamp),
    )
    logger.debug(f"Created user: {username}")
    return cursor.lastrowid


def get_user_by_username(conn: sqlite3.Connection, username: str) -> dict | None:
    """
    Get a user by username.

    Args:
        conn: Active SQLite database connection
        username: Username to look up

    Returns:
        User dict with id, username, email, password_hash, etc. or None if not found
    """
    cursor = conn.execute(
        """
        SELECT id, username, email, password_hash, created_at, updated_at,
               is_active, last_login_at
        FROM users
        WHERE username = ?
        """,
        (username.lower(),),
    )
    row = cursor.fetchone()
    if row is None:
        return None
    return {
        "id": row[0],
        "username": row[1],
        "email": row[2],
        "password_hash": row[3],
        "created_at": row[4],
        "updated_at": row[5],
        "is_active": bool(row[6]),
        "last_login_at": row[7],
    }


def get_user_by_email(conn: sqlite3.Connection, email: str) -> dict | None:
    """
    Get a user by email.

    Args:
        conn: Active SQLite database connection
        email: Email to look up

    Returns:
        User dict with id, username, email, password_hash, etc. or None if not found
    """
    cursor = conn.execute(
        """
        SELECT id, username, email, password_hash, created_at, updated_at,
               is_active, last_login_at
        FROM users
        WHERE email = ?
        """,
        (email.lower(),),
    )
    row = cursor.fetchone()
    if row is None:
        return None
    return {
        "id": row[0],
        "username": row[1],
        "email": row[2],
        "password_hash": row[3],
        "created_at": row[4],
        "updated_at": row[5],
        "is_active": bool(row[6]),
        "last_login_at": row[7],
    }


def get_user_by_id(conn: sqlite3.Connection, user_id: int) -> dict | None:
    """
    Get a user by ID.

    Args:
        conn: Active SQLite database connection
        user_id: User ID to look up

    Returns:
        User dict with id, username, email, etc. or None if not found
    """
    cursor = conn.execute(
        """
        SELECT id, username, email, password_hash, created_at, updated_at,
               is_active, last_login_at
        FROM users
        WHERE id = ?
        """,
        (user_id,),
    )
    row = cursor.fetchone()
    if row is None:
        return None
    return {
        "id": row[0],
        "username": row[1],
        "email": row[2],
        "password_hash": row[3],
        "created_at": row[4],
        "updated_at": row[5],
        "is_active": bool(row[6]),
        "last_login_at": row[7],
    }


def update_user_last_login(conn: sqlite3.Connection, user_id: int) -> None:
    """
    Update the last_login_at timestamp for a user.

    Args:
        conn: Active SQLite database connection
        user_id: User ID to update
    """
    timestamp = utc_timestamp()
    conn.execute(
        "UPDATE users SET last_login_at = ? WHERE id = ?",
        (timestamp, user_id),
    )


def update_user(
    conn: sqlite3.Connection,
    user_id: int,
    username: str | None = None,
    email: str | None = None,
) -> bool:
    """
    Update a user profile.

    Args:
        conn: Active SQLite database connection
        user_id: User ID
        username: New username (optional)
        email: New email (optional)

    Returns:
        True if updated, False if user not found
    """
    updates = ["updated_at = ?"]
    params = [utc_timestamp()]

    if username is not None:
        updates.append("username = ?")
        params.append(username.lower())
    if email is not None:
        updates.append("email = ?")
        params.append(email.lower())

    params.append(user_id)

    cursor = conn.execute(
        f"UPDATE users SET {', '.join(updates)} WHERE id = ?",
        params
    )
    return cursor.rowcount > 0


# ============================================================================
# User API Key CRUD Operations
# ============================================================================


def create_user_api_key(
    conn: sqlite3.Connection,
    user_id: int,
    provider: str,
    encrypted_key: str,
    key_name: str | None = None,
) -> int:
    """
    Store an encrypted API key for a user.

    Args:
        conn: Active SQLite database connection
        user_id: User ID who owns this key
        provider: LLM provider name (e.g., "openai", "google")
        encrypted_key: Fernet-encrypted API key
        key_name: Optional friendly name for this key

    Returns:
        The new API key record ID

    Raises:
        sqlite3.IntegrityError: If user_id + provider + key_name combination exists
    """
    timestamp = utc_timestamp()
    cursor = conn.execute(
        """
        INSERT INTO user_api_keys (user_id, provider, encrypted_key, key_name,
                                   created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (user_id, provider.lower(), encrypted_key, key_name, timestamp, timestamp),
    )
    logger.debug(f"Created API key for user {user_id}, provider {provider}")
    return cursor.lastrowid


def get_user_api_keys(conn: sqlite3.Connection, user_id: int) -> list[dict]:
    """
    Get all API keys for a user (metadata only, not the actual keys).

    Args:
        conn: Active SQLite database connection
        user_id: User ID to look up

    Returns:
        List of API key metadata dicts (id, provider, key_name, timestamps)
    """
    cursor = conn.execute(
        """
        SELECT id, provider, key_name, created_at, updated_at, last_used_at
        FROM user_api_keys
        WHERE user_id = ?
        ORDER BY provider, key_name
        """,
        (user_id,),
    )
    return [
        {
            "id": row[0],
            "provider": row[1],
            "key_name": row[2],
            "created_at": row[3],
            "updated_at": row[4],
            "last_used_at": row[5],
        }
        for row in cursor.fetchall()
    ]


def get_user_api_key_by_provider(
    conn: sqlite3.Connection, user_id: int, provider: str, key_name: str | None = None
) -> dict | None:
    """
    Get a specific API key by user and provider (includes encrypted key).

    Args:
        conn: Active SQLite database connection
        user_id: User ID
        provider: Provider name
        key_name: Optional key name (defaults to None for default key)

    Returns:
        API key dict including encrypted_key, or None if not found
    """
    if key_name is None:
        cursor = conn.execute(
            """
            SELECT id, provider, encrypted_key, key_name, created_at, updated_at, last_used_at
            FROM user_api_keys
            WHERE user_id = ? AND provider = ? AND key_name IS NULL
            """,
            (user_id, provider.lower()),
        )
    else:
        cursor = conn.execute(
            """
            SELECT id, provider, encrypted_key, key_name, created_at, updated_at, last_used_at
            FROM user_api_keys
            WHERE user_id = ? AND provider = ? AND key_name = ?
            """,
            (user_id, provider.lower(), key_name),
        )
    row = cursor.fetchone()
    if row is None:
        return None
    return {
        "id": row[0],
        "provider": row[1],
        "encrypted_key": row[2],
        "key_name": row[3],
        "created_at": row[4],
        "updated_at": row[5],
        "last_used_at": row[6],
    }


def get_user_api_key_by_id(conn: sqlite3.Connection, key_id: int, user_id: int) -> dict | None:
    """
    Get a specific API key by ID and user (includes encrypted key).

    Args:
        conn: Active SQLite database connection
        key_id: API key ID
        user_id: User ID (for ownership verification)

    Returns:
        API key dict including encrypted_key, or None if not found
    """
    cursor = conn.execute(
        """
        SELECT id, provider, encrypted_key, key_name, created_at, updated_at, last_used_at
        FROM user_api_keys
        WHERE id = ? AND user_id = ?
        """,
        (key_id, user_id),
    )
    row = cursor.fetchone()
    if row is None:
        return None
    return {
        "id": row[0],
        "provider": row[1],
        "encrypted_key": row[2],
        "key_name": row[3],
        "created_at": row[4],
        "updated_at": row[5],
        "last_used_at": row[6],
    }


def update_user_api_key(
    conn: sqlite3.Connection,
    key_id: int,
    user_id: int,
    encrypted_key: str | None = None,
    key_name: str | None = None,
) -> bool:
    """
    Update an API key.

    Args:
        conn: Active SQLite database connection
        key_id: API key record ID
        user_id: User ID (for ownership verification)
        encrypted_key: New encrypted key (optional)
        key_name: New key name (optional)

    Returns:
        True if updated, False if not found or not owned by user
    """
    timestamp = utc_timestamp()

    # Build update query based on what's being updated
    updates = ["updated_at = ?"]
    params = [timestamp]

    if encrypted_key is not None:
        updates.append("encrypted_key = ?")
        params.append(encrypted_key)
    if key_name is not None:
        updates.append("key_name = ?")
        params.append(key_name)

    params.extend([key_id, user_id])

    cursor = conn.execute(
        f"""
        UPDATE user_api_keys
        SET {", ".join(updates)}
        WHERE id = ? AND user_id = ?
        """,
        params,
    )
    return cursor.rowcount > 0


def delete_user_api_key(
    conn: sqlite3.Connection, key_id: int, user_id: int
) -> bool:
    """
    Delete an API key.

    Args:
        conn: Active SQLite database connection
        key_id: API key record ID
        user_id: User ID (for ownership verification)

    Returns:
        True if deleted, False if not found or not owned by user
    """
    cursor = conn.execute(
        "DELETE FROM user_api_keys WHERE id = ? AND user_id = ?",
        (key_id, user_id),
    )
    return cursor.rowcount > 0


def update_api_key_last_used(conn: sqlite3.Connection, key_id: int) -> None:
    """
    Update the last_used_at timestamp for an API key.

    Args:
        conn: Active SQLite database connection
        key_id: API key record ID
    """
    timestamp = utc_timestamp()
    conn.execute(
        "UPDATE user_api_keys SET last_used_at = ? WHERE id = ?",
        (timestamp, key_id),
    )


# ============================================================================
# Refresh Token CRUD Operations
# ============================================================================


def store_refresh_token(
    conn: sqlite3.Connection,
    user_id: int,
    token_hash: str,
    expires_at: str,
) -> int:
    """
    Store a refresh token hash.

    Args:
        conn: Active SQLite database connection
        user_id: User ID who owns this token
        token_hash: SHA256 hash of the refresh token
        expires_at: Expiration timestamp

    Returns:
        The new token record ID
    """
    timestamp = utc_timestamp()
    cursor = conn.execute(
        """
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (user_id, token_hash, expires_at, timestamp),
    )
    return cursor.lastrowid


def get_refresh_token(conn: sqlite3.Connection, token_hash: str) -> dict | None:
    """
    Get a refresh token by its hash.

    Args:
        conn: Active SQLite database connection
        token_hash: SHA256 hash of the token

    Returns:
        Token dict with user_id, expires_at, etc. or None if not found
    """
    cursor = conn.execute(
        """
        SELECT id, user_id, expires_at, created_at, revoked_at
        FROM refresh_tokens
        WHERE token_hash = ?
        """,
        (token_hash,),
    )
    row = cursor.fetchone()
    if row is None:
        return None
    return {
        "id": row[0],
        "user_id": row[1],
        "expires_at": row[2],
        "created_at": row[3],
        "revoked_at": row[4],
    }


def revoke_refresh_token(conn: sqlite3.Connection, token_hash: str) -> bool:
    """
    Revoke a refresh token.

    Args:
        conn: Active SQLite database connection
        token_hash: SHA256 hash of the token to revoke

    Returns:
        True if revoked, False if not found
    """
    timestamp = utc_timestamp()
    cursor = conn.execute(
        "UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL",
        (timestamp, token_hash),
    )
    return cursor.rowcount > 0


def revoke_all_user_refresh_tokens(conn: sqlite3.Connection, user_id: int) -> int:
    """
    Revoke all refresh tokens for a user (e.g., on password change).

    Args:
        conn: Active SQLite database connection
        user_id: User ID

    Returns:
        Number of tokens revoked
    """
    timestamp = utc_timestamp()
    cursor = conn.execute(
        "UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL",
        (timestamp, user_id),
    )
    return cursor.rowcount


def cleanup_expired_refresh_tokens(conn: sqlite3.Connection) -> int:
    """
    Delete expired refresh tokens (housekeeping).

    Args:
        conn: Active SQLite database connection

    Returns:
        Number of tokens deleted
    """
    timestamp = utc_timestamp()
    cursor = conn.execute(
        "DELETE FROM refresh_tokens WHERE expires_at < ?",
        (timestamp,),
    )
    return cursor.rowcount


# ============================================================================
# User Brands CRUD Operations
# ============================================================================


def create_user_brand(
    conn: sqlite3.Connection,
    user_id: int,
    brand_name: str,
    is_mine: bool,
) -> int:
    """
    Create a new user brand.

    Args:
        conn: Active SQLite database connection
        user_id: User ID who owns this brand
        brand_name: Name of the brand
        is_mine: True if it's the user's brand, False if competitor

    Returns:
        The new brand record ID

    Raises:
        sqlite3.IntegrityError: If brand already exists for user
    """
    timestamp = utc_timestamp()
    is_mine_int = 1 if is_mine else 0
    
    cursor = conn.execute(
        """
        INSERT INTO user_brands (user_id, brand_name, is_mine, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (user_id, brand_name, is_mine_int, timestamp, timestamp),
    )
    return cursor.lastrowid


def get_user_brands(conn: sqlite3.Connection, user_id: int) -> list[dict]:
    """
    Get all brands for a user.

    Args:
        conn: Active SQLite database connection
        user_id: User ID to look up

    Returns:
        List of brand dicts
    """
    cursor = conn.execute(
        """
        SELECT id, brand_name, is_mine, created_at, updated_at
        FROM user_brands
        WHERE user_id = ?
        ORDER BY is_mine DESC, brand_name ASC
        """,
        (user_id,),
    )
    return [
        {
            "id": row[0],
            "brand_name": row[1],
            "is_mine": bool(row[2]),
            "created_at": row[3],
            "updated_at": row[4],
        }
        for row in cursor.fetchall()
    ]


def delete_user_brand(
    conn: sqlite3.Connection, brand_id: int, user_id: int
) -> bool:
    """
    Delete a user brand.

    Args:
        conn: Active SQLite database connection
        brand_id: Brand record ID
        user_id: User ID (for ownership verification)

    Returns:
        True if deleted, False if not found or not owned by user
    """
    cursor = conn.execute(
        "DELETE FROM user_brands WHERE id = ? AND user_id = ?",
        (brand_id, user_id),
    )
    return cursor.rowcount > 0


# ============================================================================
# User Intents CRUD Operations
# ============================================================================


def create_user_intent(
    conn: sqlite3.Connection,
    user_id: int,
    intent_alias: str,
    prompt: str,
) -> int:
    """
    Create a new user intent.

    Args:
        conn: Active SQLite database connection
        user_id: User ID who owns this intent
        intent_alias: Alias/ID for the intent (e.g., "email-warmup")
        prompt: The actual prompt text

    Returns:
        The new intent record ID

    Raises:
        sqlite3.IntegrityError: If intent alias already exists for user
    """
    timestamp = utc_timestamp()
    
    cursor = conn.execute(
        """
        INSERT INTO user_intents (user_id, intent_alias, prompt, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (user_id, intent_alias, prompt, timestamp, timestamp),
    )
    return cursor.lastrowid


def get_user_intents(conn: sqlite3.Connection, user_id: int) -> list[dict]:
    """
    Get all intents for a user.

    Args:
        conn: Active SQLite database connection
        user_id: User ID to look up

    Returns:
        List of intent dicts
    """
    cursor = conn.execute(
        """
        SELECT id, intent_alias, prompt, created_at, updated_at
        FROM user_intents
        WHERE user_id = ?
        ORDER BY intent_alias ASC
        """,
        (user_id,),
    )
    return [
        {
            "id": row[0],
            "intent_alias": row[1],
            "prompt": row[2],
            "created_at": row[3],
            "updated_at": row[4],
        }
        for row in cursor.fetchall()
    ]


def delete_user_intent(
    conn: sqlite3.Connection, intent_id: int, user_id: int
) -> bool:
    """
    Delete a user intent.

    Args:
        conn: Active SQLite database connection
        intent_id: Intent record ID
        user_id: User ID (for ownership verification)

    Returns:
        True if deleted, False if not found or not owned by user
    """
    cursor = conn.execute(
        "DELETE FROM user_intents WHERE id = ? AND user_id = ?",
        (intent_id, user_id),
    )
    return cursor.rowcount > 0

def get_all_runs(conn: sqlite3.Connection, user_id: int | None = None) -> list[dict]:
    """
    Retrieve a list of all historical runs with token usage.

    Args:
        conn: Active SQLite database connection
        user_id: Optional user ID to filter runs (if provided, only returns runs for this user)

    Returns:
        List of run summary dicts, ordered by timestamp descending.
    """
    # SQLite JSON extract syntax: json_extract(column, '$.key')
    
    query = """
        SELECT 
            r.run_id, 
            r.timestamp_utc, 
            r.total_intents, 
            r.total_models, 
            r.total_cost_usd,
            (
                SELECT SUM(
                    COALESCE(json_extract(usage_meta_json, '$.prompt_tokens'), 0)
                ) 
                FROM answers_raw 
                WHERE run_id = r.run_id
            ) as input_tokens,
            (
                SELECT SUM(
                    COALESCE(json_extract(usage_meta_json, '$.completion_tokens'), 0)
                ) 
                FROM answers_raw 
                WHERE run_id = r.run_id
            ) as output_tokens,
            (
                SELECT GROUP_CONCAT(DISTINCT brand_name)
                FROM mentions
                WHERE run_id = r.run_id AND is_mine = 1
            ) as my_brands,
            (
                SELECT GROUP_CONCAT(DISTINCT brand_name)
                FROM mentions
                WHERE run_id = r.run_id AND is_mine = 0
            ) as competitor_brands
        FROM runs r
    """
    
    params = []
    if user_id is not None:
        query += " WHERE r.user_id = ?"
        params.append(user_id)
        
    query += " ORDER BY r.timestamp_utc DESC"
    
    cursor = conn.execute(query, tuple(params))
    
    runs = []
    for row in cursor.fetchall():
        runs.append({
            "run_id": row[0],
            "timestamp_utc": row[1],
            "total_intents": row[2],
            "total_models": row[3],
            "total_cost_usd": row[4],
            "input_tokens": row[5] or 0,
            "output_tokens": row[6] or 0,
            "my_brands": row[7] or "",
            "competitor_brands": row[8] or "",
        })
    return runs


def delete_all_runs_for_user(conn: sqlite3.Connection, user_id: int) -> int:
    """
    Delete all runs for a specific user.

    Args:
        conn: Active SQLite database connection
        user_id: User ID

    Returns:
        Number of runs deleted
    """
    # Get run_ids first
    cursor = conn.execute("SELECT run_id FROM runs WHERE user_id = ?", (user_id,))
    run_ids = [row[0] for row in cursor.fetchall()]
    
    if not run_ids:
        return 0

    # Delete runs (cascading should handle the rest if PRAGMA foreign_keys = ON)
    cursor = conn.execute("DELETE FROM runs WHERE user_id = ?", (user_id,))
    return cursor.rowcount


# ============================================================================
# User Settings CRUD Operations
# ============================================================================


def upsert_user_settings(conn: sqlite3.Connection, user_id: int, settings_json: str) -> None:
    """
    Create or update user settings.

    Args:
        conn: Active SQLite database connection
        user_id: User ID
        settings_json: JSON string of settings
    """
    timestamp = utc_timestamp()
    conn.execute(
        """
        INSERT INTO user_settings (user_id, settings_json, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            settings_json = excluded.settings_json,
            updated_at = excluded.updated_at
        """,
        (user_id, settings_json, timestamp),
    )


def get_user_settings(conn: sqlite3.Connection, user_id: int) -> dict | None:
    """
    Get user settings.

    Args:
        conn: Active SQLite database connection
        user_id: User ID

    Returns:
        Dict of settings or None
    """
    cursor = conn.execute(
        "SELECT settings_json FROM user_settings WHERE user_id = ?",
        (user_id,),
    )
    row = cursor.fetchone()
    if row is None:
        return None
    
    import json
    try:
        return json.loads(row[0])
    except json.JSONDecodeError:
        return {}

