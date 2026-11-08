import type { Rect, RoomKind } from './rooms'

export type Guest = { id: string; side: 'left' | 'right'; crop: Rect }
export type RoomObject = {
  surface: 'menu' | 'score' | 'sleeve' | 'journal' | 'bookcase' | 'canvas'
  anchor: Rect
  guests: Guest[]
}

// Objects and resident/furniture crops use the original room's native coordinates.
export const roomObjects: Record<RoomKind, RoomObject> = {
  dining: {
    surface: 'menu',
    anchor: { x: 188, y: 101, w: 78, h: 45 },
    guests: [
      {
        id: 'diner-left',
        side: 'left',
        crop: { x: 98, y: 43, w: 104, h: 121 },
      },
      {
        id: 'diner-right',
        side: 'right',
        crop: { x: 265, y: 43, w: 112, h: 121 },
      },
    ],
  },
  piano: {
    surface: 'score',
    anchor: { x: 166, y: 64, w: 38, h: 28 },
    guests: [
      { id: 'pianist', side: 'left', crop: { x: 108, y: 36, w: 155, h: 128 } },
    ],
  },
  music: {
    surface: 'sleeve',
    anchor: { x: 118, y: 59, w: 70, h: 49 },
    guests: [
      { id: 'singer', side: 'left', crop: { x: 180, y: 24, w: 145, h: 129 } },
    ],
  },
  sofa: {
    surface: 'journal',
    anchor: { x: 282, y: 78, w: 42, h: 30 },
    guests: [
      {
        id: 'sofa-and-cat',
        side: 'right',
        crop: { x: 184, y: 28, w: 235, h: 136 },
      },
    ],
  },
  library: {
    surface: 'bookcase',
    anchor: { x: 70, y: 30, w: 130, h: 118 },
    guests: [
      { id: 'reader', side: 'right', crop: { x: 226, y: 23, w: 190, h: 130 } },
    ],
  },
  studio: {
    surface: 'canvas',
    anchor: { x: 270, y: 28, w: 72, h: 111 },
    guests: [
      { id: 'painter', side: 'left', crop: { x: 151, y: 35, w: 124, h: 129 } },
    ],
  },
}
