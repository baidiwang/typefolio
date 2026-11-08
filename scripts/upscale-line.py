#!/usr/bin/env python3
"""
Upscale the line-art typewriter (art/typewriter-line.png) 2x with a
line-art model, Real-ESRGAN's realesr-animevideov3-x2, run on the CPU with
ncnn, and save the machine (cropped, with a margin) as
art/typewriter-line-2x.png, the master that scripts/line-layers.py cuts.

Only needed when the drawing changes; the master is committed.

    pip install ncnn pillow numpy
    # models: realesrgan-ncnn-vulkan-20220424-ubuntu.zip from
    # https://github.com/xinntao/Real-ESRGAN/releases/tag/v0.2.5.0
    python3 -B scripts/upscale-line.py path/to/models

The model sharpens the lines more cleanly than Lanczos does (it simplifies
a little of the finest hatching on the roller).
"""

import sys
from pathlib import Path

import ncnn
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'art' / 'typewriter-line.png'
OUT = ROOT / 'art' / 'typewriter-line-2x.png'
# The machine in the 2x image, with a margin: x0, y0, x1, y1.
CROP = (250, 720, 2250, 1640)
TILE, PAD = 192, 12


def main():
    models = Path(sys.argv[1] if len(sys.argv) > 1 else 'models')
    net = ncnn.Net()
    net.opt.use_vulkan_compute = False
    net.load_param(str(models / 'realesr-animevideov3-x2.param'))
    net.load_model(str(models / 'realesr-animevideov3-x2.bin'))

    im = np.array(Image.open(SRC).convert('RGB')).astype(np.float32) / 255
    h, w, _ = im.shape
    out = np.zeros((h * 2, w * 2, 3), np.float32)
    for y0 in range(0, h, TILE):
        for x0 in range(0, w, TILE):
            y1, x1 = min(y0 + TILE, h), min(x0 + TILE, w)
            py0, px0 = max(y0 - PAD, 0), max(x0 - PAD, 0)
            py1, px1 = min(y1 + PAD, h), min(x1 + PAD, w)
            tile = np.ascontiguousarray(im[py0:py1, px0:px1].transpose(2, 0, 1))
            ex = net.create_extractor()
            ex.input('data', ncnn.Mat(tile))
            _, o = ex.extract('output')
            o = np.array(o).transpose(1, 2, 0)
            oy, ox = (y0 - py0) * 2, (x0 - px0) * 2
            out[y0 * 2:y1 * 2, x0 * 2:x1 * 2] = o[oy:oy + (y1 - y0) * 2, ox:ox + (x1 - x0) * 2]
    big = Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8))
    big.crop(CROP).save(OUT, optimize=True)
    print('wrote', OUT.relative_to(ROOT), big.crop(CROP).size)


if __name__ == '__main__':
    main()
