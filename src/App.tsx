import { Fragment } from 'react'
import { Divider } from './components/Divider'
import { ExternalLink } from './components/ExternalLink'
import { Letterhead } from './components/Letterhead'
import { OneLiners } from './components/OneLiners'
import { Project } from './components/Project'
import { Signature } from './components/Signature'
import { featuredProjects, gameProjects, otherProjects, site, xrExperiments } from './content'
import { useHashScroll } from './hooks/useHashScroll'
import { useHighlighterSwipe } from './hooks/useHighlighterSwipe'
import { Reveal } from './reveal/Reveal'
import { Typewriter } from './typewriter/Typewriter'

/** Joins a line's last two words with a no-break space, so a sentence that
 *  wraps never leaves one word alone on its last line. */
const keepLastTwo = (line: string) => line.replace(/ (\S+)$/, '\u00a0$1')

export default function App() {
  useHashScroll()
  useHighlighterSwipe()

  return (
    <div className="desk">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {/* Fixed to the bottom of the screen; first in the DOM so its bell
          (the sound toggle) comes right after the skip link. */}
      <Typewriter />

      <div className="paper" id="top">
        <Letterhead />

        <main id="main" className="sheet">
          <div className="intro">
            {site.intro.map((line) => (
              <Reveal key={line} onLoad duration={450}>
                {keepLastTwo(line)}
              </Reveal>
            ))}
          </div>

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
              Data visualization
            </Reveal>
            <OneLiners items={otherProjects} />
          </section>

          <Divider variant={2} />

          <section aria-labelledby="games-heading">
            <Reveal as="h2" id="games-heading">
              Games &amp; XR
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

          {/* The page ends like a letter: closing, sign-off, signature. */}
          <footer className="ending">
            <Reveal mode="lines">
              {site.ending.closing}{' '}
              <a href={site.links.email.href}>{site.links.email.display}</a>
            </Reveal>
            <Reveal className="ending__signoff">{site.ending.signOff}</Reveal>
            <Signature className="ending__signature" duration={700}>
              {site.ending.signature}
            </Signature>
          </footer>
        </main>
      </div>
    </div>
  )
}
