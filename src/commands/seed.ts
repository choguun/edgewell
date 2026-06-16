// @ts-nocheck
// `edgewell seed <count>` appends a configurable number of
// synthetic journal entries and expenses. The seed is deterministic
// for a given (count, day) pair so repeated runs are idempotent at
// the dedup level. v3.0.0 uses this for demos and load testing.

import { c } from "../cli.js";

const MAX_SEED = 100_000;

function rng(seed) {
  let x = seed >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 0x100000000;
  };
}

const PHRASES = [
  "Walked 4k steps before lunch.",
  "Slept 7.5 hours last night.",
  "Drank 2L of water today.",
  "Felt a bit tired after the afternoon meeting.",
  "Cooked a vegetable stir-fry for dinner.",
  "Read 30 pages of a book.",
  "Had a long video call with a friend.",
  "Practised 15 minutes of box breathing.",
  "Skipped lunch because of a deadline.",
  "Went to bed an hour later than planned.",
];

const CATEGORIES = ["food", "transport", "health", "entertainment", "other"];

export async function seedCommand(args, ew) {
  const count = Number(args[0] ?? 5);
  if (!Number.isFinite(count) || count <= 0) {
    console.error("usage: edgewell seed <count>");
    process.exit(2);
  }
  // Cap N so a typo (or a script bug) doesn't write 10^7 rows and
  // freeze the user's terminal. UAT-FN-15.
  if (count > MAX_SEED) {
    console.error(c.red(`seed count ${count} exceeds cap of ${MAX_SEED}`));
    console.error(`(use a smaller number, or run multiple times if you really need more)`);
    process.exit(2);
  }
  const seed = (count * 7919 + 31) >>> 0;
  const r = rng(seed);
  const baseTs = Date.UTC(2026, 0, 1, 12, 0, 0);
  let j = 0, e = 0;
  const jKeys = new Set((await ew.journal.readAll()).map((x) => `${x._ts}|${x.text}`));
  const eKeys = new Set((await ew.expenses.readAll()).map((x) => `${x._ts}|${x.amount}|${x.category}`));
  for (let i = 0; i < count; i++) {
    // Show progress every 10% so the user knows it's still alive.
    if (i % Math.max(1, Math.floor(count / 10)) === 0 && count > 100) {
      process.stderr.write(`\rseeding… ${Math.floor((i / count) * 100)}%`);
    }
    const day = new Date(baseTs + i * 86400000).toISOString();
    const text = PHRASES[i % PHRASES.length];
    const k = `${day}|${text}`;
    if (!jKeys.has(k)) {
      await ew.journal.append({ kind: "journal", _ts: day, text, tags: ["seed"] });
      j++;
    }
    // Mix in (i, count) so the expense pattern varies with run-size
    // even though the journal phrase set is small and cycled.
    const amount = Number(Math.max(0, Math.min(1_000_000_000, r() * 30 + 1)).toFixed(2));
    const cat = CATEGORIES[(Math.floor(r() * CATEGORIES.length) + i) % CATEGORIES.length];
    const ek = `${day}|${amount}|${cat}`;
    if (!eKeys.has(ek)) {
      await ew.expenses.append({ kind: "expense", _ts: day, amount, category: cat, note: "seed" });
      e++;
    }
  }
  if (count > 100) process.stderr.write(`\rseeding… 100%\n`);
  const jSkipped = count - j;
  const eSkipped = count - e;
  if (j === 0 && e === 0) {
    // All entries were already present. Tell the user the seed
    // is a no-op rather than printing "seeded 0" and leaving
    // them to wonder whether the command is broken.
    console.log(c.dim(`no new entries (already seeded; run with a fresh data/ to add ${count} new)`));
  } else {
    const skipped =
      jSkipped + eSkipped > 0
        ? c.dim(` (skipped ${jSkipped} journal + ${eSkipped} expenses already present)`)
        : "";
    console.log(c.green(`seeded ${j} journal entries and ${e} expenses`) + skipped);
  }
}
