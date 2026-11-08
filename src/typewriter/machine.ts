/**
 * The visitor's own keystrokes on the typewriter, shared by the reply line
 * at the end of the letter (ReplyLine.tsx) and by key presses anywhere else
 * on the page (Typewriter.tsx), so the machine answers both alike:
 *
 * - each character steps the carriage to its column and clicks a key
 *   (space: carriage only, like the page's own typing);
 * - BELL_BEFORE columns before the end of a line, the bell rings once;
 * - going past the end (or onto a new line), the carriage returns.
 *
 * The typewriter registers the actuator (what "step", "ring" and "return"
 * do on screen and in sound); under reduced motion it moves nothing and
 * only plays sound (if on).
 */

export type Actuator = {
  /** Step the carriage to `column` of the line; `click` plays a key. */
  step: (column: number, click: boolean) => void
  ring: () => void
  carriageReturn: () => void
}

/** The bell rings this many columns before the end of the line. */
const BELL_BEFORE = 8

let actuator: Actuator | null = null
/** The free-typing line (key presses outside any field). */
let freeColumn = 0
/** The bell has rung for the current line (the reply line's, the free
 *  line's). */
let rung = false
let freeRung = false
let lastLine = -1

export function setActuator(a: Actuator | null) {
  actuator = a
}

/** Characters per line of the paper's body text, measured on demand. */
function paperLine(): number {
  const sheet = document.querySelector<HTMLElement>('.sheet')
  if (!sheet) return 60
  const probe = document.createElement('span')
  probe.style.cssText = 'position:absolute;visibility:hidden;width:1ch'
  sheet.appendChild(probe)
  const ch = probe.getBoundingClientRect().width || 10
  probe.remove()
  return Math.max(20, Math.floor(sheet.clientWidth / ch))
}

/**
 * One keystroke at a known place (the reply line): `column` in its visual
 * line `line`, of `lineLength` columns. `typed` is false for a deletion
 * (the carriage moves back, no key click).
 */
export function strikeAt(char: string, column: number, line: number, lineLength: number, typed = true) {
  if (!actuator) return
  if (line !== lastLine) {
    if (lastLine !== -1 && line > lastLine) actuator.carriageReturn()
    lastLine = line
    rung = false
  }
  actuator.step(column, typed && char.trim() !== '')
  if (typed && !rung && column >= lineLength - BELL_BEFORE) {
    rung = true
    actuator.ring()
  }
}

/** Forget the reply line's position (after sending, or on blur). */
export function resetLine() {
  lastLine = -1
  rung = false
}

/**
 * One key pressed outside any field: nothing is typed, but the machine
 * answers as if it were, on its own running line the paper's width.
 */
export function strikeFree(char: string) {
  if (!actuator) return
  const length = paperLine()
  if (freeColumn >= length) {
    freeColumn = 0
    freeRung = false
    actuator.carriageReturn()
  }
  freeColumn += 1
  actuator.step(freeColumn, char.trim() !== '')
  if (!freeRung && freeColumn >= length - BELL_BEFORE) {
    freeRung = true
    actuator.ring()
  }
}

/** The page's own typing took the carriage: the free line starts over. */
export function syncFree(column: number) {
  freeColumn = column
  freeRung = false
}
