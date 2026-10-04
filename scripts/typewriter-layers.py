#!/usr/bin/env python3
"""
Split the hand-drawn typewriter (art/typewriter-wide.png) into rig layers
and export them, plus the plant (art/plant.png), as WebP for the page.

    pip install pillow numpy
    python3 -B scripts/typewriter-layers.py

Re-runnable with a new or upscaled source: the drawing is resampled to a
1536 px wide reference before cutting, so every landmark below is in
reference px whatever the source resolution (an upscale of the same drawing
works as is; a different drawing needs new landmarks).

The machine is wide and low: its roller sits recessed in a notch between
the body's two raised shoulders. Layers (back to front):

  roller   the roller in the notch, extended past both ends of the notch
           (behind the shoulders) so it can slide without gaps.
  body     static: the red body and keyboard, with the notch cut out so the
           roller shows through.
  bell     on its stem above the right shoulder. Static; rings.
  lever    return lever and left axle. Slides with the roller.
  axle-r   right axle. Slides with the roller.
  knob-l/r the platen knobs. Slide with the roller; turn on line feed.

Writes public/art/*.webp and src/typewriter/layers.ts (geometry).
"""

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'art' / 'typewriter-wide.png'
PLANT_SRC = ROOT / 'art' / 'plant.png'
OUT = ROOT / 'public' / 'art'
TS_OUT = ROOT / 'src' / 'typewriter' / 'layers.ts'

REF_W = 1536  # every coordinate below is in px of a 1536 px wide reference

# —— Measured landmarks (reference px) —————————————————————————————————————
SHOULDER_COLS = ((310, 375), (1140, 1215))  # flat tops of the two shoulders
NOTCH_X0, NOTCH_X1 = 389, 1127   # the roller window, inside the shoulders'
                                 # inner outlines
ROLLER_ROWS = (205, 290)         # rows that can hold roller (paper guides
                                 # rise above it)
FLOOR_FROM = 258                 # the notch's red floor starts below this;
                                 # red above it is streaks on the roller
ROLLER_INK = (24, 22, 26)        # paints those streaks out
KEYBOARD_BOTTOM = 504            # just below the keyboard frame's outline
# Moving parts, as boxes (x0, y0, x1, y1). The lever and left axle end where
# the body's left edge begins; the right axle where its right edge ends.
# Where the lever and left knob touch, the knob gets x < LEVER_SPLIT; above
# the knob the lever takes everything in its box. On the right the axle
# takes the joint and the knob the rest of its box.
LEVER_BOX = (238, 150, 289, 284)
LEVER_SPLIT = (253, 226)        # x, and the row where the knob begins
KNOB_L_BOX = (214, 220, 256, 324)
AXLE_R_BOX = (1250, 246, 1278, 286)
KNOB_R_BOX = (1270, 221, 1320, 336)
BELL_DOME_BOX = (1210, 150, 1280, 219)
BELL_STEM_BOX = (1234, 219, 1250, 250)  # down to just above the axle
EXTEND = 90                      # roller added past each end of the notch
ALPHA_MIN = 16                   # faint alpha noise below this is transparent
POT_FILL = (246, 242, 234)       # inside the plant pot's outline
# The plant (art/plant.png at 1024 px): the pot's back rim starts at
# POT_TOP; the stems pass in front of it down to STEM_BASE, within
# STEM_COLS. The foliage sways about STEM_PIVOT.
POT_TOP = 610
STEM_BASE = 662
STEM_COLS = (465, 560)
STEM_PIVOT = (512, 660)

# Export: at most source resolution (the body shows at most ~820 css px
# wide, so this is about 1.2x on desktop).
EXPORT_SCALE = 1.0
PLANT_DISPLAY_MAX = 320          # css px; exported at 2x
WEBP_QUALITY = 84


def load(path, ref_w=None):
    img = Image.open(path).convert('RGBA')
    if ref_w and img.size[0] != ref_w:
        img = img.resize((ref_w, round(img.size[1] * ref_w / img.size[0])), Image.LANCZOS)
    rgba = np.array(img)
    rgba[rgba[..., 3] < ALPHA_MIN] = 0
    drop_specks(rgba)
    return rgba


def drop_specks(rgba, min_area=30):
    """Clear isolated specks (stray marks in the 'transparent' background)."""
    opaque = rgba[..., 3] > 0
    seen = np.zeros_like(opaque)
    h, w = opaque.shape
    for y0, x0 in zip(*np.nonzero(opaque)):
        if seen[y0, x0]:
            continue
        comp, stack = [], [(y0, x0)]
        seen[y0, x0] = True
        while stack:
            y, x = stack.pop()
            comp.append((y, x))
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < h and 0 <= xx < w and opaque[yy, xx] and not seen[yy, xx]:
                    seen[yy, xx] = True
                    stack.append((yy, xx))
        if len(comp) < min_area:
            for y, x in comp:
                rgba[y, x] = 0


def fill_pot(rgba, box):
    """The pot is drawn as an outline on paper; on the desk its inside would
    read as desk. Fill transparent areas enclosed by the drawing in the
    bottom quarter of the plant (the pot) with an off-white glaze."""
    x0, y0, x1, y1 = box
    clear = rgba[..., 3] == 0
    outside = np.zeros_like(clear)
    h, w = clear.shape
    stack = [(y, x) for y in range(h) for x in (0, w - 1) if clear[y, x]]
    stack += [(y, x) for x in range(w) for y in (0, h - 1) if clear[y, x]]
    while stack:
        y, x = stack.pop()
        if outside[y, x] or not clear[y, x]:
            continue
        outside[y, x] = True
        for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= yy < h and 0 <= xx < w and not outside[yy, xx]:
                stack.append((yy, xx))
    hole = clear & ~outside
    hole[:y0 + (y1 - y0) * 3 // 4] = False
    rgba[hole] = (*POT_FILL, 255)


def box_mask(shape, box):
    m = np.zeros(shape, bool)
    m[box[1]:box[3], box[0]:box[2]] = True
    return m


def bbox(mask):
    ys, xs = np.nonzero(mask)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    src = load(SRC, REF_W)
    h, w = src.shape[:2]
    rgb = src[..., :3].astype(int)
    opaque = src[..., 3] > 0
    red = (rgb[..., 0] > 150) & (rgb[..., 0] - rgb[..., 1] > 60) & (src[..., 3] > 128)

    # —— The body's top edge (the reveal line) and widest extent ———————————
    tops = [np.nonzero(opaque[:, x])[0].min()
            for a, b in SHOULDER_COLS for x in range(a, b)]
    line = int(np.median(tops))
    widest = max(range(line, h), key=lambda y: np.count_nonzero(red[y]))
    xs = np.nonzero(opaque[widest])[0]
    xs = xs[(xs > NOTCH_X0 - 200) & (xs < NOTCH_X1 + 200)]
    body_x0, body_x1 = int(xs.min()), int(xs.max()) + 1

    # —— Moving parts and the bell —————————————————————————————————————————
    shape = (h, w)
    lever = opaque & box_mask(shape, LEVER_BOX) & ~red
    split_x, split_y = LEVER_SPLIT
    lever[split_y:, :split_x] = False
    knob_l = opaque & box_mask(shape, KNOB_L_BOX) & ~lever
    axle_r = opaque & box_mask(shape, AXLE_R_BOX) & ~red
    knob_r = opaque & box_mask(shape, KNOB_R_BOX) & ~axle_r & ~red
    bell = opaque & (box_mask(shape, BELL_DOME_BOX) | box_mask(shape, BELL_STEM_BOX)) & ~red
    bell &= ~knob_r

    # —— Roller: what's in the notch above its red floor ————————————————————
    roller_rgba = np.zeros_like(src)
    in_notch = np.zeros(shape, bool)
    y0, y1 = ROLLER_ROWS
    for x in range(NOTCH_X0, NOTCH_X1):
        reds = np.nonzero(red[FLOOR_FROM:y1, x])[0]
        floor = FLOOR_FROM + int(reds.min()) if len(reds) else y1
        in_notch[y0:floor, x] = True
    roller = opaque & in_notch
    roller_rgba[roller] = src[roller]
    streak = roller & (rgb[..., 0] - rgb[..., 1] > 35)
    roller_rgba[streak, :3] = ROLLER_INK
    # Extend past both ends with stretches of roller from just inside the
    # notch, so sliding never shows a gap behind the shoulders.
    left_src = roller_rgba[:, NOTCH_X0 + 10:NOTCH_X0 + 10 + EXTEND]
    right_src = roller_rgba[:, NOTCH_X1 - 10 - EXTEND:NOTCH_X1 - 10]
    roller_rgba[:, NOTCH_X0 - EXTEND:NOTCH_X0] = left_src
    roller_rgba[:, NOTCH_X1:NOTCH_X1 + EXTEND] = right_src

    body = src.copy()
    body[lever | knob_l | axle_r | knob_r | bell | roller] = 0

    layers_rgba = {
        'typewriter-roller': roller_rgba,
        'typewriter-body': body,
        'typewriter-bell': np.where(bell[..., None], src, 0).astype(np.uint8),
        'typewriter-lever': np.where(lever[..., None], src, 0).astype(np.uint8),
        'typewriter-axle-r': np.where(axle_r[..., None], src, 0).astype(np.uint8),
        'typewriter-knob-l': np.where(knob_l[..., None], src, 0).astype(np.uint8),
        'typewriter-knob-r': np.where(knob_r[..., None], src, 0).astype(np.uint8),
    }

    # —— Export ——————————————————————————————————————————————————————————
    layers = {}

    def export(name, rgba, box, s):
        x0, y0, x1, y1 = box
        img = Image.fromarray(rgba).crop(box)
        size = (max(1, round((x1 - x0) * s)), max(1, round((y1 - y0) * s)))
        if size != img.size:
            img = img.resize(size, Image.LANCZOS)
        path = OUT / f'{name}.webp'
        img.save(path, 'WEBP', quality=WEBP_QUALITY, alpha_quality=90, method=6)
        layers[name] = dict(x=x0, y=y0, w=x1 - x0, h=y1 - y0, src=f'/art/{name}.webp',
                            bytes=path.stat().st_size, px=size)

    for name, rgba in layers_rgba.items():
        export(name, rgba, bbox(rgba[..., 3] > 0), EXPORT_SCALE)

    plant = load(PLANT_SRC, 1024)
    pbox = bbox(plant[..., 3] > 0)
    fill_pot(plant, pbox)
    # Foliage: everything above the pot's back rim, plus the stems (green
    # paint and the outlines within a few px of it) where they pass in front
    # of the rim. The pot is the rest.
    prgb = plant[..., :3].astype(int)
    popaque = plant[..., 3] > 0
    green = (prgb[..., 1] > prgb[..., 0] + 25) & (prgb[..., 1] > prgb[..., 2]) & popaque
    near_green = green.copy()
    for d in range(1, 5):
        near_green |= np.roll(green, d, axis=1) | np.roll(green, -d, axis=1)
    foliage = popaque.copy()
    foliage[POT_TOP:] = False
    band = np.zeros_like(foliage)
    band[POT_TOP:STEM_BASE, STEM_COLS[0]:STEM_COLS[1]] = True
    foliage |= band & popaque & near_green
    pot = popaque & ~foliage
    pscale = 2 * PLANT_DISPLAY_MAX / (pbox[3] - pbox[1])
    for name, mask in (('plant-pot', pot), ('plant-foliage', foliage)):
        export(name, np.where(mask[..., None], plant, 0).astype(np.uint8), bbox(mask), pscale)

    # Remove exports from earlier versions of the rig.
    for stale in OUT.glob('*.webp'):
        if stale.stem not in layers:
            stale.unlink()

    total = sum(v['bytes'] for v in layers.values())
    for k, v in layers.items():
        print(f"{k:22s} {v['px'][0]:5d}x{v['px'][1]:<5d} {v['bytes'] / 1024:6.1f} KB")
    print(f"{'total':22s} {'':11s} {total / 1024:6.1f} KB")

    machine = [bbox(v[..., 3] > 0) for k, v in layers_rgba.items() if k != 'typewriter-roller']
    top = min(b[1] for b in machine)
    bottom = max(b[3] for b in machine)
    right = max(b[2] for b in machine)
    left = min(b[0] for b in machine)
    centre = lambda m: f"{{ x: {(bbox(m)[0] + bbox(m)[2]) // 2}, y: {(bbox(m)[1] + bbox(m)[3]) // 2} }}"
    stem = np.nonzero(bell[BELL_STEM_BOX[3] - 2])[0]

    def entry(name):
        v = layers[name]
        return f"{{ src: '{v['src']}', x: {v['x']}, y: {v['y']}, w: {v['w']}, h: {v['h']} }}"

    TS_OUT.write_text(f"""// Generated by scripts/typewriter-layers.py — do not edit by hand.
// Geometry of the raster rig in reference px (art/typewriter-wide.png
// resampled to {REF_W} px wide). The page scales it so the body matches
// the paper's width.

/** Where each layer image sits in the drawing. */
export const LAYERS = {{
  roller: {entry('typewriter-roller')},
  body: {entry('typewriter-body')},
  bell: {entry('typewriter-bell')},
  lever: {entry('typewriter-lever')},
  axleR: {entry('typewriter-axle-r')},
  knobL: {entry('typewriter-knob-l')},
  knobR: {entry('typewriter-knob-r')},
}} as const

/** The body: its widest extent (the paper matches it), its top edge (where
 *  the paper disappears: the reveal line), the bottom of the keyboard frame
 *  (desktop shows down to here) and its bottom. */
export const BODY = {{
  x0: {body_x0},
  x1: {body_x1},
  top: {line},
  keyboardBottom: {KEYBOARD_BOTTOM},
  bottom: {bottom},
}} as const

/** The roller's window: the notch between the shoulders. The roller layer
 *  is clipped to it (its extensions hide behind the shoulders). */
export const NOTCH = {{ x0: {NOTCH_X0 - 6}, x1: {NOTCH_X1 + 6}, y0: {ROLLER_ROWS[0]}, y1: {ROLLER_ROWS[1]} }} as const

/** Everything drawn, lever to knob, bell top to feet. */
export const MACHINE = {{ x0: {left}, y0: {top}, x1: {right}, y1: {bottom} }} as const

/** Pivots: the bell rings about its stem's foot; the knobs turn about
 *  their centres. */
export const BELL_PIVOT = {{ x: {int(stem.mean())}, y: {BELL_STEM_BOX[3]} }} as const
export const KNOB_L_PIVOT = {centre(knob_l)} as const
export const KNOB_R_PIVOT = {centre(knob_r)} as const

/** The plant, a separate drawing (art/plant.png at 1024 px): its whole
 *  box, the pot and the foliage, which sways about the stems' base. */
export const PLANT = {{ x: {pbox[0]}, y: {pbox[1]}, w: {pbox[2] - pbox[0]}, h: {pbox[3] - pbox[1]} }} as const
export const PLANT_POT = {entry('plant-pot')}
export const PLANT_FOLIAGE = {entry('plant-foliage')}
export const STEM_PIVOT = {{ x: {STEM_PIVOT[0]}, y: {STEM_PIVOT[1]} }} as const
""")
    print('wrote', TS_OUT.relative_to(ROOT), f'(line {line}, body {body_x0}–{body_x1})')


if __name__ == '__main__':
    main()
