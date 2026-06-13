// `edgewell journal-entries-today-N <days-ago>` lists the
// journal entries from N days ago. v3.0.0 keeps the filter
// in JS.

import { c } from "../cli.js";

export async function journalEntriesTodayNCommand(args, ew) {
  const daysAgo = Number(args[0]);
  if (!Number.isFinite(daysAgo) || daysAgo < 0) {
    console.error("usage: edgewell journal-entries-today-N <days-ago>");
    process.exit(2);
  }
  const targetMs = Date.now() - daysAgo * 86400_000;
  const targetDay = new Date(targetMs).toISOString().slice(0, 10);
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const matches = all.filter((e) => (e._ts ?? "").slice(0, 10) === targetDay);
  if (matches.length === 0) {
    console.log(c.dim(`(no entries on ${targetDay})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
