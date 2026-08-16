---
description: CEO-grade plan review — rethink the problem, find the 10-star product, challenge scope. Report only, no code.
argument-hint: "[plan file or feature description]"
---
## Goal
Review a plan the way a great CEO would: catch landmines, find the 10x hiding
in the request, and lock scope explicitly. Ported from gstack's /plan-ceo-review.
NO code changes, NO implementation — review with maximum rigor.

## Step 0 — System audit (before judging anything)
Run and read:
- `git log --oneline -30` · `git diff $(git merge-base HEAD origin/main) --stat 2>/dev/null`
- `grep -rn "TODO\|FIXME\|HACK" --include='*.*' -l . 2>/dev/null | head -20`
- Read AGENTS.md/CLAUDE.md, TODOS.md, and any design doc in `docs/designs/`.
If no design doc exists and the user is fuzzy on the problem, offer
`/office-hours` first — sharper input makes this review sharper. Don't re-offer.

## Step 0F — Mode selection (ask, then COMMIT)
Ask the user to pick ONE; then execute it faithfully — never drift:
- **SCOPE EXPANSION** — envision the platonic ideal. Push scope UP: "what makes
  this 10x better for 2x effort?" Every expansion is an explicit user opt-in.
- **SELECTIVE EXPANSION** — hold scope as baseline, surface each expansion
  opportunity individually for cherry-picking.
- **HOLD SCOPE** — accept scope; make it bulletproof. No silent changes.
- **SCOPE REDUCTION** — surgeon mode: minimum viable version, cut ruthlessly.

## Prime directives
1. **Zero silent failures.** Every failure mode must be visible — a silent
   failure is a critical defect in the plan.
2. **Every error has a name.** Specific exception, trigger, catch site, user
   experience, test. Catch-all handlers are a smell — call them out.
3. **Data flows have shadow paths:** nil input, empty input, upstream error.
   Trace all four for every new flow.
4. **Interactions have edge cases:** double-click, navigate-away-mid-action,
   slow connection, stale state. Map them.
5. **Observability is scope**, not afterthought — logs/metrics/alerts are
   first-class deliverables.
6. **Diagrams are mandatory** for non-trivial flows (ASCII).
7. **Everything deferred must be written down** — TODOS.md or it doesn't exist.
8. **Optimize for the 6-month future** — if this creates next quarter's
   nightmare, say so.
9. **Permission to say "scrap it and do this instead."**

## Completeness is cheap
AI compresses implementation 10–100x. "Full version ~150 LOC" vs "90% shortcut
~80 LOC" — always prefer full. "Ship the shortcut" is legacy thinking.

## Review passes
1. **Premise challenge** — is this the right problem? What if we do nothing?
2. **Existing code leverage** — what already partially solves this? Rebuild vs
   reuse, explicitly.
3. **Dream-state mapping** — the 10-star version of this feature; then decide
   what's THIS release vs deferred.
4. **Alternatives** — 2–3 implementation approaches with effort/risk if the
   plan's approach isn't clearly best.
5. **Temporal interrogation** — what breaks at 10x users? 10x data? In 6 months?
6. Per selected mode: expansion ideas / bulletproofing / cuts.

## Cognitive instincts to apply (don't enumerate, internalize)
Inversion reflex ("what would make this fail?"), focus as subtraction (Jobs:
350 products → 10), speed calibration (slow only for irreversible + high
magnitude), edge-case paranoia (47-char names, zero results, first-time user),
design for trust, subtraction default (Rams: as little design as possible).

## Output
- **Findings** ranked P0–P3 with `(confidence: N/10)` — quote the motivating
  plan/code lines for every finding; unquotable → confidence ≤5, appendix only.
- **Scope decisions:** Accepted (opted-in) / **NOT in scope** (each with a
  one-line rationale — never silently dropped).
- **Vision note:** the 10x check — is the platonic ideal named, even if deferred?
- **Verdict:** one line — ship the plan / revise first (what specifically).
- One decision per question to the user; never batch.
