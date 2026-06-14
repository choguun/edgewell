// @ts-nocheck
// `edgewell journal-entries-today-count` prints the count of
// journal entries for today. Sibling to
// `journal-entries-today`.

import { c } from "../cli.js";

export async function journalEntriesTodayCountCommand(_args, ew) {
  const day = new Date().toISOString().slice(0, 10);
  const all = await ew.journal.readAll();
  const count = all.filter((e) => (e._ts ?? "").startsWith(day)).length;
  console.log(count);
  if (count === 0) console.error(c.dim("(no entries today)"));
}
