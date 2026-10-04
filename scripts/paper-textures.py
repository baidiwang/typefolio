"""Paper textures (see README, "Paper").

Writes overlays to public/paper/:

- grain: fine fibres, two tiles of coprime sizes layered, so the pattern
  only repeats every few thousand pixels;
- fold, fold-aged: a letter page folded in thirds (the aged sheet's creases
  are stronger);
- the aged sheet (the default): foxing (two coprime tiles of small spots),
  wrinkles (two coprime tiles at a third of display resolution: they're
  soft), stains (one tall field at a third of display resolution, taller
  than the page, so no stain ever repeats), and the worn edges (alpha masks for the left and right sides,
  with nicks and short tears, coprime heights).

Every overlay is a warm shadow or a warm light at a few % alpha, so it
works on any theme's --paper colour and keeps it warm.

All noise is made periodic by construction (filtered in the frequency
domain), so tiles have no seams. Seeded: re-running gives the same files.

    python3 -B scripts/paper-textures.py
"""

from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parent.parent / 'public' / 'paper'
QUALITY = 80
# Overlay colours: a warm brown shadow and a warm white light, so the
# texture darkens towards sepia rather than grey and the paper stays warm.
SHADOW = (120, 78, 32)
LIGHT = (255, 250, 236)

# Letter paper is 8.5 × 11 in. At the sheet's widest (about 944 css px) a
# page is about 1222 px tall; folded in thirds, a crease every 407 px. The
# CSS sizes this tile to the sheet's width, so pages keep letter proportions
# at any width.
PAGE_W, PAGE_H = 944, 1222


def periodic_noise(rng, h, w, *, scale, aspect=1.0, angle=0.0):
    """Band-limited noise that tiles: white noise through a Gaussian in the
    frequency domain. `scale` is the feature size in px; `aspect` > 1
    stretches features along `angle` (radians), for fibres."""
    fy = np.fft.fftfreq(h)[:, None]
    fx = np.fft.fftfreq(w)[None, :]
    c, s = np.cos(angle), np.sin(angle)
    along = fx * c + fy * s
    across = -fx * s + fy * c
    sigma = 1.0 / (2 * np.pi * scale)
    g = np.exp(-0.5 * (((along * aspect) / sigma) ** 2 + (across / sigma) ** 2))
    g[0, 0] = 0
    n = np.real(np.fft.ifft2(np.fft.fft2(rng.standard_normal((h, w))) * g))
    return n / n.std()


def fibres(rng, size):
    """Very fine paper fibre: speckle plus short strands in all directions."""
    n = 0.6 * periodic_noise(rng, size, size, scale=0.7)
    for _ in range(5):
        n += 0.35 * periodic_noise(
            rng, size, size, scale=0.6, aspect=8, angle=rng.uniform(0, np.pi)
        )
    return n / n.std()


def to_rgba(signed, max_alpha):
    """Signed values in [-1, 1] → warm light (positive) / warm shadow
    (negative) with alpha up to `max_alpha` (0–1)."""
    v = np.clip(signed, -1, 1)
    a = np.round(np.abs(v) * max_alpha * 255).astype(np.uint8)
    rgb = np.where(v[..., None] > 0, LIGHT, SHADOW).astype(np.uint8)
    return Image.fromarray(np.dstack([rgb, a]), 'RGBA')


def grain_tile(rng, size, max_alpha):
    # Darken only: fibres are slightly darker than the sheet.
    n = fibres(rng, size)
    return to_rgba(-np.clip(n / 3, 0, 1), max_alpha)


def folded_tile(rng, width=PAGE_W, max_alpha=0.05):
    """Two creases per page, each a soft shadow above a soft highlight, with
    a slight wobble and uneven pressure along its length."""
    y = np.arange(PAGE_H)[:, None]
    wobble = periodic_noise(rng, 1, width, scale=60)[0] * 1.2
    pressure = 0.75 + 0.25 * periodic_noise(rng, 1, width, scale=40)[0]
    v = np.zeros((PAGE_H, width))
    for k in (1, 2):
        d = y - (k * PAGE_H / 3 + wobble[None, :])
        # Valley fold: shadow on the upper side, highlight below, with a wide
        # faint shading falling off on both sides.
        line = -np.tanh(d / 1.2) * np.exp(-(d / 3) ** 2)
        broad = -0.35 * np.sign(d) * np.exp(-np.abs(d) / 40)
        v += (line + broad) * pressure[None, :]
    return to_rgba(-v, max_alpha)


# —— Aged paper (a letter from the 1960s) —————————————————————————————————
STAIN = (138, 92, 38)     # tea-brown: stains and foxing
FIELD_SCALE = 3           # the stain/wrinkle field is drawn at 1/3 size
FIELD_W, FIELD_H = 960, 7200  # css px it covers (wider and taller than the page)
EDGE_W = 18               # css px of each edge mask
EDGE_H = (2400, 2213)     # left, right: coprime, so nicks don't line up


def tinted(alpha, colour=STAIN):
    a = np.clip(np.round(alpha * 255), 0, 255).astype(np.uint8)
    rgb = np.broadcast_to(np.array(colour, np.uint8), alpha.shape + (3,))
    return Image.fromarray(np.dstack([rgb, a]), 'RGBA')


def foxing_tile(rng, size, count, max_alpha):
    """Small rust-brown spots, single and in loose clusters, soft-edged."""
    yy, xx = np.mgrid[0:size, 0:size]
    alpha = np.zeros((size, size))
    centres = []
    for _ in range(count):
        cx, cy = rng.uniform(0, size, 2)
        centres.append((cx, cy))
        if rng.random() < 0.35:  # a cluster around this one
            for _ in range(rng.integers(2, 6)):
                centres.append((cx + rng.normal(0, 7), cy + rng.normal(0, 7)))
    for cx, cy in centres:
        r = rng.uniform(0.6, 2.4)
        # Wrapped distance, so spots crossing an edge continue on the other.
        dx = (xx - cx + size / 2) % size - size / 2
        dy = (yy - cy + size / 2) % size - size / 2
        d = np.sqrt(dx * dx + dy * dy)
        spot = np.clip(1 - d / (r + 1.2), 0, 1) ** 1.5
        alpha = np.maximum(alpha, spot * rng.uniform(0.5, 1) * max_alpha)
    return tinted(alpha)


def stain_field(rng, max_alpha=0.07):
    """Light stains: soft irregular blotches with a slightly darker tide
    line, scattered sparsely over the whole field (wrapping vertically)."""
    w, h = FIELD_W // FIELD_SCALE, FIELD_H // FIELD_SCALE
    yy, xx = np.mgrid[0:h, 0:w]
    alpha = np.zeros((h, w))
    wobble = periodic_noise(rng, h, w, scale=6)
    for _ in range(26):
        cx, cy = rng.uniform(0, w), rng.uniform(0, h)
        r = rng.uniform(6, 24)            # 18–72 css px
        squash = rng.uniform(0.6, 1.0)
        dy = (yy - cy + h / 2) % h - h / 2
        d = np.sqrt((xx - cx) ** 2 + (dy / squash) ** 2) / r + 0.12 * wobble
        body = np.clip(1 - d, 0, 1) ** 0.6 * 0.45
        tide = np.exp(-((d - 0.95) / 0.07) ** 2)
        alpha = np.maximum(alpha, (body + tide) * rng.uniform(0.5, 1) * max_alpha)
    return tinted(alpha)


def wrinkle_tile(rng, size, max_alpha=0.035):
    """Soft wrinkles: ridges of low-frequency noise, lit from the top left.
    Drawn at 1/FIELD_SCALE; two coprime tiles are layered."""
    w = h = size
    height = -np.abs(periodic_noise(rng, h, w, scale=14, aspect=2.5, angle=0.3))
    height += -0.6 * np.abs(periodic_noise(rng, h, w, scale=9, aspect=2, angle=1.9))
    gy = (np.roll(height, -1, 0) - np.roll(height, 1, 0)) / 2
    gx = (np.roll(height, -1, 1) - np.roll(height, 1, 1)) / 2
    light = -(gx * -0.5 + gy * -0.8)
    return to_rgba(light / np.abs(light).max() * 1.4, max_alpha)


def edge_mask(rng, height, side):
    """Opaque where the sheet is, transparent past its worn edge: a slight
    wobble, a few nicks (small V notches) and short tears (thin slits
    running in from the edge). `side` is 'left' or 'right'."""
    ss = 3  # supersampled, then reduced: anti-aliased edges
    w, h = EDGE_W * ss, height * ss
    yy, xx = np.mgrid[0:h, 0:w]
    # Worn: a slow wobble plus fine roughness, 1–7 px in from the box.
    slow = periodic_noise(rng, h, 1, scale=60 * ss)[:, 0]
    fine = periodic_noise(rng, h, 1, scale=3 * ss)[:, 0]
    edge = (3.5 + 1.8 * slow + 0.6 * fine) * ss
    edge = np.clip(edge, 1 * ss, 8 * ss)
    rows = np.arange(h)
    for _ in range(int(height / 180)):  # nicks: small V notches
        y0 = rng.uniform(0, h)
        depth = rng.uniform(4, 10) * ss
        half = rng.uniform(3, 8) * ss
        dy = np.abs((rows - y0 + h / 2) % h - h / 2)
        edge = np.maximum(edge, np.clip(depth * (1 - dy / half), 0, None))
    inside = xx >= edge[:, None]
    for _ in range(int(height / 400)):  # tears: thin slits running in
        y0 = rng.uniform(0, h)
        length = rng.uniform(10, 17) * ss
        slope = rng.uniform(-0.5, 0.5)
        ydev = (yy - y0 - slope * xx)
        width = (1.0 - 0.6 * xx / length) * ss  # wider at the edge
        slit = (np.abs(ydev) < width) & (xx < length)
        inside &= ~slit
    a = inside.astype(float)
    img = Image.fromarray((a * 255).astype(np.uint8), 'L').resize((EDGE_W, height), Image.LANCZOS)
    a = np.array(img)
    if side == 'right':
        a = a[:, ::-1]
    black = np.zeros(a.shape + (3,), np.uint8)
    return Image.fromarray(np.dstack([black, a]), 'RGBA')


def save(img, name):
    path = OUT / name
    img.save(path, 'WEBP', quality=QUALITY, alpha_quality=60, method=6)
    return path.stat().st_size


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for stale in OUT.glob('*.webp'):
        stale.unlink()
    rng = np.random.default_rng(7)
    sizes = {
        'grain-a.webp': save(grain_tile(rng, 128, 0.035), 'grain-a.webp'),
        'grain-b.webp': save(grain_tile(rng, 97, 0.025), 'grain-b.webp'),
        'fold.webp': save(folded_tile(rng), 'fold.webp'),
    }
    # The aged sheet (own seed, so the files above don't change).
    rng = np.random.default_rng(1961)
    sizes |= {
        'fold-aged.webp': save(folded_tile(rng, max_alpha=0.1), 'fold-aged.webp'),
        'foxing-a.webp': save(foxing_tile(rng, 512, 9, 0.12), 'foxing-a.webp'),
        'foxing-b.webp': save(foxing_tile(rng, 389, 5, 0.1), 'foxing-b.webp'),
        'stains.webp': save(stain_field(rng), 'stains.webp'),
        'wrinkles-a.webp': save(wrinkle_tile(rng, 211), 'wrinkles-a.webp'),
        'wrinkles-b.webp': save(wrinkle_tile(rng, 157, 0.025), 'wrinkles-b.webp'),
        'edge-l.webp': save(edge_mask(rng, EDGE_H[0], 'left'), 'edge-l.webp'),
        'edge-r.webp': save(edge_mask(rng, EDGE_H[1], 'right'), 'edge-r.webp'),
    }
    for name, size in sizes.items():
        print(f'{name:16} {size / 1024:5.1f} KB')
    print(f'{"total":16} {sum(sizes.values()) / 1024:5.1f} KB')


if __name__ == '__main__':
    main()
