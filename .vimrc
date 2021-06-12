syntax on

set backspace=eol,start,indent
set relativenumber
set spell spelllang=en_us
set nu
set belloff=all
set noerrorbells
set tabstop=4 softtabstop=4
set shiftwidth=4
set expandtab
set smartindent
set nowrap
set smartcase
set noswapfile
set nobackup
set undodir=~/.vim/undodir
set undofile
set incsearch
set autoread
set nocompatible

let &t_SI="\033[3 q"
let &t_EI="\033[1 q"

call plug#begin('~/.vim/plugged')
Plug 'morhetz/gruvbox'
Plug 'vim-utils/vim-man'
call plug#end()


inoremap {<cr> {<cr>}<esc>0
