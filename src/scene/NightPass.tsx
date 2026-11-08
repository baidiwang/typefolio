import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import type { Ref } from 'react'
import type { WindowProject } from './projects'
import { windows, windowOrder } from './projects'
import { RoomArtwork } from './RoomArtwork'
import { WindowReading } from './CaseStudy'
import { createVisitMotion } from './visitMotion'
import './night-pass.css'

type Phase = 'arriving' | 'idle' | 'scanning' | 'opening' | 'open' | 'resetting'
export type NightPassHandle = { freeze: () => DOMRect }
type Snapshot = {
  bounds: DOMRect
  turn: string
  transform: string
  opacity: string
  clipPath: string
}
const easing = 'cubic-bezier(0.16, 1, 0.3, 1)'

export function NightPass({
  selected,
  motion = true,
  origin,
  entryDirection = 0,
  onDismiss,
  ref,
}: {
  selected: WindowProject
  motion?: boolean
  origin?: () => DOMRect | undefined
  entryDirection?: number
  onDismiss: () => void
  ref?: Ref<NightPassHandle>
}) {
  const [phase, setPhase] = useState<Phase>('arriving')
  const [sourceWindow] = useState(() => origin)
  const stage = useRef<HTMLDivElement>(null),
    arrival = useRef<HTMLDivElement>(null),
    card = useRef<HTMLDivElement>(null),
    inner = useRef<HTMLDivElement>(null),
    front = useRef<HTMLButtonElement>(null),
    scroll = useRef<HTMLDivElement>(null)
  const departing = useRef(false)
  const [frozen, setFrozen] = useState(false)
  const transitions = useRef<ReturnType<typeof createVisitMotion> | null>(null),
    enabled = useRef(motion),
    previous = useRef<Snapshot | null>(null),
    returning = useRef(false),
    handledDeep = useRef(''),
    pendingDeep = useRef(''),
    scanFrom = useRef(0),
    suppressClick = useRef(false),
    gesture = useRef<{
      x: number
      y: number
      dx: number
      moved: boolean
    } | null>(null)
  const reading = phase === 'opening' || phase === 'open'
  useLayoutEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const manager = createVisitMotion({
      hidden: () => document.hidden,
      reduced: () => !enabled.current || media.matches,
    })
    transitions.current = manager
    const sync = () => {
      if (document.hidden && gesture.current) {
        gesture.current = null
        suppressClick.current = true
        card.current?.style.removeProperty('--drag')
      }
      manager.sync()
    }
    document.addEventListener('visibilitychange', sync)
    media.addEventListener('change', sync)
    return () => {
      manager.cancel()
      transitions.current = null
      document.removeEventListener('visibilitychange', sync)
      media.removeEventListener('change', sync)
    }
  }, [])
  useLayoutEffect(() => {
    enabled.current = motion
    transitions.current?.sync()
  }, [motion])
  useImperativeHandle(
    ref,
    () => ({
      freeze() {
        departing.current = true
        gesture.current = null
        const nodes = [
          arrival.current!,
          card.current!,
          inner.current!,
          scroll.current!,
        ]
        const styles = nodes.map((node) => {
          const style = getComputedStyle(node)
          return {
            transform: style.transform,
            opacity: style.opacity,
            clipPath: style.clipPath,
          }
        })
        const bounds = card.current!.getBoundingClientRect()
        transitions.current?.cancel()
        nodes.forEach((node, i) => Object.assign(node.style, styles[i]))
        scroll
          .current!.querySelectorAll('video')
          .forEach((video) => video.pause())
        setFrozen(true)
        return bounds
      },
    }),
    [],
  )
  const remember = () => {
    const bodyStyle = getComputedStyle(scroll.current!),
      outerStyle = getComputedStyle(card.current!)
    previous.current = {
      bounds: card.current!.getBoundingClientRect(),
      turn: getComputedStyle(inner.current!).transform,
      transform: outerStyle.transform,
      opacity: bodyStyle.opacity,
      clipPath: bodyStyle.clipPath,
    }
    transitions.current?.cancel()
  }
  const startScan = (translation = 0) => {
    if (phase !== 'idle') return
    scanFrom.current = translation
    returning.current = false
    setPhase('scanning')
  }
  const escape = useEffectEvent((event: KeyboardEvent) => {
    if (
      event.key !== 'Escape' ||
      event.defaultPrevented ||
      document.fullscreenElement ||
      (event.target as HTMLElement)?.tagName === 'SELECT'
    )
      return
    event.preventDefault()
    onDismiss()
  })
  useEffect(() => {
    const handle = (event: KeyboardEvent) => escape(event)
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [])
  useLayoutEffect(() => {
    if (departing.current) return
    const outer = card.current!,
      body = scroll.current!
    const animate = (
      el: HTMLElement,
      frames: Keyframe[],
      duration: number,
      complete?: () => void,
      delay = 0,
      curve = easing,
    ) => {
      const animation = el.animate(frames, {
        duration,
        delay,
        easing: curve,
        fill: 'both',
      })
      transitions.current!.track(animation, () => {
        const end = frames[frames.length - 1]
        for (const key of ['transform', 'opacity', 'clipPath'] as const) {
          const value = end[key]
          if (typeof value === 'number' || typeof value === 'string')
            el.style[key] = String(value)
        }
        complete?.()
      })
    }
    if (phase === 'arriving') {
      body.style.opacity = '0'
      body.style.clipPath = 'inset(0 0 100% 0)'
      arrival.current!.style.opacity = '0'
      // Parent opens its native dialog in layout; measure on the next frame.
      const frame = requestAnimationFrame(() => {
        if (departing.current) return
        const target = outer.getBoundingClientRect(),
          source = sourceWindow?.()
        const visible =
          source &&
          source.width > 0 &&
          source.right > 0 &&
          source.left < innerWidth &&
          source.bottom > 0 &&
          source.top < innerHeight
        const x = entryDirection
            ? entryDirection * Math.min(innerWidth * 0.4, 320)
            : visible
              ? source.left + source.width / 2 - target.left - target.width / 2
              : 0,
          y = entryDirection
            ? 0
            : visible
              ? source.top + source.height / 2 - target.top - target.height / 2
              : 44,
          scale = entryDirection
            ? 0.96
            : visible
              ? Math.min(0.48, Math.max(0.2, source.width / target.width))
              : 0.88
        animate(
          arrival.current!,
          [
            {
              transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${entryDirection ? 0 : -6}deg)`,
              opacity: 0,
            },
            { opacity: 1, offset: 0.45 },
            { transform: 'none', opacity: 1 },
          ],
          entryDirection ? 360 : 520,
          () => setPhase('idle'),
        )
      })
      return () => cancelAnimationFrame(frame)
    }
    if (phase === 'open') {
      scroll.current?.focus({ preventScroll: true })
      return
    }
    if (phase === 'idle') {
      outer.style.removeProperty('transform')
      outer.style.removeProperty('--drag')
      if (returning.current) {
        returning.current = false
        body.scrollTo(0, 0)
      }
      front.current?.focus({ preventScroll: true })
      return
    }
    if (phase === 'scanning') {
      const travel = Math.min(148, stage.current!.clientWidth * 0.24)
      const punch = front.current!.querySelector<HTMLElement>('.is-punched')!
      animate(
        punch,
        [
          { transform: 'scale(.7)', opacity: 0.4 },
          { transform: 'scale(1.8)', opacity: 1, offset: 0.55 },
          { transform: 'none', opacity: 1 },
        ],
        240,
        undefined,
        200,
      )
      animate(
        outer,
        [
          { transform: `translateX(${scanFrom.current}px)` },
          {
            transform: `translateX(${Math.max(travel, scanFrom.current + 24)}px)`,
          },
        ],
        440,
        () => {
          remember()
          outer.style.removeProperty('--drag')
          setPhase('opening')
        },
        0,
        'cubic-bezier(.25,.1,.25,1)',
      )
      return
    }
    const source = previous.current
    if (!source) return
    if (phase === 'resetting') {
      animate(
        outer,
        [{ transform: source.transform }, { transform: 'none' }],
        200,
        () => setPhase('idle'),
      )
      return
    }
    outer.style.transform = 'none'
    const target = outer.getBoundingClientRect(),
      from = source.bounds,
      duration = 620
    // Acknowledged scan → same card turns/expands → its ink reveals inside it.
    animate(
      inner.current!,
      [
        { transform: source.turn === 'none' ? 'rotateY(0deg)' : source.turn },
        { transform: 'rotateY(-180deg)' },
      ],
      duration,
    )
    animate(
      body,
      [
        { opacity: 0, clipPath: 'inset(0 0 100% 0)' },
        { opacity: 1, clipPath: 'inset(0)' },
      ],
      320,
      undefined,
      240,
    )
    animate(
      outer,
      [
        {
          transform: `translate(${from.left - target.left}px, ${from.top - target.top}px) scale(${from.width / target.width}, ${from.height / target.height})`,
        },
        { transform: 'none' },
      ],
      duration,
      () => setPhase('open'),
    )
  }, [phase, sourceWindow, entryDirection])
  useEffect(() => {
    const deep = () => {
      if (departing.current) return
      const project = selected.projects.find(
        (p) => `#${p.id}` === location.hash,
      )
      if (!project || project.id === selected.id) return
      if (phase === 'idle' && handledDeep.current !== location.hash) {
        handledDeep.current = location.hash
        pendingDeep.current = project.id
        scanFrom.current = 0
        returning.current = false
        setPhase('scanning')
      } else if (
        phase === 'open' &&
        (pendingDeep.current || handledDeep.current !== location.hash)
      ) {
        handledDeep.current = location.hash
        pendingDeep.current = ''
        const node = scroll.current?.querySelector<HTMLElement>(
          `#case-${project.id}`,
        )
        if (node)
          scroll.current!.scrollTo({
            top: node.offsetTop - 24,
            behavior: 'instant',
          })
      }
    }
    deep()
    window.addEventListener('hashchange', deep)
    return () => window.removeEventListener('hashchange', deep)
  }, [phase, selected])
  const index = windows.indexOf(selected),
    code = ['G', 'L', 'X', 'P', 'A', 'D'][index]
  return (
    <div
      className={`night-pass-stage phase-${phase}`}
      data-phase={phase}
      ref={stage}
      inert={frozen}
    >
      <div className="night-reader-slot" aria-hidden="true">
        <i />
      </div>
      <div className="night-card-arrival" ref={arrival}>
        <div
          className={`night-card ${reading ? 'has-reading' : ''}`}
          ref={card}
          aria-busy={phase !== 'idle' && phase !== 'open'}
        >
          <div className="night-card-inner" ref={inner}>
            <button
              ref={front}
              className={`pass-front ${selected.title.length > 20 ? 'has-long-title' : ''}`}
              inert={phase !== 'idle'}
              aria-label={`Swipe or click to open ${selected.title}`}
              aria-expanded={reading}
              aria-controls="pass-content"
              onClick={(event) => {
                if (event.detail === 0 || !suppressClick.current) startScan()
              }}
              onPointerDown={(event) => {
                if (phase !== 'idle') return
                suppressClick.current = false
                gesture.current = {
                  x: event.clientX,
                  y: event.clientY,
                  dx: 0,
                  moved: false,
                }
                event.currentTarget.setPointerCapture(event.pointerId)
              }}
              onPointerMove={(event) => {
                const g = gesture.current
                if (!g) return
                const dx = event.clientX - g.x,
                  dy = event.clientY - g.y
                g.moved ||= Math.hypot(dx, dy) > 8
                g.dx =
                  Math.abs(dy) < Math.max(32, Math.abs(dx))
                    ? Math.max(-30, Math.min(160, dx))
                    : 0
                card.current!.style.setProperty('--drag', `${g.dx}px`)
              }}
              onPointerUp={() => {
                const g = gesture.current
                gesture.current = null
                if (!g) return
                suppressClick.current = g.moved
                if (g.dx >= Math.min(95, stage.current!.clientWidth * 0.2))
                  startScan(g.dx)
                else if (g.moved && g.dx) {
                  remember()
                  returning.current = true
                  setPhase('resetting')
                } else card.current!.style.removeProperty('--drag')
              }}
              onPointerCancel={() => {
                if (phase !== 'idle' || !gesture.current) return
                gesture.current = null
                suppressClick.current = true
                remember()
                returning.current = true
                setPhase('resetting')
              }}
            >
              <span className="pass-front-heading">
                <span className="night-pass-code" aria-hidden="true">
                  {code}
                </span>
                <span className="night-pass-room">
                  <RoomArtwork entry={selected} />
                </span>
              </span>
              <span className="pass-front-copy">
                <span className="night-pass-title">{selected.title}</span>
                <span className="night-pass-description">
                  {selected.description}
                </span>
              </span>
              <span className="night-pass-stripe">
                <span className="pass-punches" aria-hidden="true">
                  {windowOrder.map((i) => (
                    <i key={i} className={i === index ? 'is-punched' : ''} />
                  ))}
                </span>
                <span className="pass-open-action">
                  Swipe card
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 12h18M15 6l6 6-6 6" />
                  </svg>
                </span>
              </span>
            </button>
            <section
              className="pass-back"
              inert={phase !== 'open'}
              aria-labelledby="pass-reading-title"
              aria-hidden={!reading}
            >
              <div
                id="pass-content"
                className="pass-card-content"
                ref={scroll}
                tabIndex={-1}
              >
                <WindowReading
                  selected={selected}
                  motion={false}
                  headingId="pass-reading-title"
                />
              </div>
              <div className="pass-back-stripe" aria-hidden="true">
                <span className="pass-punches">
                  {windowOrder.map((i) => (
                    <i key={i} className={i === index ? 'is-punched' : ''} />
                  ))}
                </span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
