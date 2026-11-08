# Working on Baidi Wang's portfolio

## Design direction

Avoid unnecessary secondary labels and descriptions. Let the layout do the explaining!

- The homepage is an illustrated snowy New York neighborhood. Let the rooms, residents, shops, and street carry the experience. Preserve its ink lines, paper texture, warm interiors, and proportions.
- Remove decorative explanatory copy, redundant category eyebrows, generic glass cards, and default pill-shaped interface panels. Add text only when it helps someone act or understand the actual work.
- Keep the user-selected Henny Penny only for the homepage name. Use Manrope for project/card headings, body copy, tooltips, descriptions, and functional hints. Project detail headings use weight 600; do not restore Henny Penny inside the card.
- Keep the name and exact tagline, `design engineer based in NYC`, on a quiet, high-contrast surface with room to breathe. Never let the building artwork compete with either line.
- Project discovery must preserve a clear view of the corresponding room and resident. Position concise project captions beside the room or on its balcony; support hover, keyboard focus, and touch.
- Every room must react immediately to a new hover/focus visit with a pose different from the one just shown, then return to its quiet household activity. Avoid simultaneous repeated motions or bouncing a whole seated sprite.
- Keep the custom cursor small, hand-drawn, and legible. Preserve native text selection and touch behavior; do not use cursor trails or obscure the pointer's hotspot.
- Sound is optional, initially off, and uses quiet city snowfall with soft distant passing traffic. Avoid loud continuous storm/wind hiss, horns, or sirens. Pause it for hidden tabs and open case studies.
- The crossing has exactly one hint: `Watch out for traffic`. Do not add crossing-phase, waiting, or sidewalk toast messages.
- Decorative side buildings remain dark and empty, with distinct rooflines/facades. The only functional additions are quiet wall-mounted control plates when those outer facades are visible: sound/motion on the left, LinkedIn/X on the right. Keep windows unlit and avoid resident-room or street overlap. Narrow layouts use unboxed edge controls so the functions remain reachable.
- Keep the two awning signs concise: `RESUME` and `USPS`.
- On wide screens, give more space to the inhabited apartments by reducing the reserved header sky. Keep the full street, both sidewalks, actors, and hit targets registered and visible; do not stretch the artwork or enlarge only one layer.
- Project windows open the user-selected MetroCard presentation over the snowy neighborhood. Preserve the original card layout: project name, one or two introductory sentences, and the corresponding room thumbnail at the upper right. Use the shared `--window-gold` selection/light color (#e6be72), navy magnetic stripe, and clearly rounded card corners on both faces.
- Keep the single-card swipe through a visible reader, with `Swipe card` on its stripe. Pointer swiping, click/tap, and Enter run the same scan. A short or cancelled drag returns to rest. The card arrives from the selected window with a soft fade; a successful scan lights the reader, punches the current dot, then turns/expands the same rounded card and reveals its contents. Clicking outside either face or pressing Escape returns directly to the apartment with a shrinking/fading exit; never require an intermediate cover step. Remove `Back to the street`, `Back to the card`, and the project dropdown. Previous/next arrows sit beside the card (below on phones), follow floor order, and open the adjacent MetroCard cover through a directional slide. Preserve current motion preferences, hidden-tab suspension, focus restoration, media pause, and individual project deep links. The direct stacked-card flip is retired.
- The room-object zoom, detached resident vignettes, menu/score/sleeve/journal/bookcase/canvas presentations are rejected and retired. Do not restore them as the main presentation. Window line, Rollsign, tote, and the illustrated subway-door poster are also retired. The original homepage rooms, residents, and cat route remain the visual authority.
- The piano resident sits on the existing bench and plays, using registered hand/head poses; do not restore phone-call pacing. Chimney smoke uses the same paused/hidden clock and camera as the scene, with room to rise above the cropped image.
- Project priority by floor: top west Google Play/dining and top east Pocket/sofa+cat; middle west Lily/piano and middle east Look Closer + Breadcrumb/library; bottom west Games & XR/music unchanged and bottom east Axios/studio. Move room art and residents together. Keep the cat's current top-east room and balcony registration.
- Pocket is the user's independently developed iOS app. Use verified prototype information from `https://pocket-prototype.vercel.app/`; describe it as in development. Omit accelerator/application details. Preserve both individual AI-project deep links in their combined room.

## Content and implementation

- Work in the existing React/TypeScript/Vite application. Do not add a framework or an animation engine for these 2D interactions.
- Keep verified content in `src/content.ts` and scene mappings/personal links in `src/scene/projects.ts`. Preserve real links, project media, résumé, and deep links. Do not invent achievements or project claims.
- Use English for visible copy, accessible names, status feedback, and errors.
- Keep artwork, actors, hit targets, and foreground occlusion registered to the same camera. People and vehicles must move fully beyond the visible viewport before wrapping or disappearing, including on wide screens.
- Preserve pedestrian yielding, both visible sidewalks, stable feet, and the horizontal exit route. Use real time-based animation and continuous positions across frame-rate changes.
- Preserve reduced motion, motion pause, offscreen/hidden-tab suspension, native keyboard navigation, visible focus, and focus restoration after closing a project.
- Prefer the installed `impeccable` skill for design refinements; these user-specific directions take precedence over its generic defaults. Keep critique grounded in the actual rendered illustration.

## Validation

- Use Node 22.12 or newer. `npm run check` runs TypeScript, lint, scene behavior checks, and a production build.
- Extend the scene checks for movement, yielding, edge exits, suspension, and hover responses when changing those behaviors.
- Inspect desktop, short laptop, portrait tablet, and phone layouts. Check identity contrast, unclipped captions, unobscured rooms, asset alignment, and complete street exits.
- Reuse the local preview. Keep revisions local unless the user requests deployment. Do not commit or discard unrelated existing changes.
