// @ts-nocheck
// `edgewell docs` lists the documentation files in `docs/`. v3.0.0
// keeps this command so users can `cd` into the project and
// quickly see what is documented.

import { promises as fs } from "node:fs";
import { c, header } from "../cli.js";

export async function docsCommand(_args) {
  header("Documentation");
  let entries;
  try {
    entries = await fs.readdir("./docs");
  } catch {
    console.log(c.yellow("(no ./docs directory)"));
    return;
  }
  const md = entries.filter((f) => f.endsWith(".md")).sort();
  for (const f of md) console.log(`  ${c.cyan(f)}`);
  console.log(c.dim(`(${md.length} markdown files)`));
}
