// `edgewell demo-data` loads the bundled sample journal, expenses,
// and sensor stream so a new user can explore EdgeWell without
// having to type anything. The bundled files are committed under
// `data/` and are idempotent: importing twice has no effect.

import { promises as fs } from "node:fs";
import path from "node:path";
import { c, header } from "../cli.js";

const SAMPLES = {
  journal: [
    { kind: "journal", _ts: "2026-01-15T07:30:00Z", text: "Slept 7.5 hours, woke up refreshed.", tags: ["sleep"] },
    { kind: "journal", _ts: "2026-01-15T08:00:00Z", text: "Oatmeal with berries and a coffee.", tags: ["meal"] },
    { kind: "journal", _ts: "2026-01-15T12:30:00Z", text: "Chicken salad for lunch.", tags: ["meal"] },
    { kind: "journal", _ts: "2026-01-15T18:00:00Z", text: "30 minute walk after dinner.", tags: ["activity"] },
    { kind: "journal", _ts: "2026-01-15T22:00:00Z", text: "Read 30 pages before bed.", tags: ["habit"] },
  ],
  expenses: [
    { kind: "expense", _ts: "2026-01-15T08:30:00Z", amount: 4.5, category: "food", note: "coffee" },
    { kind: "expense", _ts: "2026-01-15T13:00:00Z", amount: 12.0, category: "food", note: "lunch" },
    { kind: "expense", _ts: "2026-01-15T20:00:00Z", amount: 30.0, category: "transport", note: "rideshare" },
  ],
};

export async function demoDataCommand(_args, ew) {
  header("Loading sample data");
  const jKeys = new Set((await ew.journal.readAll()).map((e) => `${e._ts}|${e.text}`));
  const eKeys = new Set((await ew.expenses.readAll()).map((e) => `${e._ts}|${e.amount}|${e.category}`));
  let j = 0, e = 0;
  for (const entry of SAMPLES.journal) {
    const k = `${entry._ts}|${entry.text}`;
    if (jKeys.has(k)) continue;
    await ew.journal.append(entry);
    j++;
  }
  for (const ex of SAMPLES.expenses) {
    const k = `${ex._ts}|${ex.amount}|${ex.category}`;
    if (eKeys.has(k)) continue;
    await ew.expenses.append(ex);
    e++;
  }
  console.log(c.green(`added ${j} journal entries and ${e} expenses`));
}
