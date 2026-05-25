# Builds dist, then deploys to Netlify (requires: npx netlify login once).
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot + '\..'
$env:NETLIFY = 'true'
npm run build
Write-Host ''
Write-Host 'Deploying dist/ to Netlify production...' -ForegroundColor Cyan
npx netlify deploy --prod --dir=dist
