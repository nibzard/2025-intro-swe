# Cost System Updates - Implementation Plan

**Date Started**: 2025-11-04
**Issue**: Cost calculation improvements - dynamic pricing, web search costs, budgets
**Status**: In Progress

## Overview

Comprehensive overhaul of the cost calculation system to:
1. Load pricing dynamically from external sources
2. Support local overrides for custom tools (web search)
3. Implement budget controls
4. Accurate web search cost calculation

## Problem Statement

**Current Issues Identified:**
1. ⚠️ Hardcoded pricing table in `utils/cost.py` - requires manual updates
2. ⚠️ Web search costs not properly calculated (only token usage tracked)
3. ⚠️ No budget controls or pre-run cost warnings
4. ⚠️ No automated pricing refresh mechanism
5. ⚠️ Speculative GPT-5 pricing (though GPT-5 is now public)

## Implementation Plan

### Phase 1: Dynamic Pricing Infrastructure ✅ COMPLETED

**Tasks:**
- [x] Create COST_UPDATES.md tracking file
- [ ] Create `utils/pricing.py` module for dynamic pricing
- [ ] Implement loader for https://www.llm-prices.com/current-v1.json
- [ ] Implement local override JSON support
- [ ] Create default override file: `config/pricing_overrides.json`
- [ ] Add caching mechanism (avoid hitting API on every run)
- [ ] Add pricing refresh timestamp tracking

**Files Created/Modified:**
- `COST_UPDATES.md` (this file)
- `llm_answer_watcher/utils/pricing.py` (new)
- `config/pricing_overrides.json` (new)
- `config/pricing_cache.json` (generated, gitignored)

**Design Decisions:**
- Use `llm-prices.com` as primary source (comprehensive, up-to-date)
- Local overrides for:
  - Web search tool calls ($10/1k calls for standard, $25/1k for preview)
  - Code interpreter ($0.03/session)
  - File search ($2.50/1k calls)
- Cache pricing for 24 hours to avoid excessive API calls
- Fallback to hardcoded pricing if remote fails (backward compatibility)

---

### Phase 2: Web Search Cost Calculation ⏳ IN PROGRESS

**Tasks:**
- [ ] Update `utils/cost.py` to accept web search parameters
- [ ] Add `calculate_web_search_cost()` function
- [ ] Update `openai_client.py` to track web search tool calls
- [ ] Distinguish between preview and non-preview web search
- [ ] Handle fixed 8k token block for gpt-4o-mini web search
- [ ] Update LLMResponse dataclass with web_search_cost_usd field

**Files Modified:**
- `llm_answer_watcher/utils/cost.py`
- `llm_answer_watcher/llm_runner/openai_client.py`
- `llm_answer_watcher/llm_runner/models.py`

**Web Search Pricing Rules (from OpenAI):**
```
Tool Version                              Tool Call Cost        Content Tokens
--------------------------------------------------------------------------------
web_search (all models)                   $10.00 / 1k calls     @ model input rate
web_search_preview (reasoning models)     $10.00 / 1k calls     @ model input rate
web_search_preview (non-reasoning)        $25.00 / 1k calls     FREE
gpt-4o-mini with web_search               $10.00 / 1k calls     8,000 fixed tokens
gpt-4.1-mini with web_search              $10.00 / 1k calls     8,000 fixed tokens
```

**Implementation Notes:**
- Track tool version used (preview vs non-preview)
- Detect reasoning models (o1, o3 families)
- For gpt-4o-mini/gpt-4.1-mini: add fixed 8k tokens to cost calculation
- Store breakdown: `{"token_cost": X, "tool_call_cost": Y, "total": Z}`

---

### Phase 3: Budget System 🔜 NEXT

**Tasks:**
- [ ] Update `config/models.py` schema with budget settings
- [ ] Add `BudgetConfig` Pydantic model
- [ ] Implement pre-run cost estimation in `runner.py`
- [ ] Add budget validation before execution
- [ ] Create warning system for high-cost runs
- [ ] Add `--force` flag to override budget limits
- [ ] Update example configs with budget settings

**Files Modified:**
- `llm_answer_watcher/config/models.py`
- `llm_answer_watcher/llm_runner/runner.py`
- `examples/watcher.config.yaml`
- `examples/watcher.config.with_budgets.yaml` (new)

**Budget Configuration Schema:**
```yaml
run_settings:
  sqlite_db_path: "./llm_watcher.db"
  output_dir: "./output"

  # Budget controls (optional)
  budget:
    max_per_run_usd: 1.00        # Max cost per run (abort if exceeded)
    max_per_intent_usd: 0.10     # Max cost per intent
    warn_threshold_usd: 0.50     # Warn if estimated cost exceeds this
    enabled: true                # Enable/disable budget checks
```

**Pre-Run Estimation Algorithm:**
```python
estimated_cost = 0.0
for intent in config.intents:
    for model in config.models:
        # Estimate tokens: ~100 input (prompt) + ~500 output (answer)
        avg_input_tokens = 100
        avg_output_tokens = 500

        # Look up model pricing
        pricing = get_pricing(model.provider, model.model_name)
        query_cost = (avg_input_tokens * pricing.input) + (avg_output_tokens * pricing.output)

        # Add web search if enabled
        if model.tools and "web_search" in model.tools:
            query_cost += 0.01  # $10/1k = $0.01 per call

        estimated_cost += query_cost

if budget.enabled and estimated_cost > budget.max_per_run_usd:
    raise BudgetExceededError(f"Estimated cost ${estimated_cost:.4f} exceeds budget ${budget.max_per_run_usd:.2f}")
```

---

### Phase 4: CLI Commands 🔜 UPCOMING

**Tasks:**
- [ ] Add `prices` command group to CLI
- [ ] Implement `prices show` - Display current pricing
- [ ] Implement `prices refresh` - Update from llm-prices.com
- [ ] Implement `prices list` - Show all supported models
- [ ] Add `--pricing-file` flag to override pricing source
- [ ] Update CLI help text

**Commands:**
```bash
# Show current cached pricing
llm-answer-watcher prices show

# Show pricing for specific provider
llm-answer-watcher prices show --provider openai

# Refresh pricing from remote source
llm-answer-watcher prices refresh

# List all supported models with pricing
llm-answer-watcher prices list

# Run with custom pricing file
llm-answer-watcher run --config config.yaml --pricing-file custom_prices.json
```

**Files Modified:**
- `llm_answer_watcher/cli.py`

---

### Phase 5: Testing & Documentation 📝 FINAL

**Tasks:**
- [ ] Update `test_utils_cost.py` for dynamic pricing
- [ ] Add `test_utils_pricing.py` for pricing loader
- [ ] Add tests for web search cost calculation
- [ ] Add tests for budget validation
- [ ] Update integration tests
- [ ] Update README.md with new features
- [ ] Update SPECS.md
- [ ] Add pricing update guide to CONTRIBUTING.md

**Test Coverage Targets:**
- `utils/pricing.py`: 90%+
- Updated `utils/cost.py`: 85%+
- Budget validation: 90%+
- CLI commands: 80%+

---

## Implementation Status

### Completed Tasks ✅
- [x] Create COST_UPDATES.md tracking file
- [x] Create `utils/pricing.py` module for dynamic pricing
- [x] Implement loader for https://www.llm-prices.com/current-v1.json
- [x] Implement local override JSON support (`config/pricing_overrides.json`)
- [x] Add caching mechanism (24-hour cache in `config/pricing_cache.json`)
- [x] Add pricing refresh timestamp tracking
- [x] Update `utils/cost.py` with web search cost functions
- [x] Add `estimate_cost_with_dynamic_pricing()` function
- [x] Add `calculate_web_search_cost()` function
- [x] Add `detect_web_search_version()` helper
- [x] Update OpenAI client to use new cost calculation
- [x] Add detailed web search cost logging
- [x] Create `BudgetConfig` Pydantic model
- [x] Update `RunSettings` schema with budget field
- [x] Create example config with budget settings
- [x] Add pricing cache to .gitignore

### Completed - Phase 6: Testing ✅
- [x] Write comprehensive tests for pricing module (400+ lines, 50+ tests)
- [x] Write tests for web search cost calculations (240+ lines, 30+ tests)
- [x] Write budget validation tests (350+ lines, 25+ tests)
- [x] Test all pricing sources (remote, cache, overrides, fallback)
- [x] Test fuzzy model name matching
- [x] Test cache expiration logic
- [x] Test all web search pricing tiers
- [x] Test budget enforcement scenarios
- [x] Test error handling and edge cases

### Completed - Phase 7: Documentation ✅
- [x] Update README.md with pricing and budget sections
- [x] Document dynamic pricing commands
- [x] Document web search cost tiers
- [x] Document budget configuration
- [x] Update key features list
- [x] Add cost tracking SQL examples

### All Phases Complete! 🎉
✅ Phase 1: Dynamic Pricing Infrastructure
✅ Phase 2: Web Search Cost Calculation
✅ Phase 3: Budget System Schema
✅ Phase 4: Budget Enforcement
✅ Phase 5: CLI Pricing Commands
✅ Phase 6: Comprehensive Testing
✅ Phase 7: Documentation Updates

### Completed - Phase 4: Budget System ✅
- [x] Add `estimate_run_cost()` function in runner
- [x] Add `validate_budget()` function with error handling
- [x] Create `BudgetExceededError` exception
- [x] Integrate budget validation into `run_all()`
- [x] Add pre-run cost estimation logging
- [x] Support per-run and per-intent budget limits
- [x] Support warning thresholds

### Completed - Phase 5: CLI Commands ✅
- [x] Create `prices` command group with typer
- [x] Implement `prices show` - Display pricing table
- [x] Implement `prices refresh` - Update from remote
- [x] Implement `prices list` - List all models
- [x] Support `--provider` filter for all commands
- [x] Support `--format json` for automation
- [x] Add Rich table formatting for text mode
- [x] Update CLI help text and docstrings

---

## Technical Decisions Log

### Decision 1: Pricing Source
**Date**: 2025-11-04
**Decision**: Use llm-prices.com as primary source + local overrides
**Rationale**:
- Comprehensive coverage (100+ models)
- Regularly updated
- JSON API available
- Allows custom overrides for tools not in standard pricing

**Alternatives Considered**:
- Provider APIs directly (no unified format)
- Manual YAML file (maintenance burden)
- Hardcoded only (current approach, rejected)

### Decision 2: Caching Strategy
**Date**: 2025-11-04
**Decision**: 24-hour cache with manual refresh command
**Rationale**:
- Pricing changes infrequently (monthly at most)
- Reduces API calls
- Users can force refresh if needed
- Fallback to cache if remote unavailable

### Decision 3: Budget Configuration Location
**Date**: 2025-11-04
**Decision**: Add to run_settings in config YAML
**Rationale**:
- Keeps all run-time settings together
- Per-config flexibility (dev vs prod budgets)
- Optional (backward compatible)
- Easy to version control

### Decision 4: Web Search Cost Breakdown
**Date**: 2025-11-04
**Decision**: Store separate fields for tool_call_cost and token_cost
**Rationale**:
- Transparency for users
- Debugging pricing discrepancies
- Future tool cost tracking (code interpreter, file search)
- Better reporting in HTML

---

## Migration Path

### For Users
1. **No action required** - System maintains backward compatibility
2. **Optional**: Add budget config to YAML files
3. **Optional**: Run `prices refresh` to update pricing
4. **Recommended**: Review new web search costs if using tools

### For Developers
1. Update tests to use dynamic pricing fixtures
2. Remove references to hardcoded PRICING dict
3. Use `get_pricing()` instead of `PRICING[provider][model]`
4. Handle `PricingNotAvailableError` exceptions

---

## API Changes

### New Public APIs

#### `utils/pricing.py`
```python
def get_pricing(provider: str, model: str) -> ModelPricing:
    """Get pricing for provider/model, with caching and overrides."""

def refresh_pricing(force: bool = False) -> dict:
    """Refresh pricing from remote source."""

def load_pricing_overrides(file_path: str) -> dict:
    """Load local pricing overrides."""
```

#### `utils/cost.py`
```python
def estimate_cost(
    provider: str,
    model: str,
    usage_meta: dict,
    web_search_count: int = 0,
    web_search_version: str = "web_search",
) -> CostBreakdown:
    """Enhanced cost calculation with web search support."""

def calculate_web_search_cost(
    model: str,
    web_search_count: int,
    web_search_version: str,
    content_tokens: int = 0,
) -> float:
    """Calculate web search tool call costs."""
```

### Breaking Changes
**None** - All changes are backward compatible. Hardcoded pricing remains as fallback.

---

## Rollout Plan

### Stage 1: Infrastructure (Days 1-2)
- Implement pricing loader
- Add local overrides
- Update cost calculation

### Stage 2: Features (Days 3-4)
- Add web search cost calculation
- Implement budget system
- Add CLI commands

### Stage 3: Testing (Day 5)
- Write comprehensive tests
- Integration testing
- Documentation updates

### Stage 4: Review & Deploy (Day 6)
- Code review
- Final testing
- Commit and push

---

## Success Criteria

- [ ] Pricing auto-updates from llm-prices.com
- [ ] Web search costs calculated accurately
- [ ] Budget limits enforced before execution
- [ ] CLI commands for price management working
- [ ] All existing tests pass
- [ ] New tests cover 85%+ of changes
- [ ] Documentation updated
- [ ] No regression in existing functionality

---

## Notes & Observations

### Web Search Pricing Complexity
OpenAI has 3 different web search pricing tiers:
1. Standard (all models): $10/1k + content tokens
2. Preview reasoning (o1, o3): $10/1k + content tokens
3. Preview non-reasoning: $25/1k + FREE content tokens

Special case: gpt-4o-mini and gpt-4.1-mini have fixed 8,000 token blocks.

This requires detecting:
- Tool version (preview vs standard)
- Model family (reasoning vs non-reasoning)
- Specific models (gpt-4o-mini, gpt-4.1-mini)

### Budget Estimation Challenge
Accurate pre-run estimation is difficult because:
- Token count varies by prompt and response
- Web search may or may not trigger
- Content token count unknown until API call

Solution: Use conservative estimates with 20% buffer:
```python
estimated_cost = calculated_cost * 1.20  # 20% buffer
```

---

## Questions & Decisions Needed

- [x] Should we remove hardcoded pricing entirely?
  - **Decision**: No, keep as fallback for offline use

- [x] How often should we refresh pricing automatically?
  - **Decision**: Manual refresh only, cache for 24 hours

- [x] Should budget be global or per-intent?
  - **Decision**: Both - support max_per_run_usd and max_per_intent_usd

---

## Related Files

**Core Implementation:**
- `llm_answer_watcher/utils/pricing.py` (new)
- `llm_answer_watcher/utils/cost.py` (modified)
- `llm_answer_watcher/config/models.py` (modified)
- `llm_answer_watcher/llm_runner/runner.py` (modified)
- `llm_answer_watcher/llm_runner/openai_client.py` (modified)
- `llm_answer_watcher/cli.py` (modified)

**Configuration:**
- `config/pricing_overrides.json` (new)
- `config/pricing_cache.json` (generated)
- `examples/watcher.config.with_budgets.yaml` (new)

**Tests:**
- `tests/test_utils_pricing.py` (new)
- `tests/test_utils_cost.py` (modified)
- `tests/test_llm_runner_runner.py` (modified)

**Documentation:**
- `README.md` (modified)
- `SPECS.md` (modified)
- `CONTRIBUTING.md` (modified)

---

**Last Updated**: 2025-11-04
**Next Review**: After Phase 1 completion
