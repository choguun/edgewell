// JSONL-backed append-only store for journal entries and expenses.
// Append-only is intentional: keeps the format simple and audit-friendly.

import { promises as fs } from "node:fs";
import path from "node:path";
import { validateRecord, ValidationError, type SchemaNode } from "./schema.js";

export type JsonlRecord = Record<string, unknown> & { _ts?: string };

export interface JsonlStoreOptions {
  schema?: SchemaNode | null;
  strict?: boolean;
}

export class JsonlStore<T extends JsonlRecord = JsonlRecord> {
  public filePath: string;
  public schema: SchemaNode | null;
  public strict: boolean;

  constructor(filePath: string, { schema = null, strict = false }: JsonlStoreOptions = {}) {
    this.filePath = filePath;
    this.schema = schema;
    this.strict = strict;
  }

  async _ensure(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, "");
    }
  }

  async append(record: T): Promise<T> {
    if (record === null || typeof record !== "object") {
      throw new Error("append requires a non-null object record");
    }
    if (this.schema) {
      const candidate: JsonlRecord = { ...record };
      if (!("_ts" in candidate)) candidate._ts = new Date().toISOString();
      validateRecord(candidate, this.schema);
    }
    await this._ensure();
    const line = JSON.stringify({ ...record, _ts: record._ts ?? new Date().toISOString() });
    await fs.appendFile(this.filePath, line + "\n", "utf8");
    return record;
  }

  async readAll(): Promise<T[]> {
    await this._ensure();
    const raw = await fs.readFile(this.filePath, "utf8");
    const out: T[] = [];
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t) continue;
      try {
        out.push(JSON.parse(t) as T);
      } catch (err) {
        if (this.strict) {
          throw new Error(`malformed line in ${this.filePath}: ${(err as Error).message}`);
        }
        // skip malformed line
      }
    }
    return out;
  }

  async filter(predicate: (record: T) => boolean): Promise<T[]> {
    const all = await this.readAll();
    return all.filter(predicate);
  }

  async count(): Promise<number> {
    const all = await this.readAll();
    return all.length;
  }

  async clear(): Promise<void> {
    await this._ensure();
    await fs.writeFile(this.filePath, "");
  }
}

export { ValidationError };
