// JSONL-backed append-only store for journal entries and expenses.
// Append-only is intentional: keeps the format simple and audit-friendly.

import { promises as fs } from "node:fs";
import path from "node:path";

export class JsonlStore {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async _ensure() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, "");
    }
  }

  async append(record) {
    await this._ensure();
    const line = JSON.stringify({ ...record, _ts: record._ts ?? new Date().toISOString() });
    await fs.appendFile(this.filePath, line + "\n", "utf8");
    return record;
  }

  async readAll() {
    await this._ensure();
    const raw = await fs.readFile(this.filePath, "utf8");
    const out = [];
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t) continue;
      try {
        out.push(JSON.parse(t));
      } catch {
        // skip malformed line
      }
    }
    return out;
  }

  async filter(predicate) {
    const all = await this.readAll();
    return all.filter(predicate);
  }
}
