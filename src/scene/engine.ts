import spriteMetadata from './sprites.json'
import pianistMetadata from './pianist.json'
import { windows } from './projects'
import { roomFit, rooms } from './rooms'
import type { RoomKind } from './rooms'

const WORLD_W = 1536
const WORLD_H = 1024
const meta = { ...spriteMetadata, pianist: pianistMetadata }

type Key = Exclude<keyof typeof meta, 'base'>
type Frame = {
  x: number
  y: number
  w: number
  h: number
  anchor: number
  baseline?: number
}
type Pose = { frame: number; previous: number; blend: number }
export type SceneSnapshot = {
  time: number
  poses: number[]
  cat: { phase: string; x: number; y: number }
  pedestrian: { phase: string; x: number; y: number }
  cars: { x: number; speed: number }[]
  smoke: { x: number; y: number; alpha: number }[]
  crossings: number
  edges: { left: number; right: number }
}
export type SceneController = {
  setActive: (active: number | null, newVisit?: boolean) => void
  setRunning: (running: boolean) => void
  greetCat: () => void
  requestCrossing: () => void
  snapshot: () => SceneSnapshot
  dispose: () => void
}
const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n))
const mix = (a: number, b: number, n: number) => a + (b - a) * n
const mod = (a: number, b: number) => ((a % b) + b) % b
const ease = (n: number) => {
  n = clamp(n)
  return n * n * (3 - 2 * n)
}

function pose(sequence: [number, number][], time: number): Pose {
  let clock = mod(
    time,
    sequence.reduce((sum, item) => sum + item[1], 0),
  )
  for (let index = 0; index < sequence.length; index++) {
    const [frame, duration] = sequence[index]
    if (clock < duration)
      return {
        frame,
        previous: sequence[mod(index - 1, sequence.length)][0],
        blend: clamp(clock / 0.1),
      }
    clock -= duration
  }
  return { frame: sequence[0][0], previous: sequence[0][0], blend: 1 }
}

export function createScene(
  root: HTMLElement,
  announce: (text: string) => void,
): SceneController {
  const images = {} as Record<Key, HTMLImageElement>
  let disposed = false
  let time = 0
  let active: number | null = null
  const reactions = windows.map(() => ({ frame: 0, until: -1, visits: 0 }))
  const kinds: RoomKind[] = [
    'piano',
    'studio',
    'music',
    'sofa',
    'dining',
    'library',
  ]
  const slotForKind = kinds.map((kind) =>
    windows.findIndex((entry) => entry.scene === kind),
  )
  const responseFrames = kinds.map((kind) => rooms[kind].responses)
  let streetEdges = { left: 0, right: WORLD_W }
  let smokeCamera = { left: 0, top: 0, scale: 1 }
  let streetPaint = { left: -WORLD_W / 2, width: WORLD_W * 2 }
  const measureEdges = () => {
    const rect = root.getBoundingClientRect?.()
    const viewport = root.parentElement?.getBoundingClientRect()
    if (!rect?.width || !viewport) return
    smokeCamera = {
      left: rect.left,
      top: rect.top,
      scale: rect.width / WORLD_W,
    }
    streetEdges = {
      left: Math.min(0, ((viewport.left - rect.left) / rect.width) * WORLD_W),
      right: Math.max(
        WORLD_W,
        ((viewport.right - rect.left) / rect.width) * WORLD_W,
      ),
    }
    const left = Math.floor(streetEdges.left - 180)
    const width = Math.ceil(streetEdges.right + 180) - left
    if (left === streetPaint.left && width === streetPaint.width) return
    streetPaint = { left, width }
    streetCanvas.style.left = `${(left / WORLD_W) * 100}%`
    streetCanvas.style.width = `${(width / WORLD_W) * 100}%`
    streetCanvas.width = width
    streetCanvas.height = WORLD_H
    street.setTransform(1, 0, 0, 1, -left, 0)
  }
  let running = false
  let visible = !document.hidden
  let intersecting = true
  let frameId = 0
  let last = 0
  let lastPoses: number[] = []
  const base = root.querySelector<HTMLImageElement>('.scene-image')!
  const canvases = Array.from(
    root.querySelectorAll<HTMLCanvasElement>('.resident-canvas'),
  )
  const physicalContexts = canvases.map((canvas, index) => {
    canvas.width = windows[index].rect.w * 2
    canvas.height = windows[index].rect.h * 2
    const ctx = canvas.getContext('2d')!
    const fit = roomFit(windows[index].scene, windows[index].rect)
    ctx.setTransform(2 * fit.scale, 0, 0, 2 * fit.scale, 2 * fit.x, 2 * fit.y)
    return ctx
  })
  const contexts = slotForKind.map((slot) => physicalContexts[slot])
  const layer = (selector: string, wide = false) => {
    const canvas = root.querySelector<HTMLCanvasElement>(selector)!
    const resolution = wide ? 1 : 1.5
    canvas.width = WORLD_W * (wide ? 2 : 1) * resolution
    canvas.height = WORLD_H * resolution
    const context = canvas.getContext('2d')!
    context.scale(resolution, resolution)
    if (wide) context.translate(WORLD_W / 2, 0)
    return context
  }
  const street = layer('.street-canvas', true)
  const weather = layer('.snow-canvas')
  const smokeCanvas = root
    .closest?.('.neighborhood')
    ?.querySelector<HTMLCanvasElement>('.chimney-canvas')
  const smokeContext = smokeCanvas?.getContext('2d')
  const catLayer = layer('.cat-canvas')
  const streetCanvas = root.querySelector<HTMLCanvasElement>('.street-canvas')!
  measureEdges()
  const keys: Key[] = [
    'standing',
    'seated',
    'reader',
    'cat',
    'walker',
    'cars',
    'pianist',
  ]
  for (const key of keys) {
    const image = new Image()
    image.onload = () => {
      if (!disposed) render(0)
    }
    image.src = `/scene/${key}.webp`
    images[key] = image
  }
  const walkingCat = new Image()
  let catFrames: Frame[] = []
  walkingCat.onload = () => {
    // Measure the alpha in the new four-cell walking sheet, preserving actual
    // baselines instead of guessing crop rectangles or drawing the whole sheet.
    const sheet = document.createElement('canvas')
    sheet.width = walkingCat.naturalWidth
    sheet.height = walkingCat.naturalHeight
    const ctx = sheet.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(walkingCat, 0, 0)
    const cell = sheet.width / 4
    const pixels = ctx.getImageData(0, 0, sheet.width, sheet.height).data
    catFrames = Array.from({ length: 4 }, (_, index) => {
      let left = sheet.width,
        right = 0,
        top = sheet.height,
        bottom = 0
      for (let y = 0; y < sheet.height; y++) {
        for (let x = Math.floor(index * cell); x < (index + 1) * cell; x++) {
          if (pixels[(y * sheet.width + x) * 4 + 3] > 40) {
            left = Math.min(left, x)
            right = Math.max(right, x)
            top = Math.min(top, y)
            bottom = Math.max(bottom, y)
          }
        }
      }
      return {
        x: left,
        y: top,
        w: right - left + 1,
        h: bottom - top + 1,
        anchor: cell * (index + 0.5),
        baseline: bottom + 1,
      }
    })
  }
  walkingCat.src = '/scene/cat-walk.webp'
  const smokeImage = new Image()
  smokeImage.onload = () => {
    if (!disposed) render(0)
  }
  smokeImage.src = '/scene/chimney-smoke.webp'

  function sprite(
    ctx: CanvasRenderingContext2D,
    key: Key,
    index: number,
    x: number,
    foot: number,
    scale = 1,
    flip = false,
    opacity = 1,
  ) {
    const image = images[key]
    const frame = meta[key].frames[index] as Frame | undefined
    if (!image?.complete || !image.naturalWidth || !frame) return
    ctx.save()
    ctx.globalAlpha = opacity
    ctx.translate(x, foot)
    if (flip) ctx.scale(-1, 1)
    ctx.drawImage(
      image,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      (frame.x - frame.anchor) * scale,
      -(frame.baseline ? frame.baseline - frame.y : frame.h) * scale,
      frame.w * scale,
      frame.h * scale,
    )
    ctx.restore()
  }
  function actor(
    ctx: CanvasRenderingContext2D,
    key: Key,
    p: Pose,
    x: number,
    y: number,
    height: number,
    ref: number,
  ) {
    const scale = height / meta[key].frames[ref].h
    // These are drawn poses, not morph targets. A clean registered frame
    // avoids doubled translucent faces and brush strokes during a change.
    sprite(ctx, key, p.frame, x, y, scale)
  }
  const cat = { phase: 'rest', clock: 0, next: 2.5, x: 1036, y: 297, visits: 0 }
  function drawCat(dt: number) {
    cat.clock += dt
    cat.y = 297
    if (cat.phase === 'rest' && time >= cat.next) {
      cat.phase = 'out'
      cat.clock = 0
    }
    if (cat.phase === 'out') {
      cat.x = mix(1036, 933, ease(cat.clock / 4.5))
      if (cat.clock >= 4.5) {
        cat.phase = 'balcony'
        cat.clock = 0
      }
    } else if (cat.phase === 'balcony' && cat.clock > 3.2) {
      cat.phase = 'return'
      cat.clock = 0
    } else if (cat.phase === 'return') {
      cat.x = mix(933, 1036, ease(cat.clock / 4.5))
      if (cat.clock >= 4.5) {
        cat.phase = 'settle'
        cat.clock = 0
      }
    } else if (cat.phase === 'settle' && cat.clock > 1.5) {
      cat.visits++
      cat.phase = cat.visits % 2 === 0 ? 'crouch' : 'rest'
      cat.clock = 0
      cat.next = time + 12 + Math.sin(time) * 3
    } else if (cat.phase === 'crouch' && cat.clock > 0.45) {
      cat.phase = 'jump-up'
      cat.clock = 0
    } else if (cat.phase === 'jump-up') {
      const p = clamp(cat.clock / 0.75)
      cat.x = mix(1036, 1152, p)
      cat.y = mix(297, 260, p) - Math.sin(p * Math.PI) * 24
      if (p >= 1) {
        cat.phase = 'sofa'
        cat.clock = 0
      }
    } else if (cat.phase === 'sofa') {
      cat.x = 1152
      cat.y = 260
      if (cat.clock > 3.5) {
        cat.phase = 'jump-down'
        cat.clock = 0
      }
    } else if (cat.phase === 'jump-down') {
      const p = clamp(cat.clock / 0.75)
      cat.x = mix(1152, 1036, p)
      cat.y = mix(260, 297, p) - Math.sin(p * Math.PI) * 20
      if (p >= 1) {
        cat.phase = 'rest'
        cat.clock = 0
        cat.next = time + 15
      }
    }
    catLayer.clearRect(0, 0, WORLD_W, WORLD_H)
    const walking = cat.phase === 'out' || cat.phase === 'return'
    if (walking && catFrames.length) {
      const frame = catFrames[Math.floor(cat.clock * 6) % 4]
      const scale = 31 / Math.max(...catFrames.map((f) => f.h))
      catLayer.save()
      catLayer.translate(cat.x, cat.y)
      if (cat.phase === 'return') catLayer.scale(-1, 1)
      catLayer.drawImage(
        walkingCat,
        frame.x,
        frame.y,
        frame.w,
        frame.h,
        (frame.x - frame.anchor) * scale,
        -frame.h * scale,
        frame.w * scale,
        frame.h * scale,
      )
      catLayer.restore()
    } else {
      const jumping = cat.phase === 'jump-up' || cat.phase === 'jump-down'
      const frame = jumping
        ? cat.clock < 0.36
          ? 3
          : 4
        : cat.phase === 'crouch'
          ? 2
          : cat.phase === 'settle'
            ? 7
            : ['balcony', 'sofa'].includes(cat.phase)
              ? Math.floor(cat.clock * 1.1) % 2
                ? 1
                : 6
              : Math.floor(time / 3) % 2
      sprite(catLayer, 'cat', frame, cat.x, cat.y, 31 / meta.cat.frames[0].h)
    }
    // Restore only the illustrated front rail bars. The balcony cat can leave
    // the room crop and remains behind its actual railing and front edge.
    if (base.complete && base.naturalWidth && cat.x < 987) {
      const patch = (x: number, y: number, w: number, h: number) =>
        catLayer.drawImage(
          base,
          (x / WORLD_W) * base.naturalWidth,
          (y / WORLD_H) * base.naturalHeight,
          (w / WORLD_W) * base.naturalWidth,
          (h / WORLD_H) * base.naturalHeight,
          x,
          y,
          w,
          h,
        )
      patch(880, 236, 102, 4)
      for (const x of [883, 895, 908, 921, 934, 947, 960, 973])
        patch(x, 239, 2.5, 63)
      patch(878, 301, 108, 5)
    }
  }
  function households(dt: number) {
    for (let i = 0; i < 6; i++) {
      const ctx = physicalContexts[i]
      ctx.save()
      ctx.setTransform(2, 0, 0, 2, 0, 0)
      ctx.clearRect(0, 0, windows[i].rect.w, windows[i].rect.h)
      ctx.restore()
    }
    const piano = pose(
      [
        [0, 0.72],
        [1, 0.64],
        [0, 0.52],
        [2, 1.12],
        [1, 0.62],
      ],
      time,
    )
    const frame =
      active === 0 && time < reactions[0].until
        ? reactions[0].frame
        : piano.frame
    sprite(
      contexts[0],
      'pianist',
      frame,
      182,
      162,
      116 / meta.pianist.frames[0].h,
    )
    let painter = pose(
      [
        [4, 1.5],
        [5, 0.7],
        [6, 0.7],
        [5, 0.5],
        [6, 0.6],
        [7, 2.4],
      ],
      time + 0.3,
    )
    if (active === 1 && time < reactions[1].until)
      painter = {
        frame: reactions[1].frame,
        previous: reactions[1].frame,
        blend: 1,
      }
    actor(contexts[1], 'standing', painter, 222, 162, 108, 4)
    let dancer = pose(
      [
        [8, 1.4],
        [9, 0.9],
        [10, 1.2],
        [8, 2.6],
        [11, 1.1],
        [9, 1],
        [8, 2.1],
      ],
      time + 1.7,
    )
    if (active === 2 && time < reactions[2].until)
      dancer = {
        frame: reactions[2].frame,
        previous: reactions[2].frame,
        blend: 1,
      }
    actor(contexts[2], 'standing', dancer, 242, 149, 109, 8)
    let sofa = pose(
      [
        [0, 2.8],
        [1, 1],
        [3, 1.1],
        [0, 2.5],
        [2, 0.7],
        [3, 1],
      ],
      time + 0.8,
    )
    if (active === 3 && time < reactions[3].until)
      sofa = {
        frame: reactions[3].frame,
        previous: reactions[3].frame,
        blend: 1,
      }
    actor(contexts[3], 'seated', sofa, 296, 137, 90, 0)
    let dinnerLeft = pose(
      [
        [4, 2.1],
        [5, 1.1],
        [4, 2.5],
        [7, 1.4],
      ],
      time + 1.4,
    )
    let dinnerRight = pose(
      [
        [8, 3.7],
        [10, 1.3],
        [8, 2.2],
        [11, 1.1],
      ],
      time + 0.2,
    )
    if (active === 4 && time < reactions[4].until)
      dinnerLeft = {
        frame: reactions[4].frame,
        previous: reactions[4].frame,
        blend: 1,
      }
    if (active === 4 && time < reactions[4].until)
      dinnerRight = {
        frame: 8 + ((reactions[4].frame - 3) % 4),
        previous: 8,
        blend: 1,
      }
    actor(contexts[4], 'seated', dinnerLeft, 155, 161, 93, 4)
    actor(contexts[4], 'seated', dinnerRight, 310, 161, 93, 8)
    if (base.complete && base.naturalWidth) {
      // Tablecloth belongs in front of the diners, at the source coordinates.
      const sx = 1143,
        sy = 435,
        sw = 123,
        sh = 53
      contexts[4].drawImage(
        base,
        (sx / WORLD_W) * base.naturalWidth,
        (sy / WORLD_H) * base.naturalHeight,
        (sw / WORLD_W) * base.naturalWidth,
        (sh / WORLD_H) * base.naturalHeight,
        sx - 975,
        sy - 325,
        sw,
        sh,
      )
    }
    let reader = pose(
      [
        [0, 2.3],
        [1, 0.65],
        [2, 1.05],
        [1, 0.7],
        [3, 1.1],
      ],
      time + 1.2,
    )
    if (active === 5 && time < reactions[5].until)
      reader = {
        frame: reactions[5].frame,
        previous: reactions[5].frame,
        blend: 1,
      }
    actor(contexts[5], 'reader', reader, 300, 145, 105, 0)
    const posesByKind = [
      frame,
      painter.frame,
      dancer.frame,
      sofa.frame,
      dinnerLeft.frame,
      reader.frame,
    ]
    lastPoses = windows.map((entry) => posesByKind[kinds.indexOf(entry.scene)])
    drawCat(dt)
  }

  const traffic = {
    request: false,
    crossings: 0,
    ped: {
      phase: 'approach',
      x: 615,
      y: 866,
      clock: 0,
      distance: 0,
      speed: 58,
    },
    cars: [
      {
        frame: 0,
        x: streetEdges.left - 240,
        y: 965,
        dir: 1,
        v: 116,
        cruise: 116,
        stop: 420,
        width: 270,
      },
      {
        frame: 1,
        x: streetEdges.right + 240,
        y: 916,
        dir: -1,
        v: 104,
        cruise: 104,
        stop: 1080,
        width: 265,
      },
    ],
  }
  function updateTraffic(dt: number, draw = true) {
    const p = traffic.ped
    if (p.phase === 'wait' && p.clock > 1.1) traffic.request = true
    const yielding = traffic.request || p.phase === 'cross'
    for (const car of traffic.cars) {
      const before = car.dir === 1 ? car.x <= car.stop : car.x >= car.stop
      let target = car.cruise
      if (yielding && before) {
        const distance = Math.max(0, (car.stop - car.x) * car.dir)
        target = Math.min(target, Math.sqrt(2 * 80 * distance), distance * 2.5)
        if (distance < 0.08 && car.v < 0.3) {
          car.x = car.stop
          car.v = 0
          target = 0
        }
      }
      const delta = target - car.v
      car.v +=
        Math.sign(delta) *
        Math.min(Math.abs(delta), (delta < 0 ? 170 : 42) * dt)
      const next = car.x + car.v * car.dir * dt
      if (
        yielding &&
        before &&
        (car.dir === 1 ? next > car.stop : next < car.stop)
      ) {
        car.x = car.stop
        car.v = 0
      } else car.x = next
      // Wrap only once the *rear* of the vehicle is past the visible edge.
      // The street canvas includes the outpaint, not just the original image.
      if (car.dir === 1 && car.x - car.width / 2 > streetEdges.right + 40)
        car.x = streetEdges.left - car.width / 2 - 40
      if (car.dir === -1 && car.x + car.width / 2 < streetEdges.left - 40)
        car.x = streetEdges.right + car.width / 2 + 40
    }
    if (p.phase === 'approach') {
      const distance = 715 - p.x
      p.speed = Math.min(58, Math.sqrt(Math.max(0, distance) * 155))
      const step = Math.min(distance, p.speed * dt)
      p.x += step
      p.distance += step
      if (distance < 0.4) {
        p.x = 715
        p.phase = 'wait'
        p.clock = 0
        p.speed = 0
      }
    } else if (p.phase === 'wait') {
      p.clock += dt
      const clear = traffic.cars.every(
        (car) =>
          (car.v < 1 && Math.abs(car.x - car.stop) < 2) ||
          (car.dir === 1
            ? car.x - car.width / 2 > 925
            : car.x + car.width / 2 < 590),
      )
      if (traffic.request && clear && p.clock > 0.65) {
        p.phase = 'cross'
        p.clock = 0
      }
    } else if (p.phase === 'cross') {
      p.clock += dt
      const q = clamp(p.clock / 5.4)
      const nx = mix(715, 815, ease(q)),
        ny = mix(866, 1005, ease(q))
      const distance = Math.hypot(nx - p.x, ny - p.y)
      p.distance += distance
      p.speed = dt ? distance / dt : 0
      p.x = nx
      p.y = ny
      if (q >= 1) {
        p.phase = 'turn'
        p.clock = 0
        traffic.crossings++
        traffic.request = false
      }
    } else if (p.phase === 'turn') {
      p.clock += dt
      p.speed = 0
      if (p.clock > 0.7) {
        p.phase = 'near'
        p.clock = 0
      }
    } else if (p.phase === 'near') {
      p.clock += dt
      const velocity = 60 * clamp(p.clock / 0.7)
      p.x += velocity * dt
      p.y = 1005
      p.distance += velocity * dt
      p.speed = velocity
      if (p.x - 40 > streetEdges.right + 40) {
        p.phase = 'hidden'
        p.clock = 0
      }
    } else if (p.phase === 'hidden') {
      p.clock += dt
      if (p.clock > 5) {
        p.phase = 'approach'
        p.x = streetEdges.left - 100
        p.y = 866
        p.clock = 0
        p.distance = 0
      }
    }
    if (!draw) return
    street.clearRect(streetPaint.left, 0, streetPaint.width, WORLD_H)
    const drawCar = (car: (typeof traffic.cars)[number]) => {
      street.save()
      street.translate(0, car.y)
      street.scale(1, 0.82)
      sprite(
        street,
        'cars',
        car.frame,
        car.x,
        0,
        car.width / meta.cars.frames[car.frame].w,
      )
      street.restore()
    }
    const drawPed = () => {
      if (p.phase === 'hidden') return
      const moving = ['approach', 'cross', 'near'].includes(p.phase)
      const index = moving ? Math.floor((p.distance / 70) * 8) % 8 : 2
      sprite(street, 'walker', index, p.x, p.y, 100 / meta.walker.frames[0].h)
    }
    if (p.y < traffic.cars[1].y) drawPed()
    drawCar(traffic.cars[1])
    if (p.y >= traffic.cars[1].y && p.y < traffic.cars[0].y) drawPed()
    drawCar(traffic.cars[0])
    if (p.y >= traffic.cars[0].y) drawPed()
  }
  const flakes = Array.from({ length: 90 }, () => ({
    x: Math.random() * WORLD_W,
    y: Math.random() * WORLD_H,
    r: 0.6 + Math.random(),
    v: 9 + Math.random() * 18,
    alpha: 0.2 + Math.random() * 0.45,
  }))
  const smokePuffs = () =>
    [
      [166, 45, 0],
      [1407, 16, 0.4],
    ].flatMap(([x, y, offset]) =>
      Array.from({ length: 4 }, (_, n) => {
        const p = mod(time * 0.105 + n / 4 + offset, 1)
        return {
          x: x + p * 76 - 6,
          y: y - p * 75 + 5,
          alpha: Math.sin(p * Math.PI) * 0.34,
          width: 22 + p * 84,
        }
      }),
    )
  function snow(dt: number) {
    weather.clearRect(0, 0, WORLD_W, WORLD_H)
    // Smoke uses the same world coordinates and paused clock as residents/snow.
    if (smokeImage.complete && smokeImage.naturalWidth) {
      const ink = smokeContext || weather
      if (smokeContext && smokeCanvas) {
        const width = root.ownerDocument.documentElement.clientWidth,
          height = root.ownerDocument.documentElement.clientHeight
        if (smokeCanvas.width !== width || smokeCanvas.height !== height) {
          smokeCanvas.width = width
          smokeCanvas.height = height
        }
        ink.setTransform(1, 0, 0, 1, 0, 0)
        ink.clearRect(0, 0, width, height)
        ink.setTransform(
          smokeCamera.scale,
          0,
          0,
          smokeCamera.scale,
          smokeCamera.left,
          smokeCamera.top,
        )
      }
      for (const puff of smokePuffs()) {
        const height =
          (puff.width * smokeImage.naturalHeight) / smokeImage.naturalWidth
        ink.globalAlpha = puff.alpha
        ink.drawImage(smokeImage, puff.x, puff.y - height, puff.width, height)
      }
      ink.globalAlpha = 1
    }
    for (const f of flakes) {
      f.y = mod(f.y + f.v * dt, WORLD_H)
      f.x = mod(f.x + 3 * dt, WORLD_W)
      weather.beginPath()
      weather.fillStyle = `rgba(249,245,230,${f.alpha})`
      weather.arc(f.x, f.y, f.r, 0, Math.PI * 2)
      weather.fill()
    }
  }
  function render(dt: number) {
    households(dt)
    // Integrate at a stable step, but draw just once: a slow display frame
    // must not slow the street's clock or let a vehicle skip its stop.
    const steps = Math.max(1, Math.ceil(dt * 60))
    for (let index = 0; index < steps; index++)
      updateTraffic(dt / steps, index === steps - 1)
    snow(dt)
  }
  function tick(now: number) {
    frameId = 0
    if (disposed || !running || !visible || !intersecting) {
      last = 0
      return
    }
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0
    last = now
    time += dt
    render(dt)
    frameId = requestAnimationFrame(tick)
  }
  function sync() {
    if (!running || !visible || !intersecting || disposed) {
      cancelAnimationFrame(frameId)
      frameId = 0
      last = 0
    } else if (!frameId) frameId = requestAnimationFrame(tick)
  }
  const onVisibility = () => {
    visible = !document.hidden
    sync()
  }
  const onBaseLoad = () => {
    if (!disposed) render(0)
  }
  document.addEventListener('visibilitychange', onVisibility)
  base.addEventListener('load', onBaseLoad)
  const observer = new IntersectionObserver(([entry]) => {
    intersecting = entry.isIntersecting
    sync()
  })
  observer.observe(root)
  const cameraObserver =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          measureEdges()
          render(0)
        })
  cameraObserver?.observe(root)
  const onCameraScroll = () => {
    measureEdges()
    render(0)
  }
  root.parentElement?.addEventListener('scroll', onCameraScroll, {
    passive: true,
  })
  render(0)
  return {
    setActive: (index, newVisit = false) => {
      const kindIndex =
        index === null ? null : kinds.indexOf(windows[index].scene)
      if (kindIndex !== null && (kindIndex !== active || newVisit)) {
        const response = reactions[kindIndex]
        const choices = responseFrames[kindIndex].filter(
          (frame) => frame !== lastPoses[slotForKind[kindIndex]],
        )
        response.frame = choices[response.visits++ % choices.length]
        response.until = time + 1.4
      }
      active = kindIndex
      render(0)
    },
    setRunning: (value) => {
      running = value
      sync()
    },
    greetCat: () => {
      if (!running) {
        announce('Motion is paused. Resume motion to say hello to the cat.')
        return
      }
      if (cat.phase === 'rest') cat.next = time
      announce('The cat noticed you.')
    },
    requestCrossing: () => {
      if (['approach', 'wait'].includes(traffic.ped.phase)) {
        traffic.request = true
      }
    },
    snapshot: () => ({
      time,
      poses: lastPoses,
      cat: { phase: cat.phase, x: cat.x, y: cat.y },
      pedestrian: {
        phase: traffic.ped.phase,
        x: traffic.ped.x,
        y: traffic.ped.y,
      },
      cars: traffic.cars.map((car) => ({ x: car.x, speed: car.v })),
      smoke: smokePuffs().map(({ x, y, alpha }) => ({ x, y, alpha })),
      crossings: traffic.crossings,
      edges: { ...streetEdges },
    }),
    dispose: () => {
      disposed = true
      sync()
      observer.disconnect()
      cameraObserver?.disconnect()
      root.parentElement?.removeEventListener('scroll', onCameraScroll)
      document.removeEventListener('visibilitychange', onVisibility)
      base.removeEventListener('load', onBaseLoad)
      for (const image of Object.values(images)) image.onload = null
      walkingCat.onload = null
    },
  }
}
