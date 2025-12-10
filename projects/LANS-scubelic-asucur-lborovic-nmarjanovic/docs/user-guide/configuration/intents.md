# Intent Configuration

Intents are the questions you ask LLMs to test brand visibility. Well-designed intents produce actionable insights about how LLMs recommend your brand versus competitors.

## What is an Intent?

An **intent** represents a buyer-journey question that prospects might ask an LLM when researching solutions.

**Examples:**

- "What are the best CRM tools for startups?"
- "Compare HubSpot vs Salesforce for small teams"
- "How do I improve email deliverability?"

## Basic Intent Configuration

### Minimal Intent

Simplest intent with required fields:

```yaml
intents:
  - id: "best-tools"
    prompt: "What are the best tools for my category?"
```

**Required fields:**

- `id`: Unique identifier (alphanumeric, hyphens, underscores)
- `prompt`: Natural language question

### Multiple Intents

Test different buyer scenarios:

```yaml
intents:
  - id: "best-tools-general"
    prompt: "What are the best email warmup tools?"

  - id: "best-tools-startups"
    prompt: "What are the best email warmup tools for startups?"

  - id: "comparison-with-competitor"
    prompt: "Compare Instantly vs Warmly for email warmup"
```

!!! tip "How Many Intents?"
    **Recommended**: 3-10 intents

    - **Too few**: Limited coverage of buyer journey
    - **Too many**: High costs, slow execution

    Focus on intents that represent actual buyer questions.

## Intent Design Principles

### 1. Natural Language

Write prompts as real users would ask:

```yaml
# ✅ Good: Natural question
intents:
  - id: "best-crm-startups"
    prompt: "What's the best CRM for early-stage startups?"

# ❌ Bad: Unnatural phrasing
intents:
  - id: "crm-query"
    prompt: "List CRM software products ranked by quality for startup segment"
```

### 2. Buyer-Focused

Imply purchase intent:

```yaml
# ✅ Good: Clear purchase intent
intents:
  - id: "best-email-tools"
    prompt: "What are the best email warmup tools to buy?"

# ❌ Bad: Informational query
intents:
  - id: "email-info"
    prompt: "What is email warming?"
```

### 3. Ranking-Friendly

Ask for ranked or ordered lists:

```yaml
# ✅ Good: Implies ranking
intents:
  - id: "top-tools"
    prompt: "What are the top 5 email warmup tools?"

# ❌ Bad: No ranking signal
intents:
  - id: "tools-info"
    prompt: "Tell me about email warmup tools"
```

### 4. Specific Use Cases

Target specific scenarios:

```yaml
# ✅ Good: Specific use case
intents:
  - id: "best-for-cold-email"
    prompt: "What are the best email warmup tools for cold outreach campaigns?"

# ❌ Bad: Too generic
intents:
  - id: "email-tools"
    prompt: "What are email tools?"
```

## Intent Patterns

### Category Leadership

Test if your brand is considered a category leader:

```yaml
intents:
  - id: "best-in-category"
    prompt: "What are the best [category] tools?"

  - id: "top-choices"
    prompt: "What are the top [category] platforms?"

  - id: "leading-solutions"
    prompt: "What are the leading [category] solutions?"
```

### Segment-Specific

Target different customer segments:

```yaml
intents:
  # Startup segment
  - id: "best-for-startups"
    prompt: "What are the best CRM tools for early-stage startups?"

  # SMB segment
  - id: "best-for-smb"
    prompt: "What are the best CRM tools for small businesses?"

  # Enterprise segment
  - id: "best-for-enterprise"
    prompt: "What are the best CRM tools for large enterprises?"
```

### Use-Case Specific

Target specific jobs-to-be-done:

```yaml
intents:
  - id: "improve-deliverability"
    prompt: "What tools can help me improve email deliverability?"

  - id: "warm-cold-emails"
    prompt: "How can I warm up my email domain for cold outreach?"

  - id: "avoid-spam"
    prompt: "What tools help me avoid the spam folder?"
```

### Competitive Comparison

Test head-to-head comparisons:

```yaml
intents:
  - id: "vs-main-competitor"
    prompt: "Compare [YourBrand] vs [MainCompetitor] for [use case]"

  - id: "alternatives-to-competitor"
    prompt: "What are the best alternatives to [Competitor]?"

  - id: "hubspot-replacement"
    prompt: "What's the best replacement for HubSpot for small teams?"
```

### Problem-Solution

Frame around customer pain points:

```yaml
intents:
  - id: "solve-deliverability"
    prompt: "My emails are going to spam. What tools can help?"

  - id: "improve-open-rates"
    prompt: "How can I improve my email open rates?"

  - id: "scale-outreach"
    prompt: "What tools help me scale cold email outreach?"
```

### Buying Journey Stages

Target different stages:

```yaml
intents:
  # Awareness: "What is...?"
  - id: "awareness"
    prompt: "What is email warmup and why do I need it?"

  # Consideration: "What are the options?"
  - id: "consideration"
    prompt: "What are the best email warmup tools?"

  # Decision: "Which should I choose?"
  - id: "decision"
    prompt: "Should I use Warmly or Instantly for email warmup?"
```

## Advanced Intent Configuration

### Intent with Operations

Run custom operations after each query:

```yaml
intents:
  - id: "best-email-tools"
    prompt: "What are the best email warmup tools?"

    operations:
      - id: "content-gaps"
        description: "Identify content opportunities"
        prompt: |
          Analyze this LLM response and identify content gaps that could improve our ranking.

          My brand: {brand:mine}
          Current rank: {rank:mine}
          Response: {intent:response}

          Provide 3 specific content recommendations.
        model: "gpt-4o-mini"

      - id: "competitor-analysis"
        description: "Extract competitor strengths"
        prompt: |
          What strengths are mentioned for each competitor?

          Competitors: {competitors:mentioned}
          Response: {intent:response}
        model: "gpt-4o-mini"
```

See [Operations Configuration](operations.md) for details.

### Intent with Dependencies

Chain operations with dependencies:

```yaml
intents:
  - id: "best-crm-tools"
    prompt: "What are the best CRM tools for startups?"

    operations:
      - id: "extract-features"
        description: "Extract features mentioned"
        prompt: "Extract features mentioned for each tool: {intent:response}"
        model: "gpt-4o-mini"

      - id: "gap-analysis"
        description: "Identify feature gaps"
        prompt: |
          Based on these features: {operation:extract-features}

          What features are missing from {brand:mine} compared to competitors?
        depends_on: ["extract-features"]
        model: "gpt-4o-mini"
```

### Intent with Custom Metadata

Add metadata for analysis (future feature):

```yaml
intents:
  - id: "best-tools"
    prompt: "What are the best email warmup tools?"
    metadata:
      stage: "consideration"
      priority: "high"
      segment: "smb"
```

!!! info "Metadata Not Yet Implemented"
    Custom metadata is planned for a future release.

## Intent ID Naming Conventions

Intent IDs must be:

- Unique across the configuration
- Alphanumeric with hyphens and underscores
- Descriptive and readable

**Good intent IDs:**

```yaml
intents:
  - id: "best-email-warmup-tools"
  - id: "hubspot-alternatives-smb"
  - id: "improve-deliverability-2025"
  - id: "warmly-vs-instantly"
```

**Bad intent IDs:**

```yaml
# ❌ Not descriptive
intents:
  - id: "intent1"
  - id: "test"
  - id: "query"

# ❌ Invalid characters
intents:
  - id: "best tools"        # Space not allowed
  - id: "best-tools!"       # Special char not allowed
  - id: "best/tools"        # Slash not allowed
```

!!! tip "Intent ID Best Practices"
    - Use descriptive names that explain the intent
    - Include segment/use-case in ID if relevant
    - Use hyphens for readability: `best-crm-for-startups`
    - Keep under 50 characters
    - Avoid special characters except `-` and `_`

## Prompt Engineering for Intents

### Effective Prompt Patterns

**Pattern 1: Top N Format**

```yaml
intents:
  - id: "top-5-crm"
    prompt: "What are the top 5 CRM tools for startups in 2025?"
```

Benefits:

- Clear ranking expectation
- Limited scope (5 items)
- Time-bound (2025)

---

**Pattern 2: Use-Case Specific**

```yaml
intents:
  - id: "best-for-cold-email"
    prompt: "What are the best email warmup tools specifically for cold email campaigns?"
```

Benefits:

- Targets specific use case
- Filters out generic responses
- Relevant to your positioning

---

**Pattern 3: Comparison**

```yaml
intents:
  - id: "compare-top-tools"
    prompt: "Compare the top email warmup tools for improving deliverability"
```

Benefits:

- Encourages detailed analysis
- Shows relative positioning
- Highlights differentiators

---

**Pattern 4: Problem-Oriented**

```yaml
intents:
  - id: "solve-spam-problem"
    prompt: "My sales emails are going to spam. What tools can help me fix this?"
```

Benefits:

- Natural buyer question
- Solution-focused
- Real pain point

---

**Pattern 5: Segment-Specific**

```yaml
intents:
  - id: "best-for-startups"
    prompt: "What's the best CRM for a 10-person startup with limited budget?"
```

Benefits:

- Targets specific segment
- Includes constraints (budget)
- Realistic buyer scenario

### Prompt Length

**Recommended**: 10-30 words

```yaml
# ✅ Good: Clear and concise
intents:
  - id: "best-tools"
    prompt: "What are the best email warmup tools for cold outreach in 2025?"

# ❌ Too short: Lacks context
intents:
  - id: "tools"
    prompt: "Email tools?"

# ❌ Too long: Overly specific
intents:
  - id: "detailed-query"
    prompt: "I am a sales development representative at a B2B SaaS startup with 5 SDRs sending approximately 500 cold emails per day and we're experiencing deliverability issues with 40% of our emails going to spam, what are the absolute best email warmup tools that can help us improve our domain reputation and inbox placement rate while being cost-effective for a startup budget?"
```

### Time-Bounding Prompts

Include year for current recommendations:

```yaml
# ✅ Good: Time-bound
intents:
  - id: "best-tools-2025"
    prompt: "What are the best email warmup tools in 2025?"

# ⚠️ Generic: May return outdated info
intents:
  - id: "best-tools"
    prompt: "What are the best email warmup tools?"
```

!!! warning "Training Data Cutoff"
    Most LLMs have training data cutoffs (e.g., October 2023 for GPT-4). Time-bounding may not help unless:

    - Using web search-enabled models
    - Using Perplexity (real-time web search)
    - Using models with recent training data

### Neutral vs. Biased Prompts

**Neutral prompts** (recommended):

```yaml
intents:
  - id: "best-tools"
    prompt: "What are the best email warmup tools?"
```

**Biased prompts** (avoid):

```yaml
# ❌ Biased toward your brand
intents:
  - id: "why-warmly-best"
    prompt: "Why is Warmly the best email warmup tool?"

# ❌ Biased against competitor
intents:
  - id: "hubspot-problems"
    prompt: "What are the problems with HubSpot?"
```

Neutral prompts give you realistic brand positioning data.

## Intent Validation

### Validate Intent Configuration

Check for common issues:

```bash
llm-answer-watcher validate --config watcher.config.yaml
```

**Validation checks:**

- At least one intent configured
- Intent IDs are unique
- Intent IDs are valid (alphanumeric, hyphens, underscores)
- Prompts are non-empty
- Prompts are at least 10 characters

### Common Validation Errors

**Error**: `At least one intent must be configured`

```yaml
# ❌ Wrong
intents: []

# ✅ Correct
intents:
  - id: "best-tools"
    prompt: "What are the best tools?"
```

---

**Error**: `Duplicate intent IDs found: best-tools`

```yaml
# ❌ Wrong
intents:
  - id: "best-tools"
    prompt: "What are the best CRM tools?"

  - id: "best-tools"  # Duplicate!
    prompt: "What are the best email tools?"

# ✅ Correct
intents:
  - id: "best-crm-tools"
    prompt: "What are the best CRM tools?"

  - id: "best-email-tools"
    prompt: "What are the best email tools?"
```

---

**Error**: `Intent ID must be alphanumeric with hyphens/underscores: best tools!`

```yaml
# ❌ Wrong (space and special char)
intents:
  - id: "best tools!"
    prompt: "What are the best tools?"

# ✅ Correct
intents:
  - id: "best-tools"
    prompt: "What are the best tools?"
```

## Intent Organization Strategies

### By Buyer Journey Stage

Organize intents by funnel stage:

```yaml
intents:
  # Awareness stage
  - id: "awareness-what-is-email-warmup"
    prompt: "What is email warmup and why is it important?"

  - id: "awareness-deliverability-problems"
    prompt: "Why are my emails going to spam?"

  # Consideration stage
  - id: "consideration-best-tools"
    prompt: "What are the best email warmup tools?"

  - id: "consideration-tool-comparison"
    prompt: "Compare the top email warmup platforms"

  # Decision stage
  - id: "decision-warmly-vs-instantly"
    prompt: "Should I use Warmly or Instantly?"

  - id: "decision-pricing"
    prompt: "What's the most cost-effective email warmup tool?"
```

### By Customer Segment

Organize intents by target segment:

```yaml
intents:
  # Startup segment
  - id: "startup-best-crm"
    prompt: "What's the best CRM for early-stage startups?"

  - id: "startup-affordable-tools"
    prompt: "What are affordable CRM options for startups?"

  # SMB segment
  - id: "smb-best-crm"
    prompt: "What's the best CRM for small businesses?"

  - id: "smb-easy-setup"
    prompt: "What's the easiest CRM to set up for a 20-person team?"

  # Enterprise segment
  - id: "enterprise-best-crm"
    prompt: "What's the best enterprise CRM platform?"

  - id: "enterprise-scalable"
    prompt: "What CRM platforms scale to 1000+ users?"
```

### By Use Case

Organize intents by jobs-to-be-done:

```yaml
intents:
  # Use case: Cold email
  - id: "cold-email-best-tools"
    prompt: "What are the best tools for cold email outreach?"

  - id: "cold-email-deliverability"
    prompt: "How can I improve cold email deliverability?"

  # Use case: Account-based sales
  - id: "abs-best-tools"
    prompt: "What are the best tools for account-based sales?"

  - id: "abs-personalization"
    prompt: "What tools help personalize outreach at scale?"

  # Use case: Lead nurturing
  - id: "nurture-best-tools"
    prompt: "What are the best tools for lead nurturing?"
```

### By Competitor

Track competitive positioning:

```yaml
intents:
  # vs. Main Competitor
  - id: "vs-instantly"
    prompt: "Compare Warmly vs Instantly for email warmup"

  - id: "alternatives-to-instantly"
    prompt: "What are the best alternatives to Instantly?"

  # vs. Market Leader
  - id: "vs-hubspot"
    prompt: "Compare Warmly vs HubSpot for sales outreach"

  - id: "alternatives-to-hubspot"
    prompt: "What are the best alternatives to HubSpot for startups?"
```

## Testing Intent Prompts

### Manual Testing

Test prompts with ChatGPT/Claude before adding:

1. Ask the prompt directly
2. Check if response includes ranked lists
3. Verify brand mentions
4. Adjust prompt as needed

### A/B Testing Intents

Compare prompt variations:

```yaml
intents:
  # Variation A: Generic
  - id: "best-tools-generic"
    prompt: "What are the best email warmup tools?"

  # Variation B: Specific
  - id: "best-tools-specific"
    prompt: "What are the best email warmup tools for cold outreach in 2025?"
```

Compare results to see which prompt surfaces your brand better.

### Iteration Process

1. **Start broad**: Test generic prompts
2. **Analyze results**: Check brand mention rates
3. **Refine prompts**: Add specificity where needed
4. **Test again**: Compare refined vs. original
5. **Keep winners**: Use prompts with best brand visibility

## Intent Metrics

Track intent performance:

```sql
-- Mention rate by intent
SELECT
    intent_id,
    COUNT(DISTINCT run_id) as runs,
    SUM(CASE WHEN normalized_name IN ('mybrand', 'mybrand.io') THEN 1 ELSE 0 END) as my_brand_mentions,
    (SUM(CASE WHEN normalized_name IN ('mybrand', 'mybrand.io') THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT run_id)) as mention_rate
FROM mentions
GROUP BY intent_id
ORDER BY mention_rate DESC;
```

```sql
-- Average rank by intent
SELECT
    intent_id,
    AVG(rank_position) as avg_rank,
    MIN(rank_position) as best_rank,
    COUNT(*) as total_mentions
FROM mentions
WHERE normalized_name IN ('mybrand', 'mybrand.io')
GROUP BY intent_id
ORDER BY avg_rank ASC;
```

```sql
-- Top-performing intents
SELECT
    intent_id,
    COUNT(*) as queries,
    SUM(CASE WHEN normalized_name IN ('mybrand', 'mybrand.io') AND rank_position <= 3 THEN 1 ELSE 0 END) as top3_mentions,
    (SUM(CASE WHEN normalized_name IN ('mybrand', 'mybrand.io') AND rank_position <= 3 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as top3_rate
FROM mentions
GROUP BY intent_id
ORDER BY top3_rate DESC;
```

## Best Practices

### 1. Start with 3-5 Core Intents

Begin with essential buyer questions:

```yaml
intents:
  - id: "best-tools"
    prompt: "What are the best [category] tools?"

  - id: "best-for-startups"
    prompt: "What's the best [category] tool for startups?"

  - id: "vs-main-competitor"
    prompt: "Compare [YourBrand] vs [MainCompetitor]"
```

### 2. Test Prompts Manually First

Before adding to config, test with ChatGPT/Claude:

- Does it produce ranked lists?
- Does it mention your brand?
- Is the response format consistent?

### 3. Use Natural Language

Write prompts as real users would ask:

```yaml
# ✅ Good
intents:
  - id: "improve-deliverability"
    prompt: "How can I improve my email deliverability?"

# ❌ Bad
intents:
  - id: "deliverability"
    prompt: "EMAIL_DELIVERABILITY_TOOLS_QUERY"
```

### 4. Include Ranking Signals

Ask for "best", "top", or "recommended":

```yaml
intents:
  - id: "best-tools"
    prompt: "What are the best email warmup tools?"  # "best" = ranking signal

  - id: "top-tools"
    prompt: "What are the top 5 CRM platforms?"  # "top 5" = ranking signal
```

### 5. Version Control Intents

Track intent changes with git:

```bash
git add watcher.config.yaml
git commit -m "feat: add cold-email intent for startup segment"
```

### 6. Monitor Intent Performance

Review which intents surface your brand:

```sql
SELECT intent_id, COUNT(*) as my_brand_mentions
FROM mentions
WHERE normalized_name = 'mybrand'
GROUP BY intent_id
ORDER BY my_brand_mentions DESC;
```

Focus on high-performing intents, retire low-performers.

### 7. Update Prompts Based on Results

Iterate on prompts:

```yaml
# Original (low brand mentions)
- id: "best-tools"
  prompt: "What are email tools?"

# Improved (higher brand mentions)
- id: "best-tools"
  prompt: "What are the best email warmup tools for cold outreach?"
```

## Troubleshooting

### Brand Not Mentioned

**Problem**: Your brand doesn't appear in LLM responses

**Possible causes:**

1. **Generic prompt**: Too broad, LLM focuses on market leaders
2. **Wrong segment**: Prompt targets different customer segment
3. **Outdated training data**: LLM trained before your brand existed

**Solutions:**

- Make prompt more specific to your use case
- Target your niche/segment explicitly
- Use web search-enabled models for fresh data

---

### Inconsistent Responses

**Problem**: Different responses for same intent across runs

**Cause**: LLM non-determinism (temperature > 0)

**Solution**: Use lower temperature for consistency:

```yaml
models:
  - provider: "openai"
    model_name: "gpt-4o-mini"
    env_api_key: "OPENAI_API_KEY"
    temperature: 0.0  # Deterministic
```

---

### No Ranked Lists

**Problem**: LLM doesn't provide ranked lists

**Cause**: Prompt doesn't request ranking

**Solution**: Add ranking signal:

```yaml
# ❌ Before
- id: "tools"
  prompt: "Tell me about email warmup tools"

# ✅ After
- id: "top-tools"
  prompt: "What are the top 5 email warmup tools ranked by quality?"
```

## Next Steps

- **[Brand Configuration](brands.md)**: Optimize brand detection
- **[Operations Configuration](operations.md)**: Automate post-query analysis
- **[Rank Extraction](../features/rank-extraction.md)**: Understand ranking detection
- **[HTML Reports](../features/html-reports.md)**: Visualize intent results
