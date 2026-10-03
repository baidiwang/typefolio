import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/courier-prime/400.css'
import '@fontsource/courier-prime/700.css'
import '@fontsource/courier-prime/400-italic.css'
import './index.css'
import App from './App.tsx'

// Dev-only theme/font overrides from the URL (src/playground.ts). The
// production build drops this branch, the module and its fonts entirely.
const ready = import.meta.env.DEV
  ? import('./playground').then((m) => m.applyPlayground())
  : Promise.resolve()

void ready.then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
