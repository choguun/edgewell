// `edgewell journal-entries-shuffled <seed>` lists the
// journal entries in a deterministic pseudo-random order
// using a numeric seed. v3.0.0 keeps the shuffle in JS.

import { c } from "../cli.js";

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function journalEntriesShuffledCommand(args, ew) {
  const seed = Number(args[0] ?? 42);
  if (!Number.isFinite(seed)) {
    console.error("usage: edgewell journal-entries-shuffled <seed>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (all.length === 0) {
    console.log(c.dim("(no journal entries)"));
    return;
  }
  const rng = mulberry32(seed);
  const shuffled = all.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  for (const e of shuffled) {
    console.log(`${c.dim(e._ts)} ${e.text}`);
  }
}
