# Illustration assets

The approved reference was the user-supplied `NYC-After-Hours-v4.html`. Its seven embedded WebP images were extracted without re-encoding. `src/scene/sprites.json` contains its exact source-frame metadata; coordinates refer to a 1536 × 1024 world.

All additional raster artwork was produced with the built-in image_gen tool, using the extracted reference images. No API-key CLI fallback was used.

## Storefront edit

Saved as `art/after-hours/city-postoffice.png` (1536 × 1024). Edit target: `public/scene/city-original.webp`.

Prompt:

> Use case: precise-object-edit. Edit target: the attached snowy New York apartment background. This is a fixed-coordinate website illustration. Preserve the exact 3:2 composition, all geometry and object positions, all six empty apartment interiors, balconies, street, zebra crossing, both visible sidewalks, tree, colors, texture, irregular ink lines and matte printed picture-book illustration. Change ONLY the lower-right flower shop (below the green armchair room, x=945..1210 and y=570..697 in the 1280x853 reference) into a small neighborhood post office. Remove flowers and table and replace with a warm illuminated postal counter, modest mail cubbies, a small blue postal mailbox INSIDE/along the shop display, navy blue striped snow-covered awning, integrated cream text 'POST OFFICE' on its navy awning. The mailbox must not obstruct the sidewalk or crossing. On the left bookshop awning integrate small ivory lettering 'BOOKS & RÉSUMÉ'. Keep architectural scale and storefront boundaries exactly unchanged. No people, no new props outside the two storefronts. Do not redraw the houses or change any other area. Output the full scene, same aspect ratio.

## Cat walking cycle

Saved as `art/after-hours/cat-walk.png` (2172 × 724, alpha preserved). Reference: `public/scene/cat.webp`. The generated canvas uses four equal horizontal cells. The engine measures each cell's actual nontransparent pixels and foot baseline on load, rather than assuming the requested output dimensions were followed.

Prompt:

> Use case: identity-preserve. Asset type: transparent 2D character animation sprite sheet for a website. Reference image is a sheet of the SAME small white and charcoal patched cat, with fine irregular ink outlines, matte watercolor pencil texture. Create ONLY a walking cycle of this same cat in four distinct poses. Exact layout: four equal 256x256 cells in a SINGLE horizontal row on a 1024x256 fully transparent canvas. One small whole cat centered in each cell, side profile facing LEFT, equal body size and registration, paws grounded on the SAME y=210 baseline, body nose-to-tail occupying about 180 pixels. Tail curved upward. Poses at quarter cycle: left foreleg forward/right hindleg forward; passing pose; right foreleg forward/left hindleg forward; opposite passing pose. Body, face, coat markings and head consistent in every frame; legs visibly step, no jumping, crouching or sitting. Maintain reference illustration style. No text, no labels, no environment, no ground shadow. True alpha transparency.

## Self-hosted fonts

Instrument Serif and Manrope are distributed under the SIL Open Font License. Latin WOFF2 files are served locally; no visitor requests to Google Fonts are required. Font license texts are included alongside the fonts.

## Panoramic surround

Saved as `art/after-hours/neighborhood-surround.png` (2172 × 724). The scene renders this behind its unchanged central illustration, at the identical world scale. The surround supplies only the extended sides; all interactive coordinates remain registered to the approved central world.

Prompt:

> Use case: precise-object-edit / outpainting. Asset: panoramic matching background surround for the attached fixed-coordinate snowy New York apartment illustration. Make a 3:1 very wide panorama, ideally 3072 by 1024. The ENTIRE attached 1536 by 1024 image must remain centered at exactly its original size and composition; extend the canvas left and right, not above or below. Extend 768 pixels of matching surroundings on each side: continue the deep indigo brownstone outer walls, some quiet dark unlit windows and snowy fire escapes, the same cloudy blue starry sky at the top, the same warm reflected wet street and two snow-edged sidewalks at the bottom. Street lane marking heights and sidewalk levels must continue straight across from original at exactly the same heights. Do not stretch, zoom, crop, rearrange or change the central image. Keep all six warm rooms and central tree and both storefronts unchanged. Only the CENTRAL six windows should glow. Extended outer facades are quiet, predominantly dark navy #1b2e4b with ink/pencil paper texture, no people, vehicles, new storefronts or bright detail. Exact style match: matte storybook watercolor, irregular black ink contours, textured night palette, gently falling snow. Output one complete wide panorama.

## Web delivery

Original generated PNGs are retained in `art/after-hours/`. The application serves optimized WebP derivatives from `public/scene/`: `city-postoffice.webp`, `neighborhood-surround.webp`, and `cat-walk.webp`. The cat derivative uses lossless encoding and retains alpha. No generation dependency is added to the application.

## Typography update

The user selected Henny Penny in the supplied Google Fonts screenshot. The current site self-hosts Henny Penny regular and Patrick Hand regular in `public/fonts/`; their SIL Open Font License texts are included. Previous font assets are retained but are no longer preloaded or used.

## Asymmetric decorative neighbors

Generated with the built-in image_gen tool from the existing panoramic surround. Original output: `art/after-hours/neighborhood-surround-asymmetric.png` (2172 × 724). Web derivative: `public/scene/neighborhood-surround-asymmetric.webp`. Only the decorative side backdrop is used; the central project illustration and interactive coordinates remain unchanged. All new neighbor windows are dark and empty.

Final prompt:

> Use case: precise-object-edit. Edit target: the attached 3:1 panoramic snowy New York street illustration, 2172 x 724. This is an already working illustrated portfolio background. Change ONLY the decorative buildings in the outer LEFT QUARTER (x 0..543) and outer RIGHT QUARTER (x 1629..2172). Keep the central HALF x543..1629 exactly in place: the two inhabited indigo apartment wings, six warm empty rooms, balconies, courtyard tree, shop signs, sidewalk, road markings and crossing all must stay identical and at the same coordinates. The two decorative outer sides currently mirror each other; make their architecture DISTINCT and asymmetrical. LEFT: a lower, broad, old dark navy brownstone facade with a modest stepped parapet, larger arched upper windows, different widths between bays and a couple of shallow stone stoops. RIGHT: a taller narrow dark blue brick tenement with a different cornice silhouette, a few projecting rectangular bay windows, vertical brick pilasters, and a slim offset fire escape. The architecture immediately adjacent to the central half must also differ visibly, rather than changes only at far edges. All added/edited decorative windows must be BLACK, UNLIT and EMPTY; no residents, interior scenes, warm lights, decorative signs, new shops, or interactive-looking details. Keep the sides subdued and darker than the main apartments, with simple furnishings absent. Preserve the exact sidewalk/curb/road and near sidewalk heights across the entire panorama (street curb around y613, near sidewalk around y688). Preserve the reference's irregular ink contours, watercolor/pencil texture, matte printed deep indigo colors, believable New York brownstone scale and winter snow. Do not create generic vector geometry or glossy 3D. Preserve the central composition's 1536x1024-world registration and same 3:1 output aspect ratio. Output the full updated panorama.

The tooltip typography now uses the existing self-hosted Manrope variable font for small titles and descriptions. Henny Penny remains the display face; case-study typography and presentation are unchanged in this revision.

## Header sky extension

`public/scene/sky-extension.webp` is a mechanical crop of the existing asymmetric panorama, source rectangle x=0, y=0, width=530, height=88. It extends the same painted sky above the scene without generating new artwork or changing scene registration. The title remains HTML text.

Local font comparisons are available in Vite development at `/?type=henny&still=1` and `/?type=manrope&still=1`. Only the name's font changes. Henny Penny remains the default pending the user's choice.

Room registration is documented in [room-layout.md](room-layout.md). The current presentation authority is [metro-card-stack.md](metro-card-stack.md): MetroCard is shared by the main portfolio and `/?study=pass`. The piano/score zoom in [room-object-motion.md](room-object-motion.md) is historical, alongside the retired six-room object experiment. The other options below are historical, retired work; tote/door public derivatives have been removed.

## RESUME / USPS and NYC object studies

See [nyc-object-prompts.md](nyc-object-prompts.md) for the exact prompts and asset provenance. All three new illustrations were produced with the built-in image_gen tool using the user's references and the existing illustration as style authority.

- `art/after-hours/storefront-resume-usps.png`: text-edit output. Only its two awning rectangles were copied into the original master: x110, y682, w305, h55; and x1128, y682, w329, h57. The resulting `art/after-hours/city-resume-usps.png` is pixel-identical to the previous PNG outside those rectangles (verified in RGB). Web derivative: `public/scene/city-resume-usps.webp`.
- `art/after-hours/canvas-tote.png`: original transparent bag, self-hosted as `public/studies/canvas-tote.webp` with alpha preserved. Its printed Baidi Wang lettering and the project booklet are semantic HTML layers.
- `art/after-hours/subway-doors.png`: original closed paired door illustration, self-hosted as `public/studies/subway-doors.webp`. CSS splits it at the central seam into independently moving door leaves. Project lettering and all reading content remain HTML.

At 1600×900, the central world now measures 1284×856 rather than 1164×776: a 10.3% increase. Each decorative flank occupies 158px rather than 218px. The wide-screen camera uses a 44px sky reserve; other aspect ratios retain their previous fit. World proportions and coordinates remain unchanged.
