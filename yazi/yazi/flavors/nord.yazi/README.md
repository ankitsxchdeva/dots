# nord.yazi

A [Nord](https://www.nordtheme.com/) flavor for [Yazi](https://yazi-rs.github.io),
vendored into these dotfiles so the setup stays self-contained (no runtime
`ya pack`).

- `flavor.toml` — the UI chrome, remapped to the Nord palette from Yazi's built-in
  theme so it matches the tmux / lazygit / fzf / bat / delta / vim configs here.
  Per-language file-icon brand colors are left as Yazi's defaults on purpose.
- `tmtheme.xml` — the [Nord Sublime Text](https://github.com/arcticicestudio/nord-sublime-text)
  theme (Arctic Ice Studio, MIT), used for the syntax-highlighted file preview.
  It's the same Nord theme `bat` ships, so previews match `cat`/`bat`.

Activated by `theme.toml` one level up: `[flavor] dark = "nord"`.
