"__   _(_)_ __ ___  _ __ ___
"\ \ / / | '_ ` _ \| '__/ __|
" \ V /| | | | | | | | | (__
"(_)_/ |_|_| |_| |_|_|  \___|

let mapleader=" "

filetype plugin indent on
syntax on

set background=dark
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
set ignorecase
set smartcase
set incsearch
set hlsearch
set scrolloff=8
set signcolumn=yes
set updatetime=300
set noswapfile
set nobackup
set undodir=~/.vim/undodir
set undofile
set autoread
set nocompatible
highlight LineNr term=bold cterm=NONE ctermfg=DarkGrey ctermbg=NONE gui=NONE guifg=DarkGrey guibg=NONE
autocmd FileType markdown setlocal spell

" Clear search highlight
nnoremap <silent> <leader>n :nohl<CR>

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
    Plug 'mhinz/vim-startify'
    Plug 'preservim/nerdtree'
    Plug 'arcticicestudio/nord-vim'
    Plug 'itchyny/lightline.vim'
    Plug 'junegunn/fzf.vim'
    Plug 'ankitsxchdeva/clang-format'
    Plug 'jiangmiao/auto-pairs'
    Plug 'tpope/vim-fugitive'
    Plug 'tpope/vim-commentary'
    Plug 'junegunn/fzf', { 'do': { -> fzf#install() } }
call plug#end()

" lightline config
if !has('gui_running')
  set t_Co=256
endif
" True 24-bit color so Nord renders exactly (not a 256-color approximation)
if has('termguicolors')
  set termguicolors
endif
set cursorline
colorscheme nord
set laststatus=2
set noshowmode
let g:lightline = {
            \ 'colorscheme': 'nord',
            \ }

" Cursor shape per mode: bar in insert, underline in replace, block in normal
let &t_SI="\033[6 q"
let &t_SR="\033[4 q"
let &t_EI="\033[2 q"
