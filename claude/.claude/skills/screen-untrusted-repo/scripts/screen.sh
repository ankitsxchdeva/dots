#!/usr/bin/env bash
# screen.sh — triage an untrusted repo BEFORE building/running it or pointing an
# AI agent at it. Read-only: never installs, builds, or executes project code.
# Usage: bash screen.sh <path-to-repo>   (defaults to current directory)
# Every hit below is for a HUMAN to review. False positives are expected.
set -uo pipefail

TARGET="${1:-.}"
if [ ! -d "$TARGET" ]; then echo "not a directory: $TARGET" >&2; exit 1; fi
cd "$TARGET" || exit 1
echo "Screening: $(pwd)"

# ripgrep if available (searches ignored + hidden files, skips .git); else grep.
if command -v rg >/dev/null 2>&1; then
  G=(rg -n --no-heading -uu -i -g '!.git')
else
  G=(grep -rniE --exclude-dir=.git)
fi

echo
echo "== 1. Files that run WITHOUT you calling them =="
# Active git hooks auto-run on commit/checkout/etc. The grep sections below skip
# .git/ for noise, so print hook BODIES here in full — they are short and this is
# a top place malicious code hides.
for h in .git/hooks/*; do
  [ -f "$h" ] || continue
  case "$h" in *.sample) continue ;; esac
  echo "--- active git hook: $h ---"; cat "$h"; echo "---"
done
find . -maxdepth 3 -not -path './.git/*' -type f \( \
  -name package.json -o -name Makefile -o -name setup.py -o -name pyproject.toml \
  -o -name 'Dockerfile*' -o -name 'docker-compose*' -o -name .envrc \
  -o -name conftest.py \) 2>/dev/null
find . -maxdepth 3 -not -path './.git/*' -type d \( \
  -name .husky -o -name .devcontainer -o -name .vscode -o -name .github \) 2>/dev/null

echo
echo "== 2. npm lifecycle scripts (fire on \`npm install\`) =="
find . -name package.json -not -path '*/node_modules/*' -maxdepth 3 \
  -exec sh -c 'echo "-- $1 --"; command -v jq >/dev/null && jq -r ".scripts // {}" "$1" 2>/dev/null || grep -A20 "\"scripts\"" "$1"' _ {} \; 2>/dev/null || echo "  none"

echo
echo "== 3. Pipe-to-shell / remote code execution =="
"${G[@]}" '(curl|wget)[^|]*\|[[:space:]]*(ba)?sh' . || echo "  none"

echo
echo "== 4. Dynamic exec / obfuscation =="
"${G[@]}" 'eval\(|exec\(|child_process|os\.system|subprocess|base64 -d|atob\(|fromCharCode|Function\(' . || echo "  none"

echo
echo "== 5. Text aimed at an AI assistant (prompt injection) =="
"${G[@]}" 'ignore (the )?(previous|prior|above) instructions|system prompt|you are now|disregard (all|previous)|instructions to (claude|copilot|cursor|the agent)' . || echo "  none"

echo
echo "== 6. Secret / exfil targets referenced =="
"${G[@]}" 'id_rsa|\.ssh/|\.aws/|aws_secret|\.env|/etc/passwd|ANTHROPIC_API_KEY|OPENAI_API_KEY|credentials' . || echo "  none"

echo
echo "== 7. Hidden unicode (zero-width / bidi override — classic injection hiding) =="
python3 - <<'PY' 2>/dev/null || echo "  (python3 not available — skipped)"
import os
bad={0x200b,0x200c,0x200d,0x200e,0x200f,0x202a,0x202b,0x202c,0x202d,0x202e,
     0x2066,0x2067,0x2068,0x2069,0xfeff}
found=False
for root,_,files in os.walk('.'):
    if '/.git' in root or '/node_modules' in root: continue
    for f in files:
        p=os.path.join(root,f)
        try: t=open(p,encoding='utf-8').read()
        except Exception: continue
        hits={hex(ord(c)) for c in t if ord(c) in bad}
        if hits:
            found=True; print(f"  {p}: {sorted(hits)}")
if not found: print("  none")
PY

echo
echo "== done — review every hit above by hand before you install, build, or run anything =="
