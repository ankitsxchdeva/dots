#   _______| |__  _ __ ___ 
#  |_  / __| '_ \| '__/ __|
# _ / /\__ \ | | | | | (__ 
#(_)___|___/_| |_|_|  \___|


export PATH="/opt/homebrew/sbin:$PATH"
autoload -U colors && colors
export CLICOLOR=1
export EDITOR='vim'


# Simple non-starship prompt
arrow_color=$fg_bold[red]
PS1="%{$arrow_color%}➜ %{$fg[blue]%}%c %(?..[%?] )"
# starship prompt
#eval "$(starship init zsh)"

# Basic Setup
alias   v="vim"
alias   vi="vim"
alias   ls="ls -p"
alias   la="ls -a -p"
alias   clr="clear"
alias   rf="rm -rf"

# Utils
alias   lofi="mpv --no-video --volume=100 'https://www.youtube.com/watch?v=5qap5aO4i9A'"
alias   weather="curl -s wttr.in/Austin+TX | head -n 7 | tail -n 5"
alias   battery="pmset -g batt"
alias   clockf="date +%r"
alias   clock="tty-clock -c -C 4 -t"
alias   wordc="pbpaste | wc -w"
alias   shee="tree -L 1" 
alias   stonks="curl https://terminal-stocks.herokuapp.com/market-summary"
alias   grip="grip --quiet -b"
alias   scrot="screencapture ~/Documents/$(date "+%m.%d-%H.%M.%S").png"
alias   discord="open -a discord"
alias   youtube-dl="yt-dlp"
alias   mt="open http://monkeytype.com"

function mkcd() {
    if [[ -z "$1" ]]; then
        echo "No directory name provided"
        return 1
    fi
    mkdir -p "$1" && cd "$1"
}

# Shortcuts
alias   removeDock="defaults write com.apple.dock autohide-delay -float 1000; killall Dock"
alias   fmail="open https://mail.google.com/mail/u/0/#inbox; open https://mail.google.com/mail/u/1/#inbox; open https://calendar.google.com/calendar/u/0/r"

# Python stuff
alias pip="pip3"
alias py="python3"
alias python="python3"

# History
HISTSIZE=100000
SAVEHIST=100000
HISTFILE=~/.zsh_history
setopt SHARE_HISTORY          # live-share history across open shells
setopt HIST_IGNORE_ALL_DUPS   # drop older duplicate commands
setopt HIST_IGNORE_SPACE      # leading space = don't record (handy for secrets)
setopt HIST_REDUCE_BLANKS
setopt EXTENDED_HISTORY        # record timestamps
setopt INC_APPEND_HISTORY

# Navigation
setopt AUTO_CD                 # type a dir name to cd into it
setopt AUTO_PUSHD              # cd maintains a dir stack (cd -2, etc.)
setopt PUSHD_IGNORE_DUPS
setopt PUSHD_SILENT

# Autocomplete
autoload -Uz compinit
# Only run the slow security check once a day; use the cache otherwise
if [[ -n ~/.zcompdump(#qN.mh+24) ]]; then compinit; else compinit -C; fi
zmodload zsh/complist
zstyle ':completion:*' menu select
zstyle ':completion:*' matcher-list 'm:{[:lower:][:upper:]}={[:upper:][:lower:]}' 'm:{[:lower:][:upper:]}={[:upper:][:lower:]} l:|=* r:|=*'
zstyle ':completion:*' list-suffixes
zstyle ':completion:*' expand prefix suffix
_comp_options+=(globdots)

# Plugins
source ~/.zsh_plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
[ -f ~/.zsh_plugins/zsh-autosuggestions/zsh-autosuggestions.zsh ] && \
    source ~/.zsh_plugins/zsh-autosuggestions/zsh-autosuggestions.zsh

# FZF + ripgrep
if type rg > /dev/null; then
    export FZF_DEFAULT_COMMAND='rg --files'
    export FZF_DEFAULT_OPTS='-m --height 50% --border'
fi
# fzf keybindings + completion (Ctrl-R history, Ctrl-T files, Alt-C cd)
if (( $+commands[fzf] )); then
    if fzf --zsh > /dev/null 2>&1; then
        source <(fzf --zsh)
    elif [ -f ~/.fzf.zsh ]; then
        source ~/.fzf.zsh
    fi
fi

# Modern CLI tools (only override if installed, so this stays portable)
if (( $+commands[eza] )); then
    alias ls="eza --group-directories-first"
    alias la="eza -a --group-directories-first"
    alias ll="eza -lah --group-directories-first --git"
    alias tree="eza --tree"
fi
if (( $+commands[bat] )); then
    alias cat="bat --paging=never"
    export MANPAGER="sh -c 'col -bx | bat -l man -p'"   # syntax-highlighted man pages
    export MANROFFOPT="-c"                               # fix formatting gaps in man output
fi
(( $+commands[zoxide] )) && eval "$(zoxide init zsh)"

# Dynaconnections specific stuff
[ -f ~/.server_aliases ] && source ~/.server_aliases
alias   cddc="cd /mnt/c/Users/AnkitSachdeva/Documents/dc/"


### ---- dev env (clean) ----

# Core locations (adjust if needed)
export JAVA_HOME="/Library/Java/JavaVirtualMachines/jdk-1.8.jdk/Contents/Home"
export TOMCAT_HOME="$HOME/Documents/dc/tomcat-8.5.96"

# Oracle — pick ONE location and stick to it
export ORACLE_CLIENT="$HOME/Documents/instantclient_23_3"
# Use zsh's path array + de-dupe
typeset -U path

# IMPORTANT: define the full order explicitly (do NOT append $path here)
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

  # Your toolchains
  "$JAVA_HOME/bin"
  "$TOMCAT_HOME/bin"
  "$HOME/.cargo/bin"
  "$ORACLE_CLIENT"
)

# Oracle Instant Client needs its libs on the dynamic linker path
export DYLD_LIBRARY_PATH="$ORACLE_CLIENT:$DYLD_LIBRARY_PATH"

export PATH="/Library/TeX/texbin:$PATH"

# Added by codebase-memory-mcp install
export PATH="$HOME/.local/bin:$PATH"
