# Typewriter rig

The typewriter is one hand-drawn image, `art/typewriter.png` (1024×1024,
transparent background), split into layers by
[`scripts/typewriter-layers.py`](../scripts/typewriter-layers.py) and
animated by [`Typewriter.tsx`](../src/typewriter/Typewriter.tsx) in step with
the reveal controller. The plant is a separate drawing, `art/plant.png`.

The source PNGs live in `art/` (not `public/`), so only the exported WebP
layers ship.

## Layers

Back to front:

| Layer | File | Contents | Motion |
| --- | --- | --- | --- |
| body | `public/art/typewriter-body.webp` | the machine, keys included. The strip of body hidden behind the roller is filled in (red continued from below, the ribbon cover extended up, the side edges redrawn), so sliding the carriage never reveals a hole | static. Clipped at the roller's top edge: above it the paper is in front of the machine |
| bell | `public/art/typewriter-bell.webp` | the bell on its stem; the stem is extended down behind the roller so it never ends in mid-air when the carriage slides away | rings: `rotate(0 → 10 → −8 → 4 → 0deg)` over 420 ms about the stem's foot (`BELL_PIVOT`), whenever an element finishes (`bell: true`). Shifted right by `--bell-shift` (at most 30 source px) so it stands in the paper's right margin, clear of the text |
| carriage | `public/art/typewriter-carriage.webp` | roller, both knobs, end collars and the return lever | slides: `translateX(−column × STEP × s)` per typed character (`STEP` = 1 source px), back to 0 with a 260 ms ease on carriage return; the roller nudges down 1.5 source px on each line feed |
| plant | `public/art/plant.webp` | potted plant | sways `rotate(±1.4deg)` about its base when the bell rings |

Keys stay static. Under reduced motion nothing moves (the controller sends no
events).

## Geometry

All coordinates are in the source drawing's px and are generated into
[`src/typewriter/layers.ts`](../src/typewriter/layers.ts):

- `LAYERS` — where each layer image sits in the drawing (x, y, w, h).
- `ROLLER` — the roller cylinder: `x0`, `x1` (its ends, collars excluded)
  and `top` (its top edge).
- `BELL_PIVOT` — the foot of the bell's stem.
- `PLANT` — the plant's crop.

At runtime `Typewriter.tsx` measures the paper and sets:

| CSS variable | Value |
| --- | --- |
| `--s` | paper width ÷ (`ROLLER.x1 − ROLLER.x0`): the roller spans the paper exactly |
| `--machine-left` | paper left − `ROLLER.x0 × s` |
| `--machine-top` | −`ROLLER.top × s`: the roller's top edge sits on the strip's top edge |
| `--bell-shift` | how far the bell moves right to clear the text column |
| `--typewriter-overhang` | how far the bell rises above the roller (`(ROLLER.top − bell.y) × s`, ≈150 px on desktop) |
| `--plant-left`, `--plant-height` | the plant's place beside the paper |

The strip itself (`.typewriter`, marked `data-reveal-inset`) runs from the
roller's top edge to the bottom of the viewport, in the desk colour: below
the roller the paper has gone into the machine. Its top edge is the platen
line where text appears.

| Breakpoint | Strip height | Shown |
| --- | --- | --- |
| desktop (≥ 640 px) | `min(200px, 30vh)` | roller, body down to the keyboard frame; bell, lever and knobs rise above the strip by up to `--typewriter-overhang` |
| phones (< 640 px) | `min(20vw, 15vh)` | roller and the top of the body only; clipped to the strip, bell and plant hidden |

The paper's bottom padding and the page's scroll padding include the strip
and the overhang, so the last line and focused links clear the machine.

## Plant

On the desk to the right of the paper, standing on the strip's bottom edge
(same line as the machine), behind the machine where they overlap. Its
height is `min(420px, 50vh, room beside the paper ÷ aspect)`; it's hidden
when the room beside the paper is under 110 px wide (≈ windows narrower than
1240 px), and always on phones.

## Export

- WebP at 2× the desktop display size. The drawing is 1024 px and shows at
  about 1.5× on desktop, so this is a ~3× upscale (Lanczos); it adds
  sharpness on retina screens, not detail.
- Quality 82 (alpha 90). Current sizes:

  | Layer | Pixels | Size |
  | --- | --- | --- |
  | body | 2056×721 | 131 KB |
  | carriage | 2533×513 | 86 KB |
  | bell | 251×419 | 15 KB |
  | plant | 343×840 | 65 KB |
  | **total** | | **≈ 296 KB** |

- The body is cropped at source row 520: no breakpoint shows deeper.
- `index.html` preloads the body and carriage (they're on every first
  screen).

## Replacing the artwork

1. Drop the new drawing in `art/typewriter.png` (and/or `art/plant.png`),
   transparent background.
2. Update the measured landmarks at the top of
   `scripts/typewriter-layers.py` for the new drawing: the roller's ends
   (`ROLLER_X0/X1`), the rows just above and below it (`ABOVE_ROW`,
   `BELOW_ROW`), the body's columns above the roller (`ABOVE_X0/X1`), a
   column always inside the body (`CENTER_X`), and the bell's box and a
   point on it (`BELL_BOX`, `BELL_SEED`).
3. Run:

   ```bash
   pip install pillow numpy
   python3 scripts/typewriter-layers.py
   ```

   It prints each layer's size and rewrites `src/typewriter/layers.ts`.
4. Check the cut: compose the layers with the carriage slid ~60 source px
   left and look for holes or pieces left behind (the script's comments say
   which rule assigns which pixels).

## Nothing interactive

The typewriter is decorative: the strip is `aria-hidden`, every image has
empty `alt`, and nothing on it is focusable or clickable
(`pointer-events: none`). The contact links are printed on the paper
(letterhead and closing), and the sound toggle is its own button in the
top-right corner ([`SoundToggle.tsx`](../src/components/SoundToggle.tsx)).

## Sound

`src/typewriter/sound.ts` synthesises keystroke, return and bell sounds with
Web Audio. It's off on every visit; the speaker button toggles it. The
`AudioContext` is only created on that click.
