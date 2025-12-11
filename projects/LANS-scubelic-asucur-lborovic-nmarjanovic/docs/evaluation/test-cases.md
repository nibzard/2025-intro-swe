# Test Cases

Creating evaluation test fixtures.

## Fixture Format

```yaml
test_cases:
  - description: "Brand detection test"
    intent_id: "test-intent"
    llm_answer_text: |
      The best tools are:
      1. YourBrand
      2. CompetitorA

    brands_mine: ["YourBrand"]
    brands_competitors: ["CompetitorA"]

    expected_my_mentions: ["YourBrand"]
    expected_competitor_mentions: ["CompetitorA"]

    expected_ranked_list:
      - "YourBrand"
      - "CompetitorA"
```

## Running Custom Fixtures

```bash
llm-answer-watcher eval --fixtures my_tests.yaml
```

See [CI Integration](ci-integration.md) for automated testing.
