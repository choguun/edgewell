// EdgeWell CLI entry. Dispatches to a subcommand module.

import { createEdgeWell } from "../src/index.js";
import { dispatch } from "../src/dispatch.js";

export async function main(): Promise<void> {
  const ew = createEdgeWell();
  const [, , cmd = "help", ...rest] = process.argv;
  try {
    await dispatch(cmd, rest, ew);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("error:", message);
    process.exit(1);
  }
}

await main();
