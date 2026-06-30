#!/bin/bash

set -eu

stow_home() {
    # `claude` links ~/.claude/CLAUDE.md (folds into the existing ~/.claude dir,
    # leaving Claude Code's runtime state untouched).
    stow --restow -vt ~ claude git tmux vim zsh
}

stow_config() {
    # starship disabled (native zsh prompt instead)
    stow --restow -vt ~/.config ghostty lazygit
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
    stow_home
    stow_config
    install_plugins
    install_git_hooks
    echo "Installation complete!"
}

main

