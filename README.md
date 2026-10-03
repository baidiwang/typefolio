# typefolio

Baidi Wang — Design Engineer portfolio.

One sheet of cream paper coming out of a typewriter fixed at the bottom of the
viewport. As you scroll, the paper feeds up and the typewriter types the next
content.

## Run

```bash
npm install
npm run dev        # dev server
npm run check      # tsc + oxlint + production build
npm run preview    # serve the production build
```

## Edit content

All copy lives in [`src/content.ts`](src/content.ts). Its source of truth is
the old site's `src/constants/categories.js`
([baidiwang/3D-Portfolio](https://github.com/baidiwang/3D-Portfolio)). Entries
marked `TODO` need real values before launch.

Each project has an `id` that doubles as its deep link (`/#lily`). Content
renders client-side, so `useHashScroll` scrolls to the target after mount
(once fonts are ready).

## Media

Project media are short screen recordings in `public/media/<id>.{mp4,webm,jpg}`
(H.264 + VP9 + a poster frame). They play muted and looped only while in view;
under `prefers-reduced-motion` only the poster is shown. Never ship GIFs.

Each clip's start, duration and poster time (seconds in the source GIF),
width and quality live in one table, [`scripts/media-clips.sh`](scripts/media-clips.sh).
To choose them, look at the contact sheets in
[`docs/contact-sheets/`](docs/contact-sheets): one frame every 0.5 s, each
labelled with its timestamp.

```bash
# from the old site's GIFs (../3D-Portfolio/public/thumbnails)
scripts/contact-sheets.sh ../3D-Portfolio/public/thumbnails        # regenerate sheets
scripts/encode-media.sh  ../3D-Portfolio/public/thumbnails         # all clips
scripts/encode-media.sh  ../3D-Portfolio/public/thumbnails lily    # just one
```

## Type and colour

The face is **Cutive Mono**, self-hosted via `@fontsource/cutive-mono`, set
once as `--font-type` in `src/index.css`.

Cutive Mono has a single weight and no italic, so the page never asks for
bold or italic and sets `font-synthesis: none` (no faux styles). Its strokes
are thin, so every glyph gets a hairline outline in its own ink
(`-webkit-text-stroke: var(--text-stroke) currentColor`, 0.4px), which reads
as a heavier weight without touching layout, and body tracking is a little
tight (`--tracking: -0.02em`). Hidden text hides its outline too:
`::highlight(unrevealed)` sets `-webkit-text-stroke-color: transparent`.

Hierarchy comes from size, caps and ink, never from tracking or weight:

| Element | Treatment |
| ------- | --------- |
| Name (letterhead) | 2em, caps |
| Section labels | caps, red ink |
| Project titles | 1.4em |
| Inline labels (employer, short entries) | caps |
| Meta lines (type, stack) | `--ink-soft` |

Body text is 17px on phones, 19px on desktop, in near-black ink. The default
theme is **valentine** (warm white paper, warm charcoal desk #3d3532, so the
typewriter's black outlines still read against it, Olivetti-red
typewriter). Inks on `--paper` (#fbf8f2):

| Token        | Use                    | Contrast on paper |
| ------------ | ---------------------- | ----------------- |
| `--ink`      | body                   | 17.8 : 1          |
| `--ink-soft` | meta lines             | 9.5 : 1           |
| `--ink-red`  | section labels, pen dividers, focus | 6.4 : 1 |

**Paper.** The sheet is folded letter paper: fine grain plus two creases per
letter-sized page (8.5 × 11, folded in thirds; the page scales with the
sheet's width). The textures
([`scripts/paper-textures.py`](scripts/paper-textures.py), `public/paper/`,
15 KB) are seamless overlays of a warm shadow and a warm light at a few %
alpha, so the paper stays warm white in every theme. The grain is two tiles
of coprime sizes, so it doesn't visibly repeat. Worst case, with every
layer's darkest pixel on the same spot, contrast on the textured paper stays
at ink ≥ 14.2, ink-soft ≥ 7.6, ink-red ≥ 5.5 in every theme.

## Sections, links and sound

- **Dividers** are a quick wavy line in red pen
  ([`Divider.tsx`](src/components/Divider.tsx)): three hand-drawn variants,
  mirrored after the third. Each one draws itself (stroke offset) when
  typing reaches it; static under reduced motion.
- **Contact links** (Resume · Email · LinkedIn · GitHub) are printed in the
  letterhead ([`ContactLinks.tsx`](src/components/ContactLinks.tsx)); the
  letter's closing ends with the email address. The resume is
  `public/BaidiWangResume.pdf`.
- **The typewriter** is a hand-drawn wide-carriage machine split into
  layers (static body, sliding carriage, turning knobs, a bell on the body's shoulder). Its
  roller spans the paper and the paper goes into it: below the roller there's
  only the desk and the machine's body (`min(181px, 21.4vh)` tall, 95 px on
  phones), with a plant beside it on desktop. Details:
  [`docs/typewriter-rig.md`](docs/typewriter-rig.md).
- **Sound** is off by default. The round speaker button
  ([`SoundToggle.tsx`](src/components/SoundToggle.tsx)) toggles it
  (`aria-pressed`): top-right on desktop, bottom-right on the desk beside
  the machine on phones, clear of notches via `env(safe-area-inset-*)`.

## How the reveal engine works

Code: [`src/reveal/`](src/reveal). No animation library, no React state per
character.

**1. Nothing is ever hidden in the markup.** Every word is rendered by React
on the first render and laid out normally. To "un-type" text, the engine puts
a DOM `Range` over the unrevealed tail of each element and registers it with
the [CSS Custom Highlight API](https://developer.mozilla.org/docs/Web/API/CSS_Custom_Highlight_API):

```css
::highlight(unrevealed) { color: transparent; text-decoration-color: transparent; }
```

A highlight only repaints glyphs. It can't move layout (so there's no reflow
and page height is fixed from the first frame) and it isn't in the
accessibility tree (screen readers and find-in-page always see every word).
Typing a character is just `range.setStart(node, offset + 1)`.

**2. Progressive enhancement.** Hiding only happens when JS runs, the browser
supports highlights, and `prefers-reduced-motion` is off. Otherwise nothing
is registered and everything is simply visible. Switching reduced motion on
mid-visit flushes everything.

**3. One controller owns "what is being typed".** `reveal` in
`controller.ts` is a singleton. `<Reveal as="p" mode="lines">` registers its
element in a layout effect (before first paint, so nothing flashes):

- In view at load (above the platen line) → hidden and put in the **load
  batch**. All registrations from the first commit are flushed together in
  a microtask: the intro first, then everything below it on the first screen,
  in document order, compressed to finish within **1.5 s** of fonts being
  ready. Typewriter logic: nothing below the line being typed is ever
  visible early.
- Otherwise → hidden and observed. (The letterhead isn't registered: it's
  printed stationery, visible from the first frame.)

The controller runs a single `requestAnimationFrame` loop over a queue of
jobs, one active at a time, in document order. Two modes:

- `type`: one character per step, ~30 ms each, capped so no visual line takes
  more than 0.6 s (headings, short lines, links).
- `lines`: one visual line per step, like a line feed (paragraphs).

**4. Triggers are per element.** An `IntersectionObserver` whose root box
ends at the platen line (the top of the typewriter) and stretches 100 000 px
*above* the viewport. One observer therefore reports both cases:

- Element scrolled into view → joins the queue.
- Element jumped past in one frame (End key, deep link, fling), which a
  normal observer would never report → completed instantly.

A second observer, plus a cheap per-frame rect check of the queue, completes
anything that scrolls above the viewport while it's still waiting. Never a
page-wide timer, never a scroll percentage.

**5. Nobody waits: compression, not skipping.** Whenever elements join, the
deadline becomes *now + 1.2 s* (*1.5 s* for the load batch). Each frame the speed is

```
speed = max(1, nominal time remaining for the whole queue / time left to deadline)
```

so a single heading types at natural pace, while a burst of content (fast
scroll, tall screen) is sped up to land within the budget.

**6. Measuring lines.** `lines.ts` finds visual line breaks by measuring a
one-character `Range` at each possible break (start of a word or text node)
and starting a new line when the glyph box drops. It runs after
`document.fonts.ready`, again on every font `loadingdone`, and on resize
(width changes). A line-feed reveal in progress snaps to the new line
boundaries.

**7. One project at a time.** A project reads head (title, type,
one-liner), photo, rest: that's its DOM, tab and typing order. Desktop puts
the photo in a left column beside the text; phones stack it in reading
order, so the title is never pushed below the photo. A taped photo sticks on
(`data-stick="stuck"`, a short opacity/transform animation) when typing
reaches it:

- desktop: `reveal.whenStarts(title)`, the controller's `start` for the
  title beside it;
- stacked: `reveal.whenDone(oneLiner)`, then once the photo itself has come
  out of the platen.

Either hook fires with `instant` if its element is revealed without typing
(scrolled past, focused, reduced motion). Since one job runs at a time in
document order, a project's text, links included, finishes before the next
project's title starts.

**8. Drawings are jobs too.** `reveal.registerDrawing(el, { duration,
apply })` queues a non-text reveal (the pen dividers) in the same reading
order and budget as text; the controller calls `apply(progress)` from 0 to
1 in 40 steps. A divider in the first screen draws between the intro and
"Selected work"; one further down waits for its turn.

**9. The typewriter is a listener.** The controller emits an event for
every step:

| Event | Typewriter does |
| --- | --- |
| `char` (char, column) | carriage `translateX(−column × step)`, key click (space: carriage only) |
| `return` (bell?) | end of a typed line: carriage return, the knobs turn (line feed), bell at the end of an element |
| `feed` (bell?) | a paragraph line appeared: the knobs turn, bell at the last line |
| `idle` | carriage returns home |

Because the controller emits from the same frame loop that moves the
highlight, carriage and text can't drift apart, and compression speeds both
up together. The typewriter also tells the controller where the paper
emerges: the controller reads the height of the element marked
`data-reveal-inset` (the desk strip, up to the roller's top edge) and ends
its trigger zone there. The strip hides the paper below that edge, so lines
of an element that are typed but haven't come out of the roller yet stay
out of sight. Rig details:
[`docs/typewriter-rig.md`](docs/typewriter-rig.md).

**10. Keyboard.** Focusing a link inside unrevealed text completes that
element instantly.

## Design playground (dev + preview deployments)

In `npm run dev` and on Vercel **preview** deployments, try alternative looks
from the URL. No UI, and nothing of it in the production build:
[`src/playground.ts`](src/playground.ts) is only imported when the build-time
flag `__PLAYGROUND__` is true (`vite.config.ts`: dev mode,
`VERCEL_ENV=preview`, or `PLAYGROUND=1`).

```
/?theme=classic | hermes | cobalt     (default: valentine)
/?font=courier | space | plex         (Courier Prime, Space Mono, IBM Plex Mono 500)
/?paper=plain | grain                 (default: folded)
/?theme=hermes&font=plex&paper=plain
```

Themes only override CSS variables (`:root[data-theme=…]` in
`src/index.css`); the typewriter drawing stays red in every theme. The
alternative faces have real weights, so they drop Cutive's outline
(`--text-stroke: 0`); Plex is shown at weight 500.

| Theme | Desk / paper / typewriter | ink | ink-soft | ink-red |
| --- | --- | --- | --- | --- |
| valentine (default) | charcoal / warm white / Olivetti red | 17.8 | 9.5 | 6.4 |
| classic | warm grey / cream / green | 16.6 | 8.9 | 6.5 |
| hermes | walnut / ivory / seafoam | 17.6 | 9.4 | 6.9 |
| cobalt | cobalt blue / white / cream | 18.9 | 10.1 | 6.5 |

Ratios are on plain paper (AA text needs 4.5); see **Paper** above for the
textured default. The sound button is a paper
disc with an ink icon (17.8) or, when on, paper on red ink (6.4); its focus
ring is a paper ring inside an ink ring, so it stands out on the charcoal
desk and on the paper alike.

## Stack

Vite + React + TypeScript, plain CSS. No animation library.
