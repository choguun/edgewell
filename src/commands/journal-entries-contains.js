// `edgewell journal-entries-contains <substring>` lists the
// journal entries whose text contains a substring. v3.0.0
// keeps the filter in JS.

import { c } from "../cli.js";

export async function journalEntriesContainsCommand(args, ew) {
  const needle = String(args[0] ?? "");
  if (!needle) {
    console.error("usage: edgewell journal-entries-contains <substring>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => String(e.text ?? "").toLowerCase().includes(needle.toLowerCase()));
  if (matches.length === 0) {
    console.log(c.dim(`(no entries containing "${needle}")`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
