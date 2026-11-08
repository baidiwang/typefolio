# Baidi Wang — After Hours

An illustrated, full-screen portfolio built with React 19, TypeScript, Vite, and plain CSS. Six inhabited apartment windows open real project stories; the RESUME shop opens the existing résumé, and the USPS storefront copies the contact email.

## Development

Use Node 22.12 or later (required by the existing oxlint dependency).

```sh
npm install
npm run dev
npm run check
```

`check` runs TypeScript, oxlint, the scene behavior checks, and the production build. Vite outputs `dist/`. The homepage is a single viewport; case studies scroll inside a native modal dialog. The production host must serve the root HTML at the site URL. There is no backend or new runtime dependency.

All six windows open a single MetroCard over the illustrated neighborhood. It arrives from the selected window, swipes through a visible reader, then turns/expands and reveals the reading inside the same rounded card. Click/tap or Enter runs the same scan; short drags cancel. Covers retain their room thumbnail and introduction. Manrope now handles all project headings; Henny Penny remains only on the homepage name. The shared `--window-gold` token also supplies the site's text-selection yellow. See [metro-card-stack.md](docs/metro-card-stack.md) for the current contract. Local `/?study=pass&project=lily` shares the card implementation; its comparison wrapper is development-only. The direct stacked-card flip and room-object/vignette experiment are retired. Historical illustration provenance remains in [room-object-motion.md](docs/room-object-motion.md).

## Content

- `src/content.ts` remains the source for the existing verified project copy, project links, media, personal links, and résumé.
- `src/scene/projects.ts` maps those records to the six reference room coordinates and centralizes `contactEmail`, `resumeUrl`, `linkedinUrl`, and `xUrl`.
- The bottom icons link to the verified LinkedIn profile and the user-provided X profile, `https://x.com/baidi_wang`.
- Existing `#lily`, `#breadcrumb`, `#google-play`, `#look-closer`, `#data-visualization`, `#little-helper`, and `#desol` links still open their project context. `#pocket` opens the new iOS project; `#ai-projects` groups Look Closer and Breadcrumb, while their individual hashes scroll to the right entry. `#games` opens Games & XR.
- No project claims, achievements, or metrics were added. Games preserve both existing full entries and the existing XR links. Axios retains its actual writeup.

## Scene

`src/scene/engine.ts` draws the residents, cat, snow, and yielding traffic with Canvas 2D. `sprites.json` preserves the prototype's original frame crops and anchors. Room coordinates use the original 1536 × 1024 world; every visual layer and hit target belongs to the same responsive world.

The desktop camera reserves a quiet sky area for the identity and fits the complete scene with a matching panoramic surround; mobile keeps the artwork at a readable scale and supports native horizontal swiping plus West/East buttons. There is no persistent project directory. Focused and hovered windows show one paper caption beside the room, over its balcony/courtyard space, while the resident responds with a different pose. Touch visitors tap once to discover the caption and again to open it. Standard modified-click and new-tab link behavior are preserved.

Native `<dialog>` provides keyboard focus containment. Background click or Escape returns directly from either card face with a shrinking/fading exit; closing restores its apartment window and preserves scene time/camera. Side arrows replace the dropdown and cycle through project covers. Wide-screen sound/motion and LinkedIn/X controls sit on the empty side facades; narrower layouts keep unboxed edge controls. See [metro-navigation.md](docs/metro-navigation.md). Optional quiet city-snow ambience starts off: soft snowfall with sparse distant traffic, without a melody or continuous storm hiss. Reduced motion starts paused, and motion suspends for hidden tabs, offscreen scenes, and open case studies.

## Assets

- `public/scene/` includes extracted transparent reference sprites and generated matching illustration assets.
- `public/fonts/` self-hosts Henny Penny for the homepage name and Manrope for project headings, tooltips, and case-study text (Latin WOFF2).
- `public/media/` and `public/BaidiWangResume.pdf` are the original project demos and résumé.
- See `docs/scene-assets.md` for illustration provenance and generation prompts.

The old typewriter components and artwork remain in the repository for reference; they are no longer imported into the application bundle.

Design and maintenance rules live in `AGENTS.md`, including the user’s instruction to avoid unnecessary secondary labels and descriptions. The globally installed Impeccable skill supplies additional design guidance; the user’s illustrated direction takes precedence. Small authored cursor SVGs are in `public/cursors/`.

## Deployment

The existing GitHub repository is `baidiwang/typefolio`. Its `main` branch is connected to the Vercel project `typefolio` in `baidiwangs-projects`, serving https://baidiwang.vercel.app. Push validated changes to `main` to trigger production deployment. The project uses the Vite preset, Node 24, `npm run build`, and the `dist` output directory.

Run `npm run check` before publishing. Local `.vercel` account linkage and `.impeccable` review captures are ignored by Git; `.vercelignore` also excludes source artwork and documentation from CLI deployment uploads. Project comparison studies remain development-only.
