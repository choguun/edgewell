// EncryptedJsonlStore: drop-in replacement for JsonlStore that
// encrypts the entire file as a single envelope. Smaller blast
// radius for partial writes; slower for large datasets.

import { promises as fs } from "node:fs";
import path from "node:path";
import { encryptString, decryptString } from "./crypto.js";
import { validateRecord, ValidationError, type SchemaNode } from "./schema.js";
import type { JsonlRecord } from "./store.js";

export interface EncryptedJsonlStoreOptions {
  schema?: SchemaNode | null;
  getPassphrase: () => Promise<string> | string;
}

export class EncryptedJsonlStore {
  public filePath: string;
  public schema: SchemaNode | null;
  public getPassphrase: () => Promise<string> | string;
  public _writeLock: Promise<unknown> = Promise.resolve();
  /** Internal lock for serializing concurrent read-modify-write. */
  private _lock: Promise<unknown> = Promise.resolve();

  constructor(filePath: string, { schema = null, getPassphrase }: EncryptedJsonlStoreOptions) {
    this.filePath = filePath;
    this.schema = schema;
    this.getPassphrase = getPassphrase;
  }

  async _ensure(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, JSON.stringify({ v: 0, empty: true }));
    }
  }

  private async _readEnvelope(): Promise<{ v: number; empty: boolean } | Record<string, unknown>> {
    await this._ensure();
    const raw = await fs.readFile(this.filePath, "utf8");
    if (!raw.trim()) return { v: 0, empty: true };
    return JSON.parse(raw) as { v: number; empty: boolean } | Record<string, unknown>;
  }

  private async _readLines(): Promise<string[]> {
    const env = await this._readEnvelope();
    if ("empty" in env && env.empty) return [];
    const pass = await this.getPassphrase();
    const text = await decryptString(env, pass);
    return text.split("\n").filter((l) => l.trim().length > 0);
  }

  private async _writeLines(lines: string[]): Promise<void> {
    const pass = await this.getPassphrase();
    const envelope = await encryptString(lines.join("\n") + "\n", pass);
    this._writeLock = this._writeLock.then(() =>
      fs.writeFile(this.filePath, JSON.stringify(envelope)),
    );
    return this._writeLock as Promise<void>;
  }

  /**
   * Serialise the full read-modify-write cycle so concurrent
   * appends from multiple callers do not lose records.
   * The previous implementation only locked the underlying
   * fs.writeFile, so two appends that started at the same time
   * would both read the original file, both push, and only the
   * last write would survive — the other record was silently lost.
   */
  private async _withLock<T>(fn: () => Promise<T>): Promise<T> {
    let release!: () => void;
    const next = new Promise<void>((res) => { release = res; });
    const prev = this._lock ?? Promise.resolve();
    this._lock = next;
    try {
      await prev;
      return await fn();
    } finally {
      release();
    }
  }

  async append<T extends JsonlRecord = JsonlRecord>(record: T): Promise<T> {
    if (record === null || typeof record !== "object") {
      throw new Error("append requires a non-null object record");
    }
    if (this.schema) {
      const candidate: JsonlRecord = { ...record };
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

  async readAll<T extends JsonlRecord = JsonlRecord>(): Promise<T[]> {
    const lines = await this._readLines();
    const out: T[] = [];
    for (const line of lines) {
      try {
        out.push(JSON.parse(line) as T);
      } catch {
        // skip malformed
      }
    }
    return out;
  }

  async filter<T extends JsonlRecord = JsonlRecord>(predicate: (record: T) => boolean): Promise<T[]> {
    const all = await this.readAll<T>();
    return all.filter(predicate);
  }

  async count(): Promise<number> {
    return (await this.readAll()).length;
  }

  async clear(): Promise<void> {
    await this._withLock(async () => {
      await this._writeLines([]);
    });
  }
}

export { ValidationError };
