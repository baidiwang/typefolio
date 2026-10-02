import { site } from '../content'

/**
 * Printed on the paper; scrolls away with it. Not a sticky web header.
 * Only the email lives here: Resume / LinkedIn / GitHub are typewriter keys.
 */
export function Letterhead() {
  const { name, title, links } = site

  return (
    <header className="letterhead">
      <h1 className="letterhead__name">{name}</h1>
      <p className="letterhead__title">{title}</p>
      <p className="letterhead__contact">
        <a href={links.email.href}>{links.email.display}</a>
      </p>
    </header>
  )
}
