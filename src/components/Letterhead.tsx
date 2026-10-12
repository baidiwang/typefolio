import { site } from '../content'
import { ContactLinks } from './ContactLinks'
import { Signature } from './Signature'

/** Today, from the visitor's own clock: "October 12, 2026". */
function today() {
  const now = new Date()
  const iso = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
  const text = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  return { iso, text }
}

/**
 * Stationery at the top of the paper, scrolling away with it (not a sticky
 * web header), everything from the left text margin. The name is
 * hand-lettered and writes itself on load. Beside it (stacked under it
 * where there's no room), right-aligned: today's date, then the contact
 * line, both printed, visible from the first frame.
 */
export function Letterhead() {
  const date = today()
  return (
    <header className="letterhead">
      <div className="letterhead__row">
        <Signature as="h1" className="letterhead__name" duration={1000}>
          {site.name}
        </Signature>
        <div className="letterhead__meta">
          <p className="letterhead__date">
            <time dateTime={date.iso}>{date.text}</time>
          </p>
          <nav className="letterhead__links" aria-label="Contact">
            <ContactLinks />
          </nav>
        </div>
      </div>
    </header>
  )
}
