# HTML Reports

Auto-generated interactive HTML reports for each monitoring run.

## Features

- Brand mention visualization
- Rank distribution charts
- Cost breakdowns
- Raw response inspection
- Historical trends (if multiple runs)

## Report Location

```
output/YYYY-MM-DDTHH-MM-SSZ/report.html
```

## Opening Reports

```bash
# macOS
open output/2025-11-05T14-30-00Z/report.html

# Linux
xdg-open output/2025-11-05T14-30-00Z/report.html
```

## Report Sections

1. **Summary**: Costs, queries, brands found
2. **Brand Mentions**: Detailed mention tables
3. **Rank Distribution**: Visual charts
4. **Historical Trends**: Performance over time
5. **Raw Responses**: Full LLM outputs
