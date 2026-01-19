#!/usr/bin/env python3
"""
Export LLM Answer Watcher data to CSV for analysis in Excel/Google Sheets.

This script demonstrates how to:
- Connect to SQLite database
- Query brand mentions with SQL
- Export to CSV format
- Generate reports for stakeholders

Usage:
    python examples/code-examples/export_to_csv.py
"""

import csv
import sqlite3
import sys
from pathlib import Path


def export_mentions_to_csv(db_path: str, output_file: str = "brand_mentions.csv"):
    """Export all brand mentions to CSV."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Query all mentions with metadata
        query = """
        SELECT
            timestamp_utc,
            run_id,
            intent_id,
            normalized_name,
            is_mine,
            rank_position,
            model_provider,
            model_name,
            match_type,
            sentiment,
            mention_context
        FROM mentions
        ORDER BY timestamp_utc DESC, rank_position ASC
        """

        cursor.execute(query)
        rows = cursor.fetchall()

        # Write to CSV
        with open(output_file, "w", newline="") as f:
            writer = csv.writer(f)

            # Header
            writer.writerow([
                "Timestamp",
                "Run ID",
                "Intent",
                "Brand",
                "Is Mine",
                "Rank",
                "Provider",
                "Model",
                "Match Type",
                "Sentiment",
                "Context"
            ])

            # Data
            writer.writerows(rows)

        print(f"✓ Exported {len(rows)} mentions to {output_file}")
        conn.close()

        return len(rows)

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        sys.exit(1)


def export_run_summary(db_path: str, output_file: str = "run_summary.csv"):
    """Export run-level summary metrics."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        query = """
        SELECT
            run_id,
            timestamp_utc,
            total_intents,
            total_models,
            total_cost_usd
        FROM runs
        ORDER BY timestamp_utc DESC
        """

        cursor.execute(query)
        rows = cursor.fetchall()

        with open(output_file, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["Run ID", "Timestamp", "Intents", "Models", "Cost USD"])
            writer.writerows(rows)

        print(f"✓ Exported {len(rows)} runs to {output_file}")
        conn.close()

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        sys.exit(1)


def export_share_of_voice(db_path: str, output_file: str = "share_of_voice.csv"):
    """Calculate and export share of voice metrics."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        query = """
        SELECT
            normalized_name,
            is_mine,
            COUNT(*) as mention_count,
            AVG(CASE WHEN rank_position IS NOT NULL THEN rank_position END) as avg_rank
        FROM mentions
        GROUP BY normalized_name, is_mine
        ORDER BY mention_count DESC
        """

        cursor.execute(query)
        rows = cursor.fetchall()

        with open(output_file, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["Brand", "Is Mine", "Mentions", "Avg Rank"])
            writer.writerows(rows)

        print(f"✓ Exported share of voice to {output_file}")
        conn.close()

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        sys.exit(1)


def main():
    """Main export workflow."""
    # Find database
    db_path = "./output/watcher.db"

    if not Path(db_path).exists():
        print(f"Error: Database not found at {db_path}")
        print("Run 'llm-answer-watcher run --config CONFIG' first")
        sys.exit(1)

    print("Exporting data from SQLite to CSV...")
    print(f"Database: {db_path}\n")

    # Export all data
    export_mentions_to_csv(db_path)
    export_run_summary(db_path)
    export_share_of_voice(db_path)

    print("\n" + "=" * 80)
    print("Export complete! CSV files created:")
    print("  - brand_mentions.csv     (all mentions with metadata)")
    print("  - run_summary.csv        (run-level costs and metrics)")
    print("  - share_of_voice.csv     (brand comparison)")
    print("\nOpen these files in Excel or Google Sheets for analysis.")
    print("=" * 80)


if __name__ == "__main__":
    main()
