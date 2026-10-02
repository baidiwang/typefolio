import { hide, show, supported as highlightSupported, touch } from './highlight'
import { lineOf, measureLineStarts } from './lines'
import { buildTextMap, charAt, pointAt, type TextMap } from './textMap'

/**
 * The reveal controller: the single owner of "what is being typed right now".
 *
 * - Elements register once (from <Reveal>). All text is in the DOM and laid
 *   out from the first render; the controller only hides the unrevealed tail
 *   of each element with a highlight Range (see highlight.ts).
 * - Triggers are per element (IntersectionObserver), never a timer or a
 *   global scroll percentage.
 * - One requestAnimationFrame loop advances one job at a time; every step is
 *   imperative (Range.setStart), not React state.
 * - Listeners (the typewriter) receive one event per typed character and per
 *   line end, so they stay in lockstep with the text.
 */

export type RevealMode = 'type' | 'lines'

export type RevealOptions = {
  /** 'type' = character by character; 'lines' = one visual line per step. */
  mode: RevealMode
  /** Type this element on page load even though it's already in view. */
  onLoad?: boolean
  /** Nominal duration for the whole element (ms), instead of the default pace. */
  duration?: number
}

export type RevealEvent =
  /** One character typed at `column` (0-based) of the current line. */
  | { type: 'char'; char: string; column: number }
  /** End of a typed line: carriage return. `bell` at the end of an element. */
  | { type: 'return'; column: number; bell: boolean }
  /** A whole line printed at once (line-feed reveal of a paragraph). */
  | { type: 'feed'; column: number; bell: boolean }
  /** A new element starts revealing. */
  | { type: 'start'; element: HTMLElement; mode: RevealMode }
  /** Queue drained. */
  | { type: 'idle' }

type Listener = (event: RevealEvent) => void

type Job = {
  el: HTMLElement
  options: RevealOptions
  map: TextMap
  range: Range
  /** Characters revealed so far. */
  offset: number
  /** Start index of each visual line; null = needs (re)measuring. */
  lineStarts: number[] | null
  state: 'hidden' | 'queued' | 'active' | 'done'
}

type Watcher = (instant: boolean) => void

// —— Pace ——————————————————————————————————————————————————————————————
/** Default pace for typed characters. */
const MS_PER_CHAR = 30
/** No single typed line may take longer than this. */
const MAX_LINE_MS = 600
/** Line-feed pace for paragraphs. */
const MS_PER_LINE = 130
/** Whatever is queued always finishes within this long after the last join. */
const QUEUE_BUDGET_MS = 1200

class RevealController {
  private jobs = new Map<HTMLElement, Job>()
  private queue: Job[] = []
  private active: Job | null = null
  private watchers = new Map<Element, Watcher>()
  private listeners = new Set<Listener>()

  private entryObserver: IntersectionObserver | null = null
  private passObserver: IntersectionObserver | null = null
  private bottomInset = 0

  private fontsReady = false
  private reducedMotion = false
  private frame = 0
  private lastTime = 0
  /** Accumulated (speed-scaled) time not yet spent on steps. */
  private clock = 0
  private deadline = 0
  private initialized = false

  // —— Public API ————————————————————————————————————————————————————

  /** Text reveal needs motion allowed and the Highlight API. */
  get textEnabled(): boolean {
    this.init()
    return highlightSupported && !this.reducedMotion
  }

  /** Non-text reveals (taped media) only need motion allowed. */
  get motionEnabled(): boolean {
    this.init()
    return !this.reducedMotion
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  register(el: HTMLElement, options: RevealOptions): () => void {
    if (!this.textEnabled || this.jobs.has(el)) return () => {}
    const map = buildTextMap(el)
    if (map.length === 0) return () => {}

    const range = document.createRange()
    const job: Job = { el, options, map, range, offset: 0, lineStarts: null, state: 'hidden' }
    this.jobs.set(el, job)

    // Already above the platen line at registration (i.e. visible on load):
    // leave it alone, unless it's the one element typed on load.
    if (!options.onLoad && el.getBoundingClientRect().top < this.triggerLine()) {
      job.state = 'done'
      return () => this.unregister(el)
    }

    this.setHiddenFrom(job, 0)
    hide(range)
    if (options.onLoad) this.enqueue([job])
    else this.entryObserver?.observe(el)
    return () => this.unregister(el)
  }

  /**
   * Call `onReveal` once when `el` first enters the view (instant=false), or
   * immediately if it's already on screen / above it (instant=true).
   */
  watch(el: Element, onReveal: Watcher): () => void {
    if (!this.motionEnabled) {
      onReveal(true)
      return () => {}
    }
    if (el.getBoundingClientRect().top < this.triggerLine()) {
      onReveal(true)
      return () => {}
    }
    this.watchers.set(el, onReveal)
    this.entryObserver?.observe(el)
    return () => {
      this.watchers.delete(el)
      this.entryObserver?.unobserve(el)
    }
  }

  /** Reveal everything now (reduced motion switched on, tests, etc.). */
  flushAll() {
    for (const job of this.jobs.values()) this.complete(job)
    for (const [el, watcher] of this.watchers) {
      this.watchers.delete(el)
      watcher(true)
    }
    this.queue = []
    this.active = null
  }

  // —— Setup ———————————————————————————————————————————————————————————

  private init() {
    if (this.initialized || typeof window === 'undefined') return
    this.initialized = true

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.reducedMotion = motion.matches
    motion.addEventListener('change', () => {
      this.reducedMotion = motion.matches
      if (motion.matches) this.flushAll()
    })

    this.bottomInset = measureInset()
    this.createObservers()

    // Line measurements are only trusted once fonts are in.
    document.fonts.ready.then(() => {
      this.fontsReady = true
      this.invalidateLines()
      // Anything queued while fonts loaded (the intro) gets its full budget.
      this.deadline = performance.now() + QUEUE_BUDGET_MS
      this.kick()
    })
    document.fonts.addEventListener('loadingdone', () => this.invalidateLines())

    let width = window.innerWidth
    let resizeTimer = 0
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        const inset = measureInset()
        if (inset !== this.bottomInset) {
          this.bottomInset = inset
          this.createObservers()
        }
        if (window.innerWidth === width) return
        width = window.innerWidth
        this.invalidateLines()
      }, 120)
    })

    // A keyboard user tabbing onto unrevealed text never waits for it.
    document.addEventListener('focusin', (event) => {
      const target = event.target as Node
      for (const job of this.jobs.values()) {
        if (job.state !== 'done' && job.el.contains(target)) this.complete(job)
      }
      for (const [el, watcher] of this.watchers) {
        if (el.contains(target)) {
          this.watchers.delete(el)
          watcher(true)
        }
      }
    })
  }

  /** Viewport y where the paper emerges from the typewriter. */
  private triggerLine(): number {
    return window.innerHeight - this.bottomInset
  }

  private createObservers() {
    this.entryObserver?.disconnect()
    this.passObserver?.disconnect()

    // Entry observer. Its root box stretches far above the viewport and ends
    // at the platen line, so it fires both for elements scrolling into view
    // and for elements the reader jumped past in a single frame (End key,
    // deep link, fast fling), which IntersectionObserver would otherwise
    // never report.
    this.entryObserver = new IntersectionObserver(
      (entries) => this.onEntries(entries),
      { rootMargin: `100000px 0px ${-this.bottomInset}px 0px` },
    )
    // Pass observer: queued elements that leave through the top of the
    // viewport before their turn are completed instantly.
    this.passObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting && entry.boundingClientRect.bottom <= 0) {
          const job = this.jobs.get(entry.target as HTMLElement)
          if (job) this.complete(job)
        }
      }
    })

    for (const job of this.jobs.values()) {
      if (job.state === 'hidden' && !job.options.onLoad) this.entryObserver.observe(job.el)
      if (job.state === 'queued' || job.state === 'active') this.passObserver.observe(job.el)
    }
    for (const el of this.watchers.keys()) this.entryObserver.observe(el)
  }

  private onEntries(entries: IntersectionObserverEntry[]) {
    const entered: Job[] = []
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const el = entry.target as HTMLElement
      this.entryObserver?.unobserve(el)
      const above = entry.boundingClientRect.bottom <= 0

      const watcher = this.watchers.get(el)
      if (watcher) {
        this.watchers.delete(el)
        watcher(above)
      }

      const job = this.jobs.get(el)
      if (!job || job.state !== 'hidden') continue
      if (above) this.complete(job)
      else entered.push(job)
    }
    if (entered.length) this.enqueue(entered)
  }

  // —— Queue ———————————————————————————————————————————————————————————

  private enqueue(jobs: Job[]) {
    for (const job of jobs) {
      job.state = 'queued'
      this.passObserver?.observe(job.el)
      this.queue.push(job)
    }
    // Always type in reading order.
    this.queue.sort((a, b) =>
      a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    )
    // Compression: whenever something joins, everything outstanding must
    // finish within the budget from *now*. The speed itself is recomputed
    // every frame from the remaining work (see tick).
    this.deadline = performance.now() + QUEUE_BUDGET_MS
    this.kick()
  }

  private kick() {
    if (this.frame || !this.fontsReady) return
    if (!this.active && this.queue.length === 0) return
    this.lastTime = performance.now()
    this.frame = requestAnimationFrame(this.tick)
  }

  private tick = (now: number) => {
    this.frame = 0
    const dt = Math.min(now - this.lastTime, 100)
    this.lastTime = now

    for (const job of this.queue) {
      if (job.state === 'queued' && isAboveViewport(job.el)) this.complete(job)
    }

    const remaining = this.remainingMs()
    const budget = Math.max(16, this.deadline - now)
    const speed = Math.max(1, remaining / budget)
    this.clock += dt * speed

    let job = this.current()
    while (job) {
      const cost = this.stepCost(job)
      if (this.clock < cost) break
      this.clock -= cost
      this.step(job)
      if (job.state === 'done') job = this.current()
    }

    if (job) {
      this.frame = requestAnimationFrame(this.tick)
    } else {
      this.clock = 0
      this.emit({ type: 'idle' })
    }
  }

  /**
   * The active job, promoting the next queued one if needed. Anything already
   * scrolled above the viewport is completed instead of typed. (The pass
   * observer does this too, but its callback can trail a fast scroll by a few
   * frames; one rect read per frame closes that gap.)
   */
  private current(): Job | null {
    const active = this.active
    if (active && active.state === 'active') {
      if (!isAboveViewport(active.el)) return active
      this.complete(active)
    }
    this.active = null
    while (this.queue.length) {
      const next = this.queue.shift()!
      if (next.state !== 'queued') continue
      if (isAboveViewport(next.el)) {
        this.complete(next)
        continue
      }
      next.state = 'active'
      this.ensureLines(next)
      this.active = next
      this.emit({ type: 'start', element: next.el, mode: next.options.mode })
      return next
    }
    return null
  }

  // —— Steps ———————————————————————————————————————————————————————————

  private step(job: Job) {
    const starts = this.ensureLines(job)
    const line = lineOf(starts, job.offset)
    const lineEnd = line + 1 < starts.length ? starts[line + 1] : job.map.length

    if (job.options.mode === 'lines') {
      const column = lineEnd - starts[line]
      job.offset = lineEnd
      const last = job.offset >= job.map.length
      this.emit({ type: 'feed', column, bell: last })
    } else {
      const char = charAt(job.map, job.offset)
      const column = job.offset - starts[line]
      job.offset += 1
      this.emit({ type: 'char', char, column })
      if (job.offset === lineEnd) {
        this.emit({
          type: 'return',
          column: column + 1,
          bell: job.offset >= job.map.length,
        })
      }
    }

    if (job.offset >= job.map.length) this.complete(job)
    else {
      this.setHiddenFrom(job, job.offset)
      touch(job.range)
    }
  }

  private stepCost(job: Job): number {
    if (job.options.mode === 'lines') {
      const lines = this.ensureLines(job).length
      return job.options.duration ? job.options.duration / lines : MS_PER_LINE
    }
    return this.msPerChar(job)
  }

  private msPerChar(job: Job): number {
    if (job.options.duration) return job.options.duration / job.map.length
    const starts = this.ensureLines(job)
    let longest = 0
    for (let i = 0; i < starts.length; i++) {
      const end = i + 1 < starts.length ? starts[i + 1] : job.map.length
      longest = Math.max(longest, end - starts[i])
    }
    return Math.min(MS_PER_CHAR, MAX_LINE_MS / Math.max(1, longest))
  }

  /** Nominal (unscaled) time left for the active job and the queue. */
  private remainingMs(): number {
    let total = -this.clock
    const jobs = this.active ? [this.active, ...this.queue] : this.queue
    for (const job of jobs) {
      if (job.state === 'done') continue
      if (job.options.mode === 'lines') {
        const starts = this.ensureLines(job)
        const left = starts.length - lineOf(starts, job.offset)
        total += left * this.stepCost(job)
      } else {
        total += (job.map.length - job.offset) * this.msPerChar(job)
      }
    }
    return Math.max(0, total)
  }

  private complete(job: Job) {
    if (job.state === 'done') return
    job.state = 'done'
    job.offset = job.map.length
    show(job.range)
    this.passObserver?.unobserve(job.el)
    this.entryObserver?.unobserve(job.el)
    if (this.active === job) this.active = null
  }

  private unregister(el: HTMLElement) {
    const job = this.jobs.get(el)
    if (!job) return
    this.complete(job)
    this.jobs.delete(el)
    this.queue = this.queue.filter((j) => j !== job)
  }

  // —— Measuring ———————————————————————————————————————————————————————

  private ensureLines(job: Job): number[] {
    if (!job.lineStarts) job.lineStarts = measureLineStarts(job.map)
    return job.lineStarts
  }

  /** Re-split every unfinished element (fonts loaded, width changed). */
  private invalidateLines() {
    for (const job of this.jobs.values()) {
      if (job.state === 'done') continue
      job.lineStarts = null
      // Keep a line-feed reveal on a line boundary after re-wrapping.
      if (job.state === 'active' && job.options.mode === 'lines' && job.offset > 0) {
        const starts = this.ensureLines(job)
        const line = lineOf(starts, job.offset)
        if (starts[line] !== job.offset) {
          job.offset = line + 1 < starts.length ? starts[line + 1] : job.map.length
          this.setHiddenFrom(job, job.offset)
          touch(job.range)
        }
      }
    }
  }

  private setHiddenFrom(job: Job, index: number) {
    const start = pointAt(job.map, index)
    const end = pointAt(job.map, job.map.length)
    job.range.setStart(start.node, start.offset)
    job.range.setEnd(end.node, end.offset)
  }

  private emit(event: RevealEvent) {
    for (const listener of this.listeners) listener(event)
  }
}

/**
 * Height of whatever covers the bottom of the viewport: the element marked
 * `data-reveal-inset` (the typewriter). Text below its top edge hasn't come
 * out of the platen yet, so it doesn't count as "in view".
 */
function measureInset(): number {
  const el = document.querySelector('[data-reveal-inset]')
  return el ? Math.round(el.getBoundingClientRect().height) : 0
}

function isAboveViewport(el: Element): boolean {
  return el.getBoundingClientRect().bottom <= 0
}

/** The one controller for the page. */
export const reveal = new RevealController()
