#!/bin/bash

set -eu

unstow_home() {
    stow -D -vt ~ git tmux vim zsh
}

unstow_config() {
    stow -D -vt ~/.config starship ghostty
}

remove_plugins() {
    local zsh_plugins_dir=~/.zsh_plugins
    if [ -d "$zsh_plugins_dir/zsh-syntax-highlighting" ]; then
        rm -rf "$zsh_plugins_dir/zsh-syntax-highlighting"
    fi
    if [ -d "$zsh_plugins_dir/gitstatus" ]; then
        rm -rf "$zsh_plugins_dir/gitstatus"
    fi
    # Optionally remove the whole plugin dir if it's now empty
    if [ -d "$zsh_plugins_dir" ] && [ -z "$(ls -A "$zsh_plugins_dir")" ]; then
        rmdir "$zsh_plugins_dir"
    fi
}

main() {
    unstow_home
    unstow_config
    remove_plugins
    echo "Uninstall complete!"
}

main

