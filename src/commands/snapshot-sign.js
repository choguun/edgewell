// `edgewell snapshot-sign <file.json>` computes a SHA-256
// fingerprint of a snapshot file and writes it to `<file>.sha256`.
// v3.0.0 keeps this in JS; the output is suitable for a
// `sha256sum -c` check.

import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import { c } from "../cli.js";

export async function snapshotSignCommand(args) {
  const [inPath] = args;
  if (!inPath) {
    console.error("usage: edgewell snapshot-sign <file.json>");
    process.exit(2);
  }
  const text = await fs.readFile(inPath);
  const hash = createHash("sha256").update(text).digest("hex");
  const out = `${inPath}.sha256`;
  await fs.writeFile(out, `${hash}  ${inPath}\n`);
  console.log(c.green(`wrote ${out}`));
}
