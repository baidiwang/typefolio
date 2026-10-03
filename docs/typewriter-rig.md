# Typewriter rig

The typewriter is one hand-drawn image, `art/typewriter-wide.png` (about
3:1, transparent background), split into layers by
[`scripts/typewriter-layers.py`](../scripts/typewriter-layers.py) and
animated by [`Typewriter.tsx`](../src/typewriter/Typewriter.tsx) in step with
the reveal controller. The plant is a separate drawing, `art/plant.png`.

The source PNGs live in `art/` (not `public/`), so only the exported WebP
layers ship.

## The scene

A wide, low machine whose roller sits recessed in a notch between the
body's two raised shoulders. The paper is exactly as wide as the red body
(at its widest) and disappears behind the body's top edge, shoulders
included. The lever and knobs stand outside the paper, left and right.

`.typewriter` (fixed to the bottom of the viewport, marked
`data-reveal-inset`) is a desk-coloured strip from the body's top edge down,
so below that edge only the desk and the machine show, never paper or text.
The edge is the reveal line: the controller types an element once its top
crosses it, and lines of that element still below it stay hidden under the
strip until the paper feeds them out.

| | Desktop (≥ 720 px) | Phones (< 720 px) |
| --- | --- | --- |
| Sizing | the body shows from its top edge to just below the keyboard frame, `--tw-visible: min(230px, 26vh)`; that fixes the scale, and the paper narrows to the body's width | the paper keeps its width (viewport − 2 × 12 px); the machine is scaled so the body matches it |
| Shown | body top to keyboard frame; the plain red band below runs off the screen | the whole machine, ≈ 123 px of body at 390 px wide (146 px including the bell and lever above the edge) |
| Paper width | ≈ 816 px at 1440×900, 738 at 1280×800, 708 at 1366×768 | 366 px at 390 |
| Plant | beside the machine, if it fits | hidden |
| Sound button | top-right | top-right (the machine fills the bottom edge) |

The scale is `--tw-s`, css px per drawing px, which `Typewriter.tsx` sets
from the paper's measured width (body width ÷ drawing width). Every layer
is placed with `calc(var(--tw-s) × n × 1px)` from the body's top-left
corner, which sits at the paper's left edge (`--pl`) on the strip's top
edge. CSS gets the paper's desktop width from `--tw-visible` and the
drawing's aspect (`--tw-aspect`); the strip height (`--tw-strip`) from the
scale and the drawing's rows, and the paper's bottom padding and the scroll
padding use it.

Because the paper is narrower than before, desktop uses a 2.75rem paper
margin, a 1.5em gap between photo and text, and 18 px body text, so the 45%
text column holds about 25–29 characters per line at the sizes above (≈ 33
on phones). The margin also keeps the text clear of the bell and lever,
which reach about 48 and 30 drawing px inside the paper's edges.

## Layers

Back to front:

| Layer | File | Contents | Motion |
| --- | --- | --- | --- |
| roller | `public/art/typewriter-roller.webp` | the roller and its two paper guides, from the notch, extended 90 drawing px past both ends with stretches of roller from just inside it. Red streaks drawn on the roller are painted roller-black | slides; clipped to the notch (`.tw-notch`), so the extensions only ever show between the shoulders |
| body | `public/art/typewriter-body.webp` | the red body, shoulders and keyboard, with the notch cut out so the roller shows through | static |
| bell | `public/art/typewriter-bell.webp` | the bell on its stem, above the right shoulder | rings: `rotate(0 → 10 → −8 → 4 → 0deg)` over 420 ms about the stem's foot (`BELL_PIVOT`) whenever an element finishes |
| lever, axle | `typewriter-lever.webp`, `typewriter-axle-r.webp` | the return lever with the left axle; the right axle | slide with the roller |
| knob L / R | `typewriter-knob-l.webp`, `-knob-r.webp` | the platen knobs | slide with the roller; turn `rotate(0 → −14 → 3 → 0deg)` over 220 ms about their centres on each line feed |
| plant | `public/art/plant.webp` | potted plant (its pot's inside filled, so it reads on the desk) | sways `rotate(±2deg)` about its base when the bell rings |

The roller, lever, axle and knobs slide together,
`translateX(−column × STEP × scale)` per typed character (`STEP` = 0.5
drawing px, so a 60-character line moves them 30 drawing px, well inside the
roller's 90 px extensions), and return to 0 with a 260 ms ease on carriage
return. Under reduced motion nothing moves (the controller sends no events).

## Plant

On the desk to the right of the machine (8 px past the right knob), about
40% of the machine's height (bell top to feet), standing on the bottom of
the screen, which is where the machine's visible base is on desktop.
`Typewriter.tsx` hides it when it would reach within 8 px of the window's
right edge, and CSS hides it on phones.

## Geometry

All coordinates are reference px (the drawing resampled to 1536 px wide)
and are generated into [`src/typewriter/layers.ts`](../src/typewriter/layers.ts):

- `LAYERS` — where each layer image sits in the drawing (x, y, w, h).
- `BODY` — the body's widest extent (`x0`, `x1`: the paper matches it), its
  top edge (the reveal line), the bottom of the keyboard frame and its
  bottom.
- `NOTCH` — the roller's window between the shoulders.
- `MACHINE` — the box around everything drawn.
- `BELL_PIVOT`, `KNOB_L_PIVOT`, `KNOB_R_PIVOT` — rotation centres.
- `PLANT` — the plant's crop.

## Export

- WebP at the drawing's own resolution (the body shows at most ≈ 820 css px
  wide, so about 1.2× on desktop), quality 84; the plant at 2× its largest
  display size. Current sizes:

  | Layer | Pixels | Size |
  | --- | --- | --- |
  | body | 1012×342 | 73 KB |
  | roller | 918×56 | 6 KB |
  | lever, axle | 49×126, 34×40 | 4 KB |
  | knob L / R | 35×88 / 45×114 | 4 KB |
  | bell | 59×87 | 2 KB |
  | plant | 139×340 | 18 KB |
  | **total** | | **≈ 107 KB** |

- `index.html` preloads the body and the roller (they're on every first
  screen).

## Replacing the artwork

The script is re-runnable. It first resamples the source to 1536 px wide,
so an upscaled version of the same drawing dropped into
`art/typewriter-wide.png` needs no other change (exports are then capped
at the reference resolution; raise `EXPORT_SCALE` to use the extra pixels).
It removes old WebPs before writing new ones.

1. Drop the new file in `art/typewriter-wide.png` (and/or `art/plant.png`),
   transparent background.
2. Only for a *different* drawing: update the measured landmarks at the top
   of the script (the shoulders' flat tops, the notch's inner edges, the
   rows the roller can occupy and where its red floor starts, the bottom
   of the keyboard frame, and the boxes around the lever, knobs, right axle
   and bell).
3. Run:

   ```bash
   pip install pillow numpy
   python3 -B scripts/typewriter-layers.py
   ```

   It prints each layer's size and rewrites `src/typewriter/layers.ts`.
4. Check the cut: compose the layers with the roller group slid ~60 px left
   and look for holes or pieces left behind.

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
