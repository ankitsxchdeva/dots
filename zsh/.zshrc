#   _______| |__  _ __ ___ 
#  |_  / __| '_ \| '__/ __|
# _ / /\__ \ | | | | | (__ 
#(_)___|___/_| |_|_|  \___|

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
HISTSIZE=10000
SAVEHIST=10000
HISTFILE=~/.zsh_history

# Autocomplete
autoload -U compinit
zstyle ':completion:*' menu select
zstyle ':completion:*' matcher-list 'm:{[:lower:][:upper:]}={[:upper:][:lower:]}' 'm:{[:lower:][:upper:]}={[:upper:][:lower:]} l:|=* r:|=*' 'm:{[:lower:][:upper:]}={[:upper:][:lower:]} l:|=* r:|=*' 'm:{[:lower:][:upper:]}={[:upper:][:lower:]} l:|=* r:|=*' 
zstyle ':completion:*' list-suffixes zstyle ':completion:*' expand prefix suffix 
zmodload zsh/complist
compinit
_comp_options+=(globdots)

# Plugins
source ~/.zsh_plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# FZF + repgrep
if type rg > /dev/null; then
    export FZF_DEFAULT_COMMAND='rg --files'
    export FZF_DEFAULT_OPTS='-m --height 50% --border'
fi
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

ARM="/usr/local/bin/gcc-arm-none-eabi-7-2017-q2-update/bin:${PATH}"
export ARM
export PATH="/usr/local/sbin:$PATH"
export PATH="/opt/homebrew/opt/node@16/bin:$PATH"
export PATH="/Users/ankit/.cargo/bin:$PATH"

# Dynaconnections specific stuff
[ -f ~/.server_aliases ] && source ~/.server_aliases
alias   cddc="cd /mnt/c/Users/AnkitSachdeva/Documents/dc/"
