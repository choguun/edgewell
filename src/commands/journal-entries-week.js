// `edgewell journal-entries-week <YYYY-Www>` lists the
// journal entries for a specific ISO week. Sibling to
// `week-summary` (which is a numeric summary).

import { c } from "../cli.js";

function startOfIsoWeek(year, week) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const week1Mon = new Date(jan4);
  week1Mon.setUTCDate(jan4.getUTCDate() - day + 1);
  const start = new Date(week1Mon);
  start.setUTCDate(week1Mon.getUTCDate() + (week - 1) * 7);
  return start;
}

export async function journalEntriesWeekCommand(args, ew) {
  const w = args[0];
  if (!w || !/^\d{4}-W\d{2}$/.test(w)) {
    console.error("usage: edgewell journal-entries-week <YYYY-Www>");
    process.exit(2);
  }
  const [yearStr, weekStr] = w.split("-W");
  const start = startOfIsoWeek(Number(yearStr), Number(weekStr));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  const startKey = start.toISOString().slice(0, 10);
  const endKey = end.toISOString().slice(0, 10);
  const all = await ew.journal.readAll();
  const matches = all.filter((e) => (e._ts ?? "").slice(0, 10) >= startKey && (e._ts ?? "").slice(0, 10) < endKey);
  if (matches.length === 0) {
    console.log(c.dim(`(no entries in ${w})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
