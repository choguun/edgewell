// @ts-nocheck
// Tiny leveled logger. Writes JSON to stderr by default and can
// also tee to a file. Use the same logger from CLI, server, and
// agents so logs are easy to correlate.

import { Writable } from "node:stream";
import { promises as fs } from "node:fs";
import path from "node:path";

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

export class Logger {
  constructor({ level = "info", sink = process.stderr, file = null, filePath = null } = {}) {
    this.levelNum = LEVELS[level] ?? LEVELS.info;
    this.level = level;
    this.sink = sink;
    this.file = file;
    this.filePath = filePath;
    this.baseFields = {};
  }

  child(fields) {
    const c = new Logger({ level: this.level, sink: this.sink, file: this.file, filePath: this.filePath });
    c.baseFields = { ...this.baseFields, ...fields };
    return c;
  }

  _write(level, msg, extra) {
    if (LEVELS[level] < this.levelNum) return;
    const rec = {
      ts: new Date().toISOString(),
      level,
      msg,
      ...this.baseFields,
      ...(extra ?? {}),
    };
    const line = JSON.stringify(rec) + "\n";
    if (this.sink?.writable) this.sink.write(line);
    if (this.file?.writable) this.file.write(line);
  }

  debug(msg, extra) { this._write("debug", msg, extra); }
  info(msg, extra) { this._write("info", msg, extra); }
  warn(msg, extra) { this._write("warn", msg, extra); }
  error(msg, extra) { this._write("error", msg, extra); }
}

export const defaultLogger = new Logger({ level: process.env.EDGEWELL_LOG ?? "info" });

export async function fileLogger(filePath, level = "info") {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const file = (await import("node:fs")).createWriteStream(filePath, { flags: "a" });
  return new Logger({ level, file, filePath });
}
