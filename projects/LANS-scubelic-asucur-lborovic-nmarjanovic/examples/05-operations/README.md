# Operations Examples

Demonstrate automated LLM analysis on query results.

## What Are Operations?

Operations are additional LLM calls that analyze your query results to generate insights:

- Quality scoring
- Content gap identification
- Competitive analysis
- Action item generation

## Files

- `basic-operations.config.yaml` - Simple quality scoring
- `chained-dependencies.config.yaml` - Multi-step pipeline
- `content-strategy.config.yaml` - Content recommendations
- `competitive-intel.config.yaml` - Competitor tracking

## Cost Impact

Operations add ~$0.005-0.02 per query depending on:
- Number of operations
- Operation complexity
- Model used (gpt-4o-mini vs gpt-4o)

## Quick Start

See the existing example:
- `examples/watcher.config.with-operations.yaml` - Full operations demo

*Additional simplified examples coming soon*
