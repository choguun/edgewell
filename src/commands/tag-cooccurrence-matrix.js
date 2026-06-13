// `edgewell tag-cooccurrence-matrix` prints a co-occurrence
// matrix for the top 10 tags. v3.0.0 keeps the matrix in JS.

import { c, header } from "../cli.js";

export async function tagCooccurrenceMatrixCommand(_args, ew) {
  const all = await ew.journal.readAll();
  const counts = new Map();
  for (const e of all) {
    for (const t of e.tags ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
  if (top.length === 0) {
    console.log(c.dim("(no tagged entries)"));
    return;
  }
  const matrix = new Map();
  for (const e of all) {
    const tags = e.tags ?? [];
    for (let i = 0; i < tags.length; i++) {
      for (let j = 0; j < tags.length; j++) {
        if (!top.includes(tags[i]) || !top.includes(tags[j])) continue;
        const k = `${tags[i]}::${tags[j]}`;
        matrix.set(k, (matrix.get(k) ?? 0) + 1);
      }
    }
  }
  header("Tag co-occurrence matrix");
  const pad = (s, n) => s.padEnd(n);
  process.stdout.write(pad("", 12));
  for (const t of top) process.stdout.write(pad(t.slice(0, 6), 8));
  console.log();
  for (const t of top) {
    process.stdout.write(pad(t, 12));
    for (const u of top) {
      const v = matrix.get(`${t}::${u}`) ?? 0;
      process.stdout.write(pad(String(v), 8));
    }
    console.log();
  }
}
