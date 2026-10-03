import type { Ref } from 'react'
import { RIG_VIEWBOX } from './rig'

/**
 * Placeholder typewriter artwork, built as a rig of named groups.
 *
 * Replace the shapes freely (e.g. with an SVG exported from Figma) but keep
 * the ids, the `data-*` hooks and the coordinate conventions documented in
 * docs/typewriter-rig.md. Typewriter.tsx animates these groups imperatively;
 * nothing here knows about animation.
 *
 * Coordinate system: viewBox 0 0 1400 280. The top edge of the platen is the
 * line the paper emerges from.
 */


const BODY = 'var(--tw-body)'
const BODY_DARK = 'var(--tw-body-dark)'
const CHROME = 'var(--tw-chrome)'
const PLATEN = 'var(--tw-platen)'
const KEY = 'var(--tw-key)'
const KEY_EDGE = 'var(--tw-key-edge)'

// Decorative round keys: three staggered rows. The top row is marked
// `data-strip-row`: the mobile strip crops to it (plus the platen edge).
const ROWS = [
  { y: 160, count: 11, x0: 341, strip: true },
  { y: 214, count: 12, x0: 305, strip: false },
  { y: 252, count: 11, x0: 341, strip: false },
]

export function TypewriterRig({ svgRef }: { svgRef: Ref<SVGSVGElement> }) {
  const { x, y, width, height } = RIG_VIEWBOX
  return (
    <svg
      ref={svgRef}
      className="typewriter__rig"
      viewBox={`${x} ${y} ${width} ${height}`}
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      focusable="false"
    >
      {/* Static chassis. */}
      <g id="body">
        <path d="M150 64 H1250 L1345 280 H55 Z" fill={BODY} />
        <path d="M150 64 H1250 L1262 92 H138 Z" fill={BODY_DARK} />
        {/* Typebar basket slot */}
        <path d="M520 100 Q700 78 880 100 L866 116 Q700 96 534 116 Z" fill={BODY_DARK} />
      </g>

      {/* Moves left one step per typed character; returns at line end. */}
      <g id="carriage">
        <rect x="80" y="54" width="1240" height="12" rx="6" fill={CHROME} />
        {/* Carriage-return lever */}
        <path d="M70 32 L18 6" stroke={CHROME} strokeWidth="9" strokeLinecap="round" />

        {/* The roller. Its top edge is where the paper comes out. */}
        <g id="platen">
          <rect x="100" y="10" width="1200" height="46" rx="23" fill={PLATEN} />
          <rect x="112" y="16" width="1176" height="6" rx="3" fill="#ffffff" opacity="0.12" />
          <g id="platen-knob-left" data-knob="">
            <circle cx="70" cy="33" r="26" fill={PLATEN} />
            <path d="M70 11 V55 M48 33 H92" stroke={CHROME} strokeWidth="3" />
          </g>
          <g id="platen-knob-right" data-knob="">
            <circle cx="1330" cy="33" r="26" fill={PLATEN} />
            <path d="M1330 11 V55 M1308 33 H1352" stroke={CHROME} strokeWidth="3" />
          </g>
        </g>
      </g>

      {/* Strikes the platen on every character. Pivot: (700, 122). */}
      <g id="typebar">
        <rect x="696" y="60" width="8" height="64" rx="3" fill={CHROME} />
        <rect x="688" y="56" width="24" height="9" rx="2" fill={CHROME} />
      </g>

      {/* Rings at line end. Pivot: (1205, 112). */}
      <g id="bell">
        <path d="M1180 112 A25 25 0 0 1 1230 112 Z" fill={CHROME} />
        <circle cx="1205" cy="85" r="4" fill={CHROME} />
      </g>

      <g id="keys">
        {ROWS.map((row) => (
          <g key={row.y} {...(row.strip ? { 'data-strip-row': '' } : {})}>
            {Array.from({ length: row.count }, (_, i) => (
              <g key={i} data-key="">
                <circle
                  cx={row.x0 + i * 72}
                  cy={row.y}
                  r="19"
                  fill={KEY}
                  stroke={KEY_EDGE}
                  strokeWidth="4"
                />
              </g>
            ))}
          </g>
        ))}
        <g data-key="space">
          <rect x="470" y="270" width="460" height="16" rx="9" fill={KEY} stroke={KEY_EDGE} strokeWidth="4" />
        </g>
      </g>
    </svg>
  )
}
