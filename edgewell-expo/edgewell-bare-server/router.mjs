// Tiny HTTP router for the Bare HTTP server.
// Mirrors the companion API shape so the web UI works unchanged.

import fs from 'bare-fs'
import path from 'bare-path'
import { routeAgent, getSystemPrompt } from './agents.mjs'
import { JsonlStore } from './store.mjs'
import { getModelId, streamCompletion } from './qvac-bridge.mjs'

const VERSION = '3.2.0-expo'
const MODEL = 'LLAMA_3_2_1B_INST_Q4_0'

function json(res, status, body) {
  const data = JSON.stringify(body)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Length', String(Buffer.from(data).length))
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type')
  res.end(data)
}

function sseStart(res) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('X-Accel-Buffering', 'no')
  if (res.flushHeaders) res.flushHeaders()
}

function sseWrite(res, eventName, data) {
  let frame = ''
  if (eventName) frame += `event: ${eventName}\n`
  frame += `data: ${JSON.stringify(data)}\n\n`
  res.write(frame)
}

function sseEnd(res) {
  res.end()
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      data += buf.toString('utf8')
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch (e) {
        resolve({})
      }
    })
    req.on('error', reject)
  })
}

export function createRouter({ journal, expenses, webDir = null }) {
  const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
  }

  async function tryServeStatic(res, filePath) {
    try {
      const data = await fs.promises.readFile(filePath)
      const ext = path.extname(filePath).toLowerCase()
      const mime = MIME[ext] || 'application/octet-stream'
      res.statusCode = 200
      res.setHeader('Content-Type', mime)
      res.setHeader('Content-Length', String(data.length))
      res.setHeader('Cache-Control', 'public, max-age=300')
      res.end(data)
      return true
    } catch {
      return false
    }
  }

  async function handleRequest(req, res) {
    const method = (req.method || 'GET').toUpperCase()
    const url = req.url || '/'
    const path = url.split('?')[0]

    if (method === 'OPTIONS') {
      res.statusCode = 204
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type')
      res.end()
      return
    }

    try {
      if (method === 'GET' && path === '/health') {
        const journalEntries = await journal.readAll()
        const expenseEntries = await expenses.readAll()
        json(res, 200, {
          ok: true,
          name: 'edgewell-companion',
          version: VERSION,
          agents: ['health', 'finance', 'sleep', 'nutrition', 'hydration', 'activity'],
          profile: 'mobile',
          model: MODEL,
          delegateModel: null,
          demo: false,
          p2p: { enabled: false, host: null, port: null },
          counts: { journal: journalEntries.length, expenses: expenseEntries.length },
        })
        return
      }

      if (method === 'GET' && path === '/profile') {
        json(res, 200, { profile: { name: 'On-Device User', formFactor: 'mobile', localModel: MODEL } })
        return
      }

      if (path === '/journal') {
        if (method === 'GET') {
          const entries = await journal.readAll()
          const limit = getQueryLimit(url, 50)
          json(res, 200, { entries: entries.slice(-limit) })
        } else if (method === 'POST') {
          const body = await readBody(req)
          if (!body || typeof body.text !== 'string') {
            return json(res, 400, { error: 'body.text is required' })
          }
          const record = {
            _ts: new Date().toISOString(),
            text: body.text,
            tags: Array.isArray(body.tags) ? body.tags : [],
            mood: body.mood ?? null,
          }
          await journal.append(record)
          json(res, 201, { entry: record })
        }
        return
      }

      if (path === '/expenses') {
        if (method === 'GET') {
          const entries = await expenses.readAll()
          const limit = getQueryLimit(url, 50)
          json(res, 200, { expenses: entries.slice(-limit) })
        } else if (method === 'POST') {
          const body = await readBody(req)
          if (!body || typeof body.amount !== 'number') {
            return json(res, 400, { error: 'body.amount must be a number' })
          }
          const record = {
            _ts: new Date().toISOString(),
            amount: body.amount,
            category: body.category ?? 'other',
            note: body.note ?? null,
          }
          await expenses.append(record)
          json(res, 201, { expense: record })
        }
        return
      }

      if (path === '/chat') {
        if (method === 'POST') {
          const body = await readBody(req)
          if (!body || typeof body.message !== 'string') {
            return json(res, 400, { error: 'body.message is required' })
          }
          const agent = routeAgent(body.message)
          const system = getSystemPrompt(agent)
          let reply = ''
          try {
            for await (const token of streamCompletion(body.message, system)) {
              reply += token
            }
          } catch (e) {
            console.error('[chat] completion failed:', e.message)
            reply = `[${agent}] Error: ${e.message}`
          }
          json(res, 200, { reply })
        }
        return
      }

      if (path === '/chat/stream') {
        if (method === 'POST') {
          const body = await readBody(req)
          if (!body || typeof body.message !== 'string') {
            return json(res, 400, { error: 'body.message is required' })
          }
          const agent = routeAgent(body.message)
          const system = getSystemPrompt(agent)
          sseStart(res)
          sseWrite(res, 'route', { type: 'route', agent })
          sseWrite(res, 'context', { type: 'context', hits: [] })
          try {
            for await (const token of streamCompletion(body.message, system)) {
              sseWrite(res, 'token', { type: 'token', text: token })
            }
          } catch (e) {
            sseWrite(res, 'error', { type: 'error', message: e.message })
          }
          sseWrite(res, 'done', { type: 'done' })
          sseEnd(res)
        }
        return
      }

      // Static file fallback: serve from webDir if provided
      if (method === 'GET' && webDir) {
        const relPath = path === '/' ? 'index.html' : path.slice(1).replace(/\.\.\//g, '')
        const fullPath = path.join(webDir, relPath)
        const served = await tryServeStatic(res, fullPath)
        if (served) return
        // SPA fallback: serve index.html for unknown paths
        if (!served && !relPath.startsWith('favicon')) {
          const indexServed = await tryServeStatic(res, path.join(webDir, 'index.html'))
          if (indexServed) return
        }
      }

      json(res, 404, { error: 'not found', path })
    } catch (err) {
      console.error('[router] error:', err.message)
      if (!res.writableEnded) {
        json(res, 500, { error: 'internal', detail: err.message })
      }
    }
  }

  return handleRequest
}

function getQueryLimit(url, defaultLimit) {
  try {
    const parsed = new URL(url, 'http://x')
    return Number(parsed.searchParams.get('limit') ?? defaultLimit)
  } catch {
    return defaultLimit
  }
}
