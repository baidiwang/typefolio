import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { reveal } from '../reveal/controller'
import {
  BELL_PIVOT,
  BODY,
  BODY_SRC,
  KNOB_L_PIVOT,
  KNOB_R_PIVOT,
  LAYERS,
  NOTCH,
} from './layers'
import { LINE_ART, LINE_ROLLER } from './line'
import { playBell, playKey, playReturn, setSoundEnabled } from './sound'

/**
 * Three machines:
 * - drawn (default): the hand-drawn typewriter, recoloured (?tw=red|olive)
 *   and lit from above; the paper goes in behind its body's top edge.
 * - line (?palette=mono): only the roller of the line-art typewriter, from
 *   just above its clips to the bottom of the screen; the paper matches the
 *   roller and goes into it. Its bell sits at the roller's right end. (The
 *   whole machine closes the letter, after the signature: App.tsx.)
 * - roller (?machine=roller): no body, just a rendered platen roller
 *   spanning the paper at the bottom of the screen, with a small carriage
 *   in the typewriter's colour that slides as text types.
 * Either way the paper's entry line (the strip's top edge) is where text
 * appears (`data-reveal-inset`).
 */
type Machine = 'drawn' | 'roller' | 'line'
const machineOf = (): Machine => {
  const { machine, palette } = document.documentElement.dataset
  if (machine === 'roller') return 'roller'
  return palette === 'mono' ? 'line' : 'drawn'
}
const colourOf = (): 'red' | 'olive' =>
  document.documentElement.dataset.tw === 'olive' ? 'olive' : 'red'

/** How much of the drawn body shows, in drawing rows below its top edge.
 *  half (default): the shoulders, the roller's notch and the top key row
 *  with its stems (≈ 119 px at 1440×900, ≈ 61 px at 390); the rest runs
 *  off the bottom of the screen. full (?machine-crop=full): down to the keyboard
 *  frame on desktop, the whole machine on phones. */
const CROP = {
  half: { desk: 146, phone: 168 },
  full: { desk: BODY.keyboardBottom - BODY.top, phone: BODY.bottom - BODY.top },
} as const
const cropOf = () => CROP[document.documentElement.dataset.machineCrop === 'full' ? 'full' : 'half']

/** Carriage travel per typed character: drawn, in reference px of the
 *  drawing; roller, as a fraction of the paper's width. */
const STEP = 0.5
const ROLLER_STEP = 1 / 150
/** The drawn body's width in the drawing (desktop draws it 10% wider:
 *  --tw-sx in index.css). */
const BODY_W = BODY.x1 - BODY.x0

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

const NOTCH_BOX = { x: NOTCH.x0, y: NOTCH.y0, w: NOTCH.x1 - NOTCH.x0, h: NOTCH.y1 - NOTCH.y0 }
const KNOB_R = LAYERS.knobR
const BELL = LAYERS.bell
/** The bell's centre, from the body's left edge: stretched + unstretched. */
const BELL_CX: [number, number] = [ANCHOR.right - BODY.x0, BELL.x + BELL.w / 2 - ANCHOR.right]

const BELL_BUTTON_STYLE: CSSProperties = {
  left: ux(...BELL_CX),
  top: u(BELL.y + BELL.h / 2 - BODY.top),
}

/** Drawn: the note sits on the desk to the right of the paper, above the
 *  bell. (Roller: placed in CSS, beside the carriage's light.) */
const NOTE_STYLE: CSSProperties = {
  left: `calc(${ux(...BELL_CX)} + 18px)`,
  top: `calc(${u(BELL.y - BODY.top)} - 64px)`,
}

/** The line-art roller: how many rows of the 2x drawing show below the
 *  entry line (just above the rod's clips): ≈ 75 px at 1440×900 (85 at
 *  most, with the widest paper) and ≈ 40 px at 390, the roller's lower part
 *  running off the screen. */
const LINE_ROWS = { desk: 115, phone: 132 } as const
/** The paper is a little narrower than the roller, like a real one: this
 *  share of its length, centred on it. index.css sizes the paper so the
 *  whole machine (LINE_MACHINE in line.ts, 1.608× the paper) is at most
 *  88% of the viewport. */
const LINE_PAPER = 0.96
const LINE_W = (LINE_ROLLER.x1 - LINE_ROLLER.x0) * LINE_PAPER
/** The paper's left edge, in px of the 2x drawing. */
const LINE_X0 = LINE_ROLLER.x0 + ((LINE_ROLLER.x1 - LINE_ROLLER.x0) * (1 - LINE_PAPER)) / 2
/** Carriage travel per character and at most, in px of the 2x drawing. */
const LINE_STEP = 0.5
const LINE_MAX = 34
const lineBox = ({ x, y, w, h }: Box): CSSProperties => ({
  left: u(x - LINE_X0),
  top: u(y - LINE_ROLLER.line),
  width: u(w),
  height: u(h),
})
/** Behind the roller, the paper goes on (paper colour) between the rod's
 *  clips and the roller, and where the roller slides away from the
 *  paper's right end. */
const LINE_BACK = lineBox({
  x: LINE_X0,
  y: LINE_ROLLER.line,
  w: LINE_W,
  h: LINE_ART.roller.y + LINE_ART.roller.h - LINE_ROLLER.line,
})

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * The desk scene fixed to the bottom of the viewport (see
 * docs/typewriter-rig.md). Motion is imperative, driven by the reveal
 * controller: the carriage slides per character and returns at line end;
 * on the drawn machine the knobs turn on each line feed and the bell rings
 * at the end of an element; on the roller the carriage's light blinks.
 *
 * The sound toggle is a real button: the bell (drawn) or the carriage's
 * indicator light (roller). Until sound is turned on (each visit; nothing
 * is remembered), a pen note beside it says "ring for sound" (where there's room on the desk), and it gives
 * one small wiggle when the intro finishes typing. Everything else is
 * decorative (empty alt, nothing else focusable).
 */
export function Typewriter() {
  const [machine] = useState(machineOf)
  const [colour] = useState(colourOf)
  const sceneRef = useRef<HTMLDivElement>(null)
  /** Everything that slides with the carriage. */
  const movingRefs = useRef<(HTMLElement | null)[]>([])
  const knobLRef = useRef<HTMLImageElement>(null)
  const knobRRef = useRef<HTMLImageElement>(null)
  /** The sound toggle's moving part: the bell, or the light's lamp. */
  const toggleRef = useRef<HTMLElement | null>(null)
  /** css px per carriage step, and the most it travels. */
  const stepRef = useRef(1)
  const maxRef = useRef(Infinity)
  const [soundOn, setSoundOn] = useState(false)
  /** Sound has been turned on during this visit: hides the note and skips
   *  the wiggle. Not remembered across visits. */
  const [heard, setHeard] = useState(false)
  const heardRef = useRef(false)

  // Track the paper: its edges (--pl/--pr on the scene; --paper-l/--paper-r
  // on the root, for the lamp's falloff), the drawn machine's scale, the
  // carriage step, and whether the note fits on the desk.
  useLayoutEffect(() => {
    const scene = sceneRef.current
    const paper = document.querySelector<HTMLElement>('.paper')
    if (!scene || !paper) return
    const root = document.documentElement.style
    root.setProperty('--tw-aspect', (BODY_W / (BODY.keyboardBottom - BODY.top)).toFixed(4))
    const crop = machine === 'line' ? LINE_ROWS : cropOf()
    root.setProperty('--tw-rows-desk', String(crop.desk))
    root.setProperty('--tw-rows-phone', String(crop.phone))
    const measure = () => {
      const r = paper.getBoundingClientRect()
      root.setProperty('--paper-l', `${r.left}px`)
      root.setProperty('--paper-r', `${r.right}px`)
      scene.style.setProperty('--pl', `${r.left}px`)
      scene.style.setProperty('--pr', `${r.right}px`)
      scene.style.setProperty('--pw', `${r.width}px`)
      const room = document.documentElement.clientWidth - 8
      if (machine === 'drawn') {
        const sx = parseFloat(getComputedStyle(scene).getPropertyValue('--tw-sx')) || 1
        const s = r.width / (BODY_W * sx)
        stepRef.current = STEP * s
        root.setProperty('--tw-s', s.toFixed(5))
        const bellX = (BELL_CX[0] * sx + BELL_CX[1]) * s
        // The note needs about 150 px of desk right of the paper.
        scene.dataset.note = r.left + bellX + 18 + 150 <= room ? 'on' : 'off'
      } else if (machine === 'line') {
        const s = r.width / LINE_W
        stepRef.current = LINE_STEP * s
        maxRef.current = LINE_MAX * s
        root.setProperty('--tw-s', s.toFixed(5))
        // The note sits on the desk right of the paper: about 150 px.
        scene.dataset.note = r.right + 14 + 150 <= room ? 'on' : 'off'
      } else {
        stepRef.current = r.width * ROLLER_STEP
        scene.dataset.note = r.right + 16 + 150 <= room ? 'on' : 'off'
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(paper)
    ro.observe(document.documentElement)
    return () => ro.disconnect()
  }, [machine])

  useEffect(() => {
    const moving = movingRefs.current
    const knobs = [knobLRef.current, knobRRef.current]
    const toggle = toggleRef.current

    const moveCarriage = (column: number, ms: number, easing = 'linear') => {
      for (const el of moving) {
        if (!el) continue
        el.style.transition = `transform ${ms}ms ${easing}`
        el.style.transform = `translateX(${-Math.min(column * stepRef.current, maxRef.current)}px)`
      }
    }
    const carriageReturn = () => moveCarriage(0, 260, 'cubic-bezier(0.3, 0.8, 0.2, 1)')
    // Line feed: the platen knobs turn a notch (drawn only).
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
    const ring = () => {
      cue(toggle, machine, 1)
      playBell()
    }

    // One small wiggle when the intro has finished typing, so the toggle
    // reads as something to touch.
    const intro = document.querySelector('.intro > :last-child')
    const stopWiggle =
      intro && !reducedMotion()
        ? reveal.whenDone(intro, () => {
            if (!heardRef.current) cue(toggle, machine, 0.6, 700)
          })
        : undefined

    // ?palette=mono, the letter's last line: "Yours in type," and the
    // signature run as one line. The sign-off leaves the carriage where it
    // ends (no return, no bell); while the signature writes itself the
    // carriage carries on across it, as if it were typed; once it's written
    // the bell rings once (heard only with sound on) and the carriage
    // returns with the usual ease. If the signature is skipped (scrolled
    // past), the queue's idle return still brings the carriage home; under
    // reduced motion the controller sends nothing at all.
    const signoff = machine === 'line' ? document.querySelector('.ending__signoff') : null
    const signature =
      machine === 'line' ? document.querySelector('.ending__signature .signature') : null
    let current: Element | null = null
    let column = 0
    const signatureColumns = () => {
      if (!signature) return 0
      const ch = parseFloat(getComputedStyle(document.body).fontSize) * 0.6
      return Math.round(signature.getBoundingClientRect().width / ch)
    }
    const stopSignature = signature
      ? reveal.whenDone(signature, (instant) => {
          if (instant || reducedMotion()) return
          ring()
          carriageReturn()
          playReturn()
          column = 0
        })
      : undefined

    const unsubscribe = reveal.subscribe((event) => {
      switch (event.type) {
        case 'start':
          current = event.element
          if (signature && current === signature) moveCarriage(column + signatureColumns(), 700)
          break
        case 'char':
          column = event.column + 1
          moveCarriage(column, 45)
          if (event.char.trim() !== '') playKey() // space bar: carriage only
          break
        case 'return':
          if (signoff && current === signoff && event.bell) break // held for the signature
          column = 0
          carriageReturn()
          lineFeed()
          playReturn()
          if (event.bell) ring()
          break
        case 'feed':
          lineFeed()
          playReturn()
          if (event.bell) ring()
          break
        case 'idle':
          column = 0
          carriageReturn()
          break
      }
    })
    return () => {
      stopWiggle?.()
      stopSignature?.()
      unsubscribe()
    }
  }, [machine])

  const toggleSound = () => {
    const next = !soundOn
    setSoundEnabled(next)
    setSoundOn(next)
    if (next) {
      playBell()
      if (!reducedMotion()) cue(toggleRef.current, machine, 1)
      heardRef.current = true
      setHeard(true)
    }
  }

  const moving = (i: number) => (el: HTMLElement | null) => {
    movingRefs.current[i] = el
  }

  const note = !heard && (
    <div className="tw-note" style={machine === 'drawn' ? NOTE_STYLE : undefined} aria-hidden="true">
      <span className="tw-note__text">ring for sound</span>
      {machine === 'drawn' ? (
        <svg className="tw-note__arrow" viewBox="0 0 60 50" focusable="false">
          <path d="M52 6C40 10 22 18 12 38" />
          <path d="M5 30L12 39L20 33" />
        </svg>
      ) : (
        // Longer: from the note down past the roller's end to the light.
        <svg className="tw-note__arrow" viewBox="0 0 70 90" focusable="false">
          <path d="M64 6C46 12 24 34 17 78" />
          <path d="M9 69L17 80L25 71" />
        </svg>
      )}
    </div>
  )

  const toggleProps = {
    type: 'button' as const,
    'aria-label': 'Sound',
    'aria-pressed': soundOn,
    title: soundOn ? 'Sound on' : 'Sound off',
    onClick: toggleSound,
  }

  if (machine === 'line') {
    return (
      <div ref={sceneRef} className="typewriter typewriter--line" data-reveal-inset="">
        {/* From the roller's top-left corner: the paper behind, then the
            roller (slides). */}
        <div className="tw-origin">
          <div className="tw-line-back" style={LINE_BACK} />
          <img
            ref={moving(0)}
            className="tw-layer"
            src={LINE_ART.roller.src}
            style={lineBox(LINE_ART.roller)}
            alt=""
          />
        </div>
        {/* The bell at the roller's right end, standing on the screen's
            bottom edge: the sound toggle. */}
        <button
          {...toggleProps}
          className="tw-bell tw-bell--line"
          style={{ '--bell-h': u(LINE_ART.bell.h) } as CSSProperties}
        >
          <img
            ref={(el) => {
              toggleRef.current = el
            }}
            src={LINE_ART.bell.src}
            alt=""
          />
        </button>
        {!heard && (
          <div className="tw-note tw-note--line" aria-hidden="true">
            <span className="tw-note__text">ring for sound</span>
            <svg className="tw-note__arrow" viewBox="0 0 60 50" focusable="false">
              <path d="M52 6C40 10 22 18 12 38" />
              <path d="M5 30L12 39L20 33" />
            </svg>
          </div>
        )}
      </div>
    )
  }

  if (machine === 'roller') {
    return (
      <div ref={sceneRef} className="typewriter typewriter--roller" data-reveal-inset="">
        {/* The platen roller spans the paper; its end caps sit just
            outside it. The carriage rides along it, starting at the right. */}
        <div className="tw-platen" aria-hidden="true" />
        <div ref={moving(0)} className="tw-rcarriage">
          <button {...toggleProps} className="tw-light">
            <span
              ref={(el) => {
                toggleRef.current = el
              }}
              className="tw-light__lamp"
            />
          </button>
        </div>
        {note}
      </div>
    )
  }

  return (
    <div ref={sceneRef} className="typewriter typewriter--drawn" data-reveal-inset="">
      {/* A zero-size anchor at the body's top-left corner. Back to front:
          the roller (clipped to the notch between the shoulders), the body,
          the lever, axle and knobs, then the bell (a button). */}
      <div className="tw-origin">
        <div className="tw-notch" style={stretched(NOTCH_BOX)}>
          <img
            ref={moving(0)}
            className="tw-layer"
            src={LAYERS.roller.src}
            style={stretched(LAYERS.roller, NOTCH.x0, NOTCH.y0)}
            alt=""
          />
        </div>
        <img className="tw-layer" src={BODY_SRC[colour]} style={stretched(LAYERS.body)} alt="" />
        <div ref={moving(1)} className="tw-carriage">
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
        <button {...toggleProps} className="tw-bell" style={BELL_BUTTON_STYLE}>
          <img
            ref={(el) => {
              toggleRef.current = el
            }}
            src={BELL.src}
            style={{
              width: u(BELL.w),
              height: u(BELL.h),
              transformOrigin: origin(BELL_PIVOT, BELL),
            }}
            alt=""
          />
        </button>
        {note}
      </div>
    </div>
  )
}

/** The toggle answers: the bell swings about its stem (drawn), or the
 *  carriage's light blinks (roller). `amount` 1 = a ring, less = a wiggle. */
function cue(el: HTMLElement | null, machine: Machine, amount: number, ms = 420) {
  if (!el) return
  if (machine !== 'roller') {
    const deg = 10 * amount
    el.animate(
      [
        { transform: 'rotate(0deg)' },
        { transform: `rotate(${deg}deg)` },
        { transform: `rotate(${-deg * 0.8}deg)` },
        { transform: `rotate(${deg * 0.4}deg)` },
        { transform: 'rotate(0deg)' },
      ],
      { duration: ms, easing: 'ease-out' },
    )
  } else {
    el.animate(
      [
        { transform: 'scale(1)', filter: 'brightness(1)' },
        { transform: `scale(${1 + 0.35 * amount})`, filter: `brightness(${1 + 1.2 * amount})` },
        { transform: 'scale(1)', filter: 'brightness(1)' },
      ],
      { duration: ms + 200, easing: 'ease-out' },
    )
  }
}
