# Running Evaluations

How to run the evaluation suite and interpret results.

## Basic Usage

```bash
llm-answer-watcher eval --fixtures evals/testcases/fixtures.yaml
```

## Command Options

```bash
llm-answer-watcher eval   --fixtures fixtures.yaml   --db eval_results.db   --format json
```

## Example Output

```
✅ Evaluation completed
├── Test cases: 15
├── Passed: 14
├── Failed: 1
└── Pass rate: 93.3%

Metrics:
├── Mention Precision: 95.2%
├── Mention Recall: 91.8%
├── Rank Accuracy: 88.5%
└── F1 Score: 93.5%
```

See [Metrics](metrics.md) for metric definitions.
