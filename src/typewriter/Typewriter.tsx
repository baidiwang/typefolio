import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { reveal } from '../reveal/controller'
import { BELL_PIVOT, LAYERS, PLANT, ROLLER } from './layers'
import { playBell, playKey, playReturn } from './sound'

/** Carriage travel per typed character, in px of the source drawing. */
const STEP = 1
const ROLLER_WIDTH = ROLLER.x1 - ROLLER.x0
/** Plant: gap to the paper and the viewport edge; size limits. */
const PLANT_GAP = 20
const PLANT_MAX_HEIGHT = 420
const PLANT_MIN_WIDTH = 110
/** The bell may move this far right (source px) to clear the text column. */
const BELL_MAX_SHIFT = 30

type Layer = { x: number; y: number; w: number; h: number }

/** Above the roller the paper is in front of the body: cut the body there. */
const BODY_CLIP_TOP = ((ROLLER.top - LAYERS.body.y) / LAYERS.body.h) * 100
/** The bell rings about the foot of its stem. */
const BELL_ORIGIN = `${((BELL_PIVOT.x - LAYERS.bell.x) / LAYERS.bell.w) * 100}% ${
  ((BELL_PIVOT.y - LAYERS.bell.y) / LAYERS.bell.h) * 100
}%`

/** Place a layer by its source-drawing coordinates, scaled by --s. */
const at = ({ x, y, w, h }: Layer): CSSProperties => ({
  left: `calc(var(--s) * ${x}px)`,
  top: `calc(var(--s) * ${y}px)`,
  width: `calc(var(--s) * ${w}px)`,
  height: `calc(var(--s) * ${h}px)`,
})

/**
 * The typewriter fixed to the bottom of the viewport, drawn from layered
 * images (see docs/typewriter-rig.md). The paper (the page) comes out of
 * its roller: the reveal controller treats the top of this element
 * (`data-reveal-inset`) as the line where text becomes visible, and that
 * line is the roller's top edge.
 *
 * - Scale: the drawing is scaled so the roller spans the paper exactly.
 * - Motion: subscribes to the reveal controller and moves the carriage and
 *   bell imperatively. No React state per character.
 * - Decorative only (aria-hidden, nothing focusable).
 */
export function Typewriter() {
  const rootRef = useRef<HTMLDivElement>(null)
  const carriageRef = useRef<HTMLDivElement>(null)
  const rollerRef = useRef<HTMLImageElement>(null)
  const bellRef = useRef<HTMLImageElement>(null)
  const plantRef = useRef<HTMLImageElement>(null)
  const scaleRef = useRef(1)

  // —— Geometry: roller = paper width; plant beside the paper ————————————

  useLayoutEffect(() => {
    const root = rootRef.current
    const paper = document.querySelector<HTMLElement>('.paper')
    if (!root || !paper) return

    const place = () => {
      const r = paper.getBoundingClientRect()
      const s = r.width / ROLLER_WIDTH
      scaleRef.current = s
      root.style.setProperty('--s', String(s))
      root.style.setProperty('--machine-left', `${r.left - ROLLER.x0 * s}px`)
      root.style.setProperty('--machine-top', `${-ROLLER.top * s}px`)
      // The bell stands over the paper's right margin. Nudge it right until
      // it clears the text column, so it never covers a word.
      const textRight = r.right - parseFloat(getComputedStyle(paper).paddingRight)
      const bellLeft = r.left + (LAYERS.bell.x - ROLLER.x0) * s
      const shift = Math.min(Math.max(0, textRight + 6 - bellLeft), BELL_MAX_SHIFT * s)
      root.style.setProperty('--bell-shift', `${shift}px`)

      // How far the bell rises above the roller: the end of the paper and
      // keyboard focus keep clear of it (see .paper / html in index.css).
      document.documentElement.style.setProperty(
        '--typewriter-overhang',
        `${Math.ceil((ROLLER.top - LAYERS.bell.y) * s)}px`,
      )

      // The plant only appears when it fits on the desk beside the paper.
      const space = window.innerWidth - r.right - 2 * PLANT_GAP
      const height = Math.min(
        PLANT_MAX_HEIGHT,
        window.innerHeight * 0.5,
        space / (PLANT.w / PLANT.h),
      )
      root.dataset.plant = space >= PLANT_MIN_WIDTH ? 'on' : 'off'
      root.style.setProperty('--plant-left', `${r.right + PLANT_GAP}px`)
      root.style.setProperty('--plant-height', `${Math.round(height)}px`)
    }

    place()
    const ro = new ResizeObserver(place)
    ro.observe(paper)
    window.addEventListener('resize', place)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', place)
    }
  }, [])

  // —— Sync to the reveal controller ——————————————————————————————————————

  useEffect(() => {
    const carriage = carriageRef.current
    const roller = rollerRef.current
    const bell = bellRef.current
    const plant = plantRef.current

    const moveCarriage = (column: number, ms: number, easing = 'linear') => {
      if (!carriage) return
      carriage.style.transition = `transform ${ms}ms ${easing}`
      carriage.style.transform = `translateX(${-column * STEP * scaleRef.current}px)`
    }
    const carriageReturn = () => moveCarriage(0, 260, 'cubic-bezier(0.3, 0.8, 0.2, 1)')
    // Line feed: the roller gives a small nudge (inner element, so it
    // doesn't fight the carriage's horizontal transform).
    const lineFeed = () => {
      roller?.animate(
        [
          { transform: 'translateY(0)' },
          { transform: `translateY(${1.5 * scaleRef.current}px)` },
          { transform: 'translateY(0)' },
        ],
        { duration: 140, easing: 'ease-out' },
      )
    }
    const ringBell = () => {
      bell?.animate(
        [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(10deg)' },
          { transform: 'rotate(-8deg)' },
          { transform: 'rotate(4deg)' },
          { transform: 'rotate(0deg)' },
        ],
        { duration: 420, easing: 'ease-out' },
      )
      // The plant on the desk feels it too.
      plant?.animate(
        [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(1.4deg)' },
          { transform: 'rotate(-1deg)' },
          { transform: 'rotate(0.4deg)' },
          { transform: 'rotate(0deg)' },
        ],
        { duration: 1200, easing: 'ease-out' },
      )
      playBell()
    }

    return reveal.subscribe((event) => {
      switch (event.type) {
        case 'char':
          moveCarriage(event.column + 1, 45)
          if (event.char.trim() !== '') playKey() // space bar: carriage only
          break
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
    <div ref={rootRef} className="typewriter" data-reveal-inset="" aria-hidden="true">
      <img ref={plantRef} className="desk-plant" src={PLANT.src} alt="" decoding="async" />
      <div className="typewriter__machine">
        {/* Back to front: body, bell (on the frame, behind the roller), carriage. */}
        <img
          className="tw-layer tw-body"
          src={LAYERS.body.src}
          style={{ ...at(LAYERS.body), clipPath: `inset(${BODY_CLIP_TOP}% 0 0 0)` }}
          alt=""
        />
        <img
          ref={bellRef}
          className="tw-layer tw-bell"
          src={LAYERS.bell.src}
          style={{ ...at(LAYERS.bell), transformOrigin: BELL_ORIGIN }}
          alt=""
        />
        <div ref={carriageRef} className="tw-layer tw-carriage" style={at(LAYERS.carriage)}>
          <img ref={rollerRef} src={LAYERS.carriage.src} alt="" />
        </div>
      </div>
    </div>
  )
}
