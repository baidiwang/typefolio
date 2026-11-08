export type Rect = { x: number; y: number; w: number; h: number }
export type RoomKind =
  | 'piano'
  | 'studio'
  | 'music'
  | 'sofa'
  | 'dining'
  | 'library'

// Native artwork and local actor coordinates travel together when rooms move.
export const rooms: Record<RoomKind, { source: Rect; responses: number[] }> = {
  piano: { source: { x: 152, y: 136, w: 413, h: 164 }, responses: [3, 2, 1] },
  studio: {
    source: { x: 152, y: 325, w: 413, h: 164 },
    responses: [7, 5, 6, 4],
  },
  music: {
    source: { x: 152, y: 514, w: 413, h: 153 },
    responses: [11, 9, 10, 8],
  },
  sofa: { source: { x: 975, y: 136, w: 438, h: 164 }, responses: [2, 1, 3, 0] },
  dining: {
    source: { x: 975, y: 325, w: 438, h: 164 },
    responses: [7, 5, 6, 4],
  },
  library: {
    source: { x: 975, y: 514, w: 438, h: 153 },
    responses: [3, 2, 1, 0],
  },
}

export function roomFit(kind: RoomKind, target: Rect) {
  const source = rooms[kind].source
  const scale = Math.max(target.w / source.w, target.h / source.h)
  return {
    scale,
    x: (target.w - source.w * scale) / 2,
    y: target.h - source.h * scale,
  }
}

export function roomImageStyle(kind: RoomKind, target: Rect) {
  const source = rooms[kind].source
  const { scale, x, y } = roomFit(kind, target)
  return {
    left: `${((x - source.x * scale) / target.w) * 100}%`,
    top: `${((y - source.y * scale) / target.h) * 100}%`,
    width: `${((1536 * scale) / target.w) * 100}%`,
    height: `${((1024 * scale) / target.h) * 100}%`,
  }
}
