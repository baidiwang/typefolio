/**
 * A flat, character-indexed view of an element's visible text nodes.
 *
 * The reveal engine never touches the DOM text itself; it only needs to turn
 * "character 42 of this paragraph" into a (Text node, offset) pair so it can
 * position a Range there.
 */

export type TextSegment = {
  node: Text
  /** Index of this node's first character within the whole element. */
  start: number
}

export type TextMap = {
  segments: TextSegment[]
  length: number
}

/** Text that's in the DOM for screen readers only and has no visual width. */
const SKIP_SELECTOR = '.visually-hidden, [data-reveal-skip]'

export function buildTextMap(root: HTMLElement): TextMap {
  const segments: TextSegment[] = []
  let length = 0
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!node.nodeValue || (parent && parent.closest(SKIP_SELECTOR))) {
        return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT
    },
  })
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text
    segments.push({ node: text, start: length })
    length += text.data.length
  }
  return { segments, length }
}

/** The DOM position of character `index` (index === length means "the end"). */
export function pointAt(map: TextMap, index: number): { node: Text; offset: number } {
  const { segments } = map
  // Segments are few (a handful per element): a linear scan is fine.
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i]
    if (index >= seg.start) {
      return { node: seg.node, offset: Math.min(index - seg.start, seg.node.data.length) }
    }
  }
  return { node: segments[0].node, offset: 0 }
}

export function charAt(map: TextMap, index: number): string {
  const { node, offset } = pointAt(map, index)
  return node.data.charAt(offset)
}
