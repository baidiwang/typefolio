# Typewriter rig

The machine is a light line-art typewriter (`art/typewriter-line.png`), of
which only the **roller** is fixed to the screen. It's rendered by
[`Typewriter.tsx`](../src/typewriter/Typewriter.tsx) and animated in step
with the reveal controller.

`.typewriter` (fixed to the bottom of the viewport, marked
`data-reveal-inset`) is a desk-coloured strip from the paper's entry line
down, so below that line only the desk and the roller show, never paper or
text. The line is the reveal line: the controller types an element once its
top crosses it, and lines of that element still below it stay hidden under
the strip until the paper feeds them out.

## The artwork

1. [`scripts/upscale-line.py`](../scripts/upscale-line.py) upscales the
   drawing 2x with a line-art model (Real-ESRGAN realesr-animevideov3-x2,
   run on the CPU with ncnn) and saves the machine, cropped, as
   `art/typewriter-line-2x.png`. Only needed when the drawing changes.
2. [`scripts/line-layers.py`](../scripts/line-layers.py) cuts it:
   - lines become ink #2b2823 with their alpha from their darkness;
     everything inside the machine (whatever the outer white doesn't reach,
     found by a flood fill from the image's edges on the ink closed by a
     few px) is filled with the paper colour #f7f3ea, so it's opaque;
   - **roller** (`public/art/line-roller.webp`): the roller with its rod and
     clips, collars, knobs and return lever, from the caps of the knob posts
     down to the rail under the roller. The ribbon spools and the type guide
     are painted out (the roller and rail continued from the drawing a
     little to one side). Nothing of it sits over the paper above the entry
     line;
   - **bell** (`public/art/line-bell.webp`): the dome, traced from its
     centre to the end of its outline at each angle, closed along its rim's
     curved underside, with the small ring knob on top;
   - geometry goes to [`src/typewriter/line.ts`](../src/typewriter/line.ts):
     the layers' boxes, the roller's ends and top edge, the entry line (just
     above the rod's clips) and the whole machine's width.

## Fit

- The paper is 96% of the roller's length (a little narrower, like a real
  one), centred on it. The roller's image is placed from the paper's left
  edge on the entry line (`.tw-origin`), scaled by `--tw-s`, css px per px
  of the 2x drawing, which `Typewriter.tsx` sets from the paper's measured
  width.
- Desktop: lever tip to right knob is 1.608× the paper, so `index.css`
  makes the paper `min(88vw / 1.608, 898px)`: the machine is at most 88% of
  the viewport and nothing of it is cut off from 720 to 1920 px wide. The
  paper, and the machine's body under it, is centred; the lever reaches
  further left than the knob does right.
- 115 rows of the drawing show below the entry line on desktop (74 px at
  1440×900, 85 px at most), 132 on phones (40 px at 390, where the paper
  keeps its width and the lever and knobs run off the screen's edges). The
  roller's lower part runs off the bottom of the screen.
- Between the rod's clips and the roller, and wherever the roller slides
  away from the paper's right end, the paper goes on behind it in paper
  colour (`.tw-back`).

## Motion

| Event | Roller | Bell |
| --- | --- | --- |
| each typed character | slides left 0.5 px of the drawing (at most 34) | |
| end of a typed line | returns home, 260 ms ease | rings at the end of an element |
| end of the intro | | one small wiggle, until sound is turned on |
| "Yours in type," | stays out (no return, no ring) | |
| the signature writing itself | carries on across it | |
| the smiley drawing itself | carries on across it | |
| the smiley drawn | returns home | rings once |

The bell swings `rotate(0 → 10 → −8 → 4 → 0deg)` over 420 ms about the foot
of its dome. Under reduced motion nothing moves (the controller sends no
events).

## The sound toggle

A real `<button>` (aria-label "Sound", `aria-pressed`, at least 44 × 44 px)
with a solid ink focus ring: the bell, standing just above the screen's
bottom edge at the roller's right end, at most 72% of the strip tall so it
never reaches above the entry line. Off by default; turning sound on plays
one ding. It's the first focus stop after the skip link (the typewriter
comes first in the DOM).

On every visit, until sound is turned on during it (nothing is
remembered), a pen note in Caveat says "ring for sound", with an arrow down
to the bell. It sits on the desk right of the paper, never over text, and
is hidden where there isn't about 150 px of desk (phones).

## Only the toggle is interactive

Everything else on the typewriter is decorative: every image has empty
`alt`, the note is `aria-hidden`, and the strip ignores the pointer
(`pointer-events: none`) except for the toggle.

## Sound

`src/typewriter/sound.ts` synthesises keystroke, return and bell sounds with
Web Audio. It's off on every visit; the toggle turns it on. The
`AudioContext` is only created on that click.
