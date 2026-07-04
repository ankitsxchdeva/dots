#!/bin/bash

set -eu

unstow_home() {
    stow -D -vt ~ claude git tmux vim zsh
}

unstow_config() {
    stow -D -vt ~/.config ghostty lazygit
}

remove_plugins() {
    local zsh_plugins_dir=~/.zsh_plugins
    for plugin in zsh-syntax-highlighting zsh-autosuggestions; do
        rm -rf "$zsh_plugins_dir/$plugin"
    done
    # Remove the plugin dir if it's now empty
    if [ -d "$zsh_plugins_dir" ] && [ -z "$(ls -A "$zsh_plugins_dir")" ]; then
        rmdir "$zsh_plugins_dir"
    fi
}

remove_git_hooks() {
    # Undo the pre-commit symlink install.sh created — only if it's ours.
    local hook=.git/hooks/pre-commit
    if [ -L "$hook" ] && [ "$(readlink "$hook")" = "../../git/hooks/pre-commit" ]; then
        rm "$hook"
    fi
}

main() {
    cd "$(dirname "$0")"
    unstow_home
    unstow_config
    remove_plugins
    remove_git_hooks
    echo "Uninstall complete!"
}

main

