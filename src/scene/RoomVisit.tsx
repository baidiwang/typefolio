import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { WindowProject } from './projects'
import { windows, windowOrder } from './projects'
import { WindowReading } from './CaseStudy'
import { RoomArtwork, ResidentVignette } from './RoomArtwork'
import { roomObjects } from './roomObjects'
import { roomFit } from './rooms'
import { createVisitMotion } from './visitMotion'
import './room-visit.css'

type Box = { left: number; top: number; width: number; height: number }
const easing = 'cubic-bezier(0.16, 1, 0.3, 1)'
const between = (from: Box, to: Box) =>
  `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`
const current = (el: HTMLElement) => {
  const s = getComputedStyle(el)
  return {
    transform: s.transform,
    opacity: s.opacity,
    filter: s.filter,
    clipPath: s.clipPath,
  }
}

export function RoomVisit({
  selected,
  origin,
  onClose,
  onNext,
  motion,
}: {
  selected: WindowProject
  origin: () => DOMRect | undefined
  onClose: () => void
  onNext: (next: WindowProject) => void
  motion: boolean
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    entry = useRef<HTMLDivElement>(null),
    atmosphere = useRef<HTMLDivElement>(null),
    object = useRef<HTMLDivElement>(null),
    body = useRef<HTMLDivElement>(null),
    cast = useRef<HTMLDivElement>(null),
    back = useRef<HTMLButtonElement>(null)
  const currentMotion = useRef(motion),
    syncTransition = useRef<() => void>(() => {})
  const leave = useRef<(action?: () => void) => void>(() => {})
  const [ready, setReady] = useState(false),
    [step, setStep] = useState(0),
    [activePage, setActivePage] = useState('')
  const [visit] = useState(() => ({ selected, origin, onClose }))
  const profile = roomObjects[selected.scene]
  useLayoutEffect(() => {
    const { selected, origin, onClose } = visit
    const profile = roomObjects[selected.scene],
      fit = roomFit(selected.scene, selected.rect)
    const modal = dialog.current!,
      scene = entry.current!,
      backdrop = atmosphere.current!,
      paper = object.current!,
      content = body.current!
    const guests = Array.from(
      cast.current!.querySelectorAll<HTMLElement>('.room-guest'),
    )
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const reduced = () => !currentMotion.current || media.matches
    const transitions = createVisitMotion({
      hidden: () => document.hidden,
      reduced,
    })
    let closing = false,
      needsLayout = false
    modal.showModal()
    const geometry = () => {
      const page = paper.getBoundingClientRect(),
        vw = modal.clientWidth,
        vh = modal.clientHeight
      const width =
          Math.max(vw, (vh * selected.rect.w) / selected.rect.h) * 1.04,
        height = (width * selected.rect.h) / selected.rect.w
      const x = fit.x + (profile.anchor.x + profile.anchor.w / 2) * fit.scale,
        y = fit.y + (profile.anchor.y + profile.anchor.h / 2) * fit.scale
      const target = {
        left: page.left + page.width / 2 - (x / selected.rect.w) * width,
        top: page.top + page.height * 0.46 - (y / selected.rect.h) * height,
        width,
        height,
      }
      Object.assign(scene.style, {
        left: `${target.left}px`,
        top: `${target.top}px`,
        width: `${width}px`,
        height: `${height}px`,
      })
      // Depth backdrop fills the viewport; focal-camera offsets must never
      // reveal the street or its controls around the resident compositions.
      Object.assign(backdrop.style, {
        left: '0px',
        top: '0px',
        width: `${vw}px`,
        height: `${vh}px`,
      })
      const inRoom = (r: { x: number; y: number; w: number; h: number }) => ({
        left:
          target.left + ((fit.x + r.x * fit.scale) / selected.rect.w) * width,
        top:
          target.top + ((fit.y + r.y * fit.scale) / selected.rect.h) * height,
        width: ((r.w * fit.scale) / selected.rect.w) * width,
        height: ((r.h * fit.scale) / selected.rect.h) * height,
      })
      const source = origin(),
        start = source?.width ? source : target
      return {
        roomStart: between(start, target),
        paperStart: between(inRoom(profile.anchor), page),
        guestStarts: guests.map((guest, i) =>
          between(
            inRoom(profile.guests[i].crop),
            guest.getBoundingClientRect(),
          ),
        ),
      }
    }
    let geometryNow = geometry()
    const animate = (
      el: HTMLElement,
      frames: Keyframe[],
      duration: number,
      delay = 0,
      complete?: () => void,
    ) => {
      const a = el.animate(frames, {
        duration,
        delay,
        easing,
        fill: 'both',
      })
      transitions.track(a, () => {
        const end = frames[frames.length - 1]
        for (const key of [
          'transform',
          'opacity',
          'filter',
          'clipPath',
        ] as const) {
          const value = end[key]
          if (typeof value === 'string' || typeof value === 'number')
            el.style[key] = String(value)
        }
        complete?.()
      })
    }
    animate(
      scene,
      [{ transform: geometryNow.roomStart }, { transform: 'none' }],
      800,
    )
    animate(scene, [{ opacity: 1 }, { opacity: 0 }], 360, 480)
    animate(backdrop, [{ opacity: 0 }, { opacity: 1 }], 500, 350)
    guests.forEach((guest, i) =>
      animate(
        guest,
        [
          { transform: geometryNow.guestStarts[i], opacity: 0 },
          { opacity: 1, offset: 0.2 },
          { transform: 'none', opacity: 1 },
        ],
        700,
        440,
      ),
    )
    animate(
      paper,
      [
        { transform: geometryNow.paperStart, opacity: 0 },
        { opacity: 1, offset: 0.1 },
        { transform: 'none', opacity: 1 },
      ],
      660,
      570,
    )
    animate(
      content,
      [
        { opacity: 0, clipPath: 'inset(0 0 100% 0)' },
        { opacity: 1, clipPath: 'inset(0)' },
      ],
      300,
      1000,
      () => {
        if (!closing) {
          setReady(true)
          back.current?.focus({ preventScroll: true })
        }
      },
    )
    leave.current = (action = onClose) => {
      if (closing) return
      closing = true
      if (reduced() && !document.hidden) {
        action()
        return
      }
      const sceneNow = current(scene),
        paperNow = current(paper),
        bodyNow = current(content),
        backdropNow = current(backdrop),
        guestNow = guests.map(current)
      transitions.cancel()
      setReady(false)
      content.querySelectorAll('video').forEach((video) => video.pause())
      animate(
        content,
        [bodyNow, { opacity: 0, clipPath: bodyNow.clipPath }],
        140,
      )
      animate(
        paper,
        [paperNow, { transform: geometryNow.paperStart, opacity: 0 }],
        360,
      )
      guests.forEach((guest, i) =>
        animate(
          guest,
          [guestNow[i], { transform: geometryNow.guestStarts[i], opacity: 0 }],
          460,
        ),
      )
      animate(
        scene,
        [
          sceneNow,
          { opacity: 1, offset: 0.12 },
          { transform: geometryNow.roomStart, opacity: 1 },
        ],
        680,
        0,
        action,
      )
      animate(backdrop, [backdropNow, { opacity: 0 }], 400, 100)
    }
    const finish = () => {
      if (closing) return
      transitions.cancel()
      geometryNow = geometry()
      scene.style.opacity = '0'
      scene.style.transform = 'none'
      backdrop.style.opacity = '1'
      paper.style.opacity = '1'
      paper.style.transform = 'none'
      content.style.opacity = '1'
      content.style.clipPath = 'inset(0)'
      guests.forEach((g) => {
        g.style.transform = 'none'
        g.style.opacity = '1'
      })
      setReady(true)
    }
    const resize = () => {
      if (document.hidden) needsLayout = true
      else finish()
    }
    const sync = () => {
      if (!document.hidden && needsLayout && !closing) {
        needsLayout = false
        finish()
      } else transitions.sync()
    }
    syncTransition.current = sync
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', sync)
    media.addEventListener('change', sync)
    return () => {
      syncTransition.current = () => {}
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', sync)
      media.removeEventListener('change', sync)
      transitions.cancel()
      if (modal.open) modal.close()
    }
  }, [visit])
  useLayoutEffect(() => {
    currentMotion.current = motion
    syncTransition.current()
  }, [motion])
  useEffect(() => {
    if (!ready || !motion) return
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    let timer = 0
    const sync = () => {
      clearInterval(timer)
      if (!document.hidden && !media.matches)
        timer = window.setInterval(() => setStep((s) => s + 1), 950)
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    media.addEventListener('change', sync)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', sync)
      media.removeEventListener('change', sync)
    }
  }, [ready, motion])
  const scrollTo = (id: string) => {
    const node = body.current?.querySelector<HTMLElement>(`#case-${id}`)
    if (node) {
      body.current!.scrollTo({
        top: Math.max(0, node.offsetTop - 24),
        behavior: 'instant',
      })
      setActivePage(id)
    }
  }
  useEffect(() => {
    if (!ready) return
    const deep = () => {
      const project = selected.projects.find(
        (p) => `#${p.id}` === location.hash,
      )
      if (project && selected.projects.length > 1) scrollTo(project.id)
    }
    deep()
    window.addEventListener('hashchange', deep)
    return () => window.removeEventListener('hashchange', deep)
  }, [ready, selected])
  const page = (id: string) => {
    scrollTo(id)
    history.replaceState(history.state, '', `#${id === 'xr' ? 'games' : id}`)
  }
  const index = windowOrder.indexOf(windows.indexOf(selected)),
    next = windows[windowOrder[(index + 1) % windows.length]]
  return (
    <dialog
      ref={dialog}
      className={`room-visit visit-${selected.scene}`}
      aria-label={`${selected.title} project`}
      onCancel={(e) => {
        e.preventDefault()
        leave.current()
      }}
    >
      <div
        ref={entry}
        className="visit-entry-room room-view"
        aria-hidden="true"
      >
        <RoomArtwork entry={selected} />
      </div>
      <div
        ref={atmosphere}
        className="visit-atmosphere room-view"
        aria-hidden="true"
      >
        <RoomArtwork entry={selected} residents={false} />
      </div>
      <div className="room-cast" ref={cast} aria-hidden="true">
        {profile.guests.map((guest) => (
          <div
            key={guest.id}
            data-guest={guest.id}
            className={`room-guest guest-${guest.id} guest-${guest.side}`}
            style={{ aspectRatio: `${guest.crop.w}/${guest.crop.h}` }}
          >
            <ResidentVignette entry={selected} crop={guest.crop} step={step} />
          </div>
        ))}
      </div>
      <nav className="visit-navigation" aria-label="Project navigation">
        <button ref={back} onClick={() => leave.current()}>
          ← Back to the street
        </button>
        <button onClick={() => leave.current(() => onNext(next))}>
          Next room →
        </button>
      </nav>
      <div
        className={`room-object surface-${profile.surface}`}
        ref={object}
        aria-busy={!ready}
      >
        <div className="object-decoration" aria-hidden="true" />
        {selected.projects.length > 1 && (
          <nav className="object-index" aria-label="Projects in this room">
            {selected.projects.map((p, i) => (
              <button
                key={p.id}
                aria-current={
                  activePage === p.id || (!activePage && i === 0)
                    ? 'page'
                    : undefined
                }
                onClick={() => page(p.id)}
              >
                {p.title}
              </button>
            ))}
            {selected.id === 'games' && (
              <button
                aria-current={activePage === 'xr' ? 'page' : undefined}
                onClick={() => page('xr')}
              >
                XR experiments
              </button>
            )}
          </nav>
        )}
        <div className="object-body" ref={body} inert={!ready}>
          <WindowReading
            selected={selected}
            motion={false}
            headingId="object-title"
          />
        </div>
      </div>
    </dialog>
  )
}
