import type { ReactNode } from 'react'
import { site } from '../content'

/** The separator is visual only: screen readers just hear the four links. */
function Dot() {
  return <span aria-hidden="true"> · </span>
}

/**
 * Three hand-drawn loops (viewBox 100 × 40, stretched to the word), each
 * overshooting its start like a quick pen circle.
 */
const CIRCLES = [
  'M12 10C30 2 78 3 92 14C102 24 80 36 50 37C20 38 2 30 6 19C9 11 22 6 40 5',
  'M85 8C70 2 25 3 10 13C-1 22 12 35 45 36C78 37 99 29 95 18C92 10 78 5 60 4',
  'M20 7C40 1 85 4 94 16C100 27 75 37 45 36C15 35 1 27 5 17C8 9 25 4 48 3',
]

type PenLinkProps = {
  href: string
  external?: boolean
  variant: number
  children: ReactNode
}

/**
 * A plain typed word; on hover or keyboard focus a red pen circle draws
 * itself around it (the stroke, pathLength 1, runs from dash offset 1 to 0).
 * The circle is also the focus indicator. Touch screens, which can't hover,
 * get a dotted red underline instead (index.css).
 */
function PenLink({ href, external, variant, children }: PenLinkProps) {
  const ext = external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  return (
    <a className="pen-link" href={href} {...ext}>
      {children}
      {external && <span className="visually-hidden"> (opens in a new tab)</span>}
      <svg
        className="pen-link__circle"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d={CIRCLES[variant % CIRCLES.length]} pathLength={1} />
      </svg>
    </a>
  )
}

/** "Resume · Email · LinkedIn · GitHub", printed in the letterhead. */
export function ContactLinks() {
  const { resume, email, linkedin, github } = site.links
  return (
    <>
      <PenLink href={resume.href} external variant={0}>
        {resume.label}
      </PenLink>
      <Dot />
      <PenLink href={email.href} variant={1}>
        {email.label}
      </PenLink>
      <Dot />
      <PenLink href={linkedin.href} external variant={2}>
        {linkedin.label}
      </PenLink>
      <Dot />
      <PenLink href={github.href} external variant={0}>
        {github.label}
      </PenLink>
    </>
  )
}
