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

To regenerate them from the old site's GIFs:

```bash
scripts/encode-media.sh ../3D-Portfolio/public/thumbnails
```

Trim points, widths and quality are per-clip in the script's `JOBS` table.

## Type and colour

The face is Courier Prime, self-hosted via `@fontsource/courier-prime`, set
once as `--font-type` in `src/index.css`. Two inks on `--paper` (#f6f0e1):

| Token        | Use              | Contrast on paper |
| ------------ | ---------------- | ----------------- |
| `--ink`      | body             | 15.1 : 1          |
| `--ink-soft` | meta lines       | 6.6 : 1           |
| `--ink-red`  | emphasis, focus  | 6.5 : 1           |

## Stack

Vite + React + TypeScript, plain CSS. No animation library.
