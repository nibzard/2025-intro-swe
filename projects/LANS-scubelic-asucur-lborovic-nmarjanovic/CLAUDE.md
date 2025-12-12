# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LLM Answer Watcher** is a production-ready CLI tool that monitors how large language models talk about brands versus competitors in buyer-intent queries. It asks LLMs specific questions (e.g., "best email warmup tools"), extracts structured signals (Did we appear? Who else appeared? In what rank?), and stores results in SQLite for historical tracking.

**Key characteristics:**
- **BYOK (Bring Your Own Keys)**: Users provide their own OpenAI/Anthropic/Mistral/Grok/Google/Perplexity API keys
- **Local-first**: All data stored locally in SQLite and JSON files
- **API-first mindset**: Internal contract designed to become HTTP API in Cloud product
- **Dual-mode CLI**: Beautiful Rich output for humans, structured JSON for AI agents
- **Production-ready extraction**: Word-boundary regex matching + optional LLM-assisted ranking

## Project Status

**Current phase**: Production-ready, ~95% complete (1,001/1,053 tasks done)

The codebase currently contains:
- **~8,200 lines of production Python code** across 36 modules
- **~17,400 lines of test code** with 750+ test cases
- Complete engineering specification (SPECS.md)
- Comprehensive TODO.md tracking progress (52 pending tasks remain)
- **All 4 milestones COMPLETE**:
  - ✅ Milestone 1: Project skeleton & config
  - ✅ Milestone 2: Provider client + runner core (OpenAI fully implemented)
  - ✅ Milestone 3: Report generation + CLI
  - ✅ Milestone 4: Polish, docs, tests (80%+ coverage achieved)
- **Bonus**: Complete evaluation framework with CLI integration
- **Remaining work**: Advanced features (trends command, DeepEval integration)
- **Recently completed**: Mistral, Grok, and Google Gemini client implementations with full model support

## Architecture & Domain Design

The system follows **Domain-Driven Design** with strict separation of concerns:

### Core Domains

```
llm_answer_watcher/
├── config/         # YAML loading, Pydantic validation, env var resolution
├── llm_runner/     # LLM client abstraction, retry logic, OpenAI implementation
├── extractor/      # Brand mention detection, rank extraction, normalization
├── storage/        # SQLite schema with versioning, JSON/HTML writing
├── report/         # HTML report generation with Jinja2
├── utils/          # Time (UTC), logging, cost estimation, console (Rich)
└── cli.py          # Typer CLI with dual modes (human/agent)
```

**Domain boundaries are strict:**
- `extractor` shouldn't know about file paths
- `cli` shouldn't know about SQL
- `llm_runner` shouldn't know about storage formats
- Each domain has a clear single responsibility

### Key Architectural Patterns

**1. API-First Contract** (`llm_runner/runner.py`)
```python
run_all(config: RuntimeConfig) -> dict:
    # This is the internal "POST /run" contract
    # OSS CLI calls it in-process
    # Cloud will expose it over HTTP
    return {
        "run_id": "YYYY-MM-DDTHH-MM-SSZ",
        "output_dir": "./output/...",
        "total_cost_usd": 0.0123,
        ...
    }
```

**2. Provider Abstraction** (`llm_runner/models.py`)
```python
@dataclass
class LLMResponse:
    """Structured response from LLM with metadata"""
    answer_text: str
    tokens_used: int
    cost_usd: float
    provider: str
    model_name: str
    timestamp_utc: str
    web_search_results: list[dict] | None = None
    web_search_count: int = 0

class LLMClient(Protocol):
    def generate_answer(self, prompt: str) -> LLMResponse:
        # Provider-agnostic interface
        # Returns structured LLMResponse with answer and metadata
        ...

def build_client(
    provider: str,  # "openai", "anthropic", "google", "perplexity"
    model_name: str,
    api_key: str,
    system_prompt: str,
    tools: list[dict] | None = None,
    tool_choice: str = "auto",
) -> LLMClient:
    # Factory pattern for multi-provider support
    # Currently supports: openai, anthropic, mistral, grok, google, perplexity
    ...
```

**3. Dual-Mode CLI Pattern** (`utils/console.py`)
```python
class OutputMode:
    # Switches between:
    # - Human mode: Rich spinners, tables, panels
    # - Agent mode: Structured JSON, no ANSI codes
    # - Quiet mode: Tab-separated minimal output
    pass
```

**4. Word-Boundary Matching** (`extractor/mention_detector.py`)
```python
# CRITICAL: Prevents false positives
pattern = r'\b' + re.escape(brand_alias) + r'\b'
# "HubSpot" matches in "Use HubSpot daily"
# But "hub" does NOT match in "GitHub"
```

## Development Workflow

### Subagent Team (Strongly Recommended)

This project uses **3 specialized role-based subagents**:

1. **Developer** (`developer`) - Implements features per SPECS.md
   ```
   "Developer: Implement config/loader.py per TODO.md section 1.2.2"
   ```

2. **Tester** (`tester`) - Writes comprehensive tests (80%+ coverage)
   ```
   "Tester: Write tests for config/loader.py per TODO.md section 1.7"
   ```

3. **Reviewer** (`reviewer`) - Validates quality, security, SPECS.md compliance
   ```
   "Reviewer: Review config module per TODO.md milestone 1 checklist"
   ```

**Workflow**: Developer → Tester → Reviewer → Iterate

See `.claude/AGENTS.md` for detailed subagent documentation.

### Implementation Order (Critical)

Work through milestones **sequentially** - dependencies matter:

1. **Milestone 1**: Project skeleton & config (foundation)
   - Directory structure, pyproject.toml, dependencies
   - Config module with Pydantic validation
   - Utils (time, logging, cost estimation)
   - SQLite schema with versioning
   - ~50 tasks

2. **Milestone 2**: Provider client + runner core (business logic)
   - LLM client abstraction + OpenAI implementation
   - Retry logic with tenacity (exponential backoff)
   - Mention detection (word-boundary regex + fuzzy)
   - Rank extraction (pattern-based)
   - Runner orchestration
   - ~60 tasks

3. **Milestone 3**: Report generation + CLI (user interface)
   - Rich console utilities (dual-mode)
   - Jinja2 HTML report with autoescaping
   - Typer CLI with --format json, --quiet, --yes
   - Exit codes (0-4)
   - ~50 tasks

4. **Milestone 4**: Polish, docs, tests (production-ready)
   - README, CONTRIBUTING
   - 80%+ test coverage
   - CI/CD with GitHub Actions
   - ~40 tasks

**Total: 200+ granular tasks in TODO.md**

## Python Requirements & Code Standards

### Python Version
- **Minimum**: Python 3.12
- **Recommended**: Python 3.13
- **Package manager**: `uv` (fast, modern) or `pip` (fallback)

### Modern Type Hints (Python 3.12+)
```python
# ✅ CORRECT - Use | for unions
def process_config(config: dict | None = None) -> RuntimeConfig | None:
    pass

# ❌ WRONG - Don't use typing.Union
from typing import Union, Optional
def process_config(config: Optional[dict] = None) -> Union[RuntimeConfig, None]:
    pass
```

### Critical Patterns Enforced by Ruff

**1. UTC Timestamps Everywhere**
```python
from utils.time import utc_now, utc_timestamp, run_id_from_timestamp

timestamp = utc_timestamp()  # Returns "YYYY-MM-DDTHH:MM:SSZ"
run_id = run_id_from_timestamp()  # Returns "YYYY-MM-DDTHH-MM-SSZ"
```

**2. Word-Boundary Brand Matching**
```python
# CRITICAL: Use word boundaries to avoid false positives
import re

def create_brand_pattern(alias: str) -> re.Pattern:
    escaped = re.escape(alias)  # Escape special chars
    pattern = r'\b' + escaped + r'\b'
    return re.compile(pattern, re.IGNORECASE)
```

**3. Pydantic Validation**
```python
from pydantic import BaseModel, field_validator

class Intent(BaseModel):
    id: str
    prompt: str

    @field_validator('id')
    @classmethod
    def validate_id(cls, v: str) -> str:
        if not v or v.isspace():
            raise ValueError("Intent ID cannot be empty")
        return v
```

**4. Never Log API Keys**
```python
# ❌ NEVER DO THIS
logger.info(f"Using API key: {api_key}")
logger.debug(f"Key ends with: {api_key[-4:]}")

# ✅ DO THIS
logger.info("API key loaded from environment")
```

**5. SQL Injection Prevention**
```python
# ❌ NEVER concatenate SQL
cursor.execute(f"SELECT * FROM runs WHERE id='{run_id}'")

# ✅ Always use parameterized queries
cursor.execute("SELECT * FROM runs WHERE id=?", (run_id,))
```

**6. HTML Injection Prevention**
```python
from jinja2 import Environment

# ✅ CRITICAL: Enable autoescaping
env = Environment(loader=..., autoescape=True)
```

## Testing Strategy

### Coverage Targets
- **Core modules**: 80%+ coverage
- **Critical paths**: 100% coverage (config.loader, llm_runner.openai_client, extractor.mention_detector, storage.db)

### Test Tools
- `pytest` - Test runner
- `pytest-httpx` - Mock HTTP calls to LLM APIs
- `pytest-cov` - Coverage reporting
- `pytest-mock` - General mocking
- `freezegun` - Time mocking for UTC timestamps

### Test Patterns

**Mock LLM API calls:**
```python
def test_openai_client(httpx_mock):
    httpx_mock.add_response(
        method="POST",
        url="https://api.openai.com/v1/chat/completions",
        json={"choices": [{"message": {"content": "..."}}], "usage": {...}}
    )
    # Test implementation
```

**Mock time:**
```python
from freezegun import freeze_time

@freeze_time("2025-11-01 08:00:00")
def test_run_id_generation():
    run_id = run_id_from_timestamp()
    assert run_id == "2025-11-01T08-00-00Z"
```

**Use temp files/databases:**
```python
def test_sqlite_roundtrip(tmp_path):
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))
    # Test implementation
```

## CLI Exit Codes (Important for Agent Mode)

```
0: Success - all queries completed successfully
1: Configuration error (invalid YAML, missing API keys)
2: Database error (cannot create/access SQLite)
3: Partial failure (some queries failed, but run completed)
4: Complete failure (no queries succeeded)
```

These exit codes are **critical** for AI agent automation. Always test them.

## Security Requirements

### Never Commit Secrets
- `.env` files are gitignored
- API keys loaded from environment variables only
- Example configs use placeholders: `OPENAI_API_KEY=your_key_here`

### No Secrets in Logs
- Never log API keys (not even last 4 chars in production)
- Use structured logging with context, but redact sensitive data

### Prevent Injection Attacks
- **SQL injection**: Always use parameterized queries
- **XSS**: Enable Jinja2 autoescaping
- **Command injection**: Avoid shell=True, use list args

## Data Storage Design

### SQLite Schema (Version 1)

**Purpose**: Historical tracking for "data is the moat" principle

**Tables:**
- `schema_version` - Migration tracking
- `runs` - One row per CLI execution
- `answers_raw` - Raw LLM responses with token usage and cost
- `mentions` - Exploded brand mentions (one row per brand per answer)

**Key constraints:**
- UNIQUE on (run_id, intent_id, model_provider, model_name) in answers_raw
- UNIQUE on (run_id, intent_id, model_provider, model_name, normalized_name) in mentions
- Indexes on timestamp_utc, intent_id, brand, rank_position

**Schema versioning:**
- Check current version on startup
- Run migrations if needed
- Defined in `storage/migrations.py`

### JSON Artifacts

**Per run directory** (`output/YYYY-MM-DDTHH-MM-SSZ/`):
- `run_meta.json` - Summary with cost totals
- `intent_{id}_raw_{provider}_{model}.json` - Verbatim LLM response
- `intent_{id}_parsed_{provider}_{model}.json` - Extracted mentions and ranks
- `intent_{id}_error_{provider}_{model}.json` - Error details if query failed
- `report.html` - Static HTML report

## Hooks System

The project uses **5 automated hooks** (see `.claude/HOOKS.md`):

1. **Protected Files Warning** (PreToolUse) - Warns before editing SPECS.md or agent files
2. **Ruff Auto-Linting** (PostToolUse) - Runs `ruff check --fix` after editing Python files
3. **Git Commit Reminder** (Stop) - Shows uncommitted changes with conventional commit format
4. **TODO Progress Tracker** (SessionStart) - Shows completion percentage and next 3 tasks
5. **Subagent Completion Reminder** (SubagentStop) - Reminds to update TODO.md after work

**On session start, you'll see:**
```
📋 TODO.md Status:
   ✅ Completed: 45/150 tasks (30%)
   ⏳ Pending: 105 tasks

💡 Next pending tasks:
   Line 65: Create module directory structure
   ...
```

## Key Files Reference

- **SPECS.md** (80 KB) - Complete engineering specification, read this first
- **TODO.md** (58 KB) - 200+ implementation tasks organized by milestone
- **.claude/AGENTS.md** - Subagent team documentation and workflow
- **.claude/HOOKS.md** - Hooks documentation and configuration
- **ruff.toml** - Code quality rules (Python 3.12+, timezone enforcement, etc.)

## Testing Utilities

### MockLLMClient & ChaosLLMClient

LLM Answer Watcher provides advanced testing utilities inspired by modern LLM abstraction layers:

**MockLLMClient** - Deterministic responses without API calls:
```python
from llm_answer_watcher.llm_runner.mock_client import MockLLMClient

client = MockLLMClient(
    responses={"best CRM": "HubSpot and Salesforce"},
    tokens_per_response=300,
    cost_per_response=0.001
)

response = await client.generate_answer("best CRM")
# Test extraction, storage, orchestration without HTTP mocking
```

**ChaosLLMClient** - Resilience testing with controlled failures:
```python
from llm_answer_watcher.llm_runner.chaos_client import ChaosLLMClient

chaos = ChaosLLMClient(
    base_client=mock_client,
    success_rate=0.7,  # 70% success, 30% failures
    seed=42  # Reproducible
)

# Validates retry logic under adverse conditions
```

**Benefits:**
- ✅ Cleaner tests (no brittle HTTP mocking with pytest-httpx)
- ✅ Test entire pipeline (extraction + storage + orchestration)
- ✅ Chaos engineering for retry validation
- ✅ Protocol-compliant implementations

See `docs/contributing/testing-utilities.md` for full documentation.

## Common Commands

### Setup
```bash
# Install dependencies with uv (recommended)
uv sync

# Or with pip (fallback)
pip install -e .
```

### Development
```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=llm_answer_watcher --cov-report=html

# Run single test file
pytest tests/test_config_loader.py

# Run single test function
pytest tests/test_config_loader.py::test_load_valid_config

# Verbose test output
pytest -v

# Lint Python files
ruff check .

# Auto-fix linting issues
ruff check . --fix

# Format code
ruff format .
```

### Git Workflow
```bash
# Conventional commit format (enforced by hooks)
git commit -m "feat: implement config loader with Pydantic validation"
git commit -m "fix: prevent SQL injection in brand mention queries"
git commit -m "docs: add API documentation for LLM runner module"
git commit -m "test: add 80% coverage for mention detector"
git commit -m "refactor: extract retry logic to utils module"
git commit -m "chore: add ruff and pytest to dependencies"
```

### Running the CLI
```bash
# Try it first: Interactive demo (no API keys needed!)
llm-answer-watcher demo
llm-answer-watcher demo --mode agent  # JSON output
llm-answer-watcher demo --mode quiet  # Minimal output

# Run as Python module
python -m llm_answer_watcher demo
python -m llm_answer_watcher run --config examples/watcher.config.yaml

# Human mode (default) - Beautiful Rich output
llm-answer-watcher run --config examples/watcher.config.yaml

# Agent mode - Structured JSON output
llm-answer-watcher run --config examples/watcher.config.yaml --format json

# Quiet mode - Minimal output
llm-answer-watcher run --config examples/watcher.config.yaml --quiet

# Automation mode - No prompts
llm-answer-watcher run --config examples/watcher.config.yaml --yes --format json

# Validate config
llm-answer-watcher validate --config examples/watcher.config.yaml

# Show version
llm-answer-watcher --version
```

## Critical Anti-Patterns to Avoid

### ❌ Don't Use Naive String Matching
```python
# BAD - "hub" matches in "GitHub"
if "hub" in text.lower():
    found_hubspot = True
```

### ❌ Don't Use Old-Style Type Hints
```python
# BAD - Old Python 3.10 style
from typing import Union, Optional
def foo(x: Optional[str]) -> Union[int, None]:
    pass
```

### ❌ Don't Skip Retry Logic for LLM Calls
```python
# BAD - No retry on transient failures
response = requests.post(api_url, json=payload)
```

### ❌ Don't Use print() for User Communication
```python
# BAD - Bypasses dual-mode system
print("Loading config...")

# GOOD - Use utils/console.py
with spinner("Loading config..."):
    config = load_config()
```

### ❌ Don't Create Multiple Output Systems
```python
# BAD - Direct Rich usage in business logic
from rich.console import Console
console = Console()
console.print("[green]Success![/green]")

# GOOD - Use utils/console.py helpers
from utils.console import success
success("Config loaded successfully")
```

## When Starting a New Session

1. **Read TODO.md** to understand current progress and pick next task
2. **Check hooks output** on SessionStart for next pending tasks
3. **Work through milestones sequentially** - don't skip ahead
4. **Use subagent team** for proper separation of concerns (implement → test → review)
5. **Update TODO.md** by marking completed tasks with `[x]`
6. **Commit frequently** with conventional commit format

## Project Philosophy

- **Boring is good**: Prefer simple, readable code over clever abstractions
- **No async in v1**: Keep it synchronous and straightforward
- **Data is the moat**: Historical SQLite data is core value proposition
- **Local-first**: No external dependencies except LLM APIs
- **API-first**: Internal contract designed for future HTTP exposure
- **Production-ready from day one**: Proper error handling, retry logic, security
- **Dual-mode CLI**: Serve both humans (Rich) and AI agents (JSON)

## References

- SPECS.md - Complete engineering specification
- TODO.md - 200+ implementation tasks
- .claude/AGENTS.md - Subagent team documentation
- .claude/HOOKS.md - Hooks system documentation
- [Nikola Balić - Agent-Friendly CLIs](https://nibzard.com/agent-experience)
- [Mario Zechner - CLI vs MCP](https://mariozechner.at/posts/2025-08-15-mcp-vs-cli/)
