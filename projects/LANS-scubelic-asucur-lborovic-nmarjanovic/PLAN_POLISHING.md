# Code Polishing Plan

This document tracks code quality improvements, bug fixes, and technical debt identified in the comprehensive code review.

**Last Updated**: 2025-11-03
**Status**: In Progress - 3 of 3 Critical tasks completed ✅
**Priority**: Continue with High Priority tasks for v1.0 release

---

## 🚨 Critical Issues (Must Fix Before Production)

### 1. Fix All Failing Tests ✅ **COMPLETED**
**Priority**: 🔴 Critical
**Effort**: L (Large - 8-16 hours)
**Files**: `tests/test_cli.py`, potentially other test files
**Completed**: 2025-11-03

**Issues Fixed**:
- ✅ Fixed 30+ test failures related to missing `system_prompt` field in RuntimeModel
- ✅ Fixed mention deduplication issues (8 tests)
- ✅ Fixed eval metrics calculation logic (4 tests)
- ✅ Fixed database schema version expectations (2 tests)
- ✅ Fixed OpenAI client error message patterns (3 tests)
- ✅ Fixed report generator logging issues (6 tests)
- ✅ Fixed request timeout value test (1 test)
- ✅ Fixed date-related test in eval metrics (1 test)

**Tasks Completed**:
- [x] Run `pytest -vv --tb=long` to get detailed error messages
- [x] Analyze root causes of test failures
- [x] Fix failing tests systematically by category
- [x] All tests pass: **794 tests (793 passed, 1 skipped)**

**Acceptance Criteria Met**:
- ✅ All tests pass with 0 failures, 0 errors
- ✅ Test coverage remains above 80%
- ✅ Ready for CI/CD pipeline

---

### 2. Fix Linting Violations ✅ **COMPLETED**
**Priority**: 🔴 Critical
**Effort**: XS (Extra Small - 15 minutes)
**Files**:
- `llm_answer_watcher/llm_runner/openai_client.py:59`
- `llm_answer_watcher/system_prompts/__init__.py:20`
**Completed**: 2025-11-03

**Issues Fixed**:
```
✅ W291: Trailing whitespace on line 59 of openai_client.py
✅ RUF022: __all__ is not sorted in __init__.py
```

**Tasks Completed**:
- [x] Run `ruff check --fix .` to auto-fix issues
- [x] Verify fixes: `ruff check .` - **All checks passed!**
- [x] Commit: `git commit -m "fix: resolve ruff linting violations (W291, RUF022)"`

**Acceptance Criteria Met**:
- ✅ `ruff check .` reports 0 errors
- ✅ No manual intervention needed in future

---

### 3. Add Input Validation for Prompt Length ✅ **COMPLETED**
**Priority**: 🔴 Critical (Security)
**Effort**: S (Small - 2-4 hours)
**Files**:
- `llm_answer_watcher/llm_runner/openai_client.py`
- `llm_answer_watcher/config/schema.py`
- `tests/test_llm_runner_openai_client.py`
- `tests/test_config_loader.py`
**Completed**: 2025-11-03

**Implementation**:
- ✅ Added MAX_PROMPT_LENGTH constant (100,000 chars = ~25k tokens)
- ✅ Runtime validation in `OpenAIClient.generate_answer()` before API calls
- ✅ Config-time validation in `Intent` Pydantic model
- ✅ 8 comprehensive tests added (5 for client, 3 for config)
- ✅ Clear error messages with formatted character counts

**Tasks Completed**:
- [x] Add MAX_PROMPT_LENGTH constant (100,000 chars)
- [x] Add validation in `OpenAIClient.generate_answer()`
- [x] Add validation in `Intent` Pydantic model
- [x] Write comprehensive tests (8 new tests, all passing)
- [x] User-friendly error messages with char counts

**Acceptance Criteria Met**:
- ✅ Prompts over 100k characters raise ValueError
- ✅ Tests verify length validation at both config and runtime levels
- ✅ Clear error message guides users (shows actual vs. max with commas)
- ✅ All 801 tests passing (8 new + 793 existing + 1 skipped)

---

## 🟡 High Priority (Next Sprint)

### 4. Refactor CLI Complexity
**Priority**: 🟡 High
**Effort**: L (Large - 8-12 hours)
**Files**: `llm_answer_watcher/cli.py`

**Issue**: `run()` command is 250+ lines with nested logic and code duplication

**Tasks**:
- [ ] Extract helper functions from `run()`:
  ```python
  def _build_result_list(runtime_config, results) -> list[dict]:
      """Build result list for report generation."""
      pass

  def _build_summary_results(runtime_config, results, output_dir) -> list[dict]:
      """Build summary results for table display."""
      pass

  def _handle_query_execution(runtime_config, progress_callback) -> dict:
      """Execute all LLM queries with progress tracking."""
      pass

  def _calculate_cost_estimate(runtime_config) -> float:
      """Calculate estimated cost for all queries."""
      pass
  ```
- [ ] Move constants to module level:
  ```python
  CONFIRMATION_QUERY_THRESHOLD = 10
  CONFIRMATION_COST_THRESHOLD = 0.10
  DEFAULT_COST_PER_QUERY = 0.002
  ```
- [ ] Reduce `run()` function to ~100 lines max
- [ ] Write unit tests for each extracted helper
- [ ] Verify integration tests still pass

**Acceptance Criteria**:
- `run()` function is under 150 lines
- All logic extracted to well-named helpers
- No behavior changes (all tests pass)
- Improved readability and maintainability

---

### 5. Remove Code Duplication
**Priority**: 🟡 High
**Effort**: M (Medium - 4-6 hours)
**Files**: `llm_answer_watcher/cli.py`

**Issues**:
- Result list building duplicated (lines 342-382 and 393-433)
- Similar exception handling patterns repeated

**Tasks**:
- [ ] Consolidate result list building into shared function
- [ ] Simplify exception handling in `_check_brands_appeared()`:
  ```python
  except (json.JSONDecodeError, OSError) as e:
      logger.warning(f"Failed to check brands for {intent_id}: {e}")
      return False
  except Exception as e:
      logger.warning(f"Unexpected error: {e}", exc_info=True)
      return False
  ```
- [ ] Search for other duplication patterns: `rg -A5 "def.*:" | grep -A5 "TODO\|XXX\|FIXME"`
- [ ] Update tests if needed

**Acceptance Criteria**:
- DRY principle followed (Don't Repeat Yourself)
- Code is more maintainable
- All tests pass

---

### 6. Dynamic Pricing from llm-prices.com
**Priority**: 🟡 High
**Effort**: M (Medium - 4-8 hours)
**Files**:
- `llm_answer_watcher/utils/cost.py`
- `llm_answer_watcher/utils/pricing_loader.py` (new)
- `tests/test_utils_pricing_loader.py` (new)

**Issue**: Hardcoded pricing will become stale

**Background**: https://www.llm-prices.com/current-v1.json provides up-to-date pricing

**Tasks**:
- [ ] Create new `utils/pricing_loader.py` module:
  ```python
  import httpx
  import json
  from pathlib import Path
  from datetime import datetime, timedelta

  PRICING_URL = "https://www.llm-prices.com/current-v1.json"
  CACHE_FILE = Path.home() / ".cache/llm-answer-watcher/pricing.json"
  CACHE_DURATION = timedelta(days=1)

  def fetch_pricing() -> dict:
      """Fetch latest pricing from llm-prices.com."""
      pass

  def load_pricing_with_cache() -> dict:
      """Load pricing with 24-hour cache."""
      pass

  def get_pricing(provider: str, model: str) -> dict | None:
      """Get pricing for provider/model with fallback."""
      pass
  ```
- [ ] Update `cost.py` to use dynamic pricing:
  - Keep PRICING dict as fallback
  - Try dynamic pricing first
  - Log warning if fallback is used
- [ ] Add cache directory creation
- [ ] Add timeout for pricing fetch (5 seconds)
- [ ] Handle network errors gracefully
- [ ] Write comprehensive tests:
  - [ ] Test cache hit/miss
  - [ ] Test cache expiration
  - [ ] Test network failure fallback
  - [ ] Test pricing format conversion
- [ ] Document pricing source in comments
- [ ] Add CLI flag `--update-pricing` to force refresh

**JSON Format from llm-prices.com**:
```json
{
  "gpt-4o-mini": {
    "prompt": 0.15,
    "completion": 0.60,
    "provider": "openai"
  }
}
```

**Acceptance Criteria**:
- Pricing updates daily from llm-prices.com
- Graceful fallback to hardcoded pricing if fetch fails
- Cache reduces unnecessary network calls
- All existing tests pass
- New tests cover caching and fallback logic

---

### 7. Add Rate Limiting
**Priority**: 🟡 High (Cost Control)
**Effort**: M (Medium - 4-6 hours)
**Files**:
- `llm_answer_watcher/llm_runner/openai_client.py`
- `llm_answer_watcher/config/schema.py`
- `requirements`: Add `ratelimit` dependency

**Issue**: No protection against accidental high-volume API calls

**Tasks**:
- [ ] Add `ratelimit` to dependencies in `pyproject.toml`
- [ ] Add rate limiting configuration to `RunSettings`:
  ```python
  class RunSettings(BaseModel):
      # ... existing fields
      max_requests_per_minute: int = 60  # Default rate limit
  ```
- [ ] Implement rate limiter in OpenAI client:
  ```python
  from ratelimit import limits, sleep_and_retry

  @sleep_and_retry
  @limits(calls=self.max_calls_per_minute, period=60)
  def generate_answer(self, prompt: str) -> LLMResponse:
      ...
  ```
- [ ] Make rate limit configurable per model
- [ ] Add logging when rate limit is hit
- [ ] Write tests for rate limiting behavior
- [ ] Document in CLAUDE.md and examples

**Acceptance Criteria**:
- Rate limiting prevents burst requests
- Configurable per deployment
- Clear logging when rate limited
- Tests verify rate limit enforcement

---

### 8. Add Test Coverage Reporting
**Priority**: 🟡 High
**Effort**: S (Small - 2 hours)
**Files**:
- `.github/workflows/ci.yml` (if exists)
- `pyproject.toml`
- `README.md`

**Tasks**:
- [ ] Run coverage report: `pytest --cov=llm_answer_watcher --cov-report=html --cov-report=term-missing`
- [ ] Review current coverage percentage
- [ ] Identify uncovered code paths
- [ ] Add coverage badge to README
- [ ] Set up coverage threshold in CI (80% minimum)
- [ ] Document coverage requirements in CONTRIBUTING.md

**Acceptance Criteria**:
- Coverage report generated on every test run
- Coverage is at least 80% for core modules
- CI fails if coverage drops below threshold
- Coverage report visible in README

---

## 🟢 Medium Priority (Quality Improvements)

### 9. Make API Endpoints Configurable
**Priority**: 🟢 Medium
**Effort**: S (Small - 2-3 hours)
**Files**: `llm_answer_watcher/llm_runner/openai_client.py`

**Issue**: Hardcoded `OPENAI_API_URL = "https://api.openai.com/v1/responses"`

**Tasks**:
- [ ] Make endpoint configurable via environment variable:
  ```python
  OPENAI_API_URL = os.getenv(
      "OPENAI_API_URL",
      "https://api.openai.com/v1/responses"
  )
  ```
- [ ] Document in README.md and CLAUDE.md
- [ ] Useful for:
  - Testing against mock servers
  - Using proxy servers
  - Azure OpenAI endpoints
  - Future provider implementations

**Acceptance Criteria**:
- API endpoint respects environment variable
- Falls back to default if not set
- Documented for users

---

### 10. Review and Adjust Timeouts
**Priority**: 🟢 Medium
**Effort**: S (Small - 2-4 hours)
**Files**:
- `llm_answer_watcher/llm_runner/retry_config.py`
- `llm_answer_watcher/llm_runner/openai_client.py`

**Issue**: `REQUEST_TIMEOUT = 120.0` seconds is very generous

**Tasks**:
- [ ] Review actual response times from logs
- [ ] Consider model-specific timeouts:
  ```python
  MODEL_TIMEOUTS = {
      "gpt-5": 120.0,  # Large model, longer timeout
      "gpt-4o": 60.0,
      "gpt-4o-mini": 30.0,
      "default": 60.0,
  }
  ```
- [ ] Update OpenAI client to use model-specific timeout
- [ ] Document timeout reasoning
- [ ] Add timeout configuration to RuntimeModel

**Worst Case Analysis**:
- Current: 120s × 3 retries = 6 minutes per query
- Proposed: 60s × 3 retries = 3 minutes per query
- For 10 queries: 30 minutes vs 60 minutes

**Acceptance Criteria**:
- Timeouts are reasonable for each model
- Documented reasoning for timeout values
- Configuration allows override if needed

---

### 11. Improve Error Messages
**Priority**: 🟢 Medium
**Effort**: S (Small - 2-3 hours)
**Files**: Various

**Tasks**:
- [ ] Review all error messages for clarity
- [ ] Add actionable guidance to error messages:
  ```python
  # Before
  raise ValueError("API key cannot be empty")

  # After
  raise ValueError(
      f"API key for {provider}/{model_name} is not set. "
      f"Please set environment variable ${env_var_name}. "
      f"See README.md for setup instructions."
  )
  ```
- [ ] Add troubleshooting section to docs
- [ ] Include common errors and solutions

**Acceptance Criteria**:
- Error messages are actionable
- Users know exactly how to fix issues
- Links to documentation where applicable

---

### 12. Add Edge Case Tests
**Priority**: 🟢 Medium
**Effort**: M (Medium - 6-8 hours)
**Files**: Various test files

**Missing Test Scenarios**:
- [ ] SQLite file locked by another process
- [ ] Disk full during write operations
- [ ] API returns malformed JSON
- [ ] Unicode characters in brand names
- [ ] Very long brand names (>100 chars)
- [ ] Special regex characters in brand names
- [ ] Network timeout during pricing fetch
- [ ] Concurrent access to cache file
- [ ] Extremely long LLM responses (>100k chars)
- [ ] Zero-cost responses (usage_meta missing)

**Tasks**:
- [ ] Add test cases for each scenario
- [ ] Use mocks to simulate failure conditions
- [ ] Verify graceful degradation
- [ ] Document expected behavior

**Acceptance Criteria**:
- All edge cases have test coverage
- System degrades gracefully
- No unexpected crashes

---

### 13. Extract Complex Methods
**Priority**: 🟢 Medium
**Effort**: M (Medium - 4-6 hours)
**Files**: `llm_answer_watcher/llm_runner/openai_client.py`

**Issue**: `_extract_answer_text()` is complex with nested loops

**Tasks**:
- [ ] Break down `_extract_answer_text()`:
  ```python
  def _extract_answer_text(self, data: dict) -> str:
      output = self._get_output_array(data)
      return self._find_text_in_output(output)

  def _get_output_array(self, data: dict) -> list:
      """Extract and validate output array from response."""
      pass

  def _find_text_in_output(self, output: list) -> str:
      """Find first text content in output array."""
      pass
  ```
- [ ] Improve readability with early returns
- [ ] Add unit tests for each helper
- [ ] Consider using match/case (Python 3.10+)

**Acceptance Criteria**:
- Each function has single responsibility
- Easier to understand and test
- All existing tests pass

---

## 🔵 Low Priority (Future Enhancements)

### 14. Async/Await Support (v2)
**Priority**: 🔵 Low (Future)
**Effort**: XL (Extra Large - 16+ hours)
**Files**: Multiple

**Note**: CLAUDE.md explicitly states "No async in v1" as design decision

**Future Considerations**:
- Would allow parallel LLM API calls
- Significantly reduce total execution time
- Requires async SQLite library (aiosqlite)
- Requires async HTTP client (httpx already supports it)
- Breaking change to API

**When to Implement**: v2.0 release

---

### 15. Structured Logging
**Priority**: 🔵 Low
**Effort**: M (Medium - 4-6 hours)
**Files**: `llm_answer_watcher/utils/logging.py`, various

**Enhancement**: JSON structured logging for production

**Tasks**:
- [ ] Add `python-json-logger` dependency
- [ ] Create structured logger:
  ```python
  logger.info("API call completed", extra={
      "provider": "openai",
      "model": "gpt-4o-mini",
      "tokens": 450,
      "cost_usd": 0.000135,
      "duration_ms": 1234,
  })
  ```
- [ ] Make format configurable (text vs JSON)
- [ ] Add request ID tracking
- [ ] Integrate with monitoring systems

**Benefits**:
- Better observability
- Easier log aggregation
- Machine-readable logs

---

### 16. Observability & Metrics
**Priority**: 🔵 Low
**Effort**: L (Large - 8-12 hours)
**Files**: New module `llm_answer_watcher/observability/`

**Enhancements**:
- Prometheus metrics endpoint
- OpenTelemetry tracing
- Grafana dashboards
- Alert configuration

**Metrics to Track**:
- API call duration (p50, p95, p99)
- Cost per query
- Error rates by provider
- Cache hit rates
- Brand mention frequency

**When to Implement**: After v1.0 release, for cloud deployment

---

### 17. Configuration Validation CLI
**Priority**: 🔵 Low
**Effort**: S (Small - 2-3 hours)
**Files**: `llm_answer_watcher/cli.py`

**Enhancement**: Improve `validate` command

**Tasks**:
- [ ] Add deeper validation:
  - Check if API keys are actually valid (make test call)
  - Validate system prompt files exist
  - Check database path is writable
  - Verify output directory permissions
- [ ] Add `--strict` flag for comprehensive checks
- [ ] Show detailed validation report

---

### 18. Batch Processing Support
**Priority**: 🔵 Low
**Effort**: L (Large - 8-12 hours)
**Files**: Multiple

**Enhancement**: Support batch mode for cost optimization

**Use Case**: OpenAI Batch API is 50% cheaper but has 24-hour latency

**Tasks**:
- [ ] Add `--batch` flag to CLI
- [ ] Submit batch jobs via OpenAI Batch API
- [ ] Poll for completion
- [ ] Process results when ready
- [ ] Update database with batch results

**Benefits**:
- 50% cost reduction
- Good for non-time-sensitive monitoring

---

## 📋 Technical Debt Tracking

### Debt Summary
| Category | Count | Total Effort |
|----------|-------|--------------|
| Critical | 3 | ~24 hours |
| High Priority | 5 | ~34 hours |
| Medium Priority | 5 | ~20 hours |
| Low Priority | 5 | ~40+ hours |
| **Total** | **18** | **~118 hours** |

### Recommended Sprint Planning
- **Sprint 1** (Week 1-2): Complete all Critical tasks
- **Sprint 2** (Week 3-4): Complete High Priority tasks 4-6
- **Sprint 3** (Week 5-6): Complete High Priority tasks 7-8 + Medium tasks
- **Future Backlog**: Low Priority enhancements

---

## 🔧 Implementation Notes

### Pricing Integration Details

**llm-prices.com JSON Format**:
```json
{
  "gpt-4o-mini": {
    "prompt": 0.15,
    "completion": 0.60,
    "provider": "openai"
  },
  "claude-3-5-haiku-20241022": {
    "prompt": 0.80,
    "completion": 4.00,
    "provider": "anthropic"
  }
}
```

**Conversion to Internal Format**:
```python
def convert_pricing_format(external: dict) -> dict:
    """Convert llm-prices.com format to internal PRICING format."""
    internal = {}
    for model_name, pricing in external.items():
        provider = pricing["provider"]
        if provider not in internal:
            internal[provider] = {}

        internal[provider][model_name] = {
            "input": pricing["prompt"] / 1_000_000,
            "output": pricing["completion"] / 1_000_000,
        }
    return internal
```

**Caching Strategy**:
1. Check if cache file exists and is fresh (< 24 hours old)
2. If fresh, load from cache
3. If stale or missing, fetch from URL
4. Save to cache with timestamp
5. On fetch failure, use cached version (even if stale)
6. Final fallback: hardcoded PRICING dict

---

## ✅ Success Criteria

**Before v1.0 Release**:
- [ ] All Critical issues resolved
- [ ] All High Priority issues resolved
- [ ] Test coverage ≥ 80%
- [ ] All tests passing
- [ ] Zero linting errors
- [ ] Documentation updated

**Code Quality Metrics**:
- [ ] Linting: 0 violations
- [ ] Tests: 100% passing
- [ ] Coverage: ≥80% for core modules
- [ ] Security: No known vulnerabilities
- [ ] Performance: Acceptable for v1 (synchronous)

---

## 📝 Notes

- This document should be updated as tasks are completed
- Mark completed tasks with `[x]`
- Add new issues as discovered
- Link to related GitHub issues/PRs
- Track actual time vs estimated time for future planning

**Last Review**: 2025-11-03
**Next Review**: After completing Critical tasks
