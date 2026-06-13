// `edgewell snapshot-redact <file>` reads a snapshot JSON file and
// emits a redacted copy: emails, phone numbers, Thai national IDs,
// US SSNs, and IPv4 addresses are masked. v3.0.0 reuses the PII
// redaction primitives from v2.0.0 so the offline test suite stays
// green.

import { promises as fs } from "node:fs";
import path from "node:path";
import { c } from "../cli.js";
import { redact } from "../redact.js";

function walk(value, fn) {
  if (typeof value === "string") return fn(value);
  if (Array.isArray(value)) return value.map((v) => walk(v, fn));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = walk(v, fn);
    return out;
  }
  return value;
}

export async function snapshotRedactCommand(args) {
  const [inPath, outPath] = args;
  if (!inPath || !outPath) {
    console.error("usage: edgewell snapshot-redact <in.json> <out.json>");
    process.exit(2);
  }
  const absIn = path.resolve(inPath);
  const absOut = path.resolve(outPath);
  const raw = await fs.readFile(absIn, "utf8");
  const data = JSON.parse(raw);
  const redacted = walk(data, redact);
  await fs.writeFile(absOut, JSON.stringify(redacted, null, 2));
  console.log(c.green(`wrote redacted snapshot to ${absOut}`));
}
