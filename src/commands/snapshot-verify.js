// `edgewell snapshot-verify <file.json>` checks that a snapshot
// matches the SHA-256 fingerprint in `<file>.sha256`. v3.0.0
// keeps this in JS so the offline test suite stays green.

import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import { c } from "../cli.js";

export async function snapshotVerifyCommand(args) {
  const [inPath] = args;
  if (!inPath) {
    console.error("usage: edgewell snapshot-verify <file.json>");
    process.exit(2);
  }
  const sidecar = `${inPath}.sha256`;
  let sidecarText;
  try {
    sidecarText = await fs.readFile(sidecar, "utf8");
  } catch {
    console.log(c.yellow(`(no ${sidecar}; nothing to verify against)`));
    return;
  }
  const expected = sidecarText.split(/\s+/)[0];
  const actual = createHash("sha256").update(await fs.readFile(inPath)).digest("hex");
  if (expected === actual) {
    console.log(c.green("fingerprint matches"));
  } else {
    console.log(c.red(`fingerprint mismatch: expected ${expected}, got ${actual}`));
    process.exit(1);
  }
}
