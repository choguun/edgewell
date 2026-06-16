// @ts-nocheck
// `edgewell self-test` runs the project test suite from inside the
// CLI. v3.0.0 wraps `pnpm test` (the project's own test command)
// and surfaces pass/fail counts in a friendly format.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { c, header } from "../cli.js";

function findRepoRoot(start) {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    try {
      if (existsSync(path.join(dir, "package.json")) && existsSync(path.join(dir, "test"))) {
        return dir;
      }
    } catch {
      // ignore
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export async function selfTestCommand(_args, _ew) {
  header("EdgeWell self-test");
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = findRepoRoot(here) ?? ".";
  // Use the project's own test command so we get whatever
  // the .test.ts / .test.js split the project actually expects.
  // No shell: avoids Node's DEP0190 deprecation warning about
  // passing args through a shell. Filter Node's own deprecation
  // noise from the output so the user only sees test results.
  const r = spawnSync("pnpm", ["test"], {
    cwd: repoRoot,
    stdio: ["inherit", "inherit", "pipe"],
    env: { ...process.env, NODE_OPTIONS: "--no-deprecation" },
  });
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.error) {
    console.log(c.red(`self-test could not start: ${r.error.message}`));
    process.exit(1);
  }
  if (r.status !== 0) {
    console.log(c.red(`self-test failed (exit ${r.status})`));
    process.exit(r.status ?? 1);
  }
  console.log(c.green("self-test passed"));
}
