// @ts-nocheck
// `edgewell journal-entries-percentile <N>` lists the entries
// in the Nth percentile (1-100) of the journal.

import { c } from "../cli.js";

export async function journalEntriesPercentileCommand(args, ew) {
  const p = Number(args[0]);
  if (!Number.isFinite(p) || p < 1 || p > 100) {
    console.error("usage: edgewell journal-entries-percentile <1..100>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const start = Math.floor((p - 1) * all.length / 100);
  const end = Math.floor(p * all.length / 100);
  for (let i = start; i < end; i++) {
    const e = all[i];
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
