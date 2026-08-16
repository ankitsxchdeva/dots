---
description: Systematic root-cause debugging — Iron Law: no fixes without investigation. 3-strike rule, regression test mandatory.
argument-hint: "[bug description or error]"
---
## Iron Law
**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.**
Fixing symptoms creates whack-a-mole debugging. Every symptom-fix makes the
next bug harder to find. Ported from gstack's /investigate.

## Phase 1 — Root cause investigation
1. **Collect symptoms:** errors, stack traces, repro steps. Not enough context?
   Ask ONE question at a time.
2. **Read the code:** trace from symptom back to causes. Grep all references;
   read the logic, don't guess it.
3. **Check recent changes:** `git log --oneline -20 -- <affected-files>`.
   Worked before? A regression means the cause is in the diff.
4. **Reproduce:** deterministic trigger? If not, gather evidence before continuing.
5. **History:** recurring bugs in the same files are an *architectural smell*,
   not a coincidence. Check the memory file / TODOS.md for prior notes.

Output: **"Root cause hypothesis: …"** — a specific, testable claim.

**Scope lock:** identify the narrowest directory containing the affected files
and suggest `/freeze <dir>` so the fix can't creep into unrelated code. Skip if
the bug genuinely spans the repo — say why.

## Phase 2 — Pattern analysis
Match against known shapes:
| Pattern | Signature | Where to look |
|---|---|---|
| Race condition | intermittent, timing-dependent | shared state |
| Null propagation | TypeError/NoMethodError | missing guards |
| State corruption | inconsistent/partial data | transactions, hooks |
| Integration failure | timeout, bad response | service boundaries |
| Config drift | works locally, fails in prod | env, flags, DB state |
| Stale cache | old data, fixes on clear | caches at every layer |

No match? Search the error — **sanitize first**: strip hostnames, IPs, paths,
SQL, customer identifiers; search only "{framework} {generic error type}".

## Phase 3 — Hypothesis testing (before ANY fix)
1. Add a temporary log/assertion at the suspected cause. Run the repro.
   Evidence match?
2. Wrong? Return to Phase 1. Gather more evidence. Do not guess.
3. **3-strike rule:** 3 failed hypotheses → STOP. Tell the user: this may be
   architectural. Options: A) new hypothesis [state it], B) escalate to a human
   who knows the system, C) instrument and wait for it to recur.

**Red flags — slow down if you hear yourself say:**
- "quick fix for now" — there is no "for now"
- proposing a fix before tracing data flow — you're guessing
- each fix reveals a new problem elsewhere — wrong layer, not wrong code

## Phase 4 — Implementation
1. Fix the ROOT cause, smallest change that eliminates it.
2. Minimal diff — resist adjacent refactors.
3. **Regression test that FAILS without the fix and PASSES with it.** Revert
   the fix locally and watch it fail — a test you haven't seen fail proves nothing.
4. Run the full test suite. Paste real output. No regressions.
5. Fix touches >5 files → flag the blast radius to the user before proceeding.

## Phase 5 — Verify & report
Reproduce the original scenario; confirm fixed. Then:
```
DEBUG REPORT
Symptom:         [what was observed]
Root cause:      [what was actually wrong]
Fix:             [file:line references]
Evidence:        [test output showing the fix works]
Regression test: [file:line — watched it fail without the fix]
Related:         [prior bugs in area, architectural notes]
Status:          DONE | DONE_WITH_CONCERNS | BLOCKED
```
If you found a non-obvious pattern or pitfall worth saving for future sessions,
store it with the `remember` tool (would it save time next session? then save).

## Important rules
- 3+ failed fix attempts → question the architecture, not the next hypothesis.
- Never apply a fix you cannot verify. Never say "this should fix it."
- DONE = root cause + fix + regression test + full suite green.
