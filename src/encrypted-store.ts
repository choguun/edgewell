// @ts-nocheck
// EncryptedJsonlStore: drop-in replacement for JsonlStore that
// encrypts the entire file as a single envelope. Smaller blast
// radius for partial writes; slower for large datasets.

import { promises as fs } from "node:fs";
import path from "node:path";
import { encryptString, decryptString } from "./crypto.js";
import { validateRecord, ValidationError } from "./schema.js";

export class EncryptedJsonlStore {
  constructor(filePath, { schema = null, getPassphrase }) {
    this.filePath = filePath;
    this.schema = schema;
    this.getPassphrase = getPassphrase;
    this._writeLock = Promise.resolve();
  }

  async _ensure() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, JSON.stringify({ v: 0, empty: true }));
    }
  }

  async _readEnvelope() {
    await this._ensure();
    const raw = await fs.readFile(this.filePath, "utf8");
    if (!raw.trim()) return { v: 0, empty: true };
    return JSON.parse(raw);
  }

  async _readLines() {
    const env = await this._readEnvelope();
    if (env.empty) return [];
    const pass = await this.getPassphrase();
    const text = await decryptString(env, pass);
    return text.split("\n").filter((l) => l.trim().length > 0);
  }

  async _writeLines(lines) {
    const pass = await this.getPassphrase();
    const envelope = await encryptString(lines.join("\n") + "\n", pass);
    this._writeLock = this._writeLock.then(() =>
      fs.writeFile(this.filePath, JSON.stringify(envelope)),
    );
    return this._writeLock;
  }

  // Serialise the full read-modify-write cycle so concurrent
  // appends from multiple callers do not lose records.
  // The previous implementation only locked the underlying
  // fs.writeFile, so two appends that started at the same time
  // would both read the original file, both push, and only the
  // last write would survive — the other record was silently lost.
  async _withLock(fn) {
    let release;
    const next = new Promise((res) => { release = res; });
    const prev = this._lock || Promise.resolve();
    this._lock = next;
    try {
      await prev;
      return await fn();
    } finally {
      release();
    }
  }

  async append(record) {
    if (record === null || typeof record !== "object") {
      throw new Error("append requires a non-null object record");
    }
    if (this.schema) {
      const candidate = { ...record };
      if (!("_ts" in candidate)) candidate._ts = new Date().toISOString();
      validateRecord(candidate, this.schema);
    }
    const line = JSON.stringify({ ...record, _ts: record._ts ?? new Date().toISOString() });
    await this._withLock(async () => {
      const lines = await this._readLines();
      lines.push(line);
      await this._writeLines(lines);
    });
    return record;
  }

  async readAll() {
    const lines = await this._readLines();
    const out = [];
    for (const line of lines) {
      try {
        out.push(JSON.parse(line));
      } catch {
        // skip malformed
      }
    }
    return out;
  }

  async filter(predicate) {
    const all = await this.readAll();
    return all.filter(predicate);
  }

  async count() {
    return (await this.readAll()).length;
  }

  async clear() {
    await this._withLock(async () => {
      await this._writeLines([]);
    });
  }
}

export { ValidationError };
