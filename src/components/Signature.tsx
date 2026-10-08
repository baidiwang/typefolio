import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { reveal } from '../reveal/controller'

type Props = {
  as?: 'h1' | 'p'
  className?: string
  /** Nominal time to write it, before queue compression. */
  duration?: number
  /** Drawn after the lettering, on the same line (the smiley). */
  after?: ReactNode
  children: ReactNode
}

/**
 * Hand lettering (the name at the top, the signature at the end) that
 * writes itself left to right: a clip that opens across the word, run as a
 * drawing job in the reveal controller, so it happens in reading order like
 * the typing around it. Under reduced motion (or without JS) it's never
 * registered and simply shows. It's real text, so it reads and copies as
 * usual; the lettering may later become an SVG of Baidi's own handwriting.
 */
export function Signature({
  as: Tag = 'p',
  className,
  duration = 900,
  after,
  children,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    return reveal.registerDrawing(el, {
      duration,
      apply: (progress) => {
        if (progress >= 1) {
          el.style.removeProperty('clip-path')
          return
        }
        // Generous top/bottom/left insets: swashes reach past the box.
        // At 0 the right edge sits at -20%, left of the left inset: empty.
        el.style.clipPath = `inset(-40% ${((1 - progress) * 120).toFixed(2)}% -40% -20%)`
      },
    })
  }, [duration])

  return (
    <Tag className={className}>
      <span ref={ref} className="signature">
        {children}
      </span>
      {after}
    </Tag>
  )
}
