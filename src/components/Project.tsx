import { primaryHref, type Project as ProjectData } from '../content'
import { Reveal } from '../reveal/Reveal'
import { ExternalLink } from './ExternalLink'
import { Highlighted } from './Highlight'
import { TapedMedia } from './TapedMedia'

type Props = {
  project: ProjectData
  index: number
}

/**
 * One project, in reading order: head (title, type, one-liner), photo, rest.
 * Phones stack it in that order, so the title is never pushed below the
 * photo; desktop puts the photo in a left column beside head and rest
 * (CSS grid areas), which keeps the DOM, tab order and typing order the same.
 */
export function Project({ project, index }: Props) {
  const { id, title, kind, oneLiner, body, role, stack, links, media, decision, highlight } =
    project
  const href = primaryHref(links)
  const titleId = `${id}-title`
  const leadId = `${id}-lead`
  const hasLinks = Boolean(links.live || links.code || links.writeup)

  return (
    <article id={id} className="project" aria-labelledby={titleId}>
      <div className="project__head">
        <Reveal as="h3" id={titleId} className="project__title">
          {href ? <ExternalLink href={href}>{title}</ExternalLink> : title}
        </Reveal>
        <Reveal className="project__kind">{kind}</Reveal>
        {role && <Reveal className="project__role">Role: {role}</Reveal>}
        <Reveal mode="lines" id={leadId}>
          {oneLiner}
        </Reveal>
      </div>

      <div className="project__media">
        <TapedMedia
          media={media}
          href={href}
          title={title}
          titleId={titleId}
          leadId={leadId}
          tilt={index % 2 === 0 ? -0.9 : 0.7}
        />
      </div>

      <div className="project__rest">
        {body?.map((paragraph) => (
          <Reveal key={paragraph} mode="lines">
            <Highlighted text={paragraph} phrase={highlight} />
          </Reveal>
        ))}
        {decision && (
          <Reveal mode="lines">
            {decision}
          </Reveal>
        )}
        <Reveal mode="lines" className="project__stack">
          Stack: {stack.join(', ')}
        </Reveal>
        {hasLinks && (
          <Reveal className="project__links">
            {links.live && (
              <ExternalLink href={links.live}>{links.liveLabel ?? 'Live'} ↗</ExternalLink>
            )}
            {links.code && <ExternalLink href={links.code}>Code ↗</ExternalLink>}
            {links.writeup && <ExternalLink href={links.writeup}>Writeup ↗</ExternalLink>}
          </Reveal>
        )}
      </div>
    </article>
  )
}
