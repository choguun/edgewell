// Bare HTTP server that starts the EdgeWell companion API.
// Uses bare-http1 and bare-fs for native filesystem access.
// The model is loaded on startup from the provided path.

import http from 'bare-http1'
import path from 'bare-path'
import { JsonlStore } from './store.mjs'
import { createRouter } from './router.mjs'
import { loadEdgeWellModel, unloadEdgeWellModel } from './qvac-bridge.mjs'

export async function startServer({ port = 8787, host = '127.0.0.1', dataDir = null, modelPath = null, webDir = null } = {}) {
  const resolveData = dir => dataDir ? path.join(dataDir, dir) : dir

  const journal = new JsonlStore(resolveData('journal.jsonl'))
  const expenses = new JsonlStore(resolveData('expenses.jsonl'))
  const router = createRouter({ journal, expenses, webDir })

  if (modelPath) {
    try {
      console.log('[server] Starting model load...')
      await loadEdgeWellModel(modelPath)
      console.log('[server] Model ready.')
    } catch (err) {
      console.error('[server] Model load failed:', err.message)
      console.error('[server] Server will 500 on /chat.')
    }
  } else {
    console.warn('[server] No modelPath provided — model not loaded.')
  }

  const server = http.createServer(router)
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, host, () => {
      console.log(`[server] EdgeWell companion listening on ${host}:${port}`)
      resolve()
    })
  })

  return server
}
