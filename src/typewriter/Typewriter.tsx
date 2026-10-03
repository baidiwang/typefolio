import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { reveal } from '../reveal/controller'
import {
  BELL_PIVOT,
  KNOB_L_PIVOT,
  KNOB_R_PIVOT,
  LAYERS,
  MACHINE,
  PLANT,
  ROLLER,
} from './layers'
import { playBell, playKey, playReturn } from './sound'

/** Carriage travel per typed character, in reference px of the drawing. */
const STEP = 1.4
const MACHINE_H = MACHINE.y1 - MACHINE.y0
/** The machine is centred on its roller, not on its lever-to-knob box. */
const CENTRE_X = (ROLLER.x0 + ROLLER.x1) / 2

type Box = { x: number; y: number; w: number; h: number }

/** Size/place in units of the machine's displayed height, var(--tw-h). */
const u = (n: number) => `calc(var(--tw-h) * ${(n / MACHINE_H).toFixed(5)})`

/** Place a layer by its drawing coordinates, inside the machine box. */
const at = ({ x, y, w, h }: Box): CSSProperties => ({
  left: u(x - MACHINE.x0),
  top: u(y - MACHINE.y0),
  width: u(w),
  height: u(h),
})

/** transform-origin for a pivot point, as % of a layer's box. */
const origin = (p: { x: number; y: number }, b: Box) =>
  `${(((p.x - b.x) / b.w) * 100).toFixed(2)}% ${(((p.y - b.y) / b.h) * 100).toFixed(2)}%`

const MACHINE_STYLE: CSSProperties = {
  width: u(MACHINE.x1 - MACHINE.x0),
  height: 'var(--tw-h)',
  left: `calc(50% - ${u(CENTRE_X - MACHINE.x0)})`,
}

/** The plant stands just right of the machine, at half its height. */
const PLANT_STYLE: CSSProperties = {
  left: `calc(50% + ${u(MACHINE.x1 - CENTRE_X)} + 6px)`,
  height: 'calc(var(--tw-h) * 0.5)',
}

/**
 * The desk scene fixed to the bottom of the viewport: the whole typewriter,
 * drawn from layered images (see docs/typewriter-rig.md), standing on the
 * desk in front of the letter, with a plant beside it. The paper continues
 * behind it. The reveal controller treats the top of this scene
 * (`data-reveal-inset`: the bell's top) as the line where text appears.
 *
 * Motion is imperative, driven by the reveal controller: the carriage
 * slides per character and returns at line end, the knobs turn on each line
 * feed, the bell rings at the end of an element and the plant sways with it.
 * Decorative only (aria-hidden, nothing focusable).
 */
export function Typewriter() {
  const machineRef = useRef<HTMLDivElement>(null)
  const carriageRef = useRef<HTMLDivElement>(null)
  const knobLRef = useRef<HTMLImageElement>(null)
  const knobRRef = useRef<HTMLImageElement>(null)
  const bellRef = useRef<HTMLImageElement>(null)
  const plantRef = useRef<HTMLImageElement>(null)
  /** css px per reference px, from the machine's rendered height. */
  const scaleRef = useRef(1)

  useLayoutEffect(() => {
    const machine = machineRef.current
    if (!machine) return
    const measure = () => {
      scaleRef.current = machine.getBoundingClientRect().height / MACHINE_H
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(machine)
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
    <div className="typewriter" data-reveal-inset="" aria-hidden="true">
      <div ref={machineRef} className="typewriter__machine" style={MACHINE_STYLE}>
        {/* Back to front: body, bell (on the frame, behind the roller), carriage. */}
        <img className="tw-layer" src={LAYERS.body.src} style={at(LAYERS.body)} alt="" />
        <img
          ref={bellRef}
          className="tw-layer"
          src={LAYERS.bell.src}
          style={{ ...at(LAYERS.bell), transformOrigin: origin(BELL_PIVOT, LAYERS.bell) }}
          alt=""
        />
        <div ref={carriageRef} className="tw-carriage">
          <img className="tw-layer" src={LAYERS.carriage.src} style={at(LAYERS.carriage)} alt="" />
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
