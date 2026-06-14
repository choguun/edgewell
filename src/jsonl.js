// JSON read / parse helpers shared by the CLI commands. Centralising
// these gives every command consistent error messages and exit codes
// for malformed input, so users get a single, predictable experience
// regardless of which subcommand they hit.

import { promises as fs } from "node:fs";
import { c } from "./cli.js";

/**
 * Read a JSON file and parse it. Throws a tagged error on failure so
 * the caller can choose between printing a friendly message
 * (CLI) and re-throwing (test).
 *
 * @param {string} path  Absolute or CWD-relative path to read.
 * @param {{ exitOnError?: boolean, label?: string }} [opts]
 *   - exitOnError: if true (default), print a clear message and
 *     process.exit(1) on any failure.
 *   - label: human-friendly label for the file (default: path).
 * @returns {Promise<unknown>}
 */
export async function readJsonFile(path, { exitOnError = true, label } = {}) {
  const name = label ?? path;
  let raw;
  try {
    raw = await fs.readFile(path, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      const msg = `file not found: ${path}`;
      if (exitOnError) {
        console.error(c.red(msg));
        process.exit(1);
      }
      throw Object.assign(new Error(msg), { code: "ENOENT" });
    }
    throw err;
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    const msg = `${name} is not a valid JSON file: ${err.message}`;
    if (exitOnError) {
      console.error(c.red(msg));
      process.exit(1);
    }
    throw Object.assign(new Error(msg), { code: "EBADJSON", cause: err });
  }
  return data;
}
