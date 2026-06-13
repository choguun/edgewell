// `edgewell journal-entries-sorted [asc|desc]` lists the
// journal entries sorted alphabetically by text. v3.0.0
// keeps the sort in JS.

import { c } from "../cli.js";

export async function journalEntriesSortedCommand(args, ew) {
  const order = String(args[0] ?? "asc");
  if (!["asc", "desc"].includes(order)) {
    console.error("usage: edgewell journal-entries-sorted [asc|desc]");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const sorted = all.slice().sort((a, b) => {
    const cmp = String(a.text ?? "").localeCompare(String(b.text ?? ""));
    return order === "asc" ? cmp : -cmp;
  });
  for (const e of sorted) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
