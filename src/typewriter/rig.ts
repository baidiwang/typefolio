/** Rig constants shared by the artwork and the controller (Typewriter.tsx). */

/** The rig's full coordinate system. */
export const RIG_VIEWBOX = { x: 0, y: 0, width: 1400, height: 280 }

/**
 * What desktop shows: the full width, cut off at y = 240 so the lower key
 * rows run off the bottom of the screen. Keeps the machine low (~160px) but
 * wide enough that the platen spans the paper. Its aspect ratio (1400/240)
 * must match `--typewriter-height` in index.css.
 */
export const DESKTOP_VIEWBOX = { x: 0, y: 0, width: 1400, height: 240 }
