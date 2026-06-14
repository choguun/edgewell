// EdgeWell CLI entry. Dispatches to a subcommand module.

import { createEdgeWell } from "../src/index.js";
import { dispatch } from "../src/dispatch.js";

export async function main(): Promise<void> {
  // Skip a leading `--` so `pnpm start -- version` works the same
  // as `node --import tsx/esm bin/edgewell.js version`.
  const argv = process.argv.slice(2);
  const startIdx = argv[0] === "--" ? 1 : 0;
  const cmd = argv[startIdx] ?? "help";
  const rest = argv.slice(startIdx + 1);

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
