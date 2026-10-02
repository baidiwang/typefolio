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
import { Reveal } from './reveal/Reveal'
import { Typewriter } from './typewriter/Typewriter'

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
          <Reveal className="intro" onLoad duration={1000}>
            {site.intro}
          </Reveal>

          <Divider />

          <section aria-labelledby="experience-heading">
            <Reveal as="h2" id="experience-heading">
              Experience
            </Reveal>
            <ul className="experience">
              {experience.map((item) => (
                <Reveal as="li" key={item.org}>
                  <strong>{item.org}</strong> — {item.role}
                </Reveal>
              ))}
            </ul>
          </section>

          <Divider />

          <section aria-labelledby="work-heading">
            <Reveal as="h2" id="work-heading">
              Selected work
            </Reveal>
            {featuredProjects.map((project, i) => (
              <Project key={project.id} project={project} index={i} />
            ))}
          </section>

          <Divider />

          <section aria-labelledby="other-heading">
            <Reveal as="h2" id="other-heading">
              Other
            </Reveal>
            <OneLiners items={otherProjects} />
          </section>

          <Divider />

          <section aria-labelledby="games-heading">
            <Reveal as="h2" id="games-heading">
              Games &amp; XR
            </Reveal>
            {gameProjects.map((project, i) => (
              <Project key={project.id} project={project} index={i} />
            ))}
            <OneLiners items={xrProjects} />
          </section>

          <Divider />

          <footer className="signature">
            <Reveal>{site.signature}</Reveal>
            <Reveal>
              <a href={site.links.email.href}>{site.links.email.display}</a>
            </Reveal>
          </footer>
        </main>
      </div>

      <Typewriter />
    </div>
  )
}
