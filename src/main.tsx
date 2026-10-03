import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Cutive Mono has a single weight; index.css sets font-synthesis: none so
// the browser never fakes bold or italic.
import '@fontsource/cutive-mono/400.css'
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
