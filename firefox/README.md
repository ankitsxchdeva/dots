# colophon firefox themes

two static themes mapping the colophon design language
(~/Documents/design/DESIGN.md, v0.5) onto firefox chrome. same room at two
times of day: identical structure, one accent doing only state jobs.

- `colophon-night/` — night plum frame (#1e1c22), pale lavender ink, wisteria
  accent (#8b87c8) on the selected-tab line, loading indicator, focus ring,
  and urlbar selection. nothing else.
- `colophon-paper/` — lavender paper frame (#f5f4fa), plum ink, signal indigo
  accent (#355691) on the same state slots.

neutral steps not in tokens.css (toolbar band, urlbar well, popup highlight)
are mixes on the bg→border ladder, inside the 285–300 hue family, per the hue
family rule.

## try it (temporary, 30 seconds)

1. open `about:debugging#/runtime/this-firefox`
2. "Load Temporary Add-on..." → pick `colophon-night/manifest.json`
3. it stays until firefox restarts

## keep it (permanent)

unsigned themes cannot install permanently in release firefox, so the themes
are signed via AMO's unlisted (private) channel — not a public listing.

- `signed/colophon-night-1.0.0.xpi` — signed, ready. install:
  `open -a Firefox ~/.dots/firefox/signed/colophon-night-1.0.0.xpi` and
  confirm the prompt. persists across restarts; manage in about:addons →
  themes.
- colophon-paper — submitted and signed on AMO's side, but the signed file
  was never downloaded locally. grab it from the dashboard
  (addons.mozilla.org → manage my submissions) or bump the version and
  re-sign (below).

to re-sign after edits: bump `version` in the manifest (AMO rejects duplicate
uploads), then:

    source ~/.amo-sign.local   # AMO api creds, local-only, chmod 600
    npx web-ext sign --channel unlisted --source-dir colophon-night --artifacts-dir signed

api creds come from addons.mozilla.org/developers/addon/api/key and can be
regenerated there any time.

## slot map (core)

| firefox slot | night | paper | colophon token |
|---|---|---|---|
| frame | #1e1c22 | #f5f4fa | bg |
| toolbar | #27252f | #ecebf5 | bg→border mix (ladder step) |
| toolbar_text | #e8e4f4 | #30292f | fg |
| tab_background_text | #8e8aab | #6a6884 | muted |
| tab_line / tab_loading | #8b87c8 | #355691 | accent |
| toolbar_field | #2c2a36 | #e5e4f0 | bg→border mix |
| toolbar_field_border_focus | #8b87c8 | #355691 | accent (focus ring) |
| toolbar_field_highlight(+_text) | #8b87c8 / #1e1c22 | #355691 / #f5f4fa | inverted-accent selection |
| icons | #8e8aab | #6a6884 | muted |
| popup_border, separators | #413f54 | #d8d6e8 | border (hairlines) |

credit: ankit sachdeva. spec: ~/Documents/design/DESIGN.md.
