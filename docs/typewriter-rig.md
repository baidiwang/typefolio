# Typewriter rig

The typewriter is a **rig**: an SVG with named groups that
[`Typewriter.tsx`](../src/typewriter/Typewriter.tsx) moves in response to the
reveal controller. The current shapes in
[`TypewriterRig.tsx`](../src/typewriter/TypewriterRig.tsx) are placeholders.
Replace them with your own artwork (e.g. a Figma export) by keeping the ids,
`data-*` hooks and conventions below.

## Coordinate system

- `viewBox="0 0 1400 280"` (`RIG_VIEWBOX` in [`rig.ts`](../src/typewriter/rig.ts)).
  If your artwork uses another size, update `RIG_VIEWBOX` and the 5:1
  `aspect-ratio` / `--typewriter-height: min(20vw, …)` in `src/index.css` to
  match its aspect ratio.
- The **top edge of the platen** is where the paper comes out. The whole
  `.typewriter` element is the reveal "inset": text becomes visible when it
  rises above its top edge.
- Desktop: `preserveAspectRatio="xMidYMax meet"`, bottom-centred.
- Mobile (< 640 px): the viewBox is **derived** at runtime as the union of the
  key row (`[data-nav-key]`, `[data-ui-key]`) plus the lower half of
  `#platen > rect`, padded. Move the keys and the strip follows.

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
| `[data-nav-key="resume" \| "email" \| "linkedin" \| "github"]` | yes (inside `#keys`) | `.is-pressed` → `translateY(4px)` | — | pointer down / Enter on its link |
| `[data-ui-key="sound"]` | yes (inside `#keys`) | `.is-pressed` → `translateY(4px)` | — | pointer down / Enter on the sound toggle |
| `[data-key]` | optional, any number | `translateY(0 → 4px → 0)` over 110 ms | — | a random one per typed character |
| `#body` | optional | none (static) | — | — |

`#typebar` and `#bell` are hidden on the mobile strip.

## Keycap links

The nav keys are **real HTML links** (`<a>`; the sound toggle is a
`<button aria-pressed>`) laid over the SVG. They aren't positioned with
hard-coded pixels: on mount, on every resize of the machine, and whenever the
viewBox changes, `Typewriter.tsx` reads each `[data-nav-key]` /
`[data-ui-key]` group's `getBoundingClientRect()` and places the matching
link exactly over it.

So when you swap in new artwork:

1. Draw each nav key as a group with the right `data-nav-key` value (and one
   `data-ui-key="sound"`). Any shape works; its bounding box is the hit area.
2. Keep labels **out of the SVG**: the label text is rendered in HTML (crisp,
   accessible, uses `--font-type`). Its size scales with the key height.
3. Links come from `site.links` in `src/content.ts`.

Each link gets a 10 px larger invisible touch area (`.keycap::before`), a
dashed red focus ring, and the pressed-key animation (`.keycap:active` plus
`.is-pressed` on the SVG group). Under reduced motion the press is shown
without movement.

## Sound

`src/typewriter/sound.ts` synthesises keystroke, return and bell sounds with
Web Audio. It's off on every visit; the round key toggles it. The
`AudioContext` is only created on that click.
