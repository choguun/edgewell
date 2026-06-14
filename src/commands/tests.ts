// @ts-nocheck
// `edgewell tests` lists the test files in the project. v3.0.0
// uses this as a quick sanity check that the test layout is
// intact.

import { promises as fs } from "node:fs";
import { c, header } from "../cli.js";

export async function testsCommand(_args) {
  header("Test files");
  let entries;
  try {
    entries = await fs.readdir("./test");
  } catch {
    console.log(c.yellow("(no ./test directory)"));
    return;
  }
  const tests = entries.filter((f) => f.endsWith(".test.js"));
  for (const t of tests) console.log(`  ${c.cyan(t)}`);
  console.log(c.dim(`(${tests.length} test files)`));
}
