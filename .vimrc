syntax on

set backspace=eol,start,indent
set relativenumber
set belloff=all
set noerrorbells
set tabstop=4 softtabstop=4
set shiftwidth=4
set expandtab
set smartindent
set nu
set nowrap
set smartcase
set noswapfile
set nobackup
set undodir=~/.vim/undodir
set undofile
set incsearch
set autoread
set nocompatible


"  Setup cursor change on insert mode
let &t_SI="\033[3 q" " start insert mode, blinking underline cursor
let &t_EI="\033[1 q" " end insert mode, blinking block


call plug#begin('~/.vim/plugged')
Plug 'morhetz/gruvbox'
Plug 'vim-utils/vim-man'
call plug#end()


inoremap {<cr> {<cr>}<esc>0
