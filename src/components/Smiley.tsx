import { useLayoutEffect, useRef } from 'react'
import { reveal } from '../reveal/controller'

/**
 * A small pen doodle after the signature: a smiley, drawn loose (the circle
 * runs on past where it started, the eyes and the smile aren't quite
 * level). Same ink and stroke weight as the signature's lettering
 * (--sig-stroke, per face, in index.css).
 *
 * It draws itself right after the signature, as a drawing job in the reveal
 * controller; Typewriter.tsx rings the bell and returns the carriage when
 * it's done. Under reduced motion (or without JS) it's never registered and
 * stays drawn. Decorative, so hidden from assistive tech.
 */
const STROKES = [
  // The face, clockwise from the top, running on past where it started.
  'M42.3 11.6C45.3 12.3 54.8 13.8 60.2 15.8C65.7 17.8 70.3 20.7 74.9 23.9C79.6 27.0 84.6 30.2 88.3 34.8C91.9 39.3 95.9 45.2 96.9 51.1C97.9 56.9 96.9 64.3 94.2 69.7C91.5 75.2 86.0 80.3 80.8 83.8C75.6 87.4 69.1 89.6 63.0 91.0C56.9 92.4 50.4 92.9 44.3 92.2C38.2 91.6 31.6 89.8 26.3 86.9C21.0 84.0 16.1 79.4 12.6 74.6C9.1 69.8 6.7 63.9 5.3 58.1C4.0 52.3 3.4 45.8 4.6 39.7C5.7 33.7 8.1 26.7 12.3 21.7C16.4 16.7 23.1 12.0 29.4 9.9C35.7 7.8 43.8 7.9 50.3 8.9C56.7 9.8 65.3 14.5 68.3 15.6',
  // Eyes: two short downstrokes.
  'M36.2 36.8C36.9 40.2 37.3 43.4 36.8 46.9',
  'M61.4 38.6C62.2 41.2 62.3 43.6 61.7 46.2',
  // The smile, a touch lopsided, with a little flick at its end.
  'M26.4 57.2C30.2 66.8 38.6 73.9 49.2 74.2C58.8 74.5 66.6 69.2 71.6 59.6C72.4 58.1 73.6 56.9 75.4 56.6',
]

/** Nominal time to draw it, before queue compression. */
const DRAW_MS = 650

export function Smiley() {
  const ref = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const paths = [...el.querySelectorAll('path')]
    // One pen, stroke after stroke: each gets its share of the time by length.
    const lengths = paths.map((path) => path.getTotalLength())
    const total = lengths.reduce((a, b) => a + b, 0)
    return reveal.registerDrawing(el, {
      duration: DRAW_MS,
      apply: (progress) => {
        let done = progress * total
        paths.forEach((path, i) => {
          const own = Math.min(1, Math.max(0, done / lengths[i]))
          done -= lengths[i]
          if (progress >= 1) {
            path.style.removeProperty('stroke-dasharray')
            path.style.removeProperty('stroke-dashoffset')
            path.style.removeProperty('visibility')
            return
          }
          // pathLength=1, so the dash offset is "how much is left"; at 0 a
          // round cap would still leave a dot, so hide it entirely.
          path.style.strokeDasharray = '1 2'
          path.style.strokeDashoffset = String(1 - own)
          path.style.visibility = own === 0 ? 'hidden' : ''
        })
      },
    })
  }, [])

  return (
    <span ref={ref} className="smiley" aria-hidden="true">
      <svg viewBox="0 0 100 100" focusable="false">
        {STROKES.map((d) => (
          <path key={d} d={d} pathLength={1} />
        ))}
      </svg>
    </span>
  )
}
