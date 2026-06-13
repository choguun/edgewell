// `edgewell journal-entries-even` lists the even-indexed
// entries (0, 2, 4, ...). Sibling to `journal-entries-odd`.

import { c } from "../cli.js";

export async function journalEntriesEvenCommand(_args, ew) {
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  for (let i = 0; i < all.length; i += 2) {
    const e = all[i];
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
