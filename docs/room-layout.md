# Room layout and Metro comparisons

The floor mapping below is current. The three-way comparison is historical: the user has since selected room/object zoom, first implemented in Lily, with an improved Night pass retained as a comparison. See [room-object-motion.md](room-object-motion.md) for the current behavior.

Current order, viewed from the street:

| Floor | West | East |
|---|---|---|
| Top | Google Play — dinner table | Pocket — sofa and cat |
| Middle | Lily — piano | Look Closer + Breadcrumb — library |
| Ground | Games & XR — music room | Axios — painting studio |

The music room and cat/balcony stay in place. `src/scene/rooms.ts` holds each room's original image crop. `WindowProject.scene` identifies its household, independently of its new physical slot. One uniform, bottom-aligned cover transform fits both the room art and resident canvas; exterior frames, balconies, and street coordinates stay unchanged. The dinner table's foreground cloth travels with the diners. The engine reports poses in physical window order and maps hover/focus back to the correct household.

`windowOrder` follows top west, top east, middle west, middle east, ground west, ground east. Original project hashes remain supported, including both projects in the shared AI room.

## Pocket source

Verified on 2026-11-07 from the user-provided [Pocket prototype](https://pocket-prototype.vercel.app/): native iOS prototype, My World based on photos/doodles/short notes, Together invitation-only shared world still in development. Independent development was supplied by the user. No accelerator/application claims are included and no framework is inferred.

The public `/media/pocket-product-demo.mp4` and `/media/pocket-product-poster.jpg` were retrieved from that site. Local files are `public/media/pocket.mp4` and `public/media/pocket.jpg`. The 50-second 1920×1080 demo was encoded to 1280×720 H.264/AAC with fast-start metadata, reducing 45.3MB to 3.4MB. The encoder was installed in `/tmp/typefolio-media-tools`, not added as an application dependency. Pocket declares MP4-only formats so the browser does not request an invented WebM file.

## Revised comparisons

- Night pass: a paper transit pass printed with a miniature of the selected real room; swipe it to open the work.
- Window line: the six actual apartment windows become a two-column, three-floor transit diagram. Station selection opens that project's verified content.
- Rollsign: an actual apartment vignette beneath a rolling station-name strip; the reading surface unfurls like a window shade.

All scene thumbnails and backdrops reuse the approved bitmap illustration and sprite sheets through `RoomArtwork`, with the same room fit as the live scene. SVG is only a bitmap compositor and route diagram; no new character illustration is approximated in vectors. No reference magazine artwork, tote, or subway-door illustration is displayed. Retired asset originals remain in the art archive for provenance; their public shipping derivatives have been removed.

Reading headings retain Henny Penny; body text, controls, route labels, and pass/rollsign lettering use Manrope. This preserves the existing heading voice while keeping small transit text legible.

## Verification

`npm run check` passes TypeScript, lint, scene behavior checks, and the production build. Scene checks include the requested floor order, child-project deep links, uniform floor registration, and actual sprite draw destinations. Browser checks cover desktop, short laptop, portrait tablet, phone, native browser width, swipe/keyboard opening, Escape/focus return, and the local Pocket video. A fresh finish review found one reading-heading font mismatch; its verdict pass scored that fix resolved (`ship` at that fix's scope). Evidence is saved under `.impeccable/review/metro-rooms/`.
