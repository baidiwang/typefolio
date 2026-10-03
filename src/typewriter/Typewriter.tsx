import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { reveal } from '../reveal/controller'
import {
  BELL_PIVOT,
  BODY,
  KNOB_L_PIVOT,
  KNOB_R_PIVOT,
  LAYERS,
  MACHINE,
  NOTCH,
  PLANT,
} from './layers'
import { playBell, playKey, playReturn } from './sound'

/** Carriage travel per typed character, in reference px of the drawing. */
const STEP = 0.5
const BODY_W = BODY.x1 - BODY.x0
/** The plant stands at about 40% of the machine's height. */
const PLANT_H = 0.4 * (MACHINE.y1 - MACHINE.y0)

type Box = { x: number; y: number; w: number; h: number }

/** Reference px → css px: --tw-s is css px per reference px, set from the
 *  paper's width so the body matches it. */
const u = (n: number) => `calc(var(--tw-s) * ${n.toFixed(2)} * 1px)`

/** Place a layer relative to the body's top-left corner (the strip's top
 *  edge at the paper's left edge), or relative to another box. */
const at = ({ x, y, w, h }: Box, ox: number = BODY.x0, oy: number = BODY.top): CSSProperties => ({
  left: u(x - ox),
  top: u(y - oy),
  width: u(w),
  height: u(h),
})

/** transform-origin for a pivot point, as % of a layer's box. */
const origin = (p: { x: number; y: number }, b: Box) =>
  `${(((p.x - b.x) / b.w) * 100).toFixed(2)}% ${(((p.y - b.y) / b.h) * 100).toFixed(2)}%`

const NOTCH_BOX = { x: NOTCH.x0, y: NOTCH.y0, w: NOTCH.x1 - NOTCH.x0, h: NOTCH.y1 - NOTCH.y0 }

const PLANT_STYLE: CSSProperties = {
  left: `calc(var(--pl) + ${u(MACHINE.x1 - BODY.x0)} + 8px)`,
  height: u(PLANT_H),
}

/**
 * The desk scene fixed to the bottom of the viewport: a wide, low
 * typewriter drawn from layered images (see docs/typewriter-rig.md). Its
 * body is exactly as wide as the paper, and the paper disappears behind
 * the body's top edge: below it there's only the desk (this strip) and the
 * machine. That edge is where text appears (`data-reveal-inset`).
 *
 * Motion is imperative, driven by the reveal controller: the roller slides
 * (with the lever, axles and knobs) per character and returns at line end,
 * the knobs turn on each line feed, the bell rings at the end of an element
 * and the plant sways with it. Decorative only (aria-hidden, nothing
 * focusable).
 */
export function Typewriter() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const rollerRef = useRef<HTMLImageElement>(null)
  const carriageRef = useRef<HTMLDivElement>(null)
  const knobLRef = useRef<HTMLImageElement>(null)
  const knobRRef = useRef<HTMLImageElement>(null)
  const bellRef = useRef<HTMLImageElement>(null)
  const plantRef = useRef<HTMLImageElement>(null)
  /** css px per reference px. */
  const scaleRef = useRef(1)

  // Scale the machine to the paper: track the paper's edges (--pl, --pr)
  // and set --tw-s; hide the plant where it doesn't fit beside the machine.
  useLayoutEffect(() => {
    const scene = sceneRef.current
    const plant = plantRef.current
    const paper = document.querySelector<HTMLElement>('.paper')
    if (!scene || !plant || !paper) return
    const root = document.documentElement.style
    root.setProperty('--tw-aspect', (BODY_W / (BODY.keyboardBottom - BODY.top)).toFixed(4))
    root.setProperty('--tw-rows-desk', String(BODY.keyboardBottom - BODY.top))
    root.setProperty('--tw-rows-phone', String(BODY.bottom - BODY.top))
    const measure = () => {
      const r = paper.getBoundingClientRect()
      const s = r.width / BODY_W
      scaleRef.current = s
      root.setProperty('--tw-s', s.toFixed(5))
      scene.style.setProperty('--pl', `${r.left}px`)
      scene.style.setProperty('--pr', `${r.right}px`)
      const plantW = (PLANT_H * s * PLANT.w) / PLANT.h
      const plantRight = r.left + (MACHINE.x1 - BODY.x0) * s + 8 + plantW
      scene.dataset.plant = plantRight <= document.documentElement.clientWidth - 8 ? 'on' : 'off'
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(paper)
    ro.observe(document.documentElement)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const moving = [rollerRef.current, carriageRef.current]
    const knobs = [knobLRef.current, knobRRef.current]
    const bell = bellRef.current
    const plant = plantRef.current

    const moveCarriage = (column: number, ms: number, easing = 'linear') => {
      for (const el of moving) {
        if (!el) continue
        el.style.transition = `transform ${ms}ms ${easing}`
        el.style.transform = `translateX(${-column * STEP * scaleRef.current}px)`
      }
    }
    const carriageReturn = () => moveCarriage(0, 260, 'cubic-bezier(0.3, 0.8, 0.2, 1)')
    // Line feed: the platen knobs turn a notch.
    const lineFeed = () => {
      for (const knob of knobs) {
        knob?.animate(
          [
            { transform: 'rotate(0deg)' },
            { transform: 'rotate(-14deg)' },
            { transform: 'rotate(3deg)' },
            { transform: 'rotate(0deg)' },
          ],
          { duration: 220, easing: 'ease-out' },
        )
      }
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
          { transform: 'rotate(2deg)' },
          { transform: 'rotate(-1.4deg)' },
          { transform: 'rotate(0.5deg)' },
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
    <div ref={sceneRef} className="typewriter" data-reveal-inset="" aria-hidden="true">
      {/* A zero-size anchor at the body's top-left corner. Back to front:
          the roller (clipped to the notch between the shoulders), the body,
          the bell, then the lever, axle and knobs. */}
      <div className="tw-origin">
        <div className="tw-notch" style={at(NOTCH_BOX)}>
          <img
            ref={rollerRef}
            className="tw-layer"
            src={LAYERS.roller.src}
            style={at(LAYERS.roller, NOTCH.x0, NOTCH.y0)}
            alt=""
          />
        </div>
        <img className="tw-layer" src={LAYERS.body.src} style={at(LAYERS.body)} alt="" />
        <img
          ref={bellRef}
          className="tw-layer"
          src={LAYERS.bell.src}
          style={{ ...at(LAYERS.bell), transformOrigin: origin(BELL_PIVOT, LAYERS.bell) }}
          alt=""
        />
        <div ref={carriageRef} className="tw-carriage">
          <img className="tw-layer" src={LAYERS.lever.src} style={at(LAYERS.lever)} alt="" />
          <img className="tw-layer" src={LAYERS.axleR.src} style={at(LAYERS.axleR)} alt="" />
          <img
            ref={knobLRef}
            className="tw-layer"
            src={LAYERS.knobL.src}
            style={{ ...at(LAYERS.knobL), transformOrigin: origin(KNOB_L_PIVOT, LAYERS.knobL) }}
            alt=""
          />
          <img
            ref={knobRRef}
            className="tw-layer"
            src={LAYERS.knobR.src}
            style={{ ...at(LAYERS.knobR), transformOrigin: origin(KNOB_R_PIVOT, LAYERS.knobR) }}
            alt=""
          />
        </div>
      </div>
      <img
        ref={plantRef}
        className="desk-plant"
        src={PLANT.src}
        style={PLANT_STYLE}
        alt=""
        decoding="async"
      />
    </div>
  )
}
