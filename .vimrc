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
set incsearch
set autoread
set nocompatible
set completeopt=menuone,longest
set shortmess+=c

let &t_SI="\033[3 q"
let &t_EI="\033[2 q"

call plug#begin('~/.vim/plugged')
Plug 'valloric/youcompleteme'
Plug 'vim-scripts/AutoComplPop'
Plug 'morhetz/gruvbox'
Plug 'vim-utils/vim-man'
call plug#end()

inoremap {<cr> {<cr>}<esc>O
