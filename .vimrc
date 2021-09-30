"__   _(_)_ __ ___  _ __ ___ 
"\ \ / / | '_ ` _ \| '__/ __|
" \ V /| | | | | | | | | (__ 
"(_)_/ |_|_| |_| |_|_|  \___|

filetype plugin indent on
syntax on

set background=dark
set t_Co=256
set backspace=eol,start,indent
set nu
set showtabline=2
set relativenumber
set hidden
set belloff=all
set noerrorbells
set tabstop=4 softtabstop=4
set shiftwidth=4
set expandtab
set smartindent
set wrap
set smartcase
set noswapfile
set nobackup
set undodir=~/.vim/undodir
set undofile
set autoread
set nocompatible
highlight LineNr term=bold cterm=NONE ctermfg=DarkGrey ctermbg=NONE gui=NONE guifg=DarkGrey guibg=NONE
autocmd FileType markdown setlocal spell

" NERDTree Settings
nmap <C-f> :NERDTreeToggle<CR>

call plug#begin('~/.vim/plugged')
    Plug 'sonph/onehalf', { 'rtp': 'vim' }
    Plug 'mhinz/vim-startify'
    Plug 'preservim/nerdtree'
    Plug 'lervag/vimtex'
call plug#end()

let &t_SI="\033[3 q"
let &t_EI="\033[2 q"
