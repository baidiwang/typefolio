import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
import { site } from '../content'
import { reveal } from '../reveal/controller'
import { playBell, playKey, playReturn, setSoundEnabled } from './sound'
import { NAV_KEYS, RIG_VIEWBOX, type NavKey } from './rig'
import { TypewriterRig } from './TypewriterRig'

/** Carriage travel per typed character, in SVG user units. */
const CARRIAGE_STEP = 2.4
const STRIP_QUERY = '(max-width: 639px)'

type Box = { left: number; top: number; width: number; height: number }

const NAV_LINKS: Record<NavKey, { label: string; href: string; external: boolean }> = {
  resume: { ...site.links.resume, external: false },
  email: { ...site.links.email, external: false },
  linkedin: { ...site.links.linkedin, external: true },
  github: { ...site.links.github, external: true },
}

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
 * - Nav keycaps: real <a> links positioned over the SVG keys, measured from
 *   the SVG geometry so they follow whatever artwork is dropped in.
 */
export function Typewriter() {
  const svgRef = useRef<SVGSVGElement>(null)
  const machineRef = useRef<HTMLDivElement>(null)
  const [boxes, setBoxes] = useState<Partial<Record<NavKey | 'sound', Box>>>({})
  const [sound, setSound] = useState(false)
  const strip = useSyncExternalStore(subscribeStrip, isStripNow, () => false)

  // —— Geometry: viewBox for this breakpoint, then keycap positions ———————

  const measureKeys = useCallback(() => {
    const svg = svgRef.current
    const machine = machineRef.current
    if (!svg || !machine) return
    const origin = machine.getBoundingClientRect()
    const next: Partial<Record<NavKey | 'sound', Box>> = {}
    for (const el of svg.querySelectorAll<SVGGraphicsElement>('[data-nav-key], [data-ui-key]')) {
      const key = (el.dataset.navKey ?? el.dataset.uiKey) as NavKey | 'sound'
      const r = el.getBoundingClientRect()
      next[key] = {
        left: r.left - origin.left,
        top: r.top - origin.top,
        width: r.width,
        height: r.height,
      }
    }
    setBoxes(next)
  }, [])

  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    if (strip) {
      // Thin strip: crop to the key row plus the lower edge of the platen.
      const keys = unionBBox(svg.querySelectorAll('[data-nav-key], [data-ui-key]'))
      const platen = svg.querySelector<SVGGraphicsElement>('#platen > rect')?.getBBox()
      const top = platen ? platen.y + platen.height * 0.5 : keys.y - 20
      const pad = 24
      svg.setAttribute(
        'viewBox',
        `${keys.x - pad} ${top} ${keys.width + pad * 2} ${keys.y + keys.height + 14 - top}`,
      )
    } else {
      const { x, y, width, height } = RIG_VIEWBOX
      svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`)
    }
    measureKeys()
  }, [strip, measureKeys])

  useLayoutEffect(() => {
    const machine = machineRef.current
    if (!machine) return
    const ro = new ResizeObserver(measureKeys)
    ro.observe(machine)
    return () => ro.disconnect()
  }, [measureKeys])

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

  // —— Keycaps ————————————————————————————————————————————————————————————

  const press = (key: string, down: boolean) => {
    svgRef.current?.querySelector(`[data-nav-key="${key}"], [data-ui-key="${key}"]`)
      ?.classList.toggle('is-pressed', down)
    if (down) playKey()
  }
  const tap = (key: string) => {
    press(key, true)
    window.setTimeout(() => press(key, false), 140)
  }
  const keyProps = (key: string) => ({
    onPointerDown: () => press(key, true),
    onPointerUp: () => press(key, false),
    onPointerLeave: () => press(key, false),
    onPointerCancel: () => press(key, false),
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') tap(key)
    },
  })

  const toggleSound = () => {
    const next = !sound
    setSoundEnabled(next)
    setSound(next)
  }

  const place = (box: Box | undefined): CSSProperties | undefined =>
    box && {
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height,
      fontSize: Math.max(10, Math.min(15, box.height * 0.36)),
    }

  return (
    <div className="typewriter" data-reveal-inset="">
      <div className="typewriter__machine" ref={machineRef}>
        <TypewriterRig svgRef={svgRef} />

        <nav className="typewriter__keys" aria-label="Quick links">
          {NAV_KEYS.map((key) => {
            const link = NAV_LINKS[key]
            const box = boxes[key]
            if (!box) return null
            return (
              <a
                key={key}
                className="keycap"
                style={place(box)}
                href={link.href}
                {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                {...keyProps(key)}
              >
                {link.label}
                {link.external && <span className="visually-hidden"> (opens in a new tab)</span>}
              </a>
            )
          })}
        </nav>

        {boxes.sound && (
          <button
            type="button"
            className="keycap keycap--round"
            style={place(boxes.sound)}
            aria-pressed={sound}
            aria-label="Typewriter sound"
            title={sound ? 'Sound on' : 'Sound off'}
            onClick={toggleSound}
            {...keyProps('sound')}
          >
            <span aria-hidden="true">♪</span>
          </button>
        )}
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
