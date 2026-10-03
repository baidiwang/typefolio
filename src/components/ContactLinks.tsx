import { site } from '../content'
import { ExternalLink } from './ExternalLink'

/** The separator is visual only: screen readers just hear the four links. */
function Dot() {
  return <span aria-hidden="true"> · </span>
}

/**
 * "Resume · Email · LinkedIn · GitHub", printed in the letterhead and typed
 * again at the end of the letter. Inline content: the caller provides the
 * wrapping element (and, at the end, the <Reveal> that types it).
 */
export function ContactLinks() {
  const { resume, email, linkedin, github } = site.links
  return (
    <>
      <ExternalLink href={resume.href}>{resume.label}</ExternalLink>
      <Dot />
      <a href={email.href}>{email.label}</a>
      <Dot />
      <ExternalLink href={linkedin.href}>{linkedin.label}</ExternalLink>
      <Dot />
      <ExternalLink href={github.href}>{github.label}</ExternalLink>
    </>
  )
}
