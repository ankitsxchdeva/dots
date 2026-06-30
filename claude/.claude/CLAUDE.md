# Global preferences

Personal, cross-project defaults — the "how I work" layer. A project's own
CLAUDE.md and auto-memory take precedence where they conflict. This file holds
*requirements*; let auto-memory hold *observations*. Keep it short.

## Communication
- Be concise and direct. Skip preamble and flattery; lead with the answer.
- Give a recommendation, not an exhaustive survey of options.
- State what you actually did and verified — plainly, without hedging or overclaiming.

## Code
- Read the surrounding code first; match its style, naming, and idioms.
- Prefer the simplest thing that works. No premature abstraction or speculative
  generality (KISS, YAGNI). Explicit over clever.
- Keep diffs minimal and scoped to the task. Don't reformat or refactor code you
  weren't asked to touch.
- Comment only what isn't obvious; match the file's existing comment density.

## Correctness
- After a change, actually run it (the tests, the command, the app) and report the
  real output. Never claim success you haven't observed.
- When a class of mistake could recur, prefer a durable fix — a hook, check, or
  lint rule — over a one-off patch. Fix the environment, not just the symptom.

## Safety & secrets
- Never hardcode secrets, tokens, or employer-internal names. Machine- or
  work-specific values go in local-only files (`~/.server_aliases`, `*.local`),
  never in tracked configs.
- Don't commit or push unless I ask. Branch off main before committing if needed.
- Confirm before destructive or hard-to-reverse actions.

## Tools
- Use `rg`, `fd`, `bat`, `eza`, `zoxide` when available — they're installed.
- Prefer non-interactive invocations (e.g. `git --no-pager`); never spawn a pager.

## Aesthetic
- Nord palette for anything themed (prompts, configs, UIs) unless told otherwise.
- Minimal and fast over heavy — I dropped starship for speed; respect that bias.
