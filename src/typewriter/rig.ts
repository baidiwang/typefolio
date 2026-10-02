/** Rig constants shared by the artwork and the controller (Typewriter.tsx). */

/** The rig's full coordinate system (desktop). */
export const RIG_VIEWBOX = { x: 0, y: 0, width: 1400, height: 280 }

/** Nav keycaps: each `data-nav-key` value in the artwork maps to a link. */
export const NAV_KEYS = ['resume', 'email', 'linkedin', 'github'] as const
export type NavKey = (typeof NAV_KEYS)[number]
