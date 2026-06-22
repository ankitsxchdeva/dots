# dots

My macOS dotfiles, managed with [GNU stow](https://www.gnu.org/software/stow/).

## Setup
1. `git clone git@github.com:ankitsxchdeva/dots.git ~/.dots`
2. `cd ~/.dots && sh install.sh`

`install.sh` symlinks the configs into place and clones the zsh plugins
(`zsh-syntax-highlighting`, `zsh-autosuggestions`, `gitstatus`). Vim plugins
auto-install on first launch via vim-plug (or run `vim +PlugInstall +qa`).

## Mac specific
1. Install [Homebrew](https://brew.sh)
2. Run `install.sh` (above)
3. Install packages: `brew bundle --file=apple/Brewfile`
4. Mouse -> natural scrolling -> off
5. (MBP) Copy karabiner-elements settings
6. Desktop & Dock -> auto hide -> on, set size to smallest
7. Control Center -> auto hide
8. Install Magnet from the App Store (configs in `apple/magnet/`)
9. Set Alfred's preferences folder to `~/.dots/alfred/`
10. Change DNS to Google (`8.8.8.8` / `8.8.4.4`)
