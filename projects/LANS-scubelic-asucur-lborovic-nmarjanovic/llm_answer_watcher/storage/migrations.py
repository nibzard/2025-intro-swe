"""
Database schema migrations for LLM Answer Watcher.

This module contains migration logic for upgrading the SQLite database schema
across versions. Each migration is a discrete function that upgrades from
version N to version N+1.

Migration Philosophy:
- Migrations are one-way (no downgrades)
- Each migration runs in a transaction (atomic)
- Failed migrations are rolled back
- Schema version is recorded after successful migration

Current Schema Versions:
- v1: Initial schema with runs, answers_raw, mentions tables

Future migrations will be added here as new features require schema changes.

Example:
    >>> # Migrations are called automatically by storage.db.apply_migrations()
    >>> # Do NOT call migration functions directly
    >>> from storage.db import init_db_if_needed
    >>> init_db_if_needed("watcher.db")
    # Automatically applies all needed migrations

See Also:
    storage.db.apply_migrations() - Orchestrates migration execution
    storage.db.get_schema_version() - Checks current version
"""

import logging

# Migration functions are defined in storage/db.py to keep schema logic
# centralized. This file documents the migration strategy and provides
# future extension points

logger = logging.getLogger(__name__)

# Future migration documentation:
#
# def migrate_to_v2(conn):
#     """
#     Migrate to schema version 2.
#
#     Changes:
#     - Add example_column to runs table
#     - Add index on example_column
#     """
#     conn.execute("ALTER TABLE runs ADD COLUMN example_column TEXT")
#     conn.execute("CREATE INDEX idx_runs_example ON runs(example_column)")
#
# def migrate_to_v3(conn):
#     """
#     Migrate to schema version 3.
#
#     Changes:
#     - Create new example_table
#     - Backfill data from existing tables
#     """
#     pass
