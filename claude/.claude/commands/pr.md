---
description: Open a pull request for the current branch — push-safe, base-aware, honest test plan
argument-hint: "[optional PR title]"
allowed-tools: Bash(git:*), Bash(gh:*)
---
## Goal
Open a pull request for the current branch with a clear title and a real test plan.

## Context
- Branch: !`git rev-parse --abbrev-ref HEAD`
- Upstream: !`git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "(none — needs first push)"`
- Default base: !`git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##' || echo main`
- Commits on this branch: !`git log --oneline @{u}..HEAD 2>/dev/null | head -20 || echo "(no upstream yet)"`

## Rules — no mistakes
1. NEVER open a PR from `main`/`master`. If I'm on it, STOP.
2. Confirm the base branch (the detected default above, usually `main`). If
   ambiguous, ask before proceeding.
3. If the branch has no upstream, push it with `-u`. If it diverged, use
   `--force-with-lease` — NEVER plain `--force`, and never force-push a shared branch.
4. Title: Conventional-Commits style, summarizing the WHOLE branch — not just the
   last commit. $ARGUMENTS overrides if I provided a title.
5. Body: a short **## Summary** (what changed + why) and a **## Test plan** (how it
   was verified). Only claim tests you actually ran — no invented verification.
6. Scan `git diff <base>...HEAD` for secrets before creating the PR.
7. End the body with the "🤖 Generated with Claude Code" footer.
8. After creating, print the PR URL. Do NOT merge.

## Steps
1. Verify not on the base branch; resolve the base (rules 1–2).
2. Push if needed (rule 3).
3. Draft title + body from `git diff <base>...HEAD` and the commit list (rules 4–5).
4. `gh pr create --base <base> --title … --body …`.
5. Print the resulting URL.
