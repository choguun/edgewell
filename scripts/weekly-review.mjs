// Example user script: weekly review. Drop this into
// ~/.edgewell/scripts/ and run with `edgewell scripts` to confirm
// it shows up. The script itself can be run directly with Node.
//
// v3.0.0 user scripts are a thin layer on top of the Node
// runtime. They receive no special context — they are simply
// executed when the user invokes them.

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

const journal = path.join(os.homedir(), ".edgewell", "data", "journal.jsonl");
const text = await fs.readFile(journal, "utf8").catch(() => "");
const lines = text.split(/\r?\n/).filter(Boolean);
const weekAgo = Date.now() - 7 * 86400_000;
let n = 0;
for (const line of lines) {
  try {
    const e = JSON.parse(line);
    if (new Date(e._ts).getTime() >= weekAgo) n++;
  } catch {}
}
console.log(`Weekly review: ${n} journal entries in the last 7 days.`);
