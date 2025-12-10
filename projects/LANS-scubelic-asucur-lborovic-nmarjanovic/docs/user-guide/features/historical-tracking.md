# Historical Tracking

LLM Answer Watcher stores all query results in a local SQLite database for historical trend analysis.

## Features

- **Long-term Storage**: All responses saved indefinitely
- **Trend Analysis**: Track brand visibility over time
- **Comparative Analysis**: Compare performance across dates
- **Data Export**: Query via SQL or export to CSV

## Database Location

```
./output/watcher.db
```

## Querying Historical Data

```sql
-- Brand mentions over time
SELECT DATE(timestamp_utc) as date,
       COUNT(*) as mentions
FROM mentions
WHERE normalized_name = 'yourbrand'
GROUP BY DATE(timestamp_utc)
ORDER BY date DESC;
```

See [SQLite Database](../../data-analytics/sqlite-database.md) for more queries.
