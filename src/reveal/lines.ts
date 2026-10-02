import type { TextMap } from './textMap'

/**
 * Split an element's text into the visual lines the browser laid out.
 *
 * Returns the character index at which each line starts (always beginning
 * with 0). Lines can only break before a word or at the start of a text node
 * (inline element / flex item), so we only measure those candidate positions
 * with a one-character Range, and start a new line whenever the glyph box
 * drops below the previous one.
 *
 * Measurements depend on fonts and width: the controller calls this again
 * after `document.fonts.ready`, on every font `loadingdone`, and on resize.
 */
export function measureLineStarts(map: TextMap): number[] {
  const starts = [0]
  const range = document.createRange()
  let lastTop: number | null = null
  let prevChar = ''

  for (const { node, start } of map.segments) {
    const text = node.data
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      const candidate = i === 0 || /\s/.test(prevChar)
      prevChar = ch
      if (!candidate || /\s/.test(ch)) continue

      range.setStart(node, i)
      range.setEnd(node, i + 1)
      const rect = range.getClientRects()[0]
      if (!rect || rect.height === 0) continue

      if (lastTop !== null && rect.top > lastTop + rect.height / 2) {
        const index = start + i
        if (index > starts[starts.length - 1]) starts.push(index)
      }
      lastTop = rect.top
    }
  }
  return starts
}

/** Which line (index into `starts`) contains character `offset`. */
export function lineOf(starts: number[], offset: number): number {
  let line = 0
  while (line + 1 < starts.length && starts[line + 1] <= offset) line++
  return line
}
