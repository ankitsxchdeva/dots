#!/usr/bin/env bash
# screen.sh — triage an untrusted repo BEFORE building/running it or pointing an
# AI agent at it. Read-only: never installs, builds, or executes project code.
# Usage: bash screen.sh <path-to-repo>   (defaults to current directory)
#
# Tuned against two real attack classes:
#   1. Fake-interview malware (DPRK "Contagious Interview" / Lazarus): payload
#      fires on `npm install`, on VSCode "trust repo", or a paste-and-run command;
#      steals browser creds, macOS Keychain, crypto wallets; fetches a 2nd stage.
#   2. Poisoned-repo prompt injection: the repo ships its OWN agent-config file
#      (CLAUDE.md / AGENTS.md / .cursorrules) that hijacks your AI agent into
#      running a setup script that pulls a reverse shell from a DNS TXT record.
#
# Every hit below is for a HUMAN to review. False positives are expected.
set -uo pipefail

TARGET="${1:-.}"
if [ ! -d "$TARGET" ]; then echo "not a directory: $TARGET" >&2; exit 1; fi
cd "$TARGET" || exit 1
echo "Screening: $(pwd)"

# ripgrep if available (searches ignored + hidden files, skips .git); else grep.
if command -v rg >/dev/null 2>&1; then
  G=(rg -n --no-heading -uu -i -g '!.git' -g '!node_modules')
else
  G=(grep -rniE --exclude-dir=.git --exclude-dir=node_modules)
fi
PRUNE=(-not -path './.git/*' -not -path '*/node_modules/*')

dump() { # print a file's contents with a header, if it exists
  [ -f "$1" ] || return 0
  echo "--- $1 ---"; cat "$1"; echo "--- end $1 ---"
}

echo
echo "== 1. Files that run WITHOUT you calling them (contents shown) =="
# Active git hooks auto-run on commit/checkout. Short + high-value → print bodies.
for h in .git/hooks/*; do
  [ -f "$h" ] || continue
  case "$h" in *.sample) continue ;; esac
  echo "--- active git hook: $h ---"; cat "$h"; echo "---"
done
# VSCode auto-runs tasks.json on "trust repo" / folderOpen, and honors settings.json.
find . -maxdepth 4 "${PRUNE[@]}" -type f \( -path '*/.vscode/tasks.json' \
  -o -path '*/.vscode/settings.json' -o -path '*/.vscode/launch.json' \) \
  -exec sh -c 'for f; do echo "--- $f ---"; cat "$f"; echo "---"; done' _ {} + 2>/dev/null
dump .envrc
# List (do not dump) the rest of the auto-exec surface for manual review.
echo "-- also review by hand: --"
find . -maxdepth 3 "${PRUNE[@]}" -type f \( \
  -name package.json -o -name Makefile -o -name setup.py -o -name pyproject.toml \
  -o -name 'Dockerfile*' -o -name 'docker-compose*' -o -name conftest.py \) 2>/dev/null
find . -maxdepth 3 "${PRUNE[@]}" -type d \( \
  -name .husky -o -name .devcontainer -o -name .github \) 2>/dev/null

echo
echo "== 2. AI-agent instruction files (loaded as INSTRUCTIONS by your agent) =="
echo "   These carry ~system-prompt authority. Read every line before opening the"
echo "   repo in Claude Code / Cursor / Copilot / etc."
found_ai=""
while IFS= read -r f; do found_ai=1; dump "$f"; done < <(
  find . -maxdepth 4 "${PRUNE[@]}" -type f \( \
    -iname 'CLAUDE.md' -o -iname 'AGENTS.md' -o -iname 'GEMINI.md' \
    -o -iname '.cursorrules' -o -iname '.clinerules' -o -iname '.windsurfrules' \
    -o -iname 'copilot-instructions.md' -o -iname '.aider.conf.yml' \
    -o -iname '.mcp.json' -o -path '*/.cursor/rules/*' \) 2>/dev/null)
[ -z "$found_ai" ] && echo "  none"

echo
echo "== 3. npm / pip lifecycle scripts (fire on install) =="
find . -name package.json "${PRUNE[@]}" -maxdepth 3 \
  -exec sh -c 'for f; do echo "-- $f --"; command -v jq >/dev/null && jq -r ".scripts // {}" "$f" 2>/dev/null || grep -nA20 "\"scripts\"" "$f"; done' _ {} + 2>/dev/null || echo "  none"

echo
echo "== 4. Fetch-and-run / reverse shell / DNS-TXT second-stage =="
"${G[@]}" '(curl|wget)[^|]*\|[[:space:]]*(ba)?sh|/dev/tcp/|bash -i|nc [^ ]*-e|dig[[:space:]].*txt|nslookup|Invoke-Expression|DownloadString|Net\.WebClient|base64 [^|]*\|[[:space:]]*(ba)?sh|vercel\.app|(bit\.ly|tinyurl|is\.gd|t\.co)/' . || echo "  none"

echo
echo "== 5. Dynamic exec / deserialization / decode-then-run =="
"${G[@]}" 'eval\(|exec\(|child_process|os\.system|subprocess|Function\(|atob\(|fromCharCode|__import__|pickle\.loads|marshal\.loads|compile\(' . || echo "  none"

echo
echo "== 6. Obfuscation heuristics (minified payloads / big encoded blobs) =="
# Very long single lines = classic hiding spot for an obfuscated stage-2.
find . "${PRUNE[@]}" -type f \( -name '*.js' -o -name '*.mjs' -o -name '*.ts' \
  -o -name '*.py' -o -name '*.sh' -o -name '*.json' \) -size -2M \
  -exec awk 'length>800{print FILENAME":"FNR"  ("length" chars — possible minified/obfuscated payload)"}' {} + 2>/dev/null | head -20 || true
# Long base64/hex literals embedded in code.
"${G[@]}" '[A-Za-z0-9+/]{220,}={0,2}' . 2>/dev/null | head -10 || echo "  no long base64 blobs"

echo
echo "== 7. Text aimed at an AI assistant (prompt injection) =="
"${G[@]}" 'ignore (the )?(previous|prior|above) instructions|system prompt|you are now|disregard (all|previous)|do not (tell|mention|inform) the user|instructions to (claude|copilot|cursor|the agent|the assistant)' . || echo "  none"

echo
echo "== 8. Secret / credential / wallet exfil targets referenced =="
"${G[@]}" 'id_rsa|\.ssh/|\.aws/|aws_secret|\.env|/etc/passwd|ANTHROPIC_API_KEY|OPENAI_API_KEY|GITHUB_TOKEN|credentials|keychain|wallet|mnemonic|seed[ _]?phrase|keepass|1password|metamask|Login Data|leveldb|cookies\.sqlite' . || echo "  none"

echo
echo "== 9. Hidden unicode (zero-width / bidi / tag chars — invisible injection) =="
python3 - <<'PY' 2>/dev/null || echo "  (python3 not available — skipped)"
import os
bad={0x200b,0x200c,0x200d,0x200e,0x200f,0x202a,0x202b,0x202c,0x202d,0x202e,
     0x2060,0x2066,0x2067,0x2068,0x2069,0xfeff}
found=False
for root,_,files in os.walk('.'):
    if '/.git' in root or '/node_modules' in root: continue
    for f in files:
        p=os.path.join(root,f)
        try: t=open(p,encoding='utf-8').read()
        except Exception: continue
        # zero-width/bidi set OR Unicode Tags block (U+E0000..U+E007F)
        hits={hex(ord(c)) for c in t if ord(c) in bad or 0xE0000<=ord(c)<=0xE007F}
        if hits:
            found=True; print(f"  {p}: {sorted(hits)}")
if not found: print("  none")
PY

echo
echo "== done — review every hit above by hand before you install, build, run, or"
echo "   open this repo in an AI coding agent. When in doubt, do it in a throwaway VM. =="
