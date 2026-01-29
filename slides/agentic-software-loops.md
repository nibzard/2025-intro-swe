---
marp: true
theme: default
paginate: true
---

<!-- _class: lead -->

# Agentic Software Loops Playbook

## spec → build → deploy

A practical guide to automatable, repeatable software development

---

<!-- _class: lead -->

![fit vertical](assets/ralph.jpeg)

---

# Ralph Wiggum (AI Coding Agents)

### What It Is

A pattern for running **autonomous, long-running AI coding loops** where the agent keeps retrying until the task is actually done.

### Why the Name Fits

Like *Ralph Wiggum* from *The Simpsons*:

- 👉 Not very smart per attempt
- 👉 Makes mistakes
- 👉 **Never gives up** — and eventually succeeds

- Conceived by [Geoffrey Huntley](https://ghuntley.com/ralph/)

---

# Ralph Wiggum: Core Loop

**How it works**

- Give the AI a **high-level goal / PRD / TODO list**
- Agent works in **short runs with fresh context**
- **Git = memory** (commit → run tests → see failures)
- Checks a **stop condition** ("all tests pass, feature works")
- ❌ Not done → loop again
- ✅ Done → exit

---

# Ralph Wiggum: Why It's Powerful

**Key advantages**

- Replaces fragile **one-shot prompting**
- Embraces: **Iteration > perfection**
- "Deterministically bad in an undeterministic world"
- Turns LLMs into **tireless night-shift coders**

**State of the world (2025–2026)**

- Originated as a simple bash loop, now plugins & ports everywhere
- Used to run **overnight refactors, features, test suites**
- One of the hottest **agentic coding patterns**

---

# Ralph Wiggum: In One Sentence

> **Ralph Wiggum = a dumb, stubborn loop that makes today's AIs shockingly effective by refusing to stop.**

---

# Overview

This playbook is a checklist for building **agentic software loops**—repeatable, automatable processes for:

- **Spec generation**: Conversation → structured spec
- **Execution**: Build, test, deploy with guardrails
- **Iteration**: Ship behind flags, measure, improve

Treat coding as **automatable**. Your role is **systems engineer**.

---

# 0. Mindset

- **Treat coding as automatable**, treat your role as systems engineer
- Start "screwdriver mode" (attended runs) before "jackhammer mode" (unattended autonomy)
- Optimize for **repeatable loops**, not heroic single runs

> "The goal is not one great run—it's a process that works every time."

---

# 1. Prep Your "PIN"

![bg right:15% top:10% height:40% opacity:0.3](assets/pin.png)

**PIN = Project truth + Retrieval scaffold**

### Create the Foundation

- Create a **PIN doc**:
  - What the system is
  - Key constraints, conventions, architecture
  - Non-goals

- Add a **lookup table / keywords map**:
  - Synonyms for key domains (auth, tenancy, billing, analytics, flags)
  - Pointers to relevant files/modules ("start here" list)

- **Rule**: "If unsure, search code/specs first; ask or stop"

---

# 2. Spec Generation (1/3)

### Start with Interview

> **Prompt**: "Discuss and interview me until spec is clear"

Don't assume—ask. The spec is only as good as your understanding.

---

# 2. Spec Generation (2/4)

### Capture in the Spec: Core Elements

- **Goal + non-goals**
- **User stories / use-cases**
- **Data model** (events, identities, tenancy)
- **APIs** (endpoints, SDK shape, payloads)
- **Storage choice + migration notes**

---

# 2. Spec Generation (3/4)

### Capture in the Spec: Requirements & Done

- **Security/PII handling rules** (logging, secrets)
- **Observability requirements** (metrics/events)
- **Acceptance criteria** ("done means…")

---

# 2. Spec Generation (4/4)

### Generate Implementation Plan

- Ordered bullets, each referencing:
  - Spec sections
  - Code locations
- Explicit test plan per step

> **A plan without tests is just a wish.**

---

# 3. Context Discipline

### Avoid Drift

- **Split sessions**:
  - Session A: planning/specs only
  - Session B/C…: execution only

- **One loop = one objective**

- **Keep context minimal**:
  - PIN + relevant spec section
  - Only needed files

- If direction changes → update spec/PIN first, then continue

---

# 4. Execution Loop Template (1/3)

### For Each Objective: Build & Test

1. **Select next most important step** from the plan
2. Implement the smallest coherent change
3. Add/adjust tests (unit or property-based)
4. Run test suite locally/CI-equivalent

---

# 4. Execution Loop Template (2/3)

### For Each Objective: Deploy & Track

5. Commit with clear message
6. Push / deploy (prefer staged rollout)
7. Update plan ("done / next" checkpoint)

---

# 4. Execution Loop Template (3/3)

### Stop Conditions

- **Tests fail and root cause is unclear**
  - → Revert, tighten spec, rerun loop

- **Output deviates from conventions**
  - → Run a "refactor-to-standard" loop

> "When stuck, go back to the spec—not forward with guesses."

---

# 5. Guardrails (1/2)

### Hard Rules in Prompt/Tooling

- No secrets in logs; use secret wrapper for PII
- No broad refactors unless explicitly requested
- Do not change public APIs without spec update

### Quality Gates

- Tests must pass before commit
- Lint/format if applicable
- Smoke test critical paths

---

# 5. Guardrails (2/2)

### Observability

- Structured events for key actions
- Error tracking + basic dashboards

### Feature Safety

- Feature flags for new behavior
- Kill switch / rollback path

> "Ship with a parachute, not just a seatbelt."

---

# 6. Product Loop

### Ship Behind Flags, Then Improve

- Ship behind a flag
- Define success metrics (activation, retention, errors, latency)
- Collect analytics events
- Run experiment / gradual rollout
- Agent loop can propose:
  - Keep / roll back / tweak
  - Performance optimizations
  - UX adjustments (still gated by you at first)

---

# 7. Maturity Ladder

### Increase Autonomy Safely

| Level | Description |
|-------|-------------|
| **0** | Agent drafts specs only |
| **1** | Agent implements with you watching |
| **2** | Agent runs unattended but **no deploy** |
| **3** | Agent deploys behind flags + monitors metrics |
| **4** | "Weavers" deploy + iterate on metrics with strict guardrails |

> Don't skip levels. Trust is earned, not assumed.

---

# 8. Quick Prompts

### Reusable Templates

| Purpose | Prompt |
|---------|--------|
| **Spec interview** | "Interview me until you can write a spec + acceptance criteria." |
| **Plan** | "Create a bullet implementation plan referencing spec sections + files; include tests." |
| **Next step** | "Pick the single most important next task; do only that." |
| **Refactor loop** | "Bring code to project conventions; no behavior changes." |
| **Safety** | "If uncertain about existing behavior, search first; do not guess." |

---

# Summary

**The Loop in One Sentence:**

> Start with a clear spec, execute one small step at a time with guardrails, ship behind flags, measure, and iterate.

**Key Principles:**

1. **Automatable over heroic**
2. **Spec before code**
3. **Test before commit**
4. **Flag before rollout**
