# typefolio

Baidi Wang — Design Engineer portfolio.

One sheet of warm paper coming out of a typewriter's roller, fixed at the
bottom of the viewport. As you scroll, the paper feeds up and the typewriter
types the next content.

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

The face is **Sometype Mono**, self-hosted via `@fontsource/sometype-mono`
at the two weights the design uses (400 and 700), set once as
`--font-type` in `src/index.css`; `font-synthesis: none` means the browser
never fakes others. Hierarchy:

| Element | Treatment |
| ------- | --------- |
| Name (letterhead) | 3.4em, hand lettering (Caveat 700), written on with a clip |
| Section labels | 400, spaced caps, ink |
| Project titles | 1.4em, 700 |
| Body, meta lines | 400; meta lines (type, role, stack) in `--ink-soft` |

Body text is 17px on phones, 18px on desktop.

**The scene** is a quiet, warm room: a plain warm desk (`--desk` #ede7db)
and the folded sheet (`--paper` #f7f3ea) a little lighter, with a soft,
low-contrast shadow all round, slightly lower (`--paper-drop`,
`--paper-shadow`). No pure white or black anywhere; the project photos and
clips are the only colour.

**Colour.** All text, the section labels, the pen circles on the contact
links, the "ring for sound" note and the focus rings are ink, `--ink`
#2b2823; secondary text is a warm grey, `--ink-soft` #6a6358. The rules
(the letterhead's line and the pen dividers) are a light warm grey,
`--rule` #cfc6b6. One key phrase per project gets the highlighter,
`--highlight` #e6decf, swiped on left to right once that phrase has typed
([`Highlight.tsx`](src/components/Highlight.tsx),
[`useHighlighterSwipe`](src/hooks/useHighlighterSwipe.ts)). Selected text
is ink on the highlighter too, everywhere; on a phrase that's already
highlighted the selection is `--highlight-selected` #cdc1aa. Focus on the
paper is a dashed ink ring, on the desk a solid one.

Contrast is measured on the page itself: with the text hidden, the darkest
paper pixel behind every fully revealed line (grain and creases included),
viewport by viewport down the whole page at 1440×900, 1280×800 and 390×844
(AA text needs 4.5): ink ≥ 11.0, secondary text ≥ 4.74, ink on the
highlighter ≥ 11.0; ink on the desk 11.9, on the selection over a
highlight 8.3. (Secondary text was asked for as #6e675c: 5.0:1 on the
paper colour but 4.47:1 over the darkest grain and creases, so it's the
nearest grey that passes.)

**Photos** are prints taped to the sheet: tilted at most 1°, on a frame a
shade lighter than the paper (`--photo-frame` #fcfaf5), with translucent
warm beige tape (`--tape`) and a small, soft shadow falling down and to the
right. They sit above the paper's texture and creases, and photos and clips
show exactly as recorded (no filter). The fine dot grid in the Google Play
clip is the dithering of its source GIF, in the recording itself.

**Paper.** New stationery folded in thirds: fine grain and the two fold
creases per letter-sized page (8.5 × 11; the page scales with the sheet's
width), straight edges. The overlays come from
[`scripts/paper-textures.py`](scripts/paper-textures.py) (`public/paper/`,
15 KB), seeded, so they're the same on every visit; the grain is a pair of
tiles of coprime sizes, so it doesn't visibly repeat. The sheet is drawn by
`.paper::before` and its shadow by `::after`.

## Sections, links and sound

- **Dividers** are a quick wavy pen line
  ([`Divider.tsx`](src/components/Divider.tsx)): three hand-drawn variants,
  mirrored after the third. Each one draws itself (stroke offset) when
  typing reaches it; static under reduced motion.
- **The name** (and "Baidi" under "Yours in type," at the end) is hand
  lettering ([`Signature.tsx`](src/components/Signature.tsx)): real text in
  a script face (Caveat 700; `?name=damion` on previews), written on left to
  right by a clip that runs as a drawing job in the reveal queue, so it
  happens in reading order. Static under reduced motion.
- **Contact links** (Resume · Email · LinkedIn · GitHub) are printed in the
  letterhead as plain typed words
  ([`ContactLinks.tsx`](src/components/ContactLinks.tsx)). On hover or
  keyboard focus a pen circle (three hand-drawn variants) draws around the
  word; touch screens, which can't hover, get a dotted underline. The
  letter's closing ends with the email address. The resume is
  `public/BaidiWangResume.pdf`.
- **The typewriter** is a line-art drawing, of which only the roller is
  fixed to the bottom of the screen: the roller with its rod and clips,
  collars, knobs and return lever, from just above the clips; its lower
  part runs off the edge. The paper is a little narrower than the roller
  and goes into it; text appears at the strip's top edge. On desktop the
  paper is sized from the whole machine, so lever tip to right knob is at
  most 88% of the viewport (nothing cut off from 720 to 1920 px wide); the
  paper, and the machine's body under it, is centred:

  | | paper | chars per line (full width / project column) | roller strip |
  | --- | --- | --- | --- |
  | 1440×900 | 788 px | 69 / 29 | 74 px |
  | 1366×768 | 748 px | 65 / 28 | 71 px |
  | 1280×800 | 700 px | 60 / 25 | 66 px |
  | 390×844 | 367 px (full width) | 31 | 40 px |

  Details: [`docs/typewriter-rig.md`](docs/typewriter-rig.md).
- **Sound** is off by default. The toggle is a real button (aria-label
  "Sound", `aria-pressed`, at least 44 × 44 px, a solid ink focus ring):
  the bell at the roller's right end. Turning sound on plays one ding. On
  every visit, until sound is turned on, a pen note beside it says "ring
  for sound" (where there's desk room; never over text), and the bell gives
  one small wiggle when the intro finishes typing (phones, with no desk
  beside the bell, get only the wiggle).
- **The ending**: the page ends on the email and the signature. "Yours in
  type," and the signature run as one last line: the carriage stays out
  after the sign-off and carries on while the signature writes itself;
  once it's written the bell rings once (heard only with sound on) and the
  carriage returns. Nothing under reduced motion.

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
| `char` (char, column) | the roller `translateX(−column × step)`, key click (space: carriage only) |
| `return` (bell?) | end of a typed line: carriage return, bell at the end of an element |
| `feed` (bell?) | a paragraph line appeared: return sound, bell at the last line |
| `start` (element) | the signature: the carriage carries on across it |
| `idle` | carriage returns home |

Because the controller emits from the same frame loop that moves the
highlight, carriage and text can't drift apart, and compression speeds both
up together. The typewriter also tells the controller where the paper
emerges: the controller reads the height of the element marked
`data-reveal-inset` (the desk strip, up to just above the roller's clips) and ends
its trigger zone there. The strip hides the paper below that edge, so lines
of an element that are typed but haven't come out of the machine yet stay
out of sight. Rig details:
[`docs/typewriter-rig.md`](docs/typewriter-rig.md).

**10. Keyboard.** Focusing a link inside unrevealed text completes that
element instantly.

## Design playground (dev + preview deployments)

In `npm run dev` and on Vercel **preview** deployments, try other faces from
the URL. No UI, and nothing of it in the production build:
[`src/playground.ts`](src/playground.ts) is only imported when the build-time
flag `__PLAYGROUND__` is true (`vite.config.ts`: dev mode,
`VERCEL_ENV=preview`, or `PLAYGROUND=1`).

```
/?font=plex | dmmono | cutive         (default: Sometype Mono)
/?name=damion                         (default: Caveat 700)
```

Options are `data-*` attributes on `<html>` that `src/index.css` reads. DM
Mono's heaviest weight is 500, so its titles use 500; Cutive Mono has one
thin weight, so it gets the hairline outline (`--text-stroke`) and regular
titles.

## Stack

Vite + React + TypeScript, plain CSS. No animation library.
