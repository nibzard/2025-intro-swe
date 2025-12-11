# Post-Intent Operations

Post-intent operations allow you to execute custom actions after each intent query completes. This advanced feature enables dynamic workflows like discovering competitors mentioned by LLMs.

## Overview

Operations are defined per-intent and execute after the LLM response is received:

```yaml
intents:
  - id: "best-tools"
    prompt: "What are the best tools?"
    operations:
      - type: "extract_competitors"
        save_to: "discovered_competitors"
```

## Supported Operation Types

### `extract_competitors`

Automatically extracts brand names mentioned in LLM responses that aren't in your configured brand lists.

**Use Case**: Discover new competitors you weren't tracking.

**Configuration**:

```yaml
intents:
  - id: "market-research"
    prompt: "What are all the tools in this category?"
    operations:
      - type: "extract_competitors"
        save_to: "discovered_brands"
        params:
          min_confidence: 0.7
          exclude_generic_terms: true
```

**Parameters**:

- `save_to` (required): Variable name to store results
- `min_confidence`: Minimum confidence threshold (0.0-1.0)
- `exclude_generic_terms`: Filter out generic words

**Output**:

Results saved to `intent_*_operation_extract_competitors.json`:

```json
{
  "operation_type": "extract_competitors",
  "discovered_brands": [
    {"name": "NewCompetitor", "confidence": 0.95},
    {"name": "EmergingTool", "confidence": 0.82}
  ]
}
```

## Operation Chaining

Execute multiple operations in sequence:

```yaml
intents:
  - id: "comprehensive-analysis"
    prompt: "Analyze the market landscape"
    operations:
      # Step 1: Extract competitors
      - type: "extract_competitors"
        save_to: "new_competitors"

      # Step 2: Could add more operations in future
      # - type: "sentiment_analysis"
      #   depends_on: "new_competitors"
```

Operations execute in order and can depend on previous results.

## Real-World Examples

### Market Discovery

Find competitors you didn't know about:

```yaml
intents:
  - id: "discover-market"
    prompt: "List all email marketing tools you know"
    operations:
      - type: "extract_competitors"
        save_to: "market_scan"
        params:
          min_confidence: 0.8
```

### Quarterly Expansion

Update your competitor list quarterly:

```yaml
intents:
  - id: "q1-market-scan"
    prompt: "What are the top 20 tools in our category as of Q1 2025?"
    operations:
      - type: "extract_competitors"
        save_to: "q1_competitors"
```

Then review `q1_competitors.json` and add new brands to your config.

## Best Practices

### 1. Use High Confidence Thresholds

Avoid false positives:

```yaml
params:
  min_confidence: 0.8  # Only very confident extractions
```

### 2. Review Before Adding to Config

Operations discover candidates - manually review before adding to your brand list.

### 3. Separate Discovery Intents

Create dedicated intents for competitor discovery:

```yaml
intents:
  # Regular monitoring
  - id: "best-tools"
    prompt: "What are the best tools?"

  # Discovery (run monthly)
  - id: "market-discovery"
    prompt: "Comprehensive list of all tools in category"
    operations:
      - type: "extract_competitors"
        save_to: "monthly_scan"
```

## Accessing Operation Results

Results are stored in the output directory:

```
output/2025-11-05T14-30-00Z/
├── intent_market-discovery_operation_extract_competitors.json
└── ...
```

Also queryable from SQLite:

```sql
SELECT operation_type, operation_results
FROM intent_operations
WHERE intent_id = 'market-discovery';
```

## Future Operation Types

Planned for future releases:

- `sentiment_analysis`: Analyze tone of brand mentions
- `feature_extraction`: Extract mentioned features/capabilities
- `pricing_detection`: Detect pricing information
- `use_case_mapping`: Map brands to specific use cases

## Limitations

- Operations run synchronously (no parallel execution yet)
- Limited to extraction tasks (no API calls or external actions)
- Results require manual review before acting on them

## Next Steps

- [Learn about intent configuration](intents.md)
- [See complete examples](../../examples/ci-cd-integration.md)
