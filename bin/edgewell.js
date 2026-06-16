#!/usr/bin/env node
// EdgeWell CLI shim. Self-bootstrapping: spawns the actual entry
// (`bin/edgewell.ts`) under `node --import tsx/esm` so that a user
// who follows the README and types `node bin/edgewell.js <cmd>` (or
// even `edgewell` once installed globally) does not need to know
// about the tsx loader, the tsconfig, or the pnpm vs npm split.
//
// The compiled-output path (consumers / `pnpm pack`) hits
// `dist/bin/edgewell.js` instead, which has no `tsx` dependency.

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const entry = resolve(here, "edgewell.ts");

const child = spawn(
  process.execPath,
  ["--import", "tsx/esm", entry, ...process.argv.slice(2)],
  { stdio: "inherit" },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
