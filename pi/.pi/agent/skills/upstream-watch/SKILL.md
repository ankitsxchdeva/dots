---
name: upstream-watch
description: Check GitHub for updates to the upstreams this pi config ports from (oh-my-pi, gstack) and to pi itself (Homebrew). Use when asked to check for updates, sync upstreams, see what's new upstream, or re-port changes.
---

# Upstream watch

This config ports features from two reference clones — nothing is installed or
built from them:

- `~/src/oh-my-pi` → `extensions/{advisor,task,magic-keywords}.ts`
- `~/src/gstack` → `prompts/{office-hours,plan-ceo-review,plan-eng-review,investigate,cso,qa,retro}.md`, `extensions/safety.ts`

## Automatic polling

A launchd agent (`local.pi-upstream-watch`) runs `scripts/check-updates.sh`
daily. It fetches remote refs only (never merges or touches working trees) and
writes `~/.pi/agent/upstream-status.json`. The `upstream-watch` extension reads
that file at session start and shows a notice when anything is behind.

## On-demand check

1. Run `scripts/check-updates.sh` (resolve relative to this skill's directory).
2. Read `~/.pi/agent/upstream-status.json` for the per-repo behind-counts.
3. For each repo that is behind, run `~/.dots/sync-upstreams.sh` — it pulls and
   prints a diffstat of exactly the files this config ports from.
4. Report per repo: commits behind, which ported-from files changed, and a
   concrete recommendation (which `~/.dots/pi/.pi/agent/` file, what change).

## Rules

- NEVER re-port autonomously. Present the upstream diff and the proposed port;
  the user approves each one.
- Port faithfully but adapt: remove fork-only machinery (omp Rust tools,
  gstack `$B`/AskUserQuestion/learnings binaries) and match the existing style
  of the target file.
- If `pi-coding-agent` itself is outdated, tell the user to `brew upgrade
  pi-coding-agent` — do not run it mid-session.
