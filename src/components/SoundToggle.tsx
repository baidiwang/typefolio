import { useState } from 'react'
import { playKey, setSoundEnabled } from '../typewriter/sound'

/**
 * Typewriter sound on/off. Fixed to the top-right corner (clear of notches
 * and rounded corners via safe-area insets), muted by default. Turning it on
 * answers with a keystroke so the reader hears that it worked.
 */
export function SoundToggle() {
  const [on, setOn] = useState(false)

  const toggle = () => {
    const next = !on
    setSoundEnabled(next)
    setOn(next)
    if (next) playKey()
  }

  return (
    <button
      type="button"
      className="sound-toggle"
      aria-pressed={on}
      aria-label="Typewriter sound"
      title={on ? 'Sound on' : 'Sound off'}
      onClick={toggle}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path className="sound-toggle__speaker" d="M3.5 9.5h3.8L12 5.5v13l-4.7-4H3.5z" />
        {on ? (
          <>
            <path d="M15.2 9.3a4 4 0 0 1 0 5.4" />
            <path d="M17.8 6.8a7.6 7.6 0 0 1 0 10.4" />
          </>
        ) : (
          <path d="M15.5 9.5l5 5M20.5 9.5l-5 5" />
        )}
      </svg>
    </button>
  )
}
