// @ts-nocheck
// `edgewell test-list` greps the test files for `test("...")`
// declarations and prints a one-line summary per test. v3.0.0
// keeps this in JS so the offline test suite stays green.

import { promises as fs } from "node:fs";
import { c, header } from "../cli.js";

export async function testListCommand(_args) {
  header("Test list");
  let entries;
  try {
    entries = await fs.readdir("./test");
  } catch {
    console.log(c.yellow("(no ./test directory)"));
    return;
  }
  const tests = entries.filter((f) => f.endsWith(".test.js"));
  let count = 0;
  for (const f of tests) {
    const text = await fs.readFile(`./test/${f}`, "utf8");
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/test\(\s*["'`]([^"'`]+)["'`]/);
      if (m) {
        console.log(`  ${c.dim(f.padEnd(28))} ${m[1]}`);
        count++;
      }
    }
  }
  console.log(c.dim(`(${count} test cases across ${tests.length} files)`));
}
