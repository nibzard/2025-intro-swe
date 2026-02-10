# Contributing to LLM Answer Watcher

Thank you for your interest in contributing to LLM Answer Watcher! This document provides everything you need to know to get started contributing to this project.

## Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Running Tests](#running-tests)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Adding New LLM Providers](#adding-new-llm-providers)
- [Adding Browser Runners](#adding-browser-runners)
- [Submitting Changes](#submitting-changes)
- [Code Review Process](#code-review-process)
- [Subagent Team Workflow](#subagent-team-workflow)
- [Getting Help](#getting-help)

## Project Overview

**LLM Answer Watcher** is a production-ready CLI and Web tool that monitors how large language models talk about brands versus competitors in buyer-intent queries. It asks LLMs specific questions (e.g., "best email warmup tools"), extracts structured signals (Did we appear? Who else appeared? In what rank?), and stores results in SQLite for historical tracking.

### Key Characteristics

- **BYOK (Bring Your Own Keys)**: Users provide their own keys (OpenAI, Anthropic, Steel, etc.)
- **Local-first**: All data stored locally in SQLite and JSON files
- **Agent-First Design**: CLI outputs structured JSON for AI agent automation
- **Multi-Modal**: Supports standard APIs and **Browser Runners** (via Steel SDK)
- **Async & Parallel**: High-performance async/await architecture

## Prerequisites

Before you start contributing, make sure you have:

- **Python 3.12+**
- **uv** (modern, fast Python package manager) - highly recommended
- **git** for version control
- **Node.js 18+** (if working on the Web UI)

### Optional Tools

- **Docker** (for containerized development)
- **VS Code** with Python extension (recommended IDE)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/llm-answer-watcher.git
cd llm-answer-watcher

# Install backend dependencies with uv
uv sync

# Install frontend dependencies (if needed)
cd web-ui
npm install
cd ..

# Run tests to verify setup
pytest

# Run the CLI
llm-answer-watcher --help
```

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/your-username/llm-answer-watcher.git
cd llm-answer-watcher

# Add the original repository as upstream
git remote add upstream https://github.com/nibzard/llm-answer-watcher.git
```

### 2. Install Dependencies

```bash
# Backend
uv sync

# Frontend
cd web-ui && npm install && cd ..
```

### 3. Create a Development Branch

```bash
git checkout -b feature/your-feature-name
```

### 4. Set Up Environment

Create a `.env` file for testing (this file is gitignored):

```bash
# Example .env file
OPENAI_API_KEY=sk-...
STEEL_API_KEY=...
```

## Running Tests

### Backend Tests

```bash
# Run all tests
pytest

# Run tests with coverage
pytest --cov=llm_answer_watcher --cov-report=html

# Run specific test file
pytest tests/test_integration_browser_runners.py
```

### Coverage Requirements

- **Core modules**: 80%+ coverage required
- **Critical paths**: 100% coverage expected
  - `llm_runner.browser`
  - `extractor.mention_detector`
  - `storage.db`

## Code Standards

### Python Version and Type Hints

```python
# ✅ CORRECT - Use | for unions (Python 3.12+)
def process_config(config: dict | None = None) -> RuntimeConfig | None:
    pass
```

### Code Quality Tools

This project uses **Ruff** for linting and formatting:

```bash
# Check and auto-fix
ruff check . --fix
ruff format .
```

### Critical Patterns

#### 1. Async/Await

We use `asyncio` for parallel execution.

```python
# ✅ CORRECT
async def run_query(self, prompt: str) -> str:
    response = await self.client.post(...)
    return response.text
```

#### 2. Word-Boundary Brand Matching

```python
# CRITICAL: Use word boundaries to avoid false positives
pattern = r'\b' + re.escape(alias) + r'\b'
```

#### 3. Security - Never Log Secrets

```python
# ✅ DO THIS
logger.info("API key loaded from environment")
```

## Testing Guidelines

### Test Structure

```python
import pytest

@pytest.mark.asyncio
async def test_async_functionality():
    # ...
```

### Mocking External Dependencies

Use `pytest-httpx` for APIs and custom mocks for Steel/Browser interactions.

```python
# Mock Steel API
@pytest.fixture
def mock_steel_session(httpx_mock):
    httpx_mock.add_response(
        url="https://api.steel.dev/v1/sessions",
        json={"id": "session-123"}
    )
```

## Adding New LLM Providers

### 1. Implement the LLMClient Protocol

Create `llm_runner/{provider}_client.py`:

```python
from llm_runner.models import LLMClient

class NewProviderClient(LLMClient):
    async def generate_answer(self, prompt: str) -> tuple[str, dict]:
        # Implementation...
```

### 2. Update Registry

Update `llm_runner/runner.py` (or registry) to include the new provider.

## Adding Browser Runners

Browser runners operate differently from standard API clients. They use the Steel SDK to control a headless browser.

See [Browser Runners Guide](docs/BROWSER_RUNNERS.md) for architecture details.

### 1. Create Plugin Class

Create `llm_runner/browser/steel_{platform}.py`:

```python
from llm_runner.browser.steel_base import SteelBaseRunner
from llm_runner.plugin_registry import RunnerRegistry

@RunnerRegistry.register
class SteelNewPlatformRunner(SteelBaseRunner):
    @classmethod
    def plugin_name(cls) -> str:
        return "steel-newplatform"
    
    async def _navigate_and_submit(self, prompt: str):
        # Implementation...
```

## Submitting Changes

1.  Run tests: `pytest`
2.  Lint: `ruff check .`
3.  Commit using conventional commits:
    *   `feat: add Perplexity browser runner`
    *   `fix: resolve regex timeout`
    *   `docs: update API reference`
4.  Push and create PR.

## Code Review Process

- Maintainers aim to review PRs within 2-3 business days.
- All tests must pass.
- Coverage must be maintained.
- Documentation must be updated.

## Subagent Team Workflow

This project uses a specialized subagent team for development:

### Team Structure

1. **Developer** - Implements features per SPECS.md
2. **Tester** - Writes comprehensive tests (80%+ coverage)
3. **Reviewer** - Validates quality, security, SPECS.md compliance

## Getting Help

- **SPECS.md** - Complete engineering specification
- **docs/** - Detailed feature documentation
- **GitHub Issues** - For bug reports

---

Thank you for contributing to LLM Answer Watcher! 🎉
