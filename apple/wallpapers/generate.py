#!/usr/bin/env python3
"""colophon dynamic wallpaper renderer.

ambient lane (art): tonal atmosphere is licensed. no elements at all -- one
two-stop vertical gradient per phase, nothing on it. every neutral sits in
the 285-300 plum-lavender family, and every phase stays on its dark end --
the wall tracks the sun without ever going light. renders via imagemagick
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

# phase palette: (sky top, sky bottom)
# Dark-only ladder: the sun still lifts the tone from night through day, but
# never leaves the dark end of the plum-lavender family, so the desk never
# flashes white at noon. Lightness order night < dawn < day > dusk > night.
PHASES = {
    "dawn":  ("#26232e", "#1e1c25"),
    "day":   ("#2e2b38", "#26232e"),
    "dusk":  ("#221f28", "#1b1922"),
    "night": ("#17151c", "#131118"),
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
    top, bottom = palette
    out = os.path.join(OUT, f"{size_name}-{phase}.png")
    # 16-bit png: a bare dark gradient bands visibly in 8-bit on a big panel.
    cmd = ["magick", "-size", f"{w}x{h}", f"gradient:{top}-{bottom}", f"PNG48:{out}"]
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
