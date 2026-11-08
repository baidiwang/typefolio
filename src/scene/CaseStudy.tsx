import { useEffect, useRef } from 'react'
import type { Project } from '../content'
import { windows, windowOrder, xrExperiments } from './projects'
import type { WindowProject } from './projects'

export function ProjectDetail({
  project,
  motion,
  showTitle,
}: {
  project: Project
  motion: boolean
  showTitle: boolean
}) {
  const video = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (!motion) video.current?.pause()
  }, [motion])
  const links = [
    project.links.live && {
      href: project.links.live,
      title: project.links.liveLabel ?? 'Live demo',
    },
    project.links.code && { href: project.links.code, title: 'View code' },
    project.links.writeup && {
      href: project.links.writeup,
      title: 'Read the story',
    },
  ].filter((link): link is { href: string; title: string } => Boolean(link))
  return (
    <section
      className="project-detail"
      id={`case-${project.id}`}
      aria-label={project.title}
    >
      <div
        className={`project-media ${project.id === 'google-play' ? 'project-media--portrait' : ''}`}
      >
        <video
          ref={video}
          key={project.id}
          controls
          autoPlay={motion}
          muted
          loop
          playsInline
          preload="metadata"
          poster={`${project.media.src}.jpg`}
          width={project.media.width}
          height={project.media.height}
          aria-label={project.media.alt}
        >
          {(project.media.formats ?? ['webm', 'mp4']).map((format) => (
            <source
              key={format}
              src={`${project.media.src}.${format}`}
              type={`video/${format}`}
            />
          ))}
          <p>
            Your browser cannot play this video.{' '}
            <a href={`${project.media.src}.mp4`}>Download the demo</a>.
          </p>
        </video>
      </div>
      <div className="project-copy">
        {showTitle && (
          <>
            <h3>{project.title}</h3>
            <p className="project-summary">{project.oneLiner}</p>
          </>
        )}
        {project.body?.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {project.role && (
          <p className="project-role">
            <span>My role</span>
            {project.role}
          </p>
        )}
        <ul className="stack" aria-label="Tools and technologies">
          {project.stack.map((tool) => (
            <li key={tool}>{tool}</li>
          ))}
        </ul>
        {links.length > 0 && (
          <div className="project-links">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.title} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export function CaseStudy({
  selected,
  onClose,
  onNext,
  motion,
}: {
  selected: WindowProject | undefined
  onClose: () => void
  onNext: (project: WindowProject) => void
  motion: boolean
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const scroll = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const modal = dialog.current!
    const scrollToProject = () => {
      const deepLink = selected?.projects.find(
        (project) => `#${project.id}` === location.hash,
      )
      if (deepLink && selected!.projects.length > 1)
        document
          .getElementById(`case-${deepLink.id}`)
          ?.scrollIntoView({ block: 'start', behavior: 'instant' })
    }
    if (selected) {
      if (!modal.open) modal.showModal()
      scroll.current?.scrollTo(0, 0)
      scrollToProject()
    } else if (modal.open) modal.close()
    window.addEventListener('hashchange', scrollToProject)
    return () => window.removeEventListener('hashchange', scrollToProject)
  }, [selected])
  if (!selected) return <dialog ref={dialog} className="case-dialog" />
  const position = windowOrder.indexOf(windows.indexOf(selected))
  return (
    <dialog
      ref={dialog}
      className="case-dialog"
      aria-labelledby="case-title"
      aria-describedby="case-title-description"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="case-paper">
        <nav className="case-nav" aria-label="Project navigation">
          <button autoFocus onClick={onClose}>
            <span aria-hidden="true">←</span> Back to the neighborhood
          </button>
          <button
            onClick={() => onNext(windows[windowOrder[(position + 1) % 6]])}
          >
            Next window <span aria-hidden="true">→</span>
          </button>
        </nav>
        <div className="case-scroll" ref={scroll}>
          <WindowReading selected={selected} motion={motion} />
          <div className="case-end">
            <button onClick={onClose}>
              Back to the street <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

export function WindowReading({
  selected,
  motion,
  headingId = 'case-title',
}: {
  selected: WindowProject
  motion: boolean
  headingId?: string
}) {
  return (
    <>
      <header className="case-heading">
        <h2 id={headingId}>{selected.title}</h2>
        <p id={headingId + '-description'}>{selected.description}</p>
      </header>
      {selected.projects.map((project) => (
        <ProjectDetail
          key={project.id}
          project={project}
          motion={motion}
          showTitle={selected.projects.length > 1}
        />
      ))}
      {selected.article && (
        <section className="article-detail">
          <div className="studio-illustration" aria-hidden="true" />

          <h3>Data visualization at Axios</h3>
          <p>{selected.article.oneLiner}</p>
          <ul className="stack" aria-label="Tools and technologies">
            {selected.article.stack?.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
          <a
            className="article-link"
            href={selected.article.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore the graphics <span aria-hidden="true">↗</span>
          </a>
        </section>
      )}
      {selected.id === 'games' && (
        <aside className="xr-experiments" id="case-xr">
          <h3>XR experiments</h3>

          <div className="project-links">
            {xrExperiments.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.title} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </aside>
      )}
    </>
  )
}
