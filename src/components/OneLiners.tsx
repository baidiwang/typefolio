import type { OtherProject } from '../content'
import { Reveal } from '../reveal/Reveal'
import { ExternalLink } from './ExternalLink'

/** Short entries: title, type, one sentence, one link. */
export function OneLiners({ items }: { items: OtherProject[] }) {
  return (
    <ul className="one-liners">
      {items.map((item) => (
        <li key={item.id} id={item.id} className="one-liner">
          <Reveal className="one-liner__head">
            <span className="label">{item.title}</span>
            <span className="project__kind"> — {item.kind}</span>
          </Reveal>
          <Reveal mode="lines">
            {item.oneLiner}
            {item.href && (
              <>
                {' '}
                <ExternalLink href={item.href}>{item.linkLabel ?? 'Link'} ↗</ExternalLink>
              </>
            )}
          </Reveal>
        </li>
      ))}
    </ul>
  )
}
