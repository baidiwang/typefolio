import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { site } from '../content'
import { strike } from '../reveal/highlight'
import { reveal } from '../reveal/controller'
import { resetLine, strikeAt } from '../typewriter/machine'

const MAX = 280
const SUBJECT = 'Hello from your portfolio'
const SENT = 'Sent to your mail app. Thank you!'
/** The invitation on the empty line (gone once the visitor types). */
const PLACEHOLDER = 'type a note here…'
const COPIED = `copied, paste it into an email to ${site.links.email.display}`
/** Per character as a status line types out. */
const STATUS_CHAR_MS = 28
/** If the page is still in front this long after asking for the mail app,
 *  it didn't open: copy instead. */
const MAIL_WAIT_MS = 1200

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * A blank typed line under the closing, where a visitor can write back.
 *
 * A real, labelled <textarea> (transparent, on top) takes the typing; the
 * paper under it shows the text in the page's typeface and ink, with a
 * faint baseline per line and a typewriter caret, and lands each new
 * character with the page's ink (highlight.ts). Each keystroke goes
 * through the shared machine (machine.ts): the carriage steps, the bell
 * rings once near the end of a line, a new line returns the carriage.
 *
 * Enter (or "send ↵") opens a mail draft; if no mail app takes it, the
 * note and the address are copied instead. The outcome types itself on the
 * line in the secondary ink, and a polite live region says it.
 */
export function ReplyLine() {
  const [value, setValue] = useState('')
  const [caret, setCaret] = useState(0)
  const [focused, setFocused] = useState(false)
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState('')
  const [shown, setShown] = useState(0)
  /** Neither a mail app nor the clipboard took the note: it stays on the
   *  line, and this says where to send it, beside "send". */
  const [stuck, setStuck] = useState('')
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const beforeRef = useRef<HTMLSpanElement>(null)
  const caretRef = useRef<HTMLSpanElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  /** What just changed, for the effect after render: inserted characters
   *  (count) or a deletion (-1). */
  const change = useRef(0)
  const timers = useRef<number[]>([])

  // Out of sight until the closing above it has typed (or at once, if
  // that's already done, or the field gets focus first).
  useEffect(() => {
    const closing = document.querySelector('.ending__closing')
    if (!closing) return
    return reveal.whenDone(closing, () => setReady(true))
  }, [])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  // After each keystroke: where the caret is on the paper is where the
  // carriage goes; new characters land in fresh ink.
  useLayoutEffect(() => {
    const n = change.current
    change.current = 0
    const mark = caretRef.current
    const paper = paperRef.current
    if (!n || !mark || !paper) return
    const cs = getComputedStyle(paper)
    const ch = parseFloat(cs.fontSize) * 0.555
    const lh = parseFloat(cs.lineHeight)
    const column = Math.round(mark.offsetLeft / ch)
    const line = Math.round(mark.offsetTop / lh)
    const length = Math.floor(paper.clientWidth / ch)
    strikeAt(value[caret - 1] ?? ' ', column, line, length, n > 0)
    const text = beforeRef.current?.firstChild
    if (n > 0 && text && !reducedMotion()) {
      for (let i = Math.max(0, caret - n); i < caret; i++) {
        const r = document.createRange()
        r.setStart(text, i)
        r.setEnd(text, i + 1)
        strike(r)
      }
    }
  }, [value, caret])

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  /** Type a status line out on the paper (all at once under reduced motion). */
  const say = (text: string) => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
    setStatus(text)
    if (reducedMotion()) return setShown(text.length)
    setShown(0)
    for (let i = 1; i <= text.length; i++) later(() => setShown(i), i * STATUS_CHAR_MS)
  }

  const onInput = (e: FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    const next = el.value.replace(/[\r\n]+/g, ' ').slice(0, MAX)
    change.current = next.length - value.length || (next !== value ? 1 : 0)
    if (status) setStatus('')
    if (stuck) setStuck('')
    setValue(next)
    setCaret(el.selectionStart ?? next.length)
  }

  const send = () => {
    const note = value.trim()
    const field = fieldRef.current
    if (!note) {
      field?.focus()
      return
    }
    const { href, display } = site.links.email
    const url = `${href}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(note)}`
    // Did a mail app take it? Opening one sends the page to the back.
    let left = false
    const away = () => (left = true)
    const onVis = () => document.visibilityState === 'hidden' && away()
    window.addEventListener('blur', away)
    document.addEventListener('visibilitychange', onVis)
    window.location.assign(url)
    later(async () => {
      window.removeEventListener('blur', away)
      document.removeEventListener('visibilitychange', onVis)
      if (left) {
        clear()
        say(SENT)
        return
      }
      try {
        await navigator.clipboard.writeText(`To: ${display}\nSubject: ${SUBJECT}\n\n${note}`)
        clear()
        say(COPIED)
      } catch {
        setStuck(`couldn't open mail: write to ${display}`)
      }
    }, MAIL_WAIT_MS)
  }

  const clear = () => {
    setValue('')
    setCaret(0)
    resetLine()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send()
    }
  }

  const syncCaret = () => setCaret(fieldRef.current?.selectionStart ?? value.length)

  return (
    <div className="reply" data-ready={ready || focused || undefined}>
      <label className="visually-hidden" htmlFor="reply-note">
        Write Baidi a note
      </label>
      <div className="reply__line">
        {/* The paper's copy of the typing (the field above it is clear). */}
        <div ref={paperRef} className="reply__paper" aria-hidden="true">
          {value ? (
            <>
              <span ref={beforeRef}>{value.slice(0, caret)}</span>
              <span ref={caretRef} className="reply__caret" data-on={focused || undefined} />
              <span>{value.slice(caret)}</span>
            </>
          ) : (
            <>
              <span ref={caretRef} className="reply__caret" data-on={focused || undefined} />
              {status ? (
                <span className="reply__status">{status.slice(0, shown)}</span>
              ) : (
                <span className="reply__placeholder">{PLACEHOLDER}</span>
              )}
            </>
          )}
          {'​'}
        </div>
        <textarea
          ref={fieldRef}
          id="reply-note"
          className="reply__field"
          rows={1}
          maxLength={MAX}
          value={value}
          spellCheck={false}
          autoComplete="off"
          enterKeyHint="send"
          onInput={onInput}
          onChange={() => {}}
          onKeyDown={onKeyDown}
          onSelect={syncCaret}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            resetLine()
          }}
        />
      </div>
      <button type="button" className="reply__send" onClick={send}>
        send ↵
      </button>
      {stuck && <span className="reply__stuck">{stuck}</span>}
      <span className="visually-hidden" role="status" aria-live="polite">
        {status || stuck}
      </span>
    </div>
  )
}
