# Evaluation Framework

Quality control and accuracy testing for brand extraction.

## Purpose

The evaluation framework validates:

- Mention detection accuracy
- Rank extraction correctness
- False positive/negative rates

## Running Evaluations

```bash
llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml
```

## Metrics Tracked

- **Mention Precision**: Correct mentions / total found
- **Mention Recall**: Correct mentions / expected mentions
- **Rank Accuracy**: Correctly ranked brands
- **F1 Score**: Harmonic mean of precision/recall

See [Running Evals](running-evals.md) for detailed usage.
