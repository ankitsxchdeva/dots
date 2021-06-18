# Version 0.1.0

# Prompt
autoload -U colors && colors
#PROMPT="%{$fg_bold[red]%}➜ %{$fg_bold[green]%} %{$fg[cyan]%}%c %{$fg_bold[blue]%}$(git_prompt_info)%{$fg_bold[blue]%} % %{$reset_color%}"
PS1="%{$fg_bold[red]%}➜ %{$fg_bold[green]%} %{$fg[cyan]%}%c "

# Shortcuts
alias	clock="tty-clock -C black -t -c"
alias   removeDock="defaults write com.apple.dock autohide-delay -float 1000; killall Dock"
alias   yesDock="defaults delete com.apple.dock autohide-delay; killall Dock"
alias   resource="source ~/.zshrc"
alias   mail="open https://messenger.com/; open https://mail.google.com/mail/u/0/#inbox/; open https://mail.google.com/mail/u/1/#inbox; open https://mail.google.com/mail/u/2/#inbox; open https://mail.google.com/mail/u/3/#inbox; open https://mail.google.com/mail/u/4/#inbox; open https://www.irccloud.com/irc/snoonet/channel/bicycling;"

# History
HISTSIZE=10000
SAVEHIST=10000
HISTFILE=~/.zsh_history

# Autocomplete
autoload -U compinit
zstyle ':completion:*' menu select
zmodload zsh/complist
compinit
_comp_options+=(globdots)

# Plugins
source /usr/local/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
