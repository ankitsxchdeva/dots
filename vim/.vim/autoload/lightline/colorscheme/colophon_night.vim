" lightline colorscheme for colophon-night.
" Each colour is a [ gui, cterm ] pair, and each block is [ fg, bg ] of those
" pairs — lightline#colorscheme#flatten() re-splits them into
" [ guifg, guibg, ctermfg, ctermbg ]. Mode colour lives in the leftmost block
" only — one accent in the room, per the design language.
let s:p = {'normal':{}, 'inactive':{}, 'insert':{}, 'replace':{}, 'visual':{}, 'tabline':{}}

let s:bg     = ['#1e1c22', 0]
let s:raised = ['#2a2733', 8]
let s:dim    = ['#413f54', 8]
let s:muted  = ['#6e6a85', 8]
let s:fg     = ['#e8e4f4', 7]
let s:accent = ['#8b87c8', 4]
let s:cyan   = ['#9db8dc', 6]
let s:green  = ['#7fb98a', 2]
let s:yellow = ['#d9a85c', 3]
let s:red    = ['#d97066', 1]

let s:p.normal.left     = [ [ s:bg, s:accent ], [ s:fg, s:raised ] ]
let s:p.normal.right    = [ [ s:bg, s:accent ], [ s:fg, s:raised ] ]
let s:p.normal.middle   = [ [ s:muted, s:raised ] ]
let s:p.normal.error    = [ [ s:bg, s:red ] ]
let s:p.normal.warning  = [ [ s:bg, s:yellow ] ]

let s:p.insert.left     = [ [ s:bg, s:green ], [ s:fg, s:raised ] ]
let s:p.insert.right    = [ [ s:bg, s:green ], [ s:fg, s:raised ] ]
let s:p.insert.middle   = [ [ s:muted, s:raised ] ]

let s:p.replace.left    = [ [ s:bg, s:red ], [ s:fg, s:raised ] ]
let s:p.replace.right   = [ [ s:bg, s:red ], [ s:fg, s:raised ] ]
let s:p.replace.middle  = [ [ s:muted, s:raised ] ]

let s:p.visual.left     = [ [ s:bg, s:cyan ], [ s:fg, s:raised ] ]
let s:p.visual.right    = [ [ s:bg, s:cyan ], [ s:fg, s:raised ] ]
let s:p.visual.middle   = [ [ s:muted, s:raised ] ]

let s:p.inactive.left   = [ [ s:muted, s:raised ], [ s:muted, s:raised ] ]
let s:p.inactive.right  = [ [ s:muted, s:raised ], [ s:muted, s:raised ] ]
let s:p.inactive.middle = [ [ s:dim, s:raised ] ]

let s:p.tabline.left    = [ [ s:muted, s:raised ] ]
let s:p.tabline.tabsel  = [ [ s:bg, s:accent ] ]
let s:p.tabline.middle  = [ [ s:muted, s:raised ] ]
let s:p.tabline.right   = [ [ s:muted, s:raised ] ]

let g:lightline#colorscheme#colophon_night#palette = lightline#colorscheme#flatten(s:p)
