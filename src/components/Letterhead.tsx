import { site } from '../content'
import { ContactLinks } from './ContactLinks'
import { Signature } from './Signature'

/**
 * Stationery at the top of the paper, scrolling away with it (not a sticky
 * web header), from the left text margin: the name, hand-lettered, which
 * writes itself on load, and under it the contact line, printed, visible
 * from the first frame.
 */
export function Letterhead() {
  return (
    <header className="letterhead">
      <Signature as="h1" className="letterhead__name" duration={1000}>
        {site.name}
      </Signature>
      <nav className="letterhead__links" aria-label="Contact">
        <ContactLinks />
      </nav>
    </header>
  )
}
