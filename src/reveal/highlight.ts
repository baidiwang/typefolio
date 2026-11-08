/**
 * Hiding text without touching layout or the accessibility tree.
 *
 * Unrevealed text is covered by a Range registered in the CSS Custom
 * Highlight API, styled in index.css as
 *
 *   ::highlight(unrevealed) { color: transparent; text-decoration-color: transparent; }
 *
 * A highlight only repaints glyphs: no DOM changes, no reflow, and screen
 * readers / find-in-page still see every word. Where the API is missing,
 * `supported` is false and the engine simply leaves all text visible.
 */

const NAME = 'unrevealed'

export const supported =
  typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined'

let highlight: Highlight | null = null

function registry(): Highlight {
  if (!highlight) {
    highlight = new Highlight()
    CSS.highlights.set(NAME, highlight)
  }
  return highlight
}

export function hide(range: Range) {
  registry().add(range)
}

export function show(range: Range) {
  highlight?.delete(range)
}

/**
 * Ranges inside a Highlight are live, but some engines only repaint when the
 * set itself changes. Re-adding is cheap and guarantees a repaint.
 */
export function touch(range: Range) {
  const h = registry()
  h.delete(range)
  h.add(range)
}

// —— Fresh ink ——————————————————————————————————————————————————————————
// Each typed character lands faint and darkens to full ink, like a type
// slug striking the ribbon: two more highlights over little per-character
// Ranges. The newest FRESH_N characters are ink-fresh, the SETTLE_N before
// them ink-settle, everything older plain ink: a short trail that follows
// the typing at any speed. When typing stops, the trail settles by time
// (its own frame loop, which stops once all is ink). Only typed characters
// get it (never instant reveals), so under reduced motion there's none.

const FRESH_N = 2
const SETTLE_N = 4
const FRESH_MS = 90
const SETTLE_MS = 200

type Struck = { range: Range; at: number }
let struck: Struck[] = []
let fresh: Highlight | null = null
let settle: Highlight | null = null
let frame = 0

function restyle(now: number) {
  fresh?.clear()
  settle?.clear()
  struck = struck.slice(-(FRESH_N + SETTLE_N)).filter((s) => now - s.at < SETTLE_MS)
  struck.forEach((s, i) => {
    const fromEnd = struck.length - 1 - i
    if (fromEnd < FRESH_N && now - s.at < FRESH_MS) fresh?.add(s.range)
    else settle?.add(s.range)
  })
}

function inkLoop(now: number) {
  frame = 0
  restyle(now)
  if (struck.length) frame = requestAnimationFrame(inkLoop)
}

/** Ink one just-typed character (its Range), fresh, then settling. */
export function strike(range: Range) {
  if (!supported) return
  if (!fresh) {
    fresh = new Highlight()
    settle = new Highlight()
    CSS.highlights.set('ink-fresh', fresh)
    CSS.highlights.set('ink-settle', settle)
  }
  const now = performance.now()
  struck.push({ range, at: now })
  restyle(now)
  if (!frame) frame = requestAnimationFrame(inkLoop)
}
