import { hide, show, supported as highlightSupported, touch } from './highlight'
import { lineOf, measureLineStarts } from './lines'
import { buildTextMap, charAt, pointAt, type TextMap } from './textMap'

/**
 * The reveal controller: the single owner of "what is being typed right now".
 *
 * - Elements register once (from <Reveal>, or <Divider> for drawings). All
 *   text is in the DOM and laid out from the first render; the controller
 *   only hides the unrevealed tail of each element with a highlight Range
 *   (see highlight.ts). Drawings (the red pen dividers) are jobs too, so they
 *   take their turn in the same reading order.
 * - Triggers are per element (IntersectionObserver), never a timer or a
 *   global scroll percentage.
 * - One requestAnimationFrame loop advances one job at a time; every step is
 *   imperative (Range.setStart, a stroke offset), not React state.
 * - Listeners (the typewriter) receive one event per typed character and per
 *   line end, so they stay in lockstep with the text.
 */

export type RevealMode = 'type' | 'lines'

/** How a job reveals: typed text, line-fed text, or a drawn stroke. */
export type JobMode = RevealMode | 'draw'

export type RevealOptions = {
  /** 'type' = character by character; 'lines' = one visual line per step. */
  mode: RevealMode
  /** Always type this element on load (the intro), even if it isn't in view yet. */
  onLoad?: boolean
  /** Nominal duration for the whole element (ms), instead of the default pace. */
  duration?: number
}

export type DrawOptions = {
  /** Nominal duration of the whole drawing (ms), before any compression. */
  duration: number
  /** Paint the drawing at `progress`: 0 = nothing yet, 1 = complete. */
  apply: (progress: number) => void
}

export type RevealEvent =
  /** One character typed at `column` (0-based) of the current line. */
  | { type: 'char'; char: string; column: number }
  /** End of a typed line: carriage return. `bell` at the end of an element. */
  | { type: 'return'; column: number; bell: boolean }
  /** A whole line printed at once (line-feed reveal of a paragraph). */
  | { type: 'feed'; column: number; bell: boolean }
  /** A new element starts revealing. */
  | { type: 'start'; element: HTMLElement; mode: JobMode }
  /** Queue drained. */
  | { type: 'idle' }

type Listener = (event: RevealEvent) => void

type JobState = 'hidden' | 'queued' | 'active' | 'done'

type TextJob = {
  kind: 'text'
  el: HTMLElement
  options: RevealOptions
  map: TextMap
  range: Range
  /** Characters revealed so far. */
  offset: number
  /** Start index of each visual line; null = needs (re)measuring. */
  lineStarts: number[] | null
  state: JobState
}

type DrawJob = {
  kind: 'draw'
  el: HTMLElement
  options: DrawOptions
  /** Steps drawn so far, out of DRAW_STEPS. */
  offset: number
  state: JobState
}

type Job = TextJob | DrawJob

/** instant = revealed without being typed/drawn (scrolled past, focused…). */
type Hook = (instant: boolean) => void

// —— Pace ——————————————————————————————————————————————————————————————
/** Default pace for typed characters. */
const MS_PER_CHAR = 30
/** No single typed line may take longer than this. */
const MAX_LINE_MS = 600
/** Line-feed pace for paragraphs. */
const MS_PER_LINE = 130
/** A drawing advances in this many small steps (smooth at any speed). */
const DRAW_STEPS = 40
/** Whatever is queued always finishes within this long after the last join. */
const QUEUE_BUDGET_MS = 1200
/** The first screen (intro + everything in view below it) finishes within this. */
const LOAD_BUDGET_MS = 1500

class RevealController {
  private jobs = new Map<HTMLElement, Job>()
  private queue: Job[] = []
  private active: Job | null = null
  private startHooks = new Map<Element, Hook>()
  private doneHooks = new Map<Element, Hook>()
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
  /** Budget applied when fonts become ready (the load batch's budget). */
  private startBudget = QUEUE_BUDGET_MS
  /** Elements in view at load, collected during the first commit. */
  private loadBatch: Job[] = []
  private initialized = false

  // —— Public API ————————————————————————————————————————————————————

  /** Reveals need motion allowed and the Highlight API. */
  get textEnabled(): boolean {
    this.init()
    return highlightSupported && !this.reducedMotion
  }

  /** Viewport y where the paper emerges from the typewriter. */
  get platenLine(): number {
    this.init()
    return window.innerHeight - this.bottomInset
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** Register an element whose text is typed (see <Reveal>). */
  register(el: HTMLElement, options: RevealOptions): () => void {
    if (!this.textEnabled || this.jobs.has(el)) return () => {}
    const map = buildTextMap(el)
    if (map.length === 0) return () => {}

    const range = document.createRange()
    const job: TextJob = {
      kind: 'text',
      el,
      options,
      map,
      range,
      offset: 0,
      lineStarts: null,
      state: 'hidden',
    }
    this.jobs.set(el, job)
    this.setHiddenFrom(job, 0)
    hide(range)
    this.place(job, Boolean(options.onLoad))
    return () => this.unregister(el)
  }

  /**
   * Register a drawing (a red pen divider). It's hidden with apply(0) and
   * drawn in its turn, in the same reading order as the text around it.
   * Under reduced motion it's never registered, so it simply stays drawn.
   */
  registerDrawing(el: HTMLElement, options: DrawOptions): () => void {
    if (!this.textEnabled || this.jobs.has(el)) return () => {}
    const job: DrawJob = { kind: 'draw', el, options, offset: 0, state: 'hidden' }
    this.jobs.set(el, job)
    options.apply(0)
    this.place(job, false)
    return () => this.unregister(el)
  }

  /**
   * Call `hook` once, when the registered element `el` starts revealing
   * (instant=false), or when it's revealed without being typed: scrolled
   * past, focused, reduced motion, not registered at all (instant=true).
   * Taped photos use this to stick on exactly when their title starts.
   */
  whenStarts(el: Element, hook: Hook): () => void {
    const job = this.jobs.get(el as HTMLElement)
    if (!job || job.state === 'done' || job.state === 'active') {
      hook(job?.state !== 'active')
      return () => {}
    }
    this.startHooks.set(el, hook)
    return () => {
      this.startHooks.delete(el)
    }
  }

  /**
   * Call `hook` once, when the registered element `el` has been fully
   * revealed: typed to the end (instant=false) or completed early (instant=
   * true). Called right away if `el` isn't hidden at all.
   */
  whenDone(el: Element, hook: Hook): () => void {
    const job = this.jobs.get(el as HTMLElement)
    if (!job || job.state === 'done') {
      hook(true)
      return () => {}
    }
    this.doneHooks.set(el, hook)
    return () => {
      this.doneHooks.delete(el)
    }
  }

  /** Reveal everything now (reduced motion switched on, tests, etc.). */
  flushAll() {
    for (const job of this.jobs.values()) this.complete(job)
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
      // Anything queued while fonts loaded (the first screen) gets its full
      // budget from the moment typing can actually start.
      this.deadline = performance.now() + this.startBudget
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
    })
  }

  /**
   * Hidden before first paint. Typewriter logic: nothing may be visible
   * before the line above it has been revealed, so anything already in view
   * at load isn't left showing; it joins the load batch and is revealed after
   * the intro, in document order. Everything else waits for its trigger.
   */
  private place(job: Job, onLoad: boolean) {
    if (onLoad || job.el.getBoundingClientRect().top < this.platenLine) {
      this.addToLoadBatch(job)
    } else {
      this.entryObserver?.observe(job.el)
    }
  }

  /**
   * All registrations from the first React commit happen in the same task;
   * flush them as one batch in a microtask, with the first-screen budget.
   */
  private addToLoadBatch(job: Job) {
    job.state = 'queued'
    if (this.loadBatch.length === 0) {
      queueMicrotask(() => {
        // StrictMode registers twice; keep only the live job per element.
        const batch = this.loadBatch.filter((j) => this.jobs.get(j.el) === j)
        this.loadBatch = []
        if (batch.length) this.enqueue(batch, LOAD_BUDGET_MS)
      })
    }
    this.loadBatch.push(job)
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
      if (job.state === 'hidden') this.entryObserver.observe(job.el)
      if (job.state === 'queued' || job.state === 'active') this.passObserver.observe(job.el)
    }
  }

  private onEntries(entries: IntersectionObserverEntry[]) {
    const entered: Job[] = []
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const el = entry.target as HTMLElement
      this.entryObserver?.unobserve(el)
      const above = entry.boundingClientRect.bottom <= 0

      const job = this.jobs.get(el)
      if (!job || job.state !== 'hidden') continue
      if (above) this.complete(job)
      else entered.push(job)
    }
    if (entered.length) this.enqueue(entered)
  }

  // —— Queue ———————————————————————————————————————————————————————————

  private enqueue(jobs: Job[], budget = QUEUE_BUDGET_MS) {
    for (const job of jobs) {
      job.state = 'queued'
      this.passObserver?.observe(job.el)
      this.queue.push(job)
    }
    // Always reveal in reading order.
    this.queue.sort((a, b) =>
      a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    )
    // Compression: whenever something joins, everything outstanding must
    // finish within the budget from *now*. The speed itself is recomputed
    // every frame from the remaining work (see tick).
    this.deadline = performance.now() + budget
    if (!this.fontsReady) this.startBudget = budget
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
   * scrolled above the viewport is completed instead of revealed. (The pass
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
      if (next.kind === 'text') this.ensureLines(next)
      this.active = next
      this.emit({
        type: 'start',
        element: next.el,
        mode: next.kind === 'draw' ? 'draw' : next.options.mode,
      })
      this.fireHook(this.startHooks, next.el, false)
      return next
    }
    return null
  }

  // —— Steps ———————————————————————————————————————————————————————————

  private step(job: Job) {
    if (job.kind === 'draw') {
      job.offset += 1
      if (job.offset >= DRAW_STEPS) this.complete(job, false)
      else job.options.apply(job.offset / DRAW_STEPS)
      return
    }

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

    if (job.offset >= job.map.length) this.complete(job, false)
    else {
      this.setHiddenFrom(job, job.offset)
      touch(job.range)
    }
  }

  private stepCost(job: Job): number {
    if (job.kind === 'draw') return job.options.duration / DRAW_STEPS
    if (job.options.mode === 'lines') {
      const lines = this.ensureLines(job).length
      return job.options.duration ? job.options.duration / lines : MS_PER_LINE
    }
    return this.msPerChar(job)
  }

  private msPerChar(job: TextJob): number {
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
      if (job.kind === 'draw') {
        total += (DRAW_STEPS - job.offset) * this.stepCost(job)
      } else if (job.options.mode === 'lines') {
        const starts = this.ensureLines(job)
        const left = starts.length - lineOf(starts, job.offset)
        total += left * this.stepCost(job)
      } else {
        total += (job.map.length - job.offset) * this.msPerChar(job)
      }
    }
    return Math.max(0, total)
  }

  /** Reveal `job` fully. `instant` = it didn't get to finish on its own. */
  private complete(job: Job, instant = true) {
    if (job.state === 'done') return
    job.state = 'done'
    if (job.kind === 'draw') {
      job.offset = DRAW_STEPS
      job.options.apply(1)
    } else {
      job.offset = job.map.length
      show(job.range)
    }
    this.fireHook(this.startHooks, job.el, true)
    this.fireHook(this.doneHooks, job.el, instant)
    this.passObserver?.unobserve(job.el)
    this.entryObserver?.unobserve(job.el)
    if (this.active === job) this.active = null
  }

  private fireHook(hooks: Map<Element, Hook>, el: Element, instant: boolean) {
    const hook = hooks.get(el)
    if (!hook) return
    hooks.delete(el)
    hook(instant)
  }

  private unregister(el: HTMLElement) {
    const job = this.jobs.get(el)
    if (!job) return
    this.complete(job)
    this.jobs.delete(el)
    this.queue = this.queue.filter((j) => j !== job)
  }

  // —— Measuring ———————————————————————————————————————————————————————

  private ensureLines(job: TextJob): number[] {
    if (!job.lineStarts) job.lineStarts = measureLineStarts(job.map)
    return job.lineStarts
  }

  /** Re-split every unfinished text element (fonts loaded, width changed). */
  private invalidateLines() {
    for (const job of this.jobs.values()) {
      if (job.kind !== 'text' || job.state === 'done') continue
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

  private setHiddenFrom(job: TextJob, index: number) {
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
