import spriteMetadata from './sprites.json'
import pianistMetadata from './pianist.json'
import type { WindowProject } from './projects'
import { windows } from './projects'
import { roomFit, rooms } from './rooms'
import type { Rect, RoomKind } from './rooms'

type Still = {
  key: 'standing' | 'seated' | 'reader' | 'cat' | 'pianist'
  frame: number
  x: number
  foot: number
  height: number
  ref: number
}
const stills: Record<RoomKind, Still[]> = {
  piano: [{ key: 'pianist', frame: 0, x: 182, foot: 162, height: 116, ref: 0 }],
  studio: [
    { key: 'standing', frame: 5, x: 222, foot: 162, height: 108, ref: 4 },
  ],
  music: [
    { key: 'standing', frame: 8, x: 242, foot: 149, height: 109, ref: 8 },
  ],
  sofa: [
    { key: 'seated', frame: 0, x: 296, foot: 137, height: 90, ref: 0 },
    { key: 'cat', frame: 0, x: 61, foot: 161, height: 31, ref: 0 },
  ],
  dining: [
    { key: 'seated', frame: 4, x: 155, foot: 161, height: 93, ref: 4 },
    { key: 'seated', frame: 8, x: 310, foot: 161, height: 93, ref: 8 },
  ],
  library: [
    { key: 'reader', frame: 0, x: 300, foot: 145, height: 105, ref: 0 },
  ],
}
const cycles: Record<RoomKind, number[][]> = {
  piano: [[0, 1, 0, 2, 1]],
  studio: [[5, 6, 5, 7, 4]],
  music: [[8, 9, 8, 10, 11]],
  sofa: [[0, 1, 0, 2], [0]],
  dining: [
    [4, 6, 4, 5],
    [8, 8, 9, 10, 8],
  ],
  library: [[0, 1, 2, 1, 3]],
}
function RoomLayers({
  entry,
  residents = true,
  step,
  visiting = false,
}: {
  entry: WindowProject
  residents?: boolean
  step?: number
  visiting?: boolean
}) {
  const fit = roomFit(entry.scene, entry.rect),
    source = rooms[entry.scene].source
  return (
    <>
      <image
        href="/scene/city-resume-usps.webp"
        x={fit.x - source.x * fit.scale}
        y={fit.y - source.y * fit.scale}
        width={1536 * fit.scale}
        height={1024 * fit.scale}
      />
      {residents &&
        stills[entry.scene].map((still, index) => {
          const meta =
            still.key === 'pianist'
              ? pianistMetadata
              : spriteMetadata[still.key]
          const sequence = cycles[entry.scene][index]
          const pose =
            step === undefined
              ? still.frame
              : sequence[
                  Math.floor(step * (index === 1 ? 0.7 : 1)) % sequence.length
                ]
          const frame = meta.frames[pose] as {
            x: number
            y: number
            w: number
            h: number
            anchor: number
            baseline?: number
          }
          const scale = still.height / meta.frames[still.ref].h
          const anchor = visiting && still.key === 'cat' ? 350 : still.x
          const x =
            fit.x + (anchor + (frame.x - frame.anchor) * scale) * fit.scale
          const y =
            fit.y +
            (still.foot -
              (frame.baseline ? frame.baseline - frame.y : frame.h) * scale) *
              fit.scale
          return (
            <svg
              key={index}
              data-resident-key={still.key}
              data-resident-frame={pose}
              x={x}
              y={y}
              width={frame.w * scale * fit.scale}
              height={frame.h * scale * fit.scale}
              viewBox={`${frame.x} ${frame.y} ${frame.w} ${frame.h}`}
              overflow="hidden"
            >
              <image
                href={`/scene/${still.key}.webp`}
                width={meta.width}
                height={meta.height}
              />
            </svg>
          )
        })}
      {entry.scene === 'dining' && (
        <svg
          x={fit.x + 168 * fit.scale}
          y={fit.y + 110 * fit.scale}
          width={123 * fit.scale}
          height={53 * fit.scale}
          viewBox="1143 435 123 53"
          overflow="hidden"
        >
          <image
            href="/scene/city-resume-usps.webp"
            width="1536"
            height="1024"
          />
        </svg>
      )}
    </>
  )
}
// Existing bitmap layers only: the SVG registers source artwork and sprite crops.
export function RoomArtwork({
  entry,
  residents = true,
}: {
  entry: WindowProject
  residents?: boolean
}) {
  return (
    <svg
      className="room-art"
      viewBox={`0 0 ${entry.rect.w} ${entry.rect.h}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <RoomLayers entry={entry} residents={residents} />
    </svg>
  )
}
export function ResidentVignette({
  entry,
  crop,
  step,
}: {
  entry: WindowProject
  crop: Rect
  step: number
}) {
  const fit = roomFit(entry.scene, entry.rect)
  return (
    <svg
      className="resident-vignette"
      viewBox={`${fit.x + crop.x * fit.scale} ${fit.y + crop.y * fit.scale} ${crop.w * fit.scale} ${crop.h * fit.scale}`}
      aria-hidden="true"
    >
      <RoomLayers entry={entry} step={step} visiting />
    </svg>
  )
}
export function NeighborhoodArtwork() {
  return (
    <div className="study-neighborhood" aria-hidden="true">
      <div className="study-world">
        <img
          className="study-world-base"
          src="/scene/city-resume-usps.webp"
          alt=""
        />
        {windows.map((entry) => (
          <div
            key={entry.id}
            className="study-room"
            style={{
              left: `${(entry.rect.x / 1536) * 100}%`,
              top: `${(entry.rect.y / 1024) * 100}%`,
              width: `${(entry.rect.w / 1536) * 100}%`,
              height: `${(entry.rect.h / 1024) * 100}%`,
            }}
          >
            <RoomArtwork entry={entry} />
          </div>
        ))}
      </div>
    </div>
  )
}
