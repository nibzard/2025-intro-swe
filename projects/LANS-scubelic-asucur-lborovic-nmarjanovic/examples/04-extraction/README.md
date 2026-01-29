# Extraction Examples

Demonstrate different brand mention extraction methods.

## Methods

1. **Regex** - Fast, pattern-based extraction (~85% accuracy)
2. **Function Calling** - LLM-based extraction (~95% accuracy)
3. **Hybrid** - Best of both (function calling with regex fallback)

## Files

- `regex-only.config.yaml` - Pure regex extraction
- `function-calling.config.yaml` - LLM-based extraction
- `hybrid-fallback.config.yaml` - Combined approach (recommended)
- `intent-classification.config.yaml` - Buyer stage detection
- `sentiment-analysis.config.yaml` - Brand sentiment tracking

## Cost Comparison

| Method | Speed | Accuracy | Extra Cost/Query |
|--------|-------|----------|------------------|
| Regex | Fast | ~85% | $0 |
| Function Calling | Slow | ~95% | +$0.001 |
| Hybrid | Medium | ~95% | +$0.0005 (avg) |

## When to Use Each Method

**Regex** - High-volume testing, cost-sensitive monitoring
**Function Calling** - Production accuracy, sentiment analysis
**Hybrid** - Best for most use cases (production recommended)

*Full examples coming soon - see examples/watcher.config.yaml for function calling demo*
