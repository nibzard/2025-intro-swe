# Trends Analysis

Analyze brand visibility trends over time.

## Time-Series Analysis

```sql
-- Daily mention count
SELECT
  DATE(timestamp_utc) as date,
  COUNT(*) as mentions,
  AVG(rank_position) as avg_rank
FROM mentions
WHERE normalized_name = 'yourbrand'
GROUP BY DATE(timestamp_utc)
ORDER BY date DESC;
```

## Comparative Trends

```sql
-- Your brand vs top competitor
SELECT
  DATE(m.timestamp_utc) as date,
  m.brand,
  COUNT(*) as mentions
FROM mentions m
WHERE m.normalized_name IN ('yourbrand', 'competitor')
GROUP BY DATE(m.timestamp_utc), m.brand
ORDER BY date DESC, mentions DESC;
```

## Export to CSV

```bash
sqlite3 -header -csv output/watcher.db   "SELECT * FROM mentions WHERE normalized_name = 'yourbrand'"   > brand_data.csv
```

See [Query Examples](query-examples.md) for more queries.
