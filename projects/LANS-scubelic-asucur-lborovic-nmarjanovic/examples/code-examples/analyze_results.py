#!/usr/bin/env python3
"""
Analyze LLM Answer Watcher results programmatically.

This script demonstrates how to:
- Load JSON output from a run
- Parse brand mentions and rankings
- Calculate metrics and trends
- Generate custom reports

Usage:
    python examples/code-examples/analyze_results.py
"""

import json
import sys
from pathlib import Path


def find_latest_run(output_dir: str = "./output") -> Path | None:
    """Find the most recent run directory."""
    output_path = Path(output_dir)

    if not output_path.exists():
        return None

    # Find all timestamped directories
    run_dirs = [d for d in output_path.iterdir() if d.is_dir()]

    if not run_dirs:
        return None

    # Return most recent (sorted by modification time)
    return max(run_dirs, key=lambda p: p.stat().st_mtime)


def analyze_run(run_dir: Path) -> dict:
    """Analyze a complete run and return metrics."""
    # Load run metadata
    meta_file = run_dir / "run_meta.json"

    if not meta_file.exists():
        raise FileNotFoundError(f"No run_meta.json found in {run_dir}")

    with open(meta_file) as f:
        meta = json.load(f)

    # Count brand mentions across all parsed files
    my_mentions = 0
    competitor_mentions = 0
    my_rankings = []
    competitor_rankings = {}

    for parsed_file in run_dir.glob("*_parsed_*.json"):
        with open(parsed_file) as f:
            parsed = json.load(f)

        # Count my mentions
        if parsed.get("appeared_mine"):
            my_mentions += len(parsed.get("my_mentions", []))

        # Count competitor mentions
        competitor_mentions += len(parsed.get("competitor_mentions", []))

        # Track rankings
        for ranked in parsed.get("ranked_list", []):
            brand = ranked["brand_name"]
            rank = ranked["rank_position"]

            # Check if this is my brand
            if brand in meta.get("my_brands", []):
                my_rankings.append(rank)
            else:
                if brand not in competitor_rankings:
                    competitor_rankings[brand] = []
                competitor_rankings[brand].append(rank)

    # Calculate metrics
    avg_my_rank = sum(my_rankings) / len(my_rankings) if my_rankings else None

    return {
        "run_id": meta["run_id"],
        "total_cost_usd": meta["total_cost_usd"],
        "success_count": meta["success_count"],
        "error_count": meta["error_count"],
        "my_mentions": my_mentions,
        "competitor_mentions": competitor_mentions,
        "my_rankings": my_rankings,
        "avg_my_rank": avg_my_rank,
        "competitor_rankings": competitor_rankings,
        "my_brands": meta.get("my_brands", []),
        "competitors": meta.get("competitors", []),
    }


def print_report(analysis: dict):
    """Print a formatted analysis report."""
    print("=" * 80)
    print("LLM ANSWER WATCHER - RUN ANALYSIS")
    print("=" * 80)

    print(f"\nRun ID: {analysis['run_id']}")
    print(f"Total Cost: ${analysis['total_cost_usd']:.4f}")
    print(f"Success Rate: {analysis['success_count']}/{analysis['success_count'] + analysis['error_count']}")

    print("\n" + "-" * 80)
    print("BRAND PERFORMANCE")
    print("-" * 80)

    print(f"\nYour Brands: {', '.join(analysis['my_brands'])}")
    print(f"  - Total Mentions: {analysis['my_mentions']}")
    print(f"  - Rankings: {analysis['my_rankings']}")
    if analysis['avg_my_rank']:
        print(f"  - Average Rank: {analysis['avg_my_rank']:.1f}")
    else:
        print(f"  - Average Rank: Not ranked")

    print(f"\nCompetitors:")
    print(f"  - Total Mentions: {analysis['competitor_mentions']}")

    if analysis['competitor_rankings']:
        print(f"\n  Top Competitors:")
        # Sort by total mentions
        sorted_competitors = sorted(
            analysis['competitor_rankings'].items(),
            key=lambda x: len(x[1]),
            reverse=True
        )

        for brand, ranks in sorted_competitors[:5]:
            avg_rank = sum(ranks) / len(ranks) if ranks else 0
            print(f"    - {brand}: {len(ranks)} mentions (avg rank: {avg_rank:.1f})")

    print("\n" + "-" * 80)
    print("INSIGHTS")
    print("-" * 80)

    # Calculate share of voice
    total_mentions = analysis['my_mentions'] + analysis['competitor_mentions']
    if total_mentions > 0:
        share_of_voice = (analysis['my_mentions'] / total_mentions) * 100
        print(f"\nShare of Voice: {share_of_voice:.1f}%")

    # Ranking analysis
    if analysis['avg_my_rank']:
        if analysis['avg_my_rank'] <= 3:
            print("✅ Strong positioning - average rank in top 3")
        elif analysis['avg_my_rank'] <= 5:
            print("⚠️  Moderate positioning - average rank 4-5")
        else:
            print("❌ Weak positioning - average rank below 5")
    else:
        print("❌ Not appearing in LLM responses")

    print("\n" + "=" * 80)


def main():
    """Main analysis workflow."""
    print("Finding latest run...")

    latest_run = find_latest_run()

    if not latest_run:
        print("Error: No run directories found in ./output/")
        print("Run 'llm-answer-watcher run --config CONFIG' first")
        sys.exit(1)

    print(f"Analyzing: {latest_run.name}")

    try:
        analysis = analyze_run(latest_run)
        print_report(analysis)
    except Exception as e:
        print(f"Error analyzing run: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
