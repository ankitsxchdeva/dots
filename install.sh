#!/bin/bash

set -eu

stow_home() {
    stow --restow -vt ~ git tmux vim zsh
}

stow_config() {
    stow --restow -vt ~/.config starship ghostty
}

install_plugins() {
    local zsh_plugins_dir=~/.zsh_plugins
    if [ ! -d "$zsh_plugins_dir" ]; then
        mkdir "$zsh_plugins_dir"
    fi
    if [ ! -d "$zsh_plugins_dir/zsh-syntax-highlighting" ]; then
        git clone git@github.com:zsh-users/zsh-syntax-highlighting.git "$zsh_plugins_dir/zsh-syntax-highlighting"
        git clone --depth=1 https://github.com/romkatv/gitstatus.git "$zsh_plugins_dir/gitstatus"
    fi
}

main() {
    stow_home
    stow_config
    install_plugins
    echo "Installation complete!"
}

main

