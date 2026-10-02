import type { ReactNode } from 'react'

type Props = {
  href: string
  children: ReactNode
  className?: string
}

/** Opens in a new tab; the ↗ is decorative, the hint is for screen readers. */
export function ExternalLink({ href, children, className }: Props) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  )
}
