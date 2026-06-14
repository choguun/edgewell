// @ts-nocheck
// `edgewell tail [N]` shows the last N journal entries (default 10).
// Similar to `tail -n` on a JSONL file.

import { c } from "../cli.js";

export async function tailCommand(args, ew) {
  const n = Number(args[0] ?? 10);
  if (!Number.isFinite(n) || n <= 0) {
    console.error("usage: edgewell tail [N]");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  const slice = all.slice(-n);
  for (const e of slice) {
    const tags = e.tags?.length ? ` ${c.dim(`[${e.tags.join(", ")}]`)}` : "";
    console.log(`${c.dim(e._ts)} ${e.text}${tags}`);
  }
}
