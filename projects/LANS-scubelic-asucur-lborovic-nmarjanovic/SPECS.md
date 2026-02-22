# LLM Answer Watcher - Engineering Specification

> **📋 Document Version**: v0.2.0 (Current Release)
> **Status**: Production-Ready / Live

This specification documents the architecture, data models, and features of **LLM Answer Watcher v0.2.0**.

It covers the complete system:
- **CLI Engine** (Python)
- **Browser Automation** (Steel SDK integration)
- **REST API** (FastAPI)
- **Web UI** (React/Vite)
- **Evaluation Framework**
- **Data Storage** (SQLite)

---

## 0. Overview

### 0.1 Goal

LLM Answer Watcher is a production-grade tool that lets users monitor how large language models represent their brand vs. competitors in buyer-intent queries.

**Core Capabilities:**
1. **Query Execution:** Asks LLMs questions using the user's own API keys (BYOK).
2. **Multi-Modal Execution:** Supports both standard APIs (OpenAI, Gemini) and **Browser Runners** (automating web interfaces like ChatGPT via Steel SDK).
3. **Extraction:** Parses answers to detect mentions, rankings, and sentiment.
4. **Storage:** Persists all data locally in SQLite for historical tracking.
5. **Reporting:** Generates HTML reports and JSON artifacts.
6. **Agent-Ready:** Designed with dual-mode output (Human/JSON) for easy integration into AI agent workflows.

### 0.2 Core Beliefs

- **BYOK is non-negotiable.** User keys, user control.
- **Local-first.** Data stays on the user's machine.
- **Agent-First Design.** The CLI is an API for AI agents. Structured JSON output and clear exit codes are first-class features.
- **Production-Ready Extraction.** Word-boundary regex matching prevents false positives.
- **Browser Parity.** We must be able to see what the *actual user* sees on ChatGPT.com, not just what the API says.

---

## 1. Architecture

### 1.1 System Components

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│     Web UI      │      │       CLI        │      │    REST API     │
│  (React/Vite)   │      │     (Typer)      │      │    (FastAPI)    │
└────────┬────────┘      └────────┬─────────┘      └────────┬────────┘
         │                        │                         │
         └────────────────────────┼─────────────────────────┘
                                  ▼
┌───────────────────────────────────────────────────────────────────────┐
│                          Core Engine (Python)                         │
│                                                                       │
│  ┌────────────┐   ┌─────────────┐   ┌─────────────┐   ┌────────────┐  │
│  │   Config   │   │  LLM Runner │   │  Extractor  │   │   Report   │  │
│  └────────────┘   └──────┬──────┘   └─────────────┘   └────────────┘  │
│                          │                                            │
│                 ┌────────┴────────┐                                   │
│                 ▼                 ▼                                   │
│         ┌─────────────┐    ┌──────────────┐                           │
│         │ API Plugins │    │ Browser Plug.│                           │
│         │ (Gemini...) │    │ (Steel SDK)  │                           │
│         └─────────────┘    └──────────────┘                           │
└─────────────────────────────────┬─────────────────────────────────────┘
                                  ▼
                       ┌──────────────────────┐
                       │    Storage (SQLite)  │
                       └──────────────────────┘
```

### 1.2 Tech Stack

**Backend (Python 3.12+):**
- **Core:** `pydantic` (validation), `typer` (CLI), `pyyaml`.
- **API:** `fastapi`, `uvicorn`.
- **Browser:** `steel-sdk` (browser automation), `playwright` (optional/future).
- **Network:** `httpx` (async HTTP), `tenacity` (retries).
- **Data:** `sqlite3`, `rapidfuzz` (string matching).
- **Output:** `rich` (terminal UI), `jinja2` (HTML reports).

**Frontend (Web UI):**
- **Framework:** React 18+, TypeScript.
- **Build:** Vite.
- **Styling:** Tailwind CSS.

---

## 2. Domain Model

### 2.1 Configuration (`RuntimeConfig`)

The system supports a unified configuration model for both API models and Browser Runners.

```python
class RunnerConfig(BaseModel):
    runner_plugin: str  # e.g., "api", "steel-chatgpt", "steel-perplexity"
    config: dict        # Plugin-specific config (api_key, target_url, etc.)

class RuntimeConfig(BaseModel):
    run_settings: RunSettings
    brands: Brands
    intents: list[Intent]
    models: list[RuntimeModel]        # Legacy/Simple API models
    runner_configs: list[RunnerConfig] # New Plugin-based runners
```

### 2.2 Execution Records

**RawAnswerRecord:**
The verbatim result of an execution.

```python
class RawAnswerRecord(BaseModel):
    intent_id: str
    model_provider: str
    model_name: str
    timestamp_utc: str
    prompt: str
    answer_text: str
    
    # Metadata
    usage_meta: dict | None
    estimated_cost_usd: float | None
    
    # Browser-specific
    runner_type: str = "api"  # "api" or "browser"
    screenshot_path: str | None
    html_snapshot_path: str | None
    session_id: str | None
```

**ExtractionResult:**
Structured analysis of the answer.

```python
class ExtractionResult(BaseModel):
    intent_id: str
    appeared_mine: bool
    
    # Detected Mentions
    my_mentions: list[Mention]
    competitor_mentions: list[Mention]
    
    # Rankings
    ranked_list: list[str]
    rank_confidence: float
```

---

## 3. Features & Modules

### 3.1 Browser Runners (New in v0.2.0)

Integrated via `llm_runner/browser/`.
- **Goal:** Capture the true user experience of web-based LLMs.
- **Technology:** Uses **Steel SDK** to control headless browsers.
- **Capabilities:**
    - Navigate to URL (e.g., chatgpt.com).
    - Handle login/session persistence.
    - Type prompts and capture streaming responses.
    - **Screenshots:** Capture visual evidence of the answer.
    - **HTML Snapshots:** Save the DOM for debugging.
- **Status:** Architecture and plugin system complete (Phase 2). CDP implementation (Phase 3) is mocked for safe deployment/testing.

### 3.2 Intelligent API

Exposed via `llm_runner/api.py`.
- **Endpoints:**
    - `POST /run_watcher`: Execute job.
    - `GET /runs`: List history.
    - `POST /optimize_prompt`: **"Professional Prompt Engineer"** agent. Rewrites simple user queries into analytical, high-quality prompts.

### 3.3 CLI Tools (`cli.py`)

A comprehensive suite of commands for all user needs:

1.  **`run`**: The main workhorse. Executes queries in parallel (async).
2.  **`demo`**: interactive mode using mock data (no API keys needed).
3.  **`eval`**: QA framework. Runs extraction against ground-truth fixtures to verify accuracy (Precision/Recall).
4.  **`validate`**: Static configuration check.
5.  **`prices`**: Interface to `llm-prices.com`. Shows, lists, and refreshes pricing data.
6.  **`costs`**: Analytics command. Shows historical spend by model/provider/timeframe.
7.  **`export`**: Dumps data to CSV/JSON.

### 3.4 Evaluation Framework (`evals/`)

A dedicated module for Quality Assurance.
- **Purpose:** Prevent regression in extraction logic.
- **Metrics:** Mention Precision/Recall, Rank Accuracy (Top-1), Critical "Is Mine" checks.
- **Storage:** Separate `eval_results.db`.
- **Workflow:** Runs in CI/CD and manually via `llm-answer-watcher eval`.

---

## 4. Database Schema (SQLite)

We use schema versioning to manage evolution. Current version: **v5**.

**Key Tables:**
- `runs`: Summary of each batch execution.
- `answers_raw`: Stores verbatim answers, costs, and **browser metadata** (screenshot paths, runner types).
- `mentions`: Individual brand mentions with position and sentiment.
- `eval_runs` / `eval_results`: Stores QA test history.

---

## 5. Web UI

A modern frontend for data visualization.
- **Dashboard:** Recent run summaries, cost trends.
- **Run Detail:** View answers, screenshots (future), and extracted data side-by-side.
- **Analysis:** (Future) Trend lines for rank/visibility.

---

## 6. Future Roadmap

### Phase 3: Browser Runner CDP (In Progress)
- Implement actual WebSocket/CDP control for `steel-chatgpt` and `steel-perplexity` runners to replace mocks.
- Robust selector handling for dynamic DOMs.

### Phase 4: Cloud Platform
- Multi-tenant SaaS.
- Scheduled runs (Cron).
- Alerts (Slack/Email) on rank changes.
- Team collaboration.

---

## 7. Security

- **API Keys:** Loaded from environment variables only. Never persisted to DB or logs.
- **Output sanitization:** Jinja2 autoescaping enabled for HTML reports.
- **Input validation:** Pydantic strict mode for all config and API inputs.