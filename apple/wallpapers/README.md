# colophon dynamic wallpaper

a quiet wall in the plum-lavender family, on the ambient lane (art:
atmosphere is licensed). no elements at all: one two-stop vertical gradient
per solar phase, nothing on it. no pure black, no pure white, nothing shouts.

## files

- `colophon-dynamic.heic` — the macOS dynamic wallpaper. 4 solar phases
  (dawn, day, dusk, night) at 3840×2160; macOS blends them with the sun.
- `out/<size>-<phase>.png` — the same four phases as static images, per
  display:
  - `4k-uhd` 3840×2160 (any 4k display)
  - `5k-studio` 5120×2880 (studio display / imac)
  - `mbp16` 3456×2234 (macbook pro 16 native)
  - `ultrawide` 3440×1440 (21:9)
- `generate.py` — the renderer (imagemagick). `python3 generate.py` rebuilds
  everything; edit `PHASES`/`SIZES` to retune.
- `out/solar.json` — wallpapper input used for the .heic.

## use it

- **mac, dynamic:** system settings → wallpaper → add photo → pick
  `colophon-dynamic.heic`. it switches with solar time (appearance mode
  follows light/dark automatically: day is the light image, night the dark).
- **other displays / oses:** pick the right `out/` png for the panel. for a
  time-of-day switch on windows/linux, schedule the four statics (e.g.
  WinDynamicDesktop, or a cron + `gsettings`).

heic rebuild: `wallpapper -i out/solar.json -o colophon-dynamic.heic`
(wallpapper built from github.com/mczachurski/wallpapper; the homebrew tap
formula is stale).

credit: ankit sachdeva. spec: ~/Documents/design/DESIGN.md.
