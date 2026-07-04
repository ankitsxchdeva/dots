#!/bin/bash
#
# bootstrap.sh — one command, fresh Mac → fully configured.
#
#   curl -fsSL https://raw.githubusercontent.com/ankitsxchdeva/dots/main/bootstrap.sh | bash
#
# Installs Homebrew (+ Xcode Command Line Tools) if missing, clones this repo,
# then runs brew bundle + install.sh (which backs up any conflicting dotfiles)
# and offers to apply macos.sh. Safe to re-run: it pulls instead of re-cloning.

set -euo pipefail

REPO_URL="https://github.com/ankitsxchdeva/dots.git"
DOTS="${HOME}/.dots"

log()  { printf '\033[0;36m▸\033[0m %s\n' "$1"; }
warn() { printf '\033[0;33m!\033[0m %s\n' "$1"; }

# ── Homebrew (also pulls in the Xcode Command Line Tools) ────────────────
if ! command -v brew >/dev/null 2>&1; then
    log "Installing Homebrew (this also installs the Xcode CLT)…"
    NONINTERACTIVE=1 /bin/bash -c \
      "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi
# Make brew available for the rest of this run (Apple Silicon path).
[ -x /opt/homebrew/bin/brew ] && eval "$(/opt/homebrew/bin/brew shellenv)"
[ -x /usr/local/bin/brew ]    && eval "$(/usr/local/bin/brew shellenv)"

# ── Clone (or update) the repo ───────────────────────────────────────────
if [ -d "$DOTS/.git" ]; then
    log "Updating existing checkout at $DOTS"
    git -C "$DOTS" pull --ff-only
else
    log "Cloning dotfiles into $DOTS"
    git clone "$REPO_URL" "$DOTS"
fi
cd "$DOTS"

# ── Packages, then symlinks ──────────────────────────────────────────────
log "Installing packages with brew bundle"
brew bundle --file=apple/Brewfile || warn "some packages failed — re-run 'brew bundle' later"

# stow is the one hard dependency for linking; everything else can wait.
command -v stow >/dev/null 2>&1 || { warn "stow is missing — cannot link dotfiles"; exit 1; }

log "Linking dotfiles (install.sh)"
./install.sh

# ── Optional: macOS system preferences ───────────────────────────────────
# Skip the prompt when piped from curl with no TTY; the user can run it later.
if [ -t 0 ]; then
    printf '\n'
    read -r -p "Apply macOS system settings now? (defaults write …) [y/N] " reply
    case "$reply" in
        [yY]*) ./macos.sh ;;
        *)     log "Skipped. Run ./macos.sh later to apply them." ;;
    esac
else
    log "Non-interactive shell — skipping macos.sh. Run it later: cd ~/.dots && ./macos.sh"
fi

printf '\n'
log "Bootstrap complete. Open a new terminal to load the new shell."
