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
