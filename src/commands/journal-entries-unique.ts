// @ts-nocheck
// `edgewell journal-entries-unique` lists the journal
// entries with duplicate text removed. v3.0.0 keeps the
// dedup in JS.

import { c } from "../cli.js";

export async function journalEntriesUniqueCommand(args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const seen = new Set();
  const unique = [];
  for (const e of all) {
    const t = String(e.text ?? "");
    if (seen.has(t)) continue;
    seen.add(t);
    unique.push(e);
  }
  if (unique.length === 0) {
    console.log(c.dim("(no unique entries)"));
    return;
  }
  for (const e of unique) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
