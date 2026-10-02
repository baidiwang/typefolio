import { Divider } from './components/Divider'
import { Letterhead } from './components/Letterhead'
import { OneLiners } from './components/OneLiners'
import { Project } from './components/Project'
import {
  experience,
  featuredProjects,
  gameProjects,
  otherProjects,
  site,
  xrProjects,
} from './content'
import { useHashScroll } from './hooks/useHashScroll'

export default function App() {
  useHashScroll()

  return (
    <div className="desk">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <div className="paper" id="top">
        <Letterhead />

        <main id="main" className="sheet">
          <p className="intro">{site.intro}</p>

          <Divider />

          <section aria-labelledby="experience-heading">
            <h2 id="experience-heading">Experience</h2>
            <ul className="experience">
              {experience.map((item) => (
                <li key={item.org}>
                  <strong>{item.org}</strong> — {item.role}
                </li>
              ))}
            </ul>
          </section>

          <Divider />

          <section aria-labelledby="work-heading">
            <h2 id="work-heading">Selected work</h2>
            {featuredProjects.map((project, i) => (
              <Project key={project.id} project={project} index={i} />
            ))}
          </section>

          <Divider />

          <section aria-labelledby="other-heading">
            <h2 id="other-heading">Other</h2>
            <OneLiners items={otherProjects} />
          </section>

          <Divider />

          <section aria-labelledby="games-heading">
            <h2 id="games-heading">Games &amp; XR</h2>
            {gameProjects.map((project, i) => (
              <Project key={project.id} project={project} index={i} />
            ))}
            <OneLiners items={xrProjects} />
          </section>

          <Divider />

          <footer className="signature">
            <p>{site.signature}</p>
            <p>
              <a href={site.links.email.href}>{site.links.email.display}</a>
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
