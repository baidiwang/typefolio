import { useLayoutEffect, useRef, useState } from 'react'
import type { WindowProject } from './projects'
import { windows, windowOrder } from './projects'
import { NeighborhoodArtwork } from './RoomArtwork'
import { NightPass } from './NightPass'
import type { NightPassHandle } from './NightPass'
import { createVisitMotion } from './visitMotion'
import './presentation-studies.css'

export function MetroVisit({
  selected,
  onClose,
  onNext,
  motion,
  origin,
}: {
  selected: WindowProject
  onClose: () => void
  onNext: (project: WindowProject) => void
  motion: boolean
  origin: () => DOMRect | undefined
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    content = useRef<HTMLDivElement>(null),
    pass = useRef<NightPassHandle>(null),
    enabled = useRef(motion),
    moving = useRef(false),
    transitions = useRef<ReturnType<typeof createVisitMotion> | null>(null)
  const [busy, setBusy] = useState(false),
    [direction, setDirection] = useState(0)
  useLayoutEffect(() => {
    const modal = dialog.current!
    modal.showModal()
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const manager = createVisitMotion({
      hidden: () => document.hidden,
      reduced: () => !enabled.current || media.matches,
    })
    transitions.current = manager
    const animation = modal.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 280,
      easing: 'ease-out',
      fill: 'both',
    })
    manager.track(animation, () => {
      modal.style.opacity = '1'
    })
    document.addEventListener('visibilitychange', manager.sync)
    media.addEventListener('change', manager.sync)
    return () => {
      manager.cancel()
      transitions.current = null
      document.removeEventListener('visibilitychange', manager.sync)
      media.removeEventListener('change', manager.sync)
      if (modal.open) modal.close()
    }
  }, [])
  useLayoutEffect(() => {
    enabled.current = motion
    transitions.current?.sync()
  }, [motion])
  useLayoutEffect(() => {
    content.current!.style.transform = 'none'
    content.current!.style.opacity = '1'
  }, [selected])
  const position = windowOrder.indexOf(windows.indexOf(selected))
  const neighbor = (step: number) =>
    windows[
      windowOrder[(position + step + windowOrder.length) % windowOrder.length]
    ]
  const depart = (step = 0) => {
    if (moving.current || !pass.current || !transitions.current) return
    moving.current = true
    setBusy(true)
    const box = pass.current.freeze(),
      modal = dialog.current!,
      layer = content.current!
    const opacity = getComputedStyle(modal).opacity
    transitions.current.cancel()
    modal.style.opacity = opacity
    const animate = (
      node: HTMLElement,
      frames: Keyframe[],
      duration: number,
      complete?: () => void,
      easing = 'cubic-bezier(.16,1,.3,1)',
    ) => {
      const animation = node.animate(frames, {
        duration,
        easing,
        fill: 'both',
      })
      transitions.current!.track(animation, () => {
        const last = frames[frames.length - 1]
        for (const key of ['opacity', 'transform'] as const) {
          const value = last[key]
          if (typeof value === 'string' || typeof value === 'number')
            node.style[key] = String(value)
        }
        complete?.()
      })
    }
    if (step) {
      animate(modal, [{ opacity }, { opacity: 1 }], 140)
      animate(
        layer,
        [
          { transform: 'none', opacity: 1 },
          {
            transform: `translateX(${-step * Math.min(innerWidth * 0.4, 320)}px) scale(.96)`,
            opacity: 0,
          },
        ],
        230,
        () => {
          setDirection(step)
          moving.current = false
          setBusy(false)
          onNext(neighbor(step))
        },
      )
    } else {
      const destination = origin()
      const visible =
        destination &&
        destination.width > 0 &&
        destination.right > 0 &&
        destination.left < innerWidth &&
        destination.bottom > 0 &&
        destination.top < innerHeight
      const x = visible
          ? destination.left + destination.width / 2 - box.left - box.width / 2
          : 0,
        y = visible
          ? destination.top + destination.height / 2 - box.top - box.height / 2
          : 30,
        scale = visible
          ? Math.max(
              0.12,
              Math.min(
                0.48,
                destination.width / box.width,
                destination.height / box.height,
              ),
            )
          : 0.9
      layer.style.transformOrigin = `${box.left + box.width / 2}px ${box.top + box.height / 2}px`
      // One opacity owner: show the return path before softly dissolving it.
      animate(
        modal,
        [{ opacity }, { opacity, offset: 0.35 }, { opacity: 0 }],
        360,
        undefined,
        'linear',
      )
      animate(
        layer,
        [
          { transform: 'none', opacity: 1 },
          {
            transform: `translate(${x}px,${y}px) scale(${scale}) rotate(3deg)`,
            opacity: 1,
          },
        ],
        360,
        onClose,
        'cubic-bezier(.4,0,.2,1)',
      )
    }
  }
  return (
    <dialog
      ref={dialog}
      className="metro-visit metro-study"
      data-busy={busy}
      aria-label={`${selected.title} project card`}
      aria-describedby="metro-instructions"
      onCancel={(event) => {
        event.preventDefault()
        depart()
      }}
    >
      <NeighborhoodArtwork />
      <p id="metro-instructions" className="study-sr-only">
        Select outside the card or press Escape to return to the apartment. Use
        the side arrows to choose another project.
      </p>
      <button
        className="metro-dismiss"
        tabIndex={-1}
        aria-label="Close project and return to the apartment"
        disabled={busy}
        onClick={() => depart()}
      />
      <div className="metro-content" ref={content}>
        <NightPass
          key={selected.id}
          selected={selected}
          motion={motion}
          origin={origin}
          entryDirection={direction}
          onDismiss={() => depart()}
          ref={pass}
        />
      </div>
      <nav className="metro-navigation" aria-label="Project cards">
        {([-1, 1] as const).map((step) => (
          <button
            key={step}
            className={`metro-arrow metro-arrow-${step < 0 ? 'previous' : 'next'}`}
            disabled={busy}
            onClick={() => depart(step)}
            aria-label={`${step < 0 ? 'Previous' : 'Next'} project: ${neighbor(step).title}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path
                d={step < 0 ? 'M20 12H4m6-6-6 6 6 6' : 'M4 12h16m-6-6 6 6-6 6'}
              />
            </svg>
          </button>
        ))}
      </nav>
    </dialog>
  )
}
