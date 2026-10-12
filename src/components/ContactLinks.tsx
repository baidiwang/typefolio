import {
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import { site } from '../content'

/** The separator is visual only: screen readers just hear the four links.
 *  `between` marks the one between the address and the rest, dropped where
 *  the line breaks there (index.css). */
function Dot({ between }: { between?: boolean }) {
  return (
    <span className={between ? 'contact__dot contact__dot--between' : 'contact__dot'} aria-hidden="true">
      {' · '}
    </span>
  )
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
 *  dash wrong on a long link (the address), showing a piece of the loop at
 *  rest. */
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
  /** Drag-selectable like plain text (the address): see selectByDrag. */
  selectable?: boolean
  children: ReactNode
}

/** The caret position under a point, in either engine's API. */
function caretAt(x: number, y: number): { node: Node; offset: number } | null {
  const pos = document.caretPositionFromPoint?.(x, y)
  if (pos) return { node: pos.offsetNode, offset: pos.offset }
  const range = document.caretRangeFromPoint?.(x, y)
  return range ? { node: range.startContainer, offset: range.startOffset } : null
}

/**
 * Browsers never start a text selection on a link (a drag there drags the
 * link, or does nothing), so the printed address couldn't be selected and
 * copied. For a mouse press on it: a plain click still follows the link;
 * a drag selects text from where it started, like plain text, and the
 * click that ends it doesn't follow the link. Touch keeps the platform's
 * own long-press menu (Copy Email).
 */
function selectByDrag(e: ReactMouseEvent<HTMLAnchorElement>) {
  if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
  const start = caretAt(e.clientX, e.clientY)
  if (!start) return
  e.preventDefault() // no link drag
  const link = e.currentTarget
  const x0 = e.clientX
  const y0 = e.clientY
  let dragging = false
  const move = (m: MouseEvent) => {
    if (!dragging && Math.hypot(m.clientX - x0, m.clientY - y0) < 4) return
    dragging = true
    const end = caretAt(m.clientX, m.clientY)
    if (end) getSelection()?.setBaseAndExtent(start.node, start.offset, end.node, end.offset)
  }
  const up = () => {
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', up)
    if (!dragging) return
    // The click that ends a selecting drag (dispatched right after this
    // mouseup, if it ended on the link) doesn't follow the link; if there's
    // no such click, the next press clears this.
    const stay = (c: Event) => c.preventDefault()
    link.addEventListener('click', stay, { capture: true, once: true })
    window.addEventListener(
      'mousedown',
      () => link.removeEventListener('click', stay, { capture: true }),
      { capture: true, once: true },
    )
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
}

/**
 * A plain typed word; on hover or keyboard focus a pen circle draws itself
 * around it (the stroke, pathLength 1, runs from dash offset 1 to 0). The
 * circle is also the focus indicator. Touch screens, which can't hover, get
 * a dotted underline instead (index.css).
 */
function PenLink({ href, external, variant, selectable, children }: PenLinkProps) {
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
    <a
      className="pen-link"
      href={href}
      onMouseDown={selectable ? selectByDrag : undefined}
      {...ext}
    >
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

/**
 * "baidiwang30@gmail.com · Resume · LinkedIn · GitHub", printed in the
 * letterhead, the address in full. Two unbreakable groups, the address and
 * the rest: where the whole line doesn't fit it breaks between them.
 */
export function ContactLinks() {
  const { resume, email, linkedin, github } = site.links
  return (
    <>
      <span className="contact__group">
        <PenLink href={email.href} variant={1} selectable>
          {email.display}
        </PenLink>
      </span>
      <Dot between />
      <span className="contact__group">
        <PenLink href={resume.href} external variant={0}>
          {resume.label}
        </PenLink>
        <Dot />
        <PenLink href={linkedin.href} external variant={2}>
          {linkedin.label}
        </PenLink>
        <Dot />
        <PenLink href={github.href} external variant={0}>
          {github.label}
        </PenLink>
      </span>
    </>
  )
}
