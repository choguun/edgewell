// `edgewell journal-entries-this-month-range <day-of-month>`
// lists the journal entries for the Nth day of the current
// month. v3.0.0 keeps the filter in JS.

import { c } from "../cli.js";

export async function journalEntriesThisMonthRangeCommand(args, ew) {
  const day = Number(args[0]);
  if (!Number.isFinite(day) || day < 1 || day > 31) {
    console.error("usage: edgewell journal-entries-this-month-range <day-of-month>");
    process.exit(2);
  }
  const year = new Date().getUTCFullYear();
  const month = new Date().getUTCMonth() + 1;
  const dayStr = String(day).padStart(2, "0");
  const monthStr = String(month).padStart(2, "0");
  const prefix = `${year}-${monthStr}-${dayStr}`;
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => (e._ts ?? "").startsWith(prefix));
  if (matches.length === 0) {
    console.log(c.dim(`(no entries on ${prefix})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
