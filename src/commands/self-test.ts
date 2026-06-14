// @ts-nocheck
// `edgewell self-test` runs the project test suite from inside the
// CLI. v3.0.0 wraps `node --test` and surfaces pass/fail counts in
// a friendly format.

import { spawnSync } from "node:child_process";
import { c, header } from "../cli.js";

export async function selfTestCommand(_args, _ew) {
  header("EdgeWell self-test");
  const r = spawnSync("node", ["--test", "test/*.test.js"], { cwd: ".", stdio: "inherit" });
  if (r.status !== 0) {
    console.log(c.red("self-test failed"));
    process.exit(r.status ?? 1);
  }
  console.log(c.green("self-test passed"));
}
