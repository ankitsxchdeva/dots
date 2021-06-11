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
alias   noDock="defaults write com.apple.dock autohide-delay -float 1000; killall Dock"
alias   yesDock="defaults delete com.apple.dock autohide-delay; killall Dock"

source /Users/ankitsachdeva/.oh-my-zsh/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

