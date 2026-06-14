// @ts-nocheck
// `edgewell journal-entries-year-month <YYYY-MM>` lists the
// journal entries for a specific year-month. v3.0.0 keeps
// the filter in JS.

import { c } from "../cli.js";

export async function journalEntriesYearMonthCommand(args, ew) {
  const ym = String(args[0] ?? "");
  if (!/^\d{4}-\d{2}$/.test(ym)) {
    console.error("usage: edgewell journal-entries-year-month <YYYY-MM>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => (e._ts ?? "").slice(0, 7) === ym);
  if (matches.length === 0) {
    console.log(c.dim(`(no entries in ${ym})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
