#!/usr/bin/env bash
# Nord statusline for Claude Code — single line, fast, one git call.
# Same spirit as the native zsh prompt (no starship). Reads the status JSON on
# stdin and prints:   <project> ⎇ <branch>*  ·  <model>
#
#   project : basename of the workspace/cwd
#   branch  : current git branch, with a yellow * if the tree is dirty
#   model   : the model display name
set -u

# ── Nord palette (truecolor, matches the zsh prompt) ─────────────────────────
DIR=$'\033[38;2;136;192;208m'    # frost cyan
FROST=$'\033[38;2;129;161;193m'  # frost blue
WARN=$'\033[38;2;235;203;139m'   # yellow
MUT=$'\033[38;2;76;86;106m'      # muted (separators)
R=$'\033[0m'

json=$(cat)
if command -v jq >/dev/null 2>&1; then
  model=$(printf '%s' "$json" | jq -r '.model.display_name // "claude"')
  dir=$(printf '%s'   "$json" | jq -r '.workspace.current_dir // .cwd // empty')
else
  model="claude"; dir=""
fi
[ -n "$dir" ] || dir="$PWD"
proj=${dir##*/}

# ── git: branch + dirty flag (single porcelain call) ─────────────────────────
branch=""; dirty=""
if git -C "$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  branch=$(git -C "$dir" rev-parse --abbrev-ref HEAD 2>/dev/null)
  [ -n "$(git -C "$dir" status --porcelain 2>/dev/null)" ] && dirty="*"
fi

# ── assemble ─────────────────────────────────────────────────────────────────
out="${DIR}${proj}${R}"
[ -n "$branch" ] && out+=" ${MUT}⎇${R} ${FROST}${branch}${WARN}${dirty}${R}"
out+="  ${MUT}·${R}  ${MUT}${model}${R}"
printf '%s' "$out"
