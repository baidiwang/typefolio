# Typewriter rig

The typewriter is one hand-drawn image, `art/typewriter.png` (square,
transparent background), split into layers by
[`scripts/typewriter-layers.py`](../scripts/typewriter-layers.py) and
animated by [`Typewriter.tsx`](../src/typewriter/Typewriter.tsx) in step with
the reveal controller. The plant is a separate drawing, `art/plant.png`.

The source PNGs live in `art/` (not `public/`), so only the exported WebP
layers ship.

## The scene

A wide-carriage machine: the body stays its drawn size, centred under the
paper, and the carriage is extended so the roller spans the paper exactly,
with a knob at each paper edge and the return lever at the left end.

The paper goes into the roller. `.typewriter` (fixed to the bottom of the
viewport, marked `data-reveal-inset`) is a desk-coloured strip from the
roller's top edge down, so below that edge only the desk and the machine's
body show, never paper or text. The edge is the platen line: the reveal
controller types an element once its top crosses it. Lines of that element
that are typed but still below the roller are under the strip, so they stay
hidden until the paper feeds them out. Above the edge, the roller, lever,
knobs, bell and the top of the body stand in front of the paper.

| Breakpoint | Body height (`--tw-body`) | Gap below (`--tw-gap`) | Plant | Sound button |
| --- | --- | --- | --- | --- |
| desktop (≥ 720 px) | `min(190px, 22.5vh)` | 10 px | shown | top-right |
| phones (< 720 px) | `min(100px, 12vh)` | `max(8px, safe-area-inset-bottom)` | hidden | bottom-right, on the desk |

The strip is `--tw-body × --tw-below + --tw-gap` tall, where `--tw-below`
(≈ 0.95, set by `Typewriter.tsx` from the drawing) is how far the body
reaches below the roller's top edge. The paper's bottom padding and the
page's scroll padding use the strip height, so the last line and focused
links clear the roller. On phones the strip is 103 px, 12% of a 390×844
screen.

On phones the paper has a 12 px gutter, so the lever and the knobs' outer
halves run off the screen edge (the strip clips sideways, so it never
scrolls).

## Layers

Back to front:

| Layer | File | Contents | Motion |
| --- | --- | --- | --- |
| body | `public/art/typewriter-body.webp` | the machine minus the moving parts, keys included. The strip of body hidden behind the roller is filled in (red continued from below, the ribbon cover extended up, the side edges redrawn), so sliding the carriage never reveals a hole | static, centred on the paper |
| bell | `public/art/typewriter-bell.webp` | the bell on its stem; the stem is extended down behind the roller | rings: `rotate(0 → 10 → −8 → 4 → 0deg)` over 420 ms about the stem's foot (`BELL_PIVOT`) whenever an element finishes (`bell: true`) |
| roller middle | `public/art/typewriter-roller-mid.webp` | a tile of the roller's middle (see below), repeated horizontally to fill the paper's width | slides with the carriage |
| roller ends | `typewriter-roller-l.webp`, `-roller-r.webp` | left: return lever, collar and the first stretch of roller; right: the last stretch and its collar | slide with the carriage |
| knob L / R | `typewriter-knob-l.webp`, `-knob-r.webp` | the platen knobs, outside the collars at the paper's edges | slide with the carriage; turn `rotate(0 → −14 → 3 → 0deg)` over 220 ms about their hubs on each line feed |
| plant | `public/art/plant.webp` | potted plant | sways `rotate(±2deg)` about its base when the bell rings |

The carriage (`.tw-carriage`: middle, ends and knobs) slides
`translateX(−column × STEP × scale)` per typed character (`STEP` = 1.4
reference px) and returns to 0 with a 260 ms ease on carriage return. Keys
stay static. Under reduced motion nothing moves (the controller sends no
events).

## The roller: three slices

The drawn roller is never stretched. The script:

1. **Straightens it.** The drawn edges wobble by a pixel or two, so each
   column of the roller is resampled into one band (its median top and
   bottom edges). Towards the ends the correction fades out (smoothstep over
   the last 50 px), so the ends keep their drawn shape and still meet the
   band exactly at the seams.
2. **Cuts the ends** 50 reference px in from each end of the cylinder,
   nudged to the darkest column nearby (between the grey highlight dashes).
3. **Builds the middle tile.** The roller between the seams is cut into 5
   slices, again at dark columns, and laid end to end in a seeded random
   order (never the same slice twice in a row, nor at the wrap), about
   2600 reference px long. That's longer than the widest paper needs, so the
   tile doesn't visibly repeat; if it ever does, it repeats at a dark seam.

On the page the end slices hang off the paper's edges (`--pl`, `--pr`,
measured by `Typewriter.tsx`), and the middle fills the gap between them.

## Geometry

All coordinates are reference px (the drawing resampled to 1024×1024) and are
generated into [`src/typewriter/layers.ts`](../src/typewriter/layers.ts):

- `LAYERS` — where each layer image sits in the drawing (x, y, w, h).
  `rollerL`/`knobL` are placed from the roller's left end, `rollerR`/`knobR`
  from its right end, the body and bell from the roller's centre.
- `ROLLER_MID` — the middle tile's rows and length.
- `ROLLER` — the cylinder's ends (`x0`, `x1`), the seams, its top edge and
  centre.
- `BELL_PIVOT`, `KNOB_L_PIVOT`, `KNOB_R_PIVOT` — rotation centres.
- `PLANT` — the plant's crop.

Every size is `calc(var(--tw-body) × n / body height)`, so the CSS variable
alone sizes the machine; vertical positions are measured from the roller's
top edge (the top of the strip). `Typewriter.tsx` only measures the paper's
edges and centre (`--pl`, `--pr`, `--pc`) and the carriage step.

## Plant

On the desk just right of the body, on the body's baseline (the bottom of
the strip, above `--tw-gap`), half the body's height. It sits entirely below
the roller, so it's always on the desk, never on the paper. Hidden on phones,
where the sound button stands there.

## Export

- WebP at 2× the largest display size (body 380 px tall, plant 190 px),
  quality 84. Current sizes:

  | Layer | Pixels | Size |
  | --- | --- | --- |
  | body | 562×380 | 53 KB |
  | roller middle | 2066×25 | 10 KB |
  | roller ends | 166×133 / 60×44 | 7 KB |
  | knob L / R | 52×82 / 32×82 | 5 KB |
  | bell | 65×108 | 3 KB |
  | plant | 78×190 | 8 KB |
  | **total** | | **≈ 85 KB** |

- `index.html` preloads the body and the roller's middle (they're on every
  first screen).

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
4. Check the cut: look at the roller at full size for seams, and slide the
   carriage (or type) to check nothing behind it has holes.

## Nothing interactive

The typewriter is decorative: the strip is `aria-hidden`, every image has
empty `alt`, and nothing on it is focusable or clickable
(`pointer-events: none`). The contact links are printed on the paper
(letterhead and closing), and the sound toggle is its own button
([`SoundToggle.tsx`](../src/components/SoundToggle.tsx)): top-right on
desktop, bottom-right on the desk on phones.

## Sound

`src/typewriter/sound.ts` synthesises keystroke, return and bell sounds with
Web Audio. It's off on every visit; the speaker button toggles it. The
`AudioContext` is only created on that click.
