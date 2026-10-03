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

  body        static: the machine, keys included. The strip of body hidden
              behind the roller is filled in, so sliding the carriage never
              reveals a hole.
  roller-l    left end of the carriage: return lever, collar and the first
              stretch of roller.
  roller-mid  the roller's middle as a horizontal tile: slices of the drawn
              roller in shuffled order, never stretched. The page repeats it
              to make the carriage as wide as the paper.
  roller-r    right end: the last stretch of roller and its collar.
  knob-l/r    the platen knobs, at the carriage's ends; turn on line feed.
  bell        the bell on its stem. Placed on the body's right shoulder,
              below the roller; rings about the stem's foot.

The roller's edges wobble a pixel or two in the drawing. For the middle
slices to join, the roller is straightened to one band (its median edges);
towards each end the correction fades out, so the ends keep their drawn
shape.

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
# The bell is moved off the roller (it would cover the line being typed)
# onto the body's right shoulder, below the roller, smaller: its stem's
# foot sits at BELL_SEAT, scaled by BELL_SCALE.
BELL_SEAT = (812, 424)
BELL_SCALE = 0.6
# The carriage (roller, collars, lever, knobs) is drawn this much larger
# than the body, about the roller's top edge, so the roller reads as a
# cylinder rather than a bar.
CARRIAGE_SCALE = 1.5
OUTLINE = (30, 27, 28)
POT_FILL = (246, 242, 234)        # inside the plant pot's outline
ROLLER_INK = (26, 22, 24)         # paints out red streaks/fringe on the roller
ALPHA_MIN = 16                    # faint alpha noise below this is transparent

END_W = 50                        # roller kept with each end slice
MID_SLICES = 5                    # the middle is cut into this many slices
MID_LEN = 2600                    # length of the shuffled middle tile; the
                                  # widest paper needs ~2400
SEED = 3

# Export: the body shows at most 190 css px tall; 2x that.
BODY_DISPLAY_MAX = 190
PLANT_DISPLAY_MAX = 95            # about half the body
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


def warp_column(col, n):
    """Resample a column of RGBA pixels to n rows (premultiplied, linear)."""
    c = col.astype(float)
    a = c[:, 3:4] / 255
    pm = np.concatenate([c[:, :3] * a, c[:, 3:4]], axis=1)
    pos = np.linspace(0, len(c) - 1, n)
    out = np.stack([np.interp(pos, np.arange(len(c)), pm[:, i]) for i in range(4)], axis=1)
    alpha = np.maximum(out[:, 3:4] / 255, 1e-6)
    out[:, :3] = np.where(out[:, 3:4] > 0, out[:, :3] / alpha, 0)
    return np.clip(np.round(out), 0, 255).astype(np.uint8)


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

    # —— Bell layer: dome and stem, down to its foot ——————————————————————
    bl = np.where(bell[..., None], src, 0).astype(np.uint8)
    foot_row = int(np.max(np.nonzero(bell.any(axis=1))[0]))
    stem_cols = np.nonzero(bell[foot_row - 2])[0]

    # —— Straighten the roller, then slice it ——————————————————————————————
    inner = slice(ROLLER_X0 + END_W, ROLLER_X1 - END_W)
    T = int(np.median(top[inner])) - 1          # band rows [T, B)
    B = int(np.median(bottom[inner])) + 2
    seam_l, seam_r = ROLLER_X0 + END_W, ROLLER_X1 - END_W
    for x in range(ROLLER_X0, ROLLER_X1 + 1):
        if x < seam_l:
            k = (x - ROLLER_X0) / (seam_l - ROLLER_X0)
        elif x > seam_r:
            k = (ROLLER_X1 - x) / (ROLLER_X1 - seam_r)
        else:
            k = 1.0
        k = k * k * (3 - 2 * k)  # smoothstep
        ot, ob = int(top[x]) - 1, int(bottom[x]) + 2
        tt, tb = round(ot + (T - ot) * k), round(ob + (B - ob) * k)
        band = warp_column(carr[ot:ob, x], tb - tt)
        carr[min(ot, tt):max(ob, tb), x] = 0
        carr[tt:tb, x] = band

    # Cut at the darkest columns (between highlight dashes), so joins between
    # slices that weren't neighbours in the drawing don't split a dash.
    darkness = (carr[T:B, :, :3].astype(float) @ [0.299, 0.587, 0.114]).mean(axis=0)

    def darkest(x, r=8):
        return int(x - r + np.argmin(darkness[x - r:x + r + 1]))

    seam_l, seam_r = darkest(seam_l), darkest(seam_r)
    cuts = [seam_l] + [darkest(round(seam_l + (seam_r - seam_l) * i / MID_SLICES))
                       for i in range(1, MID_SLICES)] + [seam_r]
    slices = [carr[T:B, a:b] for a, b in zip(cuts, cuts[1:])]
    rng = np.random.default_rng(SEED)
    order, length = [], 0
    while length < MID_LEN:
        i = int(rng.integers(len(slices)))
        # never the same slice twice in a row, nor wrapping to the start
        if order and i == order[-1]:
            continue
        order.append(i)
        length += slices[i].shape[1]
    while order[-1] == order[0]:
        order.pop()
    mid = np.concatenate([slices[i] for i in order], axis=1)

    # Nothing of the body above the roller's top edge: the paper is there.
    body[:T + 1] = 0

    roller_l = carr.copy()
    roller_l[:, seam_l:] = 0
    roller_r = carr.copy()
    roller_r[:, :seam_r] = 0

    layers_rgba = {
        'typewriter-body': body,
        'typewriter-roller-l': roller_l,
        'typewriter-roller-r': roller_r,
        'typewriter-knob-l': np.where(knob_l[..., None], src, 0).astype(np.uint8),
        'typewriter-knob-r': np.where(knob_r[..., None], src, 0).astype(np.uint8),
        'typewriter-bell': bl,
    }

    # —— Export ——————————————————————————————————————————————————————————
    def bbox(mask):
        ys, xs = np.nonzero(mask)
        return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1

    boxes = {k: bbox(v[..., 3] > 0) for k, v in layers_rgba.items()}
    scale = 2 * BODY_DISPLAY_MAX / (boxes['typewriter-body'][3] - boxes['typewriter-body'][1])

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

    # Each layer at 2x its own display size.
    for name, rgba in layers_rgba.items():
        k = BELL_SCALE if name == 'typewriter-bell' else 1 if name == 'typewriter-body' else CARRIAGE_SCALE
        export(name, rgba, boxes[name], scale * k)
    export('typewriter-roller-mid', mid, (0, 0, mid.shape[1], mid.shape[0]),
           scale * CARRIAGE_SCALE)

    plant = load(PLANT_SRC)
    pbox = bbox(plant[..., 3] > 0)
    fill_pot(plant, pbox)
    export('plant', plant, pbox, 2 * PLANT_DISPLAY_MAX / (pbox[3] - pbox[1]))

    # Remove exports from earlier versions of the rig.
    for stale in OUT.glob('*.webp'):
        if stale.stem not in layers:
            stale.unlink()

    total = sum(v['bytes'] for v in layers.values())
    for k, v in layers.items():
        print(f"{k:22s} {v['px'][0]:5d}x{v['px'][1]:<5d} {v['bytes'] / 1024:6.1f} KB")
    print(f"{'total':22s} {'':11s} {total / 1024:6.1f} KB")

    roller_top = T + 1
    centre_x = (ROLLER_X0 + ROLLER_X1) // 2
    knob_centre = lambda b: f"{{ x: {(b[0] + b[2]) // 2}, y: {(b[1] + b[3]) // 2} }}"

    def entry(name):
        v = layers[name]
        return f"{{ src: '{v['src']}', x: {v['x']}, y: {v['y']}, w: {v['w']}, h: {v['h']} }}"

    TS_OUT.write_text(f"""// Generated by scripts/typewriter-layers.py — do not edit by hand.
// Geometry of the raster rig in reference px (art/typewriter.png resampled
// to 1024x1024). The page scales it from the body's height.

/** Where each layer image sits in the drawing. rollerL/knobL are placed
 *  from the roller's left end, rollerR/knobR from its right end, all at
 *  CARRIAGE_SCALE about the roller's top edge. The bell is placed by
 *  BELL_SEAT instead. */
export const LAYERS = {{
  body: {entry('typewriter-body')},
  bell: {entry('typewriter-bell')},
  rollerL: {entry('typewriter-roller-l')},
  rollerR: {entry('typewriter-roller-r')},
  knobL: {entry('typewriter-knob-l')},
  knobR: {entry('typewriter-knob-r')},
}} as const

/** The roller's middle: a tile, repeated horizontally (never stretched)
 *  to fill the carriage between the end slices. */
export const ROLLER_MID = {{ src: '{layers['typewriter-roller-mid']['src']}', y: {T}, h: {B - T}, w: {mid.shape[1]} }} as const

/** The roller cylinder: its ends, where the end slices meet the middle, and
 *  its top edge (where the paper comes out). The body is centred on centreX. */
export const ROLLER = {{
  x0: {ROLLER_X0},
  x1: {ROLLER_X1},
  seamL: {seam_l},
  seamR: {seam_r},
  top: {roller_top},
  centreX: {centre_x},
}} as const

/** The carriage's size relative to the body. */
export const CARRIAGE_SCALE = {CARRIAGE_SCALE}

/** The bell stands on the body's right shoulder: its foot (BELL_PIVOT) at
 *  BELL_SEAT, drawn at BELL_SCALE. */
export const BELL_SEAT = {{ x: {BELL_SEAT[0]}, y: {BELL_SEAT[1]} }} as const
export const BELL_SCALE = {BELL_SCALE}

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
