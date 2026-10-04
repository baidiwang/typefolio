# Typewriter rig

There are two machines (`?machine=` on previews; **drawn** is the default),
each in red #af312b or olive #8a9358 (`?tw=red|olive`). Both are rendered by
[`Typewriter.tsx`](../src/typewriter/Typewriter.tsx) and animated in step
with the reveal controller.

- **drawn**: one hand-drawn image, `art/typewriter-wide.png` (about 3:1,
  transparent background), split into layers by
  [`scripts/typewriter-layers.py`](../scripts/typewriter-layers.py). Only the
  exported WebP layers ship; the source lives in `art/`.
- **roller**: no images. A platen roller, its end caps and a small carriage
  are drawn with CSS gradients.

Either way `.typewriter` (fixed to the bottom of the viewport, marked
`data-reveal-inset`) is a desk-coloured strip from the paper's entry line
down, so below that line only the desk and the machine show, never paper or
text. The line is the reveal line: the controller types an element once its
top crosses it, and lines of that element still below it stay hidden under
the strip until the paper feeds them out.

## Light

The page's lamp (`.lamp`, README "Type and colour") is a fixed layer just
below the typewriter. The strip paints the same lamp itself (the radial
gradient positioned against the viewport), so it matches the desk around
it. The machines bring their own lighting: the drawn body is lit from above
in its export (brighter on top, into shadow toward the bottom), and the
roller's gradients put a soft highlight on the side facing the lamp.

## drawn

A wide, low machine whose roller sits recessed in a notch between the
body's two raised shoulders. The paper is exactly as wide as the body (at
its widest) and disappears behind the body's top edge, shoulders included.
The lever and knobs stand outside the paper, left and right.

| | Desktop (≥ 720 px) | Phones (< 720 px) |
| --- | --- | --- |
| Sizing | the body shows from its top edge to just below the keyboard frame, `--tw-visible: min(230px, 26vh)`, and is drawn 10% wider than the drawing (`--tw-sx: 1.1`); that fixes the scale, and the paper matches the body's width | the paper keeps its width (viewport − 2 × 12 px); the machine is scaled so the body matches it, unstretched |
| Shown | body top to keyboard frame; the band below runs off the screen | the whole machine, ≈ 123 px of body at 390 px wide |
| Paper width | 898 px at 1440×900, 812 at 1280×800, 779 at 1366×768 | 366 px at 390 |
| Sound toggle | the bell; "ring for sound" note beside it until sound is turned on, if there's room | the bell; no room for the note (only the wiggle) |

The scale is `--tw-s`, css px per drawing px, which `Typewriter.tsx` sets
from the paper's measured width (paper width ÷ (body width × `--tw-sx`)).
Every layer is placed with `calc(var(--tw-s) × n × 1px)` from the body's
top-left corner, which sits at the paper's left edge (`--pl`) on the
strip's top edge. The stretch applies to the body, the roller and the
notch; the small parts (lever, knobs, right axle, bell) keep their
proportions and hang off the columns where the axles meet the body (x 289
left, 1250 right), so they stay attached and only move outwards. CSS gets
the paper's desktop width from `--tw-visible` and the drawing's aspect
(`--tw-aspect`), and the strip height (`--tw-strip`) from the scale and the
drawing's rows; the paper's bottom padding and the scroll padding use it.

The desktop paper margin (3rem) keeps the text clear of the bell and lever,
which reach about 48 and 30 drawing px inside the paper's edges.

### Layers

Back to front:

| Layer | File | Contents | Motion |
| --- | --- | --- | --- |
| roller | `public/art/typewriter-roller.webp` | the roller and its two paper guides, from the notch, extended 90 drawing px past both ends with stretches of roller from just inside it. Red streaks drawn on the roller are painted roller-black | slides; clipped to the notch (`.tw-notch`), so the extensions only ever show between the shoulders |
| body | `public/art/typewriter-body-red.webp`, `-olive.webp` | the body, shoulders and keyboard, with the notch cut out so the roller shows through; one per colour | static |
| bell | `public/art/typewriter-bell.webp` | the bell on its stem, above the right shoulder, inside a `<button>` (the sound toggle) | rings: `rotate(0 → 10 → −8 → 4 → 0deg)` over 420 ms about the stem's foot (`BELL_PIVOT`) whenever an element finishes and when sound is turned on; one smaller wiggle when the intro finishes typing, unless sound is already on |
| lever, axle | `typewriter-lever.webp`, `typewriter-axle-r.webp` | the return lever with the left axle; the right axle | slide with the roller |
| knob L / R | `typewriter-knob-l.webp`, `-knob-r.webp` | the platen knobs | slide with the roller; turn `rotate(0 → −14 → 3 → 0deg)` over 220 ms about their centres on each line feed |

The roller, lever, axle and knobs slide together,
`translateX(−column × STEP × scale)` per typed character (`STEP` = 0.5
drawing px), and return to 0 with a 260 ms ease on carriage return. Under
reduced motion nothing moves (the controller sends no events).

### Colour and light

The drawing is red. The script moves the red paint to each colour while
keeping its marker texture: every pixel's shade relative to the paint's
median scales the new colour, and partly red pixels (anti-aliased edges)
blend by how red they are, so no red fringe is left. Then the whole body is
lit from above: × 1.08 at its top, falling to × 0.7 at its bottom.

## roller

No machine body. A platen roller spans the paper exactly at the bottom of
the screen: a gunmetal cylinder (dark at its top and bottom edges, a soft
highlight band toward the upper left, brighter at the left end), with end
caps just outside the paper's edges. It's `--roller-h` tall: 60 px on
desktop, 26 px on phones (in proportion to the paper). The strip is the
roller plus 16 px of desk (plus the safe-area inset), and the roller's top
edge is the entry line.

The paper isn't limited by a machine: 900 px on desktop (`--tw-paper`),
the full width less 12 px a side on phones.

A small carriage in the typewriter's colour (lit from above with
`color-mix`) rides on the roller's lower half, resting at the paper's right
end, and slides left by 1/150 of the paper's width per typed character,
returning on carriage return. On it, the **indicator light** is the sound
toggle: a real `<button>` with a 44 px hit area, dim when off and lit with a
warm glow when on; it blinks when an element finishes and when sound is
turned on.

## The sound toggle

A real `<button>` (aria-label "Sound", `aria-pressed`, at least 44 × 44 px)
with a light-rose focus ring: the bell (drawn; on phones its hit area
leans left so it stays on screen) or the carriage's light (roller). Off by
default; turning sound on plays one ding. It's the first focus stop after
the skip link (the typewriter comes first in the DOM).

On every visit, until sound is turned on during it (nothing is
remembered), a light-rose pen note in Caveat says "ring for sound", with an
arrow down to the toggle. It sits on the desk right of the paper, never
over text, and is hidden where there isn't about 150 px of desk (phones:
the bell is at the screen's edge). The toggle also gives one small wiggle
(a swing, or a blink) when the intro finishes typing, unless sound is
already on or reduced motion is on.

## Geometry (drawn)

All coordinates are reference px (the drawing resampled to 1536 px wide)
and are generated into [`src/typewriter/layers.ts`](../src/typewriter/layers.ts):

- `LAYERS` — where each layer image sits in the drawing (x, y, w, h).
- `BODY_SRC` — the body image per colour.
- `BODY` — the body's widest extent (`x0`, `x1`: the paper matches it), its
  top edge (the reveal line), the bottom of the keyboard frame and its
  bottom.
- `NOTCH` — the roller's window between the shoulders.
- `MACHINE` — the box around everything drawn.
- `BELL_PIVOT`, `KNOB_L_PIVOT`, `KNOB_R_PIVOT` — rotation centres.

## Export

- WebP at the drawing's own resolution (the body shows at most ≈ 900 css px
  wide, so about 1.1× on desktop), quality 84. Current sizes:

  | Layer | Pixels | Size |
  | --- | --- | --- |
  | body red / olive | 1012×342 | 55 / 58 KB |
  | roller | 918×56 | 13 KB |
  | lever, axle | 38×126, 28×36 | 3 KB |
  | knob L / R | 35×88 / 41×105 | 5 KB |
  | bell | 59×87 | 3 KB |

  A page loads one body: ≈ 80 KB in all.
- `index.html` preloads the red body and the roller (the default machine's
  first screen).

## Replacing the artwork

The script is re-runnable. It first resamples the source to 1536 px wide,
so an upscaled version of the same drawing dropped into
`art/typewriter-wide.png` needs no other change (exports are then capped at
the reference resolution; raise `EXPORT_SCALE` to use the extra pixels). It
removes old WebPs before writing new ones.

1. Drop the new file in `art/typewriter-wide.png`, transparent background.
2. Only for a *different* drawing: update the measured landmarks at the top
   of the script (the shoulders' flat tops, the notch's inner edges, the
   rows the roller can occupy and where its red floor starts, the bottom
   of the keyboard frame, and the boxes around the lever, knobs, right axle
   and bell). Colours and lighting are `COLOURS`, `LIGHT_TOP` and
   `LIGHT_BOTTOM`.
3. Run:

   ```bash
   pip install pillow numpy
   python3 -B scripts/typewriter-layers.py
   ```

   It prints each layer's size and rewrites `src/typewriter/layers.ts`.
4. Check the cut: compose the layers with the roller group slid ~60 px left
   and look for holes or pieces left behind.

## Only the toggle is interactive

Everything else on the typewriter is decorative: every image has empty
`alt`, the note and the platen are `aria-hidden`, and the strip ignores the
pointer (`pointer-events: none`) except for the toggle.

## Sound

`src/typewriter/sound.ts` synthesises keystroke, return and bell sounds with
Web Audio. It's off on every visit; the toggle turns it on. The
`AudioContext` is only created on that click.
