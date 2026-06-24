# dots

My macOS dotfiles, managed with [GNU stow](https://www.gnu.org/software/stow/).

## Setup

1. `git clone git@github.com:ankitsxchdeva/dots.git ~/.dots`
2. `cd ~/.dots && sh install.sh`

`install.sh` symlinks the configs into place and clones the zsh plugins
(`zsh-syntax-highlighting`, `zsh-autosuggestions`). Vim plugins auto-install on
first launch via vim-plug (or run `vim +PlugInstall +qa`).

The zsh config is split: `~/.zprofile` holds environment (PATH, `EDITOR`,
toolchain homes) so it is inherited by every shell, and `~/.zshrc` holds the
interactive bits (aliases, functions, prompt, completion, plugins). If you
already have a hand-written `~/.zprofile`, remove it before re-stowing so stow
can link this one in: `rm ~/.zprofile && sh install.sh`.

## macOS

> Menu paths below are for **System Settings** on macOS 26 (Tahoe). On older
> releases the panes are named the same but live under "System Preferences".

### Homebrew & packages

1. Install [Homebrew](https://brew.sh) — this also installs the Xcode Command
   Line Tools (or run `xcode-select --install` yourself).
2. Run `install.sh` (above).
3. Install packages: `brew bundle --file=apple/Brewfile`.
   - The Brewfile flags which casks are work-only vs. personal — comment out the
     ones you don't want before bundling.

### System Settings

- **Trackpad → Scroll & Zoom** and **Mouse** → turn *Natural scrolling* **off**.
- **Desktop & Dock** → *Automatically hide and show the Dock* **on**; drag the
  Dock **Size** to the smallest setting.
- **Control Center → Menu Bar** → *Automatically hide and show the menu bar* →
  **Always**. Remove everything else you don't need from the menu bar
  (⌘-drag items out, or toggle them off per-app in Control Center).
- **Displays → Night Shift…** → schedule *Sunset to Sunrise*.

### Finder

Match the screenshots in [`apple/finder/`](apple/finder):

- Show the path bar and status bar (View menu).
- Show hidden files: ⌘⇧. (period).
- Set "New Finder windows show" to your home/preferred folder.
- Default to list view and "Keep folders on top".

### Keyboard & Karabiner

Reference screenshots in [`apple/general/keyboard/`](apple/general/keyboard).

- **Keyboard → Keyboard Shortcuts… → Modifier Keys** → remap **Caps Lock →
  Control**.
- **Trackpad** → enable tap to click / tracking speed to taste (see
  `touchbar.png` / `keyboard.png`).
- Install **Karabiner-Elements** (`brew install --cask karabiner-elements`) and:
  - swap **backslash ⇄ delete** (see `karabiner.png`).
  - remove its icon from the menu bar (Karabiner-Elements → Preferences →
    *Show icon in menu bar* off).

### Apps

- **Magnet** — install from the App Store; window-snap configs are in
  [`apple/magnet/`](apple/magnet).
- **Alfred** — set its preferences (sync) folder to `~/.dots/alfred/`.
- **MonitorControl** (`brew install --cask monitorcontrol`) — control external
  display brightness/volume from the menu bar.
- **Firefox**:
  - Sign in / sync, then add the extensions you want and remove the bundled ones.
  - Enable **Compact** density (Customize Toolbar… → *Density → Compact*).
  - Default zoom **80%** (Settings → General → Zoom).
  - Bookmarks toolbar → **Never Show**.
  - Settings → Search → uncheck *Suggestions from sponsors*; turn off sponsored
    shortcuts on the new-tab page.

### Network

- Change DNS to Google: `8.8.8.8` / `8.8.4.4`
  (**Network → Wi-Fi/Ethernet → Details… → DNS**).
