"""
Rich console utilities for dual-mode CLI output.

Provides beautiful terminal output for humans and structured JSON for AI agents.
All output functions automatically adapt based on the global output_mode setting.

This module provides:
- OutputMode: Class to manage output format (text/json/quiet)
- Context managers: spinner(), create_progress_bar()
- Output functions: success(), error(), warning(), info()
- Display functions: print_summary_table(), print_banner(), print_final_summary()

Human Mode (--format text):
    - Rich spinners, progress bars, colored tables
    - Fancy panels and banners
    - ANSI colors and Unicode symbols

Agent Mode (--format json):
    - Structured JSON output to stdout
    - No ANSI codes or spinners
    - Machine-readable format

Quiet Mode (--quiet):
    - Minimal output
    - Tab-separated values
    - No decorations

Examples:
    >>> from utils.console import output_mode, spinner, success, print_summary_table
    >>> output_mode.format = "text"  # Human mode
    >>> with spinner("Loading..."):
    ...     config = load_config()
    >>> success("Config loaded successfully")

    >>> output_mode.format = "json"  # Agent mode
    >>> success("Config loaded")  # Buffers to JSON
    >>> output_mode.flush_json()   # Outputs JSON to stdout
"""

from __future__ import annotations

import json
import sys
from contextlib import contextmanager
from typing import Any

from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.progress import (
    BarColumn,
    Progress,
    SpinnerColumn,
    TaskProgressColumn,
    TextColumn,
    TimeRemainingColumn,
)
from rich.table import Table


class OutputMode:
    """
    Output mode configuration for dual-mode CLI.

    Controls how messages and data are displayed to the user.
    Switches between human-friendly (Rich), agent-friendly (JSON),
    and minimal (quiet) output modes.

    Attributes:
        format: Output format - "text" (human) or "json" (agent)
        quiet: If True, suppress non-essential output
        _json_buffer: Internal buffer for JSON output in agent mode

    Examples:
        >>> mode = OutputMode()
        >>> mode.is_human()
        True
        >>> mode.format = "json"
        >>> mode.is_agent()
        True
    """

    def __init__(self, format_type: str = "text", quiet: bool = False):
        """
        Initialize output mode.

        Args:
            format_type: Output format - "text" for human, "json" for agent
            quiet: If True, suppress non-essential output

        Raises:
            ValueError: If format_type is not "text" or "json"
        """
        if format_type not in ["text", "json"]:
            raise ValueError(f"Invalid format: {format_type}. Must be 'text' or 'json'")

        self.format = format_type
        self.quiet = quiet
        self._json_buffer: dict[str, Any] = {}

    def is_human(self) -> bool:
        """
        Check if in human-friendly mode.

        Returns:
            True if format is "text" and not quiet
        """
        return self.format == "text"

    def is_agent(self) -> bool:
        """
        Check if in agent-friendly mode.

        Returns:
            True if format is "json"
        """
        return self.format == "json"

    def add_json(self, key: str, value: Any) -> None:
        """
        Add key-value pair to JSON buffer.

        Used in agent mode to accumulate structured data
        before final output via flush_json().

        Args:
            key: JSON key
            value: JSON-serializable value

        Example:
            >>> mode = OutputMode(format="json")
            >>> mode.add_json("status", "success")
            >>> mode.add_json("count", 5)
            >>> mode.flush_json()
            {"status": "success", "count": 5}
        """
        self._json_buffer[key] = value

    def flush_json(self) -> None:
        """
        Output buffered JSON to stdout and clear buffer.

        Only outputs in agent mode. In human mode, this is a no-op.
        After flushing, the buffer is cleared.

        Example:
            >>> mode = OutputMode(format="json")
            >>> mode.add_json("status", "success")
            >>> mode.flush_json()
            {"status": "success"}
        """
        if self.is_agent() and self._json_buffer:
            json.dump(self._json_buffer, sys.stdout, indent=2)
            sys.stdout.write("\n")
            sys.stdout.flush()
            self._json_buffer.clear()


# Global output mode instance (set by CLI flags)
output_mode = OutputMode()

# Global Rich console instances for human mode
console = Console()  # stdout
console_err = Console(stderr=True)  # stderr


@contextmanager
def spinner(message: str):
    """
    Context manager for showing a spinner during operations.

    Displays a Rich spinner with message in human mode.
    Silent in agent/quiet modes.

    Args:
        message: Status message to display

    Yields:
        Status context in human mode, None in agent mode

    Examples:
        >>> with spinner("Loading config..."):
        ...     config = load_config()

        >>> # In human mode, shows spinning animation with message
        >>> # In agent mode, silent
    """
    if output_mode.is_human():
        with console.status(f"[bold blue]{message}", spinner="dots") as status:
            yield status
    else:
        # Silent for agents and quiet mode
        yield None


def create_progress_bar() -> Progress | NoOpProgress:
    """
    Create a progress bar for tracking multiple tasks.

    Returns a Rich Progress instance in human mode with:
    - Spinner column
    - Task description
    - Progress bar
    - Percentage
    - Time remaining estimate

    Returns a no-op progress bar in agent/quiet modes.

    Returns:
        Progress: Rich Progress instance in human mode
        NoOpProgress: No-op progress bar in agent/quiet modes

    Examples:
        >>> progress = create_progress_bar()
        >>> with progress:
        ...     task = progress.add_task("Processing...", total=100)
        ...     for i in range(100):
        ...         progress.advance(task)
    """
    if output_mode.is_human():
        return Progress(
            SpinnerColumn(),
            TextColumn("[bold blue]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            TimeRemainingColumn(),
            console=console,
            transient=True,  # Auto-cleanup when done
        )
    # Return a no-op progress for agents
    return NoOpProgress()


class NoOpProgress:
    """
    No-op progress bar for agent mode.

    Provides the same interface as Rich Progress but does nothing.
    Allows code to use progress bars without mode checks.

    Examples:
        >>> progress = NoOpProgress()
        >>> with progress:
        ...     task = progress.add_task("Processing...", total=100)
        ...     progress.advance(task)  # Does nothing
    """

    def __enter__(self):
        """Enter context (no-op)."""
        return self

    def __exit__(self, *args):
        """Exit context (no-op)."""
        pass

    def add_task(self, _description: str, _total: int | None = None) -> int:
        """
        Add a task (no-op).

        Args:
            _description: Task description (ignored)
            _total: Total steps (ignored)

        Returns:
            Task ID (always 0)
        """
        return 0

    def advance(self, _task_id: int, _advance: float = 1.0) -> None:
        """
        Advance progress (no-op).

        Args:
            _task_id: Task ID (ignored)
            _advance: Amount to advance (ignored)
        """
        pass


def success(message: str) -> None:
    """
    Print a success message.

    Human mode: Green checkmark with message
    Agent mode: Buffer to JSON
    Quiet mode: Silent

    Args:
        message: Success message to display

    Examples:
        >>> success("Config loaded successfully")
        # Human: [green checkmark] Config loaded successfully
        # Agent: Buffers {"status": "success", "message": "..."}
    """
    if output_mode.is_human():
        console.print(f"[green]\u2713[/green] {message}")
    elif output_mode.is_agent():
        output_mode.add_json("status", "success")
        output_mode.add_json("message", message)


def error(message: str) -> None:
    """
    Print an error message.

    Human mode: Red X with message to stderr
    Agent mode: Buffer to JSON
    Quiet mode: Silent

    Args:
        message: Error message to display

    Examples:
        >>> error("Failed to load config")
        # Human: [red X] Failed to load config (red, to stderr)
        # Agent: Buffers {"status": "error", "error": "..."}
    """
    if output_mode.is_human():
        console_err.print(f"[red]\u2717[/red] {message}", style="red")
    elif output_mode.is_agent():
        output_mode.add_json("status", "error")
        output_mode.add_json("error", message)


def warning(message: str) -> None:
    """
    Print a warning message.

    Human mode: Yellow warning symbol with message
    Agent mode: Buffer to JSON
    Quiet mode: Silent

    Args:
        message: Warning message to display

    Examples:
        >>> warning("Using default model")
        # Human: [yellow warning] Using default model (yellow)
        # Agent: Buffers {"warning": "..."}
    """
    if output_mode.is_human():
        console.print(f"[yellow]\u26a0[/yellow] {message}", style="yellow")
    elif output_mode.is_agent():
        output_mode.add_json("warning", message)


def info(message: str) -> None:
    """
    Print an info message.

    Human mode: Blue info symbol with message
    Agent/Quiet mode: Silent

    Args:
        message: Info message to display

    Examples:
        >>> info("Processing 5 intents")
        # Human: [blue info] Processing 5 intents (blue)
        # Agent: Silent
    """
    if output_mode.is_human() and not output_mode.quiet:
        console.print(f"[blue]\u2139[/blue] {message}")
    # Silent for agents and quiet mode


def print_summary_table(results: list[dict]) -> None:
    """
    Print a summary table of query results.

    Human mode: Beautiful Rich table with colored status
    Agent mode: Buffer results as JSON array
    Quiet mode: Silent

    Expected dict keys in results:
    - intent_id (str): Intent identifier
    - model (str): Model name (e.g., "gpt-4o-mini")
    - appeared (bool): Whether brand appeared in response
    - cost (float): Estimated cost in USD
    - status (str): "success" or "error"

    Args:
        results: List of result dictionaries

    Examples:
        >>> results = [
        ...     {
        ...         "intent_id": "email_warmup",
        ...         "model": "gpt-4o-mini",
        ...         "appeared": True,
        ...         "cost": 0.000123,
        ...         "status": "success"
        ...     }
        ... ]
        >>> print_summary_table(results)
    """
    if output_mode.is_agent():
        output_mode.add_json("results", results)
        return

    if output_mode.quiet:
        return

    # Human-friendly table
    table = Table(title="Run Summary", box=box.ROUNDED)

    table.add_column("Intent", style="cyan", no_wrap=True)
    table.add_column("Model", style="magenta")
    table.add_column("Appeared", justify="center")
    table.add_column("Cost", justify="right", style="green")
    table.add_column("Status", justify="center")

    for result in results:
        # Format appeared as checkmark/X
        appeared_symbol = (
            "[green]\u2713[/green]" if result.get("appeared") else "[red]\u2717[/red]"
        )

        # Format cost with $ prefix
        cost_str = f"${result.get('cost', 0.0):.6f}"

        # Color-code status
        status = result.get("status", "unknown")
        if status == "success":
            status_str = "[green]success[/green]"
        elif status == "error":
            status_str = "[red]error[/red]"
        else:
            status_str = f"[yellow]{status}[/yellow]"

        table.add_row(
            result.get("intent_id", ""),
            result.get("model", ""),
            appeared_symbol,
            cost_str,
            status_str,
        )

    console.print(table)


def print_banner(version: str) -> None:
    """
    Print a fancy startup banner.

    Displays ASCII art banner with version in human mode.
    Silent in agent/quiet modes.

    Args:
        version: Version string (e.g., "1.0.0")

    Examples:
        >>> print_banner("1.0.0")
        # Human mode shows fancy banner
        # Agent mode: silent
    """
    if not output_mode.is_human():
        return

    banner = f"""
[bold cyan]\u2554{"═" * 39}\u2557
\u2551   LLM Answer Watcher v{version:<15} \u2551
\u2551   Monitor LLM responses for brands    \u2551
\u255a{"═" * 39}\u255d[/bold cyan]
"""

    console.print(banner)


def print_final_summary(
    run_id: str, output_dir: str, total_cost: float, successful: int, total: int
) -> None:
    """
    Print final summary with run statistics.

    Human mode: Rich panel with colored border (green if all succeeded)
    Agent mode: Flush all buffered JSON including these final stats
    Quiet mode: Tab-separated values

    Args:
        run_id: Run identifier (timestamp slug)
        output_dir: Path to output directory
        total_cost: Total estimated cost in USD
        successful: Number of successful queries
        total: Total number of queries attempted

    Examples:
        >>> print_final_summary(
        ...     run_id="2025-11-02T08-30-00Z",
        ...     output_dir="./output/2025-11-02T08-30-00Z",
        ...     total_cost=0.001234,
        ...     successful=10,
        ...     total=10
        ... )
    """
    if output_mode.is_agent():
        # Add final stats to JSON buffer
        output_mode.add_json("run_id", run_id)
        output_mode.add_json("output_dir", output_dir)
        output_mode.add_json("total_cost_usd", total_cost)
        output_mode.add_json("successful_queries", successful)
        output_mode.add_json("total_queries", total)

        # Flush all buffered JSON to stdout
        output_mode.flush_json()
        return

    if output_mode.quiet:
        # Tab-separated output: run_id, output_dir, cost, successful, total
        print(f"{run_id}\t{output_dir}\t{total_cost:.6f}\t{successful}\t{total}")
        return

    # Human-friendly panel
    success_rate = (successful / total * 100) if total > 0 else 0.0

    summary_text = f"""
[bold]Run ID:[/bold] {run_id}
[bold]Output Directory:[/bold] {output_dir}
[bold]Total Cost:[/bold] ${total_cost:.6f}
[bold]Queries:[/bold] {successful}/{total} successful ({success_rate:.1f}%)
"""

    # Green border if all successful, yellow if partial, red if none
    if successful == total:
        border_style = "green"
        title = "[bold green]\u2713 Run Completed Successfully[/bold green]"
    elif successful > 0:
        border_style = "yellow"
        title = "[bold yellow]\u26a0 Run Completed with Partial Failures[/bold yellow]"
    else:
        border_style = "red"
        title = "[bold red]\u2717 Run Failed[/bold red]"

    panel = Panel(
        summary_text.strip(),
        title=title,
        border_style=border_style,
        box=box.ROUNDED,
    )

    console.print(panel)


def print_cost_breakdown(
    cost_estimate: dict, budget_limit: float | None = None
) -> None:
    """
    Display detailed cost breakdown by model before execution.

    Shows per-model cost estimates in a formatted table with totals and budget check.
    Adapts to output mode (human-friendly table, JSON, or quiet tab-separated).

    Args:
        cost_estimate: Cost estimate dict from estimate_run_cost() with:
            - per_model_costs: List of model cost breakdowns
            - base_cost: Total cost before safety buffer
            - total_estimated_cost: Total with safety buffer
            - buffer_percentage: Safety buffer percentage
        budget_limit: Optional budget limit in USD to compare against

    Example:
        >>> estimate = estimate_run_cost(config)
        >>> print_cost_breakdown(estimate, budget_limit=1.0)
        # Displays:
        # Cost Estimation by Model
        # ┌──────────┬─────────────┬────────┬───────────┬──────┐
        # │ Provider │ Model       │ Queries│ Per Query │ Total│
        # ├──────────┼─────────────┼────────┼───────────┼──────┤
        # │ openai   │ gpt-4o-mini │ 3      │ $0.000375 │ $... │
        # └──────────┴─────────────┴────────┴───────────┴──────┘
    """
    if output_mode.is_agent():
        # JSON mode: add cost breakdown to buffer
        output_mode.add_json("cost_breakdown", cost_estimate)
        if budget_limit is not None:
            output_mode.add_json("budget_limit_usd", budget_limit)
            output_mode.add_json(
                "within_budget", cost_estimate["total_estimated_cost"] <= budget_limit
            )
        output_mode.flush_json()
        return

    if output_mode.quiet:
        # Quiet mode: tab-separated totals
        # Format: <total_cost>\t<num_queries>\t<num_operations>\t<base_cost>
        total_ops = cost_estimate.get("total_operations", 0)
        print(
            f"{cost_estimate['total_estimated_cost']:.6f}\t"
            f"{cost_estimate['total_queries']}\t"
            f"{total_ops}\t"
            f"{cost_estimate['base_cost']:.6f}"
        )
        return

    # Human-friendly table
    console = Console()

    # Create cost breakdown table
    table = Table(
        title="Cost Estimation by Model",
        box=box.ROUNDED,
        show_header=True,
        header_style="bold cyan",
    )

    table.add_column("Provider", style="yellow", no_wrap=True)
    table.add_column("Model", style="cyan", no_wrap=False)
    table.add_column("Queries", justify="right", style="blue")
    table.add_column("Per Query", justify="right", style="green")
    table.add_column("Total", justify="right", style="bold green")
    table.add_column("Web Search", justify="center", style="magenta")

    # Add rows for each model
    for model_info in cost_estimate.get("per_model_costs", []):
        web_search_icon = "\u2713" if model_info.get("has_web_search") else "\u2717"
        table.add_row(
            model_info["provider"],
            model_info["model_name"],
            str(model_info["num_queries"]),
            f"${model_info['cost_per_query']:.6f}",
            f"${model_info['total_cost']:.6f}",
            web_search_icon,
        )

    console.print(table)

    # Show operation models if configured
    if cost_estimate.get("per_operation_model_costs"):
        console.print()  # Spacing

        op_table = Table(
            title="Operation Models (Post-Intent Analysis)",
            box=box.ROUNDED,
            show_header=True,
            header_style="bold magenta",
        )

        op_table.add_column("Provider", style="yellow", no_wrap=True)
        op_table.add_column("Model", style="cyan", no_wrap=False)
        op_table.add_column("Operations", justify="right", style="blue")
        op_table.add_column("Per Op", justify="right", style="green")
        op_table.add_column("Total", justify="right", style="bold green")

        for op_model in cost_estimate["per_operation_model_costs"]:
            op_table.add_row(
                op_model["provider"],
                op_model["model_name"],
                str(op_model["num_operations"]),
                f"${op_model['cost_per_operation']:.6f}",
                f"${op_model['total_cost']:.6f}",
            )

        console.print(op_table)

    console.print()

    # Print totals
    # Build queries/operations summary
    summary_parts = [f"{cost_estimate['total_queries']} queries"]
    if cost_estimate.get("total_operations", 0) > 0:
        summary_parts.append(f"{cost_estimate['total_operations']} operations")
    summary_text = ", ".join(summary_parts)

    console.print(
        f"[bold]Subtotal:[/bold] ${cost_estimate['base_cost']:.6f} "
        f"({summary_text})"
    )
    buffer_pct = int(cost_estimate["buffer_percentage"] * 100)
    console.print(
        f"[bold]Safety buffer ({buffer_pct}%):[/bold] "
        f"${cost_estimate['total_estimated_cost'] - cost_estimate['base_cost']:.6f}"
    )
    console.print(
        f"[bold cyan]Total estimated cost:[/bold cyan] "
        f"${cost_estimate['total_estimated_cost']:.6f}"
    )

    # Budget check
    if budget_limit is not None:
        console.print()
        if cost_estimate["total_estimated_cost"] <= budget_limit:
            console.print(
                f"[bold green]\u2713 Within budget limit:[/bold green] ${budget_limit:.2f}"
            )
        else:
            console.print(
                f"[bold red]\u2717 Exceeds budget limit:[/bold red] ${budget_limit:.2f} "
                f"(over by ${cost_estimate['total_estimated_cost'] - budget_limit:.6f})"
            )
    console.print()
