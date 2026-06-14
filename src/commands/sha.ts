// @ts-nocheck
// `edgewell sha <text>` prints the SHA-256 of the given text. v3.0.0
// keeps this as a tiny utility for users who want to fingerprint
// journal entries or other on-disk data.

import { createHash } from "node:crypto";
import { c } from "../cli.js";

export async function shaCommand(args) {
  const text = args.join(" ");
  if (!text) {
    console.error("usage: edgewell sha <text>");
    process.exit(2);
  }
  const h = createHash("sha256").update(text).digest("hex");
  console.log(c.cyan(h));
}
