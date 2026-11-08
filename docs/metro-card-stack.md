# MetroCard — swipe and reveal

Mode: Experience for discovery; Read inside the card. This refines the selected Night pass composition. The user asked to restore the original swipe after trying the stacked-card flip. The room-object/vignette approach remains retired.

## Direction

Preserve the warm `--window-gold: #e6be72` surface, project introduction, circular project letter, navy stripe, actual room thumbnail at upper right, and rounded reading-card outline. There is one card and a visible reader again. `Swipe card` names the gesture; click/tap and Enter run the same scan without requiring a drag. Short/vertical/cancelled gestures return to rest.

Henny Penny belongs only to the homepage name. Card and reading titles/subheadings use the existing self-hosted Manrope at weight 600; body/navigation remain Manrope. No font download, new illustration, or project fact is introduced.

## Motion thesis and implementation

The focal sequence is window → card → acknowledged scan → reading on the same card.

- `MetroVisit` dissolves in over 280ms, preserving the settled apartment backdrop and framing. `NightPass` waits one animation frame for the native dialog to open before measuring.
- The single card arrives from the actual selected window over 520ms, with a shallow rotation and fade. Offscreen/direct-preview origins use a smaller local arrival. Scale stays uniform so the room/card is not stretched.
- A successful gesture continues from its release position through the reader over 440ms. The lamp turns green and the active route dot makes one bounded punch motion.
- The same card turns and expands over 620ms. Its content reveals through an opacity/clip mask over 320ms after 240ms, rather than appearing as a separate panel.
- Background click or Escape returns directly to the apartment over 360ms, freezing the current face before a visible shrinking return and late dissolve; see [metro-navigation.md](metro-navigation.md). Short/cancelled drags still reset over 200ms. No idle wobble, stack choreography, independent navigation timer, or new animation dependency is used.

Entry, scanning, punching, expansion, content reveal, and parent dissolve use the existing visibility-aware WAAPI controller. Hidden tabs pause; current paused/reduced preferences settle state; cleanup cancels animations and callbacks. The scheduled entry measurement is cancelled on unmount. Text is crisp again once scaled layers finish and cancel.

The current outside-return and side-arrow navigation is documented in [metro-navigation.md](metro-navigation.md). There are no intermediate return buttons: background click or Escape returns directly to the apartment with a frozen-card exit. Opening focuses the reading region; closing restores the apartment window. Individual AI/game links still open their actual record. The scan/reading mechanics above remain in place.

## Validation and provenance

`src/scene/NightPass.tsx`, `night-pass.css`, `MetroVisit.tsx`, and `App.tsx` implement the current flow. The main portfolio and existing local development preview share it. The illustration, paper, room crops, and all content/media are reused; no shipping raster changed.

`.impeccable/review/metro-swipe/` contains 48 required front/open captures: every project at desktop1440×900, phone390×844, and native724×934; Lily and the multi-project AI room additionally at short laptop1440×760, tablet768×1024, and preview658×934. Captures follow actual scan/return/reopen to settle native media. Nine contact sheets were opened and checked against their filenames. `matrix.json` records reader clearance, fitting descriptions, computed Manrope headings, opacity/clip completion, media readiness, and no horizontal overflow.

`flows.json` records actual pointer short/vertical/full swipes, keyboard scan, cancellation during scan/expansion, and Breadcrumb deep-link positioning. `paused.json` verifies the local paused-motion path and street focus restoration; the homepage name still computes as Henny Penny. The shared controller's existing clock regressions cover hidden/reduced/queued completion/cancellation. OS preference emulation is unavailable in this browser harness, and no actual OS preference change is claimed. `npm run check` and `git diff --check` pass.

Actual `entry-frames` and `scan-frames` with timestamp records, contact sequences, and `metro-swipe-motion.gif` demonstrate the authored flow. The final native dialog backdrop is transparent during its dissolve, so the original apartment stays visible rather than flashing a solid-color frame. Settled layouts are unaffected. One manual detector returned no findings before this bounded backdrop correction; it was not run twice. A fresh full finish review inspected the final source, recaptured entrance, all required settled layouts, and interaction records, returning **ship** for the local swipe/motion/typography refinement with no material fixes.
