filetype plugin indent on
syntax on

set backspace=eol,start,indent
set nu
set relativenumber
set hidden
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
set autoread
set nocompatible

call plug#begin('~/.vim/plugged')
call plug#end()

let &t_SI="\033[3 q"
let &t_EI="\033[2 q"
