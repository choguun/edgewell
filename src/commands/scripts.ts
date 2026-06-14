// @ts-nocheck
// `edgewell scripts` lists the user-defined scripts that the v3.0.0
// shell integration can run. Scripts are plain Node.js files in
// `~/.edgewell/scripts/`. The list is read-only for now; the
// intent is to grow into a proper "task runner" in a later
// release.

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { c, header } from "../cli.js";

export async function scriptsCommand(_args) {
  header("User scripts");
  const dir = path.join(os.homedir(), ".edgewell", "scripts");
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch {
    console.log(c.dim("(no ~/.edgewell/scripts/ directory)"));
    return;
  }
  const scripts = entries.filter((f) => f.endsWith(".js") || f.endsWith(".mjs"));
  if (scripts.length === 0) {
    console.log(c.dim("(no scripts found)"));
    return;
  }
  for (const s of scripts) {
    console.log(`  ${c.cyan(s)}`);
  }
  console.log(c.dim(`(drop new scripts into ${dir})`));
}
