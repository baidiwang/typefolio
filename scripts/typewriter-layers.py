#!/usr/bin/env python3
"""
Split the hand-drawn typewriter (art/typewriter.png) into rig layers and
export them, plus the plant, as WebP for the page.

    pip install pillow numpy
    python3 scripts/typewriter-layers.py

Layers (all in the source's 1024x1024 coordinate system):

  body      static: the machine, keys included. The strip of body hidden
            behind the roller is filled in, so sliding the carriage never
            reveals a hole.
  carriage  roller, both knobs, end collars and the return lever. Slides.
  bell      the bell on its stem. Rings (wobbles about the stem's foot).

Writes public/art/*.webp and src/typewriter/layers.ts (geometry). The cut
lines below are measured from this particular drawing (see the comments);
new artwork needs new numbers.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'art' / 'typewriter.png'
PLANT_SRC = ROOT / 'art' / 'plant.png'
OUT = ROOT / 'public' / 'art'
TS_OUT = ROOT / 'src' / 'typewriter' / 'layers.ts'

# —— Measured landmarks (source px) ——————————————————————————————————————
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
BODY_CROP_BOTTOM = 520            # deepest row any breakpoint ever shows
STEM_BOTTOM = 346                 # the bell's stem is extended down to here
OUTLINE = (30, 27, 28)
# The "transparent" background carries faint alpha noise; below this it's
# treated (and exported) as fully transparent.
ALPHA_MIN = 16

# Display scale where the roller spans the 944px paper: 944 / 618 ≈ 1.53.
# Exported at 2x that, so the art stays sharp on retina screens at desktop
# size (the 1024px source is upscaled; it has no more detail than that).
DESKTOP_SCALE = 944 / (ROLLER_X1 - ROLLER_X0)
EXPORT_SCALE = 2 * DESKTOP_SCALE
WEBP_QUALITY = 82


def load(path):
    rgba = np.array(Image.open(path).convert('RGBA'))
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


def run_around(row_opaque, x):
    """[left, right] of the contiguous opaque run containing column x."""
    if not row_opaque[x]:
        return None
    left = x
    while left > 0 and row_opaque[left - 1]:
        left -= 1
    right = x
    while right < len(row_opaque) - 1 and row_opaque[right + 1]:
        right += 1
    return left, right


def roller_edges(cylinder):
    """Top/bottom rows of the roller per column: the run of non-red paint
    between the red body above and below it. Under the ribbon cover the
    roller and the cover merge into one black run, so the bottom there is
    interpolated from the columns either side."""
    top = np.full(cylinder.shape[1], np.nan)
    bottom = np.full(cylinder.shape[1], np.nan)
    for x in range(ROLLER_X0, ROLLER_X1 + 1):
        ys = np.nonzero(cylinder[BAND_Y0:BAND_Y1, x])[0] + BAND_Y0
        ys = ys[ys >= 303]  # the bell stem stands on the roller's top edge
        if not len(ys):
            continue
        t = b = ys[0]
        while b + 1 < h_limit(cylinder) and cylinder[b + 1, x]:
            b += 1
        if not BELL_BOX[0] <= x < BELL_BOX[2]:  # the stem would read as roller
            top[x] = t
        if b - t <= 40:  # a clean roller run; longer = merged with the cover
            bottom[x] = b
    xs = np.arange(cylinder.shape[1])
    for arr in (top, bottom):
        ok = ~np.isnan(arr)
        arr[:] = np.interp(xs, xs[ok], arr[ok])
    # Smooth out marker wobble so the cut follows the roller, not the noise.
    return median_smooth(top), median_smooth(bottom)


def h_limit(a):
    return a.shape[0]


def median_smooth(arr, k=9):
    pad = np.pad(arr, k, mode='edge')
    out = np.array([np.median(pad[i:i + 2 * k + 1]) for i in range(len(arr))])
    return np.round(out).astype(int)


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
    # Above the roller: the opaque run through the centre. Below it, the
    # roller's collars bridge the body to the knobs for a few rows, so the
    # edges come from the red paint instead (plus its outline).
    body_static = np.zeros((h, w), bool)
    extents = {}
    # Above the roller only the lever (left) and knobs/collars (both ends)
    # can be carriage, so the body is everything between them (the bell is
    # taken out separately below). That keeps the top edge's outline, which
    # starts a few rows above the body's paint.
    for y in range(CARRIAGE_ROWS[0], ABOVE_ROW + 1):
        body_static[y, ABOVE_X0:ABOVE_X1 + 1] = opaque[y, ABOVE_X0:ABOVE_X1 + 1]
        r = run_around(opaque[y], CENTER_X)
        if r:
            extents[y] = r
    for y in range(BELOW_ROW, CARRIAGE_ROWS[1]):
        xs = np.nonzero(red[y, 180:900])[0] + 180
        if not len(xs):
            continue
        # The body's opaque run around its red, but at most 10px past the
        # paint (its outline), so the collars and knobs aren't pulled in.
        run_l, run_r = run_around(opaque[y], int(xs.min()))[0], run_around(opaque[y], int(xs.max()))[1]
        l, r = max(run_l, int(xs.min()) - 10), min(run_r, int(xs.max()) + 10)
        body_static[y, l:r + 1] = opaque[y, l:r + 1]
        extents[y] = (int(xs.min()), int(xs.max()))
    body_static[CARRIAGE_ROWS[1]:] = opaque[CARRIAGE_ROWS[1]:]

    # Body extent behind the roller: straight lines between the corner where
    # the body meets the roller's top edge and where it leaves its bottom.
    (l_top, r_top), (l_bot, r_bot) = extents[ABOVE_ROW], extents[BELOW_ROW]

    def body_span(y):
        t = (y - ABOVE_ROW) / (BELOW_ROW - ABOVE_ROW)
        return l_top + (l_bot - l_top) * t, r_top + (r_bot - r_top) * t

    # Rows of the roller band: inside the body's span, whatever isn't the
    # cylinder (red face above, ribbon cover / red below) is body.
    for y in range(ABOVE_ROW + 1, BELOW_ROW):
        l, r = body_span(y)
        for x in range(int(np.floor(l)) - 2, int(np.ceil(r)) + 3):
            if opaque[y, x] and not (top[x] - 1 <= y <= bottom[x] + 1):
                body_static[y, x] = True
    # Red paint never moves with the carriage, except the red the artist
    # drew into the roller itself.
    roller_rows = np.zeros((h, w), bool)
    for x in range(COLLAR_X0, COLLAR_X1 + 1):
        roller_rows[top[x] - 1:bottom[x] + 2, x] = True
    body_static |= red & ~roller_rows
    body_static &= ~bell

    # —— Carriage: everything else that is opaque in the carriage rows ————
    carriage = np.zeros((h, w), bool)
    y0, y1 = CARRIAGE_ROWS
    carriage[y0:y1] = opaque[y0:y1] & ~body_static[y0:y1] & ~bell[y0:y1]

    # —— Body layer: the rest, with the strip behind the roller filled ———————
    body = src.copy()
    body[carriage | bell] = 0

    # The ribbon cover (black, under the roller's middle) continues upward;
    # elsewhere the red is copied from just below the roller, texture and all.
    cover_x0, cover_x1 = run_around(dark[BELOW_ROW + 2], CENTER_X) or (0, -1)
    shift = BELOW_ROW + 2 - (ABOVE_ROW + 1)
    for y in range(ABOVE_ROW + 1, BELOW_ROW):
        l, r = body_span(y)
        for x in range(int(np.ceil(l)), int(r) + 1):
            if body[y, x, 3] > 0 and not carriage[y, x]:
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

    # —— Export ——————————————————————————————————————————————————————————
    def bbox(mask, bottom_limit=None):
        if bottom_limit is not None:
            mask = mask.copy()
            mask[bottom_limit:] = False
        ys, xs = np.nonzero(mask)
        return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1

    layers = {}

    def export(name, rgba, box, scale=EXPORT_SCALE):
        x0, y0, x1, y1 = box
        img = Image.fromarray(rgba).crop(box)
        size = (round((x1 - x0) * scale), round((y1 - y0) * scale))
        img = img.resize(size, Image.LANCZOS)
        path = OUT / f'{name}.webp'
        img.save(path, 'WEBP', quality=WEBP_QUALITY, alpha_quality=90, method=6)
        layers[name] = dict(x=x0, y=y0, w=x1 - x0, h=y1 - y0, src=f'/art/{name}.webp',
                            bytes=path.stat().st_size, px=size)

    export('typewriter-body', body, bbox(body[..., 3] > 0, BODY_CROP_BOTTOM))
    carr = np.where(carriage[..., None], src, 0).astype(np.uint8)
    export('typewriter-carriage', carr, bbox(carriage))
    # The bell stands on the frame behind the roller. Extend its stem down
    # behind the roller, so when the carriage slides away the stem still
    # reaches into the machine instead of ending in mid-air.
    bl = np.where(bell[..., None], src, 0).astype(np.uint8)
    foot_row = int(np.max(np.nonzero(bell.any(axis=1))[0]))
    stem_cols = np.nonzero(bell[foot_row - 2])[0]
    for y in range(foot_row - 1, STEM_BOTTOM):
        bl[y, stem_cols] = src[foot_row - 3, stem_cols]
        bl[y, stem_cols, 3] = 255
    bell_full = bl[..., 3] > 0
    export('typewriter-bell', bl, bbox(bell_full))
    bell_pivot = (int(stem_cols.mean()), foot_row)

    plant = load(PLANT_SRC)
    pbox = bbox(plant[..., 3] > 0)
    # The plant is shown at most ~420px tall: 2x that.
    export('plant', plant, pbox, scale=840 / (pbox[3] - pbox[1]))

    roller_top = int(np.median(top[ROLLER_X0 + 20:ROLLER_X1 - 20]))
    total = sum(v['bytes'] for v in layers.values())
    for k, v in layers.items():
        print(f"{k:22s} {v['px'][0]:5d}x{v['px'][1]:<5d} {v['bytes'] / 1024:6.1f} KB")
    print(f"{'total':22s} {'':11s} {total / 1024:6.1f} KB")

    def entry(name):
        v = layers[name]
        return f"{{ src: '{v['src']}', x: {v['x']}, y: {v['y']}, w: {v['w']}, h: {v['h']} }}"

    TS_OUT.write_text(f"""// Generated by scripts/typewriter-layers.py — do not edit by hand.
// Geometry of the raster rig in the source drawing's px (art/typewriter.png,
// 1024x1024). The page scales it so the roller spans the paper.

/** Where each layer image sits in the source drawing. */
export const LAYERS = {{
  body: {entry('typewriter-body')},
  carriage: {entry('typewriter-carriage')},
  bell: {entry('typewriter-bell')},
}} as const

/** The roller cylinder: its ends line up with the paper's edges, its top
 *  edge is the platen line (where text comes out). */
export const ROLLER = {{ x0: {ROLLER_X0}, x1: {ROLLER_X1}, top: {roller_top} }} as const

/** Where the bell's stem meets the roller: it rings about this point. */
export const BELL_PIVOT = {{ x: {bell_pivot[0]}, y: {bell_pivot[1]} }} as const

/** The plant, a separate drawing (art/plant.png). */
export const PLANT = {entry('plant')}
""")
    print('wrote', TS_OUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
