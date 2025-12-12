# Evaluation Framework

The LLM Answer Watcher evaluation framework ensures extraction accuracy and quality control through comprehensive automated testing.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Fixtures YAML Format](#fixtures-yaml-format)
- [Metrics Reference](#metrics-reference)
- [Interpreting Results](#interpreting-results)
- [Adding Test Cases](#adding-test-cases)
- [Database Schema](#database-schema)
- [Best Practices](#best-practices)

## Overview

### What Evals Test

The evaluation framework tests **extraction accuracy**, NOT LLM quality:

- ✅ Brand mention detection (word boundaries, case sensitivity)
- ✅ Precision and recall of mentions
- ✅ Rank extraction accuracy
- ✅ Edge case handling (special characters, compound words)
- ❌ LLM response quality (not tested)
- ❌ LLM factual accuracy (not tested)

### Why This Matters

The core value of LLM Answer Watcher is **accurate data extraction** from LLM responses. Even if LLMs give perfect answers, the tool is useless if extraction fails. Evals ensure:

1. **Brand mentions aren't missed** (high recall)
2. **False positives are minimized** (high precision)
3. **Rankings are accurately extracted** (high rank accuracy)
4. **Edge cases are handled** (robustness)

## Quick Start

### Running Evaluations

```bash
# Run the full evaluation suite
llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml

# Run with custom database path
llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml --db my_eval_results.db

# JSON output for CI/CD
llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml --format json

# Verbose output
llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml --verbose
```

### Expected Output

```
🧪 Running Evaluation Suite
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Test Results:
  ✅ Passed: 8/10 tests (80.0%)
  ❌ Failed: 2/10 tests

📊 Metrics Summary:
  mention_precision:  0.95 (✅ >= 0.90)
  mention_recall:     0.88 (✅ >= 0.80)
  mention_f1:         0.91 (✅ >= 0.85)
  rank_accuracy:      0.87 (✅ >= 0.85)
  brand_coverage:     0.92 (✅ >= 0.90)

✅ All thresholds passed

💾 Results saved to: eval_results.db
```

### Exit Codes

```
0: All tests passed (above thresholds)
1: Tests failed (below thresholds)
2: Configuration error (invalid fixtures)
```

## Fixtures YAML Format

### Basic Structure

```yaml
test_cases:
  - description: "Brief description of what this test validates"
    intent_id: "unique-test-identifier"
    llm_answer_text: |
      The actual LLM response text to test against.
      This can be multi-line and should represent
      a realistic LLM answer.

    brands_mine:
      - "YourBrand"
      - "YourBrand.io"

    brands_competitors:
      - "Competitor1"
      - "Competitor2"

    expected_my_mentions:
      - "YourBrand"

    expected_competitor_mentions:
      - "Competitor1"
      - "Competitor2"

    expected_ranked_list:
      - "YourBrand"
      - "Competitor1"
      - "Competitor2"
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | string | Yes | Human-readable test description |
| `intent_id` | string | Yes | Unique identifier for the test case |
| `llm_answer_text` | string | Yes | The LLM response text to analyze |
| `brands_mine` | list[str] | Yes | List of your brand names/aliases to detect |
| `brands_competitors` | list[str] | Yes | List of competitor brand names to detect |
| `expected_my_mentions` | list[str] | Yes | Brands from `brands_mine` that SHOULD be found |
| `expected_competitor_mentions` | list[str] | Yes | Brands from `brands_competitors` that SHOULD be found |
| `expected_ranked_list` | list[str] | Yes | Ordered list of how brands should be ranked |

### Example Test Cases

#### Test 1: Basic Mention Detection

```yaml
test_cases:
  - description: "HubSpot mention detection in CRM list"
    intent_id: "test_001_basic_mention"
    llm_answer_text: |
      The best CRM tools are:
      1. HubSpot - Great for small businesses
      2. Salesforce - Enterprise solution
      3. Pipedrive - Sales-focused CRM

    brands_mine:
      - "HubSpot"

    brands_competitors:
      - "Salesforce"
      - "Pipedrive"

    expected_my_mentions:
      - "HubSpot"

    expected_competitor_mentions:
      - "Salesforce"
      - "Pipedrive"

    expected_ranked_list:
      - "HubSpot"
      - "Salesforce"
      - "Pipedrive"
```

#### Test 2: Word Boundary Edge Case

```yaml
test_cases:
  - description: "Word boundary test - 'hub' should not match in 'GitHub'"
    intent_id: "test_002_word_boundary"
    llm_answer_text: |
      I use GitHub for version control and Bitbucket for CI/CD.
      For project management, I prefer Jira.

    brands_mine:
      - "HubSpot"

    brands_competitors:
      - "Salesforce"

    expected_my_mentions: []  # HubSpot should NOT be found

    expected_competitor_mentions: []  # No competitors mentioned

    expected_ranked_list: []  # No brands found
```

#### Test 3: Case Insensitivity

```yaml
test_cases:
  - description: "Case-insensitive matching for HUBSPOT vs HubSpot"
    intent_id: "test_003_case_insensitive"
    llm_answer_text: |
      HUBSPOT is a popular choice for marketing automation.
      Many teams use hubspot for their sales pipeline.

    brands_mine:
      - "HubSpot"

    brands_competitors: []

    expected_my_mentions:
      - "HubSpot"  # Should find both "HUBSPOT" and "hubspot"

    expected_competitor_mentions: []

    expected_ranked_list:
      - "HubSpot"
```

#### Test 4: Multiple Aliases

```yaml
test_cases:
  - description: "Detect brand mentioned with different aliases"
    intent_id: "test_004_aliases"
    llm_answer_text: |
      HubSpot and HubSpot CRM are both excellent choices.
      Some people also use the HubSpot.com platform directly.

    brands_mine:
      - "HubSpot"
      - "HubSpot CRM"
      - "HubSpot.com"

    brands_competitors: []

    expected_my_mentions:
      - "HubSpot"
      - "HubSpot CRM"
      - "HubSpot.com"

    expected_competitor_mentions: []

    expected_ranked_list:
      - "HubSpot"
      - "HubSpot CRM"
      - "HubSpot.com"
```

#### Test 5: No Mentions Edge Case

```yaml
test_cases:
  - description: "No brands mentioned - all lists should be empty"
    intent_id: "test_005_no_mentions"
    llm_answer_text: |
      I'm not familiar with any specific CRM tools.
      You should research options based on your needs.

    brands_mine:
      - "HubSpot"

    brands_competitors:
      - "Salesforce"

    expected_my_mentions: []

    expected_competitor_mentions: []

    expected_ranked_list: []
```

## Metrics Reference

### Mention Detection Metrics

#### Mention Precision

**Formula:** `TP / (TP + FP)`

**What it measures:** Of all the mentions found, how many were correct?

**Target threshold:** ≥ 0.90 (90%)

**Example:**
```
Expected mentions: ["HubSpot", "Salesforce"]
Found mentions:    ["HubSpot", "Salesforce", "GitHub"]  # GitHub is false positive

TP = 2 (HubSpot, Salesforce)
FP = 1 (GitHub)
Precision = 2 / (2 + 1) = 0.667 ❌ Below threshold
```

#### Mention Recall

**Formula:** `TP / (TP + FN)`

**What it measures:** Of all the expected mentions, how many were found?

**Target threshold:** ≥ 0.80 (80%)

**Example:**
```
Expected mentions: ["HubSpot", "Salesforce", "Pipedrive"]
Found mentions:    ["HubSpot", "Salesforce"]

TP = 2 (HubSpot, Salesforce)
FN = 1 (Pipedrive missed)
Recall = 2 / (2 + 1) = 0.667 ❌ Below threshold
```

#### Mention F1 Score

**Formula:** `2 × (Precision × Recall) / (Precision + Recall)`

**What it measures:** Harmonic mean of precision and recall

**Target threshold:** ≥ 0.85 (85%)

**Example:**
```
Precision = 0.90
Recall = 0.85

F1 = 2 × (0.90 × 0.85) / (0.90 + 0.85)
   = 2 × 0.765 / 1.75
   = 0.874 ✅ Above threshold
```

### Ranking Metrics

#### Rank Accuracy

**Formula:** `Correctly positioned brands / Total expected brands`

**What it measures:** Are brands ranked in the correct order?

**Target threshold:** ≥ 0.85 (85%)

**Example:**
```
Expected: ["HubSpot", "Salesforce", "Pipedrive"]
Actual:   ["HubSpot", "Pipedrive", "Salesforce"]

Position matches:
  Position 0: HubSpot == HubSpot ✅
  Position 1: Salesforce != Pipedrive ❌
  Position 2: Pipedrive != Salesforce ❌

Accuracy = 1 / 3 = 0.333 ❌ Below threshold
```

#### Brand Coverage

**Formula:** `Unique brands found / Total expected brands`

**What it measures:** What percentage of expected brands were detected?

**Target threshold:** ≥ 0.90 (90%)

**Example:**
```
Expected brands: ["HubSpot", "Salesforce", "Pipedrive", "Mailchimp"]
Found brands:    ["HubSpot", "Salesforce", "Pipedrive"]

Coverage = 3 / 4 = 0.75 ❌ Below threshold
```

### Critical Metrics

#### False is_mine Rate

**Formula:** `False is_mine flags / Total mentions`

**What it measures:** Are competitor brands incorrectly flagged as your brand?

**Target threshold:** 0.00 (zero tolerance)

**Example:**
```
brands_mine: ["HubSpot"]
brands_competitors: ["Salesforce"]

Found mentions:
  - HubSpot (is_mine=True) ✅ Correct
  - Salesforce (is_mine=True) ❌ CRITICAL ERROR

False is_mine rate = 1 / 2 = 0.50 ❌ FAILED
```

## Interpreting Results

### CLI Output

```
📊 Metrics Summary:
  mention_precision:  0.95 (✅ >= 0.90)
  mention_recall:     0.88 (✅ >= 0.80)
  mention_f1:         0.91 (✅ >= 0.85)
  rank_accuracy:      0.87 (✅ >= 0.85)
  brand_coverage:     0.92 (✅ >= 0.90)

✅ All thresholds passed
```

**What this means:**
- 95% of detected mentions were correct (precision)
- 88% of expected mentions were found (recall)
- Rankings were 87% accurate
- 92% of expected brands were detected

### JSON Output

```json
{
  "run_id": "2025-11-02T10-00-00Z",
  "pass_rate": 0.80,
  "total_test_cases": 10,
  "total_passed": 8,
  "total_failed": 2,
  "average_scores": {
    "mention_precision": 0.95,
    "mention_recall": 0.88,
    "mention_f1": 0.91,
    "rank_accuracy": 0.87,
    "brand_coverage": 0.92
  },
  "thresholds_passed": true
}
```

### Database Queries

```sql
-- View all evaluation runs
SELECT run_id, timestamp_utc, pass_rate,
       total_test_cases, total_passed, total_failed
FROM eval_runs
ORDER BY timestamp_utc DESC
LIMIT 10;

-- Track metric trends over time
SELECT DATE(r.timestamp_utc) as date,
       er.metric_name,
       AVG(er.metric_value) as avg_value,
       COUNT(*) as test_count
FROM eval_results er
JOIN eval_runs r ON er.eval_run_id = r.run_id
WHERE r.timestamp_utc >= datetime('now', '-30 days')
GROUP BY DATE(r.timestamp_utc), er.metric_name
ORDER BY date DESC, metric_name;

-- Find failing tests
SELECT test_description,
       COUNT(*) as failed_metrics,
       GROUP_CONCAT(metric_name || ':' || metric_value) as details
FROM eval_results
WHERE overall_passed = 0
GROUP BY test_description
ORDER BY failed_metrics DESC;
```

## Adding Test Cases

### When to Add Test Cases

Add a new test case when you:

1. **Fix a bug** - Regression test to prevent future bugs
2. **Add a feature** - Validate new functionality works
3. **Find an edge case** - Document expected behavior
4. **See production issues** - Reproduce and validate fix

### Test Case Design Checklist

✅ **Clear description** - What does this test validate?
✅ **Realistic LLM text** - Use actual LLM-like responses
✅ **Edge cases covered** - Test boundaries, not just happy path
✅ **Expected values explicit** - No ambiguity in what should pass
✅ **Independent test** - Doesn't depend on other tests

### Example: Adding a Regression Test

**Scenario:** Bug found where "hub" matched in "GitHub"

**Steps:**

1. Create test case in `evals/testcases/fixtures.yaml`:

```yaml
  - description: "Regression: 'hub' should not match in 'GitHub' (word boundary)"
    intent_id: "regression_github_false_match"
    llm_answer_text: |
      I recommend using GitHub for version control.
      For CI/CD, GitLab and GitHub Actions are great.

    brands_mine:
      - "HubSpot"

    brands_competitors:
      - "GitLab"

    expected_my_mentions: []  # HubSpot should NOT be found

    expected_competitor_mentions:
      - "GitLab"

    expected_ranked_list:
      - "GitLab"
```

2. Run evals to verify it fails (reproduces bug):

```bash
llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml
```

3. Fix the bug in `extractor/mention_detector.py`

4. Re-run evals to verify fix:

```bash
llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml
```

5. Commit test case with fix to prevent regression

## Database Schema

### Tables

#### eval_runs

Stores summary of each evaluation run:

```sql
CREATE TABLE eval_runs (
    run_id TEXT PRIMARY KEY,
    timestamp_utc TEXT NOT NULL,
    total_test_cases INTEGER NOT NULL,
    total_passed INTEGER NOT NULL,
    total_failed INTEGER NOT NULL,
    pass_rate REAL NOT NULL,
    summary_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_eval_runs_timestamp ON eval_runs(timestamp_utc);
CREATE INDEX idx_eval_runs_pass_rate ON eval_runs(pass_rate);
```

#### eval_results

Stores detailed metrics for each test case:

```sql
CREATE TABLE eval_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eval_run_id TEXT NOT NULL,
    test_description TEXT NOT NULL,
    overall_passed INTEGER NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    metric_passed INTEGER NOT NULL,
    metric_details_json TEXT,
    timestamp_utc TEXT NOT NULL,
    FOREIGN KEY (eval_run_id) REFERENCES eval_runs(run_id),
    UNIQUE(eval_run_id, test_description, metric_name)
);

CREATE INDEX idx_eval_results_run_id ON eval_results(eval_run_id);
CREATE INDEX idx_eval_results_metric_name ON eval_results(metric_name);
CREATE INDEX idx_eval_results_passed ON eval_results(overall_passed);
CREATE INDEX idx_eval_results_timestamp ON eval_results(timestamp_utc);
```

## Best Practices

### Writing Good Test Cases

✅ **DO:**
- Use realistic LLM response text
- Test edge cases (word boundaries, special chars)
- Include both positive and negative cases
- Make expected values explicit
- Add descriptive test descriptions

❌ **DON'T:**
- Use fake/contrived text
- Test only happy paths
- Make tests depend on each other
- Assume implicit behavior
- Write vague test descriptions

### Maintaining Eval Quality

1. **Run evals before every commit**
   ```bash
   llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml
   ```

2. **Review eval results in PRs**
   - Check CI/CD eval results
   - Don't merge if evals fail
   - Investigate metric regressions

3. **Update fixtures when behavior changes**
   - Don't just adjust thresholds
   - Understand WHY metrics changed
   - Document intentional changes

4. **Track metrics over time**
   ```sql
   SELECT DATE(timestamp_utc) as date, AVG(pass_rate) as avg_pass_rate
   FROM eval_runs
   WHERE timestamp_utc >= datetime('now', '-90 days')
   GROUP BY DATE(timestamp_utc)
   ORDER BY date DESC;
   ```

### CI/CD Integration

The evaluation suite runs automatically on every push:

```yaml
# .github/workflows/evals.yml
- name: Run Evaluation Suite
  run: |
    uv run llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml

- name: Check Exit Code
  run: |
    if [ $? -ne 0 ]; then
      echo "❌ Evaluation suite failed"
      exit 1
    fi
```

---

## Summary

The evaluation framework is your safety net for ensuring extraction accuracy. Follow these principles:

1. **Test extraction, not LLMs** - Focus on what you control
2. **High thresholds** - Maintain ≥90% precision, ≥80% recall
3. **Add regression tests** - Document every bug fix
4. **Track metrics** - Use historical data to spot trends
5. **Never skip evals** - They catch bugs before production

For questions or issues, see [CONTRIBUTING.md](../../CONTRIBUTING.md) or open a GitHub issue.
