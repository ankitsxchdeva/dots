---
description: Commit staged changes as one clean conventional commit — review-first, never blind-add
argument-hint: "[optional summary override]"
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git log:*), Bash(git rev-parse:*), Bash(git branch:*)
---
## Goal
Create exactly one clean commit from the work that is ready. Conventional Commits style.

## Context
- Branch: !`git rev-parse --abbrev-ref HEAD`
- Status: !`git status -sb`
- Staged (names): !`git diff --cached --stat`

## Rules — no mistakes
1. NEVER `git add -A` / `git add .` blindly. If nothing is staged but there are
   unstaged changes, STOP and ask what to include — do not guess intent.
2. Read the full `git diff --cached` before writing the message. The message must
   describe what the diff *does*, not what I asked for.
3. Scan the staged diff for secrets, tokens, keys, or internal-only strings
   (private keys, API tokens, internal hostnames or project names). If anything
   looks sensitive, STOP and warn — do not commit.
4. Message format: `type(scope): summary` — type ∈ feat|fix|refactor|docs|chore|
   test|perf|build. Imperative mood, summary ≤ 72 chars. Add a body only when the
   *why* isn't obvious from the diff.
5. Do NOT push. Do NOT `--amend` an existing commit unless I explicitly say so.
6. If on `main` or `master`, warn me and offer to branch before committing.
7. $ARGUMENTS — if I passed a summary, use it, but still verify it matches the diff.
8. End the message with a `Co-Authored-By:` trailer crediting the model you are
   running as, per this environment's convention.

## Steps
1. Resolve what's being committed (rule 1).
2. Review `git diff --cached`; sanity-check it (rules 2–3).
3. Write the message (rules 4, 7, 8).
4. Commit.
5. Show `git log -1 --stat` so I can verify the result.
