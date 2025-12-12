# SQL Query Examples

Useful SQL queries for analyzing monitoring data.

## Brand Performance

```sql
-- Your brand's mention rate
SELECT
  COUNT(DISTINCT run_id) as total_runs,
  COUNT(*) as total_mentions,
  CAST(COUNT(*) AS FLOAT) / COUNT(DISTINCT run_id) as mentions_per_run
FROM mentions
WHERE normalized_name = 'yourbrand';
```

## Competitor Analysis

```sql
-- Top mentioned competitors
SELECT
  brand,
  COUNT(*) as mentions,
  AVG(rank_position) as avg_rank
FROM mentions
WHERE normalized_name != 'yourbrand'
GROUP BY brand
ORDER BY mentions DESC
LIMIT 10;
```

## Trends Over Time

```sql
-- Weekly mention trends
SELECT
  strftime('%Y-W%W', timestamp_utc) as week,
  COUNT(*) as mentions
FROM mentions
WHERE normalized_name = 'yourbrand'
GROUP BY week
ORDER BY week DESC;
```

See [SQLite Database](sqlite-database.md) for schema details.
