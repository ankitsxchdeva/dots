#!/bin/bash

set -eu
ssh-keygen -t ed25519 -C "ankitsachdeva001@gmail.com"
eval "$(ssh-agent -s)"
echo "Host *
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519" >> ~/.ssh/config
ssh-add ~/.ssh/id_ed25519
pbcopy < ~/.ssh/id_ed25519.pub