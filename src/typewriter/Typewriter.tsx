import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
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
  PLANT_FOLIAGE,
  PLANT_POT,
  STEM_PIVOT,
} from './layers'
import { playBell, playKey, playReturn, setSoundEnabled } from './sound'

/** Carriage travel per typed character, in reference px of the drawing. */
const STEP = 0.5
/** On desktop the body and roller are drawn 10% wider than the drawing
 *  (--tw-sx in index.css), so the paper, which matches the body, is wider.
 *  Small parts (bell, lever, axle, knobs) keep their proportions and only
 *  move outwards with it. Phones keep the drawing's proportions. */
const BODY_W = BODY.x1 - BODY.x0
/** The plant is as tall as the visible typewriter (its top to the bottom
 *  of the keyboard frame). */
const PLANT_H = BODY.keyboardBottom - MACHINE.y0
const PLANT_W = (PLANT_H * PLANT.w) / PLANT.h
/** Whether the reader has used the bell yet (hides the "ring for sound"
 *  note). Per browser; the page works the same without storage. */
const USED_KEY = 'typefolio:sound-used'

type Box = { x: number; y: number; w: number; h: number }

/** Reference px → css px: --tw-s is css px per reference px, set from the
 *  paper's width so the (stretched) body matches it. */
const u = (n: number) => `calc(var(--tw-s) * ${n.toFixed(2)} * 1px)`
/** css px for `a` reference px stretched by --tw-sx, plus `b` unstretched. */
const ux = (a: number, b = 0) =>
  `calc(var(--tw-s) * (${a.toFixed(2)} * var(--tw-sx) + ${b.toFixed(2)}) * 1px)`

/** A stretched layer (body, roller), from the body's left edge (or `ox`). */
const stretched = ({ x, y, w, h }: Box, ox: number = BODY.x0, oy: number = BODY.top): CSSProperties => ({
  left: ux(x - ox),
  top: u(y - oy),
  width: ux(w),
  height: u(h),
})

/** Where each axle meets the body: the side groups hang off these columns,
 *  so the axles stay attached however the body is stretched. */
const ANCHOR = { left: 289, right: 1250 } as const

/** A small part: keeps its proportions and its distance from its side's
 *  anchor (the lever and left knob on the left; the right axle, knob and
 *  bell on the right), so each group stays together. */
const part = ({ x, y, w, h }: Box, side: 'left' | 'right'): CSSProperties => ({
  left: ux(ANCHOR[side] - BODY.x0, x - ANCHOR[side]),
  top: u(y - BODY.top),
  width: u(w),
  height: u(h),
})

/** transform-origin for a pivot point, as % of a layer's box. */
const origin = (p: { x: number; y: number }, b: Box) =>
  `${(((p.x - b.x) / b.w) * 100).toFixed(2)}% ${(((p.y - b.y) / b.h) * 100).toFixed(2)}%`

/** A plant layer, as % of the whole plant's box. */
const inPlant = ({ x, y, w, h }: Box): CSSProperties => ({
  left: `${(((x - PLANT.x) / PLANT.w) * 100).toFixed(2)}%`,
  top: `${(((y - PLANT.y) / PLANT.h) * 100).toFixed(2)}%`,
  width: `${((w / PLANT.w) * 100).toFixed(2)}%`,
  height: `${((h / PLANT.h) * 100).toFixed(2)}%`,
})

const NOTCH_BOX = { x: NOTCH.x0, y: NOTCH.y0, w: NOTCH.x1 - NOTCH.x0, h: NOTCH.y1 - NOTCH.y0 }
const KNOB_R = LAYERS.knobR
/** Right edge of the machine (the right knob), from the body's left edge:
 *  stretched part + unstretched part. */
const MACHINE_RIGHT: [number, number] = [
  ANCHOR.right - BODY.x0,
  KNOB_R.x + KNOB_R.w - ANCHOR.right,
]
const BELL = LAYERS.bell
/** The bell's centre, likewise. */
const BELL_CX: [number, number] = [ANCHOR.right - BODY.x0, BELL.x + BELL.w / 2 - ANCHOR.right]

const PLANT_STYLE: CSSProperties = {
  left: `calc(${ux(...MACHINE_RIGHT)} + 10px)`,
  top: u(MACHINE.y0 - BODY.top),
  width: u(PLANT_W),
  height: u(PLANT_H),
}

const BELL_BUTTON_STYLE: CSSProperties = {
  left: ux(...BELL_CX),
  top: u(BELL.y + BELL.h / 2 - BODY.top),
}

/** The note sits on the desk to the right of the paper, above the bell. */
const NOTE_STYLE: CSSProperties = {
  left: `calc(${ux(...BELL_CX)} + 18px)`,
  top: `calc(${u(BELL.y - BODY.top)} - 64px)`,
}

function storedUsed(): boolean {
  try {
    return localStorage.getItem(USED_KEY) === '1'
  } catch {
    return false
  }
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * The desk scene fixed to the bottom of the viewport: a wide, low
 * typewriter drawn from layered images (see docs/typewriter-rig.md). Its
 * body is exactly as wide as the paper, and the paper disappears behind
 * the body's top edge: below it there's only the desk (this strip) and the
 * machine. That edge is where text appears (`data-reveal-inset`).
 *
 * Motion is imperative, driven by the reveal controller: the roller slides
 * (with the lever, axle and knobs) per character and returns at line end,
 * the knobs turn on each line feed, the bell rings at the end of an element
 * and the plant's foliage sways with it.
 *
 * The bell is the sound toggle (a real button). Until it's first used, a
 * red-pen note beside it says "ring for sound" (where there's room on the
 * desk), and it gives one small wiggle when the intro finishes typing.
 * Everything else is decorative (empty alt, nothing else focusable).
 */
export function Typewriter() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const rollerRef = useRef<HTMLImageElement>(null)
  const carriageRef = useRef<HTMLDivElement>(null)
  const knobLRef = useRef<HTMLImageElement>(null)
  const knobRRef = useRef<HTMLImageElement>(null)
  const bellRef = useRef<HTMLImageElement>(null)
  const foliageRef = useRef<HTMLImageElement>(null)
  /** css px per reference px. */
  const scaleRef = useRef(1)
  const [soundOn, setSoundOn] = useState(false)
  const [used, setUsed] = useState(storedUsed)

  // Scale the machine to the paper: track the paper's left edge (--pl) and
  // set --tw-s; hide the plant and the note where they don't fit.
  useLayoutEffect(() => {
    const scene = sceneRef.current
    const paper = document.querySelector<HTMLElement>('.paper')
    if (!scene || !paper) return
    const root = document.documentElement.style
    root.setProperty('--tw-aspect', (BODY_W / (BODY.keyboardBottom - BODY.top)).toFixed(4))
    root.setProperty('--tw-rows-desk', String(BODY.keyboardBottom - BODY.top))
    root.setProperty('--tw-rows-phone', String(BODY.bottom - BODY.top))
    const measure = () => {
      const sx = parseFloat(getComputedStyle(scene).getPropertyValue('--tw-sx')) || 1
      const r = paper.getBoundingClientRect()
      const s = r.width / (BODY_W * sx)
      scaleRef.current = s
      root.setProperty('--tw-s', s.toFixed(5))
      scene.style.setProperty('--pl', `${r.left}px`)
      const room = document.documentElement.clientWidth - 8
      const machineRight = (MACHINE_RIGHT[0] * sx + MACHINE_RIGHT[1]) * s
      scene.dataset.plant = r.left + machineRight + 10 + PLANT_W * s <= room ? 'on' : 'off'
      // The note needs about 150 px of desk right of the paper.
      const bellX = (BELL_CX[0] * sx + BELL_CX[1]) * s
      scene.dataset.note = r.left + bellX + 18 + 150 <= room ? 'on' : 'off'
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
    const foliage = foliageRef.current

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
      animateBell(bell, 10)
      swayPlant(foliage)
      playBell()
    }

    // One small wiggle when the intro has finished typing, so the bell
    // reads as something to touch.
    const intro = document.querySelector('.intro')
    const stopWiggle =
      intro && !reducedMotion()
        ? reveal.whenDone(intro, () => {
            if (!storedUsed()) animateBell(bell, 6, 700)
          })
        : undefined

    const unsubscribe = reveal.subscribe((event) => {
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
    return () => {
      stopWiggle?.()
      unsubscribe()
    }
  }, [])

  const toggleSound = () => {
    const next = !soundOn
    setSoundEnabled(next)
    setSoundOn(next)
    if (next) {
      playBell()
      if (!reducedMotion()) {
        animateBell(bellRef.current, 10)
        swayPlant(foliageRef.current)
      }
    }
    if (!used) {
      setUsed(true)
      try {
        localStorage.setItem(USED_KEY, '1')
      } catch {
        // Storage unavailable: the note just comes back next visit.
      }
    }
  }

  return (
    <div ref={sceneRef} className="typewriter" data-reveal-inset="">
      {/* A zero-size anchor at the body's top-left corner. Back to front:
          the roller (clipped to the notch between the shoulders), the body,
          the lever, axle and knobs, then the bell (a button). */}
      <div className="tw-origin">
        <div className="tw-notch" style={stretched(NOTCH_BOX)}>
          <img
            ref={rollerRef}
            className="tw-layer"
            src={LAYERS.roller.src}
            style={stretched(LAYERS.roller, NOTCH.x0, NOTCH.y0)}
            alt=""
          />
        </div>
        <img className="tw-layer" src={LAYERS.body.src} style={stretched(LAYERS.body)} alt="" />
        <div ref={carriageRef} className="tw-carriage">
          <img className="tw-layer" src={LAYERS.lever.src} style={part(LAYERS.lever, 'left')} alt="" />
          <img className="tw-layer" src={LAYERS.axleR.src} style={part(LAYERS.axleR, 'right')} alt="" />
          <img
            ref={knobLRef}
            className="tw-layer"
            src={LAYERS.knobL.src}
            style={{ ...part(LAYERS.knobL, 'left'), transformOrigin: origin(KNOB_L_PIVOT, LAYERS.knobL) }}
            alt=""
          />
          <img
            ref={knobRRef}
            className="tw-layer"
            src={LAYERS.knobR.src}
            style={{ ...part(KNOB_R, 'right'), transformOrigin: origin(KNOB_R_PIVOT, KNOB_R) }}
            alt=""
          />
        </div>
        <button
          type="button"
          className="tw-bell"
          style={BELL_BUTTON_STYLE}
          aria-label="Sound"
          aria-pressed={soundOn}
          title={soundOn ? 'Sound on' : 'Sound off'}
          onClick={toggleSound}
        >
          <img
            ref={bellRef}
            src={BELL.src}
            style={{
              width: u(BELL.w),
              height: u(BELL.h),
              transformOrigin: origin(BELL_PIVOT, BELL),
            }}
            alt=""
          />
        </button>
        {!used && (
          <div className="tw-note" style={NOTE_STYLE} aria-hidden="true">
            <span className="tw-note__text">ring for sound</span>
            <svg className="tw-note__arrow" viewBox="0 0 60 50" focusable="false">
              <path d="M52 6C40 10 22 18 12 38" />
              <path d="M5 30L12 39L20 33" />
            </svg>
          </div>
        )}
        <div className="desk-plant" style={PLANT_STYLE} aria-hidden="true">
          <img className="tw-layer" src={PLANT_POT.src} style={inPlant(PLANT_POT)} alt="" />
          <div
            className="plant-sway"
            style={{ ...inPlant(PLANT_FOLIAGE), transformOrigin: origin(STEM_PIVOT, PLANT_FOLIAGE) }}
          >
            <img
              ref={foliageRef}
              src={PLANT_FOLIAGE.src}
              style={{ transformOrigin: origin(STEM_PIVOT, PLANT_FOLIAGE) }}
              alt=""
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/** The bell rings (or wiggles, with a smaller swing) about its stem. */
function animateBell(bell: HTMLElement | null, deg: number, ms = 420) {
  bell?.animate(
    [
      { transform: 'rotate(0deg)' },
      { transform: `rotate(${deg}deg)` },
      { transform: `rotate(${-deg * 0.8}deg)` },
      { transform: `rotate(${deg * 0.4}deg)` },
      { transform: 'rotate(0deg)' },
    ],
    { duration: ms, easing: 'ease-out' },
  )
}

/** The bell shakes the desk: a bigger sway on top of the idle one. */
function swayPlant(foliage: HTMLElement | null) {
  foliage?.animate(
    [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(4deg)' },
      { transform: 'rotate(-3deg)' },
      { transform: 'rotate(1.2deg)' },
      { transform: 'rotate(0deg)' },
    ],
    { duration: 1400, easing: 'ease-out' },
  )
}
