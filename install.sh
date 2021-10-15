#!/bin/bash

set -eu
stow -vt ~ git tmux vim zsh alacritty
cd
mkdir .zsh_plugins
cd .zsh_plugins
git clone git@github.com:zsh-users/zsh-syntax-highlighting.git


