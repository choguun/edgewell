// @ts-nocheck
// `edgewell test-coverage` prints a rough coverage estimate
// based on the ratio of test files to source files. v3.0.0
// does not enforce a coverage threshold — the ratio is a
// useful hint, not a hard rule.

import { promises as fs } from "node:fs";
import { c, header } from "../cli.js";

async function countJs(dir) {
  let n = 0;
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const e of entries) {
    if (e.isDirectory()) continue;
    if (!e.name.endsWith(".js")) continue;
    n++;
  }
  return n;
}

export async function testCoverageCommand(_args) {
  header("Test coverage (rough)");
  const src = await countJs("./src");
  const test = await countJs("./test");
  const ratio = src === 0 ? 0 : test / src;
  console.log(`${c.bold("src files:")}   ${src}`);
  console.log(`${c.bold("test files:")} ${test}`);
  console.log(`${c.bold("ratio:")}      ${ratio.toFixed(2)}`);
  if (ratio < 0.5) {
    console.log(c.yellow("(consider adding more tests)"));
  } else {
    console.log(c.green("(looks healthy)"));
  }
}
