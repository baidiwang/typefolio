# Typewriter rig

The typewriter is a **rig**: an SVG with named groups that
[`Typewriter.tsx`](../src/typewriter/Typewriter.tsx) moves in response to the
reveal controller. The current shapes in
[`TypewriterRig.tsx`](../src/typewriter/TypewriterRig.tsx) are placeholders.
Replace them with your own artwork (e.g. a Figma export) by keeping the ids,
`data-*` hooks and conventions below.

## Coordinate system

- Artwork coordinates: `viewBox="0 0 1400 280"` (`RIG_VIEWBOX` in
  [`rig.ts`](../src/typewriter/rig.ts)).
- Desktop shows a crop of it, `DESKTOP_VIEWBOX` = `0 0 1400 240`: full width,
  with the lower key rows running off the bottom of the screen. That keeps
  the machine about 160 px tall while the platen still spans the paper.
  If your artwork uses another size or crop, update `DESKTOP_VIEWBOX` and the
  matching `aspect-ratio: 1400 / 240` and
  `--typewriter-height: min(calc(100vw * 240 / 1400), 160px, 30vh)` in
  `src/index.css`.
- The **top edge of the platen** is where the paper comes out. The whole
  `.typewriter` element is the reveal "inset": text becomes visible when it
  rises above its top edge.
- Desktop: `preserveAspectRatio="xMidYMax meet"`, bottom-centred.
- Mobile (< 640 px): the viewBox is **derived** at runtime as the union of the
  top key row (`[data-strip-row]`) plus the lower half of `#platen > rect`,
  padded. Move the keys and the strip follows.

## Groups

All transforms are applied by script as inline CSS `transform`. Lengths are
in SVG user units. Pivots use `transform-box: fill-box` (set in `index.css`),
so they're relative to each group's own bounding box and survive viewBox
changes and new artwork.

| Selector | Required | Transform it receives | Pivot | When |
| --- | --- | --- | --- | --- |
| `#carriage` | yes | `translateX(−column × 2.4)` (`CARRIAGE_STEP`); back to `translateX(0)` with a 260 ms ease on carriage return | — | every typed character; line end; idle |
| `#platen` | yes (inside `#carriage`) | none itself; moves with the carriage. Its first `<rect>` defines the platen edge for the mobile crop | — | — |
| `[data-knob]` | optional (inside `#platen`) | `rotate(n × 24deg)`, cumulative | centre (`50% 50%`) | each line feed / carriage return |
| `#typebar` | optional | strike: `rotate(0 → −16deg → 0)` over 90 ms (Web Animations) | bottom centre (`50% 100%`) | each non-space character, max one per frame |
| `#bell` | optional | ring: `rotate(0 → 14 → −10 → 0deg)` over 360 ms | top centre (`50% 0%`) | end of an element (`bell: true` events) |
| `#keys` | yes | none | — | — |
| `[data-strip-row]` | yes (inside `#keys`) | none; its bounding box defines the mobile strip's crop | — | — |
| `[data-key]` | optional, any number | `translateY(0 → 4px → 0)` over 110 ms | — | a random one per typed character |
| `#body` | optional | none (static) | — | — |

`#typebar` and `#bell` are hidden on the mobile strip.

## Nothing interactive

The typewriter is decorative: the SVG is `aria-hidden` and nothing on it is
focusable. The contact links are printed on the paper (letterhead and
closing), and the sound toggle is its own button in the top-right corner
([`SoundToggle.tsx`](../src/components/SoundToggle.tsx)).

## Sound

`src/typewriter/sound.ts` synthesises keystroke, return and bell sounds with
Web Audio. It's off on every visit; the speaker button toggles it. The
`AudioContext` is only created on that click.
