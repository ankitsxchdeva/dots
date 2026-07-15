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

# Homebrew — sets PATH / MANPATH / INFOPATH and HOMEBREW_*. Probe both
# prefixes (Apple Silicon, then Intel), same as the bootstrap script.
if [ -x /opt/homebrew/bin/brew ]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [ -x /usr/local/bin/brew ]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

export CLICOLOR=1
export EDITOR='vim'

# Point XDG-aware tools at ~/.config (the conventional default). On macOS
# lazygit otherwise reads ~/Library/Application Support/lazygit — this makes it
# pick up the stowed ~/.config/lazygit/config.yml instead.
export XDG_CONFIG_HOME="$HOME/.config"

# Define PATH explicitly and de-dupe (first occurrence wins). User/TeX bins
# lead so they win over system copies; homebrew ($HOMEBREW_PREFIX, set by
# shellenv above) precedes /usr/bin so brew's python, git, vim, … win over
# the older macOS system copies (e.g. system python3 is 3.9; brew's is current).
typeset -U path
path=(
  "$HOME/.local/bin" "$HOME/.cargo/bin" /Library/TeX/texbin
  "$HOMEBREW_PREFIX/bin" "$HOMEBREW_PREFIX/sbin"
  /usr/local/bin /usr/bin /bin /usr/sbin /sbin
)

# Machine-local / work-specific environment: toolchain homes (JAVA_HOME,
# Tomcat, Oracle), extra PATH entries, DYLD libs, … Kept out of the tracked
# repo — see ~/.zprofile.local. Sourced last so it can append to $path.
[ -f ~/.zprofile.local ] && source ~/.zprofile.local
