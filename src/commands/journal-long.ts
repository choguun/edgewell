// @ts-nocheck
// `edgewell journal-long [N]` lists the N longest journal
// entries. v3.0.0 keeps the sort in JS.

import { c } from "../cli.js";

export async function journalLongCommand(args, ew) {
  const n = Number(args[0] ?? 5);
  if (!Number.isFinite(n) || n <= 0) {
    console.error("usage: edgewell journal-long [N]");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const sorted = [...all].sort((a, b) => (b.text?.length ?? 0) - (a.text?.length ?? 0)).slice(0, n);
  for (const e of sorted) {
    console.log(`${c.dim(e._ts)} ${String((e.text ?? "").length).padStart(4)}c  ${(e.text ?? "").slice(0, 60)}${(e.text?.length ?? 0) > 60 ? "…" : ""}`);
  }
}
