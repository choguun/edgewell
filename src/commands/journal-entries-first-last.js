// `edgewell journal-entries-first-last` lists the first
// and last journal entries. v3.0.0 keeps the filter in JS.

import { c } from "../cli.js";

export async function journalEntriesFirstLastCommand(args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const sorted = all.slice().sort((a, b) => (a._ts ?? "").localeCompare(b._ts ?? ""));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  console.log(c.dim("first:"));
  console.log(`${c.dim(first._ts)} ${first.text}`);
  console.log(c.dim("last:"));
  console.log(`${c.dim(last._ts)} ${last.text}`);
}
