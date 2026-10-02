import { primaryHref, type Project as ProjectData } from '../content'
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

  return (
    <article id={id} className="project" aria-labelledby={titleId}>
      <div className="project__media">
        <TapedMedia
          media={media}
          href={href}
          title={title}
          tilt={index % 2 === 0 ? -1.6 : 1.2}
        />
      </div>

      <div className="project__text">
        <h3 id={titleId} className="project__title">
          {href ? <ExternalLink href={href}>{title}</ExternalLink> : title}
        </h3>
        <p className="project__kind">{kind}</p>
        {role && <p className="project__role">Role: {role}</p>}
        <p>{oneLiner}</p>
        {body?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        {decision && <p className="ink-red">{decision}</p>}
        <p className="project__stack">Stack: {stack.join(', ')}</p>
        <p className="project__links">
          {links.live && (
            <ExternalLink href={links.live}>{links.liveLabel ?? 'Live'} ↗</ExternalLink>
          )}
          {links.code && <ExternalLink href={links.code}>Code ↗</ExternalLink>}
          {links.writeup && <ExternalLink href={links.writeup}>Writeup ↗</ExternalLink>}
        </p>
      </div>
    </article>
  )
}
