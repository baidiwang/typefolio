# Initial piano prototype and Night pass

This records the initial Lily-only prototype, its generated illustration provenance, and the Night pass comparison. The current six-room presentation, resident placement, and motion implementation supersede that prototype; see [six-room-objects.md](six-room-objects.md). The user selected **room zoom → an object inside the room** as the primary direction after comparing Metro concepts.

## Initial prototype direction

- **Thesis:** the work belongs to the inhabited apartment. Enter Lily's actual room, approach its piano, and unfold its score into the reading surface.
- **Own world:** approved warm room bitmap, the existing piano/bench, registered watercolor pianist, cream grain paper, Henny Penny headings and Manrope body text. Staff geometry identifies the music score without adding explanatory copy.
- **Story:** click or keyboard-open the Lily window; the same room grows from that window, then the score grows into a spread. Return shrinks the score and restores the street/window focus.
- **First viewport:** desktop and portrait tablet spreads use the left page for Lily and its real video, the right for verified copy/links. Narrow screens up to 760px use a single internally scrolling page. The close control stays outside the scroll body.
- **Form:** an object within the existing room, not a separate city illustration. The first implementation is Lily only; other projects retain the existing case reader until their objects are designed. Seed: none (incumbent user-defined direction).
- **Finish:** verify entry, reverse exit, interrupted entry, deep links, focus, internal scrolling, pause/reduced motion, browser sizes, then fresh finish review at that scope. No generated page mockup or replacement visual world is involved.

## Initial prototype motion

The room uses a uniform camera zoom over 820ms. After 620ms the score grows into the spread over 660ms; content is revealed through a mask. The reverse exit takes 720ms. These are interruptible Web Animations API sequences with tracked timers and cleanup. Finished scaled layers are released for text rasterization at the final size. Resizing remeasures the room/score and completes the reveal. Motion pause or reduced motion uses the final readable state immediately. No new motion dependency is installed.

Night pass remains a local comparison. The card follows a rightward pointer gesture, with a release threshold and a short-drag/vertical-scroll escape. Click or Enter runs the same reader sequence. A visible slot/light acknowledges the scan; the card flips and expands using its shared container, then its back scrolls internally. Escape reverses the card. Project changes unmount its media/timers/animations. Window line and Rollsign are retired alongside the earlier tote/door concepts.

## New illustration assets

Built-in `image_gen` produced the [pianist source](../art/after-hours/pianist/pianist.png) and [smoke source](../art/after-hours/pianist/chimney-smoke.png) using the approved room and original character sheet as references. Exact final prompts: [pianist](../art/after-hours/pianist/pianist-prompt.txt), [smoke](../art/after-hours/pianist/chimney-smoke-prompt.txt). PNG metadata and shipping WebP sidecars retain provenance. Shipping assets are [pianist.webp](../public/scene/pianist.webp) and [chimney-smoke.webp](../public/scene/chimney-smoke.webp), derived WebP encodings. No reference magazine art is used.

`src/scene/pianist.json` measures the actual alpha bounds of four generated cells. A common scale/hip anchor and matching local foot baseline register them on the existing bench. The quiet cycle alternates playing poses; visits choose a different hand/head pose, including a glance back. Phone-call pacing is removed from both the live engine and printed room artwork.

Smoke uses the same elapsed-time clock as residents. Its independent viewport canvas shares the world camera, so wisps can rise above the image edge and remain attached when resizing/panning. Pause, hidden tabs, and open projects suspend its clock. The pre-existing printed left plume remains part of the approved base artwork; animated translucent wisps emerge from both main-building chimney groups.

## Validation

Scene checks cover the new pianist draw destination plus original floor/traffic/pedestrian/cat/hover/pause behavior, smoke camera alignment above the source image, and smoke timing at 60/10fps. Browser evidence and interaction frames are stored in `.impeccable/review/pass-room/`. Project facts and links continue to come from the shared `WindowReading`/`content.ts` records.

The fresh finish review found four bounded continuity defects: unrevealed paper flashing during early exit, a drag-release reset before scanning, Escape resetting a partial card expansion, and frozen smoke not repainting while panning. All four were fixed and scored resolved in the verdict pass (`ship` at that fix-list scope). Native-keyboard interruption captures, recorded scan positions, and paused west/east captures are saved alongside the normal viewport matrix. The added paused-pan test verifies a redraw at the new camera without advancing time or wisp positions. Final `npm run check` and `git diff --check` pass without warnings; the single manual detector run returned no findings.
