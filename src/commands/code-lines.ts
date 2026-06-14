// @ts-nocheck
// `edgewell code-lines` counts the lines of code in `src/`,
// `test/`, and `docs/`. v3.0.0 keeps the count in JS so the
// offline test suite stays green.

import { promises as fs } from "node:fs";
import { c, header } from "../cli.js";

async function countLines(dir) {
  let total = 0;
  let files = 0;
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return { total: 0, files: 0 };
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      const sub = await countLines(`${dir}/${e.name}`);
      total += sub.total;
      files += sub.files;
    } else {
      const text = await fs.readFile(`${dir}/${e.name}`, "utf8");
      total += text.split(/\r?\n/).length;
      files++;
    }
  }
  return { total, files };
}

export async function codeLinesCommand(_args) {
  header("Code line counts");
  for (const dir of ["src", "test", "docs", "examples", "scripts", "web"]) {
    const { total, files } = await countLines(dir);
    if (total > 0) console.log(`  ${c.cyan(dir.padEnd(12))} ${total} lines across ${files} files`);
  }
}
