// Example user script: monthly budget. Drop this into
// ~/.edgewell/scripts/ alongside weekly-review.mjs. It reads the
// current month's expenses and prints a one-line total.

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

const file = path.join(os.homedir(), ".edgewell", "data", "expenses.jsonl");
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
console.log(`${month}: ${n} expenses, total ${total.toFixed(2)}`);
