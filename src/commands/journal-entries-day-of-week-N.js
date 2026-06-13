// `edgewell journal-entries-day-of-week-N <0..6> <N>` lists
// the Nth occurrence of a specific day-of-week. v3.0.0
// keeps the filter in JS.

import { c } from "../cli.js";

export async function journalEntriesDayOfWeekNCommand(args, ew) {
  const dow = Number(args[0]);
  const N = Number(args[1]);
  if (!Number.isFinite(dow) || dow < 0 || dow > 6 || !Number.isFinite(N) || N < 1) {
    console.error("usage: edgewell journal-entries-day-of-week-N <0..6> <N>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  // group by month and pick the Nth day-of-week
  const months = new Map();
  for (const e of all) {
    const d = new Date(e._ts);
    if (Number.isNaN(d.getTime())) continue;
    if (d.getUTCDay() !== dow) continue;
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    if (!months.has(ym)) months.set(ym, []);
    months.get(ym).push(e);
  }
  const picks = [];
  for (const [ym, arr] of [...months.entries()].sort()) {
    arr.sort((a, b) => (a._ts ?? "").localeCompare(b._ts ?? ""));
    if (arr[N - 1]) picks.push(arr[N - 1]);
  }
  if (picks.length === 0) {
    console.log(c.dim(`(no ${N}th day-of-week ${dow} found)`));
    return;
  }
  for (const e of picks) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
