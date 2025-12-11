"""
Operation executor for custom post-intent operations.

This module provides the core functionality for executing custom operations
after intent responses are received. Operations support:
- Template variable substitution
- Dependency chaining (topological sort)
- Conditional execution
- Cost tracking
- Multiple output formats

Key responsibilities:
- Render operation prompts with template variables
- Execute operations in dependency order
- Track costs and token usage
- Handle conditional execution logic
- Support operation chaining via depends_on

Architecture:
    OperationContext: Data container for template rendering
    OperationResult: Structured result from operation execution
    render_template(): Template variable substitution
    evaluate_condition(): Conditional execution logic
    execute_operation(): Execute single operation
    execute_operations_with_dependencies(): Execute multiple operations with DAG resolution

Example:
    >>> context = OperationContext(
    ...     intent_data={"id": "test", "response": "..."},
    ...     extraction_data={"mentions": {...}},
    ...     run_metadata={"run_id": "2025-11-05T10-00-00Z"}
    ... )
    >>> result = execute_operation(operation, context, runtime_config)
    >>> print(result.result_text)
"""

import logging
import re
from collections import defaultdict
from dataclasses import dataclass
from typing import Any

from ..config.schema import RuntimeConfig, RuntimeOperation
from ..llm_runner.models import LLMResponse, build_client
from ..utils.time import utc_timestamp

logger = logging.getLogger(__name__)


@dataclass
class OperationContext:
    """
    Template rendering context for operations.

    Contains all data needed to render operation prompt templates,
    including intent data, extraction results, run metadata, and
    previous operation results for chaining.

    Attributes:
        intent_data: Intent information (id, prompt, response)
        extraction_data: Brand mention extraction results
        run_metadata: Run ID and timestamp
        model_info: Model provider and name
        operation_results: Results from previous operations (for chaining)

    Example:
        >>> context = OperationContext(
        ...     intent_data={
        ...         "id": "best-email-warmup",
        ...         "prompt": "What are the best email warmup tools?",
        ...         "response": "Here are the top tools: ..."
        ...     },
        ...     extraction_data={
        ...         "my_brand": "Instantly.ai",
        ...         "my_rank": 3,
        ...         "mentions": [...]
        ...     },
        ...     run_metadata={
        ...         "run_id": "2025-11-05T10-00-00Z",
        ...         "timestamp": "2025-11-05T10:00:00Z"
        ...     },
        ...     model_info={
        ...         "provider": "openai",
        ...         "name": "gpt-4o-mini"
        ...     },
        ...     operation_results={}
        ... )
    """

    intent_data: dict[str, Any]
    extraction_data: dict[str, Any]
    run_metadata: dict[str, str]
    model_info: dict[str, str]
    operation_results: dict[str, str] = None

    def __post_init__(self):
        """Initialize operation_results if not provided."""
        if self.operation_results is None:
            self.operation_results = {}


@dataclass
class OperationResult:
    """
    Structured result from operation execution.

    Contains the operation output along with metadata needed for
    storage and cost tracking.

    Attributes:
        operation_id: Operation identifier
        result_text: Raw text output from LLM
        tokens_used_input: Input token count
        tokens_used_output: Output token count
        cost_usd: Estimated cost in USD
        timestamp_utc: When operation executed (ISO 8601)
        model_provider: Provider used (e.g., "openai")
        model_name: Model used (e.g., "gpt-4o-mini")
        rendered_prompt: Rendered prompt (with variables substituted)
        skipped: Whether operation was skipped due to condition
        error: Error message if operation failed
    """

    operation_id: str
    result_text: str
    tokens_used_input: int
    tokens_used_output: int
    cost_usd: float
    timestamp_utc: str
    model_provider: str
    model_name: str
    rendered_prompt: str
    skipped: bool = False
    error: str | None = None


def render_template(template: str, context: OperationContext) -> str:
    """
    Render operation prompt template with variable substitution.

    Supported variables:
        {brand:mine} - Primary brand name
        {brand:mine_all} - All brand aliases (comma-separated)
        {brand:competitors} - All competitors (comma-separated)
        {competitors:mentioned} - Competitors found in response
        {intent:id} - Intent identifier
        {intent:prompt} - Original intent prompt
        {intent:response} - Raw LLM response
        {rank:mine} - My brand's rank ("not found" if missing)
        {mentions:mine} - My brand mentions (comma-separated)
        {mentions:competitors} - Competitor mentions (comma-separated)
        {operation:operation_id} - Previous operation result
        {model:provider} - Model provider
        {model:name} - Model name
        {run:id} - Run ID
        {run:timestamp} - UTC timestamp

    Args:
        template: Prompt template with variable placeholders
        context: Operation context with data for substitution

    Returns:
        Rendered prompt string with all variables substituted

    Example:
        >>> template = "Analyze {brand:mine} (rank {rank:mine}) in: {intent:response}"
        >>> rendered = render_template(template, context)
        >>> print(rendered)
        Analyze Instantly.ai (rank 3) in: Here are the top tools...
    """
    rendered = template

    # Brand variables
    my_brand = context.extraction_data.get("my_brand", "unknown")
    my_brand_aliases = context.extraction_data.get("my_brand_aliases", [])
    competitors = context.extraction_data.get("competitors", [])
    competitors_mentioned = context.extraction_data.get("competitors_mentioned", [])

    rendered = rendered.replace("{brand:mine}", my_brand)
    rendered = rendered.replace("{brand:mine_all}", ", ".join(my_brand_aliases))
    rendered = rendered.replace("{brand:competitors}", ", ".join(competitors))
    rendered = rendered.replace(
        "{competitors:mentioned}", ", ".join(competitors_mentioned)
    )

    # Intent variables
    rendered = rendered.replace("{intent:id}", context.intent_data.get("id", ""))
    rendered = rendered.replace(
        "{intent:prompt}", context.intent_data.get("prompt", "")
    )
    rendered = rendered.replace(
        "{intent:response}", context.intent_data.get("response", "")
    )

    # Rank and mention variables
    my_rank = context.extraction_data.get("my_rank")
    rank_str = str(my_rank) if my_rank is not None else "not found"
    rendered = rendered.replace("{rank:mine}", rank_str)

    my_mentions = context.extraction_data.get("my_mentions", [])
    competitor_mentions = context.extraction_data.get("competitor_mentions", [])
    rendered = rendered.replace("{mentions:mine}", ", ".join(my_mentions))
    rendered = rendered.replace(
        "{mentions:competitors}", ", ".join(competitor_mentions)
    )

    # Model variables
    rendered = rendered.replace(
        "{model:provider}", context.model_info.get("provider", "")
    )
    rendered = rendered.replace("{model:name}", context.model_info.get("name", ""))

    # Run metadata variables
    rendered = rendered.replace("{run:id}", context.run_metadata.get("run_id", ""))
    rendered = rendered.replace(
        "{run:timestamp}", context.run_metadata.get("timestamp", "")
    )

    # Operation chaining variables
    for op_id, op_result in context.operation_results.items():
        placeholder = f"{{operation:{op_id}}}"
        rendered = rendered.replace(placeholder, op_result)

    return rendered


def evaluate_condition(condition: str, context: OperationContext) -> bool:
    """
    Evaluate conditional expression for operation execution.

    Supports simple comparison expressions:
        {rank:mine} == null
        {rank:mine} > 3
        {rank:mine} <= 5
        {competitors:mentioned} contains "HubSpot"

    Args:
        condition: Condition string with variables
        context: Operation context for variable substitution

    Returns:
        True if condition evaluates to true, False otherwise

    Example:
        >>> condition = "{rank:mine} > 3"
        >>> result = evaluate_condition(condition, context)
        >>> print(result)
        True
    """
    # First render the condition template
    rendered = render_template(condition, context)

    # Handle null checks
    if "== null" in rendered:
        return "not found == null" in rendered

    # Handle numeric comparisons
    match = re.match(r"(\d+|not found)\s*(==|!=|>|<|>=|<=)\s*(\d+)", rendered)
    if match:
        left, op, right = match.groups()
        if left == "not found":
            return False  # Can't compare non-numeric

        left_val = int(left)
        right_val = int(right)

        # Use operator mapping to reduce return statements
        comparisons = {
            "==": lambda left, right: left == right,
            "!=": lambda left, right: left != right,
            ">": lambda left, right: left > right,
            "<": lambda left, right: left < right,
            ">=": lambda left, right: left >= right,
            "<=": lambda left, right: left <= right,
        }
        if op in comparisons:
            return comparisons[op](left_val, right_val)

    # Handle string contains checks
    if " contains " in rendered:
        parts = rendered.split(" contains ")
        if len(parts) == 2:
            haystack = parts[0].strip()
            needle = parts[1].strip().strip('"').strip("'")
            return needle in haystack

    # Default: condition not understood, don't skip
    logger.warning(f"Could not evaluate condition: {condition} (rendered: {rendered})")
    return True


async def execute_operation(
    operation: RuntimeOperation,
    context: OperationContext,
    runtime_config: RuntimeConfig,
) -> OperationResult:
    """
    Execute single operation with template rendering and LLM call.

    Steps:
    1. Check if operation is enabled
    2. Evaluate condition if specified
    3. Render prompt template with context
    4. Select model (operation override or default from config)
    5. Call LLM with rendered prompt
    6. Return structured result

    Args:
        operation: Operation configuration to execute
        context: Template rendering context
        runtime_config: Runtime config with model configurations

    Returns:
        OperationResult with output and metadata

    Raises:
        ValueError: If model not found or operation fails

    Example:
        >>> operation = RuntimeOperation(
        ...     id="content-gaps",
        ...     prompt="Analyze {intent:response}",
        ...     runtime_model=None  # Use default
        ... )
        >>> result = execute_operation(operation, context, runtime_config)
        >>> print(result.result_text)
    """
    # Check if operation is disabled
    if not operation.enabled:
        logger.info(f"Operation '{operation.id}' is disabled, skipping")
        return OperationResult(
            operation_id=operation.id,
            result_text="",
            tokens_used_input=0,
            tokens_used_output=0,
            cost_usd=0.0,
            timestamp_utc=utc_timestamp(),
            model_provider="",
            model_name="",
            rendered_prompt="",
            skipped=True,
        )

    # Evaluate condition if specified
    if operation.condition and not evaluate_condition(operation.condition, context):
        logger.info(
            f"Operation '{operation.id}' condition not met, skipping: {operation.condition}"
        )
        return OperationResult(
            operation_id=operation.id,
            result_text="",
            tokens_used_input=0,
            tokens_used_output=0,
            cost_usd=0.0,
            timestamp_utc=utc_timestamp(),
            model_provider="",
            model_name="",
            rendered_prompt="",
            skipped=True,
        )

    # Render template
    rendered_prompt = render_template(operation.prompt, context)

    # Select model (priority: explicit override > operation_models > models)
    if operation.runtime_model:
        # Operation has specific model override
        model = operation.runtime_model
        logger.debug(f"Operation '{operation.id}' using explicit model override")
    elif runtime_config.operation_models:
        # Use first operation model as default
        model = runtime_config.operation_models[0]
        logger.debug(
            f"Operation '{operation.id}' using operation_models pool "
            f"({model.model_name})"
        )
    elif runtime_config.models:
        # Fall back to intent models if no operation models configured
        model = runtime_config.models[0]
        logger.debug(
            f"Operation '{operation.id}' using models pool as fallback "
            f"({model.model_name})"
        )
    else:
        raise ValueError(
            "No models configured for operations. "
            "Please configure either run_settings.operation_models or run_settings.models"
        )

    logger.info(
        f"Executing operation '{operation.id}' using {model.provider}/{model.model_name}"
    )

    try:
        # Determine if function calling should be used
        tools = None
        tool_choice = "auto"

        if operation.type == "structured":
            # Build function calling tools for structured operations
            if operation.function_schema:
                # Use inline schema
                tools = [operation.function_schema]
                tool_choice = "required"  # Force function call
                logger.debug(
                    f"Operation '{operation.id}' using inline function_schema: "
                    f"{operation.function_schema.get('name')}"
                )

            elif operation.function_template:
                # Load from built-in templates
                from .operation_templates import (
                    apply_function_params,
                    load_function_template,
                )

                schema = load_function_template(operation.function_template)

                # Apply any parameter overrides
                if operation.function_params:
                    schema = apply_function_params(schema, operation.function_params)
                    logger.debug(
                        f"Operation '{operation.id}' applied function_params overrides"
                    )

                tools = [schema]
                tool_choice = "required"  # Force function call
                logger.debug(
                    f"Operation '{operation.id}' using function_template: "
                    f"{operation.function_template}"
                )

        # Build client with tools if needed
        client = build_client(
            provider=model.provider,
            model_name=model.model_name,
            api_key=model.api_key,
            system_prompt=model.system_prompt,
            tools=tools,  # None for standard, schema for structured
            tool_choice=tool_choice,  # "auto" for standard, "required" for structured
        )

        # Execute
        response: LLMResponse = await client.generate_answer(rendered_prompt)

        # Parse response based on operation type
        result_text = response.answer_text

        if operation.type == "structured":
            # Parse function call result and format as JSON
            try:
                import json

                from ..extractor.function_extractor import parse_function_call_response

                function_result = parse_function_call_response(response)
                result_text = json.dumps(function_result, indent=2)
                logger.debug(
                    f"Operation '{operation.id}' successfully parsed function call result"
                )
            except Exception as parse_error:
                logger.warning(
                    f"Failed to parse function call for operation '{operation.id}': {parse_error}. "
                    f"Using raw response as fallback."
                )
                # Keep raw response as fallback

        return OperationResult(
            operation_id=operation.id,
            result_text=result_text,
            tokens_used_input=response.prompt_tokens,
            tokens_used_output=response.completion_tokens,
            cost_usd=response.cost_usd,
            timestamp_utc=response.timestamp_utc,
            model_provider=response.provider,
            model_name=response.model_name,
            rendered_prompt=rendered_prompt,
            skipped=False,
        )

    except Exception as e:
        logger.error(f"Operation '{operation.id}' failed: {e}")
        return OperationResult(
            operation_id=operation.id,
            result_text="",
            tokens_used_input=0,
            tokens_used_output=0,
            cost_usd=0.0,
            timestamp_utc=utc_timestamp(),
            model_provider=model.provider,
            model_name=model.model_name,
            rendered_prompt=rendered_prompt,
            skipped=False,
            error=str(e),
        )


def topological_sort(operations: list[RuntimeOperation]) -> list[RuntimeOperation]:
    """
    Sort operations in dependency order using topological sort (Kahn's algorithm).

    Ensures operations are executed after all their dependencies.
    Already validated that no circular dependencies exist (done in config validation).

    Args:
        operations: List of operations to sort

    Returns:
        Operations sorted in dependency order (dependencies first)

    Example:
        >>> ops = [
        ...     RuntimeOperation(id="c", depends_on=["a", "b"]),
        ...     RuntimeOperation(id="a", depends_on=[]),
        ...     RuntimeOperation(id="b", depends_on=["a"])
        ... ]
        >>> sorted_ops = topological_sort(ops)
        >>> print([op.id for op in sorted_ops])
        ['a', 'b', 'c']
    """
    # Build adjacency list and in-degree map
    op_map = {op.id: op for op in operations}
    in_degree = defaultdict(int)
    adjacency = defaultdict(list)

    # Initialize in-degrees
    for op in operations:
        if op.id not in in_degree:
            in_degree[op.id] = 0

    # Build graph
    for op in operations:
        for dep_id in op.depends_on:
            adjacency[dep_id].append(op.id)
            in_degree[op.id] += 1

    # Kahn's algorithm
    queue = [op_id for op_id in op_map if in_degree[op_id] == 0]
    sorted_ids = []

    while queue:
        # Process node with no dependencies
        current_id = queue.pop(0)
        sorted_ids.append(current_id)

        # Reduce in-degree for dependents
        for dependent_id in adjacency[current_id]:
            in_degree[dependent_id] -= 1
            if in_degree[dependent_id] == 0:
                queue.append(dependent_id)

    # Convert back to operations list
    return [op_map[op_id] for op_id in sorted_ids]


async def execute_operations_with_dependencies(
    operations: list[RuntimeOperation],
    context: OperationContext,
    runtime_config: RuntimeConfig,
) -> dict[str, OperationResult]:
    """
    Execute operations in dependency order (topological sort).

    Handles:
    - Dependency resolution via topological sort
    - Sequential execution with context updates
    - Operation chaining (results passed to dependent operations)
    - Error handling (continue on failure)

    Args:
        operations: List of operations to execute
        context: Template rendering context
        runtime_config: Runtime configuration

    Returns:
        Dictionary mapping operation ID to OperationResult

    Example:
        >>> results = execute_operations_with_dependencies(ops, context, runtime_config)
        >>> print(results["content-gaps"].result_text)
        Create blog posts about...
    """
    if not operations:
        return {}

    # Sort operations by dependencies
    sorted_operations = topological_sort(operations)

    logger.info(
        f"Executing {len(sorted_operations)} operations in dependency order: "
        f"{[op.id for op in sorted_operations]}"
    )

    results: dict[str, OperationResult] = {}

    for operation in sorted_operations:
        # Execute operation
        result = await execute_operation(operation, context, runtime_config)
        results[operation.id] = result

        # Update context with result for chaining
        if not result.skipped and not result.error:
            context.operation_results[operation.id] = result.result_text

        # Log result
        if result.skipped:
            logger.info(f"Operation '{operation.id}' skipped")
        elif result.error:
            logger.error(f"Operation '{operation.id}' failed: {result.error}")
        else:
            logger.info(
                f"Operation '{operation.id}' completed: "
                f"{result.tokens_used_input + result.tokens_used_output} tokens, "
                f"${result.cost_usd:.4f}"
            )

    return results
