import { useLayoutEffect, useRef, type ElementType, type ReactNode } from 'react'
import { reveal, type RevealMode } from './controller'

type Props = {
  /** The element to render (p, h2, li…). Its text is revealed, never changed. */
  as?: ElementType
  mode?: RevealMode
  /** Type on page load even though it's already in view (the intro). */
  onLoad?: boolean
  /** Nominal total duration in ms (otherwise the controller's default pace). */
  duration?: number
  className?: string
  id?: string
  children: ReactNode
}

/**
 * Registers its element with the reveal controller. Renders the full text
 * from the first render; the controller only paints the unrevealed part
 * transparent. Registration happens in a layout effect, before first paint,
 * so text below the fold never flashes.
 */
export function Reveal({
  as: Tag = 'p',
  mode = 'type',
  onLoad,
  duration,
  className,
  id,
  children,
}: Props) {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    return reveal.register(el, { mode, onLoad, duration })
  }, [mode, onLoad, duration])

  return (
    <Tag ref={ref} className={className} id={id}>
      {children}
    </Tag>
  )
}
