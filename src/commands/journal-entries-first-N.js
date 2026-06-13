// `edgewell journal-entries-first-N <N>` lists the first N
// journal entries (chronologically). v3.0.0 keeps the
// filter in JS.

import { c } from "../cli.js";

export async function journalEntriesFirstNCommand(args, ew) {
  const N = Number(args[0]);
  if (!Number.isFinite(N) || N < 1) {
    console.error("usage: edgewell journal-entries-first-N <N>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  // readAll returns in insertion order; we want chronological
  const sorted = all.slice().sort((a, b) => (a._ts ?? "").localeCompare(b._ts ?? ""));
  const slice = sorted.slice(0, N);
  for (const e of slice) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
