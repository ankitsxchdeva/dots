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

# ─── dev env ─────────────────────────────────────────────────────────
export JAVA_HOME="/Library/Java/JavaVirtualMachines/jdk-1.8.jdk/Contents/Home"
export TOMCAT_HOME="$HOME/Documents/dc/tomcat-8.5.96"
export ORACLE_CLIENT="$HOME/Documents/instantclient_23_3"

# Define PATH explicitly and de-dupe (first occurrence wins).
typeset -U path
path=(
  # System first so basic tools work while sourcing
  /usr/local/bin
  /usr/bin
  /bin
  /usr/sbin
  /sbin

  # Homebrew (Apple Silicon)
  /opt/homebrew/bin
  /opt/homebrew/sbin

  # Toolchains
  "$JAVA_HOME/bin"
  "$TOMCAT_HOME/bin"
  "$HOME/.cargo/bin"
  "$ORACLE_CLIENT"
)

# Oracle Instant Client needs its libs on the dynamic linker path
export DYLD_LIBRARY_PATH="$ORACLE_CLIENT:$DYLD_LIBRARY_PATH"

# Prepend user/TeX bins so they win over the system copies
export PATH="/Library/TeX/texbin:$PATH"
export PATH="$HOME/.local/bin:$PATH"
