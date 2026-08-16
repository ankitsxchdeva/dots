#!/bin/bash
# check-updates — poll GitHub for upstream changes without merging anything.
#
# Fetches remote refs (working trees untouched), records how far behind each
# reference clone is, and checks whether Homebrew has a newer pi-coding-agent.
# Writes ~/.pi/agent/upstream-status.json, which the upstream-watch pi
# extension reads at session start. Runs daily via the local.pi-upstream-watch
# launchd agent; safe to run by hand anytime.

set -u

STATUS_FILE="$HOME/.pi/agent/upstream-status.json"
mkdir -p "$(dirname "$STATUS_FILE")"

json_escape() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }

check_repo() { # <name> <dir> — prints a JSON object (no comma)
    local name="$1" dir="$2" behind latest
    if [ ! -d "$dir/.git" ]; then
        printf '"%s": {"error": "not cloned at %s"}' "$name" "$(json_escape "$dir")"
        return
    fi
    if ! git -C "$dir" fetch --quiet origin 2>/dev/null; then
        printf '"%s": {"error": "fetch failed"}' "$name"
        return
    fi
    behind=$(git -C "$dir" rev-list --count 'HEAD..@{u}' 2>/dev/null || echo 0)
    latest=$(git -C "$dir" log -1 --format='%h %s' '@{u}' 2>/dev/null | cut -c1-70)
    printf '"%s": {"behind": %s, "latest": "%s"}' "$name" "$behind" "$(json_escape "$latest")"
}

pi_info=$(brew outdated pi-coding-agent 2>/dev/null | head -1)
if [ -n "$pi_info" ]; then
    pi_json=$(printf '{"outdated": true, "info": "%s"}' "$(json_escape "$pi_info")")
else
    pi_json='{"outdated": false}'
fi

{
    printf '{\n'
    printf '  "checked": "%s",\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    printf '  "repos": {\n'
    printf '    %s,\n' "$(check_repo oh-my-pi "$HOME/src/oh-my-pi")"
    printf '    %s\n'  "$(check_repo gstack "$HOME/src/gstack")"
    printf '  },\n'
    printf '  "piHomebrew": %s\n' "$pi_json"
    printf '}\n'
} > "$STATUS_FILE.tmp" && mv "$STATUS_FILE.tmp" "$STATUS_FILE"

echo "wrote $STATUS_FILE"
