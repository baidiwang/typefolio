/**
 * Design playground: try themes and fonts from the URL.
 *
 *   ?theme=classic | hermes | cobalt   (default: valentine)
 *   ?font=courier | space | plex       (default: Cutive Mono; Plex at 500)
 *   ?paper=plain | grain               (default: folded)
 *   ?desk=teal | sage | oak | navy | charcoal   (default: powder blue)
 *   ?name=pacifico | satisfy           (default: Damion; the name and the
 *                                       signature's lettering)
 *
 * Enabled in dev and on preview deployments: main.tsx imports this module
 * only when `__PLAYGROUND__` (vite.config.ts), so production builds contain
 * neither it nor the extra fonts. Everything is CSS variables, so a theme is
 * just a `data-theme` / `data-font` attribute on <html> (see index.css).
 * The default look is what you get with no parameters.
 */

const THEMES = ['valentine', 'classic', 'hermes', 'cobalt'] as const
const PAPERS = ['folded', 'plain', 'grain'] as const
const DESKS = ['teal', 'sage', 'oak', 'navy', 'charcoal'] as const

/** Applies URL overrides. Resolves once any extra font CSS is loaded. */
export async function applyPlayground(): Promise<void> {
  // Only the weights each face is shown at: the design never uses bold.
  const FONTS: Record<string, () => Promise<unknown>> = {
    courier: () => import('@fontsource/courier-prime/400.css'),
    space: () => import('@fontsource/space-mono/400.css'),
    plex: () => import('@fontsource/ibm-plex-mono/500.css'),
  }

  const params = new URLSearchParams(window.location.search)
  const root = document.documentElement

  const theme = params.get('theme')
  // valentine is the default: no attribute needed.
  if (theme && theme !== 'valentine' && (THEMES as readonly string[]).includes(theme)) {
    root.dataset.theme = theme
  }

  // folded is the default: no attribute needed.
  const paper = params.get('paper')
  if (paper && paper !== 'folded' && (PAPERS as readonly string[]).includes(paper)) {
    root.dataset.paper = paper
  }

  // powder blue is the default: no attribute needed.
  const desk = params.get('desk')
  if (desk && (DESKS as readonly string[]).includes(desk)) {
    root.dataset.desk = desk
  }

  // Script faces for the name and signature; Damion (main.tsx) is the default.
  const NAMES: Record<string, () => Promise<unknown>> = {
    pacifico: () => import('@fontsource/pacifico/400.css'),
    satisfy: () => import('@fontsource/satisfy/400.css'),
  }
  const name = params.get('name')
  if (name && name in NAMES) {
    await NAMES[name]()
    root.dataset.name = name
  }

  const font = params.get('font')
  if (font && font in FONTS) {
    await FONTS[font]()
    root.dataset.font = font
  }
}
