// @ts-nocheck
// `edgewell journal-entries-shorter-than <N>` lists the
// journal entries whose text is shorter than N characters.
// v3.0.0 keeps the filter in JS.

import { c } from "../cli.js";

export async function journalEntriesShorterThanCommand(args, ew) {
  const n = Number(args[0]);
  if (!Number.isFinite(n) || n < 0) {
    console.error("usage: edgewell journal-entries-shorter-than <N>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => String(e.text ?? "").length < n);
  if (matches.length === 0) {
    console.log(c.dim(`(no entries shorter than ${n} chars)`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
