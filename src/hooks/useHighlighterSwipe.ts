import { useEffect } from 'react'
import { reveal } from '../reveal/controller'

/** True while any part of `el` is still covered by unrevealed text (the
 *  reveal controller's hidden ranges run from the typing point to the end
 *  of each element). */
function stillHidden(el: Element): boolean {
  const ranges = CSS.highlights?.get('unrevealed')
  if (!ranges) return false
  for (const range of ranges) {
    if (range instanceof Range && range.intersectsNode(el)) return true
  }
  return false
}

/**
 * Watches the page's highlighter marks and swipes each one on once its
 * phrase is fully typed (checked on every typing event). Under reduced
 * motion (nothing is hidden) they're simply all on.
 */
export function useHighlighterSwipe() {
  useEffect(() => {
    let pending = [...document.querySelectorAll<HTMLElement>('.hl:not([data-swiped])')]
    const check = () => {
      pending = pending.filter((mark) => {
        if (stillHidden(mark)) return true
        mark.dataset.swiped = ''
        return false
      })
      if (!pending.length) unsubscribe()
    }
    const unsubscribe = reveal.subscribe(check)
    // Marks already revealed (reduced motion, no Highlight API) at once.
    requestAnimationFrame(check)
    return unsubscribe
  }, [])
}
