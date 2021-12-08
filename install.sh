#!/bin/bash

set -eu

stow -vt ~ git tmux vim zsh #alacritty kitty
stow -vt ~/.config starship

if [ ! -d ~/.zsh_plugins ]; then
    mkdir ~/.zsh_plugins
fi
if [ ! -d ~/.zsh_plugins/zsh-syntax-highlighting ]; then 
    git clone git@github.com:zsh-users/zsh-syntax-highlighting.git ~/.zsh_plugins/zsh-syntax-highlighting
    git clone --depth=1 https://github.com/romkatv/gitstatus.git ~/.zsh_plugins/gitstatus
fi
echo "done!"

