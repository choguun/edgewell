// `edgewell sleep-stats` summarises the v3.0.0 sleep data: total
// hours, average per night, and a verdict (short, normal, long).
// v3.0.0 keeps this offline and rule-based; the LLM is only
// consulted when a caller provides one.

import { c, header } from "../cli.js";

const SHORT = 6.5;
const LONG = 9.5;

export async function sleepStatsCommand(_args, ew) {
  header("Sleep stats");
  const all = await ew.journal.readAll();
  const sleepEntries = all.filter((e) => (e.tags ?? []).includes("sleep"));
  if (sleepEntries.length === 0) {
    console.log(c.dim("(no sleep entries yet)"));
    return;
  }
  // Pull a number from the text when possible.
  const hours = sleepEntries
    .map((e) => Number(((e.text ?? "").match(/(\d+(?:\.\d+)?)h/) ?? [])[1] ?? NaN))
    .filter((n) => Number.isFinite(n));
  if (hours.length === 0) {
    console.log(c.dim("(no parseable hour counts in sleep entries)"));
    return;
  }
  const total = hours.reduce((a, b) => a + b, 0);
  const avg = total / hours.length;
  let verdict = "normal";
  if (avg < SHORT) verdict = "short";
  if (avg > LONG) verdict = "long";
  console.log(`${c.bold("nights:")}  ${hours.length}`);
  console.log(`${c.bold("avg:")}     ${avg.toFixed(2)} h`);
  console.log(`${c.bold("total:")}   ${total.toFixed(2)} h`);
  console.log(`${c.bold("verdict:")} ${verdict}`);
}
