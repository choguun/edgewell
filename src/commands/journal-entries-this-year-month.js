// `edgewell journal-entries-this-year-month <MM>` lists the
// journal entries for a specific month of the current year.
// v3.0.0 keeps the filter in JS.

import { c } from "../cli.js";

export async function journalEntriesThisYearMonthCommand(args, ew) {
  const month = String(args[0] ?? "").padStart(2, "0");
  if (!/^\d{2}$/.test(month)) {
    console.error("usage: edgewell journal-entries-this-year-month <MM>");
    process.exit(2);
  }
  const year = new Date().getUTCFullYear();
  const prefix = `${year}-${month}`;
  const all = await ew.journal.readAll();
  const matches = all.filter((e) => (e._ts ?? "").startsWith(prefix));
  if (matches.length === 0) {
    console.log(c.dim(`(no entries in ${prefix})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
