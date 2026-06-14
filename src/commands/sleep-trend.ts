// @ts-nocheck
// `edgewell sleep-trend` shows a simple ASCII chart of the last N
// sleep durations extracted from the journal. v3.0.0 extracts the
// number of hours from the entry text (`slept 7.5h`).

import { c, header } from "../cli.js";

function extractHours(text) {
  if (!text) return null;
  const m = text.match(/(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?/i);
  return m ? Number(m[1]) : null;
}

export async function sleepTrendCommand(_args, ew) {
  const all = await ew.journal.readAll();
  const sleep = all.filter((e) => (e.tags ?? []).includes("sleep"));
  const series = [];
  for (const e of sleep) {
    const h = extractHours(e.text);
    if (h !== null) series.push({ ts: e._ts, hours: h });
  }
  if (series.length === 0) {
    console.log(c.dim("(no sleep entries with hours)"));
    return;
  }
  header("Sleep trend");
  for (const p of series.slice(-15)) {
    const bar = "#".repeat(Math.max(0, Math.min(20, Math.round(p.hours))));
    console.log(`${c.dim(p.ts.slice(0, 10))} ${String(p.hours).padStart(5)}h  ${bar}`);
  }
}
