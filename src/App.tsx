import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { createScene } from './scene/engine'
import type { SceneController } from './scene/engine'
import { contact, windows, windowFromHash } from './scene/projects'
import type { WindowProject } from './scene/projects'
import { useSnowAmbience } from './scene/useSnowAmbience'
import { roomImageStyle } from './scene/rooms'
import { MetroVisit } from './scene/MetroVisit'
import { sceneControlPlacement } from './scene/sceneControls'

const PresentationStudies = import.meta.env.DEV
  ? lazy(() =>
      import('./scene/PresentationStudies').then((module) => ({
        default: module.PresentationStudies,
      })),
    )
  : undefined

const preview = import.meta.env.DEV
  ? new URLSearchParams(location.search)
  : new URLSearchParams()

function Icon({
  name,
}: {
  name: 'linkedin' | 'x' | 'sound' | 'pause' | 'play'
}) {
  if (name === 'linkedin')
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96c0 .84.69 1.52 1.55 1.52h16.9c.86 0 1.55-.68 1.55-1.52V3.52c0-.84-.69-1.52-1.55-1.52ZM7.93 18.75H4.98V9.2h2.95v9.55ZM6.45 7.9a1.71 1.71 0 1 1 0-3.42 1.71 1.71 0 0 1 0 3.42Zm12.3 10.85H15.8V14.1c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.21-1.79 2.46v4.73H9.51V9.2h2.83v1.31h.04c.39-.74 1.36-1.52 2.79-1.52 2.98 0 3.58 1.96 3.58 4.51v5.25Z" />
      </svg>
    )
  if (name === 'x')
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-7.4L5.6 22H2.46l7.91-9.04L.8 2h6.4l4.42 6.75L18.9 2Zm-1.1 18h1.73L6.25 3.89H4.39L17.8 20Z" />
      </svg>
    )
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'sound' ? (
        <>
          <path d="m11 5-6 4H2v6h3l6 4V5Z" />
          <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
        </>
      ) : name === 'pause' ? (
        <>
          <path d="M8 5v14M16 5v14" />
        </>
      ) : (
        <path d="m8 4 12 8-12 8V4Z" />
      )}
    </svg>
  )
}

export default function App() {
  if (PresentationStudies && preview.has('study'))
    return (
      <Suspense fallback={<p>Loading preview…</p>}>
        <PresentationStudies />
      </Suspense>
    )
  return <Portfolio />
}

function Portfolio() {
  const scene = useRef<HTMLDivElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const home = useRef<HTMLElement>(null)
  const controller = useRef<SceneController | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const cameFromHome = useRef(false)
  const pointer = useRef('mouse')
  const toastTimer = useRef(0)
  const [selected, setSelected] = useState(() => windowFromHash(location.hash))
  const [active, setActive] = useState<number | null>(null)
  const [armed, setArmed] = useState<number | null>(null)
  const [paused, setPaused] = useState(
    () =>
      preview.has('still') ||
      matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [message, setMessage] = useState('')
  const [copyFallback, setCopyFallback] = useState(false)
  const [wing, setWing] = useState(0)
  const [ready, setReady] = useState(false)
  const announce = useCallback((text: string) => {
    setMessage(text)
    clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setMessage(''), 4500)
  }, [])
  const ambience = useSnowAmbience(Boolean(selected), announce)

  useEffect(() => {
    const place = () => {
      const el = home.current!,
        view = el.getBoundingClientRect(),
        world = scene.current!.getBoundingClientRect()
      const placement = sceneControlPlacement(view.width, {
        left: world.left - view.left,
        right: world.right - view.left,
        top: world.top - view.top,
        height: world.height,
      })
      el.dataset.controls = placement.mode
      el.style.setProperty('--wall-left', `${placement.left}px`)
      el.style.setProperty('--wall-right', `${placement.right}px`)
      el.style.setProperty('--wall-top', `${placement.top}px`)
    }
    const observer = new ResizeObserver(place)
    observer.observe(scene.current!)
    window.addEventListener('resize', place)
    place()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', place)
    }
  }, [])

  useEffect(() => {
    const engine = createScene(scene.current!, announce)
    controller.current = engine
    // A read-only snapshot is useful for local animation and route verification.
    if (import.meta.env.DEV)
      Object.assign(scene.current!, { sceneSnapshot: engine.snapshot })
    return () => {
      engine.dispose()
      clearTimeout(toastTimer.current)
    }
  }, [announce])
  useEffect(() => {
    controller.current?.setRunning(!paused && !selected)
  }, [paused, selected])
  useEffect(() => {
    controller.current?.setActive(active)
  }, [active])
  useEffect(() => {
    if (active === null) return
    let frame = 0
    const reveal = (event?: Event) => {
      if (
        !matchMedia(
          '(max-width: 640px), (max-width: 1000px) and (orientation: portrait)',
        ).matches
      )
        return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const view = viewport.current!
        const room = scene.current!.querySelector<HTMLElement>(
          `[data-window="${active}"]`,
        )!
        const caption = room.querySelector<HTMLElement>('.room-caption')!
        const bounds = view.getBoundingClientRect(),
          r = room.getBoundingClientRect(),
          c = caption.getBoundingClientRect()
        const left = Math.min(r.left, c.left),
          right = Math.max(r.right, c.right)
        if (left < bounds.left + 8 || right > bounds.right - 8) {
          view.scrollTo({
            left:
              view.scrollLeft + (left + right - bounds.left - bounds.right) / 2,
            behavior: paused || event?.type === 'resize' ? 'instant' : 'smooth',
          })
        }
      })
    }
    reveal()
    window.addEventListener('resize', reveal)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', reveal)
    }
  }, [active, paused])
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => {
      if (media.matches) setPaused(true)
    }
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  useEffect(() => {
    const sync = () => {
      const project = windowFromHash(location.hash)
      cameFromHome.current = Boolean(project && history.state?.portfolioProject)
      setSelected(project)
    }
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])
  useEffect(() => {
    home.current!.inert = Boolean(selected)
    if (selected) {
      returnFocus.current = scene.current!.querySelector<HTMLAnchorElement>(
        `[data-window="${windows.indexOf(selected)}"]`,
      )
    }
    document.title = selected
      ? `${selected.title} · Baidi Wang`
      : 'Baidi Wang · design engineer based in NYC'
    if (!selected && returnFocus.current)
      returnFocus.current.focus({ preventScroll: true })
  }, [selected])
  const openProject = (event: MouseEvent<HTMLAnchorElement>, index: number) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    if (pointer.current === 'touch' && armed !== index && event.detail !== 0) {
      setArmed(index)
      setActive(index)
      return
    }
    setArmed(null)
    setActive(index)
    returnFocus.current = event.currentTarget
    cameFromHome.current = true
    history.pushState({ portfolioProject: true }, '', `#${windows[index].id}`)
    setSelected(windows[index])
  }
  const closeProject = () => {
    if (cameFromHome.current) {
      cameFromHome.current = false
      history.back()
    } else {
      history.replaceState(null, '', location.pathname + location.search)
      setSelected(undefined)
    }
  }
  const nextProject = (project: WindowProject) => {
    history.replaceState(history.state, '', `#${project.id}`)
    const index = windows.indexOf(project)
    returnFocus.current = scene.current!.querySelector<HTMLAnchorElement>(
      `[data-window="${index}"]`,
    )
    returnFocus.current?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: 'instant',
    })
    setActive(index)
    setSelected(project)
  }
  const copyEmail = async () => {
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(contact.contactEmail)
      setCopyFallback(false)
      announce('Email copied')
    } catch {
      setCopyFallback(true)
      announce('Copy unavailable. Select the address to copy it.')
    }
  }
  const pan = (direction: number) => {
    const element = viewport.current!
    element.scrollTo({
      left: direction === 0 ? 0 : element.scrollWidth,
      behavior: paused ? 'instant' : 'smooth',
    })
  }
  const roomStyle = (index: number): CSSProperties => {
    const { x, y, w, h } = windows[index].rect
    return {
      left: `${(x / 1536) * 100}%`,
      top: `${(y / 1024) * 100}%`,
      width: `${(w / 1536) * 100}%`,
      height: `${(h / 1024) * 100}%`,
    }
  }
  return (
    <>
      <main
        className={`neighborhood ${paused ? 'motion-paused' : ''}`}
        data-typeface={preview.get('type') === 'manrope' ? 'manrope' : 'henny'}
        ref={home}
        aria-label="Baidi Wang's illustrated portfolio"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setArmed(null)
            setActive(null)
            setCopyFallback(false)
          }
        }}
      >
        <a
          className="skip-link"
          href={`#${windows[0].id}`}
          onClick={(event) => openProject(event, 0)}
        >
          Explore the projects
        </a>
        <header className="identity">
          <h1>Baidi Wang</h1>
          <p>design engineer based in NYC</p>
        </header>
        <canvas className="chimney-canvas" aria-hidden="true" />
        <div
          className="scene-viewport"
          ref={viewport}
          onScroll={() => {
            const el = viewport.current!
            setWing(
              el.scrollLeft > (el.scrollWidth - el.clientWidth) / 2 ? 1 : 0,
            )
          }}
          onClick={(event) => {
            if (!(event.target as HTMLElement).closest('.room')) {
              setActive(null)
              setArmed(null)
            }
          }}
        >
          <div
            className={`scene-world ${ready ? 'is-ready' : ''} ${paused ? 'is-paused' : ''}`}
            ref={scene}
          >
            <div className="scene-surround" aria-hidden="true" />
            <img
              className="scene-image"
              src="/scene/city-resume-usps.webp"
              width="1536"
              height="1024"
              fetchPriority="high"
              alt="A snowy New York night. Six warm apartment windows surround a courtyard tree. A résumé shop and a USPS storefront overlook a crossing between two sidewalks."
              onLoad={() => setReady(true)}
            />
            <div className="street-layer" aria-hidden="true">
              <canvas className="street-canvas" />
            </div>
            {windows.map((project, index) => (
              <div
                key={project.id}
                className={`room ${active === index ? 'is-active' : ''} ${index < 3 ? 'room--west' : 'room--east'} ${index === 0 ? 'room--intro' : ''}`}
                style={roomStyle(index)}
                onMouseEnter={() => {
                  controller.current?.setActive(index, true)
                  setActive(index)
                }}
                onPointerMove={(event) => {
                  if (paused || event.pointerType !== 'mouse') return
                  const element = event.currentTarget
                  const bounds = element.getBoundingClientRect()
                  const x = Math.max(
                    -1,
                    Math.min(
                      1,
                      ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
                    ),
                  )
                  const y = Math.max(
                    -1,
                    Math.min(
                      1,
                      ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
                    ),
                  )
                  element.style.setProperty('--paper-turn', `${x * 1.4}deg`)
                  element.style.setProperty('--paper-shift', `${y * 3}px`)
                }}
                onMouseLeave={() => {
                  const element =
                    scene.current?.querySelectorAll<HTMLElement>('.room')[index]
                  element?.style.removeProperty('--paper-turn')
                  element?.style.removeProperty('--paper-shift')
                  if (
                    armed === null &&
                    !scene.current
                      ?.querySelector(`[data-window="${index}"]`)
                      ?.matches(':focus-visible')
                  )
                    setActive(null)
                }}
              >
                <div className="room-visual">
                  <img
                    className="room-patch"
                    src="/scene/city-resume-usps.webp"
                    alt=""
                    style={roomImageStyle(project.scene, project.rect)}
                  />
                  <canvas className="resident-canvas" aria-hidden="true" />
                </div>
                <a
                  href={`#${project.id}`}
                  className="room-enter"
                  data-window={index}
                  aria-label={`View ${project.title}. ${project.description}`}
                  onPointerDown={(event) => {
                    pointer.current = event.pointerType
                  }}
                  onFocus={() => {
                    controller.current?.setActive(index)
                    setActive(index)
                    if (matchMedia('(max-width: 640px)').matches)
                      scene.current
                        ?.querySelector(`[data-window="${index}"]`)
                        ?.scrollIntoView({ block: 'nearest', inline: 'center' })
                  }}
                  onBlur={() => {
                    if (armed === null) setActive(null)
                  }}
                  onClick={(event) => openProject(event, index)}
                >
                  <span className="room-caption">
                    <strong>{project.title}</strong>
                    <span className="caption-description">
                      {project.caption}
                    </span>
                  </span>
                </a>
              </div>
            ))}
            <canvas className="cat-canvas" aria-hidden="true" />
            <button
              className="cat-trigger illustrated-target"
              aria-label="Say hello to the cat"
              onClick={() => controller.current?.greetCat()}
            >
              <span className="scene-tooltip">Say hello to the cat</span>
            </button>
            <button
              className="cross-trigger illustrated-target"
              aria-label="Watch out for traffic"
              onClick={() => controller.current?.requestCrossing()}
            >
              <span className="scene-tooltip">Watch out for traffic</span>
            </button>
            <a
              className="storefront bookstore illustrated-target"
              href={contact.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View résumé (PDF, opens in a new tab)"
            >
              <span className="scene-tooltip">
                View résumé <span aria-hidden="true">↗</span>
              </span>
            </a>
            <button
              className="storefront post-office illustrated-target"
              aria-label={`Copy email: ${contact.contactEmail}`}
              onClick={() => void copyEmail()}
            >
              <span className="scene-tooltip">
                Copy email <small>{contact.contactEmail}</small>
              </span>
            </button>
            <canvas className="snow-canvas" aria-hidden="true" />
          </div>
        </div>
        <div
          className="mobile-camera"
          role="group"
          aria-label="Explore both sides of the street"
        >
          <button
            aria-label="Explore the west apartments"
            aria-pressed={wing === 0}
            onClick={() => pan(0)}
          >
            ← <span>West</span>
          </button>
          <span className="camera-track" aria-hidden="true">
            <i className={wing === 0 ? 'is-current' : ''} />
            <i className={wing === 1 ? 'is-current' : ''} />
          </span>
          <button
            aria-label="Explore the east apartments"
            aria-pressed={wing === 1}
            onClick={() => pan(1)}
          >
            <span>East</span> →
          </button>
        </div>
        <footer className="scene-footer">
          <div className="scene-controls">
            <button
              aria-label={
                ambience.on ? 'Turn snow sound off' : 'Turn snow sound on'
              }
              aria-pressed={ambience.on}
              onClick={() => void ambience.toggle()}
            >
              <Icon name="sound" />
              <span className="control-tooltip">
                Snow sound {ambience.on ? 'off' : 'on'}
              </span>
            </button>
            <button
              aria-label={paused ? 'Resume motion' : 'Pause motion'}
              aria-pressed={paused}
              onClick={() => setPaused(!paused)}
            >
              <Icon name={paused ? 'play' : 'pause'} />
              <span className="control-tooltip">
                {paused ? 'Resume motion' : 'Pause motion'}
              </span>
            </button>
          </div>
          <div className="social-links">
            <a
              href={contact.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn (opens in a new tab)"
            >
              <Icon name="linkedin" />
              <span className="social-tooltip">LinkedIn</span>
            </a>
            {contact.xUrl && (
              <a
                href={contact.xUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (opens in a new tab)"
              >
                <Icon name="x" />
                <span className="social-tooltip">X</span>
              </a>
            )}
          </div>
        </footer>
        {copyFallback && (
          <div
            className="copy-fallback"
            role="region"
            aria-label="Copy email manually"
          >
            <p>Copy unavailable. Select the address to copy it.</p>
            <input
              aria-label="Email address"
              readOnly
              value={contact.contactEmail}
              onFocus={(event) => event.target.select()}
            />
            <button onClick={() => setCopyFallback(false)}>Close</button>
          </div>
        )}
        <div
          className={`toast ${message ? 'is-visible' : ''}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {message}
        </div>
      </main>
      {selected && (
        <MetroVisit
          selected={selected}
          motion={!paused}
          onClose={closeProject}
          onNext={nextProject}
          origin={() =>
            scene.current
              ?.querySelector(`[data-window="${windows.indexOf(selected)}"]`)
              ?.getBoundingClientRect()
          }
        />
      )}
    </>
  )
}
