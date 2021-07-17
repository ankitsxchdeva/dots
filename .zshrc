# Version 1.4

# Prompt
autoload -U colors && colors
PS1="%{$fg_bold[red]%}➜ %{$fg_bold[green]%} %{$fg[cyan]%}%c "
export CLICOLOR=1

# Shortcuts
alias   clock="tty-clock -C black -t -c"
alias   removeDock="defaults write com.apple.dock autohide-delay -float 1000; killall Dock"
alias   yesDock="defaults delete com.apple.dock autohide-delay; killall Dock"
alias   resource="source ~/.zshrc"
alias   mail="open https://mail.google.com/mail/u/0/#inbox/; open https://mail.google.com/mail/u/1/#inbox; open https://mail.google.com/mail/u/2/#inbox; open https://mail.google.com/mail/u/3/#inbox; open https://mail.google.com/mail/u/4/#inbox;" 
alias   distract="open https://www.irccloud.com/; open https://discord.com/channels/@me; open https://www.messenger.com/t/100000372900903/"
alias   discord="open https://discord.com/channels/@me"
alias   ls="ls -p"
alias   vi="vim"
alias   ssh1="ssh ankit@192.168.1.79"        # Home-local  (manjaro 21.0.7)
alias   ssh2="ssh ankit@162.229.184.109"     # Home-global (ubuntu 20.04.2)
alias   ssh3="ssh asachde2@unix.ucsc.edu"    # UCSC-global (CentOs 3.10.0)
alias   tmux0="tmux attach -t 0"
alias   tmux1="tmux attach -t 1"
alias   updateDotfiles="cd; cp .zshrc ~/Documents/dots; cp .vimrc ~/Documents/dots; cd Documents/dots; git add .; git status"
alias   weather="curl -s wttr.in | head -n 6"
alias   weatherC="curl -s wttr.in | head -n 35"

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

wallpaper() {
    osascript -e 'tell application "Finder" to set desktop picture to POSIX file "'"$1"\"
}
