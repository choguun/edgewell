// Embeds web files and server bundle as TypeScript string exports.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '..')

// --- Web files ---
const webDir = path.join(projectRoot, 'assets', 'web')
const webFiles = readdir(webDir)
const webExports = []
let webLines = ['// Auto-generated web asset strings.', 'export const webFiles: Record<string, string> = {']

for (const name of webFiles) {
  const content = readFileSync(path.join(webDir, name), 'utf8')
  const escaped = escapeTemplate(content)
  webLines.push(`  ${JSON.stringify(name)}: \`${escaped}\`,`)
}
webLines.push('}')
webLines.push('')

writeFileSync(path.join(projectRoot, 'src', 'web-assets.ts'), webLines.join('\n'))
console.log(`Generated src/web-assets.ts with ${webFiles.length} files`)

// --- Server bundle ---
const bundlePath = path.join(projectRoot, 'edgewell-bare-server', 'bundle.js')
const bundleContent = readFileSync(bundlePath, 'utf8')
const bundleTs = '/** Auto-generated Bare server bundle string. */\nexport const serverBundle: string = `' + escapeTemplate(bundleContent) + '`\n'
writeFileSync(path.join(projectRoot, 'src', 'server-bundle.ts'), bundleTs)
console.log(`Generated src/server-bundle.ts (${(bundleContent.length / 1024).toFixed(0)} KB)`)

function readdir(dir) {
  if (!existsSync(dir)) return []
  return require('fs').readdirSync(dir).filter(f => !f.startsWith('.'))
}

function escapeTemplate(s) {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
}
