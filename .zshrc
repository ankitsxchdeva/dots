export ZSH="/Users/ankitsachdeva/.oh-my-zsh"
ZSH_THEME="gozilla"

DISABLE_AUTO_TITLE="true"
plugins=(git spotify brew)

source $ZSH/oh-my-zsh.sh

#Stupid shit I need to categorize
alias	clock="tty-clock -C black -t -c"
alias   play="spotify play"
alias   pause="spotify pause"
alias   playtth="spotify play uri spotify:playlist:37i9dQZF1DXcBWIGoYBM5M" 
alias   forceGPU="sudo pmset -c gpuswitch 1"
alias   autoGPU="sudo pmset -c gpuswitch 2"
alias   removeDock="defaults write com.apple.dock autohide-delay -float 1000; killall Dock"
alias   yesDock="defaults delete com.apple.dock autohide-delay; killall Dock"
alias   resource="source ~/.zshrc" 
alias   mail="open https://messenger.com/; open https://mail.google.com/mail/u/0/#inbox/; open https://mail.google.com/mail/u/1/#inbox; open https://mail.google.com/mail/u/2/#inbox; open https://mail.google.com/mail/u/3/#inbox; open https://mail.google.com/mail/u/4/#inbox; open https://www.irccloud.com/irc/snoonet/channel/bicycling;" 

source /Users/ankitsachdeva/.oh-my-zsh/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

