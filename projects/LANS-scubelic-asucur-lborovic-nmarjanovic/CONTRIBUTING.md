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
- [Submitting Changes](#submitting-changes)
- [Code Review Process](#code-review-process)
- [Subagent Team Workflow](#subagent-team-workflow)
- [Getting Help](#getting-help)

## Project Overview

**LLM Answer Watcher** is a production-ready CLI tool that monitors how large language models talk about brands versus competitors in buyer-intent queries. It asks LLMs specific questions (e.g., "best email warmup tools"), extracts structured signals (Did we appear? Who else appeared? In what rank?), and stores results in SQLite for historical tracking.

### Key Characteristics

- **BYOK (Bring Your Own Keys)**: Users provide their own OpenAI/Anthropic API keys
- **Local-first**: All data stored locally in SQLite and JSON files
- **API-first mindset**: Internal contract designed to become HTTP API in Cloud product
- **Dual-mode CLI**: Beautiful Rich output for humans, structured JSON for AI agents
- **Production-ready extraction**: Word-boundary regex matching + optional LLM-assisted ranking

## Prerequisites

Before you start contributing, make sure you have:

- **Python 3.12+** (Python 3.13+ recommended)
- **uv** (modern, fast Python package manager) - highly recommended
- **git** for version control
- **GitHub account** for pull requests

### Optional Tools

- **VS Code** with Python extension (recommended IDE)
- **pre-commit** for git hooks (optional, project has its own hooks)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/llm-answer-watcher.git
cd llm-answer-watcher

# Install dependencies with uv (recommended)
uv sync

# Or with pip (fallback)
pip install -e .

# Run tests to verify setup
pytest

# Run the CLI (you'll need to add your API key to a config file first)
llm-answer-watcher --help
```

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/your-username/llm-answer-watcher.git
cd llm-answer-watcher

# Add the original repository as upstream
git remote add upstream https://github.com/original-owner/llm-answer-watcher.git
```

### 2. Install Dependencies

```bash
# Using uv (recommended)
uv sync

# Using pip (fallback)
pip install -e .
```

### 3. Create a Development Branch

```bash
# Create a feature branch from main
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/your-bug-fix
```

### 4. Set Up Environment

Create a `.env` file for testing (this file is gitignored):

```bash
# Example .env file - use your actual API keys for testing
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
```

## Running Tests

### Basic Test Commands

```bash
# Run all tests
pytest

# Run tests with coverage
pytest --cov=llm_answer_watcher --cov-report=html

# Run tests with verbose output
pytest -v

# Run specific test file
pytest tests/test_config_loader.py

# Run specific test function
pytest tests/test_config_loader.py::test_load_valid_config

# Run tests by pattern
pytest -k "test_config"

# Run tests with specific markers
pytest -m "unit"
pytest -m "integration"
```

### Coverage Requirements

- **Core modules**: 80%+ coverage required
- **Critical paths**: 100% coverage expected
  - `config.loader`
  - `llm_runner.openai_client`
  - `extractor.mention_detector`
  - `storage.db`

### Test Organization

```
tests/
├── unit/                    # Fast tests, no external dependencies
├── integration/             # Tests with real APIs/DB
├── fixtures/               # Test data and fixtures
└── conftest.py             # Global pytest configuration
```

## Code Standards

### Python Version and Type Hints

```python
# ✅ CORRECT - Use | for unions (Python 3.12+)
def process_config(config: dict | None = None) -> RuntimeConfig | None:
    pass

# ❌ WRONG - Don't use typing.Union
from typing import Union, Optional
def process_config(config: Optional[dict] = None) -> Union[RuntimeConfig, None]:
    pass
```

### Code Quality Tools

This project uses **Ruff** for linting and formatting:

```bash
# Check for issues
ruff check .

# Auto-fix issues
ruff check . --fix

# Format code
ruff format .
```

### Critical Patterns

#### 1. UTC Timestamps Everywhere

```python
from utils.time import utc_now, utc_timestamp, run_id_from_timestamp

timestamp = utc_timestamp()  # Returns "YYYY-MM-DDTHH:MM:SSZ"
run_id = run_id_from_timestamp()  # Returns "YYYY-MM-DDTHH-MM-SSZ"
```

#### 2. Word-Boundary Brand Matching

```python
# CRITICAL: Use word boundaries to avoid false positives
import re

def create_brand_pattern(alias: str) -> re.Pattern:
    escaped = re.escape(alias)  # Escape special chars
    pattern = r'\b' + escaped + r'\b'
    return re.compile(pattern, re.IGNORECASE)
```

#### 3. Pydantic Validation

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

#### 4. Security - Never Log Secrets

```python
# ❌ NEVER DO THIS
logger.info(f"Using API key: {api_key}")
logger.debug(f"Key ends with: {api_key[-4:]}")

# ✅ DO THIS
logger.info("API key loaded from environment")
```

#### 5. SQL Injection Prevention

```python
# ❌ NEVER concatenate SQL
cursor.execute(f"SELECT * FROM runs WHERE id='{run_id}'")

# ✅ Always use parameterized queries
cursor.execute("SELECT * FROM runs WHERE id=?", (run_id,))
```

### Documentation Standards

- All public functions must have docstrings
- Use Google-style docstrings
- Include type hints for all function parameters and return values
- Add examples for complex functions

```python
def extract_mentions(text: str, brands: list[str]) -> list[Mention]:
    """Extract brand mentions from text using word-boundary matching.

    Args:
        text: The text to search for brand mentions.
        brands: List of brand names to search for.

    Returns:
        List of Mention objects found in the text.

    Example:
        >>> brands = ["HubSpot", "Mailchimp"]
        >>> mentions = extract_mentions("I use HubSpot and Mailchimp", brands)
        >>> len(mentions)
        2
    """
```

## Testing Guidelines

### Test Structure

Each test file should follow this structure:

```python
import pytest
from unittest.mock import Mock, patch
from your_module import YourClass

class TestYourClass:
    def test_method_success_case(self):
        """Test successful case."""
        # Arrange
        # Act
        # Assert
        pass

    def test_method_error_case(self):
        """Test error handling."""
        pass

    def test_method_edge_case(self):
        """Test edge cases."""
        pass
```

### Mocking External Dependencies

```python
# Mock LLM API calls
def test_openai_client(httpx_mock):
    httpx_mock.add_response(
        method="POST",
        url="https://api.openai.com/v1/chat/completions",
        json={"choices": [{"message": {"content": "..."}}], "usage": {...}}
    )
    # Test implementation

# Mock time
from freezegun import freeze_time

@freeze_time("2025-11-01 08:00:00")
def test_run_id_generation():
    run_id = run_id_from_timestamp()
    assert run_id == "2025-11-01T08-00-00Z"

# Use temp files/databases
def test_sqlite_roundtrip(tmp_path):
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))
    # Test implementation
```

### Test Coverage

- Aim for **80%+ coverage** on all modules
- **100% coverage** on critical paths
- Write both unit tests and integration tests
- Test error cases and edge cases
- Use descriptive test names

### Fixtures

Create reusable fixtures in `tests/conftest.py`:

```python
import pytest
from pathlib import Path

@pytest.fixture
def sample_config():
    return {
        "brands": [{"name": "HubSpot", "aliases": ["HubSpot"]}],
        "intents": [{"id": "email-tools", "prompt": "Best email tools"}],
        "models": [{"provider": "openai", "name": "gpt-4"}]
    }

@pytest.fixture
def temp_db(tmp_path):
    db_path = tmp_path / "test.db"
    init_db_if_needed(str(db_path))
    return str(db_path)
```

## Adding New LLM Providers

This project is designed to support multiple LLM providers. Here's how to add a new one:

### 1. Implement the LLMClient Protocol

Create `llm_runner/{provider}_client.py`:

```python
from llm_runner.models import LLMClient, LLMResponse

class {ProviderName}Client(LLMClient):
    def __init__(self, model: str, api_key: str):
        self.model = model
        self.api_key = api_key
        # Initialize provider-specific client

    def generate_answer(self, prompt: str) -> tuple[str, dict]:
        """Generate answer from the LLM.

        Returns:
            Tuple of (answer_text, usage_metadata)
        """
        # Implement provider-specific API call
        pass

    def _make_api_request(self, messages: list[dict]) -> dict:
        """Make request to provider API."""
        # Provider-specific implementation
        pass
```

### 2. Update the Factory Function

Modify `llm_runner/runner.py`:

```python
def build_client(provider: str, model: str, api_key: str) -> LLMClient:
    """Build LLM client for specified provider."""
    if provider == "openai":
        return OpenAIClient(model, api_key)
    elif provider == "anthropic":
        return AnthropicClient(model, api_key)
    elif provider == "{provider_name}":
        return {ProviderName}Client(model, api_key)
    else:
        raise ValueError(f"Unsupported provider: {provider}")
```

### 3. Add Configuration Validation

Update `config/models.py`:

```python
class Model(BaseModel):
    provider: Literal["openai", "anthropic", "{provider_name}"]
    name: str
    # ... other fields
```

### 4. Write Comprehensive Tests

Create `tests/test_{provider}_client.py`:

```python
import pytest
from llm_runner.{provider}_client import {ProviderName}Client

class Test{ProviderName}Client:
    def test_generate_answer_success(self, httpx_mock):
        # Mock successful API response
        pass

    def test_generate_answer_error(self, httpx_mock):
        # Mock API error response
        pass

    def test_rate_limit_handling(self, httpx_mock):
        # Test rate limit retry logic
        pass
```

### 5. Update Documentation

- Add provider to README.md
- Update configuration examples
- Add provider-specific setup instructions

## Submitting Changes

### 1. Run Tests and Quality Checks

```bash
# Run full test suite
pytest --cov=llm_answer_watcher

# Run linting
ruff check .

# Format code
ruff format .

# Check for any issues
pre-commit run --all-files  # if using pre-commit
```

### 2. Commit Your Changes

Use conventional commit format:

```bash
# Features
git commit -m "feat: add Anthropic Claude provider support"

# Bug fixes
git commit -m "fix: prevent SQL injection in brand mention queries"

# Documentation
git commit -m "docs: add API documentation for LLM runner module"

# Tests
git commit -m "test: add 80% coverage for mention detector"

# Refactoring
git commit -m "refactor: extract retry logic to utils module"

# Chores
git commit -m "chore: add ruff and pytest to dependencies"
```

### 3. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
# Use a descriptive title and fill out the PR template
```

### Pull Request Template

```markdown
## Description
Brief description of what this PR changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Test improvement
- [ ] Refactoring
- [ ] Other

## Testing
- [ ] All tests pass
- [ ] New tests added for new functionality
- [ ] Coverage maintained or improved

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review of the code completed
- [ ] Documentation updated if necessary
- [ ] Breaking changes documented
```

## Code Review Process

### Review Criteria

1. **Functionality**: Does the code work as intended?
2. **Design**: Is the solution well-architected?
3. **Testing**: Are there adequate tests?
4. **Documentation**: Is the code well-documented?
5. **Performance**: Is the code efficient?
6. **Security**: Are there any security concerns?
7. **Standards**: Does it follow project conventions?

### Review Response Times

- Maintainers aim to review PRs within 2-3 business days
- Be prepared to address feedback and make revisions
- Multiple rounds of review are normal and expected

### Merge Requirements

- All tests must pass
- Code coverage must be maintained or improved
- At least one maintainer approval required
- No merge conflicts
- Documentation updated if necessary

## Subagent Team Workflow

This project uses a specialized subagent team for development:

### Team Structure

1. **Developer** - Implements features per SPECS.md
2. **Tester** - Writes comprehensive tests (80%+ coverage)
3. **Reviewer** - Validates quality, security, SPECS.md compliance

### Workflow

```
Developer → Tester → Reviewer → Iterate → Merge
```

### Using Subagents

When working with Claude Code, you can invoke subagents:

```bash
# Developer: Implement a feature
"Developer: Implement config/loader.py per TODO.md section 1.2.2"

# Tester: Write tests
"Tester: Write tests for config/loader.py per TODO.md section 1.7"

# Reviewer: Review code
"Reviewer: Review config module per TODO.md milestone 1 checklist"
```

## Getting Help

### Documentation

- **SPECS.md** - Complete engineering specification
- **TODO.md** - Implementation tasks and progress
- **README.md** - User-facing documentation
- **CLAUDE.md** - Claude Code development guidelines

### Communication

- **GitHub Issues** - For bug reports and feature requests
- **GitHub Discussions** - For general questions and ideas
- **Pull Requests** - For code-specific discussions

### Common Issues

#### Setup Problems

```bash
# If uv sync fails, try:
pip install -e .

# If tests fail due to missing dependencies:
uv sync --dev

# If you get permission errors:
python -m pip install -e . --user
```

#### Test Failures

```bash
# Run specific failing test with verbose output:
pytest -v tests/test_failing_module.py::test_failing_function

# Run with debugging:
pytest -vvs tests/test_failing_module.py::test_failing_function
```

#### Development Environment

```bash
# Check Python version
python --version  # Should be 3.12+

# Check installed packages
uv pip list

# Check code formatting
ruff check . --fix
```

## Understanding Eval Metrics

The evaluation framework is critical for ensuring extraction quality. Here's what you need to know:

### What Evals Test

Evaluations test **extraction accuracy**, NOT LLM quality. They validate:

- Brand mention detection (word boundaries, case sensitivity)
- Mention precision (no false positives)
- Mention recall (no false negatives)
- Rank extraction accuracy
- Edge case handling

### Running Evals Locally

```bash
# Run the full evaluation suite
llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml

# Run with verbose output
llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml --verbose

# Run specific test via pytest
pytest tests/test_evals.py::TestEvalIntegration::test_specific_case -v

# Run with coverage
pytest tests/test_evals.py --cov=llm_answer_watcher.evals
```

### Metric Definitions

| Metric | Formula | What It Measures | Target |
|--------|---------|------------------|--------|
| **Mention Precision** | TP / (TP + FP) | How many detected mentions are correct | ≥ 0.90 |
| **Mention Recall** | TP / (TP + FN) | How many expected mentions were found | ≥ 0.80 |
| **Mention F1** | 2 × (P × R) / (P + R) | Harmonic mean of precision and recall | ≥ 0.85 |
| **Rank Accuracy** | Correct positions / Total positions | Are brands ranked correctly | ≥ 0.85 |
| **Brand Coverage** | Brands found / Expected brands | Percentage of expected brands detected | ≥ 0.90 |
| **False is_mine** | False positives for is_mine flag | Zero tolerance for wrong brand classification | 1.00 |

**Legend:**
- TP = True Positives (correct mentions found)
- FP = False Positives (incorrect mentions found)
- FN = False Negatives (expected mentions missed)

### What To Do If You Regress a Metric

#### 1. Understand the Failure

```bash
# Run evals to see which tests failed
llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml

# Check the eval database for details
sqlite3 eval_results.db
```

```sql
-- Find failing tests
SELECT test_description, metric_name, metric_value, metric_passed
FROM eval_results
WHERE eval_run_id = (SELECT run_id FROM eval_runs ORDER BY timestamp_utc DESC LIMIT 1)
  AND metric_passed = 0
ORDER BY test_description, metric_name;

-- See historical trend
SELECT DATE(timestamp_utc) as date, AVG(metric_value) as avg_value
FROM eval_results er
JOIN eval_runs r ON er.eval_run_id = r.run_id
WHERE metric_name = 'mention_precision'
GROUP BY DATE(timestamp_utc)
ORDER BY date DESC
LIMIT 7;
```

#### 2. Identify the Root Cause

Common causes of regressions:

- **Precision drop**: Added overly broad matching logic (false positives)
- **Recall drop**: Made matching too strict (false negatives)
- **Rank accuracy drop**: Changed ranking extraction logic
- **Brand coverage drop**: Word boundary issue or case sensitivity bug

#### 3. Fix the Issue

```python
# Example: Precision regression due to missing word boundary
# ❌ BAD - Matches "hub" in "GitHub"
if "hub" in text.lower():
    found_hubspot = True

# ✅ GOOD - Only matches full word "HubSpot"
import re
pattern = r'\b' + re.escape("HubSpot") + r'\b'
if re.search(pattern, text, re.IGNORECASE):
    found_hubspot = True
```

#### 4. Add Test Coverage

If a regression happened, it means test coverage was insufficient:

```python
# Add a test case to prevent future regressions
def test_word_boundary_prevents_false_match():
    """Regression test: 'hub' should not match in 'GitHub'"""
    text = "I use GitHub for version control"
    brands = ["HubSpot"]
    mentions = extract_mentions(text, brands)
    assert len(mentions) == 0  # Should NOT find HubSpot in GitHub
```

#### 5. Verify Fix

```bash
# Run full eval suite
llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml

# Run specific regression test
pytest tests/test_extractor_mention_detector.py::test_word_boundary -v

# Check coverage
pytest --cov=llm_answer_watcher.extractor --cov-report=term-missing
```

### Adding Custom Test Cases

When you add new features, add corresponding eval test cases:

```yaml
# evals/testcases/fixtures.yaml
test_cases:
  - description: "Test your new feature"
    intent_id: "test_intent"
    llm_answer_text: "Your test LLM response here"
    brands_mine: ["YourBrand"]
    brands_competitors: ["Competitor"]
    expected_my_mentions: ["YourBrand"]
    expected_competitor_mentions: ["Competitor"]
    expected_ranked_list: ["YourBrand", "Competitor"]
```

### CI/CD Integration

The eval suite runs automatically on:
- Every push to main
- Every pull request
- Nightly builds

**Pull requests will be blocked if:**
- Any eval metric falls below threshold
- New code decreases overall pass rate
- Coverage drops below 80%

### Debugging Failed Evals

```bash
# Run with maximum verbosity
pytest tests/test_evals.py -vvs

# Run single test case
pytest tests/test_evals.py::test_specific_case -vvs

# Check detailed metric computation
pytest tests/test_eval_metrics.py::TestComputeMentionMetrics -v
```

## Project Philosophy

When contributing, keep these principles in mind:

- **Boring is good**: Prefer simple, readable code over clever abstractions
- **No async in v1**: Keep it synchronous and straightforward
- **Data is the moat**: Historical SQLite data is core value proposition
- **Local-first**: No external dependencies except LLM APIs
- **API-first**: Internal contract designed for future HTTP exposure
- **Production-ready from day one**: Proper error handling, retry logic, security
- **Dual-mode CLI**: Serve both humans (Rich) and AI agents (JSON)

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

---

Thank you for contributing to LLM Answer Watcher! 🎉

If you have any questions that aren't covered here, please open an issue or start a discussion on GitHub.