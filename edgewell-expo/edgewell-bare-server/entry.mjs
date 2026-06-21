// EdgeWell Bare worklet entry point.
// Initialises QVAC plugins, then boots the companion HTTP server
// so the WebView can connect to http://localhost:8787.

import { initializeWorkerCore } from '@qvac/sdk/worker-core'
import { registerPlugin } from '@qvac/sdk/plugins'
import { llmPlugin } from '@qvac/sdk/llamacpp-completion/plugin'
import { embeddingsPlugin } from '@qvac/sdk/llamacpp-embedding/plugin'
import { startServer } from './server.mjs'

const args = JSON.parse(process.argv[2] || '{}')

const modelPath = args.MODEL_PATH || null
const dataDir = args.HOME_DIR || null
const webDir = args.WEB_DIR || null
const port = args.PORT || 8787

console.log('[entry] EdgeWell Bare worker starting')
console.log('[entry] Model:', modelPath || 'not provided')
console.log('[entry] Data:', dataDir)
console.log('[entry] Web:', webDir)
console.log('[entry] Port:', port)

// Init QVAC core and register plugins
initializeWorkerCore()
registerPlugin(llmPlugin)
registerPlugin(embeddingsPlugin)

console.log('[entry] QVAC plugins registered')

// Boot the HTTP server
startServer({ port, host: '127.0.0.1', dataDir, modelPath, webDir }).catch((err) => {
  console.error('[entry] Fatal server error:', err.message)
})
