import type { OtherProject } from '../content'
import { ExternalLink } from './ExternalLink'

/** Short entries: title, type, one sentence, one link. */
export function OneLiners({ items }: { items: OtherProject[] }) {
  return (
    <ul className="one-liners">
      {items.map((item) => (
        <li key={item.id} id={item.id} className="one-liner">
          <p className="one-liner__head">
            <strong>{item.title}</strong>
            <span className="project__kind"> — {item.kind}</span>
          </p>
          <p>
            {item.oneLiner}
            {item.href && (
              <>
                {' '}
                <ExternalLink href={item.href}>{item.linkLabel ?? 'Link'} ↗</ExternalLink>
              </>
            )}
          </p>
        </li>
      ))}
    </ul>
  )
}
