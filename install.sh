#!/bin/bash

set -eu
cd ~/.dots
stow -vt ~ git tmux vim zsh alacritty
cd
if [ ! -d ~/.zsh_plugins ]; then
    mkdir .zsh_plugins
fi
cd .zsh_plugins
if [ ! -d ~/.zsh_plugins/zsh-syntax-highlighting ]; then 
    git clone git@github.com:zsh-users/zsh-syntax-highlighting.git
fi
cd
if [[ $OSTYPE == 'darwin'* ]] ; then
    which -s brew
    if [[ $? != 0 ]] ; then
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    else
        brew update
    cd ~/.dots/apple
    brew bundle
    fi
cd
fi;

