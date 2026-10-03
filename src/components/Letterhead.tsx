import { site } from '../content'

/**
 * Printed on the paper; scrolls away with it. Not a sticky web header.
 * Name and title only: the email is at the end of the letter, and
 * Resume / LinkedIn / GitHub are typewriter keys.
 */
export function Letterhead() {
  return (
    <header className="letterhead">
      <h1 className="letterhead__name">{site.name}</h1>
      <p className="letterhead__title">{site.title}</p>
    </header>
  )
}
