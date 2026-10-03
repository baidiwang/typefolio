import { primaryHref, type Project as ProjectData } from '../content'
import { Reveal } from '../reveal/Reveal'
import { ExternalLink } from './ExternalLink'
import { TapedMedia } from './TapedMedia'

type Props = {
  project: ProjectData
  index: number
}

export function Project({ project, index }: Props) {
  const { id, title, kind, oneLiner, body, role, stack, links, media, decision } =
    project
  const href = primaryHref(links)
  const titleId = `${id}-title`
  const hasLinks = Boolean(links.live || links.code || links.writeup)

  return (
    <article id={id} className="project" aria-labelledby={titleId}>
      <div className="project__media">
        <TapedMedia
          media={media}
          href={href}
          title={title}
          titleId={titleId}
          tilt={index % 2 === 0 ? -1.6 : 1.2}
        />
      </div>

      <div className="project__text">
        <Reveal as="h3" id={titleId} className="project__title">
          {href ? <ExternalLink href={href}>{title}</ExternalLink> : title}
        </Reveal>
        <Reveal className="project__kind">{kind}</Reveal>
        {role && <Reveal className="project__role">Role: {role}</Reveal>}
        <Reveal mode="lines">{oneLiner}</Reveal>
        {body?.map((paragraph) => (
          <Reveal key={paragraph} mode="lines">
            {paragraph}
          </Reveal>
        ))}
        {decision && (
          <Reveal mode="lines" className="ink-red">
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
