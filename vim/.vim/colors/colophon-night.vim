" colophon-night — Vim port of the Colophon design language, dark theme.
" Companion to ghostty/ghostty/themes/colophon-night; same palette, same roles.
" Hue family 285-300 (plum-lavender), tinted neutrals only, one accent.
"
" Normal deliberately leaves guibg/ctermbg NONE so Ghostty's
" background-opacity + background-blur keep working inside Vim. Only surfaces
" that must read as raised (CursorLine, Visual, StatusLine, Pmenu) paint a bg.
"
" cterm values are the ANSI indices, so on a 16-colour terminal running the
" Ghostty theme this degrades to the identical palette.

hi clear
if exists('syntax_on')
  syntax reset
endif
set background=dark
let g:colors_name = 'colophon-night'

" Ground     bg #1e1c22  raised #2a2733  selection #35334a  dim #413f54
" Ink        muted #6e6a85  fg #e8e4f4  bright #f5f4fa
" Accent     wisteria #8b87c8  cyan #9db8dc  bright cyan #b8cde9
" Data       red #d97066  green #7fb98a  yellow #d9a85c  orchid #b184c9

" ── Editor chrome ───────────────────────────────────────────────────────────
hi Normal        guifg=#e8e4f4 guibg=NONE    ctermfg=7  ctermbg=NONE
hi NonText       guifg=#413f54 guibg=NONE    ctermfg=8  ctermbg=NONE
hi EndOfBuffer   guifg=#413f54 guibg=NONE    ctermfg=8  ctermbg=NONE
hi CursorLine    guifg=NONE    guibg=#2a2733 ctermfg=NONE ctermbg=NONE cterm=NONE gui=NONE
hi CursorLineNr  guifg=#8b87c8 guibg=NONE    ctermfg=4  ctermbg=NONE gui=bold cterm=bold
hi LineNr        guifg=#413f54 guibg=NONE    ctermfg=8  ctermbg=NONE
hi SignColumn    guifg=#6e6a85 guibg=NONE    ctermfg=8  ctermbg=NONE
hi ColorColumn   guifg=NONE    guibg=#2a2733 ctermfg=NONE ctermbg=8
hi Visual        guifg=NONE    guibg=#35334a ctermfg=NONE ctermbg=8
hi VertSplit     guifg=#413f54 guibg=NONE    ctermfg=8  ctermbg=NONE
hi Folded        guifg=#6e6a85 guibg=#2a2733 ctermfg=8  ctermbg=NONE
hi FoldColumn    guifg=#413f54 guibg=NONE    ctermfg=8  ctermbg=NONE
hi MatchParen    guifg=#b8cde9 guibg=#35334a ctermfg=14 ctermbg=8 gui=bold cterm=bold
hi Conceal       guifg=#6e6a85 guibg=NONE    ctermfg=8  ctermbg=NONE
hi Cursor        guifg=#1e1c22 guibg=#8b87c8 ctermfg=0  ctermbg=4

" ── Status / tabs / menus ───────────────────────────────────────────────────
hi StatusLine    guifg=#e8e4f4 guibg=#2a2733 ctermfg=7  ctermbg=8 gui=NONE cterm=NONE
hi StatusLineNC  guifg=#6e6a85 guibg=#2a2733 ctermfg=8  ctermbg=8 gui=NONE cterm=NONE
hi TabLine       guifg=#6e6a85 guibg=#2a2733 ctermfg=8  ctermbg=8 gui=NONE cterm=NONE
hi TabLineSel    guifg=#1e1c22 guibg=#8b87c8 ctermfg=0  ctermbg=4 gui=bold cterm=bold
hi TabLineFill   guifg=NONE    guibg=#2a2733 ctermfg=NONE ctermbg=8
hi Pmenu         guifg=#e8e4f4 guibg=#2a2733 ctermfg=7  ctermbg=8
hi PmenuSel      guifg=#1e1c22 guibg=#8b87c8 ctermfg=0  ctermbg=4 gui=bold cterm=bold
hi PmenuSbar     guifg=NONE    guibg=#35334a ctermfg=NONE ctermbg=8
hi PmenuThumb    guifg=NONE    guibg=#6e6a85 ctermfg=NONE ctermbg=8
hi WildMenu      guifg=#1e1c22 guibg=#9db8dc ctermfg=0  ctermbg=6

" ── Messages / search ───────────────────────────────────────────────────────
hi Search        guifg=#1e1c22 guibg=#d9a85c ctermfg=0  ctermbg=3
hi IncSearch     guifg=#1e1c22 guibg=#b8cde9 ctermfg=0  ctermbg=14 gui=NONE cterm=NONE
hi Question      guifg=#7fb98a guibg=NONE    ctermfg=2  ctermbg=NONE
hi Title         guifg=#8b87c8 guibg=NONE    ctermfg=4  ctermbg=NONE gui=bold cterm=bold
hi ModeMsg       guifg=#e8e4f4 guibg=NONE    ctermfg=7  ctermbg=NONE
hi MoreMsg       guifg=#9db8dc guibg=NONE    ctermfg=6  ctermbg=NONE
hi WarningMsg    guifg=#d9a85c guibg=NONE    ctermfg=3  ctermbg=NONE
hi ErrorMsg      guifg=#d97066 guibg=NONE    ctermfg=1  ctermbg=NONE
hi Directory     guifg=#8b87c8 guibg=NONE    ctermfg=4  ctermbg=NONE
hi SpecialKey    guifg=#413f54 guibg=NONE    ctermfg=8  ctermbg=NONE

" ── Syntax ──────────────────────────────────────────────────────────────────
hi Comment       guifg=#6e6a85 guibg=NONE    ctermfg=8  ctermbg=NONE gui=italic cterm=italic
hi Constant      guifg=#9db8dc guibg=NONE    ctermfg=6  ctermbg=NONE
hi String        guifg=#7fb98a guibg=NONE    ctermfg=2  ctermbg=NONE
hi Character     guifg=#7fb98a guibg=NONE    ctermfg=2  ctermbg=NONE
hi Number        guifg=#d9a85c guibg=NONE    ctermfg=3  ctermbg=NONE
hi Boolean       guifg=#d9a85c guibg=NONE    ctermfg=3  ctermbg=NONE
hi Float         guifg=#d9a85c guibg=NONE    ctermfg=3  ctermbg=NONE
hi Identifier    guifg=#b8cde9 guibg=NONE    ctermfg=14 ctermbg=NONE gui=NONE cterm=NONE
hi Function      guifg=#a6a3dc guibg=NONE    ctermfg=12 ctermbg=NONE
hi Statement     guifg=#8b87c8 guibg=NONE    ctermfg=4  ctermbg=NONE gui=NONE cterm=NONE
hi Conditional   guifg=#8b87c8 guibg=NONE    ctermfg=4  ctermbg=NONE
hi Repeat        guifg=#8b87c8 guibg=NONE    ctermfg=4  ctermbg=NONE
hi Label         guifg=#8b87c8 guibg=NONE    ctermfg=4  ctermbg=NONE
hi Operator      guifg=#b184c9 guibg=NONE    ctermfg=5  ctermbg=NONE
hi Keyword       guifg=#8b87c8 guibg=NONE    ctermfg=4  ctermbg=NONE
hi Exception     guifg=#d97066 guibg=NONE    ctermfg=1  ctermbg=NONE
hi PreProc       guifg=#c9a1dc guibg=NONE    ctermfg=13 ctermbg=NONE
hi Include       guifg=#c9a1dc guibg=NONE    ctermfg=13 ctermbg=NONE
hi Define        guifg=#c9a1dc guibg=NONE    ctermfg=13 ctermbg=NONE
hi Macro         guifg=#c9a1dc guibg=NONE    ctermfg=13 ctermbg=NONE
hi Type          guifg=#9db8dc guibg=NONE    ctermfg=6  ctermbg=NONE gui=NONE cterm=NONE
hi StorageClass  guifg=#9db8dc guibg=NONE    ctermfg=6  ctermbg=NONE
hi Structure     guifg=#9db8dc guibg=NONE    ctermfg=6  ctermbg=NONE
hi Typedef       guifg=#9db8dc guibg=NONE    ctermfg=6  ctermbg=NONE
hi Special       guifg=#b184c9 guibg=NONE    ctermfg=5  ctermbg=NONE
hi SpecialChar   guifg=#b184c9 guibg=NONE    ctermfg=5  ctermbg=NONE
hi Delimiter     guifg=#e8e4f4 guibg=NONE    ctermfg=7  ctermbg=NONE
hi Todo          guifg=#d9a85c guibg=NONE    ctermfg=3  ctermbg=NONE gui=bold cterm=bold
hi Error         guifg=#d97066 guibg=NONE    ctermfg=1  ctermbg=NONE gui=bold cterm=bold
hi Underlined    guifg=#9db8dc guibg=NONE    ctermfg=6  ctermbg=NONE gui=underline cterm=underline
hi Ignore        guifg=#413f54 guibg=NONE    ctermfg=8  ctermbg=NONE

" ── Diff / spell ────────────────────────────────────────────────────────────
hi DiffAdd       guifg=#7fb98a guibg=NONE    ctermfg=2  ctermbg=NONE
hi DiffChange    guifg=#d9a85c guibg=NONE    ctermfg=3  ctermbg=NONE
hi DiffDelete    guifg=#d97066 guibg=NONE    ctermfg=1  ctermbg=NONE
hi DiffText      guifg=#8b87c8 guibg=NONE    ctermfg=4  ctermbg=NONE gui=bold cterm=bold
hi SpellBad      guisp=#d97066 gui=undercurl ctermfg=1  cterm=underline
hi SpellCap      guisp=#d9a85c gui=undercurl ctermfg=3  cterm=underline
hi SpellLocal    guisp=#9db8dc gui=undercurl ctermfg=6  cterm=underline
hi SpellRare     guisp=#b184c9 gui=undercurl ctermfg=5  cterm=underline
