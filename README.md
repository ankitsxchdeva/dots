# dots

My macOS dotfiles, managed with [GNU stow](https://www.gnu.org/software/stow/).
A Nord-themed terminal setup: zsh + a native (subprocess-free) prompt, tmux,
vim, ghostty, git, lazygit (`lg`), and yazi (`y`).

## Layout

```
.
├── apple/      # macOS — Brewfile, terminal theme, reference screenshots
├── ghostty/    # ghostty terminal config        → ~/.config/ghostty
├── lazygit/    # lazygit TUI config (Nord)       → ~/.config/lazygit
├── yazi/       # yazi file-manager TUI (Nord)    → ~/.config/yazi
├── claude/     # Claude Code hooks + statusline  → ~/.claude
├── pi/         # pi agent: AGENTS.md, prompts, skills, extensions → ~/.pi/agent
│               #   extensions: tab-title, auto-format, magic-keywords (ultrathink/
│               #   orchestrate/workflowz), task (subagents), advisor (2nd model),
│               #   memory (per-repo facts), safety (/careful /freeze /guard),
│               #   cheatsheet (/cheatsheet platform map), upstream-watch
│               #   (session-start notice when reference clones fall behind)
│               #   browser: real-browser work via @playwright/cli in bash
│               #   (headless Chromium — see AGENTS.md "Browser & web")
│               #   skills: screen-untrusted-repo, upstream-watch (+ launchd
│               #   daily GitHub poll → ~/.pi/agent/upstream-status.json)
│               #   prompts: commit, pr, review + gstack-ported sprint workflow
│               #   (office-hours, plan-ceo-review, plan-eng-review, investigate,
│               #   cso, qa, retro)
├── sync-upstreams.sh # pull reference clones (~/src/oh-my-pi, ~/src/gstack) and
│               #   diff the files the pi config ports from — re-port on change
├── git/        # .gitconfig + global gitignore   → ~
├── tmux/       # .tmux.conf (Nord status line)   → ~
├── vim/        # .vimrc (vim-plug, Nord)         → ~
├── zsh/        # .zprofile (env) + .zshrc        → ~
├── misc/        # reference material — Makefile templates, keyboard (VIA) configs
├── bootstrap.sh # fresh Mac → fully configured, one command
├── doctor.sh    # brew bundle check + verifies tools the configs need
├── install.sh   # stow everything + clone zsh plugins
├── macos.sh     # macOS system prefs as code (defaults write)
└── uninstall.sh
```

## Setup

### Fresh machine — one command

```sh
curl -fsSL https://raw.githubusercontent.com/ankitsxchdeva/dots/main/bootstrap.sh | bash
```

`bootstrap.sh` installs Homebrew (+ Xcode CLT) if missing, clones this repo to
`~/.dots`, backs up any conflicting dotfiles, runs `brew bundle` and
`install.sh`, then offers to apply `macos.sh`. It's safe to re-run.

### Manual

1. `git clone git@github.com:ankitsxchdeva/dots.git ~/.dots`
2. `cd ~/.dots && ./install.sh`

`install.sh` backs up any conflicting real file as `<file>.bak.<timestamp>`,
symlinks the configs into place, clones the zsh plugins
(`zsh-syntax-highlighting`, `zsh-autosuggestions`), and installs the git
pre-commit hook (leak guard). Vim plugins auto-install on first launch via
vim-plug (or run `vim +PlugInstall +qa`).

The zsh config is split: `~/.zprofile` holds environment (PATH, `EDITOR`,
toolchain homes) so it is inherited by every shell, and `~/.zshrc` holds the
interactive bits (aliases, functions, prompt, completion, plugins). If you
already have a hand-written `~/.zprofile`, `install.sh` moves it aside as
`~/.zprofile.bak.<timestamp>` before stowing — reconcile from the backup.

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

### Repo hygiene (CI-enforced)

- `sync-claude-pi.sh` — the pi prompts `commit`/`pr`/`review` and the
  `screen-untrusted-repo` skill are the canonical sources; their claude/
  counterparts are generated. Edit the pi/ file, run the script, commit both.
- `npx tsc --noEmit` — typechecks `pi/.pi/agent/extensions/*.ts` against the
  published pi SDK (`npm install` first; CI runs it via `npm ci`).

Both run as GitHub Actions jobs on every push, alongside shellcheck.

### System settings — scripted

`macos.sh` scripts the system preferences (`defaults write`) so you don't have
to click through System Settings. Run it directly or let `bootstrap.sh` offer
it:

```sh
cd ~/.dots && ./macos.sh
```

It sets, among others: Dock auto-hide at smallest size, menu-bar auto-hide,
Finder (path/status bar, list view, folders-on-top, show hidden), natural
scrolling off, tap-to-click, fast key repeat (no press-and-hold), Caps Lock →
Control, screenshots as PNG in `~/Desktop` (matching the `scrot` alias), and
Google DNS on Wi-Fi. Running the script *is* the verification for these — the
only reference screenshots kept are for the genuinely manual bits: Karabiner
([`apple/general/keyboard/`](apple/general/keyboard)) and Magnet
([`apple/magnet/`](apple/magnet)).

### Manual leftovers

A few things macOS won't let a script set reliably — `macos.sh` prints these as
a checklist at the end:

- **Displays → Night Shift…** → schedule *Sunset to Sunrise*.
- **Karabiner-Elements** (`brew install --cask karabiner-elements`): swap
  **backslash ⇄ delete** (see `karabiner.png`) and hide its menu-bar icon.
- Caps Lock → Control is applied immediately via `hidutil`, but resets on
  reboot — for a permanent remap, also set it in **Keyboard → Keyboard
  Shortcuts… → Modifier Keys**.
- Trim the rest of the menu bar to taste (⌘-drag items out / toggle per-app in
  Control Center).

### Apps

- **Magnet** — install from the App Store; window-snap configs are in
  [`apple/magnet/`](apple/magnet).
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

- `macos.sh` sets Google DNS (`8.8.8.8` / `8.8.4.4`) on **Wi-Fi**. For Ethernet
  or other services, set it under **Network → … → Details… → DNS**.
