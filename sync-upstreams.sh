#!/bin/bash
# sync-upstreams — pull the reference clones (oh-my-pi, gstack) and show what
# changed in the files this config ports from. Review the diffs, then re-port
# into pi/.pi/agent/ where it matters.
#
# Clones (reference only — nothing is installed or built from them):
#   ~/src/oh-my-pi  →  extensions/{advisor,task,magic-keywords}.ts notices+prompts
#   ~/src/gstack    →  prompts/{office-hours,plan-*,investigate,cso,qa,retro}.md,
#                      extensions/safety.ts

set -eu

sync_repo() {
    local dir="$1"; shift
    if [ ! -d "$dir/.git" ]; then
        echo "!! missing clone: $dir"
        return 1
    fi
    local before after
    before=$(git -C "$dir" rev-parse HEAD)
    git -C "$dir" pull --ff-only -q
    after=$(git -C "$dir" rev-parse HEAD)
    if [ "$before" = "$after" ]; then
        echo "== $(basename "$dir"): up to date ($(git -C "$dir" log -1 --format='%h %s' | cut -c1-60))"
        return 0
    fi
    echo "== $(basename "$dir"): ${before:0:9} → ${after:0:9}"
    echo "   changes in ported-from files:"
    git -C "$dir" diff --stat "$before" "$after" -- "$@" | sed 's/^/   /'
    echo
}

sync_repo ~/src/oh-my-pi \
    packages/coding-agent/src/prompts/advisor \
    packages/coding-agent/src/prompts/agents/task.md \
    packages/coding-agent/src/prompts/system/ultrathink-notice.md \
    packages/coding-agent/src/prompts/system/orchestrate-notice.md \
    packages/coding-agent/src/prompts/system/workflow-notice.md \
    docs/magic-keywords.md

sync_repo ~/src/gstack \
    office-hours plan-ceo-review plan-eng-review investigate cso qa retro \
    careful freeze guard unfreeze
