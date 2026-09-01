---
description: Review the current diff — correctness bugs first, then cleanups. Find, never fix.
argument-hint: "[optional base ref, default main]"
---
## Goal
Review my changes the way a careful senior reviewer would. Find problems. Do not change code.

## Context
Run these first and read the output:
- Changed files (uncommitted vs HEAD): `git --no-pager diff HEAD --stat`

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

## Simplification lens — advisory (only if diff > 100 lines)
Hunt unrequested *structure* only — never coverage, never tests. One-line
findings: `file:line` · tag · what to cut · what replaces it · `lines_removable`
(net lines the fix deletes). Exactly one tag per finding:
- `delete` — dead code, unused flexibility. Replacement: nothing.
- `stdlib` — hand-rolled what the standard library ships; name the function.
- `native` — dependency or code duplicating a platform feature; name the feature.
- `speculative` — one-implementation abstraction, config nobody sets, layer with one caller.
- `shrink` — same logic in fewer lines, only if ≥5 saved; show the shorter form.

Do NOT flag: tests, error paths, edge-case branches, validation, security,
accessibility; harmless redundancy that aids readability; consistency-only
changes; anything already addressed in the diff. Coverage gaps belong to
passes 1–2, never here. If the lens runs and finds nothing: "Simplification:
lean already — nothing to cut."

## Output
- **🔴 Blocking** (correctness) — `file:line` · issue · suggested fix
- **🟡 Consider** (quality) — `file:line` · note
- **✂️ Advisory** (simplification, only if the lens ran) — one line each; never
  blocking, never part of the verdict; if the user asks you to fix afterward,
  these are ask-first, even when mechanical. With findings add
  `net: -N lines possible` summed from `lines_removable`.
- **Verdict** — one line: ship it / fix blockers first. Advisory findings never change it.
