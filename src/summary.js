// Summary helpers. Compute weekly and monthly aggregates over
// journal entries and expenses. Pure functions - no I/O, easy
// to test.

const MS_DAY = 24 * 60 * 60 * 1000;

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d) {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  return x;
}

function startOfMonth(d) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

export function weeklySummary(journal, expenses, now = new Date()) {
  const weekStart = startOfWeek(now);
  const j = journal.filter((e) => new Date(e._ts) >= weekStart);
  const e = expenses.filter((x) => new Date(x._ts) >= weekStart);
  const totals = sumByCategory(e);
  return {
    from: weekStart.toISOString(),
    journalCount: j.length,
    expenseCount: e.length,
    expenseTotal: e.reduce((s, x) => s + Number(x.amount ?? 0), 0),
    byCategory: totals,
  };
}

export function monthlySummary(journal, expenses, now = new Date()) {
  const monthStart = startOfMonth(now);
  const j = journal.filter((e) => new Date(e._ts) >= monthStart);
  const e = expenses.filter((x) => new Date(x._ts) >= monthStart);
  const totals = sumByCategory(e);
  return {
    from: monthStart.toISOString(),
    journalCount: j.length,
    expenseCount: e.length,
    expenseTotal: e.reduce((s, x) => s + Number(x.amount ?? 0), 0),
    byCategory: totals,
  };
}

export function sumByCategory(records) {
  const map = new Map();
  for (const r of records) {
    const c = r.category ?? "other";
    map.set(c, (map.get(c) ?? 0) + Number(r.amount ?? 0));
  }
  return Object.fromEntries([...map.entries()].sort((a, b) => b[1] - a[1]));
}

export function daysSince(iso) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / MS_DAY);
}

export { startOfDay, startOfWeek, startOfMonth };
