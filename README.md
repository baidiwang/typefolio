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
| Name (letterhead) | 3.4em, hand lettering (Damion), written on with a clip |
| Section labels | caps, red ink |
| Project titles | 1.4em |
| Inline labels (employer, short entries) | caps |
| Meta lines (type, stack) | `--ink-soft` |

Body text is 17px on phones, 18px on desktop, in near-black ink. The default
theme is **valentine** (aged letter paper, powder-blue desk #a9c2d9,
Olivetti-red typewriter). Inks on the white paper of `?paper=plain`
(#fbf8f2); see **Paper** for the aged default:

| Token        | Use                    | Contrast on paper |
| ------------ | ---------------------- | ----------------- |
| `--ink`      | body                   | 17.8 : 1          |
| `--ink-soft` | meta lines             | 9.5 : 1           |
| `--ink-red`  | section labels, pen dividers, focus | 6.4 : 1 |

**Paper.** The sheet is an old letter from the 1960s: yellowed paper
(#f3e7cc), fine grain, two clearly visible creases per letter-sized page
(8.5 × 11, folded in thirds; the page scales with the sheet's width), soft
wrinkles, faint foxing spots and light tea-coloured stains with a tide
line, a little darker toward the edges, and side edges that are worn and
irregular with a few small nicks and tears. Photo tape is yellowed to
match. All of it comes from
[`scripts/paper-textures.py`](scripts/paper-textures.py) (`public/paper/`,
58 KB), seeded, so it's the same on every visit:

- grain, foxing and wrinkles are pairs of tiles of coprime sizes, so they
  don't visibly repeat; the stains are one field drawn at a third of
  display size (they're soft) and taller than the page, so no stain ever
  repeats;
- the sheet is drawn by `.paper::before` with a CSS mask for the worn
  edges (edge masks of coprime heights, so the nicks don't line up), and
  its shadow by `::after`, just inside, so the desk shows through a nick.

Contrast is measured on the page itself: with the text hidden, the darkest
paper pixel behind every text line (stains, foxing, folds and edges
included) still gives ink ≥ 11.2, ink-soft ≥ 6.3 and ink-red ≥ 5.3 at
1440×900 and 390×844. The red ink is a little deeper on aged paper
(#9c1a29; 6.6 on the plain base) to keep that margin. `?paper=folded|grain|plain`
(previews) shows the earlier, new-stationery sheets for comparison.

## Sections, links and sound

- **Dividers** are a quick wavy line in red pen
  ([`Divider.tsx`](src/components/Divider.tsx)): three hand-drawn variants,
  mirrored after the third. Each one draws itself (stroke offset) when
  typing reaches it; static under reduced motion.
- **The name** (and "Baidi" under "Yours in type," at the end) is hand
  lettering ([`Signature.tsx`](src/components/Signature.tsx)): real text in
  a script face (Damion; `?name=` on previews), written on left to right by
  a clip that runs as a drawing job in the reveal queue, so it happens in
  reading order. Static under reduced motion.
- **Contact links** (Resume · Email · LinkedIn · GitHub) are printed in the
  letterhead as plain typed words
  ([`ContactLinks.tsx`](src/components/ContactLinks.tsx)). On hover or
  keyboard focus a red pen circle (three hand-drawn variants) draws around
  the word, and the word turns red; touch screens, which can't hover, get a
  dotted red underline. The letter's closing ends with the email address.
  The resume is `public/BaidiWangResume.pdf`.
- **The typewriter** is a hand-drawn wide, low machine split into layers
  (static body, a roller sliding behind the body's shoulders with the lever
  and knobs, turning knobs, a ringing bell). The paper is exactly as wide as
  its red body and disappears behind the body's top edge. On desktop the
  machine shows from that edge to just below the keyboard,
  `min(230px, 26vh)`, with the body drawn 10% wider than the drawing, which
  sets the paper's width (≈ 900 px at 1440×900); on phones the paper keeps
  its width and the whole machine shows, scaled to it, unstretched. A plant
  about 80% as tall as the visible typewriter stands beside it on desktop, its
  foliage swaying gently. Details:
  [`docs/typewriter-rig.md`](docs/typewriter-rig.md).
- **Sound** is off by default. **The bell is the toggle**: a real button
  (aria-label "Sound", `aria-pressed`, at least 44 × 44 px, a paper-and-ink
  focus ring). Turning sound on plays one ding. Until it's first used, a
  red-pen note beside it says "ring for sound" (where there's desk room;
  never over text), and the bell gives one small wiggle when the intro
  finishes typing (phones get only the wiggle).

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
- Otherwise → hidden and observed. (The letterhead's title and links aren't
  registered: they're printed stationery, visible from the first frame. The
  name is a drawing job, written on first.)

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
| `char` (char, column) | roller, lever and knobs `translateX(−column × step)`, key click (space: carriage only) |
| `return` (bell?) | end of a typed line: carriage return, the knobs turn (line feed), bell at the end of an element |
| `feed` (bell?) | a paragraph line appeared: the knobs turn, bell at the last line |
| `idle` | carriage returns home |

Because the controller emits from the same frame loop that moves the
highlight, carriage and text can't drift apart, and compression speeds both
up together. The typewriter also tells the controller where the paper
emerges: the controller reads the height of the element marked
`data-reveal-inset` (the desk strip, up to the body's top edge) and ends
its trigger zone there. The strip hides the paper below that edge, so lines
of an element that are typed but haven't come out of the machine yet stay
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
/?paper=folded | grain | plain        (default: aged)
/?desk=teal | sage | oak | navy | charcoal   (default: powder blue)
/?name=pacifico | satisfy             (default: Damion)
/?desk=navy&name=satisfy
```

Themes only override CSS variables (`:root[data-theme=…]` in
`src/index.css`); the typewriter drawing stays red in every theme. The
alternative faces have real weights, so they drop Cutive's outline
(`--text-stroke: 0`); Plex is shown at weight 500.

| Theme | Desk / paper / typewriter | ink | ink-soft | ink-red |
| --- | --- | --- | --- | --- |
| valentine (default) | powder blue / warm white / Olivetti red | 17.8 | 9.5 | 6.4 |
| classic | warm grey / cream / green | 16.6 | 8.9 | 6.5 |
| hermes | walnut / ivory / seafoam | 17.6 | 9.4 | 6.9 |
| cobalt | cobalt blue / white / cream | 18.9 | 10.1 | 6.5 |

Ratios are on plain paper (AA text needs 4.5); see **Paper** above for the
textured default.

`?desk=` swaps only the desk colour: teal #1f4b4a, sage #9fb08e, oak
#c39a6b, navy #1f2a44, charcoal #3d3532 (default powder blue #a9c2d9). The
"ring for sound" note uses `--note-ink`, at least 4.7:1 on each desk: dark
reds on the light desks (#8f1424 on powder blue, 5.0; #7a1020 on sage;
#6e0d1b on oak), a light red #ffb3a8 on the dark ones. The bell's focus
ring is a paper ring inside an ink ring, so one of the two always stands
out.

## Stack

Vite + React + TypeScript, plain CSS. No animation library.
