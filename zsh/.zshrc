#   _______| |__  _ __ ___ 
#  |_  / __| '_ \| '__/ __|
# _ / /\__ \ | | | | | (__ 
#(_)___|___/_| |_|_|  \___|


autoload -U colors && colors

# Standard terminal line editing (the conventional default: backspace deletes
# freely, arrows recall history, ^A/^E/^U/^W work). zsh only has two keymaps —
# this "emacs" one is the normal default everywhere; the other is vi. Without
# this line zsh silently picks VI keys because $EDITOR contains "vi" (vim),
# which breaks backspace. Keep it before fzf so its ^R/^T bind to this keymap.
bindkey -e

# Environment (PATH, EDITOR, toolchain homes, …) lives in ~/.zprofile so it is
# inherited by non-interactive shells too. This file is interactive-only:
# aliases, functions, prompt, completion and plugins.

# Prompt is defined at the bottom of this file: a simple native zsh prompt
# (path + arrow). starship is intentionally NOT used — it forks a subprocess
# and scans git on every render, which felt slow.

# Basic Setup
alias   v="vim"
alias   vi="vim"
alias   ls="ls -p"
alias   la="ls -a -p"
alias   clr="clear"
alias   rf="rm -rf"

# Utils
alias   weather="curl -s wttr.in/Austin+TX | head -n 7 | tail -n 5"
alias   battery="pmset -g batt"
alias   clockf="date +%r"
alias   clock="tty-clock -c -C 4 -t"
alias   wordc="pbpaste | wc -w"
alias   shee="tree -L 1"
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
    export FZF_DEFAULT_COMMAND='rg --files --hidden --glob=!.git'
fi
# Nord-themed fzf with a clean bordered, top-down layout
export FZF_DEFAULT_OPTS="
  --height 55% --layout=reverse --border=rounded --margin=0,1 --info=inline
  --prompt='  ' --pointer='▶' --marker='✓'
  --color=bg+:#3b4252,bg:#2e3440,spinner:#81a1c1,hl:#616e88
  --color=fg:#d8dee9,header:#616e88,info:#81a1c1,pointer:#88c0d0
  --color=marker:#a3be8c,fg+:#eceff4,prompt:#88c0d0,hl+:#88c0d0,border:#4c566a"
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
    alias ls="eza --group-directories-first --icons=auto"
    alias la="eza -a --group-directories-first --icons=auto"
    alias ll="eza -lah --group-directories-first --git --icons=auto"
    alias lt="eza --tree --level=2 --group-directories-first --icons=auto"
    alias tree="eza --tree --icons=auto"
fi
if (( $+commands[bat] )); then
    alias cat="bat --paging=never"
    export BAT_THEME="Nord"                              # match the Nord stack
    export MANPAGER="sh -c 'col -bx | bat -l man -p'"   # syntax-highlighted man pages
    export MANROFFOPT="-c"                               # fix formatting gaps in man output
fi
(( $+commands[zoxide] )) && eval "$(zoxide init zsh)"

# Dynaconnections specific stuff
[ -f ~/.server_aliases ] && source ~/.server_aliases
alias   cddc="cd /mnt/c/Users/AnkitSachdeva/Documents/dc/"


# ─────────────────────────────────────────────────────────────────────────
#  PROMPT — native zsh, single line: path · arrow. No git, no subprocess
#  forks — instant. (starship intentionally not used; it felt slow.)
# ─────────────────────────────────────────────────────────────────────────
autoload -Uz add-zsh-hook
zmodload zsh/datetime 2>/dev/null

# Nord palette (also used by the greeting banner + `new` below)
typeset -g _N_DIR='%F{#88c0d0}'  _N_OK='%F{#a3be8c}'   _N_WARN='%F{#ebcb8b}'
typeset -g _N_ERR='%F{#bf616a}'  _N_MUT='%F{#4c566a}'  _N_FROST='%F{#81a1c1}' _R='%f'

# Time the previous command so we can show its duration when it ran long.
_PROMPT_TIMER=0
_timer_preexec() { _PROMPT_TIMER=$EPOCHREALTIME }
add-zsh-hook preexec _timer_preexec

_set_prompt() {
    local last=$?

    # right side: how long the last command took (only shown when > 3s)
    RPROMPT=""
    if (( _PROMPT_TIMER )); then
        local e=$(( EPOCHREALTIME - _PROMPT_TIMER ))
        _PROMPT_TIMER=0
        if (( e >= 3 )); then
            local out
            if (( e >= 60 )); then printf -v out '%dm%02ds' $(( e/60 )) $(( e%60 ))
            else                   printf -v out '%.1fs' $e; fi
            RPROMPT="${_N_MUT}${out}${_R}"
        fi
    fi

    # single line:  path · arrow (green ok / red after a failure)
    # %2~ = trailing 2 dirs (e.g. dc/qa-tooling), but keeps ~ when at/near home.
    local arrow; (( last == 0 )) && arrow="${_N_OK}" || arrow="${_N_ERR}"
    PROMPT="%B${_N_DIR}%2~${_R}%b ${arrow}➜${_R} "
}
add-zsh-hook precmd _set_prompt


# ─────────────────────────────────────────────────────────────────────────
#  GREETING — instant Nord banner, shown once per new window (login shells
#  only, so tmux splits and subshells stay quiet). No forks, no latency.
# ─────────────────────────────────────────────────────────────────────────
if [[ -o interactive && -o login ]]; then
    print -P ""
    print -P "  ${_N_DIR}%B%n%b${_R} ${_N_MUT}at${_R} ${_N_FROST}%m${_R}  ${_N_MUT}·${_R}  ${_N_OK}%D{%A %d %B}${_R}  ${_N_MUT}·${_R}  ${_N_WARN}%D{%-I:%M %p}${_R}"
    print -P "${_N_MUT}${(pl:COLUMNS::─:)}${_R}"
    print -P ""
fi


# ─────────────────────────────────────────────────────────────────────────
#  new — spin up a project in one command, with a flourish.
#    new myapp          → empty project, git initialized, first commit
#    new myapp py|js|go|rs|c  → adds a starter file + language .gitignore
# ─────────────────────────────────────────────────────────────────────────
new() {
    emulate -L zsh
    local name="$1" kind="${2:-}"
    if [[ -z $name ]]; then
        print -P "${_N_ERR}usage:${_R} new <project-name> [py|js|go|rs|c]"
        return 1
    fi
    if [[ -e $name ]]; then
        print -P "${_N_ERR}✗${_R} '$name' already exists"
        return 1
    fi
    mkdir -p "$name" && cd "$name" || return 1
    git init -q
    print "# ${name}\n" > README.md
    case "$kind" in
        py) print "__pycache__/\n.venv/\n*.pyc\n.env\n.DS_Store" > .gitignore
            print "def main():\n    print(\"hello, ${name}\")\n\n\nif __name__ == \"__main__\":\n    main()" > main.py ;;
        js) print "node_modules/\ndist/\n.env\n.DS_Store" > .gitignore
            command -v npm >/dev/null && npm init -y >/dev/null 2>&1
            print "console.log(\"hello, ${name}\");" > index.js ;;
        go) print "/bin/\n*.exe\n.env\n.DS_Store" > .gitignore
            command -v go >/dev/null && go mod init "$name" >/dev/null 2>&1
            print "package main\n\nimport \"fmt\"\n\nfunc main() {\n\tfmt.Println(\"hello, ${name}\")\n}" > main.go ;;
        rs) command -v cargo >/dev/null && cargo init -q . 2>/dev/null
            [[ -f .gitignore ]] || print "/target\n.env\n.DS_Store" > .gitignore ;;
        c)  print "*.o\na.out\n/build/\n.env\n.DS_Store" > .gitignore
            print "#include <stdio.h>\n\nint main(void) {\n\tprintf(\"hello, ${name}\\\\n\");\n\treturn 0;\n}" > main.c ;;
        *)  print ".DS_Store\n*.log\n.env" > .gitignore ;;
    esac
    git add -A && git commit -qm "init: scaffold ${name}"
    print -P "${_N_OK}✓${_R} spun up ${_N_DIR}%B${name}%b${_R}${kind:+ ${_N_MUT}(${kind})${_R}} ${_N_MUT}— git initialized, first commit done${_R}"
    [[ -n $EDITOR ]] && command -v "${EDITOR%% *}" >/dev/null && "$EDITOR" .
}


# A few more veteran shortcuts
alias g="git"
alias gs="git status -sb"
alias gl="git lg"                 # pretty graph (see ~/.gitconfig alias)
alias ..="cd .."
alias ...="cd ../.."
alias path='print -l $path'       # one PATH entry per line
alias reload="exec zsh"           # reload the shell cleanly
alias ports="lsof -iTCP -sTCP:LISTEN -nP"   # what's listening
