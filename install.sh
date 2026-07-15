#!/bin/bash

set -eu

command -v stow >/dev/null || { echo "install stow first (e.g. brew install stow)"; exit 1; }

BACKUP_SUFFIX="bak.$(date +%Y%m%d%H%M%S)"

# Physical path of a file: resolves symlinks in the *directory* portion, keeping
# the final component as-is (so a symlinked file is reported at its own location).
phys() {
    ( cd "$(dirname "$1")" && printf '%s/%s\n' "$(pwd -P)" "$(basename "$1")" )
}

# True if stow itself would skip this path — it IS the package's
# .stow-local-ignore, or is listed in it. Then it's not ours to back up either.
stow_ignored() {
    local pkg="$1" rel="$2" pat
    [ "$rel" = ".stow-local-ignore" ] && return 0
    [ -f "$pkg/.stow-local-ignore" ] || return 1
    while IFS= read -r pat; do
        [ -n "$pat" ] || continue
        case "$rel" in "$pat"|"$pat"/*) return 0 ;; esac
    done < "$pkg/.stow-local-ignore"
    return 1
}

# Back up any target that already exists as a real, unmanaged regular file so
# `stow` won't abort on the conflict. The old content is preserved as
# <file>.bak.<timestamp> for manual reconciliation. Repo is the source of truth.
backup_conflicts() {
    local target="$1"; shift
    local pkg file rel dest
    for pkg in "$@"; do
        find "$pkg" -type f | while IFS= read -r file; do
            rel="${file#"$pkg"/}"
            stow_ignored "$pkg" "$rel" && continue
            dest="$target/$rel"
            [ -e "$dest" ] || continue          # nothing there
            [ -L "$dest" ] && continue          # already a symlink
            # A folded parent symlink can make the repo's own file appear as a
            # plain file at the target — that's already stowed, not a conflict.
            [ "$(phys "$dest")" = "$(phys "$file")" ] && continue
            mv "$dest" "$dest.$BACKUP_SUFFIX"
            echo "BACKUP: $dest => $dest.$BACKUP_SUFFIX"
        done
    done
}

clean_ds_store() {
    # Finder drops .DS_Store files into package dirs; stow chokes on them.
    find . -name '.DS_Store' -not -path './.git/*' -delete
}

stow_home() {
    # `claude` folds CLAUDE.md, settings, statusline, hooks and commands into
    # the existing ~/.claude dir, leaving Claude Code's runtime state untouched.
    backup_conflicts ~ claude git tmux vim zsh
    stow --restow -vt ~ claude git tmux vim zsh
}

stow_config() {
    # starship disabled (native zsh prompt instead)
    backup_conflicts ~/.config ghostty lazygit yazi
    stow --restow -vt ~/.config ghostty lazygit yazi
}

install_plugins() {
    local zsh_plugins_dir=~/.zsh_plugins
    mkdir -p "$zsh_plugins_dir"
    if [ ! -d "$zsh_plugins_dir/zsh-syntax-highlighting" ]; then
        git clone --depth=1 https://github.com/zsh-users/zsh-syntax-highlighting.git "$zsh_plugins_dir/zsh-syntax-highlighting"
    fi
    if [ ! -d "$zsh_plugins_dir/zsh-autosuggestions" ]; then
        git clone --depth=1 https://github.com/zsh-users/zsh-autosuggestions.git "$zsh_plugins_dir/zsh-autosuggestions"
    fi
}

install_git_hooks() {
    # Symlink the leak-guard into this repo's .git/hooks so commits are scanned
    # for secrets / internal strings before they land.
    local dots
    dots="$(cd "$(dirname "$0")" && pwd)"
    [ -d "$dots/.git" ] || return 0
    ln -sf ../../git/hooks/pre-commit "$dots/.git/hooks/pre-commit"
}

main() {
    cd "$(dirname "$0")"
    clean_ds_store
    stow_home
    stow_config
    install_plugins
    install_git_hooks
    echo "Installation complete!"
}

main

