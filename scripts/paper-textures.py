"""Paper textures (see README, "Paper").

Writes overlays to public/paper/:

- grain: fine fibres, two tiles of coprime sizes layered, so the pattern
  only repeats every few thousand pixels;
- fold: a letter page folded in thirds, the creases.

Every overlay is a warm shadow or a warm light at a few % alpha, so it
keeps the --paper colour warm.

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
    for name, size in sizes.items():
        print(f'{name:16} {size / 1024:5.1f} KB')
    print(f'{"total":16} {sum(sizes.values()) / 1024:5.1f} KB')


if __name__ == '__main__':
    main()
