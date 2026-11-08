/** Keep the room transition and its route completion on the same visible clock. */
export function createVisitMotion({
  hidden,
  reduced,
}: {
  hidden: () => boolean
  reduced: () => boolean
}) {
  type Transition = {
    animation: Animation
    complete: () => void
    finished: boolean
  }
  const active = new Set<Transition>()
  const settle = (item: Transition) => {
    if (!active.delete(item)) return
    item.animation.onfinish = null
    item.animation.cancel()
    item.complete()
  }
  const sync = () => {
    for (const item of [...active]) {
      if (hidden()) item.animation.pause()
      else if (reduced() || item.finished) settle(item)
      else if (item.animation.playState === 'paused') item.animation.play()
    }
  }
  return {
    sync,
    track(animation: Animation, complete: () => void) {
      const item = { animation, complete, finished: false }
      active.add(item)
      animation.onfinish = () => {
        item.finished = true
        if (!hidden()) settle(item)
      }
      sync()
    },
    cancel() {
      for (const item of active) {
        item.animation.onfinish = null
        item.animation.cancel()
      }
      active.clear()
    },
  }
}
