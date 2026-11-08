# MetroCard navigation and scene controls

Mode: Experience for discovery, Read inside the MetroCard. This extends the existing gold/navy card and snowy apartment world. The user requested direct outside-click return from either face, an exit animation, side arrows instead of the dropdown, and a quieter home for the two footer control groups.

## Current contract

- `Back to the street`, `Back to the card`, and the project selector are removed from the main portfolio and local preview.
- The scene outside the rounded card is an accessible dismissal target. Clicking that scene or pressing Escape returns directly to the apartment from the cover, reading, or an interrupted scan. Clicking content does not dismiss. The native dialog still contains focus; a hidden description explains Escape/outside behavior.
- Previous/next arrow buttons follow the existing floor order and wrap through all six projects. Their accessible names identify the destination; no visible repeated project-name tooltip covers the introduction. Buttons sit beside the card at desktop/tablet widths and below it on phones, preserving readable content width.
- The original swipe, reader acknowledgement, card turn/expansion, room thumbnail, short introduction, gold surface, rounded outline, Manrope project headings, and verified media/copy remain.

## Motion

`NightPass.freeze()` captures current visual transforms, opacity, and content clip before cancelling its active WAAPI sequences. It makes the card inert and pauses media. Thus a project can leave directly from either face or mid-animation without reverting to its cover first.

`MetroVisit` owns departure and route completion. Returning shrinks/tilts the frozen card toward its actual apartment window over 360ms with an ease-in/out curve. Only the modal owns fading: it holds its current opacity for the first 35%, then dissolves linearly. The card layer stays opaque so the silhouette remains visible through the meaningful travel. If that window is offscreen, it uses a local scale/fade. Card switching slides the previous card out over 230ms, then brings the adjacent cover from the matching side over 360ms. The modal stays mounted while projects change; its background does not reset.

The existing visibility-aware controller owns completion. Hidden tabs pause; current paused/reduced preferences settle; cleanup removes animations/callbacks. There is no independent navigation timer. Escape from a video fullscreen state is reserved for the browser.

## Controls in the scene

On wide layouts with at least 84px of visible outer facade on each side, the existing sound/motion buttons sit on a narrow navy/brass plate on the left, and existing LinkedIn/X links on a matching right plate. Decorative windows stay dark; no room or illustration asset is changed. Both plates remain outside the inhabited apartment bounds and above the sidewalk/traffic.

`sceneControlPlacement()` derives coordinates from the actual rendered world bounds. A resize observer updates placement with the camera/layout. Where the facades are absent or too narrow (phone/portrait/tablet), transparent edge controls remain reachable; no heavy footer panels are retained.

## Verification and provenance

Evidence is in `.impeccable/review/metro-navigation/`: five home captures (desktop1440×900, short1440×760, tablet768×1024, mobile390×844, native724×934), Lily and the combined AI cover/reading at those same sizes, and a complete six-cover desktop cycle. `matrix.json` records bounds, no dropdown/back buttons, no horizontal overflow, and media readyState4. `flows.json` records background return from both faces, inside-content protection, next-from-detail, previous/wrap cycle, one-Escape detail return, legacy Breadcrumb positioning, focus restoration, and working motion controls. Actual exit/switch frames and timestamps demonstrate departure continuity.

Existing scene/controller checks pass, with new placement regressions asserting wall bounds, street clearance, and reachable edge fallback. `npm run check` passes without warnings, and `git diff --check` is clean. One manual detector returned no findings; subsequent bounded changes removed overlapping arrow tooltips and corrected the reviewer-identified double exit fade. All 33 settled captures and fresh exit frames were recaptured. No second detector was run. No actual OS visibility/reduced-motion emulation is claimed; the shared controller regressions supply that evidence.

All artwork, fonts, and media are reused; no new shipping raster, project fact, service connection, or deployment is included. The incumbent visual system files remain untouched.

The fresh full review accepted the navigation/control layouts and requested one P2 correction: compounded opacity hid the exit silhouette too early. After the single-owner late dissolve and gentler shrink were implemented, all 33 required settled captures plus fresh exit frames were recaptured. The verdict pass scored that one fix **resolved**, disposition **ship** at the fix-list scope; the prior scoped judgments stand. This is not a deployment approval or whole-site certification.
