// EdgeWell CLI entry. Dispatches to a subcommand module.

import { readPackageJson } from "../src/config.js";
import { createEdgeWell } from "../src/index.js";
import { dispatch } from "../src/dispatch.js";

const HELP_FLAGS = new Set(["--help", "-h"]);
const VERSION_FLAGS = new Set(["--version", "-v", "-V"]);

export async function main(): Promise<void> {
  // Skip a leading `--` so `pnpm start -- version` works the same
  // as `node --import tsx/esm bin/edgewell.js version`.
  const argv = process.argv.slice(2);
  const startIdx = argv[0] === "--" ? 1 : 0;
  const tail = argv.slice(startIdx);

  // Standard CLI conventions: --version / -v prints the version
  // and exits; --help / -h prints help and exits. These must
  // work even before we instantiate the EdgeWell runtime.
  if (tail.some((a) => VERSION_FLAGS.has(a))) {
    const pkg = readPackageJson() as { version?: string };
    console.log(`edgewell v${pkg.version ?? "0.0.0"}`);
    return;
  }
  if (tail.length === 0 || tail.every((a) => HELP_FLAGS.has(a))) {
    await dispatch("help", [], createEdgeWell());
    return;
  }

  const cmd = tail[0] ?? "help";
  const rest = tail.slice(1);

  const ew = createEdgeWell();
  try {
    await dispatch(cmd, rest, ew);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("error:", message);
    process.exit(1);
  }
}

await main();
