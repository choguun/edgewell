// Bundles the EdgeWell Bare HTTP server for android-arm64.

import { execSync } from 'child_process'
import { existsSync, statSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

const entryPath = path.join(projectRoot, 'edgewell-bare-server', 'entry.mjs')
const outputPath = path.join(projectRoot, 'edgewell-bare-server', 'bundle.js')

function resolveBarePack() {
  const candidates = [
    path.join(projectRoot, 'node_modules', '.bin', 'bare-pack'),
    path.join(projectRoot, 'node_modules', 'bare-pack', 'bin.js'),
  ]
  for (const c of candidates) if (existsSync(c)) return c
  // pnpm virtual store fallback
  try {
    const found = execSync(
      'find node_modules/.pnpm -path "*bare-pack*/bin.js" -not -path "*.pnpm/node_modules/*" 2>/dev/null | head -1',
      { cwd: projectRoot, encoding: 'utf8' }
    ).trim()
    if (found) return path.join(projectRoot, found)
  } catch { /* ignore */ }
  return null
}

const barePackBin = resolveBarePack()
if (!barePackBin) {
  console.error('bare-pack not found. Run: npm install bare-pack')
  process.exit(1)
}

const importsMap = path.join(
  projectRoot, 'node_modules', '@qvac', 'sdk', 'bare-imports.json'
)
if (!existsSync(importsMap)) {
  console.error('bare-imports.json not found at', importsMap)
  process.exit(1)
}

mkdirSync(path.dirname(outputPath), { recursive: true })

console.log('Bundling EdgeWell server for android-arm64...')
console.log('  bare-pack:', barePackBin)
console.log('  Entry:', entryPath)
console.log('  Output:', outputPath)
console.log('  Imports:', importsMap)

try {
  execSync(
    `"${process.execPath}" "${barePackBin}" ` +
      '--host android-arm64 ' +
      '--linked ' +
      `--imports "${importsMap}" ` +
      `--out "${outputPath}" ` +
      `"${entryPath}"`,
    { cwd: projectRoot, stdio: 'inherit' }
  )
} catch (e) {
  console.error('bare-pack failed:', e.message)
  process.exit(1)
}

const stats = statSync(outputPath)
console.log(`Bundle created: ${(stats.size / 1024).toFixed(1)} KB`)
