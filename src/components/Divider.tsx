import { Reveal } from '../reveal/Reveal'

/** A typed section break. Decorative: sections already have headings. */
export function Divider() {
  return (
    <div aria-hidden="true">
      <Reveal className="divider">* * *</Reveal>
    </div>
  )
}
