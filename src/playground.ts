/**
 * Design playground: try variants from the URL.
 *
 *   ?machine=drawn | roller            (default: drawn)
 *   ?tw=red | olive                    (default: red; the typewriter's colour)
 *   ?paper=folded | grain | plain      (default: aged)
 *   ?font=plex | dmmono | cutive       (default: Sometype Mono)
 *   ?name=damion                       (default: Caveat 700; the name and the
 *                                       signature's lettering)
 *   ?theme=classic | hermes | cobalt   (earlier colour themes; default: none)
 *
 * Enabled in dev and on preview deployments: main.tsx imports this module
 * only when `__PLAYGROUND__` (vite.config.ts), so production builds contain
 * neither it nor the extra fonts. Each option is a `data-*` attribute on
 * <html> that index.css (and Typewriter.tsx, for the machine and colour)
 * reads. The default look is what you get with no parameters.
 */

/** Allowed values per option; the first is the default (no attribute). */
const OPTIONS = {
  machine: ['drawn', 'roller'],
  tw: ['red', 'olive'],
  paper: ['aged', 'folded', 'plain', 'grain'],
  theme: ['none', 'classic', 'hermes', 'cobalt'],
} as const

/** Applies URL overrides. Resolves once any extra font CSS is loaded. */
export async function applyPlayground(): Promise<void> {
  const FONTS: Record<string, () => Promise<unknown>> = {
    plex: () =>
      Promise.all([
        import('@fontsource/ibm-plex-mono/400.css'),
        import('@fontsource/ibm-plex-mono/700.css'),
      ]),
    dmmono: () =>
      Promise.all([import('@fontsource/dm-mono/400.css'), import('@fontsource/dm-mono/500.css')]),
    cutive: () => import('@fontsource/cutive-mono/400.css'),
  }
  const NAMES: Record<string, () => Promise<unknown>> = {
    damion: () => import('@fontsource/damion/400.css'),
  }

  const params = new URLSearchParams(window.location.search)
  const root = document.documentElement

  for (const [key, values] of Object.entries(OPTIONS)) {
    const value = params.get(key)
    if (value && value !== values[0] && (values as readonly string[]).includes(value)) {
      root.dataset[key] = value
    }
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
