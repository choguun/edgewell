// `edgewell journal-month <YYYY-MM>` lists the journal entries
// for a specific month. Sibling to `journal-week` and
// `journal-day`.

import { c } from "../cli.js";

export async function journalMonthCommand(args, ew) {
  const month = args[0];
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    console.error("usage: edgewell journal-month <YYYY-MM>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  const matches = all.filter((e) => (e._ts ?? "").startsWith(month));
  if (matches.length === 0) {
    console.log(c.dim(`(no entries in ${month})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
