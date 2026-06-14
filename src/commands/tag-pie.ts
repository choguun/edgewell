// @ts-nocheck
// `edgewell tag-pie` prints a tiny ASCII pie chart of the tag
// distribution. v3.0.0 keeps the chart hand-drawn — the
// "circles" are square blocks of varying density.

import { c, header } from "../cli.js";

const BLOCKS = ["░", "▒", "▓", "█"];

function blockFor(pct) {
  if (pct < 0.05) return BLOCKS[0];
  if (pct < 0.2) return BLOCKS[1];
  if (pct < 0.5) return BLOCKS[2];
  return BLOCKS[3];
}

export async function tagPieCommand(_args, ew) {
  header("Tag pie");
  const all = await ew.journal.readAll();
  const counts = new Map();
  for (const e of all) {
    for (const t of e.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  if (counts.size === 0) {
    console.log(c.dim("(no tagged entries)"));
    return;
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  for (const [t, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    const pct = n / total;
    const bar = blockFor(pct).repeat(5);
    console.log(`  ${c.cyan(t.padEnd(16))} ${bar} ${(pct * 100).toFixed(0)}%`);
  }
}
