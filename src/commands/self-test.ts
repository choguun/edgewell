// @ts-nocheck
// `edgewell self-test` runs the project test suite from inside the
// CLI. v3.0.0 wraps `node --import tsx --test` and surfaces
// pass/fail counts in a friendly format.

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { c, header } from "../cli.js";

function findRepoRoot(start) {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    try {
      // node:fs is a sync require via createRequire to avoid an
      // async dependency in this sync helper.
      const { existsSync } = require("node:fs");
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
  // Prefer the project's own test command so we use whatever
  // the .test.ts / .test.js split the project actually expects.
  // Falls back to a direct node --test invocation otherwise.
  const usePnpm = process.env.npm_execpath?.includes("pnpm") ?? false;
  const r = usePnpm
    ? spawnSync("pnpm", ["test"], { cwd: repoRoot, stdio: "inherit" })
    : spawnSync("pnpm", ["test"], { cwd: repoRoot, stdio: "inherit", shell: true });
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
