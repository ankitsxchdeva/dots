# Version 0.1.1

# Prompt
autoload -U colors && colors
#PROMPT="%{$fg_bold[red]%}➜ %{$fg_bold[green]%} %{$fg[cyan]%}%c %{$fg_bold[blue]%}$(git_prompt_info)%{$fg_bold[blue]%} % %{$reset_color%}"
PS1="%{$fg_bold[red]%}➜ %{$fg_bold[green]%} %{$fg[cyan]%}%c "
export CLICOLOR=1

# Shortcuts
alias	clock="tty-clock -C black -t -c"
alias   removeDock="defaults write com.apple.dock autohide-delay -float 1000; killall Dock"
alias   yesDock="defaults delete com.apple.dock autohide-delay; killall Dock"
alias   resource="source ~/.zshrc"
alias   mail="open https://mail.google.com/mail/u/0/#inbox/; open https://mail.google.com/mail/u/1/#inbox; open https://mail.google.com/mail/u/2/#inbox; open https://mail.google.com/mail/u/3/#inbox; open https://mail.google.com/mail/u/4/#inbox;" 
alias   distract="open https://www.irccloud.com/; open https://discord.com/channels/@me; https://www.messenger.com/t/100000372900903/"
alias   ls="ls -p"

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


