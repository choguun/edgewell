// Bridge between the HTTP server and @qvac/sdk.
// Handles model lifecycle and streaming completion.

import {
  completion,
  loadModel,
  unloadModel,
  LLAMA_3_2_1B_INST_Q4_0,
  VERBOSITY,
} from '@qvac/sdk'

let modelId = null

export function getModelId() {
  return modelId
}

export async function loadEdgeWellModel(modelPath) {
  if (modelId) return modelId

  console.log('[qvac-bridge] Loading model from:', modelPath)
  modelId = await loadModel({
    modelSrc: modelPath,
    modelType: 'llm',
    modelConfig: {
      device: 'gpu',
      ctx_size: 2048,
      verbosity: VERBOSITY.ERROR,
    },
    onProgress: (p) => {
      if (p && typeof p.loaded === 'number' && typeof p.total === 'number') {
        console.log(`[qvac-bridge] Load progress: ${Math.round((p.loaded / p.total) * 100)}%`)
      }
    },
  })
  console.log('[qvac-bridge] Model loaded:', modelId)
  return modelId
}

export async function unloadEdgeWellModel() {
  if (!modelId) return
  try {
    await unloadModel({ modelId })
  } catch (e) {
    console.error('[qvac-bridge] unload failed:', e.message)
  }
  modelId = null
}

export async function* streamCompletion(message, system) {
  if (!modelId) throw new Error('Model not loaded')

  const history = []
  if (system) history.push({ role: 'system', content: system })
  history.push({ role: 'user', content: message })

  const result = await completion({ modelId, history, stream: true })

  if (result.tokenStream) {
    for await (const token of result.tokenStream) {
      yield token
    }
  } else if (typeof result.text === 'string') {
    yield result.text
  }
}
