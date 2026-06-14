// @ts-nocheck
// `edgewell expenses-entries-weekday-N-month <0..6> <N>
// <YYYY-MM>` lists the expenses on the Nth occurrence of a
// specific day-of-week in a specific month.

import { c } from "../cli.js";

export async function expensesEntriesWeekdayNMonthCommand(args, ew) {
  const dow = Number(args[0]);
  const N = Number(args[1]);
  const ym = String(args[2] ?? "");
  if (!Number.isFinite(dow) || dow < 0 || dow > 6 || !Number.isFinite(N) || N < 1
      || !/^\d{4}-\d{2}$/.test(ym)) {
    console.error("usage: edgewell expenses-entries-weekday-N-month <0..6> <N> <YYYY-MM>");
    process.exit(2);
  }
  const [yStr, mStr] = ym.split("-");
  const year = Number(yStr);
  const month = Number(mStr);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const dates = [];
  for (let d = 1; d <= lastDay; d++) {
    const dt = new Date(Date.UTC(year, month - 1, d));
    if (dt.getUTCDay() === dow) dates.push(dt.toISOString().slice(0, 10));
  }
  const targetDay = dates[N - 1];
  if (!targetDay) {
    console.log(c.dim(`(no ${N}th day-of-week ${dow} in ${ym})`));
    return;
  }
  const all = await ew.expenses.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no expenses)"));
    return;
  }
  const matches = all.filter((e) => (e._ts ?? "").slice(0, 10) === targetDay);
  if (matches.length === 0) {
    console.log(c.dim(`(no expenses on ${targetDay})`));
    return;
  }
  for (const e of matches) {
    console.log(`${c.dim(e._ts)} ${e.category} ${e.amount}`);
  }
}
