# Six room objects

**Retired:** the user rejected this presentation on November 7 and selected the MetroCard version again. This document is historical; follow [metro-card-stack.md](metro-card-stack.md) and AGENTS.md for current work. The earlier review below does not override that rejection.

The user requested all six window presentations to grow from a room object, with the original residents visible beside the work. The supplied November 7 screenshot is an anti-reference for a full-page rectangle that conceals the pianist.

| Room / project | Reading object | Residents |
|---|---|---|
| Dining / Google Play | Arched, folded bistro menu | Diners on both sides |
| Piano / Lily | Folded music paper beside the piano | Pianist at left / lower-left |
| Music / Games & XR | Record sleeve with a vinyl edge | Singer on the left |
| Sofa / Pocket | Cloth-bound personal journal | Sofa resident and cat on the right |
| Library / Look Closer + Breadcrumb | Open volume on the bookcase shelf | Reader and armchair on the right |
| Studio / Axios | Canvas held on an easel | Painter on the left |

## Direction contract

**Thesis:** enter the same apartment and read the work on one of its belongings, with the resident continuing to inhabit the composition. The reading surface no longer occupies the entire room.

**Own world:** original watercolor/ink room art and measured sprite frames, warm paper, wood, cloth, canvas, and vinyl. Henny Penny remains the project-heading voice; Manrope handles body/navigation. No new illustration is generated for this round. SVG only composes existing bitmap crops; CSS draws physical page/frame geometry and vinyl grooves.

**Story:** a window zooms toward its configured native object anchor; the object unfolds while the resident/furniture vignette settles beside it. Closing reverses from the current presentation, including interrupted entrances. Next room follows the established floor order.

**First viewport:** on desktop, the object reserves a side or two margins for residents. On phones the object ends above the resident strip; original people, furniture, and cat remain visible while text scrolls internally. Back/next and multi-project navigation remain accessible outside the scrolling body.

**Form:** six object profiles extend the user-selected room/object approach. No new world or generated page comp is involved; seed: none (user-defined incumbent direction).

**Finish:** inspect all six desktop and phone compositions, tablet/short laptop, deep links, next/return, interruption, scroll, pause/reduced/hidden behavior, and a fresh finish review at the implemented scope.

## Implementation

`roomObjects.ts` holds native object anchors and native resident/furniture crops. `RoomArtwork` shares the approved room bitmap/sprites between entry and reading vignettes. The reading-only Pocket cat stands beside the sofa; homepage animation and balcony registration are unchanged.

`RoomVisit` owns one native dialog for all six projects, interruptible camera/object/vignette animations, and a viewport-filling depth backdrop. Readiness follows the content animation's actual completion, not a timer. Native furniture grounds each character. Quiet registered pose changes run only while ready, motion is enabled, the tab is visible, and reduced motion is off.

`visitMotion.ts` pauses every active entry/reverse animation while the document is hidden, retaining its current time. Route completion belongs to the reverse animation, with no independent wall-clock navigation timer. Current pause/reduced-motion preferences settle the transition once visible, including an exit already in progress. Queued finish events cannot navigate a hidden tab; cleanup cancels pending completion.

The shared `WindowReading` retains existing content, media, role facts, and external links. AI and Games have functional section tabs; both AI legacy hashes and game child hashes still scroll to their actual records. No new achievements, copy, or media are invented.

## Evidence

Rendered browser captures are in `.impeccable/review/six-room-objects/`. `npm run check` includes required object/side/crop mapping plus the existing scene behavior and camera checks. The room assets and prior generated pianist/smoke provenance remain documented in [room-object-motion.md](room-object-motion.md).

The fresh full review accepted the six visual compositions and requested one transition-lifecycle fix. Regression checks model the WAAPI clock during hidden entry and reverse/next, changed motion preferences in both directions, hidden queued completion, and abandoned transitions. All 30 viewport captures were refreshed after the fix, with media readiness and overflow recorded in `revised-matrix.json`. The browser harness has no reduced-motion/visibility emulation capability; lifecycle edge conditions are verified through the controller regression checks and listener wiring, rather than an OS preference change.

The verdict pass scored that single lifecycle fix **resolved**, with disposition **ship** at the local implementation scope; its earlier visual assessment stands. This extends the incumbent room world and preserves its Henny Penny/Manrope typography, bitmap/sprite registrations, warm material palette, and existing content records. No deployment or new visual identity is included.
