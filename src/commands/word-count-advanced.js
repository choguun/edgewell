// `edgewell word-count-advanced` breaks the journal down by tag
// and prints per-tag word counts. v3.0.0 keeps this offline.

import { c, header } from "../cli.js";

function tokenize(s) {
  return (s.match(/\b[\w']+\b/g) || []);
}

export async function wordCountAdvancedCommand(_args, ew) {
  header("Word count by tag");
  const all = await ew.journal.readAll();
  const counts = new Map();
  for (const e of all) {
    const words = tokenize(e.text ?? "").length;
    for (const t of e.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + words);
    }
  }
  if (counts.size === 0) {
    console.log(c.dim("(no tagged journal entries yet)"));
    return;
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [t, n] of sorted) {
    console.log(`  ${c.cyan(t.padEnd(16))} ${n}`);
  }
}
