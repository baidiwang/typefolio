#!/usr/bin/env python3
"""
Split the engraved typewriter (art/typewriter-engraving.png: sepia line
engraving, front view, on white) into rig layers for ?palette=mono, and
write their geometry to src/typewriter/engraving.ts.

    pip install pillow numpy
    python3 -B scripts/engraving-layers.py

Layers, back to front (docs/typewriter-rig.md, "engraving"):
  back      paper colour in the machine's outline behind the carriage, so
            sliding it never shows a hole
  carriage  the roller, the rod with its two clips, the collars, both
            knobs and the return lever; slides as text types
  body      everything that stays put, with the ribbon spools and the type
            guide (which sit in front of the roller) and a hole where the
            carriage and the bell are
  bell      the bell's dome; rings about the foot of the dome

Only the white outside the machine is made transparent: a flood fill from
the image's edges over near-white pixels, run on the ink closed by a few
pixels so it can't leak through a break in an outline. Everything inside
stays opaque, and its white becomes the paper colour.

Raster, not vector: tracing the drawing (potrace, 1–3 tone levels) keeps
edges crisp but loses its continuous-tone shading and fine hatching
(README, "The engraved typewriter"). So each layer is exported at twice
the source resolution, resampled with Lanczos and lightly sharpened, as
WebP, once per ink colour (?ink=sepia|black).
"""

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'art' / 'typewriter-engraving.png'
OUT = ROOT / 'public' / 'art'
TS_OUT = ROOT / 'src' / 'typewriter' / 'engraving.ts'

PAPER = (251, 250, 247)  # --paper in ?palette=mono
INKS = {'sepia': None, 'black': (26, 26, 24)}  # None: as drawn
WHITE = 232  # luminance above which a pixel counts as background white
CLOSE = 3  # px the ink is closed by before the outside flood fill
EXPORT_SCALE = 2
QUALITY = 82

# —— Landmarks, in source px (1661 × 947), measured on the drawing ————————
ROLLER = {'x0': 487, 'x1': 1170, 'top': 466}  # the cylinder; top = entry line
EXPORT_BOTTOM = 720  # nothing below this is ever on screen
# The carriage: everything down to the bottom of the rail under the roller,
# in one straight edge (a step would open a gap as it slides), and its two
# ends (the lever post with the left knob, the right post with the right
# knob) a little further down.
CARRIAGE_BOTTOM, CARRIAGE_BOTTOM_ENDS = 537, 548
ENDS_X = (452, 1212)
# Over the typebar fan the rail's lower half and the fan's top stay put.
FAN_BAND = (640, 523, 1030, CARRIAGE_BOTTOM)  # box x0, y0, x1, y1
# In front of the roller (they stay with the body). Each spool: a disc
# seen a little from above, its top face an ellipse (cx, cy, rx, ry) on a
# side down to `bottom`, with a hub on top (r).
SPOOLS = [
    {'cx': 570, 'cy': 527, 'rx': 55, 'ry': 10, 'bottom': 553, 'hub': 10},
    {'cx': 1083, 'cy': 527, 'rx': 54, 'ry': 10, 'bottom': 553, 'hub': 10},
]
TYPE_GUIDE = (799, 505, 854, 566)  # box x0, y0, x1, y1
# The bell's dome: a half ellipse standing on its rim.
BELL = {'cx': 1203, 'base': 582, 'rx': 41, 'ry': 56}
# Behind the carriage the machine is filled with paper colour (the `back`
# layer: the machine's own outline, between these columns).
FILL_X = (470, 1212)


def load():
    rgb = np.array(Image.open(SRC).convert('RGB')).astype(float)
    return rgb, rgb @ [0.299, 0.587, 0.114]


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
            if free[y, x] and not seen[y, x]:
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
    # Grow back to the real ink edge (the closing pushed it out by CLOSE px).
    grown = np.array(Image.fromarray((seen * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(k))) > 0
    return grown & ~ink


def masks(shape):
    h, w = shape
    y, x = np.mgrid[0:h, 0:w]
    front = np.zeros(shape, bool)
    for s in SPOOLS:
        top = ((x - s['cx']) / s['rx']) ** 2 + ((y - s['cy']) / s['ry']) ** 2 <= 1
        side = (np.abs(x - s['cx']) <= s['rx']) & (y >= s['cy']) & (y <= s['bottom'])
        hub = (x - s['cx']) ** 2 + (y - (s['cy'] - s['ry'])) ** 2 <= s['hub'] ** 2
        front |= top | side | hub
    for bx0, by0, bx1, by1 in (TYPE_GUIDE, FAN_BAND):
        front |= (x >= bx0) & (x <= bx1) & (y >= by0) & (y <= by1)

    bell = (((x - BELL['cx']) / BELL['rx']) ** 2 + ((y - BELL['base']) / BELL['ry']) ** 2 <= 1) & (y <= BELL['base'] + 2)

    at_ends = (x < ENDS_X[0]) | (x > ENDS_X[1])
    carriage = (y <= CARRIAGE_BOTTOM) | (at_ends & (y <= CARRIAGE_BOTTOM_ENDS))
    carriage &= ~bell
    return carriage, front, bell


def fill_behind(rgb, hole):
    """Continue the roller and rail behind the parts in front of them: each
    hole pixel copies the pixel one hole-width to its left (repeatedly), so
    the carriage has no gap to slide out from under the spools."""
    out = rgb.copy()
    for y in np.nonzero(hole.any(axis=1))[0]:
        xs = np.nonzero(hole[y])[0]
        # runs of hole pixels in this row
        breaks = np.nonzero(np.diff(xs) > 1)[0]
        for run in np.split(xs, breaks + 1):
            x0, x1 = run[0], run[-1] + 1
            w = x1 - x0
            for x in range(x0, x1):
                sx = x - w
                while sx >= 0 and hole[y, sx]:
                    sx -= w
                out[y, x] = out[y, max(sx, 0)]
    return out


def colour(rgb, lum, ink):
    """White → paper; the drawing as drawn (sepia) or in one ink colour."""
    paper = np.array(PAPER, float)
    if ink is None:
        return rgb * paper / 255
    dark = np.percentile(lum[lum < WHITE], 3)
    t = np.clip((250 - lum) / (250 - dark), 0, 1)[..., None]
    return paper * (1 - t) + np.array(ink, float) * t


def bbox(mask):
    ys, xs = np.nonzero(mask)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def export(name, rgb, alpha, box):
    x0, y0, x1, y1 = box
    rgba = np.dstack([rgb[y0:y1, x0:x1], alpha[y0:y1, x0:x1] * 255]).clip(0, 255).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA')
    big = im.resize((im.width * EXPORT_SCALE, im.height * EXPORT_SCALE), Image.LANCZOS)
    r, g, b, a = big.split()
    sharp = Image.merge('RGB', (r, g, b)).filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
    big = Image.merge('RGBA', (*sharp.split(), a))
    path = OUT / f'{name}.webp'
    big.save(path, quality=QUALITY, method=6)
    print(f'{name:28s} {big.width:5d}x{big.height:<4d} {path.stat().st_size / 1024:6.1f} KB')
    return {'src': f'/art/{name}.webp', 'x': x0, 'y': y0, 'w': x1 - x0, 'h': y1 - y0}


def main():
    rgb, lum = load()
    opaque = ~outside_mask(lum)
    opaque[EXPORT_BOTTOM:] = False
    carriage, front, bell = masks(lum.shape)
    carriage &= opaque
    bell &= opaque
    body = opaque & ~(carriage & ~front) & ~bell
    behind = carriage & front
    h, w = lum.shape
    yy, xx = np.mgrid[0:h, 0:w]
    back = opaque & (xx >= FILL_X[0]) & (xx <= FILL_X[1]) & (yy >= ROLLER['top']) & (yy <= CARRIAGE_BOTTOM_ENDS)
    # The entry line: the top of the highest part over the paper (the rod's
    # clips; a wire tip a few px wide doesn't count), so typed text is never
    # under the machine. Between it and the
    # roller the paper shows behind the rod: the back layer paints it.
    over_paper = opaque & (xx >= ROLLER['x0']) & (xx <= ROLLER['x1'])
    line = int(np.nonzero(over_paper.sum(axis=1) >= 8)[0].min())
    back |= (xx >= ROLLER['x0']) & (xx <= ROLLER['x1']) & (yy >= line) & (yy <= ROLLER['top'])

    for old in OUT.glob('engraving-*.webp'):
        old.unlink()
    boxes = {}
    paper = np.broadcast_to(np.array(PAPER, float), rgb.shape)
    box = bbox(back)
    boxes[('back', None)] = export('engraving-back', paper, back, box)
    for part, mask in (('carriage', carriage), ('body', body), ('bell', bell)):
        box = bbox(mask)
        for ink, ink_rgb in INKS.items():
            coloured = colour(rgb, lum, ink_rgb)
            if part == 'carriage':
                coloured = fill_behind(coloured, behind)
            boxes[(part, ink)] = export(f'engraving-{part}-{ink}', coloured, mask, box)

    def layer(part):
        e = boxes[(part, 'sepia')]
        srcs = ', '.join(f"{ink}: '{boxes[(part, ink)]['src']}'" for ink in INKS)
        return f"{{ src: {{ {srcs} }}, x: {e['x']}, y: {e['y']}, w: {e['w']}, h: {e['h']} }}"

    TS_OUT.write_text(f"""// Generated by scripts/engraving-layers.py — do not edit by hand.
// Geometry of the engraved typewriter (?palette=mono) in source px of
// art/typewriter-engraving.png. The page scales it so the roller matches
// the paper's width. The paper goes in at the roller's top edge; the entry
// line (where text appears) is a little higher, at the top of the rod's
// clips, so no text is ever under the machine.

/** Each layer's image (per ink colour, ?ink=sepia|black) and where it sits.
 *  Back to front: back (paper colour behind the carriage), carriage, body,
 *  bell. */
export const ENGRAVING = {{
  back: {{ src: '{boxes[('back', None)]['src']}', x: {boxes[('back', None)]['x']}, y: {boxes[('back', None)]['y']}, w: {boxes[('back', None)]['w']}, h: {boxes[('back', None)]['h']} }},
  carriage: {layer('carriage')},
  body: {layer('body')},
  bell: {layer('bell')},
}} as const

/** The roller: the paper matches x0–x1 and goes in at its top edge. `line`
 *  is the entry line (the strip's top edge). */
export const ENGRAVING_ROLLER = {{ x0: {ROLLER['x0']}, x1: {ROLLER['x1']}, top: {ROLLER['top']}, line: {line} }} as const

/** The bell rings about the foot of its dome. */
export const ENGRAVING_BELL_PIVOT = {{ x: {BELL['cx']}, y: {BELL['base']} }} as const

/** Where the note's arrow points: the right post (the note sits on the desk
 *  above it), in source px. */
export const ENGRAVING_POST = {{ x: {ENDS_X[1]}, top: {int(np.nonzero((opaque & (xx >= ENDS_X[1]) & (xx <= ENDS_X[1] + 40)).any(axis=1))[0].min())} }} as const
""")
    print('wrote', TS_OUT.relative_to(ROOT))


if __name__ == '__main__':
    main()
