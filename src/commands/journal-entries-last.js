// `edgewell journal-entries-last` prints the last journal
// entry. Sibling to `journal-entries-first`.

import { c } from "../cli.js";

export async function journalEntriesLastCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const e = all[all.length - 1];
  console.log(`${c.dim(e._ts)} ${e.text}`);
}
