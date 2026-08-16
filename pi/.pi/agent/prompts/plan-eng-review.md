---
description: Eng-manager plan review — lock architecture, data flow, edge cases, tests. Interactive, one section at a time.
argument-hint: "[plan file or feature description]"
---
## Goal
Turn a plan into something an eng manager would sign: architecture locked,
failure modes mapped, tests planned. Ported from gstack's /plan-eng-review.
NO code changes — review and harden the plan.

## Step 0 — Scope challenge (FIRST, hard stop if it trips)
1. **Existing code:** what already partially or fully solves each sub-problem?
   Capture outputs from existing flows instead of building parallel ones.
2. **Minimum changes:** flag anything deferrable without blocking the core goal.
3. **Complexity check:** >8 files touched or >2 new classes/services = smell.
   STOP, name what's overbuilt, propose the minimal version, ask: reduce or
   proceed? Do not continue until the user answers. Once decided, COMMIT —
   never re-argue scope in later sections.
4. **Search check:** for each new pattern/component: does the framework have a
   built-in? Is the approach current best practice? Known footguns? (Use
   browser_navigate if needed.) Custom-where-builtin-exists → flag.
5. **Completeness check:** shortcut that saves human-hours but minutes with AI?
   Recommend the complete version (tests, edge cases, error paths).
6. **Distribution check:** new artifact (binary/package/app) without a
   build/publish pipeline = flag explicitly.
7. **TODOS cross-reference:** blockers? Bundle-able items? New TODOs created?

## Review sections (one at a time, ≤8 top issues each)
1. **Architecture** — component boundaries, coupling, data flow bottlenecks,
   scaling/SPOF, security architecture (auth, API boundaries), one realistic
   production failure scenario per new codepath, ASCII diagrams for key flows.
2. **Code quality** — DRY violations aggressively, error handling gaps, debt
   hotspots, over/under-engineering.
3. **Tests** — detect the framework (package.json/pyproject/Gemfile/go.mod);
   test matrix for every new path; REGRESSION RULE: every bug fix needs a test
   that fails without the fix; write a Test Plan artifact (affected routes,
   key interactions, edge cases, critical paths) — /qa consumes it later.
4. **Performance** — N+1 queries, memory, caching, high-complexity paths.

## Finding format (every finding, no exceptions)
`[P0–P3] (confidence: N/10) file:line — description`
- 9–10: verified by reading the code — quote the motivating line(s) verbatim.
- 7–8: high-confidence pattern match.
- 5–6: "Medium confidence, verify" caveat.
- 3–4: appendix only. 1–2: only if P0.
- **Pre-emit gate:** can't quote the motivating lines → unverified, force
  confidence ≤5. Framework-generated symbols (ORM Meta, decorators, migrations):
  quote the meta-construct, not the absent literal name.

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
- One issue per question to the user — never batch. Present 2–3 options with
  effort (human vs AI-assisted), risk, maintenance; state your recommendation
  and the preference it maps to (DRY, explicit > clever, minimal diff).
- Zero findings in a section → "No issues, moving on."
