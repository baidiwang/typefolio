import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { reveal } from '../reveal/controller'
import { LINE_ART, LINE_ROLLER } from './line'
import { playBell, playKey, playReturn, setSoundEnabled } from './sound'

type Box = { x: number; y: number; w: number; h: number }

/** px of the 2x drawing → css px: --tw-s is css px per drawing px, set from
 *  the paper's width so the roller matches it. */
const u = (n: number) => `calc(var(--tw-s) * ${n.toFixed(2)} * 1px)`

/** How many rows of the 2x drawing show below the entry line (just above
 *  the rod's clips): ≈ 74 px at 1440×900 (85 at most, with the widest
 *  paper) and ≈ 40 px at 390, the roller's lower part running off the
 *  screen. */
const ROWS = { desk: 115, phone: 132 } as const
/** The paper is a little narrower than the roller, like a real one: this
 *  share of its length, centred on it. index.css sizes the paper so the
 *  whole machine (LINE_MACHINE in line.ts, 1.608× the paper) is at most
 *  88% of the viewport. */
const PAPER = 0.96
const PAPER_W = (LINE_ROLLER.x1 - LINE_ROLLER.x0) * PAPER
/** The paper's left edge, in px of the 2x drawing. */
const PAPER_X0 = LINE_ROLLER.x0 + ((LINE_ROLLER.x1 - LINE_ROLLER.x0) * (1 - PAPER)) / 2
/** Carriage travel per character and at most, in px of the 2x drawing. */
const STEP = 0.5
const MAX_TRAVEL = 34

/** A layer's box, from the paper's left edge on the entry line. */
const box = ({ x, y, w, h }: Box): CSSProperties => ({
  left: u(x - PAPER_X0),
  top: u(y - LINE_ROLLER.line),
  width: u(w),
  height: u(h),
})
/** Behind the roller, the paper goes on (paper colour) between the rod's
 *  clips and the roller, and where the roller slides away from the
 *  paper's right end. */
const BACK = box({
  x: PAPER_X0,
  y: LINE_ROLLER.line,
  w: PAPER_W,
  h: LINE_ART.roller.y + LINE_ART.roller.h - LINE_ROLLER.line,
})

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * The typewriter fixed to the bottom of the viewport (docs/typewriter-rig.md):
 * only the roller of the line-art machine, from just above its clips to the
 * bottom of the screen. The paper matches the roller and goes into it; the
 * strip's top edge is the entry line, where text appears
 * (`data-reveal-inset`).
 *
 * Motion is imperative, driven by the reveal controller: the roller slides
 * per character and returns at line end; the bell rings at the end of an
 * element. The letter ends on one ring and a return after the signature.
 *
 * The sound toggle is a real button: the bell at the roller's right end.
 * Until sound is turned on (each visit; nothing is remembered), a pen note
 * beside it says "ring for sound" (where there's room on the desk), and it
 * gives one small wiggle when the intro finishes typing. Everything else is
 * decorative (empty alt, nothing else focusable).
 */
export function Typewriter() {
  const sceneRef = useRef<HTMLDivElement>(null)
  /** The roller: it slides with the carriage. */
  const rollerRef = useRef<HTMLImageElement>(null)
  /** The bell: it swings when it rings. */
  const bellRef = useRef<HTMLImageElement>(null)
  /** css px per carriage step, and the most it travels. */
  const stepRef = useRef(1)
  const maxRef = useRef(Infinity)
  const [soundOn, setSoundOn] = useState(false)
  /** Sound has been turned on during this visit: hides the note and skips
   *  the wiggle. Not remembered across visits. */
  const [heard, setHeard] = useState(false)
  const heardRef = useRef(false)

  // Track the paper: its edges (--pl/--pr on the scene), the scale, the
  // carriage step, and whether the note fits on the desk.
  useLayoutEffect(() => {
    const scene = sceneRef.current
    const paper = document.querySelector<HTMLElement>('.paper')
    if (!scene || !paper) return
    const root = document.documentElement.style
    root.setProperty('--tw-rows-desk', String(ROWS.desk))
    root.setProperty('--tw-rows-phone', String(ROWS.phone))
    const measure = () => {
      const r = paper.getBoundingClientRect()
      scene.style.setProperty('--pl', `${r.left}px`)
      scene.style.setProperty('--pr', `${r.right}px`)
      const s = r.width / PAPER_W
      stepRef.current = STEP * s
      maxRef.current = MAX_TRAVEL * s
      root.setProperty('--tw-s', s.toFixed(5))
      // The note sits on the desk right of the paper: about 150 px.
      const room = document.documentElement.clientWidth - 8
      scene.dataset.note = r.right + 14 + 150 <= room ? 'on' : 'off'
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(paper)
    ro.observe(document.documentElement)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const roller = rollerRef.current
    const bell = bellRef.current

    const moveCarriage = (column: number, ms: number, easing = 'linear') => {
      if (!roller) return
      roller.style.transition = `transform ${ms}ms ${easing}`
      roller.style.transform = `translateX(${-Math.min(column * stepRef.current, maxRef.current)}px)`
    }
    const carriageReturn = () => moveCarriage(0, 260, 'cubic-bezier(0.3, 0.8, 0.2, 1)')
    const ring = () => {
      swing(bell, 1)
      playBell()
    }

    // One small wiggle when the intro has finished typing, so the toggle
    // reads as something to touch.
    const intro = document.querySelector('.intro > :last-child')
    const stopWiggle =
      intro && !reducedMotion()
        ? reveal.whenDone(intro, () => {
            if (!heardRef.current) swing(bell, 0.6, 700)
          })
        : undefined

    // The letter's last line: "Yours in type," and the signature run as one
    // line. The sign-off leaves the carriage where it ends (no return, no
    // bell); while the signature writes itself the carriage carries on
    // across it, as if it were typed; once it's written the bell rings once
    // (heard only with sound on) and the carriage returns with the usual
    // ease. If the signature is skipped (scrolled past), the queue's idle
    // return still brings the carriage home; under reduced motion the
    // controller sends nothing at all.
    const signoff = document.querySelector('.ending__signoff')
    const signature = document.querySelector('.ending__signature .signature')
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
          playReturn()
          if (event.bell) ring()
          break
        case 'feed':
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
  }, [])

  const toggleSound = () => {
    const next = !soundOn
    setSoundEnabled(next)
    setSoundOn(next)
    if (next) {
      playBell()
      if (!reducedMotion()) swing(bellRef.current, 1)
      heardRef.current = true
      setHeard(true)
    }
  }

  return (
    <div ref={sceneRef} className="typewriter" data-reveal-inset="">
      {/* From the paper's left edge on the entry line: the paper behind,
          then the roller (slides). */}
      <div className="tw-origin">
        <div className="tw-back" style={BACK} />
        <img ref={rollerRef} className="tw-roller" src={LINE_ART.roller.src} style={box(LINE_ART.roller)} alt="" />
      </div>
      {/* The bell at the roller's right end, standing on the screen's bottom
          edge: the sound toggle. */}
      <button
        type="button"
        className="tw-bell"
        aria-label="Sound"
        aria-pressed={soundOn}
        title={soundOn ? 'Sound on' : 'Sound off'}
        onClick={toggleSound}
        style={{ '--bell-h': u(LINE_ART.bell.h) } as CSSProperties}
      >
        <img ref={bellRef} src={LINE_ART.bell.src} alt="" />
      </button>
      {!heard && (
        <div className="tw-note" aria-hidden="true">
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

/** The bell swings about the foot of its dome. `amount` 1 = a ring, less =
 *  a wiggle. */
function swing(el: HTMLElement | null, amount: number, ms = 420) {
  if (!el) return
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
}
