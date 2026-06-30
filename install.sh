#!/bin/bash

set -eu

stow_home() {
    stow --restow -vt ~ git tmux vim zsh
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

main() {
    stow_home
    stow_config
    install_plugins
    echo "Installation complete!"
}

main

