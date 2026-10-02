import { site } from '../content'
import { ExternalLink } from './ExternalLink'

/** Printed on the paper; scrolls away with it. Not a sticky web header. */
export function Letterhead() {
  const { name, title, links } = site

  return (
    <header className="letterhead">
      <h1 className="letterhead__name">{name}</h1>
      <p className="letterhead__title">{title}</p>
      <nav className="letterhead__contact" aria-label="Contact">
        <a href={links.resume.href}>{links.resume.label}</a>
        <span aria-hidden="true"> · </span>
        <a href={links.email.href}>{links.email.label}</a>
        <span aria-hidden="true"> · </span>
        <ExternalLink href={links.linkedin.href}>{links.linkedin.label}</ExternalLink>
        <span aria-hidden="true"> · </span>
        <ExternalLink href={links.github.href}>{links.github.label}</ExternalLink>
      </nav>
    </header>
  )
}
