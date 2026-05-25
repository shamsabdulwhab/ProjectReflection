import fs from 'node:fs'
import path from 'node:path'

const distDir = path.join(process.cwd(), 'dist')
const indexPath = path.join(distDir, 'index.html')
const assetsDir = path.join(distDir, 'assets')

if (!fs.existsSync(indexPath)) {
  console.error('verify-dist: dist/index.html not found — run vite build first')
  process.exit(1)
}

const html = fs.readFileSync(indexPath, 'utf8')

if (html.includes('/src/main.tsx')) {
  console.error(
    'verify-dist: dist/index.html still references /src/main.tsx (dev entry). ' +
      'Set Netlify publish directory to "dist", not "." or the repo root.',
  )
  process.exit(1)
}

if (html.includes('/project-reflection-main/')) {
  console.error(
    'verify-dist: dist/index.html uses GitHub Pages base /project-reflection-main/. ' +
      'Unset VITE_BASE_PATH on Netlify; vite.config.ts forces "/" when NETLIFY=true.',
  )
  process.exit(1)
}

if (fs.existsSync(path.join(distDir, 'netlify.toml'))) {
  console.error(
    'verify-dist: dist/netlify.toml must not exist. ' +
      'Netlify publish directory must be "dist" (contents), not the repo root.',
  )
  process.exit(1)
}

const referenced = [...html.matchAll(/\/assets\/([^"']+)/g)].map((m) => m[1])
for (const file of referenced) {
  const filePath = path.join(assetsDir, file)
  if (!fs.existsSync(filePath)) {
    console.error(`verify-dist: index.html references /assets/${file} but file is missing`)
    process.exit(1)
  }
}

if (!referenced.some((f) => f.endsWith('.js'))) {
  console.error('verify-dist: index.html has no /assets/*.js bundle')
  process.exit(1)
}

const assetFiles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : []
if (assetFiles.length < 8) {
  console.error(
    `verify-dist: expected at least 8 files in dist/assets (got ${assetFiles.length}). ` +
      'Vite build likely did not run on the host.',
  )
  process.exit(1)
}

fs.writeFileSync(path.join(distDir, 'build-id.txt'), `${Date.now()}\n`)

console.log(`verify-dist: ok (${assetFiles.length} assets, ${referenced.length} referenced from index.html)`)
