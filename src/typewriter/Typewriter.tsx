import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { reveal } from '../reveal/controller'
import { playBell, playKey, playReturn } from './sound'
import { DESKTOP_VIEWBOX } from './rig'
import { TypewriterRig } from './TypewriterRig'

/** Carriage travel per typed character, in SVG user units. */
const CARRIAGE_STEP = 2.4
const STRIP_QUERY = '(max-width: 639px)'

function subscribeStrip(onChange: () => void) {
  const mql = window.matchMedia(STRIP_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}
const isStripNow = () => window.matchMedia(STRIP_QUERY).matches

/**
 * The typewriter fixed to the bottom of the viewport. The paper (the page)
 * appears to come out of its platen: the reveal controller treats the top of
 * this element (`data-reveal-inset`) as the line where text becomes visible.
 *
 * - Artwork: TypewriterRig (named SVG groups; see docs/typewriter-rig.md).
 * - Motion: subscribes to the reveal controller and moves SVG groups
 *   imperatively. No React state per character.
 * - Decorative only (aria-hidden, nothing focusable): the contact links are
 *   on the paper and the sound toggle is its own button (SoundToggle).
 */
export function Typewriter() {
  const svgRef = useRef<SVGSVGElement>(null)
  const strip = useSyncExternalStore(subscribeStrip, isStripNow, () => false)

  // —— Geometry: the viewBox for this breakpoint ————————————————————————

  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    if (strip) {
      // Thin strip: crop to the top key row plus the lower edge of the platen.
      const keys = unionBBox(svg.querySelectorAll('[data-strip-row]'))
      const platen = svg.querySelector<SVGGraphicsElement>('#platen > rect')?.getBBox()
      const top = platen ? platen.y + platen.height * 0.5 : keys.y - 20
      const pad = 24
      svg.setAttribute(
        'viewBox',
        `${keys.x - pad} ${top} ${keys.width + pad * 2} ${keys.y + keys.height + 14 - top}`,
      )
    } else {
      const { x, y, width, height } = DESKTOP_VIEWBOX
      svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`)
    }
  }, [strip])

  // —— Sync to the reveal controller ——————————————————————————————————————

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const carriage = svg.querySelector<SVGGElement>('#carriage')
    const typebar = svg.querySelector<SVGGElement>('#typebar')
    const bell = svg.querySelector<SVGGElement>('#bell')
    const knobs = [...svg.querySelectorAll<SVGGElement>('[data-knob]')]
    const keys = [...svg.querySelectorAll<SVGGElement>('[data-key]')]

    let knobAngle = 0
    let lastStrike = 0
    let strike: Animation | undefined

    const moveCarriage = (column: number, ms: number, easing = 'linear') => {
      if (!carriage) return
      carriage.style.transition = `transform ${ms}ms ${easing}`
      carriage.style.transform = `translateX(${-column * CARRIAGE_STEP}px)`
    }
    const carriageReturn = () => moveCarriage(0, 260, 'cubic-bezier(0.3, 0.8, 0.2, 1)')
    const lineFeed = () => {
      knobAngle += 24
      for (const knob of knobs) knob.style.transform = `rotate(${knobAngle}deg)`
    }
    const ringBell = () => {
      bell?.animate(
        [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(14deg)' },
          { transform: 'rotate(-10deg)' },
          { transform: 'rotate(0deg)' },
        ],
        { duration: 360, easing: 'ease-out' },
      )
      playBell()
    }

    return reveal.subscribe((event) => {
      switch (event.type) {
        case 'char': {
          moveCarriage(event.column + 1, 45)
          if (event.char.trim() === '') break // space bar: carriage only
          const now = performance.now()
          if (now - lastStrike < 16) break // at most one strike per frame
          lastStrike = now
          strike?.cancel()
          strike = typebar?.animate(
            [
              { transform: 'rotate(0deg)' },
              { transform: 'rotate(-16deg)' },
              { transform: 'rotate(0deg)' },
            ],
            { duration: 90 },
          )
          const key = keys[Math.floor(Math.random() * keys.length)]
          key?.animate(
            [{ transform: 'translateY(0)' }, { transform: 'translateY(4px)' }, { transform: 'translateY(0)' }],
            { duration: 110 },
          )
          playKey()
          break
        }
        case 'return':
          carriageReturn()
          lineFeed()
          playReturn()
          if (event.bell) ringBell()
          break
        case 'feed':
          lineFeed()
          playReturn()
          if (event.bell) ringBell()
          break
        case 'idle':
          carriageReturn()
          break
      }
    })
  }, [])

  return (
    <div className="typewriter" data-reveal-inset="">
      <div className="typewriter__machine">
        <TypewriterRig svgRef={svgRef} />
      </div>
    </div>
  )
}

function unionBBox(nodes: NodeListOf<Element>) {
  let x1 = Infinity
  let y1 = Infinity
  let x2 = -Infinity
  let y2 = -Infinity
  for (const node of nodes) {
    const b = (node as SVGGraphicsElement).getBBox()
    x1 = Math.min(x1, b.x)
    y1 = Math.min(y1, b.y)
    x2 = Math.max(x2, b.x + b.width)
    y2 = Math.max(y2, b.y + b.height)
  }
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }
}
