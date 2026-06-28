#!/bin/bash

set -eu

unstow_home() {
    stow -D -vt ~ git tmux vim zsh
}

unstow_config() {
    stow -D -vt ~/.config ghostty
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

main() {
    unstow_home
    unstow_config
    remove_plugins
    echo "Uninstall complete!"
}

main

