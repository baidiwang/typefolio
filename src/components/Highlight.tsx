import { Fragment } from 'react'

/**
 * Text with one key phrase marked for the highlighter. The phrase gets a
 * <mark class="hl">; useHighlighterSwipe (src/hooks) swipes the colour on, left to
 * right, once the phrase has been typed.
 */
export function Highlighted({ text, phrase }: { text: string; phrase?: string }) {
  const at = phrase ? text.indexOf(phrase) : -1
  if (!phrase || at < 0) return <>{text}</>
  return (
    <Fragment>
      {text.slice(0, at)}
      <mark className="hl">{phrase}</mark>
      {text.slice(at + phrase.length)}
    </Fragment>
  )
}
