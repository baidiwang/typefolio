import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react'
import type { ProjectMedia } from '../content'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { reveal } from '../reveal/controller'

/** Same breakpoint as the stacked project layout in index.css. */
const STACKED_QUERY = '(max-width: 719px)'
/** Pointers that hover (mouse, trackpad): only they get the lift. */
const FINE_HOVER = '(hover: hover) and (pointer: fine)'
/** The most a photo tilts toward the pointer. */
const TILT_DEG = 3

type Props = {
  media: ProjectMedia
  href?: string
  title: string
  /** id of the project's title: beside it (desktop), the photo sticks on
   *  when the title starts typing. */
  titleId: string
  /** id of the one-liner: below it (stacked layout), the photo sticks on
   *  once it has been typed. */
  leadId: string
  /** Rotation in degrees, so neighbouring photos don't sit identically. */
  tilt: number
}

/**
 * A screen recording "taped" to the paper. Plays only while in view; under
 * reduced motion only the poster frame is shown. A still (the Axios map)
 * is just the image.
 */
export function TapedMedia({ media, href, title, titleId, leadId, tilt }: Props) {
  const reduced = usePrefersReducedMotion()
  const videoRef = useRef<HTMLVideoElement>(null)
  const frameRef = useRef<HTMLElement & HTMLAnchorElement>(null)

  // Hidden before first paint (only when text reveal is on, so the photo
  // can never be stranded invisible)...
  useLayoutEffect(() => {
    const el = frameRef.current
    if (el && reveal.textEnabled) el.dataset.stick = 'pending'
  }, [])

  // ...then "stuck on" when typing reaches it. A plain effect, so it runs
  // after every <Reveal> on the page has registered.
  useEffect(() => {
    const el = frameRef.current
    const titleEl = document.getElementById(titleId)
    const leadEl = document.getElementById(leadId)
    if (!el || !titleEl || !leadEl) return

    let cancelled = false
    let io: IntersectionObserver | undefined
    const stick = (instant: boolean) => {
      if (cancelled) return
      if (instant) {
        el.dataset.stick = 'done'
        return
      }
      el.dataset.stick = 'stuck'
      // Hand the transform back to the hover styles once stuck.
      el.addEventListener('animationend', () => (el.dataset.stick = 'done'), {
        once: true,
      })
    }

    // Desktop: the photo sits beside the title, so it goes up with it.
    if (!window.matchMedia(STACKED_QUERY).matches) {
      const off = reveal.whenStarts(titleEl, stick)
      return () => {
        cancelled = true
        off()
      }
    }

    // Stacked: the photo sits below the one-liner. It sticks on once that's
    // typed, and only once it has itself come out of the platen; otherwise
    // the animation would play unseen behind the typewriter.
    const off = reveal.whenDone(leadEl, (instant) => {
      if (instant || el.getBoundingClientRect().top < reveal.platenLine) {
        stick(instant)
        return
      }
      const inset = window.innerHeight - reveal.platenLine
      io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return
          io?.disconnect()
          stick(false)
        },
        { rootMargin: `0px 0px ${-inset}px 0px` },
      )
      io.observe(el)
    })
    return () => {
      cancelled = true
      off()
      io?.disconnect()
    }
  }, [titleId, leadId])

  // Lifts toward the pointer: up to TILT_DEG of tilt toward wherever the
  // pointer is over it (index.css adds the lift and the deeper shadow,
  // eased), settling back on leave. Desktop pointers only; none under
  // reduced motion.
  useEffect(() => {
    const el = frameRef.current
    if (!el || reduced || !window.matchMedia(FINE_HOVER).matches) return
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      // The side under the pointer comes up: rotateX lifts the top for a
      // pointer above the middle, rotateY the right for one to the right.
      el.style.setProperty('--rx', `${(py * 2 * TILT_DEG).toFixed(2)}deg`)
      el.style.setProperty('--ry', `${(-px * 2 * TILT_DEG).toFixed(2)}deg`)
      el.dataset.lift = ''
    }
    const leave = () => {
      el.style.setProperty('--rx', '0deg')
      el.style.setProperty('--ry', '0deg')
      delete el.dataset.lift
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [reduced])

  useEffect(() => {
    const video = videoRef.current
    if (!video || reduced) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            /* Autoplay refused: the poster stays, which is fine. */
          })
        } else {
          video.pause()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(video)
    return () => io.disconnect()
  }, [reduced])

  const portrait = media.height > media.width
  const frame = media.still ? (
    <img
      src={`${media.src}.webp`}
      width={media.width}
      height={media.height}
      alt=""
      decoding="async"
      loading="lazy"
    />
  ) : reduced ? (
    <img
      src={`${media.src}.jpg`}
      width={media.width}
      height={media.height}
      alt=""
      decoding="async"
      loading="lazy"
    />
  ) : (
    <video
      ref={videoRef}
      width={media.width}
      height={media.height}
      poster={`${media.src}.jpg`}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
    >
      <source src={`${media.src}.webm`} type="video/webm" />
      <source src={`${media.src}.mp4`} type="video/mp4" />
    </video>
  )

  const className = `taped${portrait ? ' taped--portrait' : ''}`
  const style = {
    '--tilt': `${tilt}deg`,
    '--ratio': (media.height / media.width).toFixed(4),
  } as CSSProperties
  const label = `${title}: ${media.alt}`

  if (!href) {
    return (
      <figure
        ref={frameRef}
        className={className}
        style={style}
        role="img"
        aria-label={label}
      >
        {frame}
      </figure>
    )
  }
  return (
    <a
      ref={frameRef}
      className={className}
      style={style}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} (opens in a new tab)`}
    >
      {frame}
    </a>
  )
}
