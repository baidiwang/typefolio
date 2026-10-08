import type { OtherProject } from '../content'
import { Reveal } from '../reveal/Reveal'
import { ExternalLink } from './ExternalLink'
import { Highlighted } from './Highlight'

/** Short entries: title (styled as a project's, carrying the entry's one
 *  link), type, a few sentences, stack. */
export function OneLiners({ items }: { items: OtherProject[] }) {
  return (
    <ul className="one-liners">
      {items.map((item) => (
        <li key={item.id} id={item.id} className="one-liner">
          {/* Title and type line exactly as a project's (Project.tsx). */}
          <Reveal as="h3" className="project__title">
            {item.href ? <ExternalLink href={item.href}>{item.title}</ExternalLink> : item.title}
          </Reveal>
          {item.kind && <Reveal className="project__kind">{item.kind}</Reveal>}
          <Reveal mode="lines">
            <Highlighted text={item.oneLiner} phrase={item.highlight} />
          </Reveal>
          {item.stack && (
            <Reveal mode="lines" className="project__stack">
              Stack: {item.stack.join(', ')}
            </Reveal>
          )}
        </li>
      ))}
    </ul>
  )
}
