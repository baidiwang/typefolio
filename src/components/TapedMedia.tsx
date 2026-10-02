import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react'
import type { ProjectMedia } from '../content'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { reveal } from '../reveal/controller'

type Props = {
  media: ProjectMedia
  href?: string
  title: string
  /** Rotation in degrees, so neighbouring photos don't sit identically. */
  tilt: number
}

/**
 * A screen recording "taped" to the paper. Plays only while in view; under
 * reduced motion only the poster frame is shown.
 */
export function TapedMedia({ media, href, title, tilt }: Props) {
  const reduced = usePrefersReducedMotion()
  const videoRef = useRef<HTMLVideoElement>(null)
  const frameRef = useRef<HTMLElement & HTMLAnchorElement>(null)

  // "Stuck on" when its project enters view. Doesn't wait for typing. Set
  // before first paint so a below-the-fold photo never flashes in.
  useLayoutEffect(() => {
    const el = frameRef.current
    if (!el) return
    el.dataset.stick = 'pending'
    return reveal.watch(el, (instant) => {
      if (instant) {
        el.dataset.stick = 'done'
        return
      }
      el.dataset.stick = 'stuck'
      // Hand the transform back to the hover styles once stuck.
      el.addEventListener('animationend', () => (el.dataset.stick = 'done'), {
        once: true,
      })
    })
  }, [])

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
  const frame = reduced ? (
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
  const style = { '--tilt': `${tilt}deg` } as CSSProperties
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
