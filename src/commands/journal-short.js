// `edgewell journal-short [N]` lists the N shortest journal
// entries. v3.0.0 keeps the sort in JS.

import { c } from "../cli.js";

export async function journalShortCommand(args, ew) {
  const n = Number(args[0] ?? 5);
  if (!Number.isFinite(n) || n <= 0) {
    console.error("usage: edgewell journal-short [N]");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const sorted = [...all].sort((a, b) => (a.text?.length ?? 0) - (b.text?.length ?? 0)).slice(0, n);
  for (const e of sorted) {
    console.log(`${c.dim(e._ts)} ${String((e.text ?? "").length).padStart(4)}c  ${e.text ?? ""}`);
  }
}
