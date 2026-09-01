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

## Freshness pre-flight
Before gathering history, `git fetch origin --quiet 2>/dev/null`. If the fetch
fails (offline or no remote), proceed but disclose "window not
freshness-verified" in the report. If it succeeds, check the newest commit on
the branch you'll analyze (`git log -1 --format=%ad --date=short`): older than
the window start = stale base — today is probably wrong in-session or the
local ref is behind. BLOCK: stop and say so instead of fabricating a coherent
retro from an empty window. Confirm today's date; if it's right, pull and
re-run.

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

## Shortcut debt ledger
Convention: a shortcut the user accepted gets a code comment at each cut
corner — `shortcut(dec-<id>): <ceiling>, upgrade when <trigger>`. Use this
when implementing an accepted scope cut. Harvest the markers:

```bash
grep -rn "shortcut(dec-" . \
  --exclude-dir=.git --exclude-dir=node_modules \
  --exclude-dir=vendor --exclude-dir=dist 2>/dev/null \
  | grep -vE 'shortcut\(dec-(<|\*)' || true
```

Discard hits that quote or test the convention instead of marking a real cut
corner. One ledger row per marker: `<file>:<line>, <what was simplified>.
ceiling: <X>. upgrade: <Y>.` Join each dec-<id> against the decision it came
from — no matching decision → tag `unlinked`; marker names no upgrade trigger
→ tag `no-trigger` (those are the ones that rot silently). Zero matches is the
healthy case, not a failure.

## Report
```
RETRO — <repo> — <window>
════════════════════════════════════════
Shipped:        N commits across M active days (streak: X)
Authors:        per-person breakdown with headline contributions
Highlights:     3 most impactful changes (from commit messages + diffs)
Shape of work:  feat/fix/chore mix, hotspots (files churning most)
Test health:    tests:code delta vs prior window — improving or slipping
Shortcut debt:  N markers, M with no trigger (none: clean ledger)
Growth:         1-2 concrete opportunities (process or code), each actionable
Open loops:     TODOs added vs closed; anything aging
════════════════════════════════════════
```
- Highlights cite real commits — no invented accomplishments.
- Shortcut debt: with markers, show the ledger rows and flag `no-trigger`
  entries; with none, one line — "No shortcut debt. Clean ledger."
- Growth opportunities: max 2, concrete, tied to evidence above (e.g. "fix
  ratio 3:1 in auth/ — time for the refactor in TODOS item X").
- `compare`: side-by-side deltas for commits, active days, fix ratio, test
  delta — then one paragraph: what changed and is it the right direction.
- Tone: matter-of-fact. Wins named plainly, problems without drama.
