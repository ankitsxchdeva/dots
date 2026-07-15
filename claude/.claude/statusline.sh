#!/usr/bin/env bash
# Nord statusline for Claude Code — subtle, compact, fast (three git calls).
# Low-contrast by design: mostly muted greys, with a colour accent ONLY when
# something wants attention (risky permission mode, dirty tree, high context).
#
#   <mode> · <project>  <branch>* · <pct>% · <model>
#
# mode : the LIVE permission mode (Shift+Tab) isn't exposed to statuslines
#        (anthropics/claude-code#30189), so this is the configured default from
#        settings.json / settings.local.json. Stays grey unless auto/bypass.
# ctx  : context-window usage; greys out, turns red only when nearly full.
set -u

# ── Nord, muted-first ────────────────────────────────────────────────────────
c() { printf '\033[38;2;%sm' "$1"; }
TXT=$(c '97;110;136')    # subtle but legible (Nord comment grey)
MUT=$(c '76;86;106')     # dimmest — separators, secondary
FROST=$(c '129;161;193') # the one soft accent (project)
WARN=$(c '235;203;139')  # dirty flag
RED=$(c '191;97;106')    # attention: risky mode / near-full context
R=$'\033[0m'

json=$(cat)

if command -v jq >/dev/null 2>&1; then
  # dir last: it can be empty, and read collapses consecutive tabs
  IFS=$'\t' read -r model pct dir < <(printf '%s' "$json" | jq -r '[
      .model.display_name // "claude",
      (.context_window.used_percentage // 0 | floor),
      .workspace.current_dir // .cwd // ""
    ] | @tsv')
else
  model="claude"; dir=""; pct=0
fi
[ -n "$dir" ] || dir="$PWD"
proj=${dir##*/}

# ── permission mode: configured default (local overrides base) ───────────────
mode=""
if command -v jq >/dev/null 2>&1; then
  mode=$(jq -r '.permissions.defaultMode // empty' ~/.claude/settings.local.json 2>/dev/null)
  [ -n "$mode" ] || mode=$(jq -r '.permissions.defaultMode // "default"' ~/.claude/settings.json 2>/dev/null)
fi
case "$mode" in
  auto|bypassPermissions) mc=$RED; ml="${mode/bypassPermissions/bypass}" ;;  # only risky modes light up
  acceptEdits)            mc=$TXT; ml="accept" ;;
  plan)                   mc=$TXT; ml="plan" ;;
  *)                      mc=$TXT; ml="default" ;;
esac

# ── git branch + dirty ───────────────────────────────────────────────────────
branch=""; dirty=""
if git -C "$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  branch=$(git -C "$dir" rev-parse --abbrev-ref HEAD 2>/dev/null)
  # --no-optional-locks: don't touch index.lock from a statusline render
  [ -n "$(git -C "$dir" --no-optional-locks status --porcelain 2>/dev/null)" ] && dirty="*"
fi

# ── context: grey, red only when nearly full ─────────────────────────────────
pct=${pct:-0}
[ "$pct" -ge 85 ] && cc=$RED || cc=$MUT

# ── assemble (single-space separators, no bold) ──────────────────────────────
sep=" ${MUT}·${R} "
out="${mc}${ml}${R}"
out+="${sep}${FROST}${proj}${R}"
[ -n "$branch" ] && out+="  ${MUT}${R} ${TXT}${branch}${WARN}${dirty}${R}"
out+="${sep}${cc}${pct}%${R}"
out+="${sep}${TXT}${model}${R}"
printf '%s' "$out"
