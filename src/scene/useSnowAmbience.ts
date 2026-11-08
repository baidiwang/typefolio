import { useEffect, useRef, useState } from 'react'

/** A quiet city bed: light snowfall and sparse, muffled, distant traffic. */
function makeSnow(context: AudioContext) {
  const output = context.createGain()
  output.gain.value = 0
  output.connect(context.destination)

  const weather = context.createBuffer(
    2,
    context.sampleRate * 16,
    context.sampleRate,
  )
  for (let channel = 0; channel < 2; channel++) {
    const samples = weather.getChannelData(channel)
    let air = 0
    for (let index = 0; index < samples.length; index++) {
      air = air * 0.86 + (Math.random() * 2 - 1) * 0.14
      samples[index] = air * 0.34
    }
    const seam = Math.floor(context.sampleRate * 0.2)
    for (let index = 0; index < seam; index++) {
      const end = samples.length - seam + index,
        blend = index / seam
      samples[end] = samples[end] * (1 - blend) + samples[index] * blend
    }
  }
  const snow = context.createBufferSource()
  snow.buffer = weather
  snow.loop = true
  snow.loopStart = 0.2
  const snowHigh = context.createBiquadFilter()
  snowHigh.type = 'highpass'
  snowHigh.frequency.value = 350
  snowHigh.Q.value = 0.2
  const snowLow = context.createBiquadFilter()
  snowLow.type = 'lowpass'
  snowLow.frequency.value = 1600
  snowLow.Q.value = 0.2
  snow.connect(snowHigh)
  snowHigh.connect(snowLow)
  snowLow.connect(output)
  snow.start()

  // Slow left/right pass-bys are envelopes over filtered road noise, not
  // horns, engine notes, or a continuous gust of broadband white noise.
  const road = context.createBuffer(
    2,
    context.sampleRate * 36,
    context.sampleRate,
  )
  for (let channel = 0; channel < 2; channel++) {
    const samples = road.getChannelData(channel)
    let rumble = 0,
      surface = 0,
      passGain = 0
    for (let index = 0; index < samples.length; index++) {
      if (index % 128 === 0) {
        const t = index / context.sampleRate
        const first = Math.exp(-Math.pow((t - 9) / 3, 2))
        const second = Math.exp(-Math.pow((t - 27) / 3.8, 2)) * 0.65
        const firstPan = Math.tanh((t - 9) / 3) * 0.65
        const secondPan = -Math.tanh((t - 27) / 3.8) * 0.55
        const side = channel === 0 ? -1 : 1
        passGain =
          first * Math.sqrt((1 + side * firstPan) / 2) +
          second * Math.sqrt((1 + side * secondPan) / 2)
      }
      const white = Math.random() * 2 - 1
      rumble = rumble * 0.988 + white * 0.012
      surface = surface * 0.92 + white * 0.08
      samples[index] = (surface * 0.75 + rumble * 0.4) * passGain
    }
  }
  const traffic = context.createBufferSource()
  traffic.buffer = road
  traffic.loop = true
  const roadHigh = context.createBiquadFilter()
  roadHigh.type = 'highpass'
  roadHigh.frequency.value = 90
  roadHigh.Q.value = 0.25
  const roadLow = context.createBiquadFilter()
  roadLow.type = 'lowpass'
  roadLow.frequency.value = 850
  roadLow.Q.value = 0.25
  traffic.connect(roadHigh)
  roadHigh.connect(roadLow)
  roadLow.connect(output)
  traffic.start()
  return output
}

export function useSnowAmbience(
  suspended: boolean,
  announce: (message: string) => void,
) {
  const [on, setOn] = useState(false)
  const context = useRef<AudioContext | null>(null)
  const gain = useRef<GainNode | null>(null)
  useEffect(() => {
    const audio = context.current
    if (!audio || !gain.current) return
    let timer = 0
    const sync = () => {
      clearTimeout(timer)
      const audible = on && !suspended && !document.hidden
      gain.current!.gain.setTargetAtTime(
        audible ? 0.08 : 0,
        audio.currentTime,
        0.22,
      )
      if (audible)
        void audio
          .resume()
          .catch(() =>
            announce('Snow sound is unavailable. Try turning it on again.'),
          )
      else
        timer = window.setTimeout(() => {
          void audio.suspend()
        }, 600)
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [on, suspended, announce])
  useEffect(
    () => () => {
      void context.current?.close()
    },
    [],
  )
  const toggle = async () => {
    try {
      if (!context.current || context.current.state === 'closed') {
        context.current = new AudioContext()
        gain.current = makeSnow(context.current)
      }
      if (!on) await context.current.resume()
      setOn((value) => !value)
    } catch {
      announce('Snow sound is unavailable in this browser.')
    }
  }
  return { on, toggle }
}
