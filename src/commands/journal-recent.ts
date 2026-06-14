// @ts-nocheck
// `edgewell journal-recent [N]` lists the N most recent
// journal entries. v3.0.0 keeps the iteration in JS.

import { c } from "../cli.js";

export async function journalRecentCommand(args, ew) {
  const n = Number(args[0] ?? 10);
  if (!Number.isFinite(n) || n <= 0) {
    console.error("usage: edgewell journal-recent [N]");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const recent = all.slice(-n).reverse();
  for (const e of recent) {
    const tags = e.tags?.length ? ` ${c.dim(`[${e.tags.join(", ")}]`)}` : "";
    console.log(`${c.dim(e._ts)} ${e.text}${tags}`);
  }
}
