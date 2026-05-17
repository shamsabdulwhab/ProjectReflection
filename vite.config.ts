import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel/Netlify use `/`. For GitHub Pages subpaths set VITE_BASE_PATH e.g. `/project-reflection-main/`
const base = process.env.VITE_BASE_PATH ?? '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
})
