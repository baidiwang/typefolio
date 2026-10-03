#!/usr/bin/env python3
"""
Split the hand-drawn typewriter (art/typewriter.png) into rig layers and
export them, plus the plant (art/plant.png), as WebP for the page.

    pip install pillow numpy
    python3 scripts/typewriter-layers.py

Re-runnable with a new or upscaled source: the drawing is resampled to a
1024px reference before cutting, so every landmark below is in reference px
whatever the source resolution (a 4x upscale of the same drawing works as
is; a different drawing needs new landmarks). Exports are sized for the
page (2x the largest display size), not for the source.

Layers (reference px, 1024x1024):

  body      static: the machine, keys included. The strip of body hidden
            behind the roller is filled in, so sliding the carriage never
            reveals a hole.
  carriage  roller, end collars and the return lever. Slides.
  knob-l/r  the platen knobs. Slide with the carriage; turn on line feed.
  bell      the bell on its stem (stem extended down behind the roller).
            Rings about the stem's foot.

Writes public/art/*.webp and src/typewriter/layers.ts (geometry).
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'art' / 'typewriter.png'
PLANT_SRC = ROOT / 'art' / 'plant.png'
OUT = ROOT / 'public' / 'art'
TS_OUT = ROOT / 'src' / 'typewriter' / 'layers.ts'

REF = 1024  # every coordinate below is in px of a 1024x1024 reference

# —— Measured landmarks (reference px) —————————————————————————————————————
ROLLER_X0, ROLLER_X1 = 230, 848   # the black roller cylinder, collars excluded
COLLAR_X0, COLLAR_X1 = 205, 868   # grey end collars
BAND_Y0, BAND_Y1 = 300, 350       # rows that can contain the roller
ABOVE_ROW, BELOW_ROW = 305, 344   # last body row above / first below the roller
CENTER_X = 520                    # a column that is always inside the body
ABOVE_X0, ABOVE_X1 = 255, 800     # body columns above the roller (lever and
                                  # collars are left of 255, knobs right of 800)
CARRIAGE_ROWS = (250, 450)        # nothing below 450 moves
BELL_BOX = (770, 205, 885, 312)   # x0, y0, x1, y1 around bell and stem
BELL_SEED = (820, 250)
KNOB_L_BOX = (148, 288, 214, 400)  # x0, y0, x1, y1
KNOB_R_BOX = (866, 262, 912, 400)
STEM_BOTTOM = 346                 # the bell's stem is extended down to here
OUTLINE = (30, 27, 28)
ROLLER_INK = (26, 22, 24)         # paints out red streaks/fringe on the roller
ALPHA_MIN = 16                    # faint alpha noise below this is transparent

# Export: the whole machine shows at most 220 css px tall; 2x that.
MACHINE_DISPLAY_MAX = 220
PLANT_DISPLAY_MAX = 110           # about half the machine
WEBP_QUALITY = 84


def load(path):
    img = Image.open(path).convert('RGBA')
    if img.size != (REF, REF):
        img = img.resize((REF, REF), Image.LANCZOS)
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


def run_around(row, x):
    """[left, right] of the contiguous True run containing column x."""
    if not row[x]:
        return None
    left = x
    while left > 0 and row[left - 1]:
        left -= 1
    right = x
    while right < len(row) - 1 and row[right + 1]:
        right += 1
    return left, right


def median_smooth(arr, k=9):
    pad = np.pad(arr, k, mode='edge')
    out = np.array([np.median(pad[i:i + 2 * k + 1]) for i in range(len(arr))])
    return np.round(out).astype(int)


def roller_edges(cylinder):
    """Top/bottom rows of the roller per column: the run of non-red paint
    between the red body above and below it. Thin red streaks drawn inside
    the roller (up to 4 rows) don't end the run. Under the ribbon cover the
    roller and the cover merge into one black run, so the bottom there is
    interpolated from the columns either side."""
    h, w = cylinder.shape
    top = np.full(w, np.nan)
    bottom = np.full(w, np.nan)
    for x in range(ROLLER_X0, ROLLER_X1 + 1):
        ys = np.nonzero(cylinder[BAND_Y0:BAND_Y1, x])[0] + BAND_Y0
        ys = ys[ys >= 303]  # the bell stem stands on the roller's top edge
        if not len(ys):
            continue
        t = b = ys[0]
        while True:
            nxt = b + 1
            if nxt < h and cylinder[nxt, x]:
                b = nxt
                continue
            # a short gap (a red streak) with roller below it: keep going
            gap = next((g for g in range(2, 6) if b + g < h and cylinder[b + g, x]), None)
            if gap and b + gap - t < 40:
                b += gap
                continue
            break
        if not BELL_BOX[0] <= x < BELL_BOX[2]:  # the stem would read as roller
            top[x] = t
        if b - t <= 40:  # a clean roller run; longer = merged with the cover
            bottom[x] = b
    xs = np.arange(w)
    for arr in (top, bottom):
        ok = ~np.isnan(arr)
        arr[:] = np.interp(xs, xs[ok], arr[ok])
    return median_smooth(top), median_smooth(bottom)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    src = load(SRC)
    h, w = src.shape[:2]
    rgb = src[..., :3].astype(float)
    alpha = src[..., 3]
    opaque = alpha > 0
    lum = rgb @ [0.299, 0.587, 0.114]
    dark = (lum < 90) & (alpha > 128)
    # Body paint: the red, including its pale watercolour streaks.
    red = (rgb[..., 0] > 150) & (rgb[..., 0] - rgb[..., 1] > 60) & (alpha > 128)

    top, bottom = roller_edges(opaque & ~red)
    roller_rows = np.zeros((h, w), bool)
    for x in range(COLLAR_X0, COLLAR_X1 + 1):
        roller_rows[top[x] - 1:bottom[x] + 2, x] = True

    # —— Bell: the connected shape around the dome, above the roller ——————
    bx0, by0, bx1, by1 = BELL_BOX
    bell = np.zeros((h, w), bool)
    stack = [BELL_SEED[::-1]]
    while stack:
        y, x = stack.pop()
        if not (by0 <= y < by1 and bx0 <= x < bx1) or bell[y, x] or not opaque[y, x]:
            continue
        if y >= top[x] - 1:
            continue
        bell[y, x] = True
        stack += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]

    # —— Body outside the roller rows ——————————————————————————————————————
    # Above the roller only the lever (left) and knobs/collars (both ends)
    # can be carriage, so the body is everything between them. Below it,
    # the collars bridge the body to the knobs for a few rows, so the edges
    # come from the red paint (plus its outline).
    body_static = np.zeros((h, w), bool)
    extents = {}
    for y in range(CARRIAGE_ROWS[0], ABOVE_ROW + 1):
        body_static[y, ABOVE_X0:ABOVE_X1 + 1] = opaque[y, ABOVE_X0:ABOVE_X1 + 1]
        r = run_around(opaque[y], CENTER_X)
        if r:
            extents[y] = r
    for y in range(BELOW_ROW, CARRIAGE_ROWS[1]):
        xs = np.nonzero(red[y, 180:900])[0] + 180
        if not len(xs):
            continue
        run_l = run_around(opaque[y], int(xs.min()))[0]
        run_r = run_around(opaque[y], int(xs.max()))[1]
        l, r = max(run_l, int(xs.min()) - 10), min(run_r, int(xs.max()) + 10)
        body_static[y, l:r + 1] = opaque[y, l:r + 1]
        extents[y] = (int(xs.min()), int(xs.max()))
    body_static[CARRIAGE_ROWS[1]:] = opaque[CARRIAGE_ROWS[1]:]

    # Body extent behind the roller: straight lines between where the body
    # meets the roller's top edge and where it leaves its bottom edge.
    (l_top, r_top), (l_bot, r_bot) = extents[ABOVE_ROW], extents[BELOW_ROW]

    def body_span(y):
        t = (y - ABOVE_ROW) / (BELOW_ROW - ABOVE_ROW)
        return l_top + (l_bot - l_top) * t, r_top + (r_bot - r_top) * t

    for y in range(ABOVE_ROW + 1, BELOW_ROW):
        l, r = body_span(y)
        for x in range(int(np.floor(l)) - 2, int(np.ceil(r)) + 3):
            if opaque[y, x] and not roller_rows[y, x]:
                body_static[y, x] = True
    # Red paint never moves with the carriage, except red drawn into the
    # roller itself (that's painted out below).
    body_static |= red & ~roller_rows
    body_static &= ~bell

    # —— Carriage (with knobs): everything else in the carriage rows ———————
    carriage = np.zeros((h, w), bool)
    y0, y1 = CARRIAGE_ROWS
    carriage[y0:y1] = opaque[y0:y1] & ~body_static[y0:y1] & ~bell[y0:y1]

    def box_mask(box):
        m = np.zeros((h, w), bool)
        m[box[1]:box[3], box[0]:box[2]] = True
        return m

    knob_l = carriage & box_mask(KNOB_L_BOX)
    knob_r = carriage & box_mask(KNOB_R_BOX)
    carriage &= ~(knob_l | knob_r)

    # —— Body layer: the rest, with the strip behind the roller filled ———————
    body = src.copy()
    body[carriage | knob_l | knob_r | bell] = 0
    cover_x0, cover_x1 = run_around(dark[BELOW_ROW + 2], CENTER_X) or (0, -1)
    shift = BELOW_ROW + 2 - (ABOVE_ROW + 1)
    for y in range(ABOVE_ROW + 1, BELOW_ROW):
        l, r = body_span(y)
        for x in range(int(np.ceil(l)), int(r) + 1):
            if body[y, x, 3] > 0:
                continue
            if cover_x0 + 6 <= x <= cover_x1 - 6:
                body[y, x] = src[BELOW_ROW + 2, x]
            else:
                body[y, x] = src[min(y + shift, h - 1), x]
            body[y, x, 3] = 255

    # Redraw the body's side edges behind the roller (anti-aliased).
    ss = 4
    edge = Image.new('L', (w * ss, h * ss), 0)
    d = ImageDraw.Draw(edge)
    for (xa, xb) in ((l_top, l_bot), (r_top, r_bot)):
        d.line([(xa * ss, (ABOVE_ROW - 2) * ss), (xb * ss, (BELOW_ROW + 2) * ss)],
               fill=255, width=int(3.2 * ss))
    edge = np.array(edge.resize((w, h), Image.LANCZOS)) / 255.0
    band = np.zeros((h, w), bool)
    band[ABOVE_ROW:BELOW_ROW + 1] = True
    m = edge * band
    for c in range(3):
        body[..., c] = (body[..., c] * (1 - m) + OUTLINE[c] * m).astype(np.uint8)
    body[..., 3] = np.maximum(body[..., 3], (m * 255).astype(np.uint8))

    # —— Carriage layer: roller without the red streak or a red fringe ———————
    carr = np.where(carriage[..., None], src, 0).astype(np.uint8)
    reddish = carriage & roller_rows & (rgb[..., 0] - rgb[..., 1] > 35)
    for c in range(3):
        carr[..., c][reddish] = ROLLER_INK[c]

    # —— Bell layer, stem extended down behind the roller ————————————————————
    bl = np.where(bell[..., None], src, 0).astype(np.uint8)
    foot_row = int(np.max(np.nonzero(bell.any(axis=1))[0]))
    stem_cols = np.nonzero(bell[foot_row - 2])[0]
    for y in range(foot_row - 1, STEM_BOTTOM):
        bl[y, stem_cols] = src[foot_row - 3, stem_cols]
        bl[y, stem_cols, 3] = 255

    layers_rgba = {
        'typewriter-body': body,
        'typewriter-carriage': carr,
        'typewriter-knob-l': np.where(knob_l[..., None], src, 0).astype(np.uint8),
        'typewriter-knob-r': np.where(knob_r[..., None], src, 0).astype(np.uint8),
        'typewriter-bell': bl,
    }

    # —— Export ——————————————————————————————————————————————————————————
    def bbox(mask):
        ys, xs = np.nonzero(mask)
        return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1

    boxes = {k: bbox(v[..., 3] > 0) for k, v in layers_rgba.items()}
    mx0 = min(b[0] for b in boxes.values())
    my0 = min(b[1] for b in boxes.values())
    mx1 = max(b[2] for b in boxes.values())
    my1 = max(b[3] for b in boxes.values())
    scale = 2 * MACHINE_DISPLAY_MAX / (my1 - my0)

    layers = {}

    def export(name, rgba, box, s):
        x0, y0, x1, y1 = box
        img = Image.fromarray(rgba).crop(box)
        size = (max(1, round((x1 - x0) * s)), max(1, round((y1 - y0) * s)))
        img = img.resize(size, Image.LANCZOS)
        path = OUT / f'{name}.webp'
        img.save(path, 'WEBP', quality=WEBP_QUALITY, alpha_quality=90, method=6)
        layers[name] = dict(x=x0, y=y0, w=x1 - x0, h=y1 - y0, src=f'/art/{name}.webp',
                            bytes=path.stat().st_size, px=size)

    for name, rgba in layers_rgba.items():
        export(name, rgba, boxes[name], scale)

    plant = load(PLANT_SRC)
    pbox = bbox(plant[..., 3] > 0)
    export('plant', plant, pbox, 2 * PLANT_DISPLAY_MAX / (pbox[3] - pbox[1]))

    # Remove exports from earlier versions of the rig.
    for stale in OUT.glob('*.webp'):
        if stale.stem not in layers:
            stale.unlink()

    total = sum(v['bytes'] for v in layers.values())
    for k, v in layers.items():
        print(f"{k:22s} {v['px'][0]:5d}x{v['px'][1]:<5d} {v['bytes'] / 1024:6.1f} KB")
    print(f"{'total':22s} {'':11s} {total / 1024:6.1f} KB")

    roller_top = int(np.median(top[ROLLER_X0 + 20:ROLLER_X1 - 20]))
    knob_centre = lambda b: f"{{ x: {(b[0] + b[2]) // 2}, y: {(b[1] + b[3]) // 2} }}"

    def entry(name):
        v = layers[name]
        return f"{{ src: '{v['src']}', x: {v['x']}, y: {v['y']}, w: {v['w']}, h: {v['h']} }}"

    TS_OUT.write_text(f"""// Generated by scripts/typewriter-layers.py — do not edit by hand.
// Geometry of the raster rig in reference px (art/typewriter.png resampled
// to 1024x1024). The page scales it from MACHINE's height.

/** Where each layer image sits in the drawing. */
export const LAYERS = {{
  body: {entry('typewriter-body')},
  bell: {entry('typewriter-bell')},
  carriage: {entry('typewriter-carriage')},
  knobL: {entry('typewriter-knob-l')},
  knobR: {entry('typewriter-knob-r')},
}} as const

/** The whole machine (bell top to feet, lever to right knob). */
export const MACHINE = {{ x0: {mx0}, y0: {my0}, x1: {mx1}, y1: {my1} }} as const

/** The roller cylinder: its ends and top edge. */
export const ROLLER = {{ x0: {ROLLER_X0}, x1: {ROLLER_X1}, top: {roller_top} }} as const

/** Pivots: the bell rings about its stem's foot; the knobs turn about
 *  their centres. */
export const BELL_PIVOT = {{ x: {int(stem_cols.mean())}, y: {foot_row} }} as const
export const KNOB_L_PIVOT = {knob_centre(boxes['typewriter-knob-l'])} as const
export const KNOB_R_PIVOT = {knob_centre(boxes['typewriter-knob-r'])} as const

/** The plant, a separate drawing (art/plant.png). */
export const PLANT = {entry('plant')}
""")
    print('wrote', TS_OUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
