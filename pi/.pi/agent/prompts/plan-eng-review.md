---
description: Eng-manager plan review — lock architecture, data flow, edge cases, tests. Interactive, one section at a time.
argument-hint: "[plan file or feature description]"
---
## Goal
Turn a plan into something an eng manager would sign: architecture locked,
failure modes mapped, tests planned. Ported from gstack's /plan-eng-review.
NO code changes — review and harden the plan. Build no features, test
suites or benchmarks; existing tests and bounded read-only probes of
current behavior are valid evidence.

## Step 0 — Scope challenge (FIRST, hard stop if it trips)
1. **Existing code:** what already partially or fully solves each sub-problem?
   Capture outputs from existing flows instead of building parallel ones.
2. **Minimum changes:** flag anything deferrable without blocking the core goal.
3. **Complexity check:** 8+ files touched or >2 new classes/services = smell.
   STOP, name what's overbuilt, propose the minimal version, ask: reduce or
   proceed? Do not continue until the user answers. Once decided, COMMIT —
   never re-argue scope in later sections.
4. **Search check:** for each new pattern/component: does the framework have a
   built-in? Is the approach current best practice? Known footguns? (Use
   browser via playwright-cli `open` if needed.) Custom-where-builtin-exists → flag.
5. **Completeness check:** shortcut that saves human-hours but minutes with AI?
   Recommend the complete version (tests, edge cases, error paths).
6. **Distribution check:** new artifact (binary/package/app) without a
   build/publish pipeline = flag explicitly.
7. **TODOS cross-reference:** blockers? Bundle-able items? New TODOs created?

## Review sections (one at a time, ≤8 top issues each)
1. **Architecture** — component boundaries, coupling, data flow bottlenecks,
   scaling/SPOF, security architecture (auth, API boundaries), one realistic
   production failure scenario per new codepath, ASCII diagrams for key flows.
   Async ordering: for flows sharing mutable state, show both completion
   orders of overlapping awaits in one ASCII schedule; exclude an order only
   by naming the mechanism that prevents it — single-threading and atomic
   calls don't prevent interleaving across awaits.
2. **Code quality** — error handling gaps, debt hotspots,
   over/under-engineering. Shared-code rubric (not blanket DRY): propose an
   extraction only with 2+ verified first-party callers (file:line) after
   checking existing helpers for reuse; similar-looking code is insufficient —
   require common behavior plus reliability gain or net line savings including
   tests; name the helper's contract, callers to migrate, and blast radius.
3. **Tests** — detect the framework (package.json/pyproject/Gemfile/go.mod).
   Coverage goal: every changed behavior protected by a test that would catch
   a real regression — test count is not a goal; smoke/existence tests never
   count. Value bar per proposed test: what observable behavior it protects,
   what credible regression fails it, why existing coverage doesn't catch it
   (prefer extending an existing test), and no test-only production seam —
   test at the real boundary. REGRESSION RULE: a change putting existing
   behavior at risk without regression coverage is a critical requirement —
   ask HOW to cover it, never whether to skip; settle behavior-to-preserve,
   intentional changes, and acceptance assertions in one dedicated question;
   every bug fix needs a test that fails without the fix; a proposed rewrite
   is regression risk, not observed breakage. Write a Test Plan artifact
   (affected routes, key interactions, edge cases, critical paths) — /qa
   consumes it later. Assertion exactness: each behavior needs an observable
   assertion that rejects a specific wrong result, mapped to the plan's exact
   requirement — never weaken an exact count to a lower bound; helper coverage
   doesn't prove the caller's path; a test that breaks under a
   behavior-preserving refactor asserts implementation — rewrite it at the
   owning boundary unless exact output is the declared contract (goldens,
   wire formats).
4. **Performance** — N+1 queries, memory, caching, high-complexity paths; on
   request/looped paths check unbounded queries or caches, missing indexes,
   whole-file loads, blocking calls without timeouts. State each finding's
   scale (rows, requests/s, bytes) or mark it unknown — never invent
   benchmarks.

## Finding format (every finding, no exceptions)
`[P0–P3] (confidence: N/10) file:line — description`
- 9–10: verified by reading the code — quote the motivating line(s) verbatim.
- 7–8: high-confidence pattern match.
- 5–6: "Medium confidence, verify" caveat.
- 3–4: appendix only. 1–2: only if P0.
- **Pre-emit gate:** can't quote the motivating lines → unverified, force
  confidence ≤5. Framework-generated symbols (ORM Meta, decorators, migrations):
  quote the meta-construct, not the absent literal name. For proposed work,
  quote the motivating plan line (plan file:line); never describe a proposed
  regression as an observed one.

## Required outputs
- **"What already exists"** — existing flows reused vs unnecessarily rebuilt.
- **"NOT in scope"** — every considered-and-deferred item + one-line rationale.
- **Failure modes** — per new codepath: one realistic production failure; is it
  tested, handled, and loud (never silent)? No test + no handling + silent =
  **critical gap**.
- **Diagrams** — ASCII for non-trivial flows; name which files deserve inline
  diagram comments.
- **TODOS** — each potential TODO separately: what / why / pros / cons /
  context (enough that someone in 3 months understands) / depends-on. Offer:
  add to TODOS.md, skip, or build now.
- **Implementation tasks** — ordered list with P1/P2/P3 priority, files, and
  which tasks parallelize (candidates for `task` subagents).

## Optional outside voice
Offer a cold-read second opinion from a fresh subagent (`task` tool): structured
summary of plan + findings, asked to refute. Present verbatim, then synthesize
agreements/disagreements.

## Interaction rules
- One independently selectable decision per question — never batch; if the
  user could accept one remedy and reject another while both stay viable,
  split them. One behavior's necessary code/tests/docs ride in that
  behavior's approval — don't re-ask for them. Present 2–3 options with
  effort (human vs AI-assisted), risk, maintenance; state your recommendation
  and the preference it maps to (shared-code rubric, explicit > clever,
  minimal diff).
- Present complete remedies: each option includes the validation and failure
  handling that make it work. Approved remedies are recorded and referenced,
  not re-asked; scope approval alone approves no individual finding.
- If the user skips or interrupts a question, track it and list "Unresolved
  decisions" at the end — never silently default to an option.
- Zero findings in a section → "No issues, moving on."
