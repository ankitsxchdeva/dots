# Prompt
autoload -U colors && colors
PS1="%{$fg_bold[red]%}➜ %{$fg[blue]%}%c "
export CLICOLOR=1

# Basic Setup
alias   ls="tree -L 1"
alias   vi="vim"

# Utils
alias   weather="curl -s wttr.in | head -n 7 | tail -n 5"
alias   battery="pmset -g batt"
alias   clock="date +%r"
alias   clockf="tty-clock -c -C 4 -t"
alias   wordc="pbpaste | wc -w"

# Shortcuts
alias   resource="source ~/.zshrc"
alias   removeDock="defaults write com.apple.dock autohide-delay -float 1000; killall Dock"
alias   updateDots="cd; cp .zshrc ~/Documents/dots; cp .vimrc ~/Documents/dots; cp .tmux.conf ~/Documents/.tmux.conf; cd Documents/dots; git add .; git commit -m 'updated automatically'; git push; cd"

# SSH setup
alias   ssh1="ssh ankit@192.168.1.79"        # Home-local  (manjaro 21.0.7)
alias   ssh2="ssh ankit@162.229.184.109"     # Home-global (ubuntu 20.04.2)
alias   ssh3="ssh asachde2@unix.ucsc.edu"    # UCSC-global (CentOs 3.10.0)

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
