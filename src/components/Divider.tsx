import { useLayoutEffect, useRef } from 'react'
import { reveal } from '../reveal/controller'

/**
 * Section break: a quick wavy line in red pen. Decorative (sections already
 * have headings), so it's hidden from assistive tech.
 *
 * It draws itself when typing reaches it: the divider is a drawing job in
 * the reveal controller, queued in reading order like the text around it.
 * Under reduced motion (or without JS) it's never registered and stays
 * fully drawn.
 *
 * Three hand-drawn variants (generated once from a seeded wobble, then kept
 * as fixed path data); dividers 4–6 reuse them mirrored, so neighbours never
 * repeat.
 */
const PATHS = [
  'M6 12.3C8.8 11.9 16.3 8 22.8 8.6C29.3 9.1 38.4 17.7 45 17.7C51.6 17.7 56.6 8.8 62.5 8.8C68.5 8.8 74.1 17.4 80.7 17.4C87.3 17.4 95.9 8.9 102.1 8.9C108.4 8.8 112.1 17.4 118.3 17.4C124.4 17.3 132.6 8.5 139.1 8.3C145.6 8.1 151 15.5 157.3 15.4C163.7 15.3 170.3 7.4 177.2 7.4C184 7.3 191.8 14.6 198.4 14.6C205 14.7 211 8.2 216.9 7.7C222.8 7.2 231.1 9.6 234 9.8',
  'M6 10.9C9.4 10.4 19.2 5.4 26.6 5.8C34.1 6.3 42.9 15.3 50.6 15.4C58.3 15.4 64.8 5.9 73 6.1C81.1 6.3 92 17.5 99.5 17.5C106.9 17.5 110.6 6.4 117.5 6.3C124.5 6.1 132.9 16 141.3 16.1C149.8 16.1 160.2 6.4 168 6.7C175.8 7 181.4 18.5 188.3 18.8C195.1 19 201.4 9.7 209 8.8C216.6 8 229.8 10.3 234 10.5',
  'M6 12.6C8.7 12.2 16.9 8.3 22.3 8.7C27.8 9.1 33.4 16.5 38.8 16.3C44.2 16.1 49.5 7 54.8 6.8C60.2 6.6 65.2 14.2 70.9 14.2C76.5 14.2 83.1 6.7 88.5 6.8C93.8 6.9 97.2 14.7 102.9 14.8C108.5 14.9 117 7.8 122.3 7.8C127.6 7.8 129.6 14.8 134.8 14.8C140.1 14.7 148.1 7.1 153.6 7.2C159.1 7.2 162.6 14.9 167.9 15.1C173.2 15.3 179.9 8.8 185.3 8.8C190.8 8.9 195.5 15.1 200.8 15.2C206.2 15.2 212.1 10.2 217.6 9.7C223.1 9.2 231.3 10.5 234 10.5',
]

/** Nominal time to draw one line, before queue compression. */
const DRAW_MS = 480

export function Divider({ variant = 0 }: { variant?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    const path = pathRef.current
    if (!el || !path) return
    return reveal.registerDrawing(el, {
      duration: DRAW_MS,
      // pathLength=1, so the dash offset is simply "how much is left".
      apply: (progress) => {
        if (progress >= 1) {
          path.style.removeProperty('stroke-dasharray')
          path.style.removeProperty('stroke-dashoffset')
          path.style.removeProperty('visibility')
          return
        }
        path.style.strokeDasharray = '1 2'
        path.style.strokeDashoffset = String(1 - progress)
        // At 0 a round cap would still leave a dot: hide it entirely.
        path.style.visibility = progress === 0 ? 'hidden' : ''
      },
    })
  }, [])

  const d = PATHS[variant % PATHS.length]
  const mirrored = Math.floor(variant / PATHS.length) % 2 === 1

  return (
    <div ref={ref} className="divider" aria-hidden="true">
      <svg
        viewBox="0 0 240 24"
        width="240"
        height="24"
        focusable="false"
        className={mirrored ? 'divider__line divider__line--mirrored' : 'divider__line'}
      >
        <path ref={pathRef} d={d} pathLength={1} />
      </svg>
    </div>
  )
}
