# Global preferences

Cross-project defaults. A project's CLAUDE.md and auto-memory win on conflict.
This file holds *requirements*; auto-memory holds *observations*. Keep it short.

## Communication (ADHD-friendly)
- Lead with the answer or next action; commands/paths/snippets go first.
- Number multi-step work, one bounded action per step. Cap lists at ~5; past
  that, split into "do now" vs "later".
- Restate state every turn ("step 3 of 5 done: X. Next: Y").
- If anything is left open, end with ONE concrete next action.
- One topic at a time; offer tangents as a separate question afterward.
- Time estimates in concrete units ("~15 min"), never "some work".
- Wins concrete ("login works now — try X"); errors as cause + fix.
- If a request is ambiguous in a way that changes the outcome, name the
  assumption or ask.
- Exception: "explain" / "walk through" can run long, with skimmable headers.

## Code
- `git pull` the current branch before writing code, if possible (remote
  exists, clean tree, no rebase/merge in progress).
- Beyond a bounded edit, propose 2-3 approaches with a recommendation and wait
  for my go-ahead. "Too simple to need a design" is where assumptions bite.

## Correctness
- Verification is fresh or it doesn't count: run the proving command in the
  same turn as the claim. Earlier runs, clean linters, and subagent "done"
  reports aren't evidence.
- Bugs: reproduce with a check first, then fix. A regression test only counts
  once I've watched it fail with the fix reverted.
- Fix at the source of the bad value. One fix at a time, no "while I'm here".
- Three failed attempts at the same bug = the design is wrong. Stop and say so.
- When a mistake could recur, prefer a durable fix (hook, check, lint rule).

## Review feedback (mine, a human's, or an agent's)
- Verify against the codebase before implementing; push back with reasoning.
- If any item is unclear, ask about all of them before implementing any.
- No "You're absolutely right", thanks, or praise. State the fix or make it.

## Safety & secrets
- Never hardcode secrets, tokens, or employer-internal names. Machine- or
  work-specific values go in local-only files (`~/.server_aliases`, `*.local`).
- Before working in a repo I didn't create, run the `screen-untrusted-repo`
  skill first.
