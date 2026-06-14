// @ts-nocheck
// `edgewell journal-energy-trend` prints the average energy
// per month as an ASCII chart. Sibling to `journal-mood-trend`.

import { c, header } from "../cli.js";

export async function journalEnergyTrendCommand(_args, ew) {
  header("Journal energy trend (monthly average)");
  const all = await ew.journal.readAll();
  const withEnergy = all.filter((e) => Number.isFinite(Number(e.energy)));
  if (withEnergy.length === 0) {
    console.log(c.dim("(no journal entries with an energy field)"));
    return;
  }
  const byMonth = new Map();
  for (const e of withEnergy) {
    const month = (e._ts ?? "").slice(0, 7);
    if (!byMonth.has(month)) byMonth.set(month, { sum: 0, count: 0 });
    const r = byMonth.get(month);
    r.sum += Number(e.energy);
    r.count++;
  }
  for (const [month, { sum, count }] of [...byMonth.entries()].sort()) {
    const avg = sum / count;
    const bar = "#".repeat(Math.max(0, Math.min(20, Math.round(avg))));
    console.log(`  ${month}  ${avg.toFixed(2).padStart(5)}  ${bar}`);
  }
}
