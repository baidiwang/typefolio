/** Behavioral checks for the crossing route, household activity, and suspension.
 * Canvas drawing is stubbed; artwork registration is checked in the browser. */
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const bundle = await build({
  stdin: {
    contents:
      "export { createScene } from './src/scene/engine'; export { windows, windowFromHash, windowOrder } from './src/scene/projects'; export { rooms, roomFit } from './src/scene/rooms'; export { roomObjects } from './src/scene/roomObjects'; export { createVisitMotion } from './src/scene/visitMotion'; export { sceneControlPlacement } from './src/scene/sceneControls'",
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
})
const {
  createScene,
  windows,
  windowFromHash,
  windowOrder,
  rooms,
  roomFit,
  roomObjects,
  createVisitMotion,
  sceneControlPlacement,
} = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)
for (const [width, world] of [
  [1440, { left: 138, right: 1302, top: 124, height: 776 }],
  [1920, { left: 183, right: 1737, top: 44, height: 1036 }],
  [1440, { left: 183, right: 1257, top: 44, height: 716 }],
]) {
  const plate = sceneControlPlacement(width, world)
  assert.equal(plate.mode, 'walls')
  assert.ok(
    plate.left >= 0 && plate.left + 48 <= world.left,
    'Left plate must stay outside the inhabited apartments',
  )
  assert.ok(
    plate.right >= 0 && plate.right + 48 <= width - world.right,
    'Right plate must stay on its decorative facade',
  )
  assert.ok(
    plate.top + 96 <= world.top + world.height * 0.78 + 0.001,
    'Plates must stay above the sidewalk and traffic',
  )
}
for (const [width, world] of [
  [390, { left: 0, right: 780, top: 134, height: 520 }],
  [724, { left: 0, right: 1057, top: 134, height: 705 }],
  [1280, { left: 58, right: 1222, top: 124, height: 776 }],
])
  assert.equal(
    sceneControlPlacement(width, world).mode,
    'edge',
    'Unavailable walls must keep persistent reachable controls',
  )
// Model a WAAPI clock, including completion events queued as a tab hides.
let visitHidden = false,
  visitReduced = false
const visitMotion = createVisitMotion({
  hidden: () => visitHidden,
  reduced: () => visitReduced,
})
const visitAnimation = (duration) => ({
  currentTime: 0,
  playState: 'running',
  onfinish: null,
  pause() {
    this.playState = 'paused'
  },
  play() {
    this.playState = 'running'
  },
  cancel() {
    this.playState = 'idle'
  },
  advance(ms) {
    if (this.playState !== 'running') return
    this.currentTime = Math.min(duration, this.currentTime + ms)
    if (this.currentTime === duration) {
      this.playState = 'finished'
      this.onfinish?.()
    }
  },
})
for (const [phase, duration] of [
  ['entry', 1300],
  ['exit / next', 680],
]) {
  const animation = visitAnimation(duration)
  let completed = 0
  visitMotion.track(animation, () => completed++)
  animation.advance(200)
  visitHidden = true
  visitMotion.sync()
  animation.advance(5000)
  assert.equal(
    animation.currentTime,
    200,
    `${phase} must not advance while hidden`,
  )
  assert.equal(
    completed,
    0,
    `${phase} must not finish or navigate while hidden`,
  )
  visitHidden = false
  visitMotion.sync()
  animation.advance(duration - 200)
  assert.equal(completed, 1, `${phase} must resume from its suspended time`)
}
for (const phase of ['entry', 'exit / next']) {
  const animation = visitAnimation(680)
  let completed = 0
  visitMotion.track(animation, () => completed++)
  animation.advance(200)
  visitReduced = true
  visitMotion.sync()
  assert.equal(completed, 1, `${phase} must honor changed motion preferences`)
  assert.equal(animation.playState, 'idle')
  visitMotion.sync()
  assert.equal(completed, 1, 'Settling must never navigate twice')
  visitReduced = false
}
const queuedVisit = visitAnimation(680)
let queuedVisitCompletion = 0
visitMotion.track(queuedVisit, () => queuedVisitCompletion++)
visitHidden = true
queuedVisit.onfinish()
visitReduced = true
visitMotion.sync()
assert.equal(
  queuedVisitCompletion,
  0,
  'A queued finish or changed preference must not navigate a hidden tab',
)
visitHidden = false
visitMotion.sync()
assert.equal(
  queuedVisitCompletion,
  1,
  'A pending completion settles once visible',
)
visitReduced = false
const abandonedVisit = visitAnimation(680)
visitMotion.track(abandonedVisit, () =>
  assert.fail('An abandoned visit must not complete'),
)
visitMotion.cancel()
assert.equal(abandonedVisit.onfinish, null)
abandonedVisit.advance(1000)
assert.deepEqual(
  windows.map((w) => [w.id, w.scene]),
  [
    ['google-play', 'dining'],
    ['lily', 'piano'],
    ['games', 'music'],
    ['pocket', 'sofa'],
    ['ai-projects', 'library'],
    ['data-visualization', 'studio'],
  ],
  'Project priority and each illustrated household must follow the requested floors',
)
assert.deepEqual(
  windowOrder,
  [0, 3, 1, 4, 2, 5],
  'Next window must follow floors top to bottom',
)
assert.equal(windowFromHash('#breadcrumb'), windows[4])
assert.equal(windowFromHash('#look-closer'), windows[4])
assert.equal(windowFromHash('#pocket'), windows[3])
assert.equal(windowFromHash('#little-helper'), windows[2])
assert.equal(windowFromHash('#desol'), windows[2])
assert.deepEqual(
  Object.fromEntries(
    Object.entries(roomObjects).map(([kind, value]) => [kind, value.surface]),
  ),
  {
    dining: 'menu',
    piano: 'score',
    music: 'sleeve',
    sofa: 'journal',
    library: 'bookcase',
    studio: 'canvas',
  },
  'Each room must keep its selected physical reading object',
)
assert.deepEqual(
  roomObjects.dining.guests.map((g) => g.side),
  ['left', 'right'],
  'Both diners must flank the menu',
)
for (const kind of ['piano', 'music', 'studio'])
  assert.equal(roomObjects[kind].guests[0].side, 'left')
for (const kind of ['sofa', 'library'])
  assert.equal(roomObjects[kind].guests[0].side, 'right')
for (const [kind, object] of Object.entries(roomObjects)) {
  const source = rooms[kind].source
  for (const r of [object.anchor, ...object.guests.map((g) => g.crop)])
    assert.ok(
      r.x >= 0 && r.y >= 0 && r.x + r.w <= source.w && r.y + r.h <= source.h,
      `${kind}: object and resident crops must stay inside their original room`,
    )
}
for (const w of windows) {
  const fit = roomFit(w.scene, w.rect),
    source = rooms[w.scene].source
  assert.ok(
    Math.abs(source.h * fit.scale + fit.y - w.rect.h) < 0.001,
    'Room floor must stay grounded after moving',
  )
  assert.ok(
    source.w * fit.scale >= w.rect.w && source.h * fit.scale >= w.rect.h,
    'Room patch must fully cover its window',
  )
}
const noOp = () => {}
const ctx = new Proxy(
  {},
  {
    get: (_, key) => (key === 'getImageData' ? () => ({ data: [] }) : noOp),
    set: () => true,
  },
)
const canvas = () => ({ style: {}, getContext: () => ctx })
let queued = new Map(),
  frame = 0,
  now = 0
const listeners = new Map()
globalThis.requestAnimationFrame = (callback) => {
  const id = ++frame
  queued.set(id, callback)
  return id
}
globalThis.cancelAnimationFrame = (id) => queued.delete(id)
globalThis.Image = class {
  complete = false
  naturalWidth = 0
}
globalThis.IntersectionObserver = class {
  observe() {}
  disconnect() {}
}
globalThis.document = {
  hidden: false,
  addEventListener: (event, callback) => listeners.set(event, callback),
  removeEventListener: (event) => listeners.delete(event),
}
const root = {
  querySelector: (selector) =>
    selector === '.scene-image'
      ? { complete: false, addEventListener: noOp, removeEventListener: noOp }
      : canvas(),
  querySelectorAll: () => Array.from({ length: 6 }, canvas),
}
const scene = createScene(root, noOp)
function advance(seconds) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) {
    now += 1000 / 60
    const pending = [...queued.values()]
    queued.clear()
    pending.forEach((callback) => callback(now))
  }
}
scene.setRunning(true)
const poses = Array.from({ length: 6 }, () => new Set())
let catStartedAt = null,
  stoppedForPedestrian = false,
  nearSidewalk = false,
  exitedSideways = false,
  resumedTraffic = false
let previousCars = scene.snapshot().cars
for (let i = 0; i < 1200; i++) {
  advance(1 / 30)
  const state = scene.snapshot()
  if (state.time <= 10)
    state.poses.forEach((pose, index) => poses[index].add(pose))
  if (catStartedAt === null && state.cat.phase === 'out')
    catStartedAt = state.time
  if (state.pedestrian.phase === 'cross') {
    stoppedForPedestrian ||= state.cars.every((car) => car.speed < 1)
    for (let index = 0; index < state.cars.length; index++) {
      const car = state.cars[index]
      assert.ok(
        Math.abs(car.x - state.pedestrian.x) > 132,
        'A vehicle entered the pedestrian crossing',
      )
    }
  }
  if (['turn', 'near'].includes(state.pedestrian.phase)) {
    assert.equal(
      state.pedestrian.y,
      1005,
      'Pedestrian feet must stay on the visible near sidewalk',
    )
    nearSidewalk = true
    if (state.cars.some((car) => car.speed > 15)) resumedTraffic = true
    if (state.pedestrian.x > 1500) exitedSideways = true
  }
  state.cars.forEach((car, index) => {
    assert.ok(
      Math.abs(car.speed - previousCars[index].speed) <= 6,
      'Cars must accelerate or decelerate smoothly',
    )
  })
  previousCars = state.cars
}
assert.ok(
  poses.every((frames) => frames.size > 1),
  'Every household must act within ten seconds',
)
assert.ok(
  catStartedAt >= 2 && catStartedAt <= 4,
  'First cat action must happen within two to four seconds',
)
assert.ok(
  stoppedForPedestrian && nearSidewalk && exitedSideways && resumedTraffic,
  'Complete yielding, crossing, and horizontal exit route',
)
scene.setRunning(false)
const paused = scene.snapshot().time
advance(2)
assert.equal(scene.snapshot().time, paused, 'Pause must stop animation time')
scene.setRunning(true)
advance(1)
assert.ok(
  scene.snapshot().time > paused,
  'Resume must continue the existing scene',
)
document.hidden = true
listeners.get('visibilitychange')()
const hidden = scene.snapshot().time
advance(2)
assert.equal(scene.snapshot().time, hidden, 'Hidden tabs must stop animation')
document.hidden = false
listeners.get('visibilitychange')()
advance(1)
assert.ok(scene.snapshot().time > hidden, 'Visible tabs must resume')
scene.dispose()
assert.equal(queued.size, 0, 'Unmount must cancel scheduled frames')
console.log(
  'Scene checks passed: six active households, early cat action, safe crossing, sidewalk exit, smooth cars, pause, visibility, and cleanup.',
)

// Repeated entries must change the pose that was visible immediately before.
const reactionScene = createScene(root, noOp)
reactionScene.setRunning(true)
for (let round = 0; round < 4; round++) {
  for (let room = 0; room < 6; room++) {
    reactionScene.setActive(null)
    advance(0.23)
    const before = reactionScene.snapshot()
    reactionScene.setActive(room)
    const after = reactionScene.snapshot()
    assert.notEqual(
      after.poses[room],
      before.poses[room],
      `Room ${room} must immediately respond with a different pose`,
    )
    assert.equal(
      after.time,
      before.time,
      'Hover response must not advance or restart the world',
    )
    reactionScene.setActive(room, true)
    assert.notEqual(
      reactionScene.snapshot().poses[room],
      after.poses[room],
      'Re-entering a keyboard-focused room must still cause a fresh response',
    )
    reactionScene.setActive(null)
  }
}
reactionScene.dispose()

// Wide screens show the outpaint: the original image edge is NOT an exit.
const wideRoot = {
  ...root,
  getBoundingClientRect: () => ({ left: 512, right: 2048, width: 1536 }),
  parentElement: {
    getBoundingClientRect: () => ({ left: 0, right: 2560 }),
    addEventListener: noOp,
    removeEventListener: noOp,
  },
}
const wideScene = createScene(wideRoot, noOp)
wideScene.setRunning(true)
let previous = wideScene.snapshot(),
  wraps = 0,
  pedestrianExit = false
assert.deepEqual(previous.edges, { left: -512, right: 2048 })
for (let frame = 0; frame < 90 * 60; frame++) {
  advance(1 / 60)
  const current = wideScene.snapshot()
  current.cars.forEach((car, index) => {
    const old = previous.cars[index]
    if (Math.abs(car.x - old.x) > 500) {
      const halfWidth = index === 0 ? 135 : 132.5
      assert.ok(
        old.x - halfWidth > current.edges.right ||
          old.x + halfWidth < current.edges.left,
        'Car wrapped while still visible in the extended street',
      )
      wraps++
    }
  })
  if (
    previous.pedestrian.phase === 'near' &&
    current.pedestrian.phase === 'hidden'
  ) {
    assert.ok(
      previous.pedestrian.x - 40 > current.edges.right,
      'Pedestrian disappeared before leaving the visible street',
    )
    pedestrianExit = true
  }
  previous = current
}
assert.ok(
  wraps >= 2,
  'Both vehicles must complete continuous loops through the extended street',
)
assert.ok(pedestrianExit, 'Pedestrian must walk off the extended street')
wideScene.dispose()
console.log(
  'Hover responses and full-width vehicle/pedestrian exit checks passed.',
)

function runAtRate(rate) {
  const engine = createScene(root, noOp)
  engine.setRunning(true)
  advance(1 / 60)
  for (let tick = 0; tick < 30 * rate; tick++) {
    now += 1000 / rate
    const pending = [...queued.values()]
    queued.clear()
    pending.forEach((callback) => callback(now))
  }
  const result = engine.snapshot()
  engine.dispose()
  return result
}
const smoothDisplay = runAtRate(60),
  slowerDisplay = runAtRate(10)
assert.ok(
  Math.abs(smoothDisplay.time - slowerDisplay.time) < 0.01,
  'Scene time must not slow down on a lower-frame-rate display',
)
assert.equal(smoothDisplay.pedestrian.phase, slowerDisplay.pedestrian.phase)
assert.ok(
  Math.abs(smoothDisplay.pedestrian.x - slowerDisplay.pedestrian.x) < 6,
  'Pedestrian route must remain consistent across frame rates',
)
smoothDisplay.cars.forEach((car, index) =>
  assert.ok(
    Math.abs(car.x - slowerDisplay.cars[index].x) < 6,
    'Vehicle movement must remain consistent across frame rates',
  ),
)
smoothDisplay.smoke.forEach((puff, index) => {
  assert.ok(
    Math.abs(puff.x - slowerDisplay.smoke[index].x) < 0.1,
    'Chimney smoke must use real elapsed time at every display rate',
  )
  assert.ok(
    Math.abs(puff.y - slowerDisplay.smoke[index].y) < 0.1,
    'Smoke must rise without frame-count drift',
  )
  assert.ok(
    puff.alpha >= 0 && puff.alpha <= 0.34,
    'Smoke must stay soft and translucent',
  )
})
console.log('60 fps / 10 fps timing and route continuity checks passed.')

const ultraStreet = canvas()
const ultraRoot = {
  ...root,
  querySelector: (selector) =>
    selector === '.street-canvas' ? ultraStreet : root.querySelector(selector),
  getBoundingClientRect: () => ({ left: 1232, right: 2768, width: 1536 }),
  parentElement: {
    getBoundingClientRect: () => ({ left: 0, right: 4000 }),
    addEventListener: noOp,
    removeEventListener: noOp,
  },
}
const ultraScene = createScene(ultraRoot, noOp)
assert.deepEqual(ultraScene.snapshot().edges, { left: -1232, right: 2768 })
assert.ok(
  ultraStreet.width > 4000,
  'Street canvas must cover even an ultrawide viewport plus offscreen spawn space',
)
ultraScene.dispose()
console.log('Ultrawide street canvas coverage check passed.')

// Inspect actual draw destinations, not only logical pose counters: moving a
// project must also move its household sprite into the correct physical canvas.
const painted = Array.from({ length: 6 }, () => {
  const calls = [],
    transforms = []
  const context = new Proxy(
    {},
    {
      get: (_, key) =>
        key === 'drawImage'
          ? (image, sx, sy) => calls.push({ src: image.src, sx, sy })
          : key === 'setTransform'
            ? (...values) => transforms.push(values)
            : key === 'getImageData'
              ? () => ({ data: [] })
              : noOp,
      set: () => true,
    },
  )
  return { style: {}, getContext: () => context, calls, transforms }
})
globalThis.Image = class {
  complete = true
  naturalWidth = 896
  naturalHeight = 896
  src = ''
}
const paintedScene = createScene(
  { ...root, querySelectorAll: () => painted },
  noOp,
)
const householdKeys = [
  'seated',
  'pianist',
  'standing',
  'seated',
  'reader',
  'standing',
]
for (let slot = 0; slot < 6; slot++) {
  assert.ok(
    painted[slot].calls.some(
      (call) => call.src === `/scene/${householdKeys[slot]}.webp`,
    ),
    `Physical window ${slot} drew the wrong household`,
  )
  const matrix = painted[slot].transforms[0]
  assert.equal(matrix[0], matrix[3], 'Residents must retain uniform scale')
  const source = rooms[windows[slot].scene].source
  assert.ok(
    Math.abs(source.h * matrix[3] + matrix[5] - painted[slot].height) < 0.001,
    'Resident and room floors must coincide',
  )
}
assert.equal(
  painted[0].calls.length,
  2,
  'Both diners must move to the top-west window',
)
assert.ok(
  painted[1].calls.every((call) => call.src === '/scene/pianist.webp'),
  'Middle-west must draw the seated pianist, never phone-call poses',
)
assert.ok(
  painted[2].calls.every((call) => call.sy > 400),
  'Games keeps its original singer/dancer poses',
)
assert.ok(
  painted[3].calls.every((call) => call.sy < 200),
  'Pocket keeps the sofa reader',
)
assert.ok(
  painted[5].calls.every((call) => call.sy > 200 && call.sy < 400),
  'Ground-east must draw painter poses',
)
paintedScene.dispose()
console.log(
  'Room relocation, sprite destinations, and floor registration checks passed.',
)

// The plume may rise above the cropped scene image; its canvas belongs to the
// complete viewport, with the same camera transform as the chimney artwork.
const plumeDraws = [],
  plumeTransforms = []
const plumeContext = new Proxy(
  {},
  {
    get: (_, key) =>
      key === 'drawImage'
        ? (...args) => plumeDraws.push(args)
        : key === 'setTransform'
          ? (...args) => plumeTransforms.push(args)
          : noOp,
    set: () => true,
  },
)
const plumeCanvas = { width: 0, height: 0, getContext: () => plumeContext }
let plumeLeft = 80,
  panWhilePaused
const plumeScene = createScene(
  {
    ...root,
    closest: () => ({ querySelector: () => plumeCanvas }),
    ownerDocument: {
      documentElement: { clientWidth: 1440, clientHeight: 900 },
    },
    getBoundingClientRect: () => ({ left: plumeLeft, top: 44, width: 1284 }),
    parentElement: {
      getBoundingClientRect: () => ({ left: 0, right: 1440 }),
      addEventListener: (event, callback) => {
        if (event === 'scroll') panWhilePaused = callback
      },
      removeEventListener: (event, callback) => {
        if (event === 'scroll' && panWhilePaused === callback)
          panWhilePaused = undefined
      },
    },
  },
  noOp,
)
assert.equal(plumeCanvas.width, 1440)
assert.equal(plumeCanvas.height, 900)
assert.deepEqual(
  plumeTransforms.at(-1),
  [1284 / 1536, 0, 0, 1284 / 1536, 80, 44],
  'Smoke must stay registered when the camera scales or pans',
)
assert.equal(
  plumeDraws.length,
  8,
  'Both chimney sources must emit a staggered plume',
)
assert.ok(
  plumeDraws.every((args) => args.slice(1).every(Number.isFinite)),
  'Smoke draw coordinates must stay finite',
)
assert.ok(
  plumeDraws.some((args) => args[2] < 0),
  'The plume must be allowed to rise above the source image',
)
const frozenSmoke = plumeScene.snapshot()
plumeLeft = -560
panWhilePaused()
assert.equal(
  plumeDraws.length,
  16,
  'Panning a paused scene must repaint smoke at the new camera',
)
assert.deepEqual(plumeTransforms.at(-1), [
  1284 / 1536,
  0,
  0,
  1284 / 1536,
  -560,
  44,
])
assert.equal(
  plumeScene.snapshot().time,
  frozenSmoke.time,
  'Panning must not advance paused animation',
)
assert.deepEqual(
  plumeScene.snapshot().smoke,
  frozenSmoke.smoke,
  'A camera move must preserve each frozen wisp',
)
plumeScene.dispose()
assert.equal(
  panWhilePaused,
  undefined,
  'Unmount must remove the smoke camera listener',
)
console.log('Chimney camera registration and time-based smoke checks passed.')
