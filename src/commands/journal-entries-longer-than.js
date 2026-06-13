// `edgewell journal-entries-longer-than <N>` lists the
// journal entries whose text is longer than N characters.
// v3.0.0 keeps the filter in JS.

import { c } from "../cli.js";

export async function journalEntriesLongerThanCommand(args, ew) {
  const n = Number(args[0]);
  if (!Number.isFinite(n) || n < 0) {
    console.error("usage: edgewell journal-entries-longer-than <N>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => String(e.text ?? "").length > n);
  if (matches.length === 0) {
    console.log(c.dim(`(no entries longer than ${n} chars)`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
