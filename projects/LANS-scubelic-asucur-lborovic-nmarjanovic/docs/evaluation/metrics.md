# Evaluation Metrics

Understanding evaluation metrics and thresholds.

## Core Metrics

### Mention Precision
Ratio of correct mentions to total mentions found.

**Threshold**: ≥ 90%

### Mention Recall
Ratio of correct mentions to expected mentions.

**Threshold**: ≥ 80%

### Mention F1
Harmonic mean of precision and recall.

**Threshold**: ≥ 85%

### Rank Accuracy
Percentage of correctly ranked brands.

**Threshold**: ≥ 85%

## Interpreting Results

- **High precision, low recall**: Missing mentions
- **Low precision, high recall**: False positives
- **Low both**: Extraction needs improvement

See [Test Cases](test-cases.md) for creating fixtures.
