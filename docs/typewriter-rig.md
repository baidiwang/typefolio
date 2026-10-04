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
| Sizing | the body shows from its top edge to just below the keyboard frame, `--tw-visible: min(230px, 26vh)`, and is drawn 10% wider than the drawing (`--tw-sx: 1.1`); that fixes the scale, and the paper matches the body's width | the paper keeps its width (viewport − 2 × 12 px); the machine is scaled so the body matches it, unstretched |
| Shown | body top to keyboard frame; the plain red band below runs off the screen | the whole machine, ≈ 123 px of body at 390 px wide (146 px including the bell and lever above the edge) |
| Paper width | 898 px at 1440×900, 812 at 1280×800, 779 at 1366×768 | 366 px at 390 |
| Plant | beside the machine, as tall as the visible typewriter, if it fits | hidden |
| Sound | the bell; "ring for sound" note beside it until first used, if there's room | the bell; no note (only the wiggle) |

The scale is `--tw-s`, css px per drawing px, which `Typewriter.tsx` sets
from the paper's measured width (paper width ÷ (body width × `--tw-sx`)).
Every layer is placed with `calc(var(--tw-s) × n × 1px)` from the body's
top-left corner, which sits at the paper's left edge (`--pl`) on the
strip's top edge. The stretch applies to the body, the roller and the
notch; the small parts (lever, knobs, right axle, bell) keep their
proportions and hang off the columns where the axles meet the body
(x 289 left, 1250 right), so they stay attached and only move outwards. CSS gets the paper's desktop width from `--tw-visible` and the
drawing's aspect (`--tw-aspect`); the strip height (`--tw-strip`) from the
scale and the drawing's rows, and the paper's bottom padding and the scroll
padding use it.

Desktop uses a 3rem paper margin, a 1.5em gap between photo and text, and
18 px body text, so the 45% text column holds 32 characters per line at
1440×900, 29 at 1280×800 and 27 at 1366×768 (33 on phones). The margin
also keeps the text clear of the bell and lever, which reach about 48 and
30 drawing px inside the paper's edges (7 px clearance at 1440×900).

## Layers

Back to front:

| Layer | File | Contents | Motion |
| --- | --- | --- | --- |
| roller | `public/art/typewriter-roller.webp` | the roller and its two paper guides, from the notch, extended 90 drawing px past both ends with stretches of roller from just inside it. Red streaks drawn on the roller are painted roller-black | slides; clipped to the notch (`.tw-notch`), so the extensions only ever show between the shoulders |
| body | `public/art/typewriter-body.webp` | the red body, shoulders and keyboard, with the notch cut out so the roller shows through | static |
| bell | `public/art/typewriter-bell.webp` | the bell on its stem, above the right shoulder, inside a `<button>` (the sound toggle) | rings: `rotate(0 → 10 → −8 → 4 → 0deg)` over 420 ms about the stem's foot (`BELL_PIVOT`) whenever an element finishes and when sound is turned on; one smaller wiggle when the intro finishes typing, until the bell is first used |
| lever, axle | `typewriter-lever.webp`, `typewriter-axle-r.webp` | the return lever with the left axle; the right axle | slide with the roller |
| knob L / R | `typewriter-knob-l.webp`, `-knob-r.webp` | the platen knobs | slide with the roller; turn `rotate(0 → −14 → 3 → 0deg)` over 220 ms about their centres on each line feed |
| plant pot | `public/art/plant-pot.webp` | the pot (its inside filled, so it reads on the desk) | static |
| plant foliage | `public/art/plant-foliage.webp` | leaves and stems, down to where they enter the pot (in front of the pot's back rim) | sways `rotate(±1.5deg)` about the stems' base (`STEM_PIVOT`), 6 s ease-in-out, alternating; a bigger sway (±4°, 1.4 s) when the bell rings. None under reduced motion |

The roller, lever, axle and knobs slide together,
`translateX(−column × STEP × scale)` per typed character (`STEP` = 0.5
drawing px, so a 60-character line moves them 30 drawing px, well inside the
roller's 90 px extensions), and return to 0 with a 260 ms ease on carriage
return. Under reduced motion nothing moves (the controller sends no events).

## Plant

On the desk to the right of the machine (10 px past the right knob), as
tall as the visible typewriter (its top to the bottom of the keyboard
frame), standing on the bottom of the screen, which is where the machine's
visible base is on desktop. It's always right of the paper, never on it.
`Typewriter.tsx` hides it when it would reach within 8 px of the window's
right edge, and CSS hides it on phones.

## The bell is the sound toggle

A real `<button>` (aria-label "Sound", `aria-pressed`, at least 44 × 44 px,
centred on the bell; on phones the hit area leans left so it stays on
screen) with a paper-inside-ink focus ring. Off by default; turning sound
on plays one ding. It's the first focus stop after the skip link (the
typewriter comes first in the DOM).

Until it's first used (remembered in `localStorage`), a red-pen note in
Caveat says "ring for sound" with an arrow down to the bell. It sits on the
desk right of the paper, above the plant, never over text, and is hidden
where there isn't about 150 px of desk (and on phones). The bell also gives
one small wiggle when the intro finishes typing, unless reduced motion is
on.

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
- `PLANT`, `PLANT_POT`, `PLANT_FOLIAGE`, `STEM_PIVOT` — the plant's crop,
  its two layers and the foliage's pivot (in the plant drawing's own px,
  resampled to 1024).

## Export

- WebP at the drawing's own resolution (the body shows at most ≈ 900 css px
  wide, so about 1.1× on desktop), quality 84; the plant at 2× its largest
  display size (320 px). Current sizes:

  | Layer | Pixels | Size |
  | --- | --- | --- |
  | body | 1012×342 | 66 KB |
  | roller | 918×56 | 13 KB |
  | lever, axle | 38×126, 28×36 | 3 KB |
  | knob L / R | 35×88 / 41×105 | 5 KB |
  | bell | 59×87 | 3 KB |
  | plant pot / foliage | 247×237 / 261×445 | 47 KB |
  | **total** | | **≈ 136 KB** |

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

## Only the bell is interactive

Everything else on the typewriter is decorative: every image has empty
`alt`, the note and plant are `aria-hidden`, and the strip ignores the
pointer (`pointer-events: none`) except for the bell.

## Sound

`src/typewriter/sound.ts` synthesises keystroke, return and bell sounds with
Web Audio. It's off on every visit; the bell toggles it. The
`AudioContext` is only created on that click.
