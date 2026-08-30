#!/bin/bash
#
# doctor.sh — drift check. Verifies the REQUIRED Brewfile set is installed,
# every tool the stowed configs depend on is on PATH, and no stow symlink
# into this repo is dangling.

set -euo pipefail
cd "$(dirname "$0")"

log()  { printf '\033[0;36m▸\033[0m %s\n' "$1"; }
warn() { printf '\033[0;33m!\033[0m %s\n' "$1"; }

status=0

log "Checking Brewfile (REQUIRED set)"
brew bundle check --file=apple/Brewfile --verbose || status=1

log "Checking tools the stowed configs depend on"
for formula in $(sed -n '/═══ REQUIRED/,/═══ OPTIONAL/p' apple/Brewfile | awk -F'"' '/^brew /{print $2}'); do
    case "$formula" in                       # formula name ≠ binary name
        ripgrep)   bin="rg" ;;
        git-delta) bin="delta" ;;
        *)         bin=$formula ;;
    esac
    command -v "$bin" >/dev/null || { warn "missing: $bin (brew \"$formula\")"; status=1; }
done

log "Checking Playwright CLI (pi browser tooling)"
if command -v npx >/dev/null 2>&1; then
    npx -y @playwright/cli@latest --version >/dev/null 2>&1 \
        || { warn "@playwright/cli won't run via npx — check node/npm"; status=1; }
    ls -d ~/Library/Caches/ms-playwright/chromium-* >/dev/null 2>&1 \
        || { warn "chromium missing — run: npx @playwright/cli install-browser chromium"; status=1; }
else
    warn "npx not found — @playwright/cli needs node"; status=1
fi

log "Checking for broken stow symlinks"
while IFS= read -r link; do
    case "$(readlink "$link")" in
        *.dots/*) warn "broken link: $link"; status=1 ;;
    esac
done < <(find ~ ~/.claude ~/.config -maxdepth 1 -type l ! -exec test -e {} \; -print 2>/dev/null)

[ "$status" -eq 0 ] && log "No drift — all checks passed." || warn "Drift detected — see above."
exit "$status"
