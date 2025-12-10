# Performance

Optimizing LLM Answer Watcher for speed and efficiency.

## Query Performance

### Parallel Queries (Future)

Currently synchronous. Async support planned:

```python
# Future: parallel execution
await asyncio.gather(*[
    query_model(intent, model)
    for intent in intents
    for model in models
])
```

### Current: Sequential

```python
# Current: one at a time
for intent in intents:
    for model in models:
        query_model(intent, model)
```

## Cost Optimization

### Use Cheaper Models

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"  # $0.15/1M vs $2.50/1M
```

### Regex vs LLM Extraction

```yaml
# Fast and cheap (recommended)
use_llm_rank_extraction: false

# Accurate but costly
use_llm_rank_extraction: true
```

## Database Performance

### Indexes

SQLite indexes on:
- `timestamp_utc`
- `intent_id`
- `brand`
- `rank_position`

### Vacuum

Periodically compact database:

```bash
sqlite3 output/watcher.db "VACUUM;"
```

## Caching

### Pricing Cache

LLM prices cached for 24 hours to reduce API calls.

### Future Caching

Planned:
- Response caching (identical queries)
- Extracted data caching

See [Architecture](architecture.md) for design details.
