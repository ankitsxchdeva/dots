---
description: "Find worthwhile shared-code extractions in recent work — ranked findings with evidence, never extracts autonomously."
argument-hint: "[optional base ref, default recent changes]"
---
## Goal
Find repeated logic in recent work that is worth extracting into a shared
helper. Recommendations and a proposed patch plan only — the user approves
each extraction before any code moves. Ported from gstack's deslop-shared-libs.

## Context
Run these first and read the output:
- Uncommitted work: `git --no-pager diff HEAD --stat`
- Recent commits: `git --no-pager log --oneline -20`

If the working tree is clean, review `git --no-pager diff <base>...HEAD`
instead (base = $ARGUMENTS, default `main`). Read the FULL diff before
proposing anything, then hunt repetition: grep the changed files and their
neighbors for the same logic under different names or formatting. Follow
strong candidates through their callers and any existing shared helpers.

## Rules — no mistakes
1. Do NOT edit, extract, stage, or commit anything. Output a report only.
2. Cite every caller as `file:line` verified against the ACTUAL source. Never
   invent a caller, a location, or code that isn't there.
3. Fewer findings — including none — are valid. Never pad the report to fill
   a quota.

## Extraction rubric — the bar for every proposal
Propose an extraction only when ALL of these hold:
1. **2+ verified first-party callers** — at least two authored source
   locations with `file:line` evidence. Similar names or formatting alone do
   not establish equivalent behavior. Generated and third-party copies never
   count as callers — follow them back to the authored template or resolver.
2. **Reuse checked first** — inspect existing helpers and libraries before
   proposing a new one. If one already covers the behavior, the finding is
   "migrate callers to the existing helper," not a new abstraction.
3. **Common behavior plus a real payoff** — similar-looking code is
   insufficient; require shared behavior plus a reliability gain OR net line
   savings counted including tests and both sides of moved code.
4. **Named shape** — state the helper's contract, the callers to migrate, and
   the blast radius of a shared failure. Keep the helper small; no
   option-heavy grab-bags coupling unrelated components.

## Accounting
For each candidate, count honestly:
- Implementation lines removed / added / saved — moved code counts on both
  sides; exclude generated/vendor lines.
- Total lines including tests and integration — state when tests make the
  total change grow. Use ranges when uncertain; never double-count
  overlapping removals across candidates.

## Ranking
Favor reliability gains and total net savings, then low adoption and testing
risk. Prefer proven code used by several callers; recent activity breaks ties,
it is not evidence by itself. Reject incompatible contracts and abstractions
whose benefits don't justify them.

## Output
- **Scope** — window/base reviewed, files covered, gaps in coverage.
- **Candidates** — compact table: repeated logic · verified callers
  (`file:line`) · est. lines removed/added/saved (impl, then total) ·
  reliability benefit.
- **Top 3 recommendations** — for each: helper name + destination, contract,
  callers to migrate, smallest adoption sequence, compatibility tests, main
  risk, and a proposed patch plan. One line on why the rest rank lower.
- **Verdict** — one line. If nothing survives the rubric, say so and state
  the evidence limits. Stop after the recommendations; each extraction waits
  for explicit user approval.
