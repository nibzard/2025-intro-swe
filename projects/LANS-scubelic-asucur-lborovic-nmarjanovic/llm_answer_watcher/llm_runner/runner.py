"""
Core orchestration engine for LLM Answer Watcher.

This module implements the main "run_all" function that executes the complete
workflow: query LLMs, parse answers, write artifacts, store in database.

This is the internal "POST /run" contract - OSS CLI calls it in-process,
Cloud version will expose it over HTTP.

Key responsibilities:
- Generate run_id from current UTC timestamp
- Create output directory structure
- Loop through all (intent, model) combinations
- Call LLM clients with retry logic
- Parse answers using extractor module
- Write JSON artifacts (raw, parsed, error files)
- Insert data into SQLite database
- Generate run metadata summary
- Return structured result dict

Example:
    >>> from llm_answer_watcher.config.loader import load_config
    >>> config = load_config("examples/watcher.config.yaml")
    >>> result = run_all(config)
    >>> print(result["run_id"])
    '2025-11-02T08-00-00Z'
    >>> print(result["total_cost_usd"])
    0.0123

Architecture:
    This is the API-first contract. In OSS version, CLI calls this directly.
    In Cloud version, this becomes the HTTP endpoint handler.
"""

import asyncio
import json
import logging
import sqlite3
from collections.abc import Callable
from dataclasses import asdict, dataclass

from ..config.schema import RuntimeConfig
from ..exceptions import BudgetExceededError
from ..extractor.intent_classifier import classify_intent
from ..extractor.parser import parse_answer
from ..storage.db import (
    insert_answer_raw,
    insert_intent_classification,
    insert_mention,
    insert_operation,
    insert_run,
)
from ..storage.writer import (
    create_run_directory,
    write_error,
    write_operation_result,
    write_parsed_answer,
    write_raw_answer,
    write_run_meta,
)
from ..utils.time import run_id_from_timestamp, utc_timestamp
from .intent_runner import IntentResult
from .models import build_client
from .operation_executor import (
    OperationContext,
    execute_operations_with_dependencies,
)
from .plugin_registry import RunnerRegistry

logger = logging.getLogger(__name__)


@dataclass
class RawAnswerRecord:
    """
    Intermediate data structure for raw LLM response.

    Holds the raw answer from an LLM along with metadata before writing
    to JSON and database. Used in run_all() orchestration.

    Attributes:
        intent_id: Intent query identifier (e.g., "email-warmup")
        prompt: The actual prompt text sent to LLM
        model_provider: LLM provider name (e.g., "openai", "anthropic")
        model_name: Model identifier (e.g., "gpt-4o-mini", "claude-3-5-sonnet")
        timestamp_utc: UTC timestamp when answer was generated (ISO 8601)
        answer_text: Raw text response from LLM
        answer_length: Character count of answer_text
        usage_meta: Token usage dict from LLM API (prompt_tokens, completion_tokens)
        estimated_cost_usd: Estimated API cost in USD based on token usage
        web_search_results: Optional list of web search results if tools were used
        web_search_count: Number of web searches performed (0 if no web search)
        runner_type: Runner type ("api", "browser", or "custom", default "api")
        runner_name: Optional human-readable runner name (e.g., "steel-chatgpt")
        screenshot_path: Optional path to screenshot file (browser runners only)
        html_snapshot_path: Optional path to HTML snapshot file (browser runners only)
        session_id: Optional browser session ID (browser runners only)

    Example:
        >>> # API runner example
        >>> record = RawAnswerRecord(
        ...     intent_id="email-warmup",
        ...     prompt="What are the best email warmup tools?",
        ...     model_provider="openai",
        ...     model_name="gpt-4o-mini",
        ...     timestamp_utc="2025-11-02T08:00:00Z",
        ...     answer_text="Here are the best tools...",
        ...     answer_length=500,
        ...     usage_meta={"prompt_tokens": 100, "completion_tokens": 400},
        ...     estimated_cost_usd=0.001,
        ...     web_search_results=None,
        ...     web_search_count=0,
        ...     runner_type="api",
        ...     runner_name="openai-gpt-4o-mini"
        ... )
        >>> # Browser runner example
        >>> record = RawAnswerRecord(
        ...     intent_id="email-warmup",
        ...     prompt="What are the best email warmup tools?",
        ...     model_provider="chatgpt-web",
        ...     model_name="chatgpt-unknown",
        ...     timestamp_utc="2025-11-02T08:00:00Z",
        ...     answer_text="Browser answer...",
        ...     answer_length=800,
        ...     usage_meta={},
        ...     estimated_cost_usd=0.0,
        ...     runner_type="browser",
        ...     runner_name="steel-chatgpt",
        ...     screenshot_path="./output/screenshot.png",
        ...     html_snapshot_path="./output/snapshot.html",
        ...     session_id="session-abc123"
        ... )
    """

    intent_id: str
    prompt: str
    model_provider: str
    model_name: str
    timestamp_utc: str
    answer_text: str
    answer_length: int
    usage_meta: dict
    estimated_cost_usd: float
    web_search_results: list[dict] | None = None
    web_search_count: int = 0
    runner_type: str = "api"
    runner_name: str | None = None
    screenshot_path: str | None = None
    html_snapshot_path: str | None = None
    session_id: str | None = None


def intent_result_to_raw_record(
    result: IntentResult, intent_id: str, prompt: str
) -> RawAnswerRecord:
    """
    Convert IntentResult (from browser/custom runner) to RawAnswerRecord.

    This adapter function enables browser and custom runners to integrate
    seamlessly with the existing storage and reporting infrastructure which
    expects RawAnswerRecord format.

    Args:
        result: IntentResult from runner.run_intent()
        intent_id: Intent query identifier
        prompt: The actual prompt text sent to runner

    Returns:
        RawAnswerRecord ready for JSON serialization and database storage

    Example:
        >>> from llm_runner.intent_runner import IntentResult
        >>> result = IntentResult(
        ...     answer_text="Browser answer...",
        ...     runner_type="browser",
        ...     runner_name="steel-chatgpt",
        ...     provider="chatgpt-web",
        ...     model_name="chatgpt-unknown",
        ...     timestamp_utc="2025-11-07T10:00:00Z",
        ...     cost_usd=0.0,
        ...     screenshot_path="./output/screenshot.png",
        ...     session_id="session-abc123"
        ... )
        >>> record = intent_result_to_raw_record(result, "crm-tools", "What are the best CRMs?")
        >>> record.intent_id
        'crm-tools'
        >>> record.runner_type
        'browser'
        >>> record.screenshot_path
        './output/screenshot.png'

    Note:
        - Browser runners typically have tokens_used=0 and empty usage_meta
        - API runners converted via APIRunner adapter already have token data
        - web_search_count is derived from len(web_search_results) or explicit value
    """
    # Calculate web search count
    web_search_count = 0
    if result.web_search_results:
        web_search_count = len(result.web_search_results)

    # Create usage metadata (empty for browser runners, may have data for API runners)
    usage_meta = {}
    if result.tokens_used > 0:
        # If runner provides token count, include it in usage_meta
        usage_meta = {
            "total_tokens": result.tokens_used,
            "prompt_tokens": 0,  # Not available from IntentResult
            "completion_tokens": 0,  # Not available from IntentResult
        }

    return RawAnswerRecord(
        intent_id=intent_id,
        prompt=prompt,
        model_provider=result.provider,
        model_name=result.model_name,
        timestamp_utc=result.timestamp_utc,
        answer_text=result.answer_text,
        answer_length=len(result.answer_text),
        usage_meta=usage_meta,
        estimated_cost_usd=result.cost_usd,
        web_search_results=result.web_search_results,
        web_search_count=web_search_count,
        runner_type=result.runner_type,
        runner_name=result.runner_name,
        screenshot_path=result.screenshot_path,
        html_snapshot_path=result.html_snapshot_path,
        session_id=result.session_id,
    )


def estimate_run_cost(config: RuntimeConfig) -> dict:
    """
    Estimate total cost for a run before execution.

    Uses conservative estimates for token usage:
    - Input tokens: 150 per query (prompt + system)
    - Output tokens: 500 per query (answer)
    - Web search: $0.01 per call if tools enabled

    Adds 20% buffer for safety.

    Args:
        config: Runtime configuration with intents and models

    Returns:
        dict: Cost estimate with breakdown:
            - total_estimated_cost: Total estimated cost in USD
            - per_intent_costs: Dict mapping intent_id to estimated cost
            - per_model_costs: List of dicts with per-model breakdown
            - total_queries: Total number of queries
            - buffer_percentage: Safety buffer applied (20%)

    Example:
        >>> estimate = estimate_run_cost(config)
        >>> print(f"Estimated: ${estimate['total_estimated_cost']:.4f}")
        Estimated: $0.0240
        >>> print(f"Queries: {estimate['total_queries']}")
        Queries: 6
    """
    from ..utils.pricing import PricingNotAvailableError, get_pricing

    # Conservative token estimates
    AVG_INPUT_TOKENS = 150  # Prompt + system message
    AVG_OUTPUT_TOKENS = 500  # Response
    BUFFER_PERCENTAGE = 0.20  # 20% safety buffer

    total_cost = 0.0
    per_intent_costs = {}
    per_model_costs = []

    for intent in config.intents:
        intent_cost = 0.0

        for model in config.models:
            # Get pricing for this model
            try:
                pricing = get_pricing(model.provider, model.model_name)
                input_rate = pricing.input / 1_000_000  # Convert to per-token
                output_rate = pricing.output / 1_000_000
            except (PricingNotAvailableError, Exception) as e:
                logger.warning(
                    f"Cannot estimate cost for {model.provider}/{model.model_name}: {e}. "
                    "Using $0.002 fallback."
                )
                # Fallback: assume ~$0.002 per query (gpt-4o-mini ballpark)
                input_rate = 0.00000015  # $0.15/1M
                output_rate = 0.0000006  # $0.60/1M

            # Calculate token cost
            query_cost = (AVG_INPUT_TOKENS * input_rate) + (
                AVG_OUTPUT_TOKENS * output_rate
            )

            # Add web search cost if tools enabled
            if model.tools:
                # Assume 1 web search per query
                web_search_cost = 0.01  # $10/1k = $0.01 per call
                query_cost += web_search_cost

            intent_cost += query_cost

        per_intent_costs[intent.id] = round(intent_cost, 6)
        total_cost += intent_cost

    # Calculate per-model breakdown (cost across all intents)
    for model in config.models:
        # Get pricing for this model
        try:
            pricing = get_pricing(model.provider, model.model_name)
            input_rate = pricing.input / 1_000_000
            output_rate = pricing.output / 1_000_000
        except (PricingNotAvailableError, Exception):
            input_rate = 0.00000015
            output_rate = 0.0000006

        # Calculate cost per query
        query_cost = (AVG_INPUT_TOKENS * input_rate) + (AVG_OUTPUT_TOKENS * output_rate)

        # Add web search cost if tools enabled
        if model.tools:
            query_cost += 0.01

        # Total cost for this model across all intents
        model_total = query_cost * len(config.intents)

        per_model_costs.append(
            {
                "provider": model.provider,
                "model_name": model.model_name,
                "cost_per_query": round(query_cost, 6),
                "total_cost": round(model_total, 6),
                "num_queries": len(config.intents),
                "has_web_search": bool(model.tools),
            }
        )

    # Calculate operation costs if operation_models configured
    per_operation_model_costs = []
    total_operations = 0

    if config.operation_models:
        # Conservative token estimates for operations (larger than queries)
        # Operations analyze full responses so need more context
        AVG_OP_INPUT_TOKENS = 1500  # Includes intent response + context
        AVG_OP_OUTPUT_TOKENS = 800  # Analysis output

        for op_model in config.operation_models:
            # Get pricing for operation model
            try:
                pricing = get_pricing(op_model.provider, op_model.model_name)
                input_rate = pricing.input / 1_000_000  # Convert to per-token
                output_rate = pricing.output / 1_000_000
            except (PricingNotAvailableError, Exception) as e:
                logger.warning(
                    f"Cannot estimate operation cost for {op_model.provider}/{op_model.model_name}: {e}. "
                    "Using $0.002 fallback."
                )
                # Fallback: assume ~$0.002 per operation
                input_rate = 0.00000015  # $0.15/1M
                output_rate = 0.0000006  # $0.60/1M

            # Calculate per-operation cost
            operation_cost = (AVG_OP_INPUT_TOKENS * input_rate) + (
                AVG_OP_OUTPUT_TOKENS * output_rate
            )

            # Count total operation executions
            # Each intent runs: len(global_operations) + len(intent.operations)
            ops_per_intent = len(config.global_operations)
            for intent in config.intents:
                ops_per_intent += len(intent.operations)

            # Total operations across all intents
            num_operations = ops_per_intent * len(config.intents)
            total_operations += num_operations

            # Calculate total cost for this operation model
            op_model_total = operation_cost * num_operations
            total_cost += op_model_total

            per_operation_model_costs.append(
                {
                    "provider": op_model.provider,
                    "model_name": op_model.model_name,
                    "cost_per_operation": round(operation_cost, 6),
                    "total_cost": round(op_model_total, 6),
                    "num_operations": num_operations,
                }
            )

    # Add safety buffer
    total_with_buffer = total_cost * (1 + BUFFER_PERCENTAGE)

    return {
        "total_estimated_cost": round(total_with_buffer, 6),
        "total_queries": len(config.intents) * len(config.models),
        "total_operations": total_operations,
        "per_intent_costs": per_intent_costs,
        "per_model_costs": per_model_costs,
        "per_operation_model_costs": per_operation_model_costs,
        "buffer_percentage": BUFFER_PERCENTAGE,
        "base_cost": round(total_cost, 6),
    }


def validate_budget(config: RuntimeConfig, cost_estimate: dict) -> None:
    """
    Validate estimated cost against budget limits.

    Checks budget configuration and raises BudgetExceededError if limits
    would be violated. Logs warnings if warn_threshold exceeded.

    Args:
        config: Runtime configuration with budget settings
        cost_estimate: Cost estimate from estimate_run_cost()

    Raises:
        BudgetExceededError: If max_per_run_usd or max_per_intent_usd exceeded

    Example:
        >>> estimate = estimate_run_cost(config)
        >>> validate_budget(config, estimate)  # Raises if budget exceeded
    """
    budget = config.run_settings.budget

    # No budget configured or disabled
    if not budget or not budget.enabled:
        logger.debug("Budget controls disabled or not configured")
        return

    total_cost = cost_estimate["total_estimated_cost"]
    per_intent_costs = cost_estimate["per_intent_costs"]

    # Check total run budget
    if budget.max_per_run_usd is not None and total_cost > budget.max_per_run_usd:
        raise BudgetExceededError(
            f"Estimated run cost ${total_cost:.4f} exceeds max_per_run_usd "
            f"budget of ${budget.max_per_run_usd:.2f}. "
            f"Run would execute {cost_estimate['total_queries']} queries. "
            f"Use --force to override or increase budget limit.",
            estimated_cost=total_cost,
            budget_limit=budget.max_per_run_usd,
            budget_type="per_run",
        )

    # Check per-intent budget
    if budget.max_per_intent_usd is not None:
        for intent_id, intent_cost in per_intent_costs.items():
            if intent_cost > budget.max_per_intent_usd:
                raise BudgetExceededError(
                    f"Estimated cost for intent '{intent_id}' (${intent_cost:.4f}) "
                    f"exceeds max_per_intent_usd budget of ${budget.max_per_intent_usd:.2f}. "
                    f"Use --force to override or increase budget limit.",
                    estimated_cost=intent_cost,
                    budget_limit=budget.max_per_intent_usd,
                    budget_type="per_intent",
                )

    # Check warning threshold
    if budget.warn_threshold_usd is not None and total_cost > budget.warn_threshold_usd:
        logger.warning(
            f"⚠️  Estimated cost ${total_cost:.4f} exceeds warning threshold "
            f"of ${budget.warn_threshold_usd:.2f}. Proceeding with execution."
        )


async def run_all(
    config: RuntimeConfig,
    progress_callback: Callable[[], None] | None = None,
    config_filename: str | None = None,
) -> dict:
    """
    Execute complete LLM query workflow with parallel execution and return results.

    This is the core orchestration function that runs all queries across
    all intents and models in parallel (with semaphore rate limiting),
    parses results, writes artifacts, and stores data in SQLite.

    **This is the internal API contract** - designed to be called in-process
    by OSS CLI or exposed over HTTP in Cloud version.

    Args:
        config: Runtime configuration with intents, models, API keys, paths
        progress_callback: Optional callback function to call after each query
            completes (successful or failed). Used by CLI to update progress bar.

    Returns:
        Summary dictionary with structure:
        {
            "run_id": "2025-11-02T08-00-00Z",
            "timestamp_utc": "2025-11-02T08:00:00Z",
            "output_dir": "./output/2025-11-02T08-00-00Z",
            "total_intents": 3,
            "total_models": 2,
            "total_queries": 6,
            "success_count": 5,
            "error_count": 1,
            "total_cost_usd": 0.0123,
            "errors": [
                {
                    "intent_id": "sales-tools",
                    "model_provider": "openai",
                    "model_name": "gpt-4o",
                    "error_message": "API rate limit exceeded"
                }
            ]
        }

    Raises:
        BudgetExceededError: If estimated cost exceeds configured budget limits
        OSError: If output directory cannot be created
        PermissionError: If insufficient permissions for file/DB operations
        Exception: Database errors are logged but don't stop execution

    Example:
        >>> config = load_config("examples/watcher.config.yaml")
        >>> result = await run_all(config)  # Note: now requires await
        >>> success = result['success_count']
        >>> total = result['total_queries']
        >>> print(f"Completed {success}/{total} queries")
        Completed 5/6 queries
        >>> print(f"Total cost: ${result['total_cost_usd']:.4f}")
        Total cost: $0.0123

    Implementation notes:
        - Queries are executed in parallel with semaphore rate limiting
        - Concurrency controlled by config.run_settings.max_concurrent_requests
        - Intent classification runs sequentially per intent before parallel execution
        - Each query failure is logged but doesn't stop execution
        - Error files are written for failed queries
        - Database operations remain synchronous (SQLite is fast for local ops)
        - Cost is estimated, not exact (depends on provider pricing)
    """
    # Generate run identifier from current UTC timestamp
    run_id = run_id_from_timestamp()
    timestamp_utc = utc_timestamp()

    # Count execution units (models + runners)
    num_models = len(config.models) if config.models else 0
    num_runners = len(config.runner_configs) if config.runner_configs else 0
    total_execution_units = num_models + num_runners

    logger.info(f"Starting run {run_id}")
    logger.info(
        f"Config: {len(config.intents)} intents, {num_models} models, "
        f"{num_runners} runners, output_dir={config.run_settings.output_dir}"
    )

    # Estimate cost and validate budget (if configured)
    cost_estimate = estimate_run_cost(config)
    logger.info(
        f"Estimated cost: ${cost_estimate['total_estimated_cost']:.4f} "
        f"for {cost_estimate['total_queries']} queries "
        f"(includes {int(cost_estimate['buffer_percentage'] * 100)}% buffer)"
    )

    try:
        validate_budget(config, cost_estimate)
    except BudgetExceededError as e:
        logger.error(f"Budget exceeded: {e}")
        raise

    # Create output directory for this run
    run_dir = create_run_directory(config.run_settings.output_dir, run_id)
    logger.info(f"Created run directory: {run_dir}")

    # Initialize tracking variables
    total_queries = len(config.intents) * total_execution_units
    success_count = 0
    error_count = 0
    total_cost_usd = 0.0
    total_operations_cost_usd = 0.0  # Track operations cost separately
    errors = []

    # Insert run record into database
    try:
        with sqlite3.connect(config.run_settings.sqlite_db_path) as conn:
            insert_run(
                conn=conn,
                run_id=run_id,
                timestamp_utc=timestamp_utc,
                total_intents=len(config.intents),
                total_models=total_execution_units,  # Models + runners
            )
            conn.commit()
        logger.debug(f"Inserted run record: run_id={run_id}")
    except Exception as e:
        logger.error(f"Failed to insert run record into database: {e}", exc_info=True)
        # Continue execution - database is not critical

    # Initialize semaphore for rate limiting concurrent requests
    max_concurrent = config.run_settings.max_concurrent_requests
    semaphore = asyncio.Semaphore(max_concurrent)
    logger.info(f"Parallelization enabled: max {max_concurrent} concurrent requests")

    # Define async wrapper for executing single query with semaphore
    async def _execute_query_with_semaphore(
        intent,
        model_config=None,
        runner_config=None,
    ):
        """
        Execute single query with semaphore rate limiting.

        Returns:
            tuple: (success: bool, cost_usd: float, error_dict: dict | None)
        """
        async with semaphore:
            # Determine if this is an API model or runner
            if model_config:
                provider = model_config.provider
                model_name = model_config.model_name
                logger.info(
                    f"Processing: intent={intent.id}, provider={provider}, model={model_name}"
                )
            else:
                provider = runner_config.runner_plugin
                model_name = "runner"
                logger.info(
                    f"Processing runner: intent={intent.id}, plugin={provider}"
                )

            # Construct query key for progress tracking
            query_key = f"{intent.id}_{provider}_{model_name}"

            # Notify progress callback of query start (if supported)
            if progress_callback and hasattr(progress_callback, "start_query"):
                await progress_callback.start_query(intent.id, provider, model_name)

            try:
                # Process API model
                if model_config:
                    # Build LLM client for this model
                    client = build_client(
                        provider=model_config.provider,
                        model_name=model_config.model_name,
                        api_key=model_config.api_key,
                        system_prompt=model_config.system_prompt,
                        tools=model_config.tools,
                        tool_choice=model_config.tool_choice,
                    )

                    # Generate answer with retry logic (await the async call)
                    response = await client.generate_answer(intent.prompt)

                    # Extract response data
                    answer_text = response.answer_text
                    cost_usd = response.cost_usd

                    # Create usage metadata for storage with actual token breakdown
                    usage_meta = {
                        "prompt_tokens": response.prompt_tokens,
                        "completion_tokens": response.completion_tokens,
                        "total_tokens": response.tokens_used,
                    }

                    # Create raw answer record
                    raw_record = RawAnswerRecord(
                        intent_id=intent.id,
                        prompt=intent.prompt,
                        model_provider=model_config.provider,
                        model_name=model_config.model_name,
                        timestamp_utc=utc_timestamp(),
                        answer_text=answer_text,
                        answer_length=len(answer_text),
                        usage_meta=usage_meta,
                        estimated_cost_usd=cost_usd,
                        web_search_results=response.web_search_results,
                        web_search_count=response.web_search_count,
                    )

                    # Write raw answer JSON
                    write_raw_answer(
                        run_dir=run_dir,
                        intent_id=intent.id,
                        provider=model_config.provider,
                        model=model_config.model_name,
                        data=asdict(raw_record),
                    )

                    # Insert raw answer into database
                    try:
                        # Serialize web search results to JSON if present
                        web_search_json = None
                        if response.web_search_results:
                            web_search_json = json.dumps(response.web_search_results)

                        with sqlite3.connect(config.run_settings.sqlite_db_path) as conn:
                            insert_answer_raw(
                                conn=conn,
                                run_id=run_id,
                                intent_id=intent.id,
                                model_provider=model_config.provider,
                                model_name=model_config.model_name,
                                timestamp_utc=raw_record.timestamp_utc,
                                prompt=intent.prompt,
                                answer_text=answer_text,
                                usage_meta_json=json.dumps(usage_meta),
                                estimated_cost_usd=cost_usd,
                                web_search_count=response.web_search_count,
                                web_search_results_json=web_search_json,
                                runner_type=raw_record.runner_type,
                                runner_name=raw_record.runner_name,
                                screenshot_path=raw_record.screenshot_path,
                                html_snapshot_path=raw_record.html_snapshot_path,
                                session_id=raw_record.session_id,
                            )
                            conn.commit()
                    except Exception as e:
                        logger.error(
                            f"Failed to insert answer into database: {e}", exc_info=True
                        )

                    # Parse answer to extract mentions and rankings
                    extraction_result = await parse_answer(
                        answer_text=answer_text,
                        brands=config.brands,
                        intent_id=intent.id,
                        provider=model_config.provider,
                        model_name=model_config.model_name,
                        timestamp_utc=raw_record.timestamp_utc,
                        extraction_settings=config.extraction_settings,
                    )

                    # Write parsed answer JSON
                    parsed_data = {
                        "appeared_mine": extraction_result.appeared_mine,
                        "my_mentions": [
                            {
                                "original_text": m.original_text,
                                "normalized_name": m.normalized_name,
                                "brand_category": m.brand_category,
                                "match_position": m.match_position,
                            }
                            for m in extraction_result.my_mentions
                        ],
                        "competitor_mentions": [
                            {
                                "original_text": m.original_text,
                                "normalized_name": m.normalized_name,
                                "brand_category": m.brand_category,
                                "match_position": m.match_position,
                            }
                            for m in extraction_result.competitor_mentions
                        ],
                        "ranked_list": [
                            {
                                "brand_name": r.brand_name,
                                "rank_position": r.rank_position,
                                "confidence": r.confidence,
                            }
                            for r in extraction_result.ranked_list
                        ],
                        "rank_extraction_method": extraction_result.rank_extraction_method,
                        "rank_confidence": extraction_result.rank_confidence,
                        "extraction_cost_usd": extraction_result.extraction_cost_usd,
                    }

                    write_parsed_answer(
                        run_dir=run_dir,
                        intent_id=intent.id,
                        provider=model_config.provider,
                        model=model_config.model_name,
                        data=parsed_data,
                    )

                    # Insert mentions into database
                    all_mentions = (
                        extraction_result.my_mentions
                        + extraction_result.competitor_mentions
                    )
                    for mention in all_mentions:
                        try:
                            # Determine if this is my brand
                            is_mine = mention.brand_category == "mine"

                            # Find rank position if this brand is in ranked list
                            rank_position = None
                            for ranked in extraction_result.ranked_list:
                                if ranked.brand_name == mention.normalized_name:
                                    rank_position = ranked.rank_position
                                    break

                            with sqlite3.connect(
                                config.run_settings.sqlite_db_path
                            ) as conn:
                                insert_mention(
                                    conn=conn,
                                    run_id=run_id,
                                    timestamp_utc=raw_record.timestamp_utc,
                                    intent_id=intent.id,
                                    model_provider=model_config.provider,
                                    model_name=model_config.model_name,
                                    brand_name=mention.original_text,
                                    normalized_name=mention.normalized_name,
                                    is_mine=is_mine,
                                    rank_position=rank_position,
                                    match_type="exact",
                                    sentiment=mention.sentiment,
                                    mention_context=mention.mention_context,
                                )
                                conn.commit()
                        except Exception as e:
                            logger.error(
                                f"Failed to insert mention into database: {e}",
                                exc_info=True,
                            )

                    # Execute operations if configured
                    operations_cost_usd = 0.0
                    if intent.operations or config.global_operations:
                        logger.info(f"Executing operations for intent={intent.id}")

                        # Combine intent-specific and global operations
                        all_operations = list(intent.operations) + list(
                            config.global_operations
                        )

                        # Build operation context
                        operation_context = OperationContext(
                            intent_data={
                                "id": intent.id,
                                "prompt": intent.prompt,
                                "response": answer_text,
                            },
                            extraction_data={
                                "my_brand": config.brands.mine[0]
                                if config.brands.mine
                                else "unknown",
                                "my_brand_aliases": config.brands.mine,
                                "competitors": config.brands.competitors,
                                "competitors_mentioned": [
                                    m.normalized_name
                                    for m in extraction_result.competitor_mentions
                                ],
                                "my_rank": extraction_result.ranked_list[0].rank_position
                                if extraction_result.ranked_list
                                and extraction_result.appeared_mine
                                else None,
                                "my_mentions": [
                                    m.original_text for m in extraction_result.my_mentions
                                ],
                                "competitor_mentions": [
                                    m.original_text
                                    for m in extraction_result.competitor_mentions
                                ],
                            },
                            run_metadata={
                                "run_id": run_id,
                                "timestamp": timestamp_utc,
                            },
                            model_info={
                                "provider": model_config.provider,
                                "name": model_config.model_name,
                            },
                        )

                        # Execute operations
                        operation_results = await execute_operations_with_dependencies(
                            operations=all_operations,
                            context=operation_context,
                            runtime_config=config,
                        )

                        # Store operation results
                        for execution_order, (op_id, op_result) in enumerate(
                            operation_results.items()
                        ):
                            operations_cost_usd += op_result.cost_usd

                            # Write JSON artifact
                            operation_data = asdict(op_result)
                            write_operation_result(
                                run_dir=run_dir,
                                intent_id=intent.id,
                                operation_id=op_id,
                                provider=op_result.model_provider,
                                model=op_result.model_name,
                                data=operation_data,
                            )

                            # Insert into database
                            try:
                                operation = next(
                                    (o for o in all_operations if o.id == op_id), None
                                )
                                with sqlite3.connect(
                                    config.run_settings.sqlite_db_path
                                ) as conn:
                                    insert_operation(
                                        conn=conn,
                                        run_id=run_id,
                                        intent_id=intent.id,
                                        model_provider=op_result.model_provider,
                                        model_name=op_result.model_name,
                                        operation_id=op_id,
                                        operation_description=operation.description
                                        if operation
                                        else None,
                                        operation_prompt=op_result.rendered_prompt,
                                        result_text=op_result.result_text,
                                        tokens_used_input=op_result.tokens_used_input,
                                        tokens_used_output=op_result.tokens_used_output,
                                        cost_usd=op_result.cost_usd,
                                        timestamp_utc=op_result.timestamp_utc,
                                        depends_on=operation.depends_on
                                        if operation
                                        else [],
                                        execution_order=execution_order,
                                        skipped=op_result.skipped,
                                        error=op_result.error,
                                    )
                                    conn.commit()
                            except Exception as e:
                                logger.error(
                                    f"Failed to insert operation into database: {e}",
                                    exc_info=True,
                                )

                        logger.info(
                            f"Completed {len(operation_results)} operations, cost=${operations_cost_usd:.6f}"
                        )

                    # Calculate total cost for this query
                    total_query_cost = cost_usd + extraction_result.extraction_cost_usd + operations_cost_usd

                    # Log with extraction cost breakdown if applicable
                    if extraction_result.extraction_cost_usd > 0:
                        logger.info(
                            f"Success: intent={intent.id}, provider={model_config.provider}, "
                            f"model={model_config.model_name}, "
                            f"answer_cost=${cost_usd:.6f}, "
                            f"extraction_cost=${extraction_result.extraction_cost_usd:.6f}, "
                            f"total=${cost_usd + extraction_result.extraction_cost_usd:.6f}, "
                            f"appeared_mine={extraction_result.appeared_mine}, "
                            f"extraction_method={extraction_result.rank_extraction_method}"
                        )
                    else:
                        logger.info(
                            f"Success: intent={intent.id}, provider={model_config.provider}, "
                            f"model={model_config.model_name}, cost=${cost_usd:.6f}, "
                            f"appeared_mine={extraction_result.appeared_mine}"
                        )

                    # Call progress callback if provided
                    if progress_callback:
                        if hasattr(progress_callback, "complete_query"):
                            await progress_callback.complete_query(query_key, success=True)
                        else:
                            progress_callback()

                    return (True, total_query_cost, None, operations_cost_usd)

                # Process browser/custom runner
                # Create runner instance via plugin registry
                runner = RunnerRegistry.create_runner(
                    plugin_name=runner_config.runner_plugin,
                    config=runner_config.config,
                )

                # Execute intent via runner
                result = runner.run_intent(intent.prompt)

                # Check if execution was successful
                if not result.success:
                    raise Exception(
                        result.error_message or "Runner execution failed (no error message)"
                    )

                # Convert IntentResult to RawAnswerRecord
                raw_record = intent_result_to_raw_record(
                    result=result, intent_id=intent.id, prompt=intent.prompt
                )

                # Write raw answer JSON
                write_raw_answer(
                    run_dir=run_dir,
                    intent_id=intent.id,
                    provider=result.provider,
                    model=result.model_name,
                    data=asdict(raw_record),
                )

                # Insert raw answer into database
                try:
                    # Serialize web search results to JSON if present
                    web_search_json = None
                    if result.web_search_results:
                        web_search_json = json.dumps(result.web_search_results)

                    with sqlite3.connect(config.run_settings.sqlite_db_path) as conn:
                        insert_answer_raw(
                            conn=conn,
                            run_id=run_id,
                            intent_id=intent.id,
                            model_provider=result.provider,
                            model_name=result.model_name,
                            timestamp_utc=raw_record.timestamp_utc,
                            prompt=intent.prompt,
                            answer_text=result.answer_text,
                            usage_meta_json=json.dumps(raw_record.usage_meta),
                            estimated_cost_usd=result.cost_usd,
                            web_search_count=raw_record.web_search_count,
                            web_search_results_json=web_search_json,
                            runner_type=result.runner_type,
                            runner_name=result.runner_name,
                            screenshot_path=result.screenshot_path,
                            html_snapshot_path=result.html_snapshot_path,
                            session_id=result.session_id,
                        )
                        conn.commit()
                except Exception as e:
                    logger.error(
                        f"Failed to insert runner answer into database: {e}",
                        exc_info=True,
                    )

                # Parse answer to extract mentions and rankings
                extraction_result = await parse_answer(
                    answer_text=result.answer_text,
                    brands=config.brands,
                    intent_id=intent.id,
                    provider=result.provider,
                    model_name=result.model_name,
                    timestamp_utc=raw_record.timestamp_utc,
                    extraction_settings=config.extraction_settings,
                )

                # Write parsed answer JSON
                write_parsed_answer(
                    run_dir=run_dir,
                    intent_id=intent.id,
                    provider=result.provider,
                    model=result.model_name,
                    data=asdict(extraction_result),
                )

                # Insert mentions into database
                all_mentions = (
                    extraction_result.my_mentions
                    + extraction_result.competitor_mentions
                )
                for mention in all_mentions:
                    try:
                        # Determine if this is my brand
                        is_mine = mention.brand_category == "mine"

                        # Find rank position if this brand is in ranked list
                        rank_position = None
                        for ranked in extraction_result.ranked_list:
                            if ranked.brand_name == mention.normalized_name:
                                rank_position = ranked.rank_position
                                break

                        with sqlite3.connect(
                            config.run_settings.sqlite_db_path
                        ) as conn:
                            insert_mention(
                                conn=conn,
                                run_id=run_id,
                                timestamp_utc=raw_record.timestamp_utc,
                                intent_id=intent.id,
                                model_provider=result.provider,
                                model_name=result.model_name,
                                brand_name=mention.original_text,
                                normalized_name=mention.normalized_name,
                                is_mine=is_mine,
                                rank_position=rank_position,
                                match_type="exact",
                                sentiment=mention.sentiment,
                                mention_context=mention.mention_context,
                            )
                            conn.commit()
                    except Exception as e:
                        logger.error(
                            f"Failed to insert runner mention into database: {e}",
                            exc_info=True,
                        )

                # Calculate total cost for this query
                total_query_cost = result.cost_usd + extraction_result.extraction_cost_usd

                # Log success
                if extraction_result.extraction_cost_usd > 0:
                    logger.info(
                        f"Success: intent={intent.id}, runner={runner_config.runner_plugin}, "
                        f"runner_cost=${result.cost_usd:.6f}, "
                        f"extraction_cost=${extraction_result.extraction_cost_usd:.6f}, "
                        f"total=${result.cost_usd + extraction_result.extraction_cost_usd:.6f}, "
                        f"appeared_mine={extraction_result.appeared_mine}"
                    )
                else:
                    logger.info(
                        f"Success: intent={intent.id}, runner={runner_config.runner_plugin}, "
                        f"cost=${result.cost_usd:.6f}, "
                        f"appeared_mine={extraction_result.appeared_mine}"
                    )

                # Call progress callback if provided
                if progress_callback:
                    if hasattr(progress_callback, "complete_query"):
                        await progress_callback.complete_query(query_key, success=True)
                    else:
                        progress_callback()

                return (True, total_query_cost, None, 0.0)  # Browser runners don't support operations yet

            except Exception as e:
                # Query failed - write error file and track
                error_message = str(e)

                if model_config:
                    logger.error(
                        f"Failed query: intent={intent.id}, "
                        f"provider={model_config.provider}, "
                        f"model={model_config.model_name}, error={error_message}",
                        exc_info=True,
                    )

                    write_error(
                        run_dir=run_dir,
                        intent_id=intent.id,
                        provider=model_config.provider,
                        model=model_config.model_name,
                        error_message=error_message,
                    )

                    error_dict = {
                        "intent_id": intent.id,
                        "model_provider": model_config.provider,
                        "model_name": model_config.model_name,
                        "error_message": error_message,
                    }
                else:
                    logger.error(
                        f"Failed runner: intent={intent.id}, "
                        f"plugin={runner_config.runner_plugin}, "
                        f"error={error_message}",
                        exc_info=True,
                    )

                    write_error(
                        run_dir=run_dir,
                        intent_id=intent.id,
                        provider=runner_config.runner_plugin,
                        model="runner",
                        error_message=error_message,
                    )

                    error_dict = {
                        "intent_id": intent.id,
                        "model_provider": runner_config.runner_plugin,
                        "model_name": "runner",
                        "error_message": error_message,
                    }

                # Call progress callback if provided (even for errors)
                if progress_callback:
                    if hasattr(progress_callback, "complete_query"):
                        await progress_callback.complete_query(query_key, success=False)
                    else:
                        progress_callback()

                return (False, 0.0, error_dict, 0.0)

    # Build list of tasks for all (intent x model) and (intent x runner) combinations
    tasks = []

    for intent in config.intents:
        # Classify intent before running queries (if enabled)
        intent_classification_cost = 0.0
        if (
            config.extraction_settings
            and config.extraction_settings.enable_intent_classification
        ):
            try:
                logger.info(f"Classifying intent: {intent.id}")
                classification_result = await classify_intent(
                    query=intent.prompt,
                    extraction_settings=config.extraction_settings,
                    intent_id=intent.id,
                    db_path=config.run_settings.sqlite_db_path,
                )

                # Store classification in database
                try:
                    with sqlite3.connect(config.run_settings.sqlite_db_path) as conn:
                        insert_intent_classification(
                            conn=conn,
                            run_id=run_id,
                            intent_id=intent.id,
                            intent_type=classification_result.intent_type,
                            buyer_stage=classification_result.buyer_stage,
                            urgency_signal=classification_result.urgency_signal,
                            classification_confidence=classification_result.classification_confidence,
                            timestamp_utc=utc_timestamp(),
                            reasoning=classification_result.reasoning,
                            extraction_cost_usd=classification_result.extraction_cost_usd,
                        )
                        conn.commit()
                    logger.info(
                        f"Intent classification stored: {intent.id} -> "
                        f"{classification_result.intent_type}/{classification_result.buyer_stage}/"
                        f"{classification_result.urgency_signal} "
                        f"(confidence={classification_result.classification_confidence:.2f})"
                    )
                except Exception as e:
                    logger.error(
                        f"Failed to insert intent classification into database: {e}",
                        exc_info=True,
                    )

                # Track classification cost
                intent_classification_cost = classification_result.extraction_cost_usd
                total_cost_usd += intent_classification_cost

            except Exception as e:
                logger.warning(
                    f"Intent classification failed for {intent.id}: {e}",
                    exc_info=True,
                )
                # Continue execution - classification is not critical

        # Create tasks for API models (if configured)
        if config.models:
            for model_config in config.models:
                task = _execute_query_with_semaphore(
                    intent=intent,
                    model_config=model_config,
                    runner_config=None,
                )
                tasks.append(task)

        # Create tasks for browser/custom runners (if configured)
        if config.runner_configs:
            for runner_config in config.runner_configs:
                task = _execute_query_with_semaphore(
                    intent=intent,
                    model_config=None,
                    runner_config=runner_config,
                )
                tasks.append(task)

    # Execute all tasks in parallel with semaphore limiting concurrency
    logger.info(f"Executing {len(tasks)} queries in parallel...")
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Process results
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.error(f"Task {i} failed with exception: {result}")
            error_count += 1
        elif result[0]:  # Success
            success_count += 1
            total_cost_usd += result[1]
            total_operations_cost_usd += result[3]  # Track operations cost separately
        else:  # Returned error
            error_count += 1
            total_cost_usd += result[1]
            total_operations_cost_usd += result[3]  # Track operations cost even on error
            if result[2]:
                errors.append(result[2])

    # Generate run metadata summary
    run_meta = {
        "run_id": run_id,
        "timestamp_utc": timestamp_utc,
        "config_filename": config_filename,
        "output_dir": run_dir,
        "total_intents": len(config.intents),
        "total_models": len(config.models),
        "total_queries": total_queries,
        "success_count": success_count,
        "error_count": error_count,
        "total_cost_usd": round(total_cost_usd, 6),
        "total_llm_cost_usd": round(total_cost_usd - total_operations_cost_usd, 6),
        "total_operations_cost_usd": round(total_operations_cost_usd, 6),
        "my_brands": config.brands.mine,
        "competitors": config.brands.competitors,
        "database_path": config.run_settings.sqlite_db_path,
    }

    # Write run metadata JSON
    write_run_meta(run_dir=run_dir, meta=run_meta)

    logger.info(
        f"Run {run_id} complete: {success_count}/{total_queries} successful, "
        f"total_cost=${total_cost_usd:.6f}"
    )

    # Return summary dict (for API contract)
    return {
        "run_id": run_id,
        "timestamp_utc": timestamp_utc,
        "output_dir": run_dir,
        "total_intents": len(config.intents),
        "total_models": len(config.models),
        "total_queries": total_queries,
        "success_count": success_count,
        "error_count": error_count,
        "total_cost_usd": round(total_cost_usd, 6),
        "total_llm_cost_usd": round(total_cost_usd - total_operations_cost_usd, 6),
        "total_operations_cost_usd": round(total_operations_cost_usd, 6),
        "errors": errors,
    }
