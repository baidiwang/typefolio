import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Sometype Mono at the two weights the design uses (body 400, titles 700);
// index.css sets font-synthesis: none so the browser never fakes others.
import '@fontsource/sometype-mono/400.css'
import '@fontsource/sometype-mono/700.css'
// Caveat 400 for the note by the toggle; Instrument Serif Italic for the
// name and signature.
import '@fontsource/caveat/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import './index.css'
import App from './App.tsx'

// Theme/font overrides from the URL (src/playground.ts), only in dev and on
// preview deployments (see vite.config.ts). Production builds drop this
// branch, the module and its fonts entirely.
const ready = __PLAYGROUND__
  ? import('./playground').then((m) => m.applyPlayground())
  : Promise.resolve()

void ready.then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
