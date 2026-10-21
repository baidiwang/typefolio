#!/usr/bin/env python3
"""
Cut the line-art typewriter into the page's pieces and
write their geometry to src/typewriter/line.ts.

    pip install pillow numpy
    python3 -B scripts/line-layers.py

Input: art/typewriter-line-2x.png, the drawing upscaled 2x with a
line-art model (scripts/upscale-line.py). Coordinates below are in px of
that 2x image before its crop (the crop's offset is subtracted here).

Colour: the lines become ink #2b2823 with their alpha from their darkness;
everything inside the machine (whatever the outer white doesn't reach) is
filled with the paper colour #f7f3ea, so the machine is opaque. Only the
white outside it is transparent: a flood fill from the image's edges,
run on the ink closed by a few px so it can't leak through a broken line.

Pieces:
  roller   the fixed element: the roller with its rod and clips, collars,
           knobs and the return lever, from just above the clips down to
           the rail. The ribbon spools and the type guide are painted out
           (the roller and rail continued where they were). Slides as text
           types.
  bell     the bell's dome, cut out; the sound toggle at the roller's
           right end.
  lever    the carriage-return lever, cut out of the roller piece (it tilts
           on its own: the "Back to top" button).

The platen knobs' ridges are smoothed out of the roller piece (each rim
keeps its own shading, a per-column median down the rim): the page draws
them itself, so they can roll as the page scrolls. KNOBS (each rim's box
and its inner outline, row by row) goes to line.ts.
"""

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'art' / 'typewriter-line-2x.png'
OUT = ROOT / 'public' / 'art'
TS_OUT = ROOT / 'src' / 'typewriter' / 'line.ts'
OFFSET = (250, 720)  # the master's crop in the 2x image (upscale-line.py)

PAPER = (247, 243, 234)  # #f7f3ea
INK = (43, 40, 35)  # #2b2823
WHITE = 236  # luminance above which a pixel is background white
CLOSE = 4  # px the ink is closed by before the outside flood fill
QUALITY = 86

# —— Landmarks (2x px) ————————————————————————————————————————————————————
# The roller (the paper matches x0–x1) and its top edge; the entry line,
# just above the rod's clips (nothing of the machine over the paper above
# it).
ROLLER = {'x0': 700, 'x1': 1968, 'top': 841}
LINE = 796
# The roller piece: from the caps of the knob posts (outside the paper)
# down to the rail under the roller.
PIECE_TOP, PIECE_BOTTOM = 745, 990
# Painted out of the roller piece: each spool (top face ellipse, side,
# hub) and the type guide, each refilled from `src_dx` px across (past the
# screw brackets beside the spools).
SPOOLS = [
    {'cx': 834, 'rx': 122, 'cy': 974, 'ry': 40, 'hub': (798, 922, 870, 964), 'src_dx': +268},
    {'cx': 1828, 'rx': 120, 'cy': 974, 'ry': 40, 'hub': (1792, 922, 1864, 964), 'src_dx': -270},
]
TYPE_GUIDE = {'box': (1243, 916, 1417, PIECE_BOTTOM), 'src_dx': -186}
# The return lever: everything of the piece left of the left knob (the
# spoon dips lowest there), and above the knob's top between it and the
# lever's post. It pivots at the post's top.
LEVER = {'x_knob': 470, 'x_post': 548, 'overlap': 6, 'below_spoon': 875, 'below_arm': 830, 'pivot': (556, 786)}
# The platen knobs' ridged rims, side on (2x px): each rim is a cylinder
# seen from the front, its centre line at cy, ry from there to its top and
# bottom edges; its inside runs between two arcs, x = a + b·√(1 − t²) with
# t = (y − cy)/ry (measured on the drawing's ridge rows, inside the
# outlines). The ridges run along the platen's axis, so they roll up or
# down as the knob turns.
KNOBS = [
    {'name': 'l', 'cy': 910, 'ry': 70, 'left': (493, -17), 'right': (542, -17)},
    {'name': 'r', 'cy': 906, 'ry': 72, 'left': (2178, -7), 'right': (2206, 16)},
]
KNOB_STEP = 4  # px between the rows of each rim's outline written to line.ts
# The bell: a dome standing on its rim (traced from its centre outwards to
# the end of its outline, so nothing behind it comes along), a ring knob on
# top on a short stem.
OUTLINE = 6  # px: the dome's outline is about this thick in the 2x drawing
BELL = {'cx': 2067, 'base': 1083, 'rim': 1100, 'rim_ends': 1079, 'rim_sag': 17, 'rim_rx': 84, 'knob': (2060, 983, 13), 'stem': (2052, 992, 2069, 1003)}


def dome_mask(d, shape):
    """The bell's dome: from its centre, outwards at each angle to the first
    thick dark run (its outline; thin hatching is skipped) plus the
    outline's width, smoothed across angles (where the outline touches the
    bracket behind, the run alone would run on), and closed along the
    bottom of its rim (trimmed to the rim's curve by the caller)."""
    from PIL import ImageDraw
    cx, cy = BELL['cx'] - OFFSET[0], BELL['base'] - OFFSET[1]
    angles = np.radians(np.arange(0, 361) / 2)
    radii = []
    for a in angles:
        r, run, start = 30, 0, None
        while r < 130:
            px, py = int(round(cx + r * np.cos(a))), int(round(cy - r * np.sin(a)))
            if d[py, px] > 0.55:
                run += 1
                if run == 3:
                    start = r - 2
                    break
            else:
                run = 0
            r += 1
        radii.append((start or r) + OUTLINE)
    radii = np.array(radii, float)
    # A running median over ~6° drops the odd ray that caught something else.
    k = 6
    padded = np.concatenate([radii[:k][::-1], radii, radii[-k:][::-1]])
    radii = np.array([np.median(padded[i:i + 2 * k + 1]) for i in range(len(radii))])
    pts = [(cx + r * np.cos(a), cy - r * np.sin(a)) for a, r in zip(angles, radii)]
    rim = BELL['rim'] - OFFSET[1]
    pts = [(pts[0][0], rim)] + pts + [(pts[-1][0], rim)]
    im = Image.new('L', (shape[1], shape[0]), 0)
    ImageDraw.Draw(im).polygon(pts, fill=255)
    return np.array(im) > 0


def lum_of(rgb):
    return rgb @ [0.299, 0.587, 0.114]


def outside_mask(lum):
    """The white connected to the image's edges, stopping at the ink."""
    ink = lum < WHITE
    k = 2 * CLOSE + 1
    closed = np.array(Image.fromarray((ink * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(k))) > 0
    free = ~closed
    h, w = free.shape
    seen = np.zeros_like(free)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if free[y, x]:
                seen[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if free[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= yy < h and 0 <= xx < w and free[yy, xx] and not seen[yy, xx]:
                seen[yy, xx] = True
                q.append((yy, xx))
    grown = np.array(Image.fromarray((seen * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(k))) > 0
    return grown & ~ink


def darkness(lum):
    """0 for the drawing's white, 1 for its darkest line."""
    dark = np.percentile(lum[lum < 200], 2)
    return np.clip((248 - lum) / (248 - dark), 0, 1)


def paint(d, inside):
    """Ink over paper inside the machine (opaque); ink alone outside."""
    paper, ink = np.array(PAPER, float), np.array(INK, float)
    rgb = np.where(inside[..., None], paper * (1 - d[..., None]) + ink * d[..., None], ink)
    alpha = np.where(inside, 1.0, d)
    return np.dstack([rgb, alpha * 255]).clip(0, 255).astype(np.uint8)


def grid(shape):
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]]
    return xx + OFFSET[0], yy + OFFSET[1]


def refill(lum, hole, src_dx):
    """Paint a hole with the drawing `src_dx` px across, row by row."""
    out = lum.copy()
    ys, xs = np.nonzero(hole)
    out[ys, xs] = lum[ys, np.clip(xs + src_dx, 0, lum.shape[1] - 1)]
    return out


def save(name, rgba, box, width=None):
    x0, y0, x1, y1 = box
    im = Image.fromarray(rgba[y0:y1, x0:x1], 'RGBA')
    if width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    path = OUT / f'{name}.webp'
    im.save(path, quality=QUALITY, method=6)
    print(f'{name:16s} {im.width:5d}x{im.height:<4d} {path.stat().st_size / 1024:6.1f} KB')
    return {'src': f'/art/{name}.webp', 'x': x0 + OFFSET[0], 'y': y0 + OFFSET[1], 'w': x1 - x0, 'h': y1 - y0}


def to_box(x0, y0, x1, y1):
    return x0 - OFFSET[0], y0 - OFFSET[1], x1 - OFFSET[0], y1 - OFFSET[1]


def rim_inside(k):
    """A knob rim's inside, {y: (x_left, x_right)} in 2x px, from its arcs."""
    out = {}
    for yy in range(k['cy'] - k['ry'] + 3, k['cy'] + k['ry'] - 2):
        t = (yy - k['cy']) / k['ry']
        w = np.sqrt(max(0.0, 1 - t * t))
        out[yy] = (round(k['left'][0] + k['left'][1] * w), round(k['right'][0] + k['right'][1] * w))
    return out


def main():
    rgb = np.array(Image.open(SRC).convert('RGB')).astype(float)
    lum = lum_of(rgb)
    inside = ~outside_mask(lum)
    x, y = grid(lum.shape)

    # The roller piece: the spools and the type guide painted out first.
    roller_lum = lum.copy()
    for s in SPOOLS:
        hx0, hy0, hx1, hy1 = s['hub']
        hole = (((x - s['cx']) / s['rx']) ** 2 + ((y - s['cy']) / s['ry']) ** 2 <= 1)
        hole |= (np.abs(x - s['cx']) <= s['rx']) & (y >= s['cy'])
        hole |= (x >= hx0) & (x <= hx1) & (y >= hy0) & (y <= hy1)
        roller_lum = refill(roller_lum, hole & (y <= PIECE_BOTTOM), s['src_dx'])
    gx0, gy0, gx1, gy1 = TYPE_GUIDE['box']
    hole = (x >= gx0) & (x <= gx1) & (y >= gy0) & (y <= gy1)
    roller_lum = refill(roller_lum, hole, TYPE_GUIDE['src_dx'])

    # The knobs' ridges smoothed out: each rim column takes its median down
    # the rim (the shading stays, the lines go).
    knobs = []
    for k in KNOBS:
        rim = rim_inside(k)
        mask = np.zeros(lum.shape, bool)
        for yy, (xl, xr) in rim.items():
            mask[yy - OFFSET[1], xl - OFFSET[0]:xr - OFFSET[0] + 1] = True
        cols = {}
        for xx in range(min(v[0] for v in rim.values()), max(v[1] for v in rim.values()) + 1):
            col = mask[:, xx - OFFSET[0]]
            if col.any():
                cols[xx] = np.median(lum[col, xx - OFFSET[0]])
        ys_, xs_ = np.nonzero(mask)
        roller_lum[ys_, xs_] = [cols[x_ + OFFSET[0]] for x_ in xs_]
        ys = sorted(rim)
        top, bottom = ys[0], ys[-1]
        sample = ys[::KNOB_STEP] + ([bottom] if (bottom - top) % KNOB_STEP else [])
        outline = [(rim[y_][0], y_) for y_ in sample] + [(rim[y_][1], y_) for y_ in reversed(sample)]
        knobs.append({'name': k['name'], 'cy': k['cy'], 'ry': k['ry'], 'outline': outline})

    bell = dome_seen = dome_mask(darkness(lum), lum.shape)
    # The rim's underside is curved (seen a little from above): close the
    # bell along it, above the lever's stem.
    u = np.clip(1 - ((x - BELL['cx']) / BELL['rim_rx']) ** 2, 0, 1)
    bell = dome_seen & (y <= BELL['rim_ends'] + BELL['rim_sag'] * np.sqrt(u))
    kx, ky, kr = BELL['knob']
    bell |= (x - kx) ** 2 + (y - ky) ** 2 <= kr * kr
    sx0, sy0, sx1, sy1 = BELL['stem']
    bell |= (x >= sx0) & (x <= sx1) & (y >= sy0) & (y <= sy1)
    bell &= inside

    piece = inside | (lum < WHITE)
    piece &= (y >= PIECE_TOP) & (y <= PIECE_BOTTOM) & ~bell
    def lever_region(x_post):
        return piece & (
            ((x < LEVER['x_knob']) & (y < LEVER['below_spoon']))
            | ((x < x_post) & (y < LEVER['below_arm']))
        )
    # The lever layer runs a few px into the post, which the roller keeps:
    # no hairline seam where they meet, at rest or tilted.
    lever = lever_region(LEVER['x_post'] + LEVER['overlap'])
    piece &= ~lever_region(LEVER['x_post'])
    # Nothing over the paper above the entry line.
    piece &= ~((x >= ROLLER['x0']) & (x <= ROLLER['x1']) & (y < LINE))
    roller_rgba = paint(darkness(roller_lum), inside)
    roller_rgba[..., 3] = np.where(piece, roller_rgba[..., 3], 0)
    # The roller piece is cut straight at its bottom (the rest is off the
    # screen), so it's opaque right down to that edge.

    full = paint(darkness(lum), inside)
    bell_rgba = full.copy()
    bell_rgba[..., 3] = np.where(bell, bell_rgba[..., 3], 0)
    lever_rgba = full.copy()
    lever_rgba[..., 3] = np.where(lever, lever_rgba[..., 3], 0)

    for old in list(OUT.glob('engraving-*.webp')) + list(OUT.glob('line-*.webp')):
        old.unlink()

    def bbox(mask):
        ys, xs = np.nonzero(mask)
        return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1

    roller = save('line-roller', roller_rgba, bbox(roller_rgba[..., 3] > 0))
    bell_e = save('line-bell', bell_rgba, bbox(bell))
    lever_e = save('line-lever', lever_rgba, bbox(lever))
    mx0, _, mx1, _ = bbox(full[..., 3] > 8)

    def ts(e):
        return f"{{ src: '{e['src']}', x: {e['x']}, y: {e['y']}, w: {e['w']}, h: {e['h']} }}"

    TS_OUT.write_text(f"""// Generated by scripts/line-layers.py — do not edit by hand.
// The line-art typewriter, in px of the drawing upscaled
// 2x (art/typewriter-line-2x.png, before its crop).

/** The fixed roller (slides as text types) and the bell (the sound
 *  toggle). */
export const LINE_ART = {{
  roller: {ts(roller)},
  bell: {ts(bell_e)},
  lever: {ts(lever_e)},
}} as const

/** The lever tilts about the top of its post. */
export const LINE_LEVER_PIVOT = {{ x: {LEVER['pivot'][0]}, y: {LEVER['pivot'][1]} }} as const

/** The platen knobs' ridged rims, side on: the cylinder's centre line and
 *  half-height (cy, ry), and the rim's inside as a polygon (x, y pairs),
 *  where the page draws the ridges that roll as it scrolls. */
export const LINE_KNOBS = [
{''.join(f"  {{ cy: {k['cy']}, ry: {k['ry']}, outline: [{', '.join(f'{px}, {py}' for px, py in k['outline'])}] }},{chr(10)}" for k in knobs)}] as const

/** The paper matches the roller (x0–x1) and goes in at its top edge;
 *  `line` is the entry line, just above the rod's clips. */
export const LINE_ROLLER = {{ x0: {ROLLER['x0']}, x1: {ROLLER['x1']}, top: {ROLLER['top']}, line: {LINE} }} as const

/** The bell rings about the foot of its dome. */
export const LINE_BELL_PIVOT = {{ x: {BELL['cx']}, y: {BELL['base']} }} as const

/** The whole machine's width, lever tip to right knob: index.css sizes the
 *  paper from it (desktop: the machine at most 88% of the viewport). */
export const LINE_MACHINE = {{ x0: {mx0 + OFFSET[0]}, x1: {mx1 + OFFSET[0]} }} as const
""")
    print('wrote', TS_OUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
