import { site } from '../content'
import { ContactLinks } from './ContactLinks'
import { Signature } from './Signature'

/**
 * Stationery at the top of the paper, scrolling away with it (not a sticky
 * web header). The name is hand-lettered and writes itself on load; the
 * title and contact links are printed, visible from the first frame.
 */
export function Letterhead() {
  return (
    <header className="letterhead">
      <Signature as="h1" className="letterhead__name" duration={1000}>
        {site.name}
      </Signature>
      <p className="letterhead__title">{site.title}</p>
      <nav className="letterhead__links" aria-label="Contact">
        <ContactLinks />
      </nav>
    </header>
  )
}
