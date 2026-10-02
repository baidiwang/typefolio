/**
 * Typewriter sounds, synthesised with Web Audio (no audio files).
 * Off by default; the AudioContext is only created when the reader turns
 * sound on (a user gesture, so browsers allow it).
 */

let ctx: AudioContext | null = null
let enabled = false
let lastKey = 0
let lastBell = 0
let noise: AudioBuffer | null = null

export function setSoundEnabled(on: boolean) {
  enabled = on
  if (on) {
    ctx ??= new AudioContext()
    void ctx.resume()
  }
}

function noiseBuffer(audio: AudioContext): AudioBuffer {
  if (!noise) {
    noise = audio.createBuffer(1, audio.sampleRate * 0.05, audio.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  return noise
}

/** A short filtered click. */
function click(freq: number, gain: number, length: number) {
  if (!ctx) return
  const t = ctx.currentTime
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx)
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = freq
  filter.Q.value = 1.2
  const amp = ctx.createGain()
  amp.gain.setValueAtTime(gain, t)
  amp.gain.exponentialRampToValueAtTime(0.0001, t + length)
  src.connect(filter).connect(amp).connect(ctx.destination)
  src.start(t)
  src.stop(t + length)
}

export function playKey() {
  if (!enabled) return
  const now = performance.now()
  if (now - lastKey < 28) return // compressed typing: don't machine-gun
  lastKey = now
  click(1800 + Math.random() * 900, 0.35, 0.035)
}

export function playReturn() {
  if (!enabled) return
  click(500, 0.3, 0.12)
}

export function playBell() {
  if (!enabled || !ctx) return
  const now = performance.now()
  if (now - lastBell < 450) return
  lastBell = now
  const t = ctx.currentTime
  for (const [freq, level] of [
    [2093, 0.12],
    [5240, 0.04],
  ]) {
    const osc = ctx.createOscillator()
    osc.frequency.value = freq
    const amp = ctx.createGain()
    amp.gain.setValueAtTime(level, t)
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.7)
    osc.connect(amp).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.7)
  }
}
