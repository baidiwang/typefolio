import { Fragment } from 'react'
import { Divider } from './components/Divider'
import { ExternalLink } from './components/ExternalLink'
import { Letterhead } from './components/Letterhead'
import { OneLiners } from './components/OneLiners'
import { Project } from './components/Project'
import { SoundToggle } from './components/SoundToggle'
import { featuredProjects, gameProjects, otherProjects, site, xrExperiments } from './content'
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

      <SoundToggle />

      <div className="paper" id="top">
        <Letterhead />

        <main id="main" className="sheet">
          <Reveal className="intro" onLoad duration={1000}>
            {site.intro}
          </Reveal>

          <Divider variant={0} />

          <section aria-labelledby="work-heading">
            <Reveal as="h2" id="work-heading">
              Selected work
            </Reveal>
            {featuredProjects.map((project, i) => (
              <Project key={project.id} project={project} index={i} />
            ))}
          </section>

          <Divider variant={1} />

          <section aria-labelledby="other-heading">
            <Reveal as="h2" id="other-heading">
              Other
            </Reveal>
            <OneLiners items={otherProjects} />
          </section>

          <Divider variant={2} />

          <section aria-labelledby="games-heading">
            <Reveal as="h2" id="games-heading">
              Games &amp; 3D
            </Reveal>
            {gameProjects.map((project, i) => (
              <Project key={project.id} project={project} index={i} />
            ))}
            <Reveal className="xr-note">
              {xrExperiments.label}{' '}
              {xrExperiments.links.map((link, i) => (
                <Fragment key={link.href}>
                  {i > 0 && <span aria-hidden="true"> · </span>}
                  <ExternalLink href={link.href}>{link.title} ↗</ExternalLink>
                </Fragment>
              ))}
            </Reveal>
          </section>

          <Divider variant={3} />

          {/* The page ends like a letter: closing, then the signature. */}
          <footer className="ending">
            <Reveal mode="lines">
              {site.ending.closing}{' '}
              <a href={site.links.email.href}>{site.links.email.display}</a>
            </Reveal>
            <Reveal className="ending__signature">{site.ending.signature}</Reveal>
          </footer>
        </main>
      </div>

      <Typewriter />
    </div>
  )
}
