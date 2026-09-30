import { useEffect, useId, useState } from 'react'
import type { FeaturedProject } from '../content'

type Props = {
  project: FeaturedProject
}

export function ProjectCard({ project }: Props) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const buttonId = useId()

  useEffect(() => {
    const syncFromHash = () => {
      if (window.location.hash === `#${project.anchor}`) {
        setOpen(true)
      }
    }
    syncFromHash()
    window.addEventListener('hashchange', syncFromHash)
    return () => window.removeEventListener('hashchange', syncFromHash)
  }, [project.anchor])

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev
      if (next) {
        history.replaceState(null, '', `#${project.anchor}`)
      } else if (window.location.hash === `#${project.anchor}`) {
        history.replaceState(null, '', window.location.pathname + window.location.search)
      }
      return next
    })
  }

  return (
    <article
      id={project.anchor}
      className={`project-card${open ? ' project-card--open' : ''}`}
    >
      <div className="project-card__summary">
        <div className="project-card__meta">
          <h3 className="project-card__title">
            <button
              type="button"
              id={buttonId}
              className="project-card__toggle"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={toggle}
            >
              <span className="project-card__title-text">{project.title}</span>
              <span className="project-card__chevron" aria-hidden="true">
                {open ? '−' : '+'}
              </span>
            </button>
          </h3>
          <p className="project-card__role">{project.role}</p>
          <p className="project-card__one-liner">{project.oneLiner}</p>
        </div>
        <div className="project-card__media" aria-label="Project media placeholder">
          <span className="project-card__media-note">{project.mediaNote}</span>
        </div>
      </div>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
        className="project-card__panel"
      >
        {project.sections.map((section) => (
          <section key={section.id} className="project-section">
            <h4 className="project-section__title">{section.title}</h4>
            <p className="project-section__body">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  )
}
