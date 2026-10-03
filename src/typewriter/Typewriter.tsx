import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { reveal } from '../reveal/controller'
import {
  BELL_PIVOT,
  KNOB_L_PIVOT,
  KNOB_R_PIVOT,
  LAYERS,
  PLANT,
  ROLLER,
  ROLLER_MID,
} from './layers'
import { playBell, playKey, playReturn } from './sound'

/** Carriage travel per typed character, in reference px of the drawing. */
const STEP = 1.4
const BODY = LAYERS.body
/** How far the body reaches below the roller's top edge, in body heights:
 *  the desk strip's height (index.css reads it as --tw-below). */
const BELOW = (BODY.y + BODY.h - ROLLER.top) / BODY.h

type Box = { x: number; y: number; w: number; h: number }

/** Reference px → css, in units of the body's displayed height, --tw-body. */
const u = (n: number) => `calc(var(--tw-body) * ${(n / BODY.h).toFixed(5)})`

/** Place a layer relative to an origin in the drawing; y is always measured
 *  from the roller's top edge (the top of the strip). */
const at = ({ x, y, w, h }: Box, originX: number): CSSProperties => ({
  left: u(x - originX),
  top: u(y - ROLLER.top),
  width: u(w),
  height: u(h),
})

/** transform-origin for a pivot point, as % of a layer's box. */
const origin = (p: { x: number; y: number }, b: Box) =>
  `${(((p.x - b.x) / b.w) * 100).toFixed(2)}% ${(((p.y - b.y) / b.h) * 100).toFixed(2)}%`

/** The roller's middle fills the paper's width between the two end slices. */
const MID_STYLE: CSSProperties = {
  left: `calc(var(--pl) + ${u(ROLLER.seamL - ROLLER.x0)})`,
  width: `calc(var(--pr) - var(--pl) - ${u(ROLLER.seamL - ROLLER.x0)} - ${u(ROLLER.x1 - ROLLER.seamR)})`,
  top: u(ROLLER_MID.y - ROLLER.top),
  height: u(ROLLER_MID.h),
  backgroundImage: `url('${ROLLER_MID.src}')`,
  backgroundSize: `${u(ROLLER_MID.w)} 100%`,
}

/** The plant stands on the desk just right of the body, at half its height. */
const PLANT_STYLE: CSSProperties = {
  left: `calc(var(--pc) + ${u(BODY.x + BODY.w - ROLLER.centreX)} + 6px)`,
  height: 'calc(var(--tw-body) * 0.5)',
}

/**
 * The desk scene fixed to the bottom of the viewport: a wide-carriage
 * typewriter drawn from layered images (see docs/typewriter-rig.md). Its
 * roller spans the paper, and the paper goes into it: below the roller's
 * top edge there's only the desk (this strip) and the machine's body. That
 * edge is where text appears (`data-reveal-inset`).
 *
 * Motion is imperative, driven by the reveal controller: the carriage
 * slides per character and returns at line end, the knobs turn on each line
 * feed, the bell rings at the end of an element and the plant sways with it.
 * Decorative only (aria-hidden, nothing focusable).
 */
export function Typewriter() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLImageElement>(null)
  const carriageRef = useRef<HTMLDivElement>(null)
  const knobLRef = useRef<HTMLImageElement>(null)
  const knobRRef = useRef<HTMLImageElement>(null)
  const bellRef = useRef<HTMLImageElement>(null)
  const plantRef = useRef<HTMLImageElement>(null)
  /** css px per reference px, from the body's rendered height. */
  const scaleRef = useRef(1)

  // The carriage spans the paper: track the paper's edges (--pl, --pr) and
  // centre (--pc), in viewport px.
  useLayoutEffect(() => {
    const scene = sceneRef.current
    const body = bodyRef.current
    const paper = document.querySelector<HTMLElement>('.paper')
    if (!scene || !body || !paper) return
    document.documentElement.style.setProperty('--tw-below', BELOW.toFixed(4))
    const measure = () => {
      const r = paper.getBoundingClientRect()
      scene.style.setProperty('--pl', `${r.left}px`)
      scene.style.setProperty('--pr', `${r.right}px`)
      scene.style.setProperty('--pc', `${(r.left + r.right) / 2}px`)
      scaleRef.current = body.getBoundingClientRect().height / BODY.h
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(paper)
    ro.observe(body)
    ro.observe(document.documentElement)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const carriage = carriageRef.current
    const knobs = [knobLRef.current, knobRRef.current]
    const bell = bellRef.current
    const plant = plantRef.current

    const moveCarriage = (column: number, ms: number, easing = 'linear') => {
      if (!carriage) return
      carriage.style.transition = `transform ${ms}ms ${easing}`
      carriage.style.transform = `translateX(${-column * STEP * scaleRef.current}px)`
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
      {/* Back to front: body and bell (static, centred under the paper),
          then the carriage (slides). Each .tw-origin is a zero-size anchor. */}
      <div className="tw-origin tw-body" style={{ left: 'var(--pc)' }}>
        <img ref={bodyRef} className="tw-layer" src={BODY.src} style={at(BODY, ROLLER.centreX)} alt="" />
        <img
          ref={bellRef}
          className="tw-layer"
          src={LAYERS.bell.src}
          style={{
            ...at(LAYERS.bell, ROLLER.centreX),
            transformOrigin: origin(BELL_PIVOT, LAYERS.bell),
          }}
          alt=""
        />
      </div>
      <div ref={carriageRef} className="tw-carriage">
        <div className="tw-roller-mid" style={MID_STYLE} />
        <div className="tw-origin" style={{ left: 'var(--pl)' }}>
          <img className="tw-layer" src={LAYERS.rollerL.src} style={at(LAYERS.rollerL, ROLLER.x0)} alt="" />
          <img
            ref={knobLRef}
            className="tw-layer"
            src={LAYERS.knobL.src}
            style={{ ...at(LAYERS.knobL, ROLLER.x0), transformOrigin: origin(KNOB_L_PIVOT, LAYERS.knobL) }}
            alt=""
          />
        </div>
        <div className="tw-origin" style={{ left: 'var(--pr)' }}>
          <img className="tw-layer" src={LAYERS.rollerR.src} style={at(LAYERS.rollerR, ROLLER.x1)} alt="" />
          <img
            ref={knobRRef}
            className="tw-layer"
            src={LAYERS.knobR.src}
            style={{ ...at(LAYERS.knobR, ROLLER.x1), transformOrigin: origin(KNOB_R_PIVOT, LAYERS.knobR) }}
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
