// `edgewell journal-entries-day-of-month-N <1..31>` lists the
// journal entries for a specific day of the current month
// across all years. v3.0.0 keeps the filter in JS.

import { c } from "../cli.js";

export async function journalEntriesDayOfMonthNCommand(args, ew) {
  const dom = Number(args[0]);
  if (!Number.isFinite(dom) || dom < 1 || dom > 31) {
    console.error("usage: edgewell journal-entries-day-of-month-N <1..31>");
    process.exit(2);
  }
  const dayStr = String(dom).padStart(2, "0");
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => (e._ts ?? "").slice(8, 10) === dayStr);
  if (matches.length === 0) {
    console.log(c.dim(`(no entries on day-of-month ${dom})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
