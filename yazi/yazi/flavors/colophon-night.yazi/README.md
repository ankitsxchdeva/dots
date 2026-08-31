# colophon-night.yazi

A [colophon-night](../../../../ghostty/ghostty/themes/colophon-night) flavor for
[Yazi](https://yazi-rs.github.io), matching the Ghostty theme of the same name
and the rest of this setup (tmux / lazygit / fzf / vim).

## Files

- `flavor.toml` — the UI chrome (panes, tabs, mode, status, popups, dir and
  special-file icons). Per-language file-icon brand colors are inherited from
  Yazi's built-in theme, untouched.
- `tmtheme.xml` — the file-preview syntax theme, auto-loaded by Yazi while this
  flavor is active. Recolored from the
  [Nord Sublime Text](https://github.com/arcticicestudio/nord-sublime-text)
  theme; see `LICENSE` for attribution.

Activated by `theme.toml` one level up: `[flavor] dark = "colophon-night"`.
