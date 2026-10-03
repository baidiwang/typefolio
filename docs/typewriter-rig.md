# Typewriter rig

The typewriter is one hand-drawn image, `art/typewriter.png` (square,
transparent background), split into layers by
[`scripts/typewriter-layers.py`](../scripts/typewriter-layers.py) and
animated by [`Typewriter.tsx`](../src/typewriter/Typewriter.tsx) in step with
the reveal controller. The plant is a separate drawing, `art/plant.png`.

The source PNGs live in `art/` (not `public/`), so only the exported WebP
layers ship.

## The scene

The whole machine (bell, roller, body, keyboard, feet) stands on the desk at
the bottom of the viewport, centred on its roller, in front of the letter:
the paper scrolls on behind it. The plant stands just right of it, on the
same baseline, at half its height.

| Breakpoint | Machine height (`--tw-h`) | Gap below (`--tw-gap`) | Plant | Sound button |
| --- | --- | --- | --- | --- |
| desktop (≥ 720 px) | `min(220px, 26vh)` | 10 px | shown | top-right |
| phones (< 720 px) | `min(100px, 12vh)` | `max(8px, safe-area-inset-bottom)` | hidden | bottom-right, beside the machine |

`.typewriter` (fixed, `--tw-h + --tw-gap` tall, transparent, marked
`data-reveal-inset`) holds the scene. Its top edge is the top of the whole
scene (the bell, the highest part of the drawing), and that is the platen
line: the reveal controller types an element once its top crosses it. The
paper's bottom padding and the page's scroll padding use the same height, so
the last line and focused links clear the bell.

At 720 px, the narrowest desktop width, the plant's right edge is at 547 px,
well inside the window, so it never needs hiding there.

## Layers

Back to front, all inside `.typewriter__machine`:

| Layer | File | Contents | Motion |
| --- | --- | --- | --- |
| body | `public/art/typewriter-body.webp` | the whole machine minus the moving parts, keys included. The strip of body hidden behind the roller is filled in (red continued from below, the ribbon cover extended up, the side edges redrawn), so sliding the carriage never reveals a hole | static |
| bell | `public/art/typewriter-bell.webp` | the bell on its stem; the stem is extended down behind the roller so it never ends in mid-air when the carriage slides away | rings: `rotate(0 → 10 → −8 → 4 → 0deg)` over 420 ms about the stem's foot (`BELL_PIVOT`) whenever an element finishes (`bell: true`) |
| carriage | `public/art/typewriter-carriage.webp` | roller, end collars and the return lever. Red paint that bled onto the roller in the drawing is repainted roller-black | slides `translateX(−column × STEP × scale)` per typed character (`STEP` = 1.4 reference px), back to 0 with a 260 ms ease on carriage return |
| knob L / R | `public/art/typewriter-knob-l.webp`, `-knob-r.webp` | the platen knobs | slide with the carriage (they're inside `.tw-carriage`); turn `rotate(0 → −14 → 3 → 0deg)` over 220 ms about their hubs on each line feed |
| plant | `public/art/plant.webp` | potted plant (outside the machine box) | sways `rotate(±2deg)` about its base when the bell rings |

Keys stay static. Under reduced motion nothing moves (the controller sends no
events).

## Geometry

All coordinates are reference px (the drawing resampled to 1024×1024) and are
generated into [`src/typewriter/layers.ts`](../src/typewriter/layers.ts):

- `LAYERS` — where each layer image sits in the drawing (x, y, w, h).
- `MACHINE` — the box around every layer (bell top to feet, lever to knob).
- `ROLLER` — the roller cylinder: `x0`, `x1` (its ends, collars excluded)
  and `top`. The machine is centred on the roller's middle, not on its box
  (the lever sticks out further left than the knob does right).
- `BELL_PIVOT`, `KNOB_L_PIVOT`, `KNOB_R_PIVOT` — rotation centres.
- `PLANT` — the plant's crop.

`Typewriter.tsx` places every layer with `calc(var(--tw-h) × n / machine
height)`, so the CSS variable alone sizes the scene. There's no JS layout; a
ResizeObserver only keeps the carriage step in css px.

## Export

- WebP at 2× the largest display size (machine 440 px tall, plant 220 px),
  quality 84. Current sizes:

  | Layer | Pixels | Size |
  | --- | --- | --- |
  | body | 563×381 | 53 KB |
  | carriage | 625×133 | 9 KB |
  | knob L / R | 52×82 / 33×82 | 5 KB |
  | bell | 65×109 | 3 KB |
  | plant | 90×220 | 10 KB |
  | **total** | | **≈ 79 KB** |

- `index.html` preloads the body and carriage (they're on every first
  screen).

## Replacing the artwork

The script is re-runnable. It first resamples the source to the 1024 px
reference, so an upscaled version of the same drawing (e.g. a 4× upscale
dropped into `art/typewriter.png`) needs no other change; it just exports
from cleaner pixels. It removes the old WebPs before writing new ones.

1. Drop the new file in `art/typewriter.png` (and/or `art/plant.png`),
   square, transparent background.
2. Only for a *different* drawing: update the measured landmarks at the top
   of the script (roller ends and collars, the rows just above and below the
   roller, the body's columns above it, a column always inside the body, the
   bell's box and a point on it, the knob boxes).
3. Run:

   ```bash
   pip install pillow numpy
   python3 -B scripts/typewriter-layers.py
   ```

   It prints each layer's size and rewrites `src/typewriter/layers.ts`.
4. Check the cut: compose the layers with the carriage slid ~60 reference px
   left and look for holes or pieces left behind (the script's comments say
   which rule assigns which pixels).

## Nothing interactive

The typewriter is decorative: the scene is `aria-hidden`, every image has
empty `alt`, and nothing on it is focusable or clickable
(`pointer-events: none`). The contact links are printed on the paper
(letterhead and closing), and the sound toggle is its own button
([`SoundToggle.tsx`](../src/components/SoundToggle.tsx)): top-right on
desktop, bottom-right beside the machine on phones.

## Sound

`src/typewriter/sound.ts` synthesises keystroke, return and bell sounds with
Web Audio. It's off on every visit; the speaker button toggles it. The
`AudioContext` is only created on that click.
