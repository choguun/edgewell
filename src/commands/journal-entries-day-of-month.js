// `edgewell journal-entries-day-of-month <N>` lists the
// journal entries logged on the Nth day of the month.
// Sibling to `expenses-entries-day-of-month`.

import { c } from "../cli.js";

export async function journalEntriesDayOfMonthCommand(args, ew) {
  const day = Number(args[0]);
  if (!Number.isFinite(day) || day < 1 || day > 31) {
    console.error("usage: edgewell journal-entries-day-of-month <1..31>");
    process.exit(2);
  }
  const dayStr = String(day).padStart(2, "0");
  const all = await ew.journal.readAll();
  const matches = all.filter((e) => (e._ts ?? "").slice(8, 10) === dayStr);
  if (matches.length === 0) {
    console.log(c.dim(`(no entries on day ${day} of any month)`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
