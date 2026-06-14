// Tiny leveled logger. Writes JSON to stderr by default and can
// also tee to a file. Use the same logger from CLI, server, and
// agents so logs are easy to correlate.

import { Writable } from "node:stream";
import { promises as fs, createWriteStream } from "node:fs";
import path from "node:path";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export type LogFields = Record<string, unknown>;

export interface LoggerOptions {
  level?: LogLevel | string;
  sink?: Writable | null;
  file?: Writable | null;
  filePath?: string | null;
}

export class Logger {
  public levelNum: number;
  public level: LogLevel;
  public sink: Writable | null;
  public file: Writable | null;
  public filePath: string | null;
  public baseFields: LogFields;

  constructor({ level = "info", sink = process.stderr, file = null, filePath = null }: LoggerOptions = {}) {
    this.levelNum = LEVELS[level as LogLevel] ?? LEVELS.info;
    this.level = (LEVELS[level as LogLevel] != null ? level : "info") as LogLevel;
    this.sink = sink;
    this.file = file;
    this.filePath = filePath;
    this.baseFields = {};
  }

  child(fields: LogFields): Logger {
    const c = new Logger({ level: this.level, sink: this.sink, file: this.file, filePath: this.filePath });
    c.baseFields = { ...this.baseFields, ...fields };
    return c;
  }

  _write(level: LogLevel, msg: string, extra?: LogFields): void {
    if (LEVELS[level] < this.levelNum) return;
    const rec: LogFields = {
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

  debug(msg: string, extra?: LogFields): void { this._write("debug", msg, extra); }
  info(msg: string, extra?: LogFields): void { this._write("info", msg, extra); }
  warn(msg: string, extra?: LogFields): void { this._write("warn", msg, extra); }
  error(msg: string, extra?: LogFields): void { this._write("error", msg, extra); }
}

export const defaultLogger: Logger = new Logger({ level: (process.env.EDGEWELL_LOG as LogLevel | undefined) ?? "info" });

export async function fileLogger(filePath: string, level: LogLevel | string = "info"): Promise<Logger> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const file = createWriteStream(filePath, { flags: "a" });
  return new Logger({ level: level as LogLevel, file, filePath });
}
