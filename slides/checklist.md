# One-page playbook checklist: agentic software loops (spec → build → deploy)

## 0) Mindset

- [ ] Treat coding as **automatable**, treat your role as **systems engineer**
- [ ] Start "screwdriver mode" (attended runs) before "jackhammer mode" (unattended autonomy)
- [ ] Optimize for **repeatable loops**, not heroic single runs

---

## 1) Prep your "PIN" (project truth + retrieval scaffold)

- [ ] Create a **PIN doc**: what the system is, key constraints, conventions, architecture, non-goals
- [ ] Add a **lookup table / keywords map**:
  - [ ] synonyms for key domains (auth, tenancy, billing, analytics, flags, etc.)
  - [ ] pointers to relevant files/modules ("start here" list)
- [ ] Ensure "do not invent existing behavior" rule:
  - [ ] "If unsure, search code/specs first; ask or stop"

---

## 2) Spec generation (conversation → spec → human edit)

- [ ] Start with an interview prompt: "Discuss and interview me until spec is clear"
- [ ] Capture in the spec:
  - [ ] Goal + non-goals
  - [ ] User stories / use-cases
  - [ ] Data model (events, identities, tenancy)
  - [ ] APIs (endpoints, SDK shape, payloads)
  - [ ] Storage choice + migration notes
  - [ ] Security/PII handling rules (logging, secrets)
  - [ ] Observability requirements (metrics/events)
  - [ ] Acceptance criteria ("done means…")
- [ ] Generate an **implementation plan** with:
  - [ ] ordered bullets, each referencing spec sections and code locations
  - [ ] explicit test plan per step

---

## 3) Context discipline (avoid drift)

- [ ] Split sessions:
  - [ ] Session A: planning/specs only
  - [ ] Session B/C…: execution only
- [ ] One loop = **one objective**
- [ ] Keep context minimal:
  - [ ] include PIN + relevant spec section + only needed files
- [ ] If direction changes, update spec/PIN first, then continue

---

## 4) Execution loop template (repeatable harness)

**For each objective:**

- [ ] **Select next most important step** from the plan
- [ ] Implement the smallest coherent change
- [ ] Add/adjust tests (unit or property-based—agent decides, you verify)
- [ ] Run test suite locally/CI-equivalent
- [ ] Commit with clear message
- [ ] Push / deploy (prefer staged rollout if available)
- [ ] Update plan ("done / next" checkpoint)

**Stop conditions:**

- [ ] Tests fail and root cause is unclear → revert, tighten spec, rerun loop
- [ ] Output deviates from conventions → run a "refactor-to-standard" loop

---

## 5) Guardrails ("back pressure" to keep the train on rails)

- [ ] Hard rules in prompt/tooling:
  - [ ] no secrets in logs; use secret wrapper for PII
  - [ ] no broad refactors unless explicitly requested
  - [ ] do not change public APIs without spec update
- [ ] Quality gates:
  - [ ] tests must pass before commit
  - [ ] lint/format if applicable
  - [ ] smoke test critical paths
- [ ] Observability:
  - [ ] structured events for key actions
  - [ ] error tracking + basic dashboards
- [ ] Feature safety:
  - [ ] feature flags for new behavior
  - [ ] kill switch / rollback path

---

## 6) Product loop (flags + analytics → autonomous improvement)

- [ ] Ship behind a flag
- [ ] Define success metrics (activation, retention, errors, latency, etc.)
- [ ] Collect analytics events (including anonymous if intended)
- [ ] Run experiment / gradual rollout
- [ ] Agent loop can propose:
  - [ ] keep / roll back / tweak
  - [ ] performance optimizations
  - [ ] UX adjustments (still gated by you at first)

---

## 7) Maturity ladder (how to increase autonomy safely)

- [ ] Level 0: agent drafts specs only
- [ ] Level 1: agent implements with you watching
- [ ] Level 2: agent runs unattended but **no deploy**
- [ ] Level 3: agent deploys behind flags + monitors metrics
- [ ] Level 4: "weavers" deploy + iterate on metrics with strict guardrails

---

## 8) Quick prompts you can reuse

- [ ] Spec interview: "Interview me until you can write a spec + acceptance criteria."
- [ ] Plan: "Create a bullet implementation plan referencing spec sections + files; include tests."
- [ ] Next step: "Pick the single most important next task; do only that."
- [ ] Refactor loop: "Bring code to project conventions; no behavior changes."
- [ ] Safety: "If uncertain about existing behavior, search first; do not guess."

---

> If you tell me your stack (language/framework) and how you deploy (CI/no CI), I can adapt this checklist into a copy-pastable template with your exact commands and gates.
