import { site } from '../content'
import { ContactLinks } from './ContactLinks'

/**
 * Printed on the paper (stationery, so it's visible from the first frame,
 * not typed) and scrolls away with it. Not a sticky web header.
 */
export function Letterhead() {
  return (
    <header className="letterhead">
      <h1 className="letterhead__name">{site.name}</h1>
      <p className="letterhead__title">{site.title}</p>
      <nav className="letterhead__links" aria-label="Contact">
        <ContactLinks />
      </nav>
    </header>
  )
}
