// @ts-nocheck
// `edgewell journal-entries-duplicates` lists the journal
// entries whose text appears more than once. v3.0.0 keeps
// the dedup in JS.

import { c } from "../cli.js";

export async function journalEntriesDuplicatesCommand(args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const counts = new Map();
  for (const e of all) {
    const t = String(e.text ?? "");
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const dupes = all.filter((e) => (counts.get(String(e.text ?? "")) ?? 0) > 1);
  if (dupes.length === 0) {
    console.log(c.dim("(no duplicate text entries)"));
    return;
  }
  for (const e of dupes) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
