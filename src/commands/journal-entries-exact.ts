// @ts-nocheck
// `edgewell journal-entries-exact <text>` lists the journal
// entries whose text exactly matches. v3.0.0 keeps the
// filter in JS.

import { c } from "../cli.js";

export async function journalEntriesExactCommand(args, ew) {
  const needle = String(args[0] ?? "");
  if (!needle) {
    console.error("usage: edgewell journal-entries-exact <text>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => String(e.text ?? "") === needle);
  if (matches.length === 0) {
    console.log(c.dim(`(no entries exactly equal to "${needle}")`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
