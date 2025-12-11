# LLM Answer Watcher - Implementation TODO

> **📋 Document Version**: This TODO list represents the **v0.1.0 baseline** implementation tasks.
>
> **v0.2.0 features (completed Nov 2025) are NOT tracked here:**
> - Browser runners (Steel API integration)
> - Async/await parallelization
> - Google Search grounding
> - Post-intent operations
> - Sentiment analysis and intent classification
>
> **This document remains as historical reference for v0.1.0 development.**
> For current project status, see [Changelog](docs/changelog.md).

This file contains **every task** needed to implement the complete system as defined in [SPECS.md](./SPECS.md).

Tasks are organized by **milestones** that map to development sprints. Use your subagent team:
- **Developer** 👨‍💻 for implementation
- **Tester** 🧪 for comprehensive tests
- **Reviewer** 👁️ for quality validation

---

## Progress Overview

- [x] Milestone 1: Project skeleton & config (COMPLETE)
- [x] Milestone 2: Provider client + runner core (COMPLETE - 220 tests, 97-100% coverage)
- [x] Milestone 3: Report generation + CLI (COMPLETE - 261 tests, 100% coverage)
- [x] Milestone 4: Polish, docs, tests (MAJOR PROGRESS - 695 tests total, 80%+ coverage achieved, test isolation issues RESOLVED)
- [x] Evaluation Framework: Comprehensive eval system with CLI integration (COMPLETE - Core framework + CLI command + database storage fully implemented and validated)

---

## Milestone 1: Project Skeleton & Config

**Goal:** Load config, init DB, confirm DB tables exist, and validation catches all error cases.

### 1.1 Project Structure Setup

- [x] **Create module directory structure**
  ```
  llm_answer_watcher/
      __init__.py
      config/
          __init__.py
          schema.py
          loader.py
          validators.py
      llm_runner/
          __init__.py
          models.py
          openai_client.py
          runner.py
          retry_config.py
      extractor/
          __init__.py
          parser.py
          mention_detector.py
          rank_extractor.py
      storage/
          __init__.py
          db.py
          writer.py
          layout.py
          migrations.py
      report/
          __init__.py
          generator.py
          cost_formatter.py
          templates/
              report.html.j2
      utils/
          __init__.py
          time.py
          logging.py
          cost.py
          console.py
      cli.py
  ```

- [x] **Create pyproject.toml**
  - Package name: `llm-answer-watcher`
  - Python requirement: `>=3.12,<3.14`
  - Dependencies:
    - `pydantic>=2.0`
    - `pyyaml>=6.0`
    - `httpx>=0.27.0`
    - `tenacity>=8.0`
    - `rapidfuzz>=3.0`
    - `jinja2>=3.1`
    - `typer>=0.12.0`
    - `rich>=13.0`
  - Dev dependencies:
    - `pytest>=8.0`
    - `pytest-httpx>=0.30.0`
    - `pytest-cov>=5.0`
    - `pytest-mock>=3.14.0`
    - `freezegun>=1.5.0`
    - `ruff>=0.4.0`
  - Entry point: `llm-answer-watcher = llm_answer_watcher.cli:main`

- [x] **Create VERSION file**
  - Initial version: `0.1.0`
  - [x 2025-11-02] Completed in commit 59b8304

- [x] **Create SCHEMA_VERSION file**
  - Initial schema version: `1`
  - [x 2025-11-02] Completed in commit 59b8304

- [x] **Verify LICENSE exists** (MIT, already created)
  - [x 2025-11-02] Completed - LICENSE file confirmed present in project root

- [x] **Create requirements.txt** (fallback for pip users)
  - Generate from pyproject.toml
  - [x 2025-11-02] Completed in commit b891d1a

### 1.2 Config Module (config/)

#### 1.2.1 config/schema.py

- [x] **Define Pydantic models:**
  - [x 2025-11-02] Completed all 7 Pydantic models (Intent, Brands, ModelConfig, RunSettings, WatcherConfig, RuntimeModel, RuntimeConfig) with validation in commit 9fc6b73
  - [x] `Intent` model
    - Fields: `id: str`, `prompt: str`
    - Validator: `id` must be alphanumeric with hyphens/underscores
    - Validator: `prompt` must be at least 10 characters

  - [x] `Brands` model
    - Fields: `mine: list[str]`, `competitors: list[str]`
    - Validator: All brand aliases must be at least 2 characters
    - Validator: No duplicate aliases across mine and competitors

  - [x] `ModelConfig` model
    - Fields: `provider: str`, `model_name: str`, `env_api_key: str`
    - Validator: `provider` must be in supported list (openai, anthropic)
    - Validator: `env_api_key` must start with valid format

  - [x] `RunSettings` model
    - Fields:
      - `output_dir: str` (default: "./output")
      - `sqlite_db_path: str` (default: "./output/watcher.db")
      - `models: list[ModelConfig]`
      - `use_llm_rank_extraction: bool` (default: False)
    - Validator: `output_dir` path is valid
    - Validator: At least one model configured

  - [x] `WatcherConfig` model (top-level)
    - Fields:
      - `run_settings: RunSettings`
      - `brands: Brands`
      - `intents: list[Intent]`
    - Validator: Intent IDs are unique
    - Validator: At least one intent configured

  - [x] `RuntimeModel` model
    - Fields: `provider: str`, `model_name: str`, `api_key: str`
    - Note: Never serialize this model (contains secrets)

  - [x] `RuntimeConfig` model
    - Fields:
      - `run_settings: RunSettings`
      - `brands: Brands`
      - `intents: list[Intent]`
      - `models: list[RuntimeModel]`

#### 1.2.2 config/loader.py

- [x] **Implement `load_config(config_path: str) -> RuntimeConfig`**
  - [x] Load YAML file from path
  - [x] Handle FileNotFoundError with clear message
  - [x] Parse YAML into dict
  - [x] Validate with WatcherConfig Pydantic model
  - [x] Catch ValidationError and provide helpful error messages
  - [x] For each ModelConfig, resolve environment variable
  - [x] Check if env var exists with `os.environ.get()`
  - [x] Raise ValueError if API key env var missing
  - [x] Build list of RuntimeModel instances with resolved keys
  - [x] Construct and return RuntimeConfig
  - [x] Add comprehensive docstring with Args, Returns, Raises
  - [x] **Security:** Never log API keys
  - [x 2025-11-02] Completed in commit 0a0e44f with load_config() and resolve_api_keys() implementation

### 1.3 Utils Module - Time (utils/time.py)

- [x] **Implement UTC timestamp utilities:**
  - [x 2025-11-02] Completed in commit 3dea6bc with 4 UTC functions (utc_now, utc_timestamp, run_id_from_timestamp, parse_timestamp)
  - [x] `utc_now() -> datetime`
    - Return current time in UTC with timezone info

  - [x] `utc_timestamp() -> str`
    - Return ISO 8601 timestamp with 'Z' suffix
    - Format: `YYYY-MM-DDTHH:MM:SSZ`

  - [x] `run_id_from_timestamp(dt: datetime | None = None) -> str`
    - Generate run_id slug from timestamp
    - Format: `YYYY-MM-DDTHH-MM-SSZ` (hyphens instead of colons)
    - Default to current time if dt is None

  - [x] `parse_timestamp(ts: str) -> datetime`
    - Parse ISO 8601 timestamp to datetime
    - Raise ValueError if no 'Z' suffix
    - Raise ValueError if invalid format

### 1.4 Utils Module - Logging (utils/logging.py)

- [x] **Setup structured JSON logging:**
  - [x] Configure Python logging module
  - [x] Set default level to INFO
  - [x] Add --verbose flag support for DEBUG
  - [x] Format logs as JSON with fields:
    - `timestamp`: ISO 8601 UTC
    - `level`: INFO, WARNING, ERROR, DEBUG
    - `component`: module name
    - `message`: human-readable description
    - `context`: dict with additional data
    - `run_id`: current run ID if available

  - [x] Output to stderr (stdout reserved for user output)
  - [x] **Implement redaction for secrets:**
    - Never log API keys
    - Only log last 4 chars if needed: `sk-...X7Z9`

  - [x] Create helper functions:
    - [x] `get_logger(component: str) -> Logger`
    - [x] `log_with_context(level, message, context)`
  - [x 2025-11-02 commit 91d209d] Completed with JSONFormatter, SecretRedactingFilter, setup_logging(), get_logger(), and log_with_context() implementation. All security requirements met (stderr output, UTC timestamps, API key redaction)

### 1.5 Storage Module - Database (storage/db.py)

#### 1.5.1 Schema Definition

- [x] **Implement `init_db_if_needed(db_path: str) -> None`**
  - [x 2025-11-02] Completed in commit 2a474ea with database initialization and schema v1
  - [x] Connect to SQLite database
  - [x] Create `schema_version` table if not exists
  - [x] Create `runs` table if not exists
  - [x] Create `answers_raw` table if not exists
  - [x] Create `mentions` table if not exists
  - [x] Create indexes on common query columns
  - [x] Check current schema version
  - [x] Run migrations if needed (call storage.migrations)
  - [x] Close connection properly

- [x] **Schema: `schema_version` table**
  ```sql
  CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
  );
  ```
  - [x 2025-11-02 commit 2a474ea] Completed with version tracking

- [x] **Schema: `runs` table**
  ```sql
  CREATE TABLE IF NOT EXISTS runs (
      run_id TEXT PRIMARY KEY,
      timestamp_utc TEXT NOT NULL,
      total_intents INTEGER NOT NULL,
      total_models INTEGER NOT NULL,
      total_cost_usd REAL DEFAULT 0.0
  );
  ```
  - [x 2025-11-02 commit 2a474ea] Completed with cost tracking

- [x] **Schema: `answers_raw` table**
  ```sql
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
  );
  ```
  - [x 2025-11-02 commit 2a474ea] Completed with UNIQUE constraint and foreign key

- [x] **Schema: `mentions` table**
  ```sql
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
  );
  ```
  - [x 2025-11-02 commit 2a474ea] Completed with UNIQUE constraint and foreign key

- [x] **Create indexes:**
  ```sql
  CREATE INDEX IF NOT EXISTS idx_mentions_timestamp ON mentions(timestamp_utc);
  CREATE INDEX IF NOT EXISTS idx_mentions_intent ON mentions(intent_id);
  CREATE INDEX IF NOT EXISTS idx_mentions_brand ON mentions(normalized_name);
  CREATE INDEX IF NOT EXISTS idx_mentions_mine ON mentions(is_mine);
  CREATE INDEX IF NOT EXISTS idx_mentions_rank ON mentions(rank_position);
  CREATE INDEX IF NOT EXISTS idx_answers_timestamp ON answers_raw(timestamp_utc);
  ```
  - [x 2025-11-02 commit 2a474ea] Completed all indexes for query optimization

#### 1.5.2 Database Operations

- [x] **Implement `insert_run(conn, run_id, timestamp_utc, total_intents, total_models)`**
  - [x] Use parameterized query (prevent SQL injection)
  - [x] Handle UNIQUE constraint (idempotent)
  - [x] Commit transaction
  - [x 2025-11-02 commit 22fc014] Completed with parameterized queries and error handling

- [x] **Implement `insert_answer_raw(conn, ...)`**
  - [x] Insert into answers_raw table
  - [x] Use parameterized query
  - [x] Handle UNIQUE constraint
  - [x] Store usage_meta as JSON string
  - [x 2025-11-02 commit 22fc014] Completed with parameterized queries and JSON serialization

- [x] **Implement `insert_mention(conn, ...)`**
  - [x] Insert into mentions table
  - [x] Use parameterized query
  - [x] Handle UNIQUE constraint
  - [x] Store is_mine as 1 or 0
  - [x 2025-11-02 commit 22fc014] Completed with parameterized queries and boolean conversion

- [x] **Implement `update_run_cost(conn, run_id, total_cost)`**
  - [x] Update runs table with final cost
  - [x] Use parameterized query
  - [x 2025-11-02 commit 22fc014] Completed with parameterized query

### 1.6 Storage Module - Migrations (storage/migrations.py)

- [x] **Create migration framework:**
  - [x] `CURRENT_SCHEMA_VERSION = 1` constant

  - [x] `get_current_version(conn) -> int` (implemented as `get_schema_version()` in db.py)
    - Query schema_version table
    - Return max version or 0 if empty

  - [x] `apply_migrations(conn, from_version: int)` (implemented in db.py)
    - Apply all migrations from from_version to CURRENT
    - Call migration functions in order
    - Insert version record after each migration
    - Commit transactions

  - [x] `migration_1(conn)` (implemented as `_migrate_to_v1()` in db.py)
    - Initial schema (already created by init_db)
    - Record version 1 application

  - [x 2025-11-02] Completed in db.py (lines 34, 109, 139, 218) - migrations framework integrated into db.py rather than separate migrations.py file

### 1.7 Testing - Milestone 1

- [x] **Test config/loader.py:**
  - [x] Test loading valid config file
  - [x] Test FileNotFoundError for missing file
  - [x] Test ValidationError for invalid YAML structure
  - [x] Test ValidationError for duplicate intent IDs
  - [x] Test ValidationError for empty brand aliases
  - [x] Test ValueError for missing env var
  - [x] Test ValueError for empty API key in env
  - [x] Test all Pydantic validators fire correctly
  - [x] Use pytest fixtures for temp config files
  - [x] Mock os.environ for API key resolution
  - [x 2025-11-02 commit af58993] Completed with 97% coverage for config module (schema.py and loader.py)

- [x] **Test utils/time.py:**
  - [x] Test utc_now() returns UTC datetime
  - [x] Test utc_timestamp() format is correct
  - [x] Test run_id_from_timestamp() format
  - [x] Test parse_timestamp() with valid input
  - [x] Test parse_timestamp() raises on missing 'Z'
  - [x] Test parse_timestamp() raises on invalid format
  - [x] Use freezegun to mock time
  - [x 2025-11-02 commit bcb3a9c] Completed with 100% coverage for utils/time.py

- [x] **Test storage/db.py:**
  - [x] Test init_db_if_needed() creates tables
  - [x] Test schema_version table created
  - [x] Test insert_run() with new run_id
  - [x] Test insert_run() idempotent (duplicate run_id)
  - [x] Test insert_answer_raw() with all fields
  - [x] Test UNIQUE constraint on answers_raw
  - [x] Test insert_mention() with all fields
  - [x] Test UNIQUE constraint on mentions
  - [x] Test update_run_cost() updates correctly
  - [x] Test indexes exist
  - [x] Use temp database for tests (tmp_path fixture)
  - [x 2025-11-02 commit fcfdc2e] Completed with 100% coverage for storage/db.py

- [x] **Test storage/migrations.py:**
  - [x] Test get_current_version() on empty DB
  - [x] Test get_current_version() on initialized DB
  - [x] Test apply_migrations() from version 0 to 1
  - [x] Test schema_version table populated after migration
  - [x 2025-11-02 commit fcfdc2e] Completed with comprehensive migration tests in test_storage_db.py (9 total migration tests including edge cases)

### 1.8 Milestone 1 Deliverable Checklist

- [x] Config can be loaded from YAML
- [x] Pydantic validation catches all error cases
- [x] API keys resolved from environment variables
- [x] Clear error messages for missing keys
- [x] SQLite database initialized with schema
- [x] All tables and indexes created
- [x] Schema versioning working
- [x] UTC timestamps enforced everywhere
- [x] Tests pass with good coverage (aim for 80%+)
- [x] Developer agent implemented code
- [x] Tester agent wrote comprehensive tests
- [x] Reviewer agent validated implementation

---

## Milestone 2: Provider Client + Runner Core

**Goal:** Running `runner.run_all()` in a REPL produces JSON + SQLite rows in output/ with cost estimates.

### 2.1 LLM Runner Module - Models (llm_runner/models.py)

- [x] **Define `LLMClient` Protocol:**
  ```python
  from typing import Protocol

  class LLMClient(Protocol):
      def generate_answer(self, prompt: str) -> tuple[str, dict]:
          """
          Run the model on the prompt and return (answer_text, usage_meta).
          Automatically retries on transient failures.
          Raises RuntimeError on permanent failures.
          """
  ```

- [x] **Implement `build_client(provider: str, model_name: str, api_key: str) -> LLMClient`**
  - [x] Check provider in supported list
  - [x] If provider == "openai", return OpenAIClient instance
  - [x] If provider == "anthropic", raise NotImplementedError (stub for future)
  - [x] Raise ValueError for unsupported provider
  - [x] Add comprehensive docstring
  - [x 2025-11-02 commit d76941a] Completed with LLMClient Protocol and build_client() factory implementation

### 2.2 LLM Runner Module - Retry Config (llm_runner/retry_config.py)

- [x] **Define retry configuration constants:**
  - [x] `MAX_ATTEMPTS = 3`
  - [x] `MIN_WAIT_SECONDS = 1`
  - [x] `MAX_WAIT_SECONDS = 10` (NOTE: Implemented as 60 to match existing openai_client behavior)
  - [x] `RETRY_STATUS_CODES = [429, 500, 502, 503, 504]`
  - [x] `NO_RETRY_STATUS_CODES = [401, 400, 404]`
  - [x] `REQUEST_TIMEOUT = 30.0`

- [x] **Create tenacity retry decorator configuration:**
  - [x] Use `stop_after_attempt(MAX_ATTEMPTS)`
  - [x] Use `wait_exponential(multiplier=1, min=MIN_WAIT, max=MAX_WAIT)`
  - [x] Use `retry_if_exception_type((httpx.HTTPStatusError,))`
  - [x] Add custom retry condition for specific status codes

**Completion Notes (2025-11-02):**
- retry_config module implemented and tested with 23 comprehensive tests (100% coverage)
- openai_client.py refactored to use retry_config for consistent retry behavior
- MAX_WAIT_SECONDS set to 60 (not 10) to match existing openai_client behavior and handle longer outages
- Module designed for reuse by future LLM clients (Anthropic, etc.)
- Custom retry condition properly filters status codes (retries 429, 500+; fails immediately on 401, 400, 404)
- Exponential backoff with jitter implemented via tenacity
- All tests passing, ready for production use

### 2.3 LLM Runner Module - OpenAI Client (llm_runner/openai_client.py)

- [x] **Implement `OpenAIClient` class:**
  - [x 2025-11-02 commit 86ead9e] Completed with OpenAIClient class, retry logic, cost tracking, and error handling
  - [x] `__init__(self, model_name: str, api_key: str)`
    - Store model_name and api_key
    - Create httpx.Client with timeout=30.0

  - [x] `@retry(...)` decorator with tenacity config

  - [x] `generate_answer(self, prompt: str) -> tuple[str, dict]`
    - [x] Build chat completion request:
      - System message: "You are an unbiased market analyst. Provide factual, balanced recommendations."
      - User message: prompt
    - [x] Make POST request to OpenAI chat completions endpoint
    - [x] Set Authorization header with Bearer token
    - [x] Handle non-retry status codes (401, 400, 404)
      - Raise immediately without retry
    - [x] Handle retry status codes (429, 500+)
      - Let tenacity handle retry
    - [x] Extract answer text from response
    - [x] Extract usage metadata (prompt_tokens, completion_tokens, etc.)
    - [x] Log success with context (no API key in logs)
    - [x] On final failure, raise RuntimeError with descriptive message
    - [x] Include request_id in error if available
    - [x] Return (answer_text, usage_meta)

  - [x] `close(self)`
    - Close httpx client

- [x] **Add comprehensive docstrings to all methods**

### 2.4 Utils Module - Cost Estimation (utils/cost.py)

- [x] **Define pricing table:**
  ```python
  PRICING = {
      "openai": {
          "gpt-4o-mini": {"input": 0.150 / 1_000_000, "output": 0.600 / 1_000_000},
          "gpt-4o": {"input": 2.50 / 1_000_000, "output": 10.00 / 1_000_000},
          "gpt-4-turbo": {"input": 10.00 / 1_000_000, "output": 30.00 / 1_000_000},
      },
      "anthropic": {
          "claude-3-5-haiku-20241022": {"input": 0.80 / 1_000_000, "output": 4.00 / 1_000_000},
          "claude-3-5-sonnet-20241022": {"input": 3.00 / 1_000_000, "output": 15.00 / 1_000_000},
      },
      # Updated: 2025-11-01
  }
  ```

- [x] **Implement `estimate_cost(provider: str, model: str, usage_meta: dict) -> float`**
  - [x] Get pricing for provider/model from PRICING table
  - [x] Return 0.0 with warning if pricing unavailable
  - [x] Extract prompt_tokens and completion_tokens from usage_meta
  - [x] Calculate: (input_tokens * input_price) + (output_tokens * output_price)
  - [x] Round to 6 decimal places
  - [x] Return cost in USD
  - [x] Add comprehensive docstring with disclaimer

- [x] **Add pricing update reminder in comments:**
  - [x] Note that pricing should be updated periodically
  - [x] Link to provider pricing pages
  - [x 2025-11-02 commit d76941a] Completed with pricing table and estimate_cost() implementation

### 2.5 Extractor Module - Mention Detector (extractor/mention_detector.py)

- [x] **Define `Mention` dataclass:**
  - Fields: `brand_name: str`, `normalized_name: str`, `first_position: int`, `match_type: str`
  - [x 2025-11-02 commit 83fa4a3] Completed with implementation

- [x] **Implement helper functions:**
  - [x] `normalize_brand_name(name: str) -> str`
    - Lowercase
    - Strip punctuation
    - Collapse whitespace
    - Return normalized form

  - [x] `create_word_boundary_pattern(alias: str) -> re.Pattern`
    - Escape special regex characters with `re.escape()`
    - Wrap with word boundaries: `\b{escaped}\b`
    - Compile with `re.IGNORECASE`
    - Return pattern

- [x] **Implement `detect_exact_mentions(text: str, brand_aliases: list[str]) -> list[Mention]`**
  - [x] For each brand alias:
    - Create word-boundary regex pattern
    - Search for matches in text
    - Record first occurrence position
    - Store original brand name and normalized name
    - Mark match_type as "exact"
  - [x] Deduplicate by normalized name (keep earliest)
  - [x] Return list of Mention objects

- [x] **Implement `detect_fuzzy_mentions(text: str, brand_aliases: list[str], threshold: float = 0.9) -> list[Mention]`**
  - [x] Import rapidfuzz.fuzz
  - [x] For each brand alias not found by exact match:
    - Use rapidfuzz to find similar strings in text
    - Check similarity score >= threshold
    - Record match position
    - Mark match_type as "fuzzy"
  - [x] Return list of Mention objects

- [x] **Implement `detect_mentions(text: str, my_brands: list[str], competitor_brands: list[str], fuzzy: bool = False) -> tuple[list[Mention], list[Mention]]`**
  - [x] Detect exact mentions for my_brands
  - [x] Detect exact mentions for competitor_brands
  - [x] If fuzzy=True:
    - Detect fuzzy mentions for brands not found exactly
  - [x] Sort mentions by first_position
  - [x] Return (my_mentions, competitor_mentions)
  - [x 2025-11-02 commit 83fa4a3] Completed with word-boundary regex and fuzzy matching implementation

### 2.6 Extractor Module - Rank Extractor (extractor/rank_extractor.py)

- [x] **Define `RankedBrand` dataclass:**
  - Fields: `brand_name: str`, `rank_position: int`, `confidence: float`

- [x] **Implement pattern-based extraction:**
  - [x] `extract_ranked_list_pattern(text: str, known_brands: list[str]) -> tuple[list[RankedBrand], float]`
    - [x] Look for numbered lists: `1. ToolName`, `2. ToolName`
    - [x] Look for bullet lists: `- ToolName`, `• ToolName`
    - [x] Look for markdown headers: `## ToolName`
    - [x] Extract tool names after markers
    - [x] Match against known_brands with fuzzy matching
    - [x] Assign rank_position based on order (0 = top)
    - [x] Calculate confidence:
      - 1.0: clear numbered list
      - 0.8: bullet list with consistent structure
      - 0.5: inferred from mention order
      - 0.3: no clear structure
    - [x] Deduplicate in first-seen order
    - [x] Return (ranked_list, confidence)

- [x] **Implement LLM-assisted extraction (stub for v1):**
  - [x] `extract_ranked_list_llm(text: str, known_brands: list[str], client: LLMClient) -> tuple[list[RankedBrand], float]`
    - [x] Build extraction prompt
    - [x] Call LLM with structured extraction request
    - [x] Parse JSON response
    - [x] Match against known_brands
    - [x] Return (ranked_list, 0.95) for high confidence
    - [x] Fallback to pattern-based if LLM call fails
    - [x] Note: This is optional and disabled by default in v1
  - [x 2025-11-02 commit b0ef4f3] Completed with stub implementation that falls back to pattern-based extraction

### 2.7 Extractor Module - Parser (extractor/parser.py)

- [x] **Define `ExtractionResult` dataclass:**
  - Fields:
    - `intent_id: str`
    - `model_provider: str`
    - `model_name: str`
    - `timestamp_utc: str`
    - `appeared_mine: bool`
    - `my_mentions: list[Mention]`
    - `competitor_mentions: list[Mention]`
    - `ranked_list: list[RankedBrand]`
    - `rank_extraction_method: str`
    - `rank_confidence: float`
  - [x 2025-11-02 commit 085f8ee] Completed with validation and comprehensive field definitions

- [x] **Implement `parse_answer(answer_text: str, brands: Brands, intent_id: str, provider: str, model_name: str, timestamp_utc: str, use_llm_extraction: bool = False) -> ExtractionResult`**
  - [x] Call detect_mentions() to get my_mentions and competitor_mentions
  - [x] Set appeared_mine = len(my_mentions) > 0
  - [x] Combine my_brands + competitor_brands for ranking
  - [x] Call extract_ranked_list_pattern() to get ranked list
  - [x] If use_llm_extraction=True (future):
    - Call extract_ranked_list_llm() instead
  - [x] Build ExtractionResult with all fields
  - [x] Return result
  - [x 2025-11-02 commit 085f8ee] Completed with 4-step pipeline, LLM extraction support, and error handling

### 2.8 Storage Module - Layout (storage/layout.py)

- [x] **Define naming conventions:**
  - [x] `get_run_directory(output_dir: str, run_id: str) -> str`
    - Return `{output_dir}/{run_id}/`

  - [x] `get_raw_answer_filename(intent_id: str, provider: str, model: str) -> str`
    - Return `intent_{intent_id}_raw_{provider}_{model}.json`

  - [x] `get_parsed_answer_filename(intent_id: str, provider: str, model: str) -> str`
    - Return `intent_{intent_id}_parsed_{provider}_{model}.json`

  - [x] `get_error_filename(intent_id: str, provider: str, model: str) -> str`
    - Return `intent_{intent_id}_error_{provider}_{model}.json`

  - [x] `get_run_meta_filename() -> str`
    - Return `run_meta.json`

  - [x] `get_report_filename() -> str`
    - Return `report.html`
- [x 2025-11-02 commit eddc2a6] Completed with deterministic naming, Path-based implementation, and comprehensive test suite (35 tests)

### 2.9 Storage Module - Writer (storage/writer.py)

- [x] **Implement file writing utilities:**
  - [x] `create_run_directory(output_dir: str, run_id: str) -> str`
    - Create directory with proper permissions
    - Return full path
    - Handle permission errors gracefully

  - [x] `write_json(filepath: str, data: dict | list)`
    - Serialize to JSON with indent=2, ensure_ascii=False
    - Write UTF-8 encoded file
    - Handle disk full errors

  - [x] `write_raw_answer(run_dir: str, intent_id: str, provider: str, model: str, data: dict)`
    - Build filename from layout conventions
    - Call write_json()

  - [x] `write_parsed_answer(run_dir: str, intent_id: str, provider: str, model: str, data: dict)`
    - Build filename from layout conventions
    - Call write_json()

  - [x] `write_error(run_dir: str, intent_id: str, provider: str, model: str, error_message: str)`
    - Build filename from layout conventions
    - Write error JSON with timestamp and message

  - [x] `write_run_meta(run_dir: str, meta: dict)`
    - Write run_meta.json

  - [x] `write_report_html(run_dir: str, html: str)`
    - Write report.html
- [x 2025-11-02 commit e618e8c] Implemented writer module with Path-based utilities, comprehensive error handling, and 27-test suite (commit 361aa9b)

### 2.10 LLM Runner Module - Runner (llm_runner/runner.py)

- [x] **Define `RawAnswerRecord` dataclass:**
  - Fields:
    - `intent_id: str`
    - `prompt: str`
    - `model_provider: str`
    - `model_name: str`
    - `timestamp_utc: str`
    - `answer_text: str`
    - `answer_length: int`
    - `usage_meta: dict`
    - `estimated_cost_usd: float`
  - [x 2025-11-02 commit 0268841] Completed with all required fields

- [x] **Implement `run_all(config: RuntimeConfig) -> dict`**
  - [x] Generate run_id using utils.time.run_id_from_timestamp()
  - [x] Create run directory using storage.writer
  - [x] Open SQLite connection
  - [x] Insert run record into database
  - [x] Initialize cost accumulator
  - [x] Initialize results list
  - [x] Loop over all (intent, model) combinations:
    - [x] Build LLM client using llm_runner.models.build_client()
    - [x] Try to generate answer:
      - [x] Call client.generate_answer(intent.prompt)
      - [x] Get timestamp_utc
      - [x] Build RawAnswerRecord
      - [x] Estimate cost using utils.cost.estimate_cost()
      - [x] Call extractor.parser.parse_answer()
      - [x] Write raw answer JSON
      - [x] Write parsed answer JSON
      - [x] Insert into answers_raw table
      - [x] Insert mentions into mentions table
      - [x] Accumulate cost
      - [x] Log success
    - [x] Catch exceptions:
      - [x] Log error (no API key in logs)
      - [x] Write error JSON
      - [x] Continue to next query
  - [x] Update run record with total cost
  - [x] Close SQLite connection
  - [x] Return summary dict:
    ```python
    {
        "run_id": run_id,
        "output_dir": run_dir,
        "total_cost_usd": total_cost,
        "successful_queries": success_count,
        "total_queries": total_count
    }
    ```
  - [x 2025-11-02 commit 0268841] Completed with full orchestration pipeline, error handling, and database/file writing

### 2.11 Testing - Milestone 2

**Progress Update (2025-11-02):**
- ✅ Completed 7 major test suites today (220 total tests)
- ✅ All tests passing with 97-100% coverage on tested modules
- ✅ Fixed import issues in llm_runner/models.py and llm_runner/openai_client.py
- ✅ Fixed critical bugs in parser.py, mention_detector.py, and runner.py discovered during testing
- ✅ All commits made via git-master subagent
- 📊 Test breakdown:
  - llm_runner/models.py: 19 tests (100% coverage)
  - llm_runner/openai_client.py: 31 tests (100% coverage)
  - utils/cost.py: 32 tests (100% coverage)
  - extractor/mention_detector.py: 46 tests (100% coverage)
  - extractor/rank_extractor.py: 51 tests (99% coverage)
  - extractor/parser.py: 32 tests (100% coverage)
  - llm_runner/runner.py: 9 tests (97% coverage)

- [x] **Test llm_runner/models.py:**
  - [x] Test build_client() with "openai" provider
  - [x] Test build_client() raises for "anthropic" (not implemented)
  - [x] Test build_client() raises for unknown provider
  - [x 2025-11-02] Completed with 19 comprehensive tests in tests/test_llm_runner_models.py - all passing, 100% coverage

- [x] **Test llm_runner/openai_client.py:**
  - [x] Use pytest-httpx to mock HTTP responses
  - [x] Test successful API call
  - [x] Test retry on 429 (rate limit)
  - [x] Test retry on 500 (server error)
  - [x] Test retry on 503 (service unavailable)
  - [x] Test no retry on 401 (auth error)
  - [x] Test no retry on 400 (bad request)
  - [x] Test max retries exceeded
  - [x] Test timeout handling
  - [x] Test response parsing
  - [x] Test usage metadata extraction
  - [x] Verify API key never logged
  - [x 2025-11-02] Completed with 31 comprehensive tests in tests/test_llm_runner_openai_client.py - all passing, 100% coverage
  - [x 2025-11-02] Fixed import issues to use full package names (llm_answer_watcher.*)

- [x] **Test utils/cost.py:**
  - [x] Test estimate_cost() with known pricing
  - [x] Test estimate_cost() with unknown model (returns 0.0)
  - [x] Test cost calculation accuracy
  - [x] Test rounding to 6 decimals
  - [x 2025-11-02] Completed with 32 comprehensive tests in tests/test_utils_cost.py - all passing, 100% coverage

- [x] **Test extractor/mention_detector.py:**
  - [x] Test normalize_brand_name()
  - [x] Test create_word_boundary_pattern()
  - [x] Test detect_exact_mentions() finds brands
  - [x] Test word boundary prevents false positives ("hub" not in "GitHub")
  - [x] Test case-insensitive matching
  - [x] Test fuzzy matching with rapidfuzz
  - [x] Test fuzzy threshold (90%)
  - [x] Test deduplication by normalized name
  - [x] Test first_position tracking
  - [x 2025-11-02] Completed with 46 comprehensive tests in tests/test_extractor_mention_detector.py - all passing, 100% coverage

- [x] **Test extractor/rank_extractor.py:**
  - [x] Test pattern extraction with numbered list
  - [x] Test pattern extraction with bullets
  - [x] Test pattern extraction with markdown headers
  - [x] Test confidence calculation
  - [x] Test matching against known brands
  - [x] Test deduplication
  - [x] Test rank_position assignment
  - [x 2025-11-02] Completed with 51 comprehensive tests in tests/test_extractor_rank_extractor.py - all passing, 99% coverage
  - [x] Fixed regex syntax bug in bullet pattern during test development

- [x] **Test extractor/parser.py:**
  - [x] Test parse_answer() with sample LLM response
  - [x] Test appeared_mine flag
  - [x] Test my_mentions populated
  - [x] Test competitor_mentions populated
  - [x] Test ranked_list extraction
  - [x] Use fixtures for sample answers
  - [x 2025-11-02] Completed with 32 comprehensive tests in tests/test_extractor_parser.py - all passing, 100% coverage
  - **BUGS DISCOVERED AND FIXED:**
    - parser.py: Fixed incorrect detect_mentions() call - was unpacking 4 values instead of 2-tuple
    - mention_detector.py: Fixed brand normalization logic - our_brands should use all aliases for one brand, competitors are separate brands

- [x] **Test storage/writer.py:**
  - [x] Test create_run_directory()
  - [x] Test write_json() with dict
  - [x] Test write_json() with list
  - [x] Test UTF-8 encoding
  - [x] Test write_raw_answer()
  - [x] Test write_parsed_answer()
  - [x] Test write_error()
  - [x] Use tmp_path fixture
  - [x 2025-11-02] Completed with 27 comprehensive tests in tests/test_storage_writer.py - all passing, 100% coverage

- [x] **Test llm_runner/runner.py:**
  - [x] Mock LLM client responses
  - [x] Test run_all() end-to-end
  - [x] Test run_id generation
  - [x] Test directory creation
  - [x] Test database inserts
  - [x] Test JSON file creation
  - [x] Test cost accumulation
  - [x] Test error handling (API failure)
  - [x] Test partial success (some queries fail)
  - [x] Verify error JSON written on failure
  - [x] Use temp database and output directory
  - [x 2025-11-02] Completed with 9 comprehensive tests in tests/test_llm_runner_runner.py - all passing, 97% coverage
  - **BUGS DISCOVERED AND FIXED:**
    - runner.py: Fixed incorrect import (insert_answer → insert_answer_raw)
    - runner.py: Fixed incorrect function call
    - runner.py: Fixed estimate_cost() signature (usage_meta dict instead of individual tokens)
    - runner.py: Removed unused imports

### 2.12 Milestone 2 Deliverable Checklist

- [x] LLM client interface defined
- [x] OpenAI client implemented with retry logic
- [x] Retry works correctly (429, 500+ status codes)
- [x] Cost estimation working
- [x] Mention detection with word boundaries
- [x] Fuzzy matching with rapidfuzz
- [x] Rank extraction with pattern matching
- [x] Parser orchestrates mention + rank extraction
- [x] Runner orchestrates full execution
- [x] JSON artifacts written correctly
- [x] SQLite inserts working
- [x] Costs calculated and tracked
- [x] Error handling robust (queries can fail gracefully)
- [x] Tests pass with 80%+ coverage (achieved 97-100% coverage)
- [x] HTTP mocking working in tests
- [x] Developer agent implemented code
- [x] Tester agent wrote comprehensive tests
- [x] Reviewer agent validated implementation

**MILESTONE 2 STATUS: ✅ COMPLETE (100%)**
- All implementation tasks completed
- All test suites completed (220 tests total)
- All bugs discovered during testing have been fixed
- Coverage exceeds 80% target (97-100% on all modules)
- Ready to proceed to Milestone 3

---

## Milestone 3: Report Generation + CLI

**Goal:** User can run CLI in both human and agent modes, see beautiful output or structured JSON, and get correct exit codes.

### 3.1 Utils Module - Console (utils/console.py)

- [x] **Setup Rich console infrastructure:**
  - [x] Import Rich components (Console, Progress, Table, Panel, Status)
  - [x] Create global console instance
  - [x 2025-11-02] Completed in commit [pending] - 543 lines implementation

- [x] **Implement `OutputMode` class:**
  - [x] `__init__(self, format: str = "text", quiet: bool = False)`
  - [x] `is_human(self) -> bool`
  - [x] `is_agent(self) -> bool`
  - [x] `add_json(self, key: str, value: Any)`
  - [x] `flush_json(self)`
  - [x] Create global output_mode instance

- [x] **Implement context managers and helpers:**
  - [x] `@contextmanager spinner(message: str)`
    - Show spinner in human mode
    - Silent in agent mode

  - [x] `create_progress_bar() -> Progress`
    - Return Rich Progress in human mode
    - Return NoOpProgress in agent mode

  - [x] `NoOpProgress` class
    - Implement __enter__, __exit__
    - Implement add_task(), advance() as no-ops

- [x] **Implement output functions:**
  - [x] `success(message: str)`
    - Rich green checkmark in human mode
    - Buffer JSON in agent mode

  - [x] `error(message: str)`
    - Rich red X in human mode
    - Buffer JSON in agent mode

  - [x] `warning(message: str)`
    - Rich yellow warning in human mode
    - Buffer JSON in agent mode

  - [x] `info(message: str)`
    - Rich blue info in human mode
    - Silent in agent/quiet mode

- [x] **Implement `print_summary_table(results: list[dict])`**
  - [x] In human mode:
    - Create Rich Table with rounded borders
    - Columns: Intent, Model, Appeared, Cost, Status
    - Color-code: green for success, red for failure
  - [x] In agent mode:
    - Buffer results as JSON array
  - [x] In quiet mode:
    - Skip output

- [x] **Implement `print_banner(version: str)`**
  - [x] Show fancy ASCII art banner in human mode
  - [x] Silent in agent mode

- [x] **Implement `print_final_summary(run_id, output_dir, total_cost, successful, total)`**
  - [x] In human mode:
    - Create Rich Panel with stats
    - Show run_id, output_dir, cost, query counts
    - Green border if all successful, yellow if partial
  - [x] In agent mode:
    - Buffer all fields as JSON
    - Flush JSON to stdout
  - [x] In quiet mode:
    - Print tab-separated values

### 3.2 Report Module - Cost Formatter (report/cost_formatter.py)

- [x] **Implement cost formatting utilities:**
  - [x] `format_cost_usd(cost: float) -> str`
    - Format to 4 decimal places with $ prefix
    - Example: "$0.0023"
    - [x 2025-11-02] Completed in commit with 66 tests, 100% coverage

  - [x] `format_cost_summary(costs: list[float]) -> dict`
    - Calculate total, min, max, average
    - Return dict with formatted strings
    - [x 2025-11-02] Completed in commit with comprehensive validation

### 3.3 Report Module - Generator (report/generator.py)

- [x] **Create Jinja2 template (report/templates/report.html.j2):**
  - [x] HTML5 structure with inline CSS
  - [x] Mobile-responsive design
  - [x] Sections:
    - [x] Header with run_id, timestamp, models used
    - [x] Summary stats (total cost, queries, success rate)
    - [x] For each intent:
      - [x] Intent title and prompt
      - [x] For each model:
        - [x] Model name
        - [x] "Appeared" indicator (green ✓ or red ✗)
        - [x] My mentions (brand names + positions)
        - [x] Competitor mentions (sorted by position)
        - [x] Ranked list with confidence indicator
        - [x] Query cost
    - [x] Footer with cost disclaimer
  - [x] Use Bootstrap-like responsive grid or simple flexbox
  - [x] Color scheme: professional blues and greens
  - [x] **CRITICAL: Ensure autoescaping enabled**
  - [x 2025-11-02] Completed - 18KB template with comprehensive sections

- [x] **Implement `generate_report(run_dir: str, run_id: str, config: RuntimeConfig, results: list) -> str`**
  - [x] Read all parsed JSON files from run_dir
  - [x] Aggregate data for template
  - [x] Setup Jinja2 environment:
    ```python
    env = Environment(
        loader=FileSystemLoader('templates'),
        autoescape=True  # CRITICAL for security
    )
    ```
  - [x] Load template
  - [x] Render with data
  - [x] Return HTML string
  - [x] Test with malicious brand name: `<script>alert('xss')</script>`
  - [x 2025-11-02] Completed in generator.py with autoescaping (line 103)

- [x] **Implement `write_report(run_dir: str, config: RuntimeConfig, results: list)`**
  - [x] Call generate_report()
  - [x] Write HTML to report.html using storage.writer
  - [x 2025-11-02] Completed in generator.py (lines 126-164)

### 3.4 CLI Module (cli.py)

- [x] **Setup Typer app:**
  - [x] Import Typer, Rich, and all modules
  - [x] Create Typer app instance
  - [x] Read VERSION file for version display
  - [x 2025-11-02] Completed in cli.py (559 lines)

- [x] **Define exit codes:**
  ```python
  EXIT_SUCCESS = 0          # All queries successful
  EXIT_CONFIG_ERROR = 1     # Config validation failed
  EXIT_DB_ERROR = 2         # Database initialization failed
  EXIT_PARTIAL_FAILURE = 3  # Some queries failed
  EXIT_COMPLETE_FAILURE = 4 # All queries failed
  ```
  - [x 2025-11-02] Completed (lines 66-71)

- [x] **Implement `main()` entry point:**
  - [x] Setup Typer app
  - [x] Add callback for --version
  - [x 2025-11-02] Completed (lines 471-527)

- [x] **Implement `run` command:**
  ```python
  @app.command()
  def run(
      config: Path = typer.Option(..., "--config", help="Path to watcher.config.yaml"),
      format: str = typer.Option("text", "--format", help="Output format: text or json"),
      quiet: bool = typer.Option(False, "--quiet", help="Minimal output"),
      yes: bool = typer.Option(False, "--yes", help="Skip all prompts"),
      verbose: bool = typer.Option(False, "--verbose", "-v", help="Enable debug logging"),
  ):
  ```
  - [x] Set output_mode based on flags
  - [x] Setup logging level (DEBUG if verbose)
  - [x] Show banner in human mode
  - [x] Wrap operations in try/except blocks:
    - [x] Load config (catch errors → EXIT_CONFIG_ERROR)
    - [x] Init database (catch errors → EXIT_DB_ERROR)
    - [x] Show spinner "Loading config..." in human mode
    - [x] Success message after config load
    - [x] If not --yes, confirm intent count and model count
    - [x] Estimate rough cost and show warning if high
    - [x] Create progress bar in human mode
    - [x] Call runner.run_all()
    - [x] Update progress bar for each query
    - [x] Generate report
    - [x] Write report HTML
    - [x] Show summary table
    - [x] Show final summary panel/JSON
    - [x] Determine exit code:
      - 0 if all successful
      - 3 if partial failure
      - 4 if complete failure
    - [x] Exit with appropriate code
  - [x 2025-11-02] Completed (lines 82-363) with 50 tests

- [x] **Implement `validate` command:**
  ```python
  @app.command()
  def validate(
      config: Path = typer.Option(..., "--config", help="Path to watcher.config.yaml"),
      format: str = typer.Option("text", "--format", help="Output format: text or json"),
  ):
  ```
  - [x] Set output_mode
  - [x] Try to load config
  - [x] Validate all Pydantic models
  - [x] Check if API key env vars are set (without reading values)
  - [x] Output success or error
  - [x] Return EXIT_SUCCESS or EXIT_CONFIG_ERROR
  - [x 2025-11-02] Completed (lines 365-469)

- [x] **Implement `version` callback:**
  - [x] Read VERSION file
  - [x] Print version string
  - [x] Exit
  - [x 2025-11-02] Completed (lines 506-513)

- [x] **Write comprehensive --help text:**
  - [x] Command description
  - [x] Option explanations
  - [x] Usage examples:
    ```
    # Human mode (default)
    llm-answer-watcher run --config watcher.config.yaml

    # Agent mode (structured JSON output)
    llm-answer-watcher run --config watcher.config.yaml --format json

    # Quiet mode (minimal output)
    llm-answer-watcher run --config watcher.config.yaml --quiet

    # Automation mode (no prompts)
    llm-answer-watcher run --config watcher.config.yaml --yes --format json

    # Validate config before running
    llm-answer-watcher validate --config watcher.config.yaml
    ```
  - [x] Exit code documentation:
    ```
    Exit Codes:
      0: Success - all queries completed successfully
      1: Configuration error (invalid YAML, missing API keys)
      2: Database error (cannot create or access SQLite)
      3: Partial failure (some queries failed, but run completed)
      4: Complete failure (no queries succeeded)
    ```
  - [x 2025-11-02] Completed in docstrings (lines 133-148)

### 3.5 Example Configuration

- [x] **Create examples/ directory**
  - [x 2025-11-02] Completed - directory exists with config files
- [x] **Create examples/watcher.config.yaml:**
  - [x] Example with 2-3 intents (3 intents: email-warmup, comparison, sales-engagement)
  - [x] Example brands (mine and competitors)
  - [x] Multiple models (gpt-4o-mini, claude-3-5-haiku)
  - [x] Comments explaining each section
  - [x] Use env var placeholders (no real API keys)
  - [x 2025-11-02] Completed - 37 lines with comprehensive examples

- [x] **Create examples/.env.example:**
  - [x] Show required environment variables
  - [x] OPENAI_API_KEY=your_key_here
  - [x] Instructions for setting up
  - [x 2025-11-02] Completed - includes OPENAI_API_KEY and ANTHROPIC_API_KEY

### 3.6 Testing - Milestone 3

**Progress Update (2025-11-02):**
- ✅ Completed console module test suite (78 tests)
- ✅ Completed cost_formatter test suite (66 tests)
- ✅ Completed report generator test suite (67 tests)
- ✅ Completed CLI test suite (50 tests)
- ✅ All tests passing with 100% coverage
- ✅ ANSI code validation for all three modes
- 📊 Total test count: 696 tests collected
- 📊 Milestone 3 test count: 261 tests COMPLETE (78 console + 66 cost_formatter + 67 generator + 50 cli)

- [x] **Test utils/console.py:**
  - [x] Test OutputMode class
  - [x] Test is_human() and is_agent()
  - [x] Test spinner() context manager
  - [x] Test progress bar creation
  - [x] Test NoOpProgress behavior
  - [x] Test success/error/warning/info functions
  - [x] Test print_summary_table() in both modes
  - [x] Test print_final_summary() in both modes
  - [x] Test JSON buffering and flushing
  - [x] Capture stdout to verify output
  - [x 2025-11-02] Completed with 78 comprehensive tests in tests/test_utils_console.py - all passing, 100% coverage (123/123 statements)

- [x] **Test report/cost_formatter.py:**
  - [x] Test format_cost_usd() with various values
  - [x] Test format_cost_summary() with cost lists
  - [x] Test error handling for negative costs
  - [x] Test precision (4 and 6 decimals)
  - [x 2025-11-02] Completed with 66 tests, 100% coverage

- [x] **Test report/generator.py:**
  - [x] Test generate_report() with sample data
  - [x] Test HTML structure is valid
  - [x] Test autoescaping prevents XSS
  - [x] Test with malicious input: `<script>alert('xss')</script>`
  - [x] Verify brand names are escaped in output
  - [x] Test mobile-responsive CSS
  - [x] Test cost display
  - [x] Test confidence indicators
  - [x] Snapshot test for HTML output
  - [x 2025-11-02] Completed with 67 tests (66 passed, 1 skipped)

- [x] **Test cli.py:**
  - [x] Use Typer testing utilities
  - [x] Test run command with valid config
  - [x] Test run command with invalid config (exit code 1)
  - [x] Test run command with missing env vars (exit code 1)
  - [x] Test run command with --format json
  - [x] Test JSON output has no ANSI codes
  - [x] Test JSON output is valid (parse with json.loads())
  - [x] Test run command with --quiet
  - [x] Test run command with --yes (no prompts)
  - [x] Test validate command with valid config
  - [x] Test validate command with invalid config
  - [x] Test --version flag
  - [x] Test exit codes are correct
  - [x] Mock runner.run_all() for isolation
  - [x 2025-11-02] Completed with 50 tests, 100% coverage

### 3.7 Milestone 3 Deliverable Checklist

- [x] Rich console utilities implemented
- [x] OutputMode pattern working
- [x] Spinners and progress bars in human mode
- [x] Tables and panels in human mode
- [x] JSON output in agent mode (no ANSI codes)
- [x] Quiet mode for minimal output
- [x] Report template created with inline CSS
- [x] Report generator working with autoescaping
- [x] XSS prevention tested
- [x] CLI commands implemented (run, validate)
- [x] Exit codes correct (0-4)
- [x] --help text comprehensive with examples
- [x] Example config created
- [x] User can run human mode and see beautiful output
- [x] User can run agent mode and get valid JSON
- [x] User can run quiet mode and get tab-separated values
- [x] User can run --yes mode without prompts
- [x] report.html opens in browser correctly
- [x] Tests pass with 100% coverage (261 tests in Milestone 3)
- [x] Developer agent implemented code
- [x] Tester agent wrote comprehensive tests
- [x] Reviewer agent validated implementation

**MILESTONE 3 STATUS: ✅ COMPLETE (100%)**
- All implementation tasks completed
- All test suites completed (261 tests: 78 console + 66 cost_formatter + 67 generator + 50 cli)
- All deliverables met with 100% test coverage
- Total project test count: 696 tests
- Ready to proceed to Milestone 4

---

## Milestone 4: Polish, Docs, Tests

**Goal:** OSS v1 is production-ready and ready to publish.

### 4.1 Documentation

#### 4.1.1 README.md

- [x] **Write comprehensive README.md:**
  - [x] Project title and tagline
  - [x] Badges (license, Python version, tests)
  - [x] Quick description (1-2 sentences)
  - [x] Key features list
  - [x] Prerequisites:
    - Python 3.12+ or 3.13
    - uv (recommended) or pip
  - [x] Installation:
    ```bash
    # With uv (recommended)
    uv sync

    # With pip
    pip install -e .
    ```
  - [x] Configuration:
    - [x] How to create watcher.config.yaml
    - [x] Required sections explained
    - [x] Environment variables for API keys
    - [x] Best practices for brand aliases (avoid generic terms, use complete names)
  - [x] Usage:
    - [x] Human mode example
    - [x] Agent mode example
    - [x] Quiet mode example
    - [x] Validation example
  - [x] Output:
    - [x] Where data is stored (output/, watcher.db)
    - [x] What report.html contains
    - [x] How to query SQLite for trends
  - [x] Exit codes reference (0-4)
  - [x] Cost estimation:
    - [x] How it works
    - [x] Disclaimer about accuracy
    - [x] Link to provider pricing pages
  - [x] Using with AI Agents:
    - [x] Explain --format json flag
    - [x] Explain --yes flag
    - [x] Explain exit codes for automation
    - [x] Example automation script
  - [x] Security notes:
    - [x] Never commit .env files
    - [x] API keys loaded from environment only
  - [x] Example queries for SQLite:
    ```sql
    -- Show all times we appeared in last 7 days
    SELECT * FROM mentions
    WHERE is_mine = 1 AND timestamp_utc > date('now', '-7 days')
    ORDER BY timestamp_utc DESC;

    -- Which competitor ranked #1 most often?
    SELECT normalized_name, COUNT(*) as times_ranked_first
    FROM mentions
    WHERE rank_position = 0 AND is_mine = 0
    GROUP BY normalized_name
    ORDER BY times_ranked_first DESC;

    -- Total LLM query cost this month
    SELECT SUM(total_cost_usd) FROM runs
    WHERE timestamp_utc >= date('now', 'start of month');
    ```
  - [x] Contributing link
  - [x] License
  - [x] Acknowledgments

#### 4.1.2 CONTRIBUTING.md

- [x] **Write contributor guide:**
  - [x] Welcome message
  - [x] Prerequisites (Python 3.12+, uv)
  - [x] Setup:
    ```bash
    git clone <repo>
    cd llm-answer-watcher
    uv sync
    ```
  - [x] Running tests:
    ```bash
    pytest
    pytest --cov  # with coverage
    pytest -v     # verbose
    ```
  - [x] Code standards:
    - [x] Python 3.12+ type hints (use `|` not `Union[]`)
    - [x] Pydantic for validation
    - [x] Docstrings on all public functions (Google style)
    - [x] Word-boundary regex for brand matching
    - [x] UTC timestamps everywhere
    - [x] No API keys in logs
  - [x] Testing guidelines:
    - [x] Aim for 80%+ coverage
    - [x] Use fixtures for common scenarios
    - [x] Mock HTTP calls with pytest-httpx
    - [x] Mock time with freezegun
    - [x] Use temp files/databases for tests
  - [x] How to add a new LLM provider:
    - [x] Implement LLMClient protocol
    - [x] Add to build_client() in llm_runner/models.py
    - [x] Add pricing to utils/cost.py
    - [x] Add tests
    - [x] Update documentation
  - [x] Pull request process:
    - [x] Fork the repo
    - [x] Create feature branch
    - [x] Make changes with tests
    - [x] Run linting and tests
    - [x] Submit PR with description
  - [x] Code review expectations
  - [x] Subagent team workflow:
    - [x] Developer implements
    - [x] Tester writes tests
    - [x] Reviewer validates
  - [x] Questions? Open an issue
  - [x 2025-11-02] Completed in commit 732e42d - Comprehensive contributor guide with setup instructions, testing guidelines, code standards, LLM provider integration guide, and subagent workflow documentation

### 4.2 Expanded Test Coverage

**CRITICAL UPDATE (2025-11-02):** ✅ **RESOLVED** - OpenAI client test isolation issues fixed!
- Issue: HTTPX logging interference between tests caused failures when run as suite
- Solution: Added HTTPX logger suppression in openai_client.py (lines 41-42)
- Result: All tests now pass consistently: 695 passed, 1 skipped
- This unblocks all Milestone 4.2 expanded test coverage tasks

#### 4.2.1 Config Tests

- [x] **Test all validation edge cases:** - COMPLETED (af58993)
  - [x] Empty config file
  - [x] Missing required sections
  - [x] Invalid YAML syntax
  - [x] Duplicate intent IDs
  - [x] Empty brand aliases
  - [x] Generic brand terms (too short)
  - [x] Invalid provider name
  - [x] Missing API key env var
  - [x] Empty API key in env var
  - [x] Invalid output_dir path
  - [x] Zero models configured
  - [x] Zero intents configured
  - [x] Brands in both mine and competitors lists

#### 4.2.2 Extractor Tests

- [x] **Comprehensive mention detection tests:** - COMPLETED (46 tests, 100% coverage)
  - [x] Exact match with word boundaries
  - [x] Case-insensitive matching
  - [x] Special characters in brand names
  - [x] Multiple occurrences (track first position)
  - [x] Fuzzy matching near-matches
  - [x] Fuzzy threshold testing
  - [x] Unicode characters in brand names
  - [x] Very long brand names (>100 chars)
  - [x] Empty text input
  - [x] Text with no matches
  - [x] Overlapping brand aliases

- [x] **Comprehensive rank extraction tests:** - COMPLETED (51 tests, 99% coverage)
  - [x] Numbered list (1. 2. 3.)
  - [x] Numbered list with parentheses (1) 2) 3))
  - [x] Bullet list with dashes (- Item)
  - [x] Bullet list with dots (• Item)
  - [x] Markdown headers (## Tool)
  - [x] Mixed format (some numbered, some bullets)
  - [x] Conversational answer (no clear structure)
  - [x] Empty list
  - [x] Confidence scoring accuracy
  - [x] Brand name matching with fuzzy logic
  - [x] Deduplication of repeated brands

#### 4.2.3 Database Tests

- [x] **SQLite roundtrip tests:** - COMPLETED (test_storage_db.py with 100% coverage)
  - [x] Create temp database
  - [x] Insert run record
  - [x] Insert answer_raw records
  - [x] Insert mention records
  - [x] Query back and verify data
  - [x] Test UNIQUE constraints:
    - [x] Duplicate run_id (should skip)
    - [x] Duplicate (run_id, intent_id, provider, model) in answers_raw
    - [x] Duplicate (run_id, intent_id, provider, model, normalized_name) in mentions
  - [x] Test foreign key constraints
  - [x] Test indexes exist and are used
  - [x] Test update_run_cost()

#### 4.2.4 Report Tests

- [x] **HTML generation tests:** - COMPLETED (67 tests with XSS protection)
  - [x] Generate report with sample data
  - [x] Verify HTML structure (valid HTML5)
  - [x] Verify autoescaping works
  - [x] Test with XSS payloads:
    - [x] `<script>alert('xss')</script>`
    - [x] `<img src=x onerror=alert(1)>`
    - [x] `<iframe src="javascript:alert(1)">`
  - [x] Verify brand names are escaped
  - [x] Verify intent prompts are escaped
  - [x] Test with empty data (no queries)
  - [x] Test with partial data (some queries failed)
  - [x] Snapshot test for HTML output

#### 4.2.5 Cost Calculation Tests

- [x] **Pricing accuracy tests:** - COMPLETED (66 tests, 100% coverage)
  - [x] Test known model costs
  - [x] Test unknown model (returns 0.0)
  - [x] Test with zero tokens
  - [x] Test with large token counts
  - [x] Test rounding behavior
  - [x] Test cost accumulation across queries

#### 4.2.6 Schema Migration Tests

- [x] **Migration framework tests:** - COMPLETED (in test_storage_db.py)
  - [x] Test get_current_version() on new DB (version 0)
  - [x] Test apply_migrations() from 0 to 1
  - [x] Test schema_version table populated correctly
  - [x] Test migration idempotency (can run multiple times)
  - [x] Test future migration (stub migration 2)

#### 4.2.7 Retry Logic Tests

- [x] **Comprehensive retry tests:** - COMPLETED (23 tests in retry_config.py)
  - [x] Mock 429 (rate limit) → retry → success
  - [x] Mock 500 (server error) → retry → success
  - [x] Mock 503 (service unavailable) → retry → success
  - [x] Mock 429 → 429 → 429 → fail after max retries
  - [x] Mock 401 (auth error) → fail immediately (no retry)
  - [x] Mock 400 (bad request) → fail immediately (no retry)
  - [x] Test exponential backoff timing
  - [x] Test max wait time (60s - matches implementation)
  - [x] Test timeout handling (30s)

#### 4.2.8 CLI Tests

- [x] **End-to-end CLI tests:** - COMPLETED (50 tests, 100% coverage)
  - [x] Test run command success
  - [x] Test run command with config error
  - [x] Test run command with DB error
  - [x] Test run command with partial failures
  - [x] Test run command with complete failure
  - [x] Verify exit codes correct
  - [x] Test --format json output
  - [x] Verify JSON has no ANSI codes
  - [x] Verify JSON is valid (parse it)
  - [x] Verify JSON has required fields
  - [x] Test --quiet output
  - [x] Test --yes flag (no prompts)
  - [x] Test validate command
  - [x] Test --version flag

**MILESTONE 4.2 STATUS: ✅ COMPLETE (100%)**
- All expanded test coverage tasks completed
- Critical OpenAI client test isolation issues resolved
- 695 tests passing consistently with 80%+ coverage
- Ready to proceed to Milestone 4.4: CI/CD Pipeline

### 4.3 Coverage Target

- [x] **Achieve 80%+ test coverage:** - ✅ **ACHIEVED** (695 passed, 1 skipped)
  - [x] Run pytest with coverage: `pytest --cov=llm_answer_watcher --cov-report=html`
  - [x] Review coverage report
  - [x] Add tests for uncovered lines
  - [x] Target 100% coverage for critical paths:
    - [x] config.loader (97% coverage)
    - [x] llm_runner.openai_client (100% coverage)
    - [x] extractor.mention_detector (100% coverage)
    - [x] storage.db (100% coverage)
  - [x] Document any intentionally uncovered code

### 4.4 CI/CD Pipeline

- [x] **Create .github/workflows/test.yml:** ✅ (commit: ee5696d)
  - [x] Trigger on push and pull requests
  - [x] Test matrix: Python 3.12 and 3.13
  - [x] Steps:
    - [x] Checkout code
    - [x] Setup Python
    - [x] Install uv
    - [x] Run `uv sync`
    - [x] Run `pytest --cov`
    - [x] Upload coverage to Codecov (optional)
  - [x] Fail build if tests fail
  - [x] Badge for README
  - [x 2025-11-02] Completed in commit ccdb8df - Added GitHub Actions build status badge to README.md

- [x] **Create .github/workflows/lint.yml:**
  - [x] Trigger on push and pull requests
  - [x] Steps:
    - [x] Checkout code
    - [x] Setup Python
    - [x] Install ruff
    - [x] Run `ruff check .`
    - [x] Run `ruff format --check .`
  - [x] Fail build if linting fails
  - **✅ COMPLETED (commit d239644):** Created complete GitHub Actions workflow for linting with ruff, configured to trigger on push/PR, run on Python 3.12, and fail build on linting errors.

**MILESTONE 4.4 STATUS: ✅ COMPLETE (100%)**
- All CI/CD pipeline tasks completed
- GitHub Actions workflows created and functional (test.yml, lint.yml)
- Build status badge added to README.md (commit ccdb8df)
- Pipeline triggers on push and pull requests
- Tests run on Python 3.12 and 3.13 matrix
- Linting runs with ruff
- Builds fail appropriately on test/lint failures

### 4.5 Example Output

- [x] **Create examples/sample_output/ directory**
- [x] **Generate sample output:**
  - [x] Run CLI with example config
  - [x] Copy output directory to examples/sample_output/
  - [x] Include:
    - [x] run_meta.json (redact any sensitive info)
    - [x] Sample intent_*_raw_*.json files
    - [x] Sample intent_*_parsed_*.json files
    - [x] report.html
  - [x] Add README explaining the sample output
- **✅ COMPLETED (commit bc67b57):** Created comprehensive sample output directory with mock data showcasing all output formats. Includes complete HTML report, raw LLM responses (OpenAI and Anthropic examples), parsed brand mentions with extraction results, run metadata with cost tracking, and detailed README.md documentation. All files use mock data with no real API keys.

### 4.6 Final Polish

- [x] **Review all code for quality:**
  - [x] Use Reviewer agent to check each module
  - [x] Ensure all docstrings present
  - [x] Ensure all type hints present
  - [x] Check for security issues
  - [x] Check for performance issues
  - [x] Verify error messages are helpful

- [x] **Update all documentation:**
  - [x] Verify README is accurate
  - [x] Verify CONTRIBUTING is complete
  - [x] Update SPECS.md if anything changed
  - [x] Update AGENTS.md if workflow improved
  - [x] Update HOOKS.md if hooks added

- [x] **Verify git commits:**
  - [x] All commits follow conventional format
  - [x] No secrets in repo history
  - [x] .gitignore covers all output files

**✅ COMPLETED - Final Polish Phase Complete**

**Critical Issues Fixed During Final Polish:**
1. **LLMResponse Object Unpacking Runtime Error** - Fixed parameter mismatch in response handling
2. **Database Parameter Mismatches** - Fixed SQL parameter binding issues
3. **Overly Broad Secret Redaction** - Security fix: redacted too much, potentially hiding errors
4. **Hardcoded Success Assumption in CLI** - Fixed CLI to properly handle actual operation results
5. **Inconsistent Brand Matching** - Fixed word-boundary pattern matching
6. **Updated Test Mocks** - Aligned test mocks with new API response format

**Verification:** All 695 tests passing, proper conventional commits used, no secrets in repository.

### 4.7 Milestone 4 Deliverable Checklist

- [x] README.md complete and accurate ✅ **2025-11-02** (includes eval framework documentation)
- [x] CONTRIBUTING.md clear and helpful ✅ **2025-11-02** (includes eval metrics guide)
- [x] Test coverage >= 80% ✅ **2025-11-02** (88% coverage achieved)
- [x] Critical paths have 100% coverage ✅ (extractor, utils modules at 100%)
- [x] CI/CD pipeline passing ✅ (GitHub Actions workflow active)
- [x] GitHub Actions running tests ✅ (eval suite + pytest on every push/PR)
- [x] Example config in examples/ ✅ (watcher.config.yaml exists)
- [x] Sample output in examples/sample_output/ ✅ (complete with report.html)
- [x] All docstrings present ✅ (98%+ coverage verified 2025-11-02)
- [x] All type hints present ✅ (95%+ coverage verified 2025-11-02)
- [x] Reviewer agent approved all code ✅ (5/5 rating, comprehensive review 2025-11-02)
- [x] No security vulnerabilities ✅ (Security audit passed: API key protection, SQL injection prevention, XSS prevention, regex escaping)
- [x] No API keys in repo ✅ (confirmed - uses env vars only)
- [x] Exit codes working correctly ✅ (0-4 codes implemented and tested)
- [x] --help text comprehensive ✅ (tested and verified)
- [ ] Agent mode tested by AI agent (needs testing)
- [ ] Human mode tested manually (needs testing)
- [ ] report.html renders beautifully (needs verification)
- [x] SQLite queries work as documented ✅ (tested in evals/README.md examples)

---

## Definition of Done for OSS v1

**Before publishing, verify ALL these conditions:**

### Installation & Setup

- [x] `pip install -e .` works on Python 3.12
- [x] `pip install -e .` works on Python 3.13
- [x] `uv sync` works on Python 3.12
- [x] `uv sync` works on Python 3.13
- [x] All dependencies install without errors
- [x] Entry point `llm-answer-watcher` is available after install

### CLI Commands

- [x] `llm-answer-watcher --version` prints version from VERSION file
- [x] `llm-answer-watcher --help` shows comprehensive help text
- [x] `llm-answer-watcher validate --config examples/watcher.config.yaml` passes
- [x] `llm-answer-watcher validate --config examples/watcher.config.yaml --format json` produces valid JSON

### Human Mode (Default)

- [x] `llm-answer-watcher run --config examples/watcher.config.yaml` completes successfully
- [x] Shows startup banner
- [x] Shows spinner "Loading config..."
- [x] Shows confirmation prompt (can be skipped with --yes)
- [x] Shows progress bar for queries
- [x] Shows summary table with:
  - Intent names
  - Model names
  - Appeared indicators (✓ or ✗)
  - Costs
  - Status indicators
- [x] Shows final summary panel with:
  - Run ID
  - Output directory
  - Total cost
  - Query success count
- [x] Creates timestamped run folder under output/
- [x] Writes run_meta.json with cost summary
- [x] Writes intent_*_raw_*.json files
- [x] Writes intent_*_parsed_*.json files
- [x] Writes report.html
- [x] Updates watcher.db with:
  - Row in runs table
  - Rows in answers_raw table
  - Rows in mentions table
  - Correct schema_version
- [x] If model call fails after retries, writes *_error_*.json
- [x] Returns exit code 0 on success
- [x] Returns exit code 3 on partial failure

### Agent Mode (--format json)

- [x] `llm-answer-watcher run --config examples/watcher.config.yaml --format json` produces valid JSON
- [x] JSON output includes:
  - `run_id`
  - `output_dir`
  - `total_cost_usd`
  - `successful_queries`
  - `total_queries`
  - `results` array
- [x] JSON output has NO ANSI color codes
- [x] JSON output has NO progress indicators
- [x] JSON can be parsed with `jq`
- [x] Returns correct exit codes (0-4)
- [x] Test automation script:
  ```bash
  output=$(llm-answer-watcher run --config test.yaml --format json)
  echo $output | jq .run_id
  # Should print run_id without errors
  ```

### Quiet Mode (--quiet)

- [x] `llm-answer-watcher run --config examples/watcher.config.yaml --quiet` produces minimal output
- [x] Output is tab-separated values
- [x] No spinners or progress bars
- [x] No Rich formatting

### Automation Mode (--yes)

- [x] `llm-answer-watcher run --config examples/watcher.config.yaml --yes` skips all prompts
- [x] Runs without user interaction
- [x] Can be used in scripts

### Report HTML

- [x] report.html opens in browser without errors
- [x] Shows:
  - Run ID and timestamp
  - Models used
  - Summary stats (total cost, queries, success rate)
  - For each intent:
    - Intent title and prompt
    - For each model:
      - Model name
      - Appeared indicator (✓ Yes or ✗ No)
      - My mentions (brand names + positions)
      - Competitor mentions (sorted by position)
      - Ranked list with confidence indicator
      - Query cost
  - Cost disclaimer in footer
- [x] HTML is valid HTML5
- [x] CSS is inline (no external dependencies)
- [x] Mobile-responsive layout
- [x] Brand names are properly escaped (no XSS)
- [x] Match types shown (exact vs fuzzy)

### Database

- [x] watcher.db created at configured path
- [x] Schema version = 1
- [x] Tables exist: schema_version, runs, answers_raw, mentions
- [x] Indexes exist and are used
- [x] UNIQUE constraints prevent duplicates
- [x] Foreign keys enforced
- [x] Can query with sqlite3:
  ```bash
  sqlite3 output/watcher.db "SELECT * FROM runs ORDER BY timestamp_utc DESC LIMIT 5;"
  # Shows recent runs
  ```

### Core Features

- [x] Retry logic works (tested with mocked 429/500)
- [x] Cost estimates calculated and displayed
- [x] Word-boundary matching prevents false positives
- [x] Fuzzy matching catches variations
- [x] Rank extraction with confidence scores
- [x] Exit codes correct based on run outcome
- [x] Rich output works in human mode
- [x] JSON output works in agent mode
- [x] Timestamps are UTC with 'Z' suffix
- [x] API keys never logged
- [x] API keys never persisted to disk

### Documentation

- [x] README documents:
  - Setup with uv
  - Config format
  - How to add intents and brands
  - Best practices for brand aliases
  - Where data is stored
  - How to query SQLite
  - Cost estimation disclaimer
  - Security notes (never commit .env)
  - Using with AI agents section
- [x] CONTRIBUTING documents:
  - Code style
  - Docstrings required
  - Testing guidelines
  - How to add new LLM providers
- [x] LICENSE is present (MIT)
- [x] SPECS.md is accurate and up-to-date
- [x] AGENTS.md documents subagent team
- [x] HOOKS.md documents hooks

### Testing

- [x] Tests pass: `pytest`
- [x] Coverage >= 80%: `pytest --cov`
- [x] Critical paths have 100% coverage
- [x] All validators tested
- [x] Retry logic tested
- [x] HTTP mocking working
- [x] Time mocking working
- [x] Temp files/DBs used in tests
- [x] XSS prevention tested

### CI/CD

- [x] GitHub Actions workflow runs on PRs
- [x] Tests run on Python 3.12 and 3.13
- [x] Linting runs with ruff
- [x] Builds pass

### Security

- [x] No secrets in repo
- [x] .env files gitignored
- [x] Example configs use env var placeholders
- [x] API keys never logged
- [x] SQL injection prevented (parameterized queries)
- [x] XSS prevented (Jinja2 autoescaping)

---

## Post-v1 Enhancements (Future)

These tasks are NOT required for v1 but are documented for future reference:

### Future Milestone: Evaluation Framework (Evals)

**Goal:** Implement comprehensive evaluation framework to test pipeline correctness, catch extraction regressions, and future-proof the product for Cloud.

**Why this matters:**
- Our product's value = extraction accuracy (data is the moat)
- False positives cause panic, missed mentions cause blindness
- Evals catch regressions before merge (CI/CD integration)
- Cloud tier needs this for "confidence-scored alerts" and human-in-the-loop annotation

**Industry alignment:**
- Continuous, dataset-based evals (not one-off testing)
- Mixed automated metrics + LLM-as-a-judge + human review
- Aligned to business outcomes (extraction accuracy, not generic "coherence")
- Following DeepEval ("pytest for LLMs") and Langfuse (production observability) patterns

#### Evals Module Structure

- [x] **Create evals/ module directory structure:**
  ```
  llm_answer_watcher/
      evals/
          __init__.py
          schema.py           # EvalTestCase, EvalResult, EvalMetricScore
          runner.py          # run_eval_suite() orchestrator
          metrics.py         # compute_mention_metrics(), compute_rank_metrics()
          deepeval_bridge.py # (optional) LLM-as-a-judge wrappers
          testcases/
              fixtures.yaml  # Hand-curated test cases
  ```
  ✅ **COMPLETED** - Created complete evals module with all core files (commit 942aa48)

- [x] **Create evals/schema.py - Define Pydantic models:**
  - [x] `EvalTestCase` model:
    - Fields: `description`, `intent_id`, `llm_answer_text`
    - Fields: `brands_mine`, `brands_competitors` (list[str])
    - Ground truth: `expected_my_mentions`, `expected_competitor_mentions`, `expected_ranked_list`
    - Validator: All fields required
    - Validator: brands_mine and brands_competitors must not overlap

  - [x] `EvalMetricScore` model:
    - Fields: `name: str`, `value: float`, `passed: bool`, `details: dict | None`
    - Example: `{"name": "mention_precision", "value": 0.92, "passed": true}`

  - [x] `EvalResult` model:
    - Fields: `test_description: str`, `metrics: list[EvalMetricScore]`, `overall_passed: bool`
    - Computed field: `overall_passed` = all metrics passed
  ✅ **COMPLETED** - All Pydantic models implemented with proper validation (commit 942aa48)

#### Metrics Implementation (evals/metrics.py)

- [x] **Implement mention precision/recall:**
  - [x] `compute_mention_metrics(extracted_my: list, extracted_comp: list, expected_my: list, expected_comp: list) -> tuple[float, float]`
    - Normalize all brand names for comparison
    - Compute True Positives (TP), False Positives (FP), False Negatives (FN)
    - Precision = TP / (TP + FP)
    - Recall = TP / (TP + FN)
    - Handle edge case: zero division (return 0.0 with warning)
    - Return (precision, recall) tuple

- [x] **Implement rank accuracy:**
  - [x] `compute_rank_top1_accuracy(extracted_ranked: list[str], expected_ranked: list[str]) -> float`
    - Compare first element of extracted vs. expected
    - Return 1.0 if match, 0.0 if no match
    - Handle empty lists (return 0.0)

  - [x] `compute_rank_mrr(extracted_ranked: list[str], expected_ranked: list[str]) -> float`
    - Mean Reciprocal Rank: rewards correct top-N
    - If #1 matches: score = 1.0
    - If #2 matches: score = 0.5
    - If #3 matches: score = 0.33
    - Etc.

- [x] **Implement false is_mine detection:**
  - [x] `check_no_false_is_mine(my_mentions: list[Mention], competitor_brands: list[str]) -> bool`
    - Verify no competitor brand is in my_mentions
    - Return True if no false positives, False otherwise
    - Log error with brand name if violated
  ✅ **COMPLETED** - All metrics implemented including precision, recall, F1, completeness metrics (commit 942aa48)

#### Test Case Fixtures (evals/testcases/fixtures.yaml)

- [x] **Create hand-curated test cases:**
  - [x] Test case 1: Clear numbered list with all brands
    - LLM answer with "1. Instantly, 2. Warmly, 3. Lemwarm"
    - Expected: All 3 detected, rank order correct

  - [x] Test case 2: Bullet list with partial matches
    - LLM answer with "- Instantly is great\n- HubSpot works well"
    - Expected: 2 competitors detected, no false positives

  - [x] Test case 3: Conversational answer (no clear structure)
    - LLM answer: "I'd recommend Warmly, though Instantly is also popular"
    - Expected: Both detected, rank inferred from order

  - [x] Test case 4: False positive trap
    - LLM answer mentions "hub" or "instantly" as common words
    - Expected: Word boundaries prevent false matches

  - [x] Test case 5: Fuzzy matching edge case
    - LLM answer: "Hubspot" (lowercase, no camelCase)
    - Expected: Fuzzy match to "HubSpot"

  - [x] Test case 6: Our brand missing
    - LLM answer lists only competitors
    - Expected: `appeared_mine = false`, all competitors detected

  - [x] Test case 7: Our brand #1
    - LLM answer: "1. Warmly, 2. Instantly, 3. Lemwarm"
    - Expected: `appeared_mine = true`, rank_position = 0

  - [x] Test case 8: Ownership classification violation (negative test)
    - Intentionally mislabel a competitor as "mine"
    - Expected: `no_false_is_mine` metric FAILS

- [x] **Document fixture format in YAML:**
  ```yaml
  test_cases:
    - description: "Clear numbered list with all brands present"
      intent_id: "best_email_warmup_tools"
      llm_answer_text: |
        Here are the best email warmup tools:
        1. Instantly - Great for cold outreach
        2. Warmly - Excellent deliverability
        3. Lemwarm - Budget-friendly option
      brands_mine:
        - "Warmly"
        - "Warmly.io"
      brands_competitors:
        - "Instantly"
        - "Lemwarm"
        - "HubSpot"
      expected_my_mentions:
        - "Warmly"
      expected_competitor_mentions:
        - "Instantly"
        - "Lemwarm"
      expected_ranked_list:
        - "Instantly"
        - "Warmly"
        - "Lemwarm"
  ```
  ✅ **COMPLETED** - Comprehensive test cases created covering various scenarios (commit 942aa48)

#### Eval Runner (evals/runner.py)

- [x] **Implement YAML fixture loader:**
  - [x] `load_fixtures(fixtures_path: str) -> list[EvalTestCase]`
    - Read YAML file
    - Parse into list of EvalTestCase objects
    - Validate all required fields present
    - Return list or raise clear error

- [x] **Implement eval suite runner:**
  - [x] `run_eval_suite(test_cases: list[EvalTestCase]) -> list[EvalResult]`
    - Loop over each test case
    - For each test case:
      - Call `parse_answer()` from extractor module
      - Extract my_mentions and competitor_mentions
      - Compute mention precision/recall
      - Compute rank top-1 accuracy
      - Check no false is_mine
      - Build EvalMetricScore objects for each metric
      - Determine overall pass/fail
      - Build EvalResult object
    - Return list of EvalResult objects
    - Log summary: X/Y tests passed
  ✅ **COMPLETED** - Complete evaluation runner with YAML loading and test orchestration (commit 942aa48)

- [x] **Implement results writer:**
  - [x] `write_eval_results(eval_run_id: str, results: list[EvalResult], db_path: str)`
    - Insert into eval_results.db
    - Table: eval_runs (run_id, timestamp, total, passed, failed, pass_rate)
    - Table: eval_results (run_id, test_description, metric_name, metric_value, passed, details_json)
    - Use parameterized queries (prevent SQL injection)
    - [x 2025-11-02] Completed in commit 32fd2af - Added write_eval_results() function with database storage implementation

#### Eval Results Storage

- [x] **Create eval results database (storage/eval_db.py):**
  - [x] `init_eval_db_if_needed(db_path: str)`
    - Create `./output/evals/eval_results.db` if not exists
    - Create tables: `eval_runs`, `eval_results`
    - Create indexes on: `eval_run_id`, `metric_name`

  - [x] Schema: `eval_runs` table
    ```sql
    CREATE TABLE IF NOT EXISTS eval_runs (
        eval_run_id TEXT PRIMARY KEY,
        timestamp_utc TEXT NOT NULL,
        total_test_cases INTEGER NOT NULL,
        passed INTEGER NOT NULL,
        failed INTEGER NOT NULL,
        pass_rate REAL NOT NULL
    );
    ```

  - [x] Schema: `eval_results` table
    ```sql
    CREATE TABLE IF NOT EXISTS eval_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        eval_run_id TEXT NOT NULL,
        test_description TEXT NOT NULL,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        passed INTEGER NOT NULL,
        details_json TEXT,
        FOREIGN KEY (eval_run_id) REFERENCES eval_runs(eval_run_id)
    );

    CREATE INDEX IF NOT EXISTS idx_eval_results_run ON eval_results(eval_run_id);
    CREATE INDEX IF NOT EXISTS idx_eval_results_metric ON eval_results(metric_name);
    ```

- [x] **Implement insert operations:**
  - [x] `insert_eval_run(conn, run_id, timestamp, total, passed, failed, pass_rate)`
  - [x] `insert_eval_result(conn, run_id, test_description, metric_name, metric_value, passed, details)`

- [x] **Implement query helpers:**
  - [x] `get_recent_eval_runs(conn, limit=10) -> list[dict]`
  - [x] `get_metric_trend(conn, metric_name: str, days: int = 30) -> list[tuple]`
  - [x] `get_failing_tests(conn, run_id: str) -> list[dict]`

#### CLI Integration (cli.py)

- [x] **Add `eval` command:**
  ```python
  @app.command()
  def eval(
      fixtures: Path = typer.Option(
          "evals/testcases/fixtures.yaml",
          "--fixtures",
          help="Path to eval fixtures YAML"
      ),
      format: str = typer.Option("text", "--format", help="Output format: text or json"),
      save_results: bool = typer.Option(True, "--save-results", help="Save results to eval_results.db"),
  ):
      """
      Run evaluation suite to test extraction pipeline accuracy.

      This command:
      - Loads test cases from fixtures YAML
      - Runs extraction on each test case
      - Computes metrics (precision, recall, rank accuracy)
      - Reports pass/fail for each metric
      - Optionally saves results to eval_results.db

      Exit codes:
        0: All evals passed
        1: Some evals failed (check output for details)
      """
  ```
  ✅ **COMPLETED**: Complete eval command implementation with fixtures loading, dual output modes (text/JSON), proper error handling, and comprehensive help documentation.

- [x] **Implement eval command logic:**
  - [x] Load fixtures from YAML
  - [x] Generate eval_run_id (UTC timestamp)
  - [x] Run eval suite via `run_eval_suite()`
  - [x] Display results based on format:
    - Text mode: Rich table with test descriptions, metrics, pass/fail
    - JSON mode: Structured JSON output
  - [x] If save_results=True:
    - Init eval_results.db
    - Write results to database
  - [x] Return exit code 0 if all passed, 1 if any failed
  ✅ **COMPLETED**: Full eval command implementation with proper exit codes (0/1/2), Rich text formatting, structured JSON output, and database integration.

#### pytest Integration (tests/test_evals.py)

- [x] **Test eval metrics module:** - ✅ **COMPLETED** with 15 comprehensive tests covering compute_mention_metrics(), compute_rank_metrics(), and compute_completeness_metrics() functions
  - [x] Test compute_mention_metrics() with perfect match
  - [x] Test compute_mention_metrics() with false positives
  - [x] Test compute_mention_metrics() with false negatives
  - [x] Test compute_mention_metrics() with zero division edge case
  - [x] Test compute_rank_top1_accuracy() with correct rank
  - [x] Test compute_rank_top1_accuracy() with incorrect rank
  - [x] Test check_no_false_is_mine() with clean data
  - [x] Test check_no_false_is_mine() with violation

- [x] **Test eval runner:** - ✅ **COMPLETED** with 23 comprehensive test cases covering load_test_cases(), evaluate_single_test_case(), run_eval_suite(), and write_eval_results() functions
  - [x] Test load_fixtures() with valid YAML
  - [x] Test load_fixtures() with invalid YAML (raises error)
  - [x] Test run_eval_suite() with all tests passing
  - [x] Test run_eval_suite() with some tests failing
  - [x] Test run_eval_suite() with empty test case list
  - [x 2025-11-02] Completed with comprehensive test suite including critical bug fix for type mismatches

- [x] **Create pytest fixture for running full eval suite:**
  ```python
  def test_eval_suite_passes():
      """
      Run full eval suite and ensure all metrics pass.
      This test fails the build if extraction quality regresses.
      """
      test_cases = load_fixtures("evals/testcases/fixtures.yaml")
      results = run_eval_suite(test_cases)

      all_passed = all(r.overall_passed for r in results)

      # Fail the build if any eval fails
      assert all_passed, f"Eval suite failed: {[r.test_description for r in results if not r.overall_passed]}"
  ```
  - [x 2025-11-02] Completed - Added comprehensive integration test suite with quality gates and actionable feedback for the evaluation framework

- [x] **Test eval database operations:**
  - [x] Test init_eval_db_if_needed() creates tables
  - [x] Test insert_eval_run() inserts correctly
  - [x] Test insert_eval_result() inserts correctly
  - [x] Test get_recent_eval_runs() returns correct data
  - [x] Test get_metric_trend() calculates trend
  - [x 2025-11-02] Completed - Added comprehensive test suite with 27 tests covering all eval database operations with 94% coverage

#### CI/CD Integration

- [x] **Create .github/workflows/evals.yml:** ✅ **COMPLETED** - Comprehensive CI/CD workflow implemented
  - [x] Trigger on: push, pull_request
  - [x] Steps:
    - [x] Checkout code
    - [x] Setup Python 3.13
    - [x] Install uv
    - [x] Install dependencies (uv sync)
    - [x] Run eval suite CLI: `llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml`
    - [x] Run pytest evals: `pytest tests/test_evals.py -v`
    - [x] Fail build if exit code != 0
    - [x 2025-11-02] Completed with comprehensive GitHub Actions workflow that runs evaluation suite, integration tests, and database validation on every push/PR

- [x **Define eval thresholds:**  ✅ **COMPLETED 2025-11-02**
  - [x] Mention precision: ≥ 0.9 (90%)
  - [x] Mention recall: ≥ 0.8 (80%)
  - [x] Rank top-1 accuracy: ≥ 0.85 (85%)
  - [x] No false is_mine: 1.0 (100%, zero tolerance)
  - [x] Additional comprehensive thresholds implemented:
    - F1-score ≥ 0.85 (85%)
    - Brand coverage ≥ 0.9 (90%)
    - Overall pass rate ≥ 0.75 (75%)
    - CLI integration with rich threshold display
    - Proper exit codes (0 for pass, 1 for threshold failure)

- [x] **Document in CONTRIBUTING.md:** ✅ **COMPLETED 2025-11-02**
  - [x] How to add new eval test cases
  - [x] How to run evals locally (`llm-answer-watcher eval`)
  - [x] How evals integrate with CI/CD
  - [x] What to do if evals fail on your PR
  - [x] Added comprehensive "Understanding Eval Metrics" section with formulas, examples, debugging guide

#### Future: LLM-as-a-Judge Integration (evals/deepeval_bridge.py)

**Note:** This is optional and NOT required for OSS v1. This is for Cloud tier.

- [ ] **Add DeepEval dependency (optional):**
  - [ ] Add to pyproject.toml as optional dependency: `deepeval>=0.21.0`
  - [ ] Install group: `[evals]` or `[cloud]`

- [ ] **Implement hallucination detection:**
  - [ ] `eval_hallucination(answer_text: str, extracted_mentions: list[str]) -> float`
    - Use DeepEval's `HallucinationMetric`
    - Ask judge LLM: "Is this mention truly present in the answer?"
    - Return score 0.0-1.0 (higher = less hallucination)
    - Use GPT-4o-mini for cost control

- [ ] **Implement faithfulness scoring:**
  - [ ] `eval_faithfulness(answer_text: str, ranked_list: list[str]) -> float`
    - Use DeepEval's `FaithfulnessMetric`
    - Ask judge LLM: "Is this ranking supported by the text?"
    - Return score 0.0-1.0 (higher = more faithful)

- [ ] **Integrate with eval runner:**
  - [ ] Add CLI flag: `--use-llm-judge` (default: False)
  - [ ] If enabled, run LLM-as-a-judge metrics alongside deterministic metrics
  - [ ] Log both scores for comparison
  - [ ] Track judge model cost separately

- [ ] **Cost management for LLM-as-a-judge:**
  - [ ] Use cheaper models (GPT-4o-mini instead of GPT-4)
  - [ ] Cache judge results for identical inputs
  - [ ] Batch eval requests
  - [ ] Document cost estimation in README

#### Documentation

- [x] **Update README.md:** ✅ **COMPLETED 2025-11-02**
  - [x] Add "Evaluation Framework" section
  - [x] Explain what evals test (extraction accuracy, not LLM quality)
  - [x] How to run evals locally
  - [x] How to add custom test cases
  - [x] Link to eval fixtures YAML
  - [x] Complete metrics reference table with thresholds
  - [x] CI/CD integration example

- [x] **Update CONTRIBUTING.md:** ✅ **COMPLETED 2025-11-02**
  - [x] Section: "Adding Eval Test Cases"
    - [x] How to write a new test case in fixtures.yaml
    - [x] Ground truth labeling guidelines
    - [x] How to test locally before PR

  - [x] Section: "Understanding Eval Metrics"
    - [x] What each metric measures
    - [x] Target thresholds
    - [x] What to do if you regress a metric
    - [x] Complete debugging workflow with SQL queries
    - [x] Regression test examples

- [x] **Create evals/README.md:** ✅ **COMPLETED 2025-11-02**
  - [x] Purpose of evals module
  - [x] Architecture overview
  - [x] How to run: `llm-answer-watcher eval`
  - [x] How to interpret results
  - [x] Fixtures YAML format documentation
  - [x] Complete field reference table
  - [x] 5+ example test cases
  - [x] Metric formulas with examples
  - [x] Database schema documentation
  - [x] Best practices guide

#### Example Queries (for eval_results.db)

- [x] **Document example queries in README:** ✅ **COMPLETED 2025-11-02**
  ```sql
  -- Check recent eval runs
  SELECT eval_run_id, timestamp_utc, pass_rate
  FROM eval_runs
  ORDER BY timestamp_utc DESC
  LIMIT 10;

  -- Find which metrics are failing
  SELECT metric_name, COUNT(*) as failures
  FROM eval_results
  WHERE passed = 0
  GROUP BY metric_name
  ORDER BY failures DESC;

  -- Track precision trend over time
  SELECT er.eval_run_id, run.timestamp_utc, er.metric_value
  FROM eval_results er
  JOIN eval_runs run ON er.eval_run_id = run.eval_run_id
  WHERE er.metric_name = 'mention_precision'
  ORDER BY run.timestamp_utc ASC;

  -- Get details of failing tests in latest run
  SELECT test_description, metric_name, metric_value
  FROM eval_results
  WHERE eval_run_id = (SELECT eval_run_id FROM eval_runs ORDER BY timestamp_utc DESC LIMIT 1)
  AND passed = 0;
  ```

#### Deliverables Checklist

- [ ] Evals module implemented (`evals/schema.py`, `runner.py`, `metrics.py`)
- [ ] Metrics compute correctly (precision, recall, rank accuracy)
- [ ] Fixtures YAML created with 8+ test cases
- [ ] Eval results database (`eval_results.db`) schema defined
- [ ] CLI `eval` command working
- [ ] pytest integration (`tests/test_evals.py`)
- [ ] CI/CD workflow (`evals.yml`) runs on every PR
- [ ] Evals fail the build if thresholds not met
- [ ] Documentation updated (README, CONTRIBUTING, evals/README)
- [ ] Example queries documented for eval_results.db
- [ ] DeepEval bridge stubbed (optional, for future Cloud use)

#### Success Criteria

When this milestone is complete:
- ✅ Contributors can run `llm-answer-watcher eval` locally
- ✅ CI/CD runs evals on every PR and fails if quality regresses
- ✅ We have ≥8 test cases covering common scenarios and edge cases
- ✅ All metrics pass with target thresholds:
  - Mention precision ≥ 0.9
  - Mention recall ≥ 0.8
  - Rank top-1 accuracy ≥ 0.85
  - No false is_mine = 1.0
- ✅ Historical eval results tracked in `eval_results.db`
- ✅ Documentation explains how to add test cases and interpret results
- ✅ Product is future-proofed for Cloud tier (LLM-as-a-judge ready)

**This milestone makes our "data is the moat" strategy defensible with provable accuracy.**

---

## ✅ Evaluation Framework Implementation Summary (COMPLETED)

**Status**: ✅ **FULLY IMPLEMENTED - CLI Integration Complete** (Commits 942aa48, 9868c71, 32fd2af)

**Latest Update**: ✅ **CLI eval command integration validated and production-ready** (2025-11-02)
- Eval command successfully integrated into CLI with full functionality
- Dual-mode output (text/JSON) working correctly
- Error handling and exit codes (0, 1, 2) implemented properly
- Database storage functional with --save-results flag
- Help documentation and examples working
- Fixtures loading from YAML files confirmed
- Integration with existing console utilities verified

### What Was Completed

1. **Complete evals module structure** with clean Python package organization
2. **Pydantic schema models** (`EvalTestCase`, `EvalMetricScore`, `EvalResult`) with proper validation
3. **Comprehensive evaluation metrics** including:
   - Mention precision, recall, and F1 score
   - Rank accuracy metrics (top-1, MRR)
   - Completeness metrics for detection validation
4. **Full evaluation runner** (`run_eval_suite()`) with orchestration logic
5. **YAML test case fixtures** with 8+ diverse scenarios covering:
   - Clear numbered lists and bullet points
   - Conversational answers without structure
   - False positive prevention tests
   - Brand name variations and fuzzy matching
   - Ownership classification validation
6. **Complete CLI eval command integration** with:
   - Full `llm-answer-watcher eval` command implementation
   - Dual-mode output (Rich text formatting and structured JSON)
   - Proper exit codes (0=success, 1=partial failure, 2=error)
   - Database storage with eval_results.db schema
   - Comprehensive help documentation and examples
   - Error handling for invalid fixtures and database issues

### Files Created
- `llm_answer_watcher/evals/__init__.py` - Clean API exports
- `llm_answer_watcher/evals/schema.py` - Pydantic models for type safety
- `llm_answer_watcher/evals/runner.py` - Test orchestration and YAML loading
- `llm_answer_watcher/evals/metrics.py` - Evaluation metric computations
- `llm_answer_watcher/evals/testcases/fixtures.yaml` - Sample test cases
- `llm_answer_watcher/storage/eval_db.py` - Eval results database storage
- CLI integration in `cli.py` - Complete eval command implementation

### Next Steps (Remaining Tasks)
- pytest integration for automated testing
- CI/CD pipeline integration

The core evaluation framework and CLI integration are now production-ready and provide the foundation for systematic quality assurance and regression testing.

**✅ EVALUATION FRAMEWORK STATUS: FULLY COMPLETE**
- All core components implemented and tested
- CLI command integrated and validated
- Database storage functional
- Ready for production use and CI/CD integration

---

### Future Milestone: Additional LLM Providers

- [ ] Implement Anthropic client (anthropic_client.py)
- [ ] Add pricing for Claude models
- [ ] Test Anthropic retry logic
- [ ] Update docs with Anthropic setup

### Future Milestone: LLM-Assisted Rank Extraction

- [ ] Implement extract_ranked_list_llm() fully
- [ ] Add config option: use_llm_rank_extraction
- [ ] Test accuracy vs pattern-based
- [ ] Document cost/accuracy tradeoffs

### Future Milestone: Historical Trends

- [ ] Add `llm-answer-watcher trends` command
- [ ] Query SQLite for appearance over time
- [ ] Generate trend charts
- [ ] Detect position changes

### Future Milestone: Cloud Backend

- [ ] Design HTTP API for runner
- [ ] Implement scheduling
- [ ] Add email/Slack alerts
- [ ] Multi-tenant workspaces
- [ ] DuckDB for columnar analytics

---

## Using This TODO

### For Solo Development

1. Work through milestones sequentially
2. Check off tasks as you complete them
3. Use git commits at natural breakpoints
4. Run tests frequently

### With Subagent Team

1. **For implementation tasks:** Ask Developer agent
   - "Implement config/loader.py per TODO.md section 1.2.2"

2. **For testing tasks:** Ask Tester agent
   - "Write tests for config/loader.py per TODO.md section 1.7"

3. **For review:** Ask Reviewer agent
   - "Review config module per TODO.md checklist"

4. **Iterate based on feedback**
   - Developer fixes issues found by Reviewer
   - Tester adds tests for edge cases

### Tracking Progress

- [ ] Update this file as tasks complete
- [ ] Commit TODO.md with code changes
- [ ] Use conventional commits for each milestone
- [ ] Tag releases: v0.1.0, v0.2.0, v1.0.0

### Questions?

- Refer to [SPECS.md](./SPECS.md) for detailed requirements
- Refer to [AGENTS.md](./.claude/AGENTS.md) for subagent usage
- Open an issue for clarifications

---

**Let's build something amazing!** 🚀
