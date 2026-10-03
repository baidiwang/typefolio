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

The face is Courier Prime, self-hosted via `@fontsource/courier-prime`, set
once as `--font-type` in `src/index.css`. Two inks on `--paper` (#f6f0e1):

| Token        | Use              | Contrast on paper |
| ------------ | ---------------- | ----------------- |
| `--ink`      | body             | 15.1 : 1          |
| `--ink-soft` | meta lines       | 6.6 : 1           |
| `--ink-red`  | emphasis, focus  | 6.5 : 1           |

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

**7. One project at a time.** A taped photo sticks on (`data-stick="stuck"`,
a short opacity/transform animation) exactly when its project's title
starts typing: `reveal.whenStarts(titleEl, hook)` fires on the controller's
`start` for that element, or immediately with `instant` if the title is
revealed without typing (scrolled past, focused, reduced motion). Since one
job types at a time in document order, a project's text, links included,
finishes before the next project's title, and so its photo, starts.

**8. The typewriter is a listener.** The controller emits an event for
every step:

| Event | Typewriter does |
| --- | --- |
| `char` (char, column) | carriage `translateX(−column × step)`, typebar strike, a random key dips, click sound |
| `return` (bell?) | end of a typed line: carriage return, platen knob turns, bell at the end of an element |
| `feed` (bell?) | a paragraph line appeared: line feed (knob turns), bell at the last line |
| `idle` | carriage returns home |

Because the controller emits from the same frame loop that moves the
highlight, carriage and text can't drift apart, and compression speeds both
up together. The typewriter also tells the controller where the paper
emerges: the controller reads the height of the element marked
`data-reveal-inset` and ends its trigger zone there. Rig details:
[`docs/typewriter-rig.md`](docs/typewriter-rig.md).

**9. Keyboard.** Focusing a link inside unrevealed text completes that
element instantly.

## Design playground (dev only)

In `npm run dev`, try alternative looks from the URL. No UI, nothing in the
production build ([`src/playground.ts`](src/playground.ts) is only imported
behind `import.meta.env.DEV`).

```
/?theme=valentine | hermes | cobalt
/?font=cutive | space | plex          (Cutive Mono, Space Mono, IBM Plex Mono)
/?theme=hermes&font=plex
```

Themes only override CSS variables (`:root[data-theme=…]` in
`src/index.css`), including the placeholder typewriter's colours.

| Theme | Desk / paper / typewriter | ink | ink-soft | ink-red | key focus ring on body |
| --- | --- | --- | --- | --- | --- |
| default | warm grey / cream / green | 15.1 | 6.6 | 6.5 | 10.8 |
| valentine | charcoal / warm white / Olivetti red | 16.2 | 7.1 | 6.4 | 5.7 |
| hermes | walnut / ivory / seafoam | 16.0 | 7.0 | 6.9 | 9.2 |
| cobalt | cobalt blue / white / cream | 17.2 | 7.5 | 6.5 | 5.3 |

Text ratios are on the paper (AA needs 4.5); focus rings need 3. Keycap
labels are ink on the key cap: 13.9 or more in every theme.

## Stack

Vite + React + TypeScript, plain CSS. No animation library.
