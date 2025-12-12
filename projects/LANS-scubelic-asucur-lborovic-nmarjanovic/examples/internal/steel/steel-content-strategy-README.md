# Steel Content Strategy Config

**Purpose**: Monitor Steel's positioning in LLM responses and automatically generate actionable content strategy to improve future rankings.

## Overview

This config builds on `steel-dev-2.config.yaml` by adding **global and per-intent operations** that analyze monitoring results and generate specific, actionable content recommendations using gpt-5-nano.

### Key Innovation

Instead of just monitoring brand mentions, this config:
1. **Analyzes WHY** Steel is/isn't mentioned
2. **Extracts** competitor messaging patterns
3. **Identifies** specific content gaps
4. **Generates** blog post outlines, documentation strategies, and code example plans
5. **Prioritizes** action items for content and product teams

## How It Works

### Global Operations (Run for EVERY Intent)

1. **`steel-presence-check`**
   - Checks if Steel is mentioned
   - Assesses positioning strength (Strong/Moderate/Weak/Missing)
   - Identifies why Steel might be missing
   - Extracts sentiment if mentioned

2. **`competitor-messaging-patterns`**
   - Extracts language competitors use
   - Identifies value propositions that resonate
   - Captures technical terms associated with competitors
   - Notes use cases highlighted for each competitor

### Per-Intent Operations (Examples)

Each intent has 2-5 custom operations tailored to that query type:

#### Example: "remote-browser-api" Intent

1. **`content-gap-analysis`** (depends on global operations)
   - Identifies 3-5 specific content pieces Steel should create
   - Explains why each would improve ranking
   - Notes what competitors are doing that Steel should counter

2. **`blog-post-outline`**
   - Generates SEO-optimized outline with H2/H3 structure
   - Includes keywords to target
   - Specifies technical details to emphasize
   - Provides CTAs and internal linking strategy

3. **`technical-talking-points`**
   - Extracts pain points users express
   - Lists features/capabilities users care about
   - Captures user language and keywords
   - Identifies performance/reliability concerns

4. **`action-items`** (depends on all above)
   - 5 prioritized actions with [High/Medium/Low] priority
   - Specific deliverables for each
   - Rationale based on analysis

## Output Structure

After running this config, you'll get:

```
output/
└── 2025-11-08T10-30-00Z/
    ├── run_meta.json                      # Standard run summary
    ├── intent_*_raw_*.json                # Raw LLM responses
    ├── intent_*_parsed_*.json             # Brand mentions extracted
    │
    # NEW: Operation outputs
    ├── operations/
    │   ├── global/
    │   │   ├── steel-presence-check_all-intents.json
    │   │   └── competitor-messaging-patterns_all-intents.json
    │   │
    │   └── by-intent/
    │       ├── remote-browser-api/
    │       │   ├── content-gap-analysis.json
    │       │   ├── blog-post-outline.json
    │       │   ├── technical-talking-points.json
    │       │   └── action-items.json
    │       │
    │       ├── headless-browser-for-scraping/
    │       │   ├── content-gap-analysis.json
    │       │   ├── simplicity-positioning.json
    │       │   ├── code-example-strategy.json
    │       │   └── action-items.json
    │       │
    │       └── ... (for each intent)
    │
    └── content-strategy-summary.html      # Human-readable strategy report
```

## Strategic Intent Design

The 15 intents are grouped into strategic categories:

### 1. Technical Infrastructure (5 intents)
- `remote-browser-api` - Core API value prop
- `headless-browser-for-scraping` - Simplicity angle
- `browser-api-for-playwright-puppeteer` - Integration ease
- `connect-over-cdp` - Long-tail technical SEO
- `secure-scalable-browsing` - Infrastructure-free positioning

**Operations Focus**: Technical content gaps, code examples, documentation strategy

### 2. Computer Use + AI Agents (5 intents)
- `openai-computer-use-to-remote-browser` - Emerging opportunity
- `claude-computer-use-to-remote-browser` - Parallel opportunity
- `llm-tools-in-browser` - Agent capabilities
- `browser-for-ai-agent` - Agent-first positioning
- `multi-agent-browsing` - Multi-agent coordination
- `agent-friendly-browser-api` - API simplicity for LLMs

**Operations Focus**: Emerging trends, integration guides, agent marketplace

### 3. Developer Experience (5 intents)
- `remote-browser-getting-started` - Docs audit
- `remote-browser-pricing` - Pricing transparency
- `language-examples` - Code example strategy
- `build-vs-use-hosted-browser` - Build vs buy messaging
- `alternatives-to-current-browser-service` - Competitive switching

**Operations Focus**: Documentation improvements, pricing strategy, competitive positioning

## Usage

### 1. Run Monitoring + Content Strategy Generation

```bash
# Full run with all operations
llm-answer-watcher run --config examples/steel-dev-content-strategy.config.yaml

# Agent mode for programmatic access
llm-answer-watcher run \
  --config examples/steel-dev-content-strategy.config.yaml \
  --format json \
  --yes
```

### 2. Review Generated Strategy

```bash
# View action items for a specific intent
cat output/2025-11-08T10-30-00Z/operations/by-intent/remote-browser-api/action-items.json

# View all content gaps
find output/2025-11-08T10-30-00Z/operations/by-intent -name "content-gap-analysis.json"

# View global presence check
cat output/2025-11-08T10-30-00Z/operations/global/steel-presence-check_all-intents.json
```

### 3. Parse and Prioritize (Python Example)

```python
import json
from pathlib import Path

# Load all action items
output_dir = Path("output/2025-11-08T10-30-00Z/operations/by-intent")

action_items = []
for intent_dir in output_dir.iterdir():
    if intent_dir.is_dir():
        action_file = intent_dir / "action-items.json"
        if action_file.exists():
            with open(action_file) as f:
                data = json.load(f)
                action_items.append({
                    "intent": intent_dir.name,
                    "actions": data["actions"]
                })

# Extract high-priority items
high_priority = [
    {"intent": item["intent"], "action": action}
    for item in action_items
    for action in item["actions"]
    if action.startswith("[Priority: High]") or action.startswith("[High]")
]

print(f"Found {len(high_priority)} high-priority action items")
for item in high_priority[:10]:  # Top 10
    print(f"\n{item['intent']}:")
    print(f"  {item['action']}")
```

## Cost Estimation

With 4 models × 15 intents × (2 global ops + avg 3 per-intent ops):
- **Monitoring queries**: 60 queries @ ~$0.001 each = **$0.06**
- **Operations**: 15 intents × 5 ops avg × 4 model results = 300 ops @ ~$0.0005 = **$0.15**
- **Total estimated**: **~$0.21 per run**

Using gpt-5-nano keeps operations cheap while maintaining quality.

## Interpreting Results

### When Steel IS Mentioned

Focus on:
- **Rank position**: If not #1, analyze what competitors above Steel emphasize
- **Sentiment analysis**: Understand how Steel is described vs competitors
- **Differentiation gaps**: What unique angles are missing?

Operations will generate:
- Ways to strengthen existing positioning
- Adjacent keywords to target
- Competitive differentiation content

### When Steel is NOT Mentioned

This is the primary use case. Operations will:
1. Identify **why** Steel was excluded (competitor advantages, missing keywords, etc.)
2. Extract **what worked** for competitors who were mentioned
3. Generate **specific content** to close the gap
4. Prioritize **quick wins** vs long-term plays

### Example Workflow

1. **Run monitoring** (weekly or monthly)
2. **Review global operations** to understand overall positioning trends
3. **Prioritize intents** where Steel is missing or ranks poorly
4. **Extract action items** from those high-priority intents
5. **Assign to teams**:
   - Blog posts → Content team
   - Documentation → Docs team
   - Code examples → DevRel team
   - Product features → Engineering
6. **Track improvements** in next run

## Customization

### Adding New Operations

```yaml
intents:
  - id: "your-intent"
    prompt: "Your query"
    operations:
      - id: "your-operation"
        description: "What this operation does"
        prompt: |
          Your analysis prompt here.

          Use variables:
          - {intent:prompt} - The intent prompt
          - {intent:response} - The LLM response
          - {rank:mine} - Steel's rank (if mentioned)
          - {competitors:mentioned} - List of competitors
          - {operation:other-op-id} - Output from other operation
        model: "gpt-5-nano"
        depends_on: ["other-operation-id"]  # Optional
```

### Operation Variable Reference

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `{intent:prompt}` | The intent query | "What are the best..." |
| `{intent:response}` | Full LLM response | "Based on research..." |
| `{rank:mine}` | Steel's rank position | "1", "Not mentioned" |
| `{brand:mine}` | Your brand list | "Steel, Steel.dev, ..." |
| `{competitors:mentioned}` | Competitors found | "Browserbase, Apify" |
| `{operation:id}` | Other operation output | Previous analysis result |

## Advanced: Dependency Chains

Operations can depend on other operations:

```yaml
operations:
  - id: "base-analysis"
    prompt: "Analyze competitors..."
    model: "gpt-5-nano"

  - id: "deep-dive"
    prompt: |
      Using this base analysis:
      {operation:base-analysis}

      Now do deeper analysis...
    depends_on: ["base-analysis"]
    model: "gpt-5-nano"

  - id: "action-items"
    prompt: |
      Synthesize both:
      Base: {operation:base-analysis}
      Deep: {operation:deep-dive}

      Generate actions...
    depends_on: ["base-analysis", "deep-dive"]
    model: "gpt-5-nano"
```

Operations execute in dependency order. The tool builds a DAG and executes efficiently.

## Integration with Product Roadmap

Use operation outputs to inform:

1. **Content Calendar**
   - Blog posts from `blog-post-outline` operations
   - Docs updates from `documentation-strategy` operations
   - Code examples from `code-example-strategy` operations

2. **SEO Strategy**
   - Long-tail keywords from `technical-talking-points`
   - Competitor gap analysis from `content-gap-analysis`
   - High-value queries from `seo-opportunity` operations

3. **Product Positioning**
   - Messaging angles from `*-positioning` operations
   - Differentiation strategy from `steel-differentiation`
   - Feature priorities from `technical-talking-points`

4. **Competitive Intelligence**
   - Competitor strengths from global operations
   - Market trends from computer-use queries
   - Switching drivers from `switching-strategy`

## Maintenance

### Weekly Routine
1. Run monitoring with this config
2. Review action items for new high-priority work
3. Track progress on previous action items
4. Adjust intent list based on market trends

### Monthly Routine
1. Analyze positioning trends (Steel's rank over time per intent)
2. Evaluate content effectiveness (did new content improve rank?)
3. Prune low-value intents, add emerging queries
4. Update competitor list as market evolves

### Quarterly Routine
1. Deep dive on competitive positioning shifts
2. ROI analysis: content investment → ranking improvements
3. Strategy refresh based on accumulated insights
4. Add new operation types based on learnings

## Tips for Maximum Value

1. **Start with worst-performing intents** - Biggest opportunity for improvement
2. **Track action item completion** - Monitoring alone doesn't help; execution does
3. **A/B test content approaches** - Operations give hypotheses; validate them
4. **Share insights cross-functionally** - Content, product, sales all benefit
5. **Iterate operation prompts** - Refine based on output quality
6. **Use web search models for real-time insights** - gpt-5-nano + web_search catches latest trends

## Troubleshooting

### Operations not generating useful output
- Check that intent responses contain enough competitor detail
- Try web search-enabled models for richer context
- Refine operation prompts to be more specific
- Use dependency chains to build context progressively

### Too expensive
- Reduce number of operations per intent
- Use gpt-5-nano exclusively (currently used throughout)
- Run on subset of high-priority intents first
- Disable global operations if not needed

### Output too generic
- Add more specific variables to operation prompts
- Use `depends_on` to chain operations for depth
- Include competitor analysis in prompts
- Reference Steel's actual features/docs in prompts

## Next Steps

1. **Run first monitoring cycle** with this config
2. **Review all operation outputs** to understand the pattern
3. **Extract 5-10 highest-priority action items**
4. **Assign to appropriate teams** with deadlines
5. **Re-run monitoring** in 2-4 weeks to measure impact
6. **Iterate on operations** based on what worked

---

**Questions?** This config is designed to turn passive monitoring into active content strategy. The operations generate the "so what?" from raw monitoring data.
