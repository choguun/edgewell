// `edgewell week-summary <YYYY-Www>` prints a one-paragraph
// summary of a specific ISO week. v3.0.0 keeps the aggregation
// offline. Note: the input format is the ISO week notation
// `YYYY-Www` (e.g. `2026-W05`).

import { c, header } from "../cli.js";

function startOfIsoWeek(year, week) {
  // ISO week 1 is the week containing the first Thursday.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7; // Mon = 1, Sun = 7
  const week1Mon = new Date(jan4);
  week1Mon.setUTCDate(jan4.getUTCDate() - day + 1);
  const start = new Date(week1Mon);
  start.setUTCDate(week1Mon.getUTCDate() + (week - 1) * 7);
  return start;
}

export async function weekSummaryCommand(args, ew) {
  let w = args[0];
  if (!w) {
    // Default to the current ISO week.
    const now = new Date();
    const thursday = new Date(now);
    thursday.setUTCDate(now.getUTCDate() + (4 - (now.getUTCDay() || 7)));
    const year = thursday.getUTCFullYear();
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const week = 1 + Math.floor((thursday - jan4) / (7 * 86400_000));
    w = `${year}-W${String(week).padStart(2, "0")}`;
  }
  if (!/^\d{4}-W\d{2}$/.test(w)) {
    console.error("usage: edgewell week-summary [YYYY-Www]");
    process.exit(2);
  }
  const [yearStr, weekStr] = w.split("-W");
  const start = startOfIsoWeek(Number(yearStr), Number(weekStr));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  const startKey = start.toISOString().slice(0, 10);
  const endKey = end.toISOString().slice(0, 10);
  header(`Week summary: ${w} (${startKey} → ${endKey})`);
  const journal = (await ew.journal.readAll()).filter((e) => (e._ts ?? "").slice(0, 10) >= startKey && (e._ts ?? "").slice(0, 10) < endKey);
  const expenses = (await ew.expenses.readAll()).filter((e) => (e._ts ?? "").slice(0, 10) >= startKey && (e._ts ?? "").slice(0, 10) < endKey);
  const total = expenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
  console.log(`${c.bold("journal:")} ${journal.length} entries`);
  console.log(`${c.bold("expenses:")} ${expenses.length} (total ${total.toFixed(2)})`);
}
