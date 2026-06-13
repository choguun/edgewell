// `edgewell trend <metric>` shows the recent values of a metric
// in the journal. v3.0.0 supports the metrics "mood", "energy",
// "stress", and "sleep_hours". The user is expected to log these
// as structured fields in journal entries (e.g. `mood: 7`).

import { c, header } from "../cli.js";

const SUPPORTED = new Set(["mood", "energy", "stress", "sleep_hours"]);

function extract(text, key) {
  const m = (text ?? "").match(new RegExp(`${key}\\s*[:=]\\s*(\\d+(?:\\.\\d+)?)`, "i"));
  return m ? Number(m[1]) : null;
}

export async function trendCommand(args, ew) {
  const metric = args[0] ?? "mood";
  if (!SUPPORTED.has(metric)) {
    console.error(`unsupported metric: ${metric}. Try one of: ${[...SUPPORTED].join(", ")}`);
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  const series = [];
  for (const e of all) {
    const v = extract(e.text, metric);
    if (v !== null) series.push({ ts: e._ts, value: v });
  }
  if (series.length === 0) {
    console.log(c.dim(`(no entries with ${metric}=...)`));
    return;
  }
  header(`Trend: ${metric}`);
  for (const p of series.slice(-15)) {
    const bar = "#".repeat(Math.max(0, Math.min(20, Math.round(p.value))));
    console.log(`${c.dim(p.ts.slice(0, 10))} ${String(p.value).padStart(5)}  ${bar}`);
  }
  if (series.length > 15) console.log(c.dim(`(showing last 15 of ${series.length})`));
}
