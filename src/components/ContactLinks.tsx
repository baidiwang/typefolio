import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import { site } from '../content'

/** The separator is visual only: screen readers just hear the four links. */
function Dot() {
  return <span aria-hidden="true"> · </span>
}

/**
 * Three hand-drawn loops (viewBox 100 × 40, stretched to the word), each
 * overshooting its start like a quick pen circle.
 */
const CIRCLES = [
  'M12 10C30 2 78 3 92 14C102 24 80 36 50 37C20 38 2 30 6 19C9 11 22 6 40 5',
  'M85 8C70 2 25 3 10 13C-1 22 12 35 45 36C78 37 99 29 95 18C92 10 78 5 60 4',
  'M20 7C40 1 85 4 94 16C100 27 75 37 45 36C15 35 1 27 5 17C8 9 25 4 48 3',
]

/** A loop drawn for a w × h px box: the 100 × 40 path scaled to it, so the
 *  SVG is never stretched. Its stroke and its dash (pathLength 1) then stay
 *  true at any width; a stretched SVG with a non-scaling stroke got the
 *  dash wrong on a long word, showing a piece of the loop at rest. */
function loop(variant: number, w: number, h: number) {
  let i = 0
  return CIRCLES[variant % CIRCLES.length].replace(/-?\d*\.?\d+/g, (n) =>
    (Number(n) * (i++ % 2 === 0 ? w / 100 : h / 40)).toFixed(1),
  )
}

type PenLinkProps = {
  href: string
  external?: boolean
  variant: number
  onClick?: (e: ReactMouseEvent<HTMLAnchorElement>) => void
  children: ReactNode
}

/**
 * A plain typed word; on hover or keyboard focus a pen circle draws itself
 * around it (the stroke, pathLength 1, runs from dash offset 1 to 0). The
 * circle is also the focus indicator. Touch screens, which can't hover, get
 * a dotted underline instead (index.css).
 */
function PenLink({ href, external, variant, onClick, children }: PenLinkProps) {
  const ext = external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  const svgRef = useRef<SVGSVGElement>(null)
  // The loop's box in css px (index.css sizes it from the word), tracked so
  // font loading and resizes redraw it to fit.
  const [box, setBox] = useState({ w: 100, h: 40 })

  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const measure = () => {
      const r = svg.getBoundingClientRect()
      if (r.width && r.height) setBox({ w: Math.round(r.width), h: Math.round(r.height) })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(svg)
    return () => ro.disconnect()
  }, [])

  return (
    <a className="pen-link" href={href} onClick={onClick} {...ext}>
      {children}
      {external && <span className="visually-hidden"> (opens in a new tab)</span>}
      <svg
        ref={svgRef}
        className="pen-link__circle"
        viewBox={`0 0 ${box.w} ${box.h}`}
        aria-hidden="true"
        focusable="false"
      >
        <path d={loop(variant, box.w, box.h)} pathLength={1} />
      </svg>
    </a>
  )
}

const NOTE = 'copied!'
/** Per character as it types out, and how long it stays once typed. */
const NOTE_CHAR_MS = 45
const NOTE_HOLD_MS = 2000

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * "Email": a click (or Enter) copies the address instead of opening a mail
 * app, and a small "copied!" types out right after the word, then goes
 * after about 2 s; screen readers hear it from a polite live region.
 * Without the Clipboard API (an insecure context, an old browser), or if
 * the copy is refused, it's the plain mailto link. A modified click
 * (new window, etc.) is left to the browser.
 */
function CopyEmail() {
  const { label, href, display: address } = site.links.email
  const canCopy =
    typeof window !== 'undefined' && window.isSecureContext && Boolean(navigator.clipboard?.writeText)
  /** Characters of the note shown; `leaving` while it fades out. */
  const [shown, setShown] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [announce, setAnnounce] = useState('')
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => clearTimers, [])

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const showNote = () => {
    clearTimers()
    setLeaving(false)
    // Cleared first, so a second copy is announced again.
    setAnnounce('')
    later(() => setAnnounce(`Copied ${address} to the clipboard.`), 50)
    const still = reducedMotion()
    if (still) setShown(NOTE.length)
    else {
      setShown(0)
      for (let i = 1; i <= NOTE.length; i++) later(() => setShown(i), i * NOTE_CHAR_MS)
    }
    const typed = still ? 0 : NOTE.length * NOTE_CHAR_MS
    if (still) later(() => setShown(0), typed + NOTE_HOLD_MS)
    else {
      later(() => setLeaving(true), typed + NOTE_HOLD_MS)
      later(() => {
        setShown(0)
        setLeaving(false)
      }, typed + NOTE_HOLD_MS + 250)
    }
  }

  const onClick = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    if (!canCopy || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigator.clipboard.writeText(address).then(showNote, () => {
      window.location.href = href
    })
  }

  return (
    <span className="copy-email">
      <PenLink href={href} variant={1} onClick={onClick}>
        {label}
        {canCopy && <span className="visually-hidden"> (copies {address})</span>}
      </PenLink>
      <span className="copy-email__note" data-leaving={leaving || undefined} aria-hidden="true">
        {NOTE.slice(0, shown)}
      </span>
      <span className="visually-hidden" role="status" aria-live="polite">
        {announce}
      </span>
    </span>
  )
}

/** "Resume · Email · LinkedIn · GitHub", printed in the letterhead. */
export function ContactLinks() {
  const { resume, linkedin, github } = site.links
  return (
    <>
      <PenLink href={resume.href} external variant={0}>
        {resume.label}
      </PenLink>
      <Dot />
      <CopyEmail />
      <Dot />
      <PenLink href={linkedin.href} external variant={2}>
        {linkedin.label}
      </PenLink>
      <Dot />
      <PenLink href={github.href} external variant={0}>
        {github.label}
      </PenLink>
    </>
  )
}
