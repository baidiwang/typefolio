import { site } from '../content'

export function Letterhead() {
  const { name, title, links } = site

  return (
    <header className="letterhead" role="banner">
      <div className="letterhead__identity">
        <a className="letterhead__name" href="#top">
          {name}
        </a>
        <span className="letterhead__dot" aria-hidden="true">
          ·
        </span>
        <span className="letterhead__role">{title}</span>
      </div>
      <nav className="letterhead__nav" aria-label="Primary">
        <a href={links.resume.href}>{links.resume.label}</a>
        <a href={links.email.href}>{links.email.label}</a>
        <a
          href={links.linkedin.href}
          {...(links.linkedin.href.startsWith('http')
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {links.linkedin.label}
        </a>
        <a
          href={links.github.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {links.github.label}
        </a>
      </nav>
    </header>
  )
}
