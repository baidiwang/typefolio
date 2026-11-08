import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    // Design playground (?font=, ?name=; src/playground.ts): on in dev and
    // on Vercel preview deployments (VERCEL_ENV=preview), off in production.
    // PLAYGROUND=1 forces it on for any other build.
    __PLAYGROUND__: JSON.stringify(
      mode === 'development' ||
        process.env.VERCEL_ENV === 'preview' ||
        process.env.PLAYGROUND === '1',
    ),
  },
}))
