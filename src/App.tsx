import { Letterhead } from './components/Letterhead'
import { ProjectCard } from './components/ProjectCard'
import {
  experience,
  featuredProjects,
  otherProjects,
  site,
} from './content'

export default function App() {
  return (
    <div className="page" id="top">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Letterhead />

      <main id="main" className="sheet">
        <p className="positioning">{site.positioning}</p>

        <section className="block" aria-labelledby="featured-heading">
          <h2 id="featured-heading" className="block__title">
            Featured work
          </h2>
          <div className="project-list">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>

        <section className="block" aria-labelledby="experience-heading">
          <h2 id="experience-heading" className="block__title">
            Experience
          </h2>
          <ul className="experience-list">
            {experience.map((item) => (
              <li key={item.org} className="experience-item">
                <div className="experience-item__head">
                  <span className="experience-item__org">{item.org}</span>
                  <span className="experience-item__sep" aria-hidden="true">
                    ·
                  </span>
                  <span className="experience-item__role">{item.role}</span>
                </div>
                <p className="experience-item__detail">{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="block" aria-labelledby="other-heading">
          <h2 id="other-heading" className="block__title">
            Other
          </h2>
          <ul className="other-list">
            {otherProjects.map((item) => (
              <li key={item.id} className="other-item">
                <div className="other-item__title">
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )}
                </div>
                <p className="other-item__one-liner">{item.oneLiner}</p>
              </li>
            ))}
          </ul>
        </section>

        <footer className="signature">
          <p className="signature__closing">{site.signature.closing}</p>
          <p className="signature__note">{site.signature.note}</p>
          <p className="signature__email">
            <a href={site.links.email.href}>{site.links.email.display}</a>
          </p>
        </footer>
      </main>
    </div>
  )
}
