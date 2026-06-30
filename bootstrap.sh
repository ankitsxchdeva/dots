#!/bin/bash
#
# bootstrap.sh — one command, fresh Mac → fully configured.
#
#   curl -fsSL https://raw.githubusercontent.com/ankitsxchdeva/dots/main/bootstrap.sh | bash
#
# Installs Homebrew (+ Xcode Command Line Tools) if missing, clones this repo,
# backs up any conflicting dotfiles, then runs brew bundle + install.sh and
# offers to apply macos.sh. Safe to re-run: it pulls instead of re-cloning and
# only backs up real files (never clobbers existing symlinks).

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

# ── Back up conflicting real files so stow can link cleanly ──────────────
# stow refuses to overwrite a regular file. Move any pre-existing ones aside;
# leave existing symlinks alone (re-stowing those is a no-op).
backup_conflicts() {
    local stamp f
    stamp="$(date +%Y%m%d-%H%M%S)"
    for f in .gitconfig .gitignore_global .tmux.conf .vimrc .zprofile .zshrc .hushlogin .claude/CLAUDE.md .claude/settings.json; do
        if [ -e "$HOME/$f" ] && [ ! -L "$HOME/$f" ]; then
            warn "backing up existing ~/$f → ~/$f.pre-dots.$stamp"
            mv "$HOME/$f" "$HOME/$f.pre-dots.$stamp"
        fi
    done
}
backup_conflicts

# ── Packages, then symlinks ──────────────────────────────────────────────
log "Installing packages with brew bundle"
brew bundle --file=apple/Brewfile

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
