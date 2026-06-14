// @ts-nocheck
// `edgewell test-count` runs the project test suite and prints
// only the final summary line. v3.0.0 wraps `node --test` and
// greps the output for the "tests N pass N fail N" line.

import { spawnSync } from "node:child_process";
import { c } from "../cli.js";

export async function testCountCommand(_args) {
  const r = spawnSync("node", ["--test", "test/*.test.js"], { cwd: ".", encoding: "utf8" });
  const m = (r.stdout + r.stderr).match(/tests\s+(\d+)\s+pass\s+(\d+)\s+fail\s+(\d+)/);
  if (!m) {
    console.log(c.yellow("(could not parse summary)"));
    return;
  }
  console.log(`${c.bold("tests:")} ${m[1]}  ${c.green("pass:")} ${m[2]}  ${c.red("fail:")} ${m[3]}`);
}
