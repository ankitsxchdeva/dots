---
description: Review the current diff — correctness bugs first, then cleanups. Find, never fix.
argument-hint: "[optional base ref, default main]"
allowed-tools: Bash(git:*)
---
## Goal
Review my changes the way a careful senior reviewer would. Find problems. Do not change code.

## Scope
Changed files (uncommitted vs HEAD):
!`git --no-pager diff HEAD --stat`

If that is empty, everything is committed — review `git diff <base>...HEAD`
instead (base = $ARGUMENTS, default `main`). Read the FULL diff with git before
reporting; don't review from the stat alone.

## Rules — no mistakes
1. Do NOT edit, fix, stage, or commit anything. Output a report only.
2. Cite every finding as `file:line` taken from the ACTUAL diff. Never invent a
   location, a line, or code that isn't there.
3. Pass 1 — correctness (what matters): logic bugs, edge cases, error handling,
   off-by-one, nil/undefined, resource leaks, races, injection/security.
4. Pass 2 — quality (lower priority): dead code, duplication, a simpler
   equivalent, naming, unclear control flow.
5. Rank by confidence. Separate "this is wrong" from "worth a look." If you're
   unsure, say so — do not pad the report to look thorough.
6. If the diff is genuinely clean, say so in one line. Do not manufacture findings.

## Output
- **🔴 Blocking** (correctness) — `file:line` · issue · suggested fix
- **🟡 Consider** (quality) — `file:line` · note
- **Verdict** — one line: ship it / fix blockers first.
