# Output Structure

Understanding the file and directory structure of monitoring runs.

## Directory Layout

```
output/
├── watcher.db                          # SQLite database
└── YYYY-MM-DDTHH-MM-SSZ/              # Run directory
    ├── run_meta.json                   # Run summary
    ├── report.html                     # HTML report
    ├── intent_*_raw_*.json            # Raw LLM responses
    ├── intent_*_parsed_*.json         # Extracted data
    └── intent_*_error_*.json          # Errors (if any)
```

## File Descriptions

### `run_meta.json`
Summary of the entire run with costs and stats.

### `report.html`
Interactive HTML report with visualizations.

### `intent_*_raw_*.json`
Raw LLM response with metadata.

### `intent_*_parsed_*.json`
Extracted brand mentions and ranks.

### `watcher.db`
SQLite database with all historical data.

See [SQLite Database](sqlite-database.md) for database schema.
