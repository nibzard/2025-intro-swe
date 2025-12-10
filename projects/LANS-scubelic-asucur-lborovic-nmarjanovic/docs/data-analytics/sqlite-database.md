# SQLite Database

LLM Answer Watcher stores all monitoring data in a local SQLite database for historical tracking and trend analysis.

## Database Location

Default path: `./output/watcher.db`

Configure in `watcher.config.yaml`:

```yaml
run_settings:
  sqlite_db_path: "./output/watcher.db"
```

## Schema Overview

The database has 4 main tables plus schema versioning:

```
schema_version  → Track database migrations
runs            → One row per CLI execution
answers_raw     → Full LLM responses with metadata
mentions        → Exploded brand mentions for analysis
operations      → Post-intent operation results (optional)
```

## Schema Details

### Table: runs

One row per `llm-answer-watcher run` execution.

**Columns:**

```sql
CREATE TABLE runs (
    run_id TEXT PRIMARY KEY,              -- YYYY-MM-DDTHH-MM-SSZ
    timestamp_utc TEXT NOT NULL,          -- ISO 8601 with Z suffix
    config_file TEXT,                     -- Path to config file used
    total_cost_usd REAL NOT NULL,         -- Sum of all query costs
    queries_completed INTEGER NOT NULL,   -- Successful queries
    queries_failed INTEGER NOT NULL,      -- Failed queries
    status TEXT NOT NULL,                 -- "success", "partial", "failed"
    output_dir TEXT NOT NULL             -- Directory with run artifacts
);
```

**Example Query:**

```sql
-- View recent runs
SELECT run_id, timestamp_utc, status, total_cost_usd, queries_completed
FROM runs
ORDER BY timestamp_utc DESC
LIMIT 10;
```

### Table: answers_raw

One row per intent × model combination.

**Columns:**

```sql
CREATE TABLE answers_raw (
    run_id TEXT NOT NULL,
    intent_id TEXT NOT NULL,
    model_provider TEXT NOT NULL,         -- "openai", "anthropic", etc.
    model_name TEXT NOT NULL,             -- "gpt-4o-mini", etc.
    timestamp_utc TEXT NOT NULL,
    answer_text TEXT NOT NULL,            -- Full LLM response
    tokens_used INTEGER,                  -- Total tokens (input + output)
    estimated_cost_usd REAL,              -- Query cost
    extraction_method TEXT,               -- "regex" or "function_calling"
    web_search_count INTEGER DEFAULT 0,   -- Number of web searches
    error_message TEXT,                   -- NULL if successful

    PRIMARY KEY (run_id, intent_id, model_provider, model_name),
    FOREIGN KEY (run_id) REFERENCES runs(run_id)
);
```

**Example Query:**

```sql
-- Cost by provider
SELECT
    model_provider,
    COUNT(*) as queries,
    SUM(estimated_cost_usd) as total_cost,
    AVG(estimated_cost_usd) as avg_cost_per_query
FROM answers_raw
WHERE timestamp_utc >= datetime('now', '-30 days')
GROUP BY model_provider
ORDER BY total_cost DESC;
```

### Table: mentions

One row per brand mention. Denormalized for fast queries.

**Columns:**

```sql
CREATE TABLE mentions (
    run_id TEXT NOT NULL,
    intent_id TEXT NOT NULL,
    model_provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    timestamp_utc TEXT NOT NULL,
    brand TEXT NOT NULL,                  -- Original brand name
    normalized_name TEXT NOT NULL,        -- Lowercase, hyphenated
    is_mine INTEGER NOT NULL,             -- 1 = your brand, 0 = competitor
    rank_position INTEGER,                -- 1, 2, 3... or NULL
    detection_method TEXT NOT NULL,       -- "regex" or "function_calling"
    confidence REAL DEFAULT 1.0,          -- 0.0-1.0 confidence score

    PRIMARY KEY (run_id, intent_id, model_provider, model_name, normalized_name),
    FOREIGN KEY (run_id) REFERENCES runs(run_id)
);

CREATE INDEX idx_mentions_timestamp ON mentions(timestamp_utc);
CREATE INDEX idx_mentions_brand ON mentions(brand);
CREATE INDEX idx_mentions_normalized ON mentions(normalized_name);
CREATE INDEX idx_mentions_rank ON mentions(rank_position);
CREATE INDEX idx_mentions_is_mine ON mentions(is_mine);
```

**Example Query:**

```sql
-- Brand mentions over time
SELECT
    DATE(timestamp_utc) as date,
    brand,
    COUNT(*) as mentions,
    AVG(rank_position) as avg_rank
FROM mentions
WHERE normalized_name = 'warmly'
  AND timestamp_utc >= datetime('now', '-30 days')
GROUP BY DATE(timestamp_utc), brand
ORDER BY date DESC;
```

### Table: schema_version

Tracks database migrations.

**Columns:**

```sql
CREATE TABLE schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
);
```

**Current version:** 3

## Common Queries

### Basic Analytics

**Your brand visibility:**

```sql
-- How often do we appear?
SELECT
    COUNT(DISTINCT run_id) as runs_appeared,
    COUNT(*) as total_mentions,
    AVG(rank_position) as average_rank
FROM mentions
WHERE is_mine = 1
  AND timestamp_utc >= datetime('now', '-30 days');
```

**Competitor comparison:**

```sql
SELECT
    brand,
    COUNT(*) as mentions,
    COUNT(DISTINCT intent_id) as intents_appeared,
    AVG(rank_position) as avg_rank,
    MIN(rank_position) as best_rank,
    COUNT(CASE WHEN rank_position = 1 THEN 1 END) as first_place_count
FROM mentions
WHERE rank_position IS NOT NULL
  AND timestamp_utc >= datetime('now', '-30 days')
GROUP BY brand
ORDER BY mentions DESC;
```

### Trend Analysis

**Daily brand mentions:**

```sql
SELECT
    DATE(timestamp_utc) as date,
    COUNT(CASE WHEN is_mine = 1 THEN 1 END) as my_mentions,
    COUNT(CASE WHEN is_mine = 0 THEN 1 END) as competitor_mentions,
    COUNT(*) as total_mentions
FROM mentions
WHERE timestamp_utc >= datetime('now', '-30 days')
GROUP BY DATE(timestamp_utc)
ORDER BY date DESC;
```

**Ranking trends:**

```sql
SELECT
    DATE(timestamp_utc) as date,
    AVG(CASE WHEN is_mine = 1 THEN rank_position END) as my_avg_rank,
    AVG(CASE WHEN is_mine = 0 THEN rank_position END) as competitor_avg_rank
FROM mentions
WHERE rank_position IS NOT NULL
  AND timestamp_utc >= datetime('now', '-30 days')
GROUP BY DATE(timestamp_utc)
ORDER BY date DESC;
```

### Intent Analysis

**Which intents work best for your brand?**

```sql
SELECT
    intent_id,
    COUNT(*) as total_mentions,
    COUNT(DISTINCT model_provider) as providers,
    AVG(rank_position) as avg_rank
FROM mentions
WHERE is_mine = 1
  AND timestamp_utc >= datetime('now', '-30 days')
GROUP BY intent_id
ORDER BY total_mentions DESC;
```

**Intents where you're NOT mentioned:**

```sql
-- Get all intent IDs from recent runs
WITH recent_intents AS (
    SELECT DISTINCT intent_id
    FROM answers_raw
    WHERE timestamp_utc >= datetime('now', '-7 days')
),
-- Get intents where you appeared
appeared_intents AS (
    SELECT DISTINCT intent_id
    FROM mentions
    WHERE is_mine = 1
      AND timestamp_utc >= datetime('now', '-7 days')
)
-- Find the difference
SELECT ri.intent_id
FROM recent_intents ri
LEFT JOIN appeared_intents ai ON ri.intent_id = ai.intent_id
WHERE ai.intent_id IS NULL;
```

### Cost Analysis

**Total spending:**

```sql
SELECT
    SUM(total_cost_usd) as total_spent,
    COUNT(*) as total_runs,
    AVG(total_cost_usd) as avg_cost_per_run
FROM runs
WHERE timestamp_utc >= datetime('now', '-30 days');
```

**Cost by provider:**

```sql
SELECT
    model_provider,
    model_name,
    COUNT(*) as queries,
    SUM(estimated_cost_usd) as total_cost,
    AVG(estimated_cost_usd) as avg_cost
FROM answers_raw
WHERE timestamp_utc >= datetime('now', '-30 days')
GROUP BY model_provider, model_name
ORDER BY total_cost DESC;
```

**Cost per brand mention:**

```sql
SELECT
    r.run_id,
    r.total_cost_usd,
    COUNT(m.brand) as mentions,
    r.total_cost_usd / COUNT(m.brand) as cost_per_mention
FROM runs r
JOIN mentions m ON r.run_id = m.run_id
WHERE r.timestamp_utc >= datetime('now', '-30 days')
  AND m.is_mine = 1
GROUP BY r.run_id, r.total_cost_usd
ORDER BY cost_per_mention ASC;
```

### Provider Comparison

**Which provider mentions you more?**

```sql
SELECT
    model_provider,
    COUNT(CASE WHEN is_mine = 1 THEN 1 END) as my_mentions,
    COUNT(*) as total_mentions,
    CAST(COUNT(CASE WHEN is_mine = 1 THEN 1 END) AS REAL) / COUNT(*) * 100 as my_mention_rate
FROM mentions
WHERE timestamp_utc >= datetime('now', '-30 days')
GROUP BY model_provider
ORDER BY my_mention_rate DESC;
```

**Average ranking by provider:**

```sql
SELECT
    model_provider,
    model_name,
    COUNT(*) as mentions,
    AVG(rank_position) as avg_rank
FROM mentions
WHERE is_mine = 1
  AND rank_position IS NOT NULL
  AND timestamp_utc >= datetime('now', '-30 days')
GROUP BY model_provider, model_name
ORDER BY avg_rank ASC;
```

## Exporting Data

### CSV Export

```bash
# Export mentions to CSV
sqlite3 -header -csv output/watcher.db \
  "SELECT * FROM mentions WHERE timestamp_utc >= datetime('now', '-30 days')" \
  > mentions_30days.csv

# Export runs summary
sqlite3 -header -csv output/watcher.db \
  "SELECT * FROM runs ORDER BY timestamp_utc DESC" \
  > runs_summary.csv
```

### JSON Export

```bash
# Export as JSON Lines
sqlite3 output/watcher.db <<SQL | jq -c '.'
SELECT json_object(
  'brand', brand,
  'timestamp', timestamp_utc,
  'rank', rank_position,
  'is_mine', is_mine
) as json_data
FROM mentions
WHERE timestamp_utc >= datetime('now', '-7 days');
SQL
```

### Excel/Google Sheets

1. Export to CSV:

```bash
sqlite3 -header -csv output/watcher.db \
  "SELECT * FROM mentions" > mentions.csv
```

2. Import CSV into Excel or Google Sheets

## Database Maintenance

### Vacuum Database

Reclaim space after deletions:

```bash
sqlite3 output/watcher.db "VACUUM;"
```

### Delete Old Data

```sql
-- Delete runs older than 90 days
DELETE FROM runs
WHERE timestamp_utc < datetime('now', '-90 days');

-- Vacuum to reclaim space
VACUUM;
```

### Check Database Size

```bash
ls -lh output/watcher.db
# Example: -rw-r--r-- 1 user user 2.5M Nov 5 14:30 watcher.db
```

### Backup Database

```bash
# Simple copy
cp output/watcher.db output/watcher.backup.db

# Or use SQLite backup command
sqlite3 output/watcher.db ".backup output/watcher.backup.db"

# Compress backup
gzip output/watcher.backup.db
```

## Schema Migrations

### Check Schema Version

```sql
SELECT * FROM schema_version ORDER BY version DESC;
```

**Output:**

```
version | applied_at
--------|---------------------
3       | 2025-11-05T14:30:00Z
2       | 2025-10-25T10:15:00Z
1       | 2025-10-20T09:00:00Z
```

### Migration Process

Migrations run automatically on startup. No manual intervention needed.

**What happens:**

1. Check current schema version
2. Compare to required version
3. Apply migrations sequentially
4. Update schema_version table

### Manual Migration (Advanced)

If needed, manually upgrade:

```python
from llm_answer_watcher.storage.db import init_db_if_needed

init_db_if_needed("./output/watcher.db")
```

## Connecting with BI Tools

### Metabase

1. Add SQLite database
2. Point to `./output/watcher.db`
3. Create dashboards

### Tableau

1. Use SQLite connector
2. Connect to `watcher.db`
3. Create visualizations

### Python/Pandas

```python
import sqlite3
import pandas as pd

# Connect to database
conn = sqlite3.connect("output/watcher.db")

# Load mentions into DataFrame
df = pd.read_sql_query(
    "SELECT * FROM mentions WHERE timestamp_utc >= datetime('now', '-30 days')",
    conn
)

# Analyze
print(df.groupby('brand')['rank_position'].mean())

# Close connection
conn.close()
```

### R

```r
library(DBI)
library(RSQLite)

# Connect
conn <- dbConnect(RSQLite::SQLite(), "output/watcher.db")

# Query
mentions <- dbGetQuery(conn,
  "SELECT * FROM mentions WHERE timestamp_utc >= datetime('now', '-30 days')"
)

# Analyze
aggregate(rank_position ~ brand, data=mentions, FUN=mean)

# Disconnect
dbDisconnect(conn)
```

## Performance Tips

### Indexes

Indexes already exist on:

- `timestamp_utc`
- `brand`
- `normalized_name`
- `rank_position`
- `is_mine`

### Query Optimization

**Use indexed columns in WHERE:**

```sql
-- ✅ Fast - uses index
WHERE timestamp_utc >= datetime('now', '-30 days')

-- ❌ Slow - no index
WHERE DATE(timestamp_utc) = '2025-11-05'
```

**Limit result sets:**

```sql
-- ✅ Good - only get what you need
SELECT brand, rank_position FROM mentions
WHERE is_mine = 1
LIMIT 100;

-- ❌ Bad - retrieves all columns
SELECT * FROM mentions;
```

### Analyze Query Plans

```sql
EXPLAIN QUERY PLAN
SELECT brand, COUNT(*) FROM mentions
WHERE timestamp_utc >= datetime('now', '-30 days')
GROUP BY brand;
```

## Troubleshooting

### Database Locked

**Problem:** `database is locked`

**Solution:**

```bash
# Check for locks
lsof output/watcher.db

# Kill process if safe
kill -9 <PID>

# Or wait and retry
```

### Corrupted Database

**Problem:** Database errors on queries

**Solution:**

```bash
# Check integrity
sqlite3 output/watcher.db "PRAGMA integrity_check;"

# If corrupted, restore from backup
cp output/watcher.backup.db output/watcher.db
```

### Schema Version Mismatch

**Problem:** "Schema version X is newer than expected Y"

**Solution:** Update LLM Answer Watcher to latest version:

```bash
pip install --upgrade llm-answer-watcher
```

## Next Steps

<div class="grid cards" markdown>

-   :material-chart-box: **Query Examples**

    ---

    More SQL query examples

    [Query Examples →](query-examples.md)

-   :material-chart-line: **Trends Analysis**

    ---

    Track changes over time

    [Trends Analysis →](trends-analysis.md)

-   :material-file-export: **Output Structure**

    ---

    Understand JSON output files

    [Output Structure →](output-structure.md)

-   :material-table: **Database Schema**

    ---

    Complete schema reference

    [Schema Reference →](../reference/database-schema.md)

</div>
