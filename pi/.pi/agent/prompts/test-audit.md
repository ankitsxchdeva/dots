---
description: "Audit the test suite — find low-value or duplicate tests and the test-only production code they keep alive. Report with evidence, never delete."
argument-hint: "[path or test glob, default whole suite]"
---
## Iron Law
**REPORT ONLY. Never edit, delete, or refactor a test or production file.**
Recommend deletions and merges with evidence; the user decides what lands.
Ported from gstack's /test-audit.

## Test philosophy
Every test must protect an observable behavior against a credible regression.
Test count is not a goal — a suite's real cost is read time, run time, and
refactor friction. Prefer extending an existing test (a row in a table-driven
test, a case in a shared fixture) over a near-duplicate.

## The value bar
A test earns its place only with all four answers:
1. What observable behavior, invariant, or contract does it protect?
2. What credible regression makes it fail?
3. Why doesn't existing coverage already catch that?
4. Does it need a production seam (export, flag, wrapper, injection hook) that
   no production caller needs? If yes, it belongs at the real boundary.

A test that breaks under a behavior-preserving refactor asserts implementation,
not behavior — rewrite it at the owning boundary, unless exact output is the
declared contract (goldens, prompt bytes, wire formats).

## Low-value catalog
Flag a test matching any of these unless the retention bar saves it:
- **Trivial assertions** — asserting a constant, a literal, or the fixture itself.
- **Smoke tests asserting existence** — "renders", "is defined", constructor runs.
- **Implementation assertions** — spies on private helpers, call counts, internal
  state; breaks when internals move but behavior doesn't.
- **Near-duplicate fixtures** — same setup and assertions as a sibling with one
  input changed; merge into the table or shared fixture.
- **Source greps** — asserting source text, import lists, or export inventories
  that aren't a declared contract.
- **Per-caller replays** — re-testing a shared helper through every caller.
- **Keeps a seam alive** — the test's only purpose is exercising a test-only
  export, global, or wrapper.

## Retention bar — never flag
Keep tests that independently enforce: public API, protocol, config, migration,
storage, security, platform, or default-value contracts; golden/generated
output; call order when order is observable; anything reachable from the package
entrypoint (package.json exports/main, index re-exports). Slow or static is not
a reason to delete. Skip tests marked `test-value: keep reason="..."` and list
them as suppressed.

## Test-only production seam hunt
For each flagged test, hunt the production code it keeps alive:
1. Grep each export/flag/wrapper the test touches for non-test callers:
   `git grep -n -F -w -e '<symbol>' -- . ':!test/' ':!tests/' ':!**/__tests__/**' ':!**/*.test.*' ':!**/*.spec.*' ':!**/*_test.*' ':!**/test_*.py'`
2. Zero non-test callers = candidate seam. Record the exact command, exclusions,
   and hit count.
3. Grep misses re-exports, dynamic dispatch, and generated code — mark every
   production removal "requires typecheck/build pass with the code removed."
   Never recommend production deletion on grep evidence alone.

## Workflow
1. **Scope:** $ARGUMENTS path/glob, else the whole suite. Over ~300 test files,
   narrow to files changed since the merge-base with the default branch and say so.
2. **Mechanical pre-filter before reading anything:**
   - no assertion keyword: `grep -L -E 'expect|assert|should|t\.(Error|Fatal|Fail)|refute'`
   - source greps: `grep -l -E 'readFileSync\([^)]*\.(ts|js|py|go)|toContain\(.(import|export|function)'`
   - export inventories: `grep -l -E 'Object\.keys\(|exports\)\.toEqual'`
   - near-duplicates: hash whitespace-stripped content (`cksum`), group collisions.
   A grep hit is a lead, not a verdict — read the test before judging.
3. **Evidence per candidate:** read the full test, its production owner, the
   callers, and overlapping tests. `git log --follow --oneline -- <test>` for
   why it exists. Then assign a verdict.
4. **Verdicts:** `retire` · `rewrite` (at the owning boundary) · `extend` (fold
   into an existing table/fixture) · `retain` (name the contract). Rank by
   confidence. A short, well-evidenced list beats a long speculative one;
   "suite is lean, nothing to cut" is a valid result.

## Report format
```
TEST AUDIT
Scope:      [paths, file count]
Candidates: [N ready]

## <owner boundary>              — one section per production area
- file:line · verdict · LOC removed (test / production)
  Evidence: [what it asserts, why it fails the value bar, grep hit count,
             what already covers the behavior]
  History:  [why it exists, from git log]

Retained false positives: [test → contract it guards]
Suppressed:               [test → keep reason]
LOC delta:                production -N · test -M
Follow-ups:               [seams to remove after approval, validation commands]
Status:                   DONE | DONE_WITH_CONCERNS | PARTIAL (resume: <scope>)
```

## Rules
- Report only — no edits, no deletions, no commits. Approved batches are
  applied in a follow-up turn, one owner boundary at a time.
- Every recommendation carries evidence: file:line, the grep command and hit
  count, and what already covers the behavior. No evidence, no listing.
- Separate "safe to delete" from "worth a look." Don't pad to look thorough.
- Never edit source or tests while a test runner is running in the checkout.
