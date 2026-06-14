// @ts-nocheck
// `edgewell tag-jaccard-all` lists the most similar tag pairs
// by Jaccard similarity. v3.0.0 keeps the calculation in JS.

import { c, header } from "../cli.js";

export async function tagJaccardAllCommand(_args, ew) {
  header("Most similar tag pairs (Jaccard)");
  const all = await ew.journal.readAll();
  const sets = new Map();
  for (const e of all) {
    for (const t of e.tags ?? []) {
      if (!sets.has(t)) sets.set(t, new Set());
      sets.get(t).add(e._ts);
    }
  }
  const tags = [...sets.keys()];
  const sims = [];
  for (let i = 0; i < tags.length; i++) {
    for (let j = i + 1; j < tags.length; j++) {
      const a = sets.get(tags[i]);
      const b = sets.get(tags[j]);
      const inter = [...a].filter((t) => b.has(t)).length;
      const union = new Set([...a, ...b]).size;
      if (union === 0) continue;
      sims.push({ a: tags[i], b: tags[j], score: inter / union });
    }
  }
  sims.sort((x, y) => y.score - x.score);
  for (const { a, b, score } of sims.slice(0, 15)) {
    console.log(`  ${c.cyan(a.padEnd(12))} ${c.cyan(b.padEnd(12))} ${score.toFixed(3)}`);
  }
}
