// JSON read / parse helpers shared by the CLI commands. Centralising
// these gives every command consistent error messages and exit codes
// for malformed input, so users get a single, predictable experience
// regardless of which subcommand they hit.

import { promises as fs } from "node:fs";
import { c } from "./cli.js";

export interface ReadJsonFileOptions {
  exitOnError?: boolean;
  label?: string;
}

export class JsonFileNotFoundError extends Error {
  override readonly cause?: unknown;
  readonly code = "ENOENT" as const;
  constructor(message: string) {
    super(message);
    this.name = "JsonFileNotFoundError";
  }
}

export class JsonFileParseError extends Error {
  override readonly cause?: unknown;
  readonly code = "EBADJSON" as const;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "JsonFileParseError";
    this.cause = cause;
  }
}

/**
 * Read a JSON file and parse it. Throws a tagged error on failure so
 * the caller can choose between printing a friendly message
 * (CLI) and re-throwing (test).
 *
 * @param path  Absolute or CWD-relative path to read.
 * @param opts
 *   - exitOnError: if true (default), print a clear message and
 *     process.exit(1) on any failure.
 *   - label: human-friendly label for the file (default: path).
 */
export async function readJsonFile(
  path: string,
  { exitOnError = true, label }: ReadJsonFileOptions = {},
): Promise<unknown> {
  const name = label ?? path;
  let raw: string;
  try {
    raw = await fs.readFile(path, "utf8");
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e?.code === "ENOENT") {
      const msg = `file not found: ${path}`;
      if (exitOnError) {
        console.error(c.red(msg));
        process.exit(1);
      }
      throw new JsonFileNotFoundError(msg);
    }
    throw err;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    const msg = `${name} is not a valid JSON file: ${(err as Error).message}`;
    if (exitOnError) {
      console.error(c.red(msg));
      process.exit(1);
    }
    throw new JsonFileParseError(msg, err);
  }
}
