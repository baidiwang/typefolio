import { Divider } from './components/Divider'
import { ExternalLink } from './components/ExternalLink'
import { Letterhead } from './components/Letterhead'
import { OneLiners } from './components/OneLiners'
import { Project } from './components/Project'
import {
  experience,
  featuredProjects,
  gamesNote,
  otherProjects,
  site,
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


          <section aria-labelledby="work-heading">
            <Reveal as="h2" id="work-heading">
              Selected work
            </Reveal>
            {featuredProjects.map((project, i) => (
              <Project key={project.id} project={project} index={i} />
            ))}
          </section>

          <Divider />

          <section aria-labelledby="experience-heading">
            <Reveal as="h2" id="experience-heading">
              Experience
            </Reveal>
            <ul className="experience">
              {experience.map((item) => (
                <Reveal as="li" key={item.org}>
                  <span className="label">{item.org}</span> — {item.role}
                </Reveal>
              ))}
            </ul>
          </section>

          <Divider />

          <section aria-labelledby="other-heading">
            <Reveal as="h2" id="other-heading">
              Other
            </Reveal>
            <OneLiners items={otherProjects} />
          </section>

          <Divider />

          <Reveal mode="lines" className="games-note">
            {gamesNote.before}
            <ExternalLink href={gamesNote.steam.href}>{gamesNote.steam.label}</ExternalLink>
            {gamesNote.middle}
            <ExternalLink href={gamesNote.medium.href}>{gamesNote.medium.label}</ExternalLink>
            {gamesNote.after}
          </Reveal>

          <Divider />

          {/* The page ends like a letter. */}
          <footer className="ending">
            <Reveal mode="lines">{site.ending.closing}</Reveal>
            <Reveal className="ending__signature">{site.ending.signature}</Reveal>
            <Reveal>
              <a href={site.links.email.href}>{site.links.email.display}</a>
            </Reveal>
            <Reveal mode="lines" className="ending__ps">
              {site.ending.ps}
            </Reveal>
          </footer>
        </main>
      </div>

      <Typewriter />
    </div>
  )
}
