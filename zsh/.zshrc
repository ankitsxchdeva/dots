#   _______| |__  _ __ ___ 
#  |_  / __| '_ \| '__/ __|
# _ / /\__ \ | | | | | (__ 
#(_)___|___/_| |_|_|  \___|

autoload -U colors && colors
export CLICOLOR=1
export EDITOR='vim'

# Simple non-starship prompt
#arrow_color=$fg_bold[red]
#PS1="%{$arrow_color%}➜ %{$fg[blue]%}%c %(?..[%?] )"
# starship prompt
eval "$(starship init zsh)"

# Basic Setup
alias   v="vim"
alias   vi="vim"
alias   ls="ls -p"
alias   la="ls -a -p"
alias   clr="clear"

# School VPN -- openconnect
alias   vpn-up="sudo openconnect --protocol=anyconnect --background --user=asachde2 vpn.ucsc.edu"
alias   vpn-down="sudo killall -SIGINT openconnect"

# Utils
alias   lofi="mpv --no-video --volume=100 'https://www.youtube.com/watch?v=5qap5aO4i9A'"
alias   weather="curl -s wttr.in/Santa+Cruz+CA | head -n 7 | tail -n 5"
alias   battery="pmset -g batt"
alias   clockf="date +%r"
alias   clock="tty-clock -c -C 4 -t"
alias   wordc="pbpaste | wc -w"
alias   shee="tree -L 1" 
alias   stonks="curl https://terminal-stocks.herokuapp.com/market-summary"
alias   grip="grip --quiet -b"
alias   scrot="screencapture ~/Documents/$(date "+%m.%d-%H.%M.%S").png"

# Shortcuts
alias   removeDock="defaults write com.apple.dock autohide-delay -float 1000; killall Dock"
alias   fmail="open https://mail.google.com/mail/u/0/#inbox; open https://mail.google.com/mail/u/1/#inbox; open https://calendar.google.com/calendar/u/0/r"
alias   nodrop="defaults write com.apple.screencapture disable-shadow -bool TRUE" 
alias   ahhh="defaults write -g ApplePressAndHoldEnabled -bool FALSE"
alias   no-ahhh="defaults write -g ApplePressAndHoldEnabled -bool TRUE"
alias   power-chime="defaults write com.apple.PowerChime ChimeOnAllHardware -bool true; open /System/Library/CoreServices/PowerChime.app"

# Terminal Resizing
alias   t-s="printf '\e[8;20;70t'"      # small
alias   t-r="printf '\e[8;40;130t'"     # regular
alias   t-l="printf '\e[8;60;200t'"     # large
alias   t-h="printf '\e[6;0;0t'"        # hide

# SSH setup
alias   ssh1="ssh asachde2@unix.ucsc.edu"    # UCSC-global (CentOs 3.10.0)

# Winter 2022 Classes
alias 114a="cd ~/Documents/classes/114a"

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

ARM="/usr/local/bin/gcc-arm-none-eabi-7-2017-q2-update/bin:${PATH}"
export ARM

export PATH="/usr/local/sbin:$PATH"

[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
