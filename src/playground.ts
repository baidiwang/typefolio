/**
 * Design playground: try variants from the URL.
 *
 *   ?font=plex | dmmono | cutive       (default: Sometype Mono)
 *   ?name=damion                       (default: Caveat 700; the name and the
 *                                       signature's lettering)
 *
 * Enabled in dev and on preview deployments: main.tsx imports this module
 * only when `__PLAYGROUND__` (vite.config.ts), so production builds contain
 * neither it nor the extra fonts. Each option is a `data-*` attribute on
 * <html> that index.css reads. The default look is what you get with no
 * parameters.
 */

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
