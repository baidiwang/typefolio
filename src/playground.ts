/**
 * Design playground: try themes and fonts from the URL.
 *
 *   ?theme=valentine | hermes | cobalt
 *   ?font=cutive | space | plex
 *
 * Dev only (`npm run dev`): main.tsx imports this module only when
 * `import.meta.env.DEV`, so production builds contain neither it nor the
 * extra fonts. Everything is CSS variables, so a theme is
 * just a `data-theme` / `data-font` attribute on <html> (see index.css).
 * The default look is what you get with no parameters.
 */

const THEMES = ['valentine', 'hermes', 'cobalt'] as const

/** Applies URL overrides. Resolves once any extra font CSS is loaded. */
export async function applyPlayground(): Promise<void> {
  const FONTS: Record<string, () => Promise<unknown>> = {
    cutive: () => import('@fontsource/cutive-mono/400.css'),
    space: () => Promise.all([
      import('@fontsource/space-mono/400.css'),
      import('@fontsource/space-mono/700.css'),
    ]),
    plex: () => Promise.all([
      import('@fontsource/ibm-plex-mono/400.css'),
      import('@fontsource/ibm-plex-mono/700.css'),
    ]),
  }

  const params = new URLSearchParams(window.location.search)
  const root = document.documentElement

  const theme = params.get('theme')
  if (theme && (THEMES as readonly string[]).includes(theme)) root.dataset.theme = theme

  const font = params.get('font')
  if (font && font in FONTS) {
    await FONTS[font]()
    root.dataset.font = font
  }
}
