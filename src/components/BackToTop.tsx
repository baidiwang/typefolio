const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Tell the typewriter what the lever should do (Typewriter.tsx). */
const lever = (detail: 'hover' | 'leave' | 'throw') =>
  window.dispatchEvent(new CustomEvent('tw:lever', { detail }))

/**
 * The carriage-return lever is a "Back to top" button. It's the last thing
 * in the page (so it's the last stop for the keyboard, after the letter's
 * closing), fixed over the lever drawn on the typewriter (index.css places
 * it from --tw-lever-*, which Typewriter.tsx measures). Hover nudges the
 * lever; a click or Enter throws it, runs the carriage, and scrolls to the
 * top smoothly. Under reduced motion it simply jumps to the top. Where the
 * lever is off the screen (phones), the button isn't shown.
 */
export function BackToTop() {
  return (
    <button
      type="button"
      className="back-to-top"
      aria-label="Back to top"
      onPointerEnter={() => lever('hover')}
      onPointerLeave={() => lever('leave')}
      onFocus={() => lever('hover')}
      onBlur={() => lever('leave')}
      onClick={() => {
        const still = reducedMotion()
        if (!still) lever('throw')
        window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' })
      }}
    />
  )
}
