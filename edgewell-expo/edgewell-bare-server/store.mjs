// JSONL store backed by bare-fs.
// Mirrors the shape used by EdgeWell's JsonlStore so the companion API
// stays identical.

import fs from 'bare-fs'
import path from 'bare-path'

function uuid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export class JsonlStore {
  constructor(filePath) {
    this.filePath = filePath
  }

  async _ensureFile() {
    try {
      await fs.promises.access(this.filePath)
    } catch {
      const dir = path.dirname(this.filePath)
      await fs.promises.mkdir(dir, { recursive: true })
      await fs.promises.writeFile(this.filePath, '')
    }
  }

  async append(record) {
    await this._ensureFile()
    const line = JSON.stringify(record) + '\n'
    await fs.promises.appendFile(this.filePath, line)
    return record
  }

  async readAll() {
    await this._ensureFile()
    try {
      const data = await fs.promises.readFile(this.filePath, 'utf8')
      const lines = data.split('\n').filter(Boolean)
      return lines.map((line) => JSON.parse(line))
    } catch (err) {
      console.error('[store] readAll failed:', err)
      return []
    }
  }
}
