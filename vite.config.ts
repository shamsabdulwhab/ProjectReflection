import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In dev we want clean local URLs like `/join`.
// In production (e.g. GitHub Pages project site) we may need a subpath.
const base = process.env.NODE_ENV === 'production' ? '/project-reflection-main/' : '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
})
