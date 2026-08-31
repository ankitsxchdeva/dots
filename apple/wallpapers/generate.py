#!/usr/bin/env python3
"""colophon dynamic wallpaper renderer.

ambient lane (art): tonal atmosphere is licensed. one oversized ambient datum
(the disc), one hairline horizon, one small ink dot. two inks, two jobs:
the accent dot carries the theme accent (signal indigo by day, wisteria by
night); the editorial coral marks dawn and dusk. every neutral sits in the
285-300 plum-lavender family, and every phase stays on its dark end -- the
wall tracks the sun without ever going light. renders via imagemagick
(`magick`).

usage: python3 generate.py
outputs: out/<size>-<phase>.png, out/solar.json
"""

import os
import subprocess
import sys

SIZES = {
    "4k-uhd": (3840, 2160),    # standard 4k, also feeds the .heic
    "5k-studio": (5120, 2880),  # studio display / imac
    "mbp16": (3456, 2234),      # macbook pro 16 native
    "ultrawide": (3440, 1440),  # 21:9
}

# phase palette: (sky top, sky bottom, disc, accent dot, hairline)
# Dark-only ladder: the sun still lifts the tone from night through day, but
# never leaves the dark end of the plum-lavender family, so the desk never
# flashes white at noon. Lightness order night < dawn < day > dusk > night.
PHASES = {
    "dawn":  ("#26232e", "#1e1c25", "#494764", "#de9180", "#3a384c"),
    "day":   ("#2e2b38", "#26232e", "#565273", "#6f92d6", "#454259"),
    "dusk":  ("#221f28", "#1b1922", "#413f54", "#de9180", "#35334a"),
    "night": ("#17151c", "#131118", "#35334a", "#8b87c8", "#2b2939"),
}

# `day` keeps isPrimary/isForLight so macOS still picks it for the light
# appearance -- but that frame is now dark too, which is the whole point.
SOLAR = [
    ("dawn",  {"isPrimary": False, "isForLight": False, "isForDark": False,
               "altitude": -1.0, "azimuth": 80.0}),
    ("day",   {"isPrimary": True,  "isForLight": True,  "isForDark": False,
               "altitude": 45.0, "azimuth": 180.0}),
    ("dusk",  {"isPrimary": False, "isForLight": False, "isForDark": False,
               "altitude": 3.0,  "azimuth": 265.0}),
    ("night", {"isPrimary": False, "isForLight": False, "isForDark": True,
               "altitude": -35.0, "azimuth": 320.0}),
]

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")


def render(size_name, w, h, phase, palette):
    top, bottom, disc, accent, line = palette
    cx, cy = 0.66 * w, 0.40 * h          # the ambient datum, off-center
    r = 0.24 * h                          # halo radius
    dr = 0.215 * h                        # crisp disc radius
    ar = max(7.0, 0.015 * h)              # accent dot
    ax, ay = 0.30 * w, 0.545 * h
    hy = round(0.62 * h)                  # horizon hairline
    lw = max(1, round(h / 1080))          # 1px at 1080, 2px at 2160+
    sigma = 0.075 * h

    # halo tile: blur is O(canvas), so render the halo small, blur, upscale.
    ts = min(w, r * 2 + sigma * 8)          # tile side, final px
    sc = 8                                  # downscale factor for the blur pass
    ts8 = ts / sc
    tx, ty = round(cx - ts / 2), round(cy - ts / 2)

    out = os.path.join(OUT, f"{size_name}-{phase}.png")
    cmd = [
        "magick", "-size", f"{w}x{h}", f"gradient:{top}-{bottom}",
        # halo: blurred copy of the disc beneath it, self-colored glow
        "(", "-size", f"{ts8:.0f}x{ts8:.0f}", "xc:none",
        "-fill", disc,
        "-draw", f"circle {ts8 / 2:.0f},{ts8 / 2:.0f} {ts8 / 2:.0f},{ts8 / 2 - r / sc:.0f}",
        "-blur", f"0x{sigma / sc:.0f}",
        "-channel", "A", "-evaluate", "multiply", "0.55", "+channel",
        "-resize", f"{ts:.0f}x{ts:.0f}",
        ")", "-geometry", f"+{tx}+{ty}", "-compose", "over", "-composite",
        # crisp disc
        "-fill", disc, "-draw", f"circle {cx:.0f},{cy:.0f} {cx:.0f},{cy - dr:.0f}",
        # the one accent in the room
        "-fill", accent, "-draw", f"circle {ax:.0f},{ay:.0f} {ax:.0f},{ay - ar:.0f}",
        # horizon hairline
        "-stroke", line, "-strokewidth", str(lw),
        "-draw", f"line 0,{hy} {w},{hy}",
        out,
    ]
    subprocess.run(cmd, check=True)
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    for size_name, (w, h) in SIZES.items():
        for phase, palette in PHASES.items():
            path = render(size_name, w, h, phase, palette)
            print("rendered", path)

    import json
    solar = []
    for phase, meta in SOLAR:
        entry = {"fileName": f"4k-uhd-{phase}.png"}
        entry.update(meta)
        solar.append(entry)
    with open(os.path.join(OUT, "solar.json"), "w") as f:
        json.dump(solar, f, indent=2)
    print("wrote", os.path.join(OUT, "solar.json"))


if __name__ == "__main__":
    sys.exit(main())
