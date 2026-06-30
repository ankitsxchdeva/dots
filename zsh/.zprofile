#                          __ _ _
#  ____ __ _ _ ___  / _(_) |___
# |_ /| '_ \ '_/ _ \ |  _| | / -_)
# /__|| .__/_| \___/ |_| |_|_\___|
#     |_|
#
# Login-shell ENVIRONMENT. Sourced once per login shell, before .zshrc.
# Environment variables (PATH, toolchain homes, EDITOR, …) live here so they
# are inherited by every program — including non-interactive ones. Aliases,
# functions, the prompt, completion and plugins stay in .zshrc.

# Homebrew (Apple Silicon) — sets PATH / MANPATH / INFOPATH and HOMEBREW_*.
eval "$(/opt/homebrew/bin/brew shellenv)"

export CLICOLOR=1
export EDITOR='vim'

# Point XDG-aware tools at ~/.config (the conventional default). On macOS
# lazygit otherwise reads ~/Library/Application Support/lazygit — this makes it
# pick up the stowed ~/.config/lazygit/config.yml instead.
export XDG_CONFIG_HOME="$HOME/.config"

# Define PATH explicitly and de-dupe (first occurrence wins).
typeset -U path
path=(
  # Homebrew (Apple Silicon) FIRST — must precede /usr/bin so brew's python,
  # git, vim, … win over the older macOS system copies (e.g. system python3 is
  # 3.9; brew's is current). This matches what `brew shellenv` does.
  /opt/homebrew/bin
  /opt/homebrew/sbin

  # System
  /usr/local/bin
  /usr/bin
  /bin
  /usr/sbin
  /sbin

  # Toolchains
  "$HOME/.cargo/bin"
)

# Prepend user/TeX bins so they win over the system copies
export PATH="/Library/TeX/texbin:$PATH"
export PATH="$HOME/.local/bin:$PATH"

# Machine-local / work-specific environment: toolchain homes (JAVA_HOME,
# Tomcat, Oracle), extra PATH entries, DYLD libs, … Kept out of the tracked
# repo — see ~/.zprofile.local. Sourced last so it can append to $path.
[ -f ~/.zprofile.local ] && source ~/.zprofile.local
