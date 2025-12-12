# LLM Answer Watcher - Engineering Specification

> **📋 Document Version**: This specification represents the **v0.1.0 baseline** (released 2025-11-05).
>
> **New features added in v0.2.0+ are NOT documented here:**
> - Browser runners (Steel API integration)
> - Async/await parallelization
> - Google Search grounding
> - Post-intent operations
> - Sentiment analysis and intent classification
>
> **For v0.2.0 features**, see:
> - [Changelog](docs/changelog.md) for v0.2.0 release notes
> - [Browser Runners Guide](docs/BROWSER_RUNNERS.md) for browser automation
> - Updated documentation at [docs/](docs/)

Below is the complete engineering specification for the OSS "LLM Answer Watcher" component, incorporating:
- API-first contract mindset
- Provider abstraction aligned with multi-model routing patterns
- Python 3.12+ baseline (3.13 recommended)
- uv for environment/build
- SQLite for local historical storage with schema versioning
- DuckDB as future analytics backend (not in OSS v1, but we design toward it)
- Robust error handling, retry logic, and cost tracking
- Production-ready extraction with word-boundary matching and LLM-assisted ranking

This is intended for engineering. You can build directly from this.

---

## 0. Overview

### 0.1 Goal

We are shipping an open-source tool that lets a user monitor how large language models talk about them vs competitors in specific buyer-intent queries.

**Example:**
- Intent: "best email warmup tools"
- Brands: ["Warmly", "Warmly.io"]
- Competitors: ["Instantly", "Lemwarm", "HubSpot", "Apollo.io"]

**The tool:**
1. Asks one or more LLMs (using the user's own API keys).
2. Saves the exact answers.
3. Extracts structured signals:
   - Did we show up?
   - Who else showed up?
   - In what order (approx rank)?
4. Stores that in:
   - JSON files for transparency/debugging, and
   - a local SQLite database for historical tracking and querying.
5. Generates a local static HTML report for that run.
6. Tracks estimated costs per run based on token usage.

**No scheduling, no diffing over time, no alerts.** That's Cloud-only.

This OSS project is the "engine." The commercial product wraps scheduling, alerts, normalization, analytics dashboards, etc.

---

### 0.2 Core beliefs driving the build

- **BYOK is non-negotiable.** User passes their own OpenAI / Anthropic keys. We never hardcode credentials.
- **Local-first.** All data is stored locally. No external calls except directly to model APIs.
- **Historical data is the moat.** We store results in SQLite so the user builds a time series of "how are we ranking in LLM answers?" locally. Later, the Cloud offering will do trends/alerts/agency views.
- **API-first mindset.** Even if initial OSS is "just a CLI," we define a stable internal contract (run(intents, models, brands) -> structured results). This becomes the /run API in Cloud. Stable contract = faster iteration later.
- **Modular & boring.** The codebase follows simple domains (config, runner, extractor, storage, report, cli). We keep it readable and well-documented instead of clever.
- **Production-ready extraction.** We use word-boundary regex matching and optionally LLM-assisted extraction for rankings to avoid false positives and improve accuracy.
- **Resilient by default.** Retry logic with exponential backoff, proper error handling, and graceful degradation when providers fail.

---

## 1. Guiding principles

### 1.1 Modularity / Domain-Driven Design (DDD)

We organize code around problem domains:
- **config**: loading and validating user config (intents, brands, models)
- **llm_runner**: talking to LLM providers in a unified way with retry/backoff
- **extractor**: parsing the answers into structured competitor/mention data
- **storage**: persisting results (JSON, SQLite) with schema versioning
- **report**: turning structured results into a human-readable HTML snapshot
- **cli**: the command-line interface entrypoints
- **utils**: time/log/text helpers, cost estimation

These boundaries let us grow without tangling concerns (e.g. extractor shouldn't know about file paths, CLI shouldn't know about SQL).

### 1.2 KISS

- Keep business logic obvious.
- Prefer sync calls and simple loops.
- Avoid premature async/routing magic because our v1 volume is tiny.
- Avoid unnecessary infra (no background workers, no message bus, no Redis for OSS).
- **No async in v1.** We keep the codebase synchronous and simple.

### 1.3 DRY

- Shared logic should live in helpers.
- Don't repeat model-call logic everywhere; use a central LLMClient abstraction.
- Don't duplicate timestamp logic; centralize in utils.time.
- Centralize retry logic in LLM client implementations.

### 1.4 Documentation-first

- Every public class/function gets a docstring explaining purpose, inputs, outputs, side effects, and failure modes.
- Developer-facing README and CONTRIBUTING cover setup, environment, and how to run tests.

### 1.5 Stability via an internal API contract

- We'll design the runner around a "core service contract" (like POST /run).
- OSS CLI calls that contract directly in-process.
- Cloud will expose it over HTTP, schedule it, diff historical results, alert on changes, etc.
- We treat that contract as stable so the rest of the product can evolve independently.

---

## 2. Tech stack

### 2.1 Language/runtime

- **Python 3.13 recommended, Python 3.12 minimum supported.**
- Reason: modern Python gives better performance and memory usage in I/O-bound HTTP workloads compared to older 3.x.
- We leverage modern type hints (PEP 695 generics, improved error messages, performance improvements).

We will state in README:

```
Requires Python 3.12+ (tested on 3.13). Older versions are not supported.
```

### 2.2 Environment / packaging

- We standardize on **uv** (Astral) for:
  - dependency resolution
  - lockfile generation (uv.lock)
  - reproducible local dev installs
  - fast container builds
- We commit:
  - `pyproject.toml`
  - `uv.lock`
- We still generate a `requirements.txt` as fallback for contributors who refuse uv, but uv is the blessed path.

### 2.3 Dependencies

**Core dependencies:**
- `pydantic` (for config/runtime models and validation)
- `pyyaml` (for config input)
- `typer` (CLI framework)
- `rich>=13.7.0` (beautiful terminal output, progress bars, tables)
- `python-dotenv` (optional dev convenience for loading API keys)
- `httpx` (async-capable HTTP client for LLM providers, with retry support)
- `tenacity` (retry/backoff library for resilient API calls)
- `jinja2` (for HTML templating in reports)
- `sqlite3` (stdlib) for local DB
- `rapidfuzz` (fuzzy string matching for better brand detection)

**Dev dependencies:**
- `pytest` (testing framework)
- `pytest-mock` (mocking for tests)
- `freezegun` (time mocking for reproducible tests)
- `responses` or `httpx-mock` (HTTP mocking)

**Note:** We use httpx instead of requests for:
- Better timeout handling
- Built-in retry support
- Future async compatibility if needed
- Better connection pooling

No heavy async frameworks in OSS v1.
No web framework in OSS v1.

### 2.4 Project layout

```
llm_answer_watcher/
    __init__.py
    VERSION                # version string for CLI
    SCHEMA_VERSION         # SQLite schema version for migrations

    cli.py                 # Typer CLI

    config/
        __init__.py
        schema.py          # Pydantic models for config file (WatcherConfig, etc.)
        loader.py          # load YAML, validate, resolve API keys -> RuntimeConfig
        validators.py      # custom validation logic (uniqueness checks, etc.)

    llm_runner/
        __init__.py
        models.py          # LLMClient Protocol + build_client() registry
        openai_client.py   # OpenAI-compatible client with retry/backoff
        anthropic_client.py# (stub/optional for future)
        runner.py          # run_all() orchestrator (core contract)
        retry_config.py    # centralized retry/backoff configuration

    extractor/
        __init__.py
        parser.py          # extract brand mentions, competitor list, rank order
        mention_detector.py # word-boundary regex matching with fuzzy fallback
        rank_extractor.py  # pattern-based + optional LLM-assisted ranking
        normalizer.py      # text normalization utilities

    storage/
        __init__.py
        layout.py          # naming conventions and path utilities for output dirs/files
        writer.py          # write JSON artifacts and HTML report to disk
        db.py              # SQLite initialization and insert/query helpers
        migrations.py      # schema versioning and migration logic

    report/
        __init__.py
        generator.py       # build_report_html(run_dir) -> str
        template.html.j2   # inline CSS, minimal JS (or none), Jinja2 autoescaping enabled
        cost_formatter.py  # format cost estimates for display

    utils/
        __init__.py
        time.py            # UTC timestamp helpers with timezone enforcement
        logging.py         # structured JSON logging configuration
        text.py            # text normalization helpers (case folding, etc.)
        cost.py            # cost estimation based on provider pricing
        console.py         # Rich console utilities for beautiful/agent-friendly CLI output

tests/
    conftest.py            # pytest fixtures and configuration
    fixtures/              # sample LLM responses for testing
        openai_responses.json
        anthropic_responses.json
    test_config_loader.py
    test_config_validators.py
    test_extractor_parser.py
    test_mention_detector.py
    test_rank_extractor.py
    test_report_generator.py
    test_db_inserts.py
    test_db_migrations.py
    test_retry_logic.py
    test_cost_estimation.py

examples/
    watcher.config.yaml    # example config
    sample_output/         # example result folder
        2025-11-01T08-00-00Z/
            run_meta.json
            intent_best_email_warmup_tools_raw_openai_gpt4omini.json
            intent_best_email_warmup_tools_parsed_openai_gpt4omini.json
            report.html
    watcher.db             # SQLite file (shared across runs, at output root)

README.md
CONTRIBUTING.md
LICENSE
pyproject.toml
uv.lock
requirements.txt           # optional fallback
Dockerfile                 # for Cloud reference / dev container
```

---

## 3. Domain model

We are dealing with 5 key domain objects:

1. **Intent**
   A question we repeatedly ask LLMs.
   Example:
   - id: "best_email_warmup_tools"
   - prompt: "What are the best email warmup tools for cold outreach in 2025?"

2. **Brands / Entities**
   Two collections:
   - `mine`: aliases that identify "us"
   - `competitors`: aliases of rivals we care about
   We use these to detect mentions with word-boundary regex.

3. **LLM Model Configuration**
   Which LLM(s) to call for each run.
   Each model:
   - provider (e.g. "openai", "anthropic")
   - model_name (e.g. "gpt-4o-mini")
   - env_api_key (name of env var holding the API key)

4. **RawAnswerRecord**
   The verbatim result from "ask this model this intent now."

5. **ExtractionResult**
   Structured interpretation of that raw answer:
   - Did we appear?
   - Which competitors appeared?
   - Approximate ranked ordering of recommended tools.
   - Estimated cost for this query.

We also introduce a persistence layer — SQLite with schema versioning — which turns these objects into historical rows for later analysis.

---

### 3.1 User config file (watcher.config.yaml)

This is what a user edits:

```yaml
run_settings:
  output_dir: "./output"
  sqlite_db_path: "./output/watcher.db"

  models:
    - provider: "openai"
      model_name: "gpt-4o-mini"
      env_api_key: "OPENAI_API_KEY"
    # future:
    # - provider: "anthropic"
    #   model_name: "claude-3-5-haiku-20241022"
    #   env_api_key: "ANTHROPIC_API_KEY"

  # Optional: enable LLM-assisted rank extraction (slower, more accurate)
  use_llm_rank_extraction: false

brands:
  mine:
    - "Warmly"
    - "Warmly.io"
  competitors:
    - "Instantly"
    - "Lemwarm"
    - "HubSpot"
    - "Apollo.io"

intents:
  - id: "best_email_warmup_tools"
    prompt: "What are the best email warmup tools for cold outreach in 2025? Please provide a ranked list."
  - id: "hubspot_alternatives"
    prompt: "What are the best alternatives to HubSpot for small sales teams? List the top 5."
  - id: "crm_for_freelancers"
    prompt: "What's the best lightweight CRM for freelancers and solo consultants?"
```

**Validation rules:**
- `run_settings.output_dir` is required.
- `run_settings.sqlite_db_path` is required.
- Each model must have `provider`, `model_name`, and `env_api_key`.
- `provider` must be a supported value (validated against registry).
- Must define at least one intent.
- Intent IDs must be unique across the config.
- Must define at least one `brands.mine` alias (the tool has to know who "you" are).
- Brand aliases should not be empty strings or contain only whitespace.
- Brand aliases should not be duplicated within their respective lists (warn, don't fail).
- Recommended: brand aliases should be at least 3 characters to avoid false positives.

---

### 3.2 Internal Pydantic models

```python
from pydantic import BaseModel, field_validator, model_validator
from typing import Literal

class ModelConfig(BaseModel):
    provider: Literal["openai", "anthropic", "mistral"]
    model_name: str
    env_api_key: str  # name of env var

    @field_validator('model_name')
    @classmethod
    def validate_model_name(cls, v: str) -> str:
        if not v or v.isspace():
            raise ValueError("model_name cannot be empty")
        return v

class RunSettings(BaseModel):
    output_dir: str
    sqlite_db_path: str
    models: list[ModelConfig]
    use_llm_rank_extraction: bool = False  # optional, default False

    @field_validator('models')
    @classmethod
    def validate_models(cls, v: list[ModelConfig]) -> list[ModelConfig]:
        if not v:
            raise ValueError("At least one model must be configured")
        return v

class Brands(BaseModel):
    mine: list[str]
    competitors: list[str]

    @field_validator('mine', 'competitors')
    @classmethod
    def validate_brands(cls, v: list[str]) -> list[str]:
        # Remove empty/whitespace-only entries
        cleaned = [b.strip() for b in v if b and not b.isspace()]
        if not cleaned and cls.__name__ == 'mine':
            raise ValueError("At least one brand alias required in 'mine'")
        return cleaned

class Intent(BaseModel):
    id: str       # slug, unique per config
    prompt: str   # question we ask the model

    @field_validator('id')
    @classmethod
    def validate_id(cls, v: str) -> str:
        if not v or v.isspace():
            raise ValueError("Intent ID cannot be empty")
        # Check for valid slug format (alphanumeric, hyphens, underscores)
        if not all(c.isalnum() or c in '-_' for c in v):
            raise ValueError(f"Intent ID must be alphanumeric with hyphens/underscores: {v}")
        return v

class WatcherConfig(BaseModel):
    run_settings: RunSettings
    brands: Brands
    intents: list[Intent]

    @field_validator('intents')
    @classmethod
    def validate_intents_unique(cls, v: list[Intent]) -> list[Intent]:
        if not v:
            raise ValueError("At least one intent must be configured")
        ids = [intent.id for intent in v]
        if len(ids) != len(set(ids)):
            duplicates = {id for id in ids if ids.count(id) > 1}
            raise ValueError(f"Duplicate intent IDs found: {duplicates}")
        return v
```

When we load config at runtime, we also resolve the actual API keys from env vars into a `RuntimeConfig`.

```python
class RuntimeModel(BaseModel):
    provider: str
    model_name: str
    api_key: str   # resolved at runtime

class RuntimeConfig(BaseModel):
    run_settings: RunSettings
    brands: Brands
    intents: list[Intent]
    models: list[RuntimeModel]  # same order as in config
```

---

### 3.3 Execution-time records

```python
from pydantic import BaseModel

class RawAnswerRecord(BaseModel):
    intent_id: str
    model_provider: str
    model_name: str
    timestamp_utc: str         # ISO 8601 with timezone (always UTC)
    prompt: str
    answer_text: str
    usage_meta: dict | None    # e.g. tokens, model info
    estimated_cost_usd: float | None  # calculated from usage_meta

class Mention(BaseModel):
    name: str                  # original alias matched
    normalized_name: str       # normalized form for deduplication
    first_position: int        # char offset of first match in answer_text
    match_type: Literal["exact", "fuzzy"]  # how it was matched

class ExtractionResult(BaseModel):
    intent_id: str
    model_provider: str
    model_name: str
    timestamp_utc: str

    appeared_mine: bool
    my_mentions: list[Mention]
    competitor_mentions: list[Mention]

    ranked_list: list[str]     # inferred ordered list of tools/products
    rank_extraction_method: Literal["pattern", "llm"]  # how ranking was extracted
    rank_confidence: float     # 0.0-1.0, how confident we are in the ranking
```

---

## 4. End-to-end flow (core contract)

This is the main contract we treat like an internal API ("/run").

When the user runs:

```bash
llm-answer-watcher run --config watcher.config.yaml
```

The tool does:

1. **Load & validate config**
   - Parse YAML → WatcherConfig
   - Resolve API keys → RuntimeConfig
   - Initialize SQLite (create tables if missing, run migrations if needed)

2. **Create a run folder** under output_dir with a timestamped ID
   - e.g. `./output/2025-11-01T08-00-00Z/`

3. **Loop over each intent × each model**
   For each pair:
   - Call the model with the prompt (with retry/backoff on transient failures).
   - Build RawAnswerRecord.
   - Extract structured info → ExtractionResult.
   - Calculate estimated cost based on token usage.

4. **Persist results**
   - Write JSON artifacts for transparency:
     - `intent_{intent_id}_raw_{provider}_{model}.json`
     - `intent_{intent_id}_parsed_{provider}_{model}.json`
   - Insert data into SQLite:
     - `runs` table (one row per batch run)
     - `answers_raw` table (verbatim answers)
     - `mentions` table (one row per unique brand mention per answer)
     - `costs` table (cost tracking per answer)

5. **Generate report.html**
   - Summarize: did we appear, who else showed, top-ranked brands.
   - Show estimated costs per model.
   - Inline CSS, no external assets, Jinja2 autoescaping enabled.
   - Write it into that run folder.

6. **Write run_meta.json**
   - Contains run_id, timestamp, list of intents, list of models, total estimated cost.

7. **Print summary to stdout**
   - Output folder path
   - Total queries executed
   - Total estimated cost
   - Any errors/warnings
   - Exit with code 0.

**If any model call fails:**
- We retry with exponential backoff (3 attempts by default).
- If all retries fail, we record an `*_error.json` for that (intent, model).
- We skip SQLite inserts for that pair.
- We continue with the rest.

We **never abort the whole run** because one provider timed out.

This flow = "engine run."
Cloud will eventually wrap this in a job scheduler, plus diff today vs yesterday, plus send alerts.

---

## 5. Module design details

### 5.1 config/loader.py

**Responsibilities:**
- Load YAML from `--config`.
- Validate with `WatcherConfig`.
- Resolve env vars named in `env_api_key` into actual secrets.
- Produce `RuntimeConfig`.
- Fail fast if any env var is missing.
- No secret ever goes to disk.

**Pseudocode:**

```python
def load_config(config_path: str) -> RuntimeConfig:
    """
    Load watcher.config.yaml, validate it, and resolve provider API keys
    from environment variables.

    Raises:
        ValueError: If config is invalid or API keys are missing from environment.
        FileNotFoundError: If config file doesn't exist.
    """
    # Load YAML
    # Parse into WatcherConfig (triggers Pydantic validation)
    # For each model, resolve os.environ[model.env_api_key]
    # Build RuntimeConfig with resolved keys
    # Return RuntimeConfig
```

---

### 5.2 llm_runner/models.py

We define a provider-agnostic interface.

```python
from typing import Protocol

class LLMClient(Protocol):
    def generate_answer(self, prompt: str) -> tuple[str, dict]:
        """
        Run the model on the prompt and return:
            (answer_text, usage_meta)

        Automatically retries on transient failures with exponential backoff.

        Raises:
            RuntimeError: On permanent failures or after all retries exhausted.
        """
```

We define a builder:

```python
def build_client(provider: str, model_name: str, api_key: str) -> LLMClient:
    """
    Return an LLMClient for this provider/model/api_key.

    Raises:
        ValueError: If provider is unsupported.
    """
```

Initial supported provider: `"openai"`.
We'll stub `"anthropic"` for future.

This design mirrors what typical multi-provider gateways do: single interface, pluggable backends.

---

### 5.3 llm_runner/openai_client.py

**Responsibilities:**
- Implement LLMClient against OpenAI-compatible chat completion endpoint.
- Synchronous HTTP call via httpx (no streaming in v1).
- System message: `"You are an unbiased market analyst. Provide factual, balanced recommendations."`
- User message: the intent prompt
- **Retry logic:**
  - Use tenacity library for exponential backoff
  - Retry on: 429 (rate limit), 500, 502, 503, 504 (server errors)
  - Don't retry on: 401 (auth), 400 (bad request), 404 (not found)
  - Max 3 attempts, exponential backoff starting at 1s, max 10s wait
- **Timeout:** 30 seconds per request (increased from 20s for larger models)

**Returns:**
- Final combined assistant message text
- usage_meta (token counts, model name, etc. if available)

**Error handling:**
- Log errors with context but **never log the API key**
- Include request_id if available for support debugging
- Raise RuntimeError with descriptive message after all retries fail

**Example implementation pattern:**

```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

class OpenAIClient:
    def __init__(self, model_name: str, api_key: str):
        self.model_name = model_name
        self.api_key = api_key
        self.client = httpx.Client(timeout=30.0)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((httpx.HTTPStatusError,)),
        reraise=True
    )
    def generate_answer(self, prompt: str) -> tuple[str, dict]:
        # Make API call
        # Extract answer and usage
        # Return (answer_text, usage_meta)
        pass
```

---

### 5.4 llm_runner/runner.py

This is the orchestrator and effectively our "/run" service.

**Responsibilities:**
- Generate run_id (UTC timestamp slug in format: `YYYY-MM-DDTHH-MM-SSZ`).
- Create run directory under output_dir.
- Insert runs row in SQLite if not present.
- For each (intent, model):
  - Call model client (handles retry internally).
  - Build RawAnswerRecord with UTC timestamp.
  - Calculate estimated cost via utils.cost.
  - Call extractor to get ExtractionResult.
  - Persist both JSON and SQLite inserts.
  - On failure, persist an error JSON and continue.

**After loop:**
- Build and write the HTML report.
- Write run_meta.json with cost summary.
- Return `{ "output_dir": "...", "run_id": "...", "total_cost_usd": ... }`.

This orchestrator is the core contract the Cloud backend will expose via an HTTP API later.
The CLI basically just calls `runner.run_all()`.

---

### 5.5 extractor/parser.py

**Purpose:**
- Take answer_text, the brands config, and metadata (intent_id, provider, model_name).
- Return ExtractionResult.

**Extraction steps:**

**1. Mention detection** (via extractor/mention_detector.py)

We use **word-boundary regex matching** to avoid false positives:

- For each brand alias, compile a regex pattern: `\b{re.escape(alias)}\b` (case-insensitive)
- This matches whole words only, avoiding "hub" matching in "GitHub"
- For each match found:
  - Capture first_position (char offset of first occurrence)
  - Mark match_type as "exact"
- **Fuzzy fallback:**
  - For brands with common variations (e.g. "HubSpot" vs "Hubspot"), use rapidfuzz
  - Only trigger fuzzy matching if exact match fails
  - Minimum similarity threshold: 90%
  - Mark match_type as "fuzzy"
- **Normalization:**
  - Store both original matched text and normalized form
  - Normalized: lowercase, strip punctuation, collapse whitespace
  - Use normalized form for deduplication
- Collect `my_mentions` and `competitor_mentions`
- Set `appeared_mine = len(my_mentions) > 0`
- Sort mentions by first_position (earliest mention = higher implied priority)

**Best practices for brand aliases:**
- Use complete product names: "HubSpot" not "Hub"
- Include common variations: ["Warmly", "Warmly.io"]
- Avoid overly generic terms: "AI" would match everywhere
- Minimum 3 characters recommended

**2. Rank list inference** (via extractor/rank_extractor.py)

We support two extraction methods:

**Method A: Pattern-based (default, fast)**

Infer "Top Tools" order from bullet lists or numbered lists in the LLM answer.

- Look for patterns like:
  - `1. ToolName` / `1) ToolName`
  - `2. ToolName` / `2) ToolName`
  - `- ToolName` / `• ToolName`
  - `## ToolName` (markdown headers)
- Extract the candidate tool/brand name after the bullet/number
- Match extracted names against our known brand list (with fuzzy matching)
- Deduplicate in first-seen order
- Assign rank_position based on order (0 = top)
- Set rank_confidence based on:
  - 1.0: clear numbered list
  - 0.8: bullet list with consistent ordering
  - 0.5: inferred from mention order
  - 0.3: no clear structure, best guess

**Method B: LLM-assisted (optional, more accurate)**

If `use_llm_rank_extraction: true` in config:

- Make a second LLM call with the original answer + structured extraction prompt
- Prompt: "From the following text, extract a ranked list of tools/products mentioned. Return ONLY a JSON array of tool names in rank order. Text: {answer_text}"
- Parse JSON response
- Match against known brands
- Set rank_confidence = 0.95 (high confidence)
- Fallback to pattern-based if LLM call fails

This is slower and costs an extra API call per answer, but produces more accurate rankings when LLM answers are conversational rather than structured.

**Output:**

```python
ExtractionResult(
    intent_id=...,
    model_provider=...,
    model_name=...,
    timestamp_utc=...,
    appeared_mine=...,
    my_mentions=[Mention(...), ...],
    competitor_mentions=[Mention(...), ...],
    ranked_list=[...],
    rank_extraction_method="pattern" or "llm",
    rank_confidence=0.0-1.0
)
```

Note: the runner will pass in provider/model/timestamp so the extractor doesn't need global state.

---

### 5.6 storage/layout.py

Defines naming conventions for files and folders.

**Run directory:**
- `<output_dir>/<run_id>/`
- where run_id = e.g. `2025-11-01T08-00-00Z`
- generated once per CLI run

**JSON artifacts:**
- Raw answer: `intent_{intent_id}_raw_{provider}_{model}.json`
- Parsed answer (extraction): `intent_{intent_id}_parsed_{provider}_{model}.json`
- Error (if fetch failed): `intent_{intent_id}_error_{provider}_{model}.json`

**Metadata:**
- `run_meta.json`
- `report.html`

**SQLite:**
- Global DB file lives at `sqlite_db_path` from config (typically `./output/watcher.db`)
- We do **not** copy the DB into each run folder
- The DB accumulates history across runs
- Schema version tracked in `schema_version` table

---

### 5.7 storage/db.py (SQLite)

**Purpose**

We are shipping with a tiny embedded database so the user can query history locally and we can build analytics later. This is important: the data is our moat.

We use the standard library sqlite3 module. No separate server.

**Schema** (Version 1)

We create tables if they don't exist:

```sql
-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL  -- ISO 8601 UTC timestamp
);

-- One row per execution of the tool
CREATE TABLE IF NOT EXISTS runs (
    run_id TEXT PRIMARY KEY,
    timestamp_utc TEXT NOT NULL,  -- ISO 8601 with 'Z' suffix enforced
    total_intents INTEGER NOT NULL,
    total_models INTEGER NOT NULL,
    total_cost_usd REAL DEFAULT 0.0
);

-- One row per (intent, model) raw LLM answer
CREATE TABLE IF NOT EXISTS answers_raw (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    intent_id TEXT NOT NULL,
    model_provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    timestamp_utc TEXT NOT NULL,  -- ISO 8601 with 'Z' suffix
    prompt TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    answer_length INTEGER NOT NULL,  -- character count
    usage_meta_json TEXT,  -- JSON blob
    estimated_cost_usd REAL,
    FOREIGN KEY (run_id) REFERENCES runs(run_id),
    UNIQUE(run_id, intent_id, model_provider, model_name)  -- prevent duplicates
);

-- One row per unique brand mention per answer
-- This explodes ExtractionResult into analytics-friendly rows
CREATE TABLE IF NOT EXISTS mentions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    timestamp_utc TEXT NOT NULL,  -- ISO 8601 with 'Z' suffix
    intent_id TEXT NOT NULL,
    model_provider TEXT NOT NULL,
    model_name TEXT NOT NULL,

    brand_name TEXT NOT NULL,          -- original matched alias
    normalized_name TEXT NOT NULL,     -- normalized for deduplication
    is_mine INTEGER NOT NULL,          -- 1 if brand is one of our aliases, 0 otherwise
    first_position INTEGER,            -- earliest char offset in answer_text
    rank_position INTEGER,             -- inferred rank index (0 = top), NULL if not ranked
    match_type TEXT NOT NULL,          -- 'exact' or 'fuzzy'

    FOREIGN KEY (run_id) REFERENCES runs(run_id),
    -- One row per (answer, brand) combination
    UNIQUE(run_id, intent_id, model_provider, model_name, normalized_name)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_mentions_timestamp ON mentions(timestamp_utc);
CREATE INDEX IF NOT EXISTS idx_mentions_intent ON mentions(intent_id);
CREATE INDEX IF NOT EXISTS idx_mentions_brand ON mentions(normalized_name);
CREATE INDEX IF NOT EXISTS idx_mentions_mine ON mentions(is_mine);
CREATE INDEX IF NOT EXISTS idx_mentions_rank ON mentions(rank_position);
CREATE INDEX IF NOT EXISTS idx_answers_timestamp ON answers_raw(timestamp_utc);
```

**Insert flow**

For each run:

1. **Insert into runs:**
   - Insert row with run_id, timestamp_utc, counts, initial cost
   - If run_id already exists, skip (idempotent)

2. **For each (intent, model):**
   - **Insert into answers_raw:**
     - Store verbatim answer, prompt, usage metadata, cost
     - UNIQUE constraint prevents duplicate inserts
   - **Insert into mentions:**
     - For each mention in `my_mentions` and `competitor_mentions`:
       - `brand_name`: original alias string
       - `normalized_name`: normalized form
       - `is_mine`: 1 if in brands.mine else 0
       - `first_position`: char offset
       - `rank_position`: from ranked_list (NULL if not ranked)
       - `match_type`: 'exact' or 'fuzzy'
     - UNIQUE constraint on (run_id, intent_id, model_provider, model_name, normalized_name)
     - This ensures one row per brand per answer
     - If a brand appears multiple times, we store only the first occurrence position and its rank

3. **Update runs table:**
   - After all inserts, update total_cost_usd for the run

**Why SQLite matters**

The user can now answer:
- "Show me all times we appeared in the last 7 days for best_email_warmup_tools, sorted newest first."
- "Which competitor got rank_position = 0 most often in the last 30 days?"
- "What's our total spend on LLM queries this month?"
- "When did competitor X first appear in our tracking?"

This is immediately valuable, and it's local. No cloud lock-in required for basic historical introspection.

**Schema versioning & migrations**

- On startup, check `schema_version` table
- If version < CURRENT_SCHEMA_VERSION, run migrations
- Migrations are defined in `storage/migrations.py`
- Each migration is a function that takes a connection and upgrades schema
- After migration, insert new version into schema_version table
- This allows seamless upgrades as we add features

**Export story**

Later, Cloud or even advanced OSS users can dump these tables to CSV or Parquet and load into DuckDB for columnar analytics and trend detection. We're designing the schema so that's straightforward.

---

### 5.8 storage/writer.py

**Responsibilities:**
- Create the run directory safely (with proper permissions).
- Write JSON artifacts using UTF-8, indent=2, ensure_ascii=False.
- Validate JSON is properly formed before writing.
- Write the generated report.html.
- Call into db.py to insert rows in SQLite.
- Handle disk full / permission errors gracefully.

**We keep secrets out of disk. We never persist API keys.**

---

### 5.9 report/generator.py

**Responsibilities:**
- Read all parsed JSON files from the current run directory.
- Produce a single `report.html`, using Jinja2 template with inline CSS.
- **CRITICAL: Jinja2 autoescaping must be enabled** to prevent HTML injection from brand names.
- For each intent and each model:
  - Show:
    - Did we appear? (green "✓ Yes" / red "✗ No")
    - Our mentions (names + earliest position in text)
    - Competitor mentions (sorted by earliest position)
    - Ranked list (1, 2, 3 …) with confidence indicator
    - Estimated cost for this query
  - Include timestamp, run_id, model info at the top
- Summary section:
  - Total queries executed
  - Total estimated cost
  - Models used
  - Date range
- No external assets (CSS is inline, no JS build step)
- User just opens it in a browser
- Mobile-responsive design

**HTML escaping example:**

```python
from jinja2 import Environment, FileSystemLoader

env = Environment(
    loader=FileSystemLoader('templates'),
    autoescape=True  # CRITICAL: prevent XSS
)
template = env.get_template('template.html.j2')
html = template.render(data=data)
```

---

### 5.10 utils/logging.py

**Structured logging strategy**

We use Python's standard logging module with structured JSON output for production.

**Configuration:**
- Log level: INFO by default, DEBUG via --verbose flag
- Format: Structured JSON with timestamp, level, message, context
- Output: stderr (stdout is reserved for user-facing output)
- No log files in OSS (user can redirect stderr if needed)

**Log fields:**
- `timestamp`: ISO 8601 UTC
- `level`: INFO, WARNING, ERROR, DEBUG
- `component`: which module (e.g. "config.loader", "llm_runner.openai")
- `message`: human-readable description
- `context`: dict with additional data (intent_id, model_name, etc.)
- `run_id`: current run ID if available

**Security:**
- **Never log API keys or secrets**
- Redact any potentially sensitive data
- Log only the last 4 chars of API keys if needed for debugging (e.g. "sk-...X7Z9")

**Example log entry:**

```json
{
  "timestamp": "2025-11-01T08:00:15Z",
  "level": "INFO",
  "component": "llm_runner.openai",
  "message": "LLM query completed",
  "context": {
    "run_id": "2025-11-01T08-00-00Z",
    "intent_id": "best_email_warmup_tools",
    "model": "gpt-4o-mini",
    "tokens_used": 578,
    "cost_usd": 0.0023,
    "duration_ms": 1234
  }
}
```

---

### 5.11 utils/cost.py

**Cost estimation logic**

We estimate costs based on public provider pricing and token usage.

**Pricing table** (as of 2025, hardcoded with update date):

```python
PRICING = {
    "openai": {
        "gpt-4o-mini": {"input": 0.150 / 1_000_000, "output": 0.600 / 1_000_000},
        "gpt-4o": {"input": 2.50 / 1_000_000, "output": 10.00 / 1_000_000},
        # etc.
    },
    "anthropic": {
        "claude-3-5-haiku-20241022": {"input": 0.80 / 1_000_000, "output": 4.00 / 1_000_000},
        "claude-3-5-sonnet-20241022": {"input": 3.00 / 1_000_000, "output": 15.00 / 1_000_000},
    },
    # Updated: 2025-11-01
}
```

**Calculation:**

```python
def estimate_cost(provider: str, model: str, usage_meta: dict) -> float:
    """
    Estimate cost in USD based on token usage.
    Returns 0.0 if pricing unavailable (with warning logged).

    Args:
        provider: Provider name (e.g. "openai")
        model: Model name (e.g. "gpt-4o-mini")
        usage_meta: Dict with 'prompt_tokens' and 'completion_tokens'

    Returns:
        Estimated cost in USD
    """
    pricing = PRICING.get(provider, {}).get(model)
    if not pricing:
        log_warning(f"Pricing unavailable for {provider}/{model}")
        return 0.0

    input_tokens = usage_meta.get("prompt_tokens", 0)
    output_tokens = usage_meta.get("completion_tokens", 0)

    cost = (input_tokens * pricing["input"]) + (output_tokens * pricing["output"])
    return round(cost, 6)  # Round to 6 decimal places
```

**Disclaimer in README:**

> Cost estimates are approximate and based on public pricing as of [DATE]. Actual costs may vary. Always check your provider's billing dashboard for accurate costs.

---

### 5.12 utils/time.py

**UTC timestamp enforcement**

All timestamps must be in UTC with explicit timezone marker.

```python
from datetime import datetime, timezone

def utc_now() -> datetime:
    """Return current time in UTC with timezone info."""
    return datetime.now(timezone.utc)

def utc_timestamp() -> str:
    """Return ISO 8601 timestamp string with 'Z' suffix."""
    return utc_now().strftime("%Y-%m-%dT%H:%M:%SZ")

def run_id_from_timestamp(dt: datetime | None = None) -> str:
    """
    Generate run_id slug from UTC timestamp.
    Format: YYYY-MM-DDTHH-MM-SSZ

    Example: 2025-11-01T08-00-00Z
    """
    if dt is None:
        dt = utc_now()
    return dt.strftime("%Y-%m-%dT%H-%M-%SZ")

def parse_timestamp(ts: str) -> datetime:
    """
    Parse ISO 8601 timestamp string to datetime.
    Raises ValueError if format is invalid or timezone missing.
    """
    if not ts.endswith('Z'):
        raise ValueError(f"Timestamp must end with 'Z' (UTC): {ts}")
    return datetime.fromisoformat(ts.replace('Z', '+00:00'))
```

This ensures:
- No timezone confusion
- Consistent sorting in SQLite
- Easy parsing across platforms

---

### 5.13 utils/console.py (CLI UX Design)

**Philosophy: Design for Both Humans and AI Agents**

Modern CLIs must serve two masters:
- **Humans** want beautiful output, progress indicators, and interactive confirmations
- **AI agents** want structured output, clear exit codes, and zero interactivity

The solution: **Default to human-friendly, provide agent-friendly flags.**

Reference: [AI Agents Just Need Good --help](https://nibzard.com/agent-experience) by Nikola Balić (2025)

**Key insight:** Good `--help` text is your agent API. Clear command structure, explicit success signals, and structured output options make the difference between one API call and five retries with wasted tokens.

**Implementation Strategy:**

```python
"""
Rich console utilities for beautiful CLI output (humans)
and structured output modes (AI agents).
"""
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn, TimeRemainingColumn
from rich.table import Table
from rich.panel import Panel
from rich.status import Status
from rich import box
from contextlib import contextmanager
import json
import sys
from typing import Any

# Global console instance
console = Console()

class OutputMode:
    """Output mode configuration."""
    def __init__(self, format: str = "text", quiet: bool = False):
        self.format = format  # "text" or "json"
        self.quiet = quiet
        self._json_buffer = []

    def is_human(self) -> bool:
        """Returns True if outputting for human consumption."""
        return self.format == "text" and not self.quiet

    def is_agent(self) -> bool:
        """Returns True if outputting for agent consumption."""
        return self.format == "json"

    def add_json(self, key: str, value: Any):
        """Buffer JSON output for final print."""
        self._json_buffer.append((key, value))

    def flush_json(self):
        """Print buffered JSON and exit."""
        output = {k: v for k, v in self._json_buffer}
        print(json.dumps(output, indent=2))
        self._json_buffer = []

# Global output mode (set by CLI flags)
output_mode = OutputMode()

@contextmanager
def spinner(message: str):
    """
    Context manager for showing a spinner during operations.
    Only displays if in human mode.

    Usage:
        with spinner("Loading config..."):
            config = load_config()
    """
    if output_mode.is_human():
        with console.status(f"[bold blue]{message}", spinner="dots") as status:
            yield status
    else:
        # Silent for agents
        yield None

def create_progress_bar():
    """
    Create a progress bar for tracking multiple tasks.
    Only displays if in human mode.

    Returns configured Progress instance with:
    - Spinner
    - Task description
    - Progress bar
    - Percentage
    - Time remaining estimate
    """
    if output_mode.is_human():
        return Progress(
            SpinnerColumn(),
            TextColumn("[bold blue]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            TimeRemainingColumn(),
            console=console,
            transient=True  # Auto-cleanup when done
        )
    else:
        # Return a no-op progress for agents
        return NoOpProgress()

class NoOpProgress:
    """No-op progress bar for agent mode."""
    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass

    def add_task(self, description: str, total: int):
        return 0

    def advance(self, task_id: int, advance: float = 1.0):
        pass

def success(message: str):
    """Print a success message (human) or buffer for JSON (agent)."""
    if output_mode.is_human():
        console.print(f"[green]✓[/green] {message}")
    elif output_mode.format == "json":
        output_mode.add_json("status", "success")
        output_mode.add_json("message", message)

def error(message: str):
    """Print an error message (human) or buffer for JSON (agent)."""
    if output_mode.is_human():
        console.print(f"[red]✗[/red] {message}", file=sys.stderr)
    elif output_mode.format == "json":
        output_mode.add_json("status", "error")
        output_mode.add_json("error", message)

def warning(message: str):
    """Print a warning message (human) or buffer for JSON (agent)."""
    if output_mode.is_human():
        console.print(f"[yellow]⚠[/yellow] {message}")
    elif output_mode.format == "json":
        output_mode.add_json("warning", message)

def info(message: str):
    """Print an info message (human) or buffer for JSON (agent)."""
    if output_mode.is_human() and not output_mode.quiet:
        console.print(f"[blue]ℹ[/blue] {message}")
    # Silent for agents and quiet mode

def print_summary_table(results: list[dict]):
    """
    Print a beautiful summary table (human) or JSON array (agent).

    Args:
        results: List of dicts with keys: intent_id, model, appeared, cost, status
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
        appeared = "✓" if result.get("appeared") else "✗"
        appeared_style = "green" if result.get("appeared") else "red"

        status_icon = "✓" if result.get("status") == "success" else "✗"
        status_style = "green" if result.get("status") == "success" else "red"

        table.add_row(
            result["intent_id"],
            result["model"],
            f"[{appeared_style}]{appeared}[/{appeared_style}]",
            f"${result['cost']:.4f}",
            f"[{status_style}]{status_icon}[/{status_style}]"
        )

    console.print(table)

def print_banner(version: str):
    """Print a fancy startup banner (human only)."""
    if not output_mode.is_human():
        return

    banner = f"""
[bold cyan]╔══════════════════════════════════════╗[/bold cyan]
[bold cyan]║[/bold cyan]  [bold white]LLM Answer Watcher[/bold white]              [bold cyan]║[/bold cyan]
[bold cyan]║[/bold cyan]  [dim]Monitor your brand mentions[/dim]      [bold cyan]║[/bold cyan]
[bold cyan]║[/bold cyan]  [dim]v{version}[/dim]                          [bold cyan]║[/bold cyan]
[bold cyan]╚══════════════════════════════════════╝[/bold cyan]
    """
    console.print(banner)

def print_final_summary(run_id: str, output_dir: str, total_cost: float, successful: int, total: int):
    """Print final summary (human panel or JSON)."""
    if output_mode.is_agent():
        output_mode.add_json("run_id", run_id)
        output_mode.add_json("output_dir", output_dir)
        output_mode.add_json("total_cost_usd", total_cost)
        output_mode.add_json("successful_queries", successful)
        output_mode.add_json("total_queries", total)
        output_mode.flush_json()
        return

    if output_mode.quiet:
        # Minimal output for quiet mode
        print(f"{run_id}\t{output_dir}\t${total_cost:.4f}\t{successful}/{total}")
        return

    # Human-friendly panel
    stats_panel = Panel(
        f"""
[bold]Run ID:[/bold] {run_id}
[bold]Output:[/bold] {output_dir}
[bold]Total Cost:[/bold] [green]${total_cost:.4f}[/green]
[bold]Queries:[/bold] {successful}/{total} successful
        """.strip(),
        title="[bold green]✓ Run Complete" if successful == total else "[bold yellow]⚠ Run Complete (with errors)",
        border_style="green" if successful == total else "yellow",
    )
    console.print(stats_panel)
```

**Why This Matters:**

According to Mario Zechner's testing (2025), CLIs with clear structured output often outperform MCP servers for AI agents:
- **Token efficiency**: Agents waste fewer tokens parsing verbose output
- **Reliability**: Clear exit codes = fewer retries
- **Familiarity**: LLMs already know CLI patterns from training data

Our CLI will be easier for agents to automate than competitors without structured output, creating a competitive advantage for adoption in automated workflows.

---

### 5.14 cli.py

We expose a Typer CLI with dual modes: beautiful for humans, structured for AI agents.

**Design Principle:** Crystal-clear `--help` text is our agent API contract.

**Command: run**

```bash
llm-answer-watcher run --config <path> [OPTIONS]

Options:
  --config PATH              Path to YAML configuration file [required]
  --format <text|json>       Output format (default: text)
                             text: Human-friendly with colors and tables
                             json: Structured output for automation
  --quiet                    Minimal output (tab-separated values)
  --yes                      Skip all confirmation prompts
  --verbose, -v              Enable debug logging
  --help                     Show this message and exit

Exit codes:
  0: Success - all queries completed
  1: Configuration error (invalid YAML, missing API keys)
  2: Database error (cannot create/access SQLite)
  3: Partial failure (some queries failed, but run completed)
  4: Complete failure (no queries succeeded)

Examples:
  # Human-friendly output with progress bars
  llm-answer-watcher run --config watcher.config.yaml

  # Agent-friendly JSON output (no spinners, no colors)
  llm-answer-watcher run --config watcher.config.yaml --format json

  # Quiet mode for scripts (tab-separated)
  llm-answer-watcher run --config watcher.config.yaml --quiet

  # Automation with no prompts
  llm-answer-watcher run --config watcher.config.yaml --yes --format json
```

**Implementation:**

```python
"""
CLI entrypoint with Rich integration for beautiful human output
and structured JSON for AI agents.
"""
import typer
from pathlib import Path
from rich.traceback import install as install_rich_traceback
import sys

from .config.loader import load_config
from .llm_runner.runner import run_all
from .utils.console import (
    output_mode, OutputMode,
    console, spinner, create_progress_bar,
    success, error, warning, info,
    print_summary_table, print_banner, print_final_summary
)
from .utils.logging import setup_logging

# Install Rich tracebacks for better error messages
install_rich_traceback(show_locals=True)

app = typer.Typer(
    name="llm-answer-watcher",
    help="Monitor how LLMs talk about your brand vs competitors",
    add_completion=False,  # Skip shell completion for simplicity
)

@app.command()
def run(
    config: Path = typer.Option(
        ...,
        "--config",
        "-c",
        help="Path to YAML configuration file",
        exists=True,
        file_okay=True,
        dir_okay=False,
    ),
    format: str = typer.Option(
        "text",
        "--format",
        "-f",
        help="Output format: 'text' (human-friendly) or 'json' (machine-readable)",
    ),
    quiet: bool = typer.Option(
        False,
        "--quiet",
        "-q",
        help="Minimal output (tab-separated values)",
    ),
    yes: bool = typer.Option(
        False,
        "--yes",
        "-y",
        help="Skip all confirmation prompts (for automation)",
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose",
        "-v",
        help="Enable debug logging",
    ),
):
    """
    Execute LLM queries and generate brand mention report.

    This command will:
    1. Load your configuration (intents, brands, models)
    2. Query each LLM with each intent
    3. Extract brand mentions and rankings
    4. Save results to SQLite database
    5. Generate HTML report

    Output modes:
    - Default (text): Beautiful tables, progress bars, colors
    - JSON: Structured output for AI agents and automation
    - Quiet: Tab-separated for shell scripts
    """
    global output_mode
    output_mode = OutputMode(format=format, quiet=quiet)

    # Setup logging
    setup_logging(verbose=verbose)

    try:
        # Print banner (human mode only)
        print_banner("1.0.0")

        # Load config with spinner
        with spinner("Loading configuration..."):
            runtime_config = load_config(config)

        success(f"Loaded {len(runtime_config.intents)} intents, {len(runtime_config.models)} models")

        # Calculate total work
        total_queries = len(runtime_config.intents) * len(runtime_config.models)
        info(f"Will execute {total_queries} queries")

        # Estimate cost and confirm if expensive (human mode only)
        if output_mode.is_human() and not yes:
            estimated_cost = total_queries * 0.002  # rough estimate
            if total_queries > 10 or estimated_cost > 0.10:
                warning(f"This will execute {total_queries} queries (estimated cost: ${estimated_cost:.2f})")
                if not typer.confirm("Continue?"):
                    info("Cancelled")
                    raise typer.Exit(0)

        # Execute queries with progress tracking
        with create_progress_bar() as progress:
            if output_mode.is_human():
                task = progress.add_task(
                    f"Querying LLMs ({total_queries} total)",
                    total=total_queries
                )
                progress_callback = lambda: progress.advance(task)
            else:
                progress_callback = None

            # Run all queries
            results = run_all(
                runtime_config,
                progress_callback=progress_callback
            )

        # Print summary
        console.print()  # blank line
        print_summary_table(results["query_results"])

        # Print final stats
        print_final_summary(
            run_id=results["run_id"],
            output_dir=results["output_dir"],
            total_cost=results["total_cost_usd"],
            successful=results["successful_queries"],
            total=total_queries
        )

        # Print report link (human mode only)
        if output_mode.is_human():
            report_path = Path(results["output_dir"]) / "report.html"
            info(f"View report: [link=file://{report_path.absolute()}]{report_path}[/link]")

        # Determine exit code
        if results["successful_queries"] == 0:
            raise typer.Exit(4)  # Complete failure
        elif results["successful_queries"] < total_queries:
            raise typer.Exit(3)  # Partial failure
        else:
            raise typer.Exit(0)  # Success

    except FileNotFoundError as e:
        error(f"Configuration file not found: {e}")
        raise typer.Exit(1)
    except ValueError as e:
        error(f"Configuration error: {e}")
        raise typer.Exit(1)
    except Exception as e:
        error(f"Run failed: {e}")
        if verbose:
            console.print_exception()
        raise typer.Exit(2)

@app.command()
def validate(
    config: Path = typer.Option(
        ...,
        "--config",
        "-c",
        help="Path to YAML configuration file",
        exists=True,
        file_okay=True,
        dir_okay=False,
    ),
    format: str = typer.Option(
        "text",
        "--format",
        "-f",
        help="Output format: 'text' or 'json'",
    ),
):
    """
    Validate configuration file without executing queries.

    Useful for:
    - CI/CD pipelines to check config syntax
    - Pre-flight checks before expensive runs
    - Testing API key resolution

    Exit codes:
      0: Configuration is valid
      1: Configuration is invalid
    """
    global output_mode
    output_mode = OutputMode(format=format)

    with spinner("Validating configuration..."):
        try:
            runtime_config = load_config(config)

            success("Configuration is valid")
            info(f"Intents: {len(runtime_config.intents)}")
            info(f"Models: {len(runtime_config.models)}")
            info(f"Brands (mine): {len(runtime_config.brands.mine)}")
            info(f"Brands (competitors): {len(runtime_config.brands.competitors)}")

            if output_mode.is_agent():
                output_mode.add_json("valid", True)
                output_mode.add_json("intents_count", len(runtime_config.intents))
                output_mode.add_json("models_count", len(runtime_config.models))
                output_mode.flush_json()

            raise typer.Exit(0)

        except Exception as e:
            error(f"Validation failed: {e}")

            if output_mode.is_agent():
                output_mode.add_json("valid", False)
                output_mode.add_json("error", str(e))
                output_mode.flush_json()

            raise typer.Exit(1)

@app.command()
def report(
    run_dir: Path = typer.Option(
        ...,
        "--run-dir",
        help="Path to run directory containing JSON results",
        exists=True,
        file_okay=False,
        dir_okay=True,
    ),
):
    """
    Regenerate HTML report from existing run data.

    Useful when you've updated brand definitions and want to
    re-extract mentions without re-querying LLMs.

    Note: This is a nice-to-have feature, not required for v1.
    """
    with spinner("Regenerating report..."):
        # Implementation: read parsed JSONs, regenerate report.html
        # Not critical for v1, can be added later
        warning("Report regeneration not yet implemented")
        raise typer.Exit(0)

@app.callback(invoke_without_command=True)
def main(
    ctx: typer.Context,
    version: bool = typer.Option(
        False,
        "--version",
        "-V",
        help="Show version and exit",
    ),
):
    """
    LLM Answer Watcher - Monitor your brand mentions in LLM responses.

    Track how language models talk about your product compared to
    competitors across specific buyer-intent queries.

    Use 'llm-answer-watcher COMMAND --help' for detailed command documentation.
    """
    if version:
        console.print("[bold cyan]llm-answer-watcher[/bold cyan] version 1.0.0")
        console.print("Python CLI for monitoring brand mentions in LLM responses")
        raise typer.Exit(0)

    if ctx.invoked_subcommand is None:
        console.print("[yellow]Use --help to see available commands[/yellow]")
        console.print()
        console.print("Quick start:")
        console.print("  llm-answer-watcher run --config watcher.config.yaml")

if __name__ == "__main__":
    app()
```

**Key Features:**

1. **Clear exit codes** (0-4) - Agents can parse these without reading output
2. **Structured JSON output** (`--format json`) - Zero parsing ambiguity
3. **No forced interactivity** (`--yes` flag) - Automation-friendly
4. **Quiet mode** (`--quiet`) - Minimal output for shell scripts
5. **Comprehensive help text** - Agents can understand usage from `--help` alone
6. **Examples in help** - Shows common usage patterns
7. **Rich tracebacks** - Better debugging for humans (auto-disabled in JSON mode)

**Exit Code Strategy:**

- `0`: Perfect success - use in CI/CD to fail builds
- `1`: Config/auth errors - user action required
- `2`: Database/system errors - infrastructure issue
- `3`: Partial failure - some queries worked, investigate failures
- `4`: Complete failure - all queries failed, likely provider outage

This makes our CLI **easier for AI agents to automate than competitors** while keeping it beautiful for humans.

---

## 6. API-first contract

Even though OSS ships only as a CLI at first, we will define (and document) the core service contract we intend to expose in Cloud as `/run`.

**POST /run (future Cloud API)**

Request body shape (conceptually):

```json
{
  "intents": [
    {
      "id": "best_email_warmup_tools",
      "prompt": "What are the best email warmup tools for cold outreach in 2025?"
    }
  ],
  "brands": {
    "mine": ["Warmly", "Warmly.io"],
    "competitors": ["Instantly", "Lemwarm", "HubSpot", "Apollo.io"]
  },
  "models": [
    {
      "provider": "openai",
      "model_name": "gpt-4o-mini",
      "api_key": "sk-..."
    }
  ],
  "run_settings": {
    "use_llm_rank_extraction": false
  }
}
```

Response shape:

```json
{
  "run_id": "2025-11-01T08-00-00Z",
  "timestamp_utc": "2025-11-01T08:00:12Z",
  "total_cost_usd": 0.0156,
  "results": [
    {
      "intent_id": "best_email_warmup_tools",
      "model_provider": "openai",
      "model_name": "gpt-4o-mini",
      "raw_answer": {
        "answer_text": "...",
        "usage_meta": {
          "prompt_tokens": 123,
          "completion_tokens": 456
        },
        "estimated_cost_usd": 0.0156
      },
      "extraction": {
        "appeared_mine": true,
        "my_mentions": [
          {
            "name": "Warmly",
            "normalized_name": "warmly",
            "first_position": 128,
            "match_type": "exact"
          }
        ],
        "competitor_mentions": [
          {
            "name": "Instantly",
            "normalized_name": "instantly",
            "first_position": 45,
            "match_type": "exact"
          },
          {
            "name": "HubSpot",
            "normalized_name": "hubspot",
            "first_position": 212,
            "match_type": "exact"
          }
        ],
        "ranked_list": ["Instantly", "Warmly", "Lemwarm"],
        "rank_extraction_method": "pattern",
        "rank_confidence": 0.95
      }
    }
  ]
}
```

The CLI in OSS is essentially a thin wrapper around this same logic.
Cloud can expose this as a real HTTP API, run it in a scheduler, diff with yesterday in SQLite/DuckDB, then trigger Slack/email/webhook alerts.

By defining this now, we:
- Avoid rewriting internals later.
- Let dashboard / alerting / BYOK billing work against a stable contract.
- Keep the OSS engine and the Cloud service aligned.

---

## 7. Concurrency, scaling, and future evolution

### 7.1 Concurrency model

- **OSS v1: synchronous loop** over models × intents.
- Good enough for 5–50 queries/day.
- Easier to test and reason about.
- Simpler error handling and debugging.

**We will NOT add async in v1.** We keep the implementation synchronous and straightforward. If concurrency becomes necessary in the future, we can refactor specific components without changing the API contract.

### 7.2 Multi-provider routing

- Our `build_client(provider, model_name, api_key)` abstraction is intentionally similar to how multi-LLM gateways work.
- Cloud can later replace "direct provider client" with a call to a LiteLLM-style proxy or routing layer, which:
  - centralizes spend tracking
  - handles retries / rate limits
  - lets us run multiple vendors behind one logical "model alias"
- OSS keeps it simple and dependency-light.

### 7.3 SQLite now, DuckDB later

- SQLite is our local source of truth for historical runs in OSS.
- It's embedded, zero-admin, transactional, and perfect for accumulating daily snapshots.
- Later, Cloud will:
  - export / mirror this data into columnar format (e.g. Parquet),
  - run DuckDB for fast analytics and insights ("spike in new competitor", "your rank dropped today", etc.).
- By designing the SQLite schema with clean columns (intent_id, timestamp_utc, brand_name, is_mine, rank_position), we make that export trivial.

### 7.4 libSQL / sync story (future)

- In later phases (Cloud, hourly polling, agencies), we may want distributed sync: local collectors that run on a customer's infra and push back to us.
- That's when libSQL / Turso-style replicated SQLite becomes attractive, because it gives "SQLite semantics plus sync + remote reads/writes."
- We are not building this into OSS v1, but our domain model (runs, answers_raw, mentions tables) is already friendly to that world.

---

## 8. Testing strategy

### 8.1 Test categories

**Unit tests:**
- Config loading and validation
- Pydantic model validation edge cases
- Text normalization utilities
- Cost calculation logic
- Timestamp parsing and formatting
- Mention detection with word boundaries
- Rank extraction pattern matching

**Integration tests:**
- Full run with mocked LLM responses
- Database insert/query roundtrips
- Report generation from fixtures
- Schema migrations

**Fixture-based tests:**
- `tests/fixtures/` contains real-world LLM response samples
- Cover different response formats:
  - Numbered lists
  - Bullet points
  - Prose without structure
  - Edge cases (empty, very long, unusual formatting)
- Each fixture includes expected extraction results
- Snapshot testing for HTML reports

**HTTP mocking:**
- Use `pytest-httpx` or `responses` to mock API calls
- Simulate:
  - Successful responses
  - Rate limiting (429)
  - Server errors (500, 503)
  - Network timeouts
  - Invalid JSON responses
  - Auth failures (401)

**Time mocking:**
- Use `freezegun` for reproducible timestamp tests
- Ensure run IDs are deterministic in tests

### 8.2 Test coverage goals

- **Minimum 80% code coverage** for core modules (config, extractor, storage)
- 100% coverage for critical paths (mention detection, cost calculation, schema creation)
- All error paths tested (missing env vars, invalid config, API failures)

### 8.3 Example test structure

```python
# tests/test_mention_detector.py
import pytest
from llm_answer_watcher.extractor.mention_detector import detect_mentions

def test_exact_word_boundary_matching():
    """Test that 'hub' doesn't match in 'GitHub' but 'HubSpot' does."""
    text = "I recommend GitHub and HubSpot for this."
    brands = ["hub", "HubSpot"]

    mentions = detect_mentions(text, brands)

    # Should only match "HubSpot", not "hub" in "GitHub"
    assert len(mentions) == 1
    assert mentions[0].name == "HubSpot"
    assert mentions[0].match_type == "exact"

def test_fuzzy_matching_variants():
    """Test that common variations are detected."""
    text = "Try Hubspot for your CRM needs."
    brands = ["HubSpot"]  # capital S

    mentions = detect_mentions(text, brands, fuzzy=True, threshold=0.9)

    assert len(mentions) == 1
    assert mentions[0].name == "HubSpot"
    assert mentions[0].match_type == "fuzzy"

# tests/test_cost_estimation.py
def test_cost_calculation_gpt4o_mini():
    """Test cost calculation for known model."""
    usage = {"prompt_tokens": 100, "completion_tokens": 200}

    cost = estimate_cost("openai", "gpt-4o-mini", usage)

    # 100 * $0.150/1M + 200 * $0.600/1M = $0.000135
    assert cost == pytest.approx(0.000135, abs=1e-6)

# tests/test_db_migrations.py
def test_schema_migration_v1_to_v2():
    """Test that schema migrations work correctly."""
    # Create v1 schema
    # Run migration
    # Verify v2 schema exists
    # Verify data preserved
    pass
```

---

## 9. Development milestones

We'll break work into milestones that map to sprints.

### Milestone 1: Project skeleton & config

**Tasks:**
- Scaffold repo structure
- Add pyproject.toml, uv.lock, VERSION, SCHEMA_VERSION, LICENSE
- Implement config.schema + config.loader + config.validators:
  - Load YAML
  - Validate via Pydantic with all validators
  - Resolve env vars into RuntimeConfig
  - Raise clear errors if keys missing or validation fails
- Add utils.time for UTC timestamps + run_id slug with timezone enforcement
- Add utils.logging for structured JSON logging
- Add storage.db with schema creation logic (init_db_if_needed)
- Add storage.migrations with version 1 schema
- Write tests for config validation edge cases

**Deliverable:**
You can load config, init DB, confirm DB tables exist, and validation catches all error cases.

---

### Milestone 2: Provider client + runner core

**Tasks:**
- Implement llm_runner/retry_config.py with tenacity configuration
- Implement llm_runner/openai_client.py with sync HTTP call + retry/backoff
- Implement llm_runner/models.py (LLMClient Protocol + build_client)
- Add httpx and tenacity dependencies
- Implement utils/cost.py with pricing table and estimation logic
- Implement extractor/mention_detector.py:
  - Word-boundary regex matching
  - Fuzzy matching with rapidfuzz
  - Normalization
- Implement extractor/rank_extractor.py:
  - Pattern-based extraction
  - Stub for LLM-assisted extraction
- Implement extractor/parser.py:
  - Orchestrate mention detection + rank extraction
  - Build ExtractionResult
- Implement llm_runner/runner.py:
  - Generate run_id
  - Create run folder
  - Loop over (intent, model)
  - Call client → RawAnswerRecord
  - Estimate cost
  - Extract → ExtractionResult
  - Write per-intent JSON via storage.writer
  - Insert rows into SQLite via storage.db
  - Build and write run_meta.json
- Write tests with HTTP mocking and fixtures
- Write tests for retry logic (simulate 429, 500 errors)

**Deliverable:**
Running runner.run_all() in a REPL produces JSON + SQLite rows in output/ with cost estimates.

---

### Milestone 3: Report generation + CLI

**Tasks:**
- Implement utils/console.py with Rich integration:
  - OutputMode class for switching between human/agent modes
  - Spinner, progress bar, table utilities
  - Human-friendly (default) and agent-friendly (--format json) output
- Implement report/cost_formatter.py for displaying costs
- Implement report/generator.py using Jinja2 + inline CSS:
  - Read parsed JSONs from the run folder
  - Enable Jinja2 autoescaping
  - Output report.html with cost summary
- Design report template with:
  - Mobile-responsive CSS
  - Clear appearance indicators
  - Cost breakdowns
  - Confidence indicators for rankings
- Finalize storage.writer to:
  - Write raw/parsed/error JSON
  - Write report.html
  - Write run_meta.json with cost summary
- Implement Typer CLI (cli.py) with dual modes:
  - `llm-answer-watcher run --config watcher.config.yaml` (human mode with Rich)
  - `llm-answer-watcher run --config watcher.config.yaml --format json` (agent mode)
  - `llm-answer-watcher run --config watcher.config.yaml --quiet` (minimal output)
  - `llm-answer-watcher run --config watcher.config.yaml --yes` (no prompts)
  - `llm-answer-watcher validate --config watcher.config.yaml [--format json]`
  - `llm-answer-watcher --version`
  - Clear exit codes (0-4) documented in --help
  - Comprehensive help text with examples
- Add example config under examples/
- Write snapshot tests for report HTML
- Write tests for JSON output mode (validate schema, check for ANSI codes)
- Write tests for exit code correctness

**Deliverable:**
User can:
1. Set OPENAI_API_KEY
2. Run the CLI in human mode and see:
   - Beautiful spinners and progress bars
   - Colorful summary table
   - Final stats panel
   - a timestamped run folder with report.html
   - an updated watcher.db SQLite containing historical results
   - cost estimates in report and stdout
3. Run the CLI in agent mode (`--format json`) and get:
   - Valid JSON output on stdout
   - No ANSI color codes
   - No spinners or interactive elements
   - Correct exit codes
4. Run the CLI in quiet mode (`--quiet`) and get tab-separated output
5. Run the CLI with `--yes` and skip all prompts

Open report.html in a browser and visually confirm.
Test agent mode in a script: `output=$(llm-answer-watcher run --config test.yaml --format json) && echo $output | jq .run_id`

---

### Milestone 4: Polish, docs, tests

**Tasks:**
- Add README:
  - Prereqs: Python 3.12+/3.13, uv
  - How to set env vars for keys
  - How to run CLI (both human and agent modes)
  - Examples of `--format json` for automation
  - Exit code reference (0-4)
  - Where data lives (output/, watcher.db)
  - How to query SQLite manually for trends
  - Cost estimation disclaimer
  - Best practices for brand aliases
  - Section on "Using with AI Agents" explaining `--format json`, `--yes`, and exit codes
- Add CONTRIBUTING:
  - uv sync
  - Running pytest
  - Code standards (docstrings, type hints)
  - How to add new providers
  - Testing guidelines
- Expand test suite:
  - Config loader validation (missing env vars, duplicate IDs, etc.)
  - Extractor parsing:
    - Mention detection (exact, fuzzy, edge cases)
    - Ranked_list inference (multiple formats)
    - Normalization
  - DB insertion roundtrip:
    - Create temp DB
    - Insert rows
    - Query back
    - Test UNIQUE constraints
  - Report generation snapshot test (basic HTML structure + escaping)
  - Cost calculation accuracy
  - Schema migrations
  - Retry logic under various failure scenarios
- Achieve 80%+ test coverage
- Add GitHub Actions workflow for CI (run tests on PRs)
- Add example output in examples/sample_output/

**Deliverable:**
At this point, OSS v1 is done and ready to publish.

---

## 10. Definition of Done for OSS v1

We consider OSS v1 ready to publish when all conditions below are met:

- ✅ `pip install -e .` and `uv sync` both work on Python 3.12/3.13
- ✅ `llm-answer-watcher --version` prints the version from VERSION
- ✅ `llm-answer-watcher validate --config examples/watcher.config.yaml` passes
- ✅ `llm-answer-watcher validate --config examples/watcher.config.yaml --format json` produces valid JSON
- ✅ `llm-answer-watcher run --config examples/watcher.config.yaml` (human mode):
  - creates a new timestamped folder under output/
  - writes:
    - run_meta.json (with cost summary)
    - intent_*_raw_*.json
    - intent_*_parsed_*.json
    - report.html (with HTML escaping, costs, confidence indicators)
  - updates watcher.db with:
    - a row in runs
    - rows in answers_raw
    - rows in mentions (with UNIQUE constraints working)
    - correct schema_version
  - if a model call fails after retries, we still produce output, but include an *_error_*.json for that pair
- ✅ report.html can be opened locally and clearly shows:
  - Appeared: Yes/No
  - Who else was mentioned
  - Approximate ranking with confidence
  - Model that produced the answer
  - Timestamp
  - Estimated cost per query and total
  - Match types (exact vs fuzzy)
- ✅ `llm-answer-watcher run --config examples/watcher.config.yaml --format json` (agent mode):
  - outputs valid JSON to stdout
  - includes all required fields (run_id, output_dir, total_cost_usd, results)
  - no ANSI color codes or progress indicators in output
  - returns correct exit codes (0-4)
- ✅ `llm-answer-watcher run --config examples/watcher.config.yaml --quiet`:
  - produces tab-separated output
  - minimal verbosity
- ✅ `llm-answer-watcher run --config examples/watcher.config.yaml --yes`:
  - skips all confirmation prompts
  - runs without user interaction
- ✅ Retry logic works correctly (tested with mocked 429/500 responses)
- ✅ Cost estimates are calculated and displayed (both human and JSON modes)
- ✅ Word-boundary matching prevents false positives
- ✅ Exit codes are correctly set based on run outcome
- ✅ Rich output works in human mode (spinners, tables, colors)
- ✅ README documents:
  - Setup with uv
  - Config format
  - How to add intents and brands (with best practices)
  - Where data is stored
  - How to query SQLite for history
  - Cost estimation disclaimer
  - Security notes (never commit .env files)
- ✅ CONTRIBUTING documents:
  - Code style, docstrings, tests
  - How to run test suite
  - How to add new LLM providers
- ✅ LICENSE is present (recommend MIT or Apache 2.0 for OSS)
- ✅ Tests pass with 80%+ coverage (pytest)
- ✅ CI pipeline runs tests on PRs (GitHub Actions)
- ✅ No secrets in repo (example config uses env vars)

---

## 11. Quick glossary for contributors

- **Intent**: A buyer-style query we ask LLMs daily. ("best X tools", "alternatives to Y", etc.)

- **Brand aliases**: Lists of strings we consider "us" vs "competitors." Used for word-boundary regex matching with fuzzy fallback.

- **ModelConfig / RuntimeModel**: Config describing which LLMs to call (provider, model name, env var for key). After loading, we resolve the env var to get api_key.

- **RawAnswerRecord**: The literal text the model returned for an intent at a given timestamp, with token usage and estimated cost.

- **ExtractionResult**: The structured interpretation of that answer — who was mentioned, in what order, how confident we are, and whether we appeared.

- **run_id**: The timestamp slug that represents one full batch execution over all intents × all models. Format: YYYY-MM-DDTHH-MM-SSZ

- **SQLite (watcher.db)**: The local historical database of runs, answers, and mentions over time. This forms the backbone for later analytics. Includes schema versioning.

- **DuckDB (future)**: A columnar analytics database we'll likely use in Cloud to do trend detection, competitor spike alerts, and "why did we lose" insights over large historical windows.

- **Cloud vs OSS boundary**: OSS = engine (collect answers, parse, save, local report, local DB, cost tracking). Cloud = scheduling, diffing across days, alerts (email/Slack/webhook), multi-model comparison, multi-tenant workspaces, and insights/trends dashboards built on top of this data.

- **Word-boundary matching**: Regex technique that matches whole words only (e.g., `\bHubSpot\b`), preventing false positives like "hub" matching in "GitHub".

- **Fuzzy matching**: Approximate string matching (using rapidfuzz) to catch common variations like "HubSpot" vs "Hubspot" vs "Hub Spot".

- **Rank confidence**: A score (0.0-1.0) indicating how confident we are in the extracted ranking. Higher for numbered lists, lower for inferred order.

- **Schema versioning**: Each database schema has a version number. When we upgrade the schema, we run migrations to preserve existing data.

---

## 12. Security considerations

### 12.1 API key handling

- **Never log API keys** (not even last 4 chars in production logs)
- **Never persist API keys** to disk
- Always load from environment variables
- Document best practices:
  - Use .env files for development (add to .gitignore)
  - Use secrets management in production (Cloud, Kubernetes secrets, etc.)
  - Rotate keys regularly

### 12.2 HTML injection prevention

- **Always enable Jinja2 autoescaping** for report generation
- Brand names come from user config and could contain malicious HTML
- Test with brands like: `<script>alert('xss')</script>`

### 12.3 SQL injection prevention

- **Always use parameterized queries** with sqlite3
- Never concatenate user input into SQL strings
- Our brand names go into the database via parameters

### 12.4 Dependency security

- Use `pip-audit` or similar to check for vulnerable dependencies
- Pin versions in uv.lock for reproducibility
- Document upgrade policy in CONTRIBUTING

---

## 13. Performance considerations

### 13.1 Rate limiting

- LLM providers have rate limits (requests/min, tokens/min)
- Our retry logic handles 429 responses
- For high-volume runs (future), consider:
  - Adding configurable delays between requests
  - Batch processing with backpressure
  - Rate limit budgeting across multiple intents

### 13.2 Large answer handling

- Some LLMs can return 1000+ tokens
- We store full answer_text in SQLite (TEXT type = up to 1GB in SQLite)
- For very large answers (>100KB):
  - Consider storing in separate files and linking from DB
  - Add answer_length column to track size
  - Warn user if answers are unexpectedly large

### 13.3 Database performance

- Indexes on common query patterns (timestamp, intent_id, brand_name)
- UNIQUE constraints prevent duplicate inserts
- For 1000s of runs, SQLite should still be performant
- Migration path to DuckDB for analytics at scale

---

## 14. Evaluation Framework (Evals)

### 14.1 Why Evals Matter for Us

Unlike generic chatbot evals, our evaluation strategy focuses on **pipeline correctness** rather than LLM quality.

**Our product's promise:**
> "We tell you how LLMs describe your market, who they recommend, and whether you show up."

**What we're actually evaluating:**
- ✅ **Our extraction accuracy** (Did we correctly detect mentions?)
- ✅ **Our ranking inference** (Did we correctly parse the rank order?)
- ✅ **Our false positive rate** (Are we hallucinating competitors that aren't there?)
- ❌ NOT evaluating the LLM's quality or truthfulness

**Why this matters:**
- If our extraction is wrong, we literally send false alarms or miss critical changes
- False positives cause panic ("Competitor X just appeared!" when they didn't)
- Missed mentions cause blindness ("You're still #1!" when we actually disappeared)
- Data is our moat — if the data is corrupted, the product collapses

### 14.2 Evals Architecture

**New module: `evals/`**

```
llm_answer_watcher/
    evals/
        __init__.py
        schema.py        # EvalTestCase, EvalResult, EvalMetricScore
        runner.py        # run_eval_suite() to execute all eval cases
        metrics.py       # mention precision/recall, rank accuracy
        deepeval_bridge.py  # (optional/future) LLM-as-a-judge wrappers
```

**When evals run:**
- ✅ In CI/CD on every PR (pytest integration)
- ✅ Locally by contributors (`llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml`)
- ✅ Periodically in Cloud to detect regressions
- ❌ NOT on every user CLI run (this is QA for maintainers, not production)

### 14.3 What We're Evaluating

#### 14.3.1 Mention Extraction Accuracy

**Precision** = TP / (TP + FP)
- How many of the brands we said "appeared" truly appeared?
- Target: ≥ 0.9 (90% precision)

**Recall** = TP / (TP + FN)
- How many of the brands that truly appeared did we successfully catch?
- Target: ≥ 0.8 (80% recall)

**Example:**
- Ground truth competitor mentions: ["Instantly", "Lemwarm"]
- Extractor output: ["Instantly", "HubSpot"]
- TP = 1 (Instantly)
- FP = 1 (HubSpot - false positive)
- FN = 1 (Lemwarm - missed)
- Precision = 1/(1+1) = 0.5 ❌ FAIL
- Recall = 1/(1+1) = 0.5 ❌ FAIL

#### 14.3.2 Ownership Classification Accuracy

**Critical guardrail:**
- We must NEVER classify a competitor as `is_mine = 1`
- This is a binary pass/fail check
- If violated, halt the build — this is a critical failure

#### 14.3.3 Rank Extraction Accuracy

**Top-1 accuracy:**
- Did we get the #1 ranked tool correct?
- Most alerts hinge on the #1 slot ("you got replaced today")
- Target: ≥ 0.85 (85% accuracy)

**Rank confidence calibration:**
- If we say confidence = 0.95, we should be right 95% of the time
- Track predicted confidence vs. actual accuracy
- Calibration plot over time

#### 14.3.4 Hallucination Detection

**False positive brands:**
- Did we claim a competitor was mentioned when it wasn't in the text?
- This is EXTREMELY bad (causes panic for customers)
- Measured by precision metric above
- In future Cloud: use LLM-as-a-judge to double-check borderline cases

### 14.4 Eval Test Case Format

**Schema (evals/schema.py):**

```python
from pydantic import BaseModel

class EvalTestCase(BaseModel):
    description: str
    intent_id: str
    llm_answer_text: str  # simulated or recorded answer
    brands_mine: list[str]
    brands_competitors: list[str]

    # Ground truth labels:
    expected_my_mentions: list[str]
    expected_competitor_mentions: list[str]
    expected_ranked_list: list[str]

class EvalMetricScore(BaseModel):
    name: str
    value: float
    passed: bool
    details: dict | None = None

class EvalResult(BaseModel):
    test_description: str
    metrics: list[EvalMetricScore]
    overall_passed: bool
```

**Test case sources:**
- Hand-curated fixtures (ship in repo under `evals/testcases/fixtures.yaml`)
- Real historical answers (redacted/anonymized)
- Synthetic answers we generate ourselves
- Edge cases discovered during testing

### 14.5 Scoring Metrics

**Deterministic metrics (OSS v1):**

1. **Mention Precision/Recall**
   - For "my mentions" and "competitor mentions"
   - Computed via set comparison (TP, FP, FN)
   - Thresholds: precision ≥ 0.9, recall ≥ 0.8

2. **Rank Top-1 Accuracy**
   - Did we get the #1 slot correct?
   - Binary: match or no match
   - Threshold: ≥ 0.85 (85% of test cases)

3. **No False is_mine**
   - Assert no competitor has `is_mine = 1`
   - Binary: pass or CRITICAL FAIL
   - Threshold: 100% (zero tolerance)

**LLM-as-a-Judge metrics (future Cloud):**

1. **Hallucination/Faithfulness**
   - Ask judge LLM: "Given this answer text, is 'Apollo.io' actually referenced? yes/no."
   - Uses DeepEval's `HallucinationMetric` or `FaithfulnessMetric`
   - Helps catch subtle false positives (e.g., "hub" matching in "GitHub")

2. **Ranking Justification Quality**
   - Ask judge LLM: "Is this tool presented as the top recommendation?"
   - Validates our rank extraction didn't just misread bullet formatting

### 14.6 Eval Runner Pipeline

**Pseudocode (evals/runner.py):**

```python
def run_eval_suite(test_cases: list[EvalTestCase]) -> list[EvalResult]:
    """
    For each test case:
    1. Run extractor.parser.extract_answer() on test_case.llm_answer_text
       using test_case.brands_mine / brands_competitors
    2. Compare ExtractionResult to expected ground truth
    3. Compute metrics (precision, recall, rank accuracy, etc.)
    4. Return EvalResult objects with scores + pass/fail flags
    """
    results = []

    for test_case in test_cases:
        # Run extraction
        extraction = parse_answer(
            answer_text=test_case.llm_answer_text,
            brands=Brands(
                mine=test_case.brands_mine,
                competitors=test_case.brands_competitors
            ),
            intent_id=test_case.intent_id,
            provider="eval",
            model_name="test",
            timestamp_utc=utc_timestamp()
        )

        # Compute metrics
        metrics = []

        # Mention precision/recall
        precision, recall = compute_mention_metrics(
            extraction.my_mentions,
            extraction.competitor_mentions,
            test_case.expected_my_mentions,
            test_case.expected_competitor_mentions
        )
        metrics.append(EvalMetricScore(
            name="mention_precision",
            value=precision,
            passed=precision >= 0.9
        ))
        metrics.append(EvalMetricScore(
            name="mention_recall",
            value=recall,
            passed=recall >= 0.8
        ))

        # Rank accuracy
        rank_correct = (
            extraction.ranked_list[0] == test_case.expected_ranked_list[0]
            if extraction.ranked_list and test_case.expected_ranked_list
            else False
        )
        metrics.append(EvalMetricScore(
            name="rank_top1_accuracy",
            value=1.0 if rank_correct else 0.0,
            passed=rank_correct
        ))

        # No false is_mine
        false_is_mine = any(
            m.normalized_name in [
                normalize_brand_name(b)
                for b in test_case.brands_competitors
            ]
            for m in extraction.my_mentions
        )
        metrics.append(EvalMetricScore(
            name="no_false_is_mine",
            value=0.0 if false_is_mine else 1.0,
            passed=not false_is_mine
        ))

        # Overall pass/fail
        overall_passed = all(m.passed for m in metrics)

        results.append(EvalResult(
            test_description=test_case.description,
            metrics=metrics,
            overall_passed=overall_passed
        ))

    return results
```

**pytest integration:**

```python
# tests/test_evals.py

import pytest
from llm_answer_watcher.evals.runner import run_eval_suite
from llm_answer_watcher.evals.schema import EvalTestCase

def load_fixtures():
    """Load eval test cases from fixtures.yaml."""
    # Implementation here
    pass

def test_eval_suite_passes():
    """Run full eval suite and ensure all metrics pass."""
    test_cases = load_fixtures()
    results = run_eval_suite(test_cases)

    # Aggregate scores
    all_passed = all(r.overall_passed for r in results)

    # Fail the build if any eval fails
    assert all_passed, f"Eval suite failed: {[r for r in results if not r.overall_passed]}"
```

### 14.7 Eval Results Storage

**Separate database: `eval_results.db`**

Location: `./output/evals/eval_results.db`

**Why separate?**
- Don't pollute production `watcher.db` with test data
- Track eval regression over time
- Easy to delete/reset without affecting production data

**Schema:**

```sql
-- Track eval runs
CREATE TABLE IF NOT EXISTS eval_runs (
    eval_run_id TEXT PRIMARY KEY,
    timestamp_utc TEXT NOT NULL,
    total_test_cases INTEGER NOT NULL,
    passed INTEGER NOT NULL,
    failed INTEGER NOT NULL,
    pass_rate REAL NOT NULL  -- 0.0 to 1.0
);

-- Store detailed eval results
CREATE TABLE IF NOT EXISTS eval_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eval_run_id TEXT NOT NULL,
    test_description TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    passed INTEGER NOT NULL,  -- 1 or 0
    details_json TEXT,
    FOREIGN KEY (eval_run_id) REFERENCES eval_runs(eval_run_id)
);

CREATE INDEX IF NOT EXISTS idx_eval_results_run ON eval_results(eval_run_id);
CREATE INDEX IF NOT EXISTS idx_eval_results_metric ON eval_results(metric_name);
```

**Usage:**
- Track regression: "Has our mention precision dropped this week?"
- Detect drift: "Are we getting less accurate at rank extraction?"
- Prove correctness: "We maintained ≥90% precision for 6 months straight"

### 14.8 Integration with CI/CD

**GitHub Actions workflow (.github/workflows/evals.yml):**

```yaml
name: Evals

on: [push, pull_request]

jobs:
  evals:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python 3.13
        uses: actions/setup-python@v4
        with:
          python-version: '3.13'

      - name: Install uv
        run: pip install uv

      - name: Install dependencies
        run: uv sync

      - name: Run eval suite
        run: |
          uv run llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml

      - name: Run pytest evals
        run: |
          uv run pytest tests/test_evals.py -v

      - name: Fail build if evals fail
        run: |
          # Exit code 0 = pass, non-zero = fail
          # pytest will handle this automatically
```

**Key principle:**
- Treat extraction quality like a unit test with thresholds
- If precision drops below 0.9, fail the build
- Don't merge PRs that regress eval metrics

### 14.9 OSS vs Cloud Split

**OSS (v1 and beyond):**
- Ships basic deterministic evals in `evals/` module
- Ships fixtures + pytest hook (`llm-answer-watcher eval`)
- Stores eval history in local `eval_results.db`
- Catches regressions before merging PRs
- Open-source users can add their own test cases

**Cloud (future):**
- Periodically re-runs evals with LLM-as-a-judge scoring
  - Uses affordable judge models (e.g., GPT-4o-mini) to manage cost
  - DeepEval supports swapping judge models for cost control
- Tracks eval scores + production traces per tenant
  - Langfuse-style observability: human annotation queues, drift detection
  - Attach evaluation scores to traces/sessions
  - Catch failures, bias, toxicity in production
- Uses evals to gate new features
  - "Don't ship this extraction model — it dropped precision to 0.75"
- Drives upsell opportunities
  - "Explanation pack" feature with confidence scores
  - "Alert confidence" (e.g., "We think you were replaced — 0.91 confidence")

### 14.10 Industry Best Practices Alignment

Our eval strategy follows current LLM evaluation best practices (2025):

1. **Continuous evaluation** ✅
   - Run evals on every code change, not just once
   - Track drift over time in production

2. **Dataset-based** ✅
   - Curated test cases with ground truth labels
   - Cover real-world scenarios and edge cases

3. **Mixed scoring** ✅
   - Automated metrics (precision, recall, accuracy)
   - Human review (future: annotation queues in Cloud)
   - LLM-as-a-judge (future: DeepEval integration)

4. **Aligned to business outcomes** ✅
   - Metrics directly measure "did we correctly detect who appeared?"
   - Not generic "is it coherent?" scoring

5. **Stored for drift tracking** ✅
   - `eval_results.db` accumulates historical eval runs
   - Similar to Langfuse: keep traces + scores over time

**References:**
- DeepEval: "pytest for LLMs" with 40+ SOTA metrics
- Langfuse: Production observability with eval scores attached to traces
- Industry consensus: Continuous, dataset-driven evals with thresholded pass/fail

### 14.11 Future: LLM-as-a-Judge Integration

**Optional in OSS, default in Cloud:**

**DeepEval bridge (evals/deepeval_bridge.py):**

```python
from deepeval.metrics import HallucinationMetric, FaithfulnessMetric

def eval_hallucination(answer_text: str, extracted_mentions: list[str]) -> float:
    """
    Use DeepEval's HallucinationMetric to verify extracted mentions
    are actually present in the answer text.

    Returns: Score 0.0-1.0 (higher = less hallucination)
    """
    metric = HallucinationMetric(minimum_score=0.7, model="gpt-4o-mini")

    # Build test case for DeepEval
    test_case = {
        "context": answer_text,
        "actual_output": ", ".join(extracted_mentions)
    }

    metric.measure(test_case)
    return metric.score

def eval_faithfulness(answer_text: str, ranked_list: list[str]) -> float:
    """
    Use DeepEval's FaithfulnessMetric to verify ranking is supported
    by the answer text.

    Returns: Score 0.0-1.0 (higher = more faithful)
    """
    metric = FaithfulnessMetric(threshold=0.7, model="gpt-4o-mini")

    test_case = {
        "context": answer_text,
        "actual_output": f"Top tools: {', '.join(ranked_list)}"
    }

    metric.measure(test_case)
    return metric.score
```

**When to use:**
- ❌ Not in OSS v1 (adds dependency + cost)
- ✅ In Cloud for high-stakes alerts
- ✅ To validate borderline cases (confidence 0.5-0.7)
- ✅ To calibrate our pattern-based extraction

**Cost management:**
- Use cheaper judge models (GPT-4o-mini, not GPT-4)
- Batch eval requests
- Cache judge results for identical inputs
- DeepEval supports model swapping for cost control

### 14.12 Summary: Why Evals Future-Proof the Product

**For OSS:**
- Catches extraction regressions before merge
- Maintains data quality (our moat)
- Contributors can add test cases for edge cases
- Transparent quality metrics for users

**For Cloud:**
- Enables "confidence-scored alerts" feature
- Supports human-in-the-loop annotation
- Tracks production drift and anomalies
- Justifies premium pricing with provable accuracy
- Creates defensible competitive advantage

**Core principle:**
> If our extraction is wrong, the product has no value. Evals are not a nice-to-have — they're core product QA.

---

## 16. Future enhancements (post-v1)

Ideas for future versions (not in scope for v1):

- **LLM-assisted rank extraction**: Full implementation of Method B
- **Multi-language support**: Track answers in different languages
- **Answer diffing**: Compare today's answer vs yesterday's
- **Trend detection**: "HubSpot mentioned 50% more this week"
- **Alert thresholds**: "Notify me if we drop out of top 3"
- **Additional providers**: Mistral, Gemini, Llama via Together/Replicate
- **Web UI**: Local dashboard for browsing historical data
- **Export tools**: One-command export to CSV/Parquet for DuckDB
- **Scheduled runs**: cron integration or built-in scheduler
- **Cost budgets**: "Stop if cost exceeds $X this month"

---

## 17. TL;DR

- We are building an OSS **Python 3.12+/3.13 CLI** called `llm-answer-watcher`.
- User supplies:
  - a YAML config of intents and brand aliases,
  - their LLM provider keys via env vars.
- We call those models, store answers, extract who's mentioned (and in what order), and write:
  - human-readable `report.html` with cost tracking,
  - per-run JSON,
  - and historical records in a local SQLite DB (watcher.db) with schema versioning.
- The codebase is modular: **config, llm_runner, extractor, storage, report, cli, utils**.
- We treat the runner as an internal API (`/run`) so Cloud can later wrap it in scheduling, diffing, alerts, BYOK billing, etc.
- We standardize environment + reproducibility with **uv**.
- We use **word-boundary regex matching** with fuzzy fallback for accurate brand detection.
- We implement **retry logic with exponential backoff** for resilient API calls.
- We track **estimated costs** per query based on token usage.
- We design the SQLite schema to be exportable to DuckDB later for serious analytics, trend detection, and competitive intelligence features in the paid Cloud product.
- We keep it **simple, synchronous, and well-tested** for v1.

**Competitive Advantage:**

- **Dual-mode CLI design:** Beautiful Rich output for humans (spinners, tables, colors) + structured JSON output for AI agents (`--format json`)
- **Agent-friendly by default:** Clear exit codes (0-4), comprehensive `--help` text, `--yes` flag for automation, `--quiet` mode for scripts
- **Easier to automate than competitors:** AI agents can use our tool reliably in one try vs. competitors without structured output burning tokens on retries
- According to recent research (Zechner 2025, Balić 2025), well-designed CLIs outperform MCP servers for agent workflows due to token efficiency and reliability
- This makes our OSS tool a **better automation target**, accelerating adoption in AI-driven workflows

**This is production-ready. Let's build it.**
