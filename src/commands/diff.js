// `edgewell diff <id-a> <id-b>` shows the difference between two
// journal entries by ordinal id. Useful for spotting typos or
// accidental edits. v3.0.0 keeps this read-only.

import { c, header } from "../cli.js";

function tokenize(s) {
  return (s ?? "").split(/\s+/);
}

function diffWords(a, b) {
  const A = new Set(tokenize(a));
  const B = new Set(tokenize(b));
  const onlyA = [...A].filter((w) => !B.has(w));
  const onlyB = [...B].filter((w) => !A.has(w));
  return { onlyA, onlyB };
}

export async function diffCommand(args, ew) {
  const [aStr, bStr] = args;
  const a = Number(aStr);
  const b = Number(bStr);
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    console.error("usage: edgewell diff <id-a> <id-b>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  if (a < 0 || a >= all.length || b < 0 || b >= all.length) {
    console.error(`id out of range (0..${all.length - 1})`);
    process.exit(2);
  }
  header(`Diff entry ${a} ↔ entry ${b}`);
  const d = diffWords(all[a].text, all[b].text);
  if (d.onlyA.length === 0 && d.onlyB.length === 0) {
    console.log(c.green("entries are identical"));
    return;
  }
  if (d.onlyA.length > 0) console.log(c.red(`only in ${a}: ${d.onlyA.join(" ")}`));
  if (d.onlyB.length > 0) console.log(c.green(`only in ${b}: ${d.onlyB.join(" ")}`));
}
