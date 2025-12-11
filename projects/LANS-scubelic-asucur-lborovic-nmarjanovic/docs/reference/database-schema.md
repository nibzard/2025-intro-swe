# Database Schema

SQLite database schema reference.

## Tables

### `schema_version`

```sql
CREATE TABLE schema_version (
    version INTEGER PRIMARY KEY
);
```

### `runs`

```sql
CREATE TABLE runs (
    run_id TEXT PRIMARY KEY,
    timestamp_utc TEXT NOT NULL,
    config_path TEXT,
    total_cost_usd REAL,
    queries_completed INTEGER,
    queries_failed INTEGER
);
```

### `answers_raw`

```sql
CREATE TABLE answers_raw (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    intent_id TEXT NOT NULL,
    model_provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    tokens_used INTEGER,
    estimated_cost_usd REAL,
    timestamp_utc TEXT NOT NULL,
    UNIQUE(run_id, intent_id, model_provider, model_name)
);
```

### `mentions`

```sql
CREATE TABLE mentions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    intent_id TEXT NOT NULL,
    model_provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    brand TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    is_mine BOOLEAN NOT NULL,
    rank_position INTEGER,
    context_snippet TEXT,
    sentiment TEXT,              -- NEW: positive/neutral/negative
    mention_context TEXT,        -- NEW: primary_recommendation, alternative_listing, etc.
    timestamp_utc TEXT NOT NULL,
    UNIQUE(run_id, intent_id, model_provider, model_name, normalized_name)
);
```

**New Columns (v0.1.0+)**:
- `sentiment`: Emotional tone - `positive`, `neutral`, `negative`, or `NULL`
- `mention_context`: How brand was mentioned - `primary_recommendation`, `alternative_listing`, `competitor_negative`, `competitor_neutral`, `passing_reference`, or `NULL`

### `intent_classifications`

```sql
CREATE TABLE intent_classifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    intent_id TEXT NOT NULL,
    query_text TEXT NOT NULL,
    query_hash TEXT NOT NULL,        -- SHA256 hash for caching
    intent_type TEXT NOT NULL,       -- transactional, informational, navigational, commercial_investigation
    buyer_stage TEXT NOT NULL,       -- awareness, consideration, decision
    urgency_signal TEXT NOT NULL,    -- high, medium, low
    classification_confidence REAL NOT NULL,  -- 0.0-1.0
    reasoning TEXT,                  -- Explanation of classification
    timestamp_utc TEXT NOT NULL,
    UNIQUE(run_id, intent_id)
);
```

**Purpose**: Stores query intent classifications for prioritizing high-value mentions.

**Query Hash**: Normalized SHA256 hash enables caching - same query text always produces same hash, avoiding redundant LLM calls.

## Indexes

```sql
-- Original indexes
CREATE INDEX idx_mentions_timestamp ON mentions(timestamp_utc);
CREATE INDEX idx_mentions_brand ON mentions(normalized_name);
CREATE INDEX idx_mentions_intent ON mentions(intent_id);

-- Sentiment/Intent indexes (NEW in v0.1.0+)
CREATE INDEX idx_mentions_sentiment ON mentions(sentiment);
CREATE INDEX idx_mentions_context ON mentions(mention_context);
CREATE INDEX idx_intent_type ON intent_classifications(intent_type);
CREATE INDEX idx_buyer_stage ON intent_classifications(buyer_stage);
CREATE INDEX idx_urgency_signal ON intent_classifications(urgency_signal);
```

## Schema Versioning

The database schema uses versioning for migrations:

```sql
SELECT version FROM schema_version;
-- Returns: 1 (current version)
```

Future schema changes will increment this version and provide migration scripts.

## Example Queries

### Sentiment Analysis

```sql
-- Brand mentions by sentiment
SELECT sentiment, COUNT(*) as count
FROM mentions
WHERE normalized_name = 'yourbrand'
GROUP BY sentiment;
```

### High-Value Intent Filtering

```sql
-- High-intent brand mentions
SELECT m.brand, ic.intent_type, ic.buyer_stage, ic.urgency_signal
FROM mentions m
JOIN intent_classifications ic ON m.intent_id = ic.intent_id AND m.run_id = ic.run_id
WHERE ic.intent_type = 'transactional'
  AND ic.buyer_stage = 'decision'
  AND ic.urgency_signal = 'high'
  AND m.sentiment = 'positive';
```

See [SQLite Database](../data-analytics/sqlite-database.md) for more queries.
