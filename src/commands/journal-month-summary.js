// `edgewell journal-month-summary <YYYY-MM>` prints a one-line
// summary of a journal month. Sibling to
// `expenses-month-summary`.

import { c } from "../cli.js";

export async function journalMonthSummaryCommand(args, ew) {
  const month = args[0];
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    console.error("usage: edgewell journal-month-summary <YYYY-MM>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  const matches = all.filter((e) => (e._ts ?? "").startsWith(month));
  if (matches.length === 0) {
    console.log(c.dim("(no entries in this month)"));
    return;
  }
  const tags = new Map();
  for (const e of matches) for (const t of e.tags ?? []) tags.set(t, (tags.get(t) ?? 0) + 1);
  const top = [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  console.log(`${month}: ${matches.length} entries; top tags: ${top.map(([t, n]) => `${t} (${n})`).join(", ") || "none"}`);
}
