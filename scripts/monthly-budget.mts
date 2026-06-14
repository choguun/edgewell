// @ts-nocheck
// Example user script: monthly budget. Drop this into
// ~/.edgewell/scripts/ alongside weekly-review.mjs. It reads the
// current month's expenses and prints a one-line total.
//
// The data directory is resolved the same way `createEdgeWell`
// does: $EDGEWELL_DATA_DIR, then ./data relative to cwd.

import { promises as fs } from "node:fs";
import path from "node:path";

const dataDir = process.env.EDGEWELL_DATA_DIR
  ? path.resolve(process.env.EDGEWELL_DATA_DIR)
  : path.resolve(process.cwd(), "data");
const file = path.join(dataDir, "expenses.jsonl");
const text = await fs.readFile(file, "utf8").catch(() => "");
const lines = text.split(/\r?\n/).filter(Boolean);
const month = new Date().toISOString().slice(0, 7); // YYYY-MM
let total = 0;
let n = 0;
for (const line of lines) {
  try {
    const e = JSON.parse(line);
    if ((e._ts ?? "").startsWith(month)) {
      total += Number(e.amount ?? 0);
      n++;
    }
  } catch {}
}
console.log(`${month}: ${n} expenses, total ${total.toFixed(2)} (${file}).`);
