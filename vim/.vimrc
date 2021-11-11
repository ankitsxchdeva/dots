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

" FZF Settings
nnoremap <silent> <C-p> :Files<CR>

" Install vim-plug if not found
if empty(glob('~/.vim/autoload/plug.vim'))
  silent !curl -fLo ~/.vim/autoload/plug.vim --create-dirs
    \ https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
endif

" Run PlugInstall if there are missing plugins
autocmd VimEnter * if len(filter(values(g:plugs), '!isdirectory(v:val.dir)'))
  \| PlugInstall --sync | source $MYVIMRC
\| endif

call plug#begin('~/.vim/plugged')
    Plug 'sonph/onehalf', { 'rtp': 'vim' }
    Plug 'mhinz/vim-startify'
    Plug 'preservim/nerdtree'
    Plug 'lervag/vimtex'
    Plug 'arcticicestudio/nord-vim'
    Plug 'itchyny/lightline.vim'
    Plug 'junegunn/fzf.vim'
    Plug 'ankitsxchdeva/clang-format'
    Plug 'jiangmiao/auto-pairs'
    Plug 'junegunn/fzf', { 'do': { -> fzf#install() } }
call plug#end()

" lightline config
if !has('gui_running')
  set t_Co=256
endif
colorscheme nord
set laststatus=2
set noshowmode
let g:lightline = {
            \ 'colorscheme': 'nord',
            \ }

let &t_SI="\033[3 q"
let &t_EI="\033[2 q"

