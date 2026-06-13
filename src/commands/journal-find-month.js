// `edgewell journal-find-month <YYYY-MM>` lists journal entries
// for a specific month. Sibling to `expenses-find-month`.

import { c, header } from "../cli.js";

export async function journalFindMonthCommand(args, ew) {
  const month = args[0];
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    console.error("usage: edgewell journal-find-month <YYYY-MM>");
    process.exit(2);
  }
  header(`Journal entries in ${month}`);
  const all = await ew.journal.readAll();
  const matches = all.filter((e) => (e._ts ?? "").startsWith(month));
  if (matches.length === 0) {
    console.log(c.dim("(no entries in this month)"));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
