---
description: Engineering retrospective — what shipped, streaks, test health, growth opportunities. Data from git, not vibes.
argument-hint: "[24h | 14d | 30d | compare] (default: 7 days)"
---
## Goal
An eng-manager retro over the recent window, grounded in git data. Ported from
gstack's /retro.

## Parse the window
Default 7d. `24h`/`14d`/`30d` adjust. `compare` = current window vs the prior
same-length window. For day windows, anchor at local midnight:
`--since="YYYY-MM-DDT00:00:00"` (bare dates anchor at wall-clock time — wrong).

## Gather
- `git log --since="<start>" --oneline` — volume and shape of work.
- `git log --since="<start>" --format="%an" | sort | uniq -c | sort -rn` —
  per-person breakdown.
- `git log --since="<start>" --name-only --format="" | sort | uniq -c | sort -rn | head -15` —
  hotspots (most-touched files).
- `git log --since="<start>" --format="%ad" --date=short | sort -u | wc -l` —
  active days. Streak: consecutive commit days counting back from the newest
  commit date, not today (don't trust the clock); newest commit older than
  yesterday = broken streak — report 0 and note the last shipping day.
- Commit type mix: feat / fix / chore / docs / test (conventional prefix or
  best-effort classification). High fix:feat ratio = quality signal to discuss.
- Test health: are new codepaths landing with tests? `git log --since="<start>"
  --name-only --format="" | grep -c test` vs source files touched. Compare to
  the prior window for a trend.
- TODOS.md delta: items closed vs added.

## Report
```
RETRO — <repo> — <window>
════════════════════════════════════════
Shipped:        N commits across M active days (streak: X)
Authors:        per-person breakdown with headline contributions
Highlights:     3 most impactful changes (from commit messages + diffs)
Shape of work:  feat/fix/chore mix, hotspots (files churning most)
Test health:    tests:code delta vs prior window — improving or slipping
Growth:         1-2 concrete opportunities (process or code), each actionable
Open loops:     TODOs added vs closed; anything aging
════════════════════════════════════════
```
- Highlights cite real commits — no invented accomplishments.
- Growth opportunities: max 2, concrete, tied to evidence above (e.g. "fix
  ratio 3:1 in auth/ — time for the refactor in TODOS item X").
- `compare`: side-by-side deltas for commits, active days, fix ratio, test
  delta — then one paragraph: what changed and is it the right direction.
- Tone: matter-of-fact. Wins named plainly, problems without drama.
