import { useEffect } from 'react'

/**
 * Content renders client-side, so the browser's own jump to `#id` on load
 * happens before the target exists. Scroll to it manually once fonts have
 * loaded (font metrics can move the target).
 */
export function useHashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id) return
    let cancelled = false
    document.fonts.ready.then(() => {
      if (cancelled) return
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ block: 'start' })
      })
    })
    return () => {
      cancelled = true
    }
  }, [])
}
