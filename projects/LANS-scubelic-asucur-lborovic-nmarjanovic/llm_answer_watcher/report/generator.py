"""
HTML report generation for LLM Answer Watcher.

This module reads parsed JSON files from a run directory and generates a beautiful,
self-contained HTML report with inline CSS, no external dependencies.

Key features:
- Jinja2 templating with autoescaping enabled (XSS prevention)
- Mobile-responsive design with professional blue/green styling
- Cost tracking and formatting
- Visual appearance indicators (green  / red )
- Ranked lists with confidence indicators
- Self-contained HTML (inline CSS, no external assets)

Security:
- CRITICAL: Jinja2 autoescaping enabled to prevent HTML injection
- All user-supplied data (brand names, prompts) is automatically escaped

Example:
    >>> from pathlib import Path
    >>> from config.schema import RuntimeConfig
    >>> run_dir = "./output/2025-11-02T08-00-00Z"
    >>> html = generate_report(run_dir, "2025-11-02T08-00-00Z", config, results)
    >>> write_report(run_dir, config, results)
"""

import json
import logging
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from ..config.schema import RuntimeConfig
from ..storage.layout import get_parsed_answer_filename, get_raw_answer_filename
from ..storage.writer import write_report_html
from .cost_formatter import format_cost_usd

logger = logging.getLogger(__name__)


def generate_report(
    run_dir: str,
    run_id: str,
    config: RuntimeConfig,
    results: list[dict],
) -> str:
    """
    Generate HTML report from run results.

    Reads all parsed JSON files from run directory, aggregates data for the
    template, and renders a self-contained HTML report with inline CSS.

    Args:
        run_dir: Path to run output directory (contains parsed JSON files)
        run_id: Run identifier (timestamp slug)
        config: Runtime configuration with intents and models
        results: List of result dicts from runner (intent_id, provider, etc.)

    Returns:
        HTML string (self-contained, ready to write to file)

    Raises:
        FileNotFoundError: If run directory doesn't exist
        ValueError: If template rendering fails
        json.JSONDecodeError: If parsed JSON files are invalid

    Example:
        >>> html = generate_report(
        ...     "./output/2025-11-02T08-00-00Z",
        ...     "2025-11-02T08-00-00Z",
        ...     config,
        ...     [
        ...         {
        ...             "intent_id": "email-warmup",
        ...             "provider": "openai",
        ...             "model_name": "gpt-4o-mini",
        ...             "status": "success",
        ...             "cost_usd": 0.001
        ...         }
        ...     ]
        ... )
        >>> "LLM Answer Watcher Report" in html
        True

    Note:
        - Jinja2 autoescaping is enabled for XSS prevention
        - All costs are formatted with format_cost_usd()
        - Missing parsed files are logged but don't crash report generation
        - Template path is relative to this module's location
    """
    run_dir_path = Path(run_dir)

    # Validate run directory exists
    if not run_dir_path.exists():
        raise FileNotFoundError(f"Run directory not found: {run_dir}")

    logger.info(f"Generating HTML report for run: {run_id}")

    # Setup Jinja2 environment with autoescaping enabled (CRITICAL for security)
    template_dir = Path(__file__).parent / "templates"
    env = Environment(
        loader=FileSystemLoader(str(template_dir)),
        autoescape=select_autoescape(["html", "xml", "j2"]),
    )

    # Load template
    try:
        template = env.get_template("report.html.j2")
    except Exception as e:
        logger.error(f"Failed to load template: {e}", exc_info=True)
        raise ValueError(f"Cannot load report template: {e}") from e

    # Aggregate data for template
    template_data = _build_template_data(run_dir_path, run_id, config, results)

    # Render template
    try:
        html = template.render(**template_data)
        logger.info("HTML report generated successfully")
        return html
    except Exception as e:
        logger.error(f"Failed to render template: {e}", exc_info=True)
        raise ValueError(f"Cannot render report template: {e}") from e


def write_report(
    run_dir: str,
    config: RuntimeConfig,
    results: list[dict],
) -> None:
    """
    Generate and write HTML report to run directory.

    Convenience function that calls generate_report() and writes the output
    to report.html using storage.writer.

    Args:
        run_dir: Path to run output directory
        config: Runtime configuration with intents and models
        results: List of result dicts from runner

    Raises:
        FileNotFoundError: If run directory doesn't exist
        ValueError: If report generation fails
        OSError: If report cannot be written to disk

    Example:
        >>> write_report("./output/2025-11-02T08-00-00Z", config, results)

    Note:
        - Extracts run_id from run_dir path (last component)
        - Calls generate_report() then storage.writer.write_report_html()
        - Any errors during generation or writing are propagated
    """
    # Extract run_id from run_dir path
    run_id = Path(run_dir).name

    # Generate HTML
    html = generate_report(run_dir, run_id, config, results)

    # Write to disk
    write_report_html(run_dir, html)
    logger.info(f"HTML report written to: {run_dir}/report.html")


def _calculate_visibility_scores(intents_data: list[dict]) -> dict:
    """
    Calculate visibility scores for all brands across all intents.

    Visibility score = percentage of intents where a brand appeared.
    Also calculates average rank when the brand appears in ranked lists.

    Args:
        intents_data: List of intent dicts with results and mentions

    Returns:
        Dictionary with brand visibility metrics:
        {
            "my_brands": [
                {
                    "brand_name": "Warmly",
                    "normalized_name": "warmly",
                    "appearance_count": 5,
                    "total_queries": 10,
                    "visibility_percentage": 50,
                    "times_ranked": 4,
                    "average_rank": 2.5
                },
                ...
            ],
            "competitor_brands": [...],
            "total_queries": 10
        }

    Note:
        - Aggregates across all intents and models
        - Uses normalized_name for brand deduplication
        - Average rank only calculated when rank_position is not null
        - Sorted by visibility_percentage descending
    """
    # Track brand appearances across all queries
    my_brands_stats: dict[str, dict] = {}
    competitor_brands_stats: dict[str, dict] = {}
    total_queries = 0

    # Iterate through all intents and their model results
    for intent in intents_data:
        for result in intent.get("results", []):
            total_queries += 1

            # Track which brands appeared in this query (for deduplication)
            my_brands_in_this_query = set()
            competitor_brands_in_this_query = set()

            # Process "my" brand mentions
            for mention in result.get("my_mentions", []):
                normalized = mention.get("normalized_name", "").lower()
                original = mention.get("original_text", normalized)

                if normalized not in my_brands_stats:
                    my_brands_stats[normalized] = {
                        "brand_name": original,
                        "normalized_name": normalized,
                        "appearance_count": 0,
                        "rank_positions": [],
                    }

                # Track that this brand appeared in this query
                my_brands_in_this_query.add(normalized)

            # Increment appearance count for brands that appeared in this query
            for brand_name in my_brands_in_this_query:
                my_brands_stats[brand_name]["appearance_count"] += 1

            # Process competitor brand mentions
            for mention in result.get("competitor_mentions", []):
                normalized = mention.get("normalized_name", "").lower()
                original = mention.get("original_text", normalized)

                if normalized not in competitor_brands_stats:
                    competitor_brands_stats[normalized] = {
                        "brand_name": original,
                        "normalized_name": normalized,
                        "appearance_count": 0,
                        "rank_positions": [],
                    }

                # Track that this brand appeared in this query
                competitor_brands_in_this_query.add(normalized)

            # Increment appearance count for competitor brands that appeared in this query
            for brand_name in competitor_brands_in_this_query:
                competitor_brands_stats[brand_name]["appearance_count"] += 1

            # Process ranked lists to extract rank positions
            for ranked_brand in result.get("ranked_list", []):
                brand_name = ranked_brand.get("brand_name", "")
                normalized = brand_name.lower()
                rank_pos = ranked_brand.get("rank_position")

                if rank_pos is not None:
                    # Check if this brand is in our tracking (mine or competitor)
                    if normalized in my_brands_stats:
                        my_brands_stats[normalized]["rank_positions"].append(rank_pos)
                    elif normalized in competitor_brands_stats:
                        competitor_brands_stats[normalized]["rank_positions"].append(
                            rank_pos
                        )

    # Calculate final metrics for my brands
    my_brands_list = []
    for normalized, stats in my_brands_stats.items():
        appearance_count = stats["appearance_count"]
        rank_positions = stats["rank_positions"]

        visibility_percentage = (
            int(appearance_count / total_queries * 100) if total_queries > 0 else 0
        )
        times_ranked = len(rank_positions)
        average_rank = (
            round(sum(rank_positions) / times_ranked, 1) if times_ranked > 0 else None
        )

        my_brands_list.append(
            {
                "brand_name": stats["brand_name"],
                "normalized_name": normalized,
                "appearance_count": appearance_count,
                "total_queries": total_queries,
                "visibility_percentage": visibility_percentage,
                "times_ranked": times_ranked,
                "average_rank": average_rank,
            }
        )

    # Calculate final metrics for competitor brands
    competitor_brands_list = []
    for normalized, stats in competitor_brands_stats.items():
        appearance_count = stats["appearance_count"]
        rank_positions = stats["rank_positions"]

        visibility_percentage = (
            int(appearance_count / total_queries * 100) if total_queries > 0 else 0
        )
        times_ranked = len(rank_positions)
        average_rank = (
            round(sum(rank_positions) / times_ranked, 1) if times_ranked > 0 else None
        )

        competitor_brands_list.append(
            {
                "brand_name": stats["brand_name"],
                "normalized_name": normalized,
                "appearance_count": appearance_count,
                "total_queries": total_queries,
                "visibility_percentage": visibility_percentage,
                "times_ranked": times_ranked,
                "average_rank": average_rank,
            }
        )

    # Sort by visibility percentage descending
    my_brands_list.sort(key=lambda x: x["visibility_percentage"], reverse=True)
    competitor_brands_list.sort(key=lambda x: x["visibility_percentage"], reverse=True)

    return {
        "my_brands": my_brands_list,
        "competitor_brands": competitor_brands_list,
        "total_queries": total_queries,
    }


def _build_template_data(
    run_dir: Path,
    run_id: str,
    config: RuntimeConfig,
    results: list[dict],
) -> dict:
    """
    Build template data dictionary from run results.

    Aggregates all data needed for the Jinja2 template: summary stats,
    per-intent results with parsed mentions and rankings, cost totals.

    Args:
        run_dir: Path to run output directory
        run_id: Run identifier
        config: Runtime configuration
        results: List of result dicts from runner

    Returns:
        Dictionary with template variables (run_id, intents, costs, etc.)

    Note:
        - Reads parsed JSON files for each successful result
        - Handles missing files gracefully (logs warning, continues)
        - Formats all costs with format_cost_usd()
        - Sorts mentions by position for consistent display
    """
    # Calculate summary statistics
    total_intents = len(config.intents)
    total_models = len(config.models)
    successful_results = [r for r in results if r.get("status") == "success"]
    success_count = len(successful_results)
    total_count = len(results)
    success_rate = int(success_count / total_count * 100) if total_count > 0 else 0

    # Calculate total cost and operations cost from run_meta.json (if available)
    total_cost = sum(r.get("cost_usd", 0.0) for r in results)
    total_operations_cost = 0.0
    total_llm_cost = total_cost  # Default if run_meta doesn't exist
    config_filename = None

    # Try to load more accurate cost breakdown from run_meta.json
    run_meta_path = run_dir / "run_meta.json"
    if run_meta_path.exists():
        try:
            with run_meta_path.open(encoding="utf-8") as f:
                run_meta = json.load(f)
                total_operations_cost = run_meta.get("total_operations_cost_usd", 0.0)
                total_llm_cost = run_meta.get("total_llm_cost_usd", total_cost)
                config_filename = run_meta.get("config_filename")
        except (json.JSONDecodeError, OSError) as e:
            logger.warning(f"Failed to load run_meta.json for cost breakdown: {e}")

    total_cost_formatted = format_cost_usd(total_cost)
    total_operations_cost_formatted = format_cost_usd(total_operations_cost)
    total_llm_cost_formatted = format_cost_usd(total_llm_cost)

    # Get timestamp from first result (if available)
    timestamp_utc = results[0].get("timestamp_utc", run_id) if results else run_id

    # Build list of unique models used
    models_used = []
    seen_models = set()
    for model in config.models:
        model_key = f"{model.provider}/{model.model_name}"
        if model_key not in seen_models:
            models_used.append(
                {
                    "provider": model.provider,
                    "model_name": model.model_name,
                }
            )
            seen_models.add(model_key)

    # Group results by intent
    intents_data = []
    for intent in config.intents:
        intent_results = [r for r in results if r.get("intent_id") == intent.id]

        # Load parsed data for each model result
        model_results = []
        for result in intent_results:
            model_data = _load_model_result(
                run_dir,
                result,
                intent.id,
            )
            if model_data:
                model_results.append(model_data)

        intents_data.append(
            {
                "intent_id": intent.id,
                "prompt": intent.prompt,
                "results": model_results,
            }
        )

    # Calculate visibility scores
    visibility_scores = _calculate_visibility_scores(intents_data)

    return {
        "run_id": run_id,
        "timestamp_utc": timestamp_utc,
        "config_filename": config_filename,
        "total_cost_formatted": total_cost_formatted,
        "total_llm_cost_formatted": total_llm_cost_formatted,
        "total_operations_cost_formatted": total_operations_cost_formatted,
        "has_operations_cost": total_operations_cost > 0,
        "total_intents": total_intents,
        "total_models": total_models,
        "success_rate": success_rate,
        "models_used": models_used,
        "intents": intents_data,
        "visibility_scores": visibility_scores,
    }


def _load_model_result(
    run_dir: Path,
    result: dict,
    intent_id: str,
) -> dict | None:
    """
    Load parsed result data for a single model's answer.

    Reads the parsed JSON file and extracts mentions, rankings, and metadata
    for template rendering.

    Args:
        run_dir: Path to run output directory
        result: Result dict from runner (with provider, model_name, status, cost)
        intent_id: Intent identifier (for filename generation)

    Returns:
        Dictionary with model result data for template, or None if loading fails

    Note:
        - Returns None for failed results (status != success)
        - Logs warnings for missing/invalid JSON files but doesn't crash
        - Sorts mentions by position for consistent display
        - Formats cost with format_cost_usd()
    """
    # Skip failed results
    if result.get("status") != "success":
        logger.warning(
            f"Skipping failed result: {intent_id} / "
            f"{result.get('provider')}/{result.get('model_name')}"
        )
        return None

    provider = result.get("provider")
    model_name = result.get("model_name")

    # Build path to parsed JSON file
    parsed_filename = get_parsed_answer_filename(intent_id, provider, model_name)
    parsed_path = run_dir / parsed_filename

    # Load parsed JSON
    if not parsed_path.exists():
        logger.warning(
            f"Parsed file not found: {parsed_path}. Skipping in report generation."
        )
        return None

    try:
        with parsed_path.open(encoding="utf-8") as f:
            parsed_data = json.load(f)
    except json.JSONDecodeError as e:
        logger.error(
            f"Invalid JSON in {parsed_path}: {e}. Skipping in report generation.",
            exc_info=True,
        )
        return None
    except OSError as e:
        logger.error(
            f"Failed to read {parsed_path}: {e}. Skipping in report generation.",
            exc_info=True,
        )
        return None

    # Extract data from parsed result
    appeared_mine = parsed_data.get("appeared_mine", False)
    my_mentions = parsed_data.get("my_mentions", [])
    competitor_mentions = parsed_data.get("competitor_mentions", [])
    ranked_list = parsed_data.get("ranked_list", [])
    rank_extraction_method = parsed_data.get("rank_extraction_method", "pattern")
    rank_confidence = parsed_data.get("rank_confidence", 0.0)

    # Build a lookup map from ranked_list: brand_name -> rank_position
    rank_lookup = {item["brand_name"]: item["rank_position"] for item in ranked_list}

    # Enrich mentions with rank_position from ranked_list
    def enrich_mention_with_rank(mention: dict) -> dict:
        """Add rank_position to mention if brand is in ranked_list."""
        enriched = mention.copy()
        brand_name = mention.get("normalized_name")
        enriched["rank_position"] = rank_lookup.get(brand_name)
        return enriched

    # Enrich and sort mentions
    my_mentions_enriched = [enrich_mention_with_rank(m) for m in my_mentions]
    competitor_mentions_enriched = [
        enrich_mention_with_rank(m) for m in competitor_mentions
    ]

    # Sort by rank_position (None last), then by match_position
    def sort_key(m):
        rank = m.get("rank_position")
        return (rank is None, rank if rank is not None else 0, m.get("match_position", 0))

    my_mentions_sorted = sorted(my_mentions_enriched, key=sort_key)
    competitor_mentions_sorted = sorted(competitor_mentions_enriched, key=sort_key)

    # Format cost
    cost_usd = result.get("cost_usd", 0.0)
    cost_formatted = format_cost_usd(cost_usd)

    # Load raw answer text (for expandable section)
    raw_filename = get_raw_answer_filename(intent_id, provider, model_name)
    raw_path = run_dir / raw_filename
    answer_text = None
    answer_length = 0
    web_search_count = 0

    if raw_path.exists():
        try:
            with raw_path.open(encoding="utf-8") as f:
                raw_data = json.load(f)
                answer_text = raw_data.get("answer_text", "")
                answer_length = raw_data.get("answer_length", len(answer_text))
                web_search_count = raw_data.get("web_search_count", 0)
        except (json.JSONDecodeError, OSError) as e:
            logger.warning(f"Failed to load raw answer text from {raw_path}: {e}")

    # Load operations results for this intent
    # Note: Operations run with operation_models (e.g., o3-mini), not query models
    # We show the same operations under each query model since they analyze all responses
    operations = []
    operations_cost_usd = 0.0

    # Find all operation result files for this intent (regardless of operation model used)
    # Pattern: intent_{intent_id}_operation_{operation_id}_{provider}_{model}.json
    operation_pattern = f"intent_{intent_id}_operation_*.json"
    operation_files = run_dir.glob(operation_pattern)

    for op_file in operation_files:
        try:
            with op_file.open(encoding="utf-8") as f:
                op_data = json.load(f)
                operations.append({
                    "operation_id": op_data.get("operation_id", ""),
                    "result_text": op_data.get("result_text", ""),
                    "cost_usd": op_data.get("cost_usd", 0.0),
                    "cost_formatted": format_cost_usd(op_data.get("cost_usd", 0.0)),
                    "tokens_used": op_data.get("tokens_used_input", 0) + op_data.get("tokens_used_output", 0),
                    "skipped": op_data.get("skipped", False),
                    "error": op_data.get("error"),
                })
                operations_cost_usd += op_data.get("cost_usd", 0.0)
        except (json.JSONDecodeError, OSError) as e:
            logger.warning(f"Failed to load operation result from {op_file}: {e}")

    return {
        "provider": provider,
        "model_name": model_name,
        "appeared_mine": appeared_mine,
        "my_mentions": my_mentions_sorted,
        "competitor_mentions": competitor_mentions_sorted,
        "ranked_list": ranked_list,
        "rank_extraction_method": rank_extraction_method,
        "rank_confidence": rank_confidence,
        "cost_formatted": cost_formatted,
        "answer_text": answer_text,
        "answer_length": answer_length,
        "web_search_count": web_search_count,
        "has_web_search": web_search_count > 0,
        "operations": operations,
        "operations_cost_usd": operations_cost_usd,
        "operations_cost_formatted": format_cost_usd(operations_cost_usd),
        "has_operations": len(operations) > 0,
    }
