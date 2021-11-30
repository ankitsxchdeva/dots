#!/bin/bash

set -eu
cd
if [ ! -d ~/.zsh_plugins ]; then
    mkdir .zsh_plugins
fi
cd .zsh_plugins
if [ ! -d ~/.zsh_plugins/zsh-syntax-highlighting ]; then 
    git clone git@github.com:zsh-users/zsh-syntax-highlighting.git
fi
cd ~/.dots
stow -vt ~ git tmux vim zsh #alacritty kitty
#stow -vt ~/.config/kitty kitty
stow -vt ~/.config starship
echo "done!"

