import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Netlify always serves from domain root (NETLIFY=true at build time).
// For GitHub Pages subpaths only, set VITE_BASE_PATH e.g. `/project-reflection-main/`
const base =
  process.env.NETLIFY === 'true' ? '/' : (process.env.VITE_BASE_PATH ?? '/')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
})
