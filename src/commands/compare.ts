// @ts-nocheck
// `edgewell compare <a.json> <b.json>` diffs two export files and
// prints a small report: how many journal entries were added or
// removed, how many expenses differ, and the version that produced
// each export.

import { c, header } from "../cli.js";
import { readJsonFile } from "../jsonl.js";

function keyOf(e, kind) {
  if (kind === "journal") return `${e._ts}|${e.text}`;
  return `${e._ts}|${e.amount}|${e.category}`;
}

export async function compareCommand(args) {
  const [a, b] = args;
  if (!a || !b) {
    console.error("usage: edgewell compare <a.json> <b.json>");
    process.exit(2);
  }
  header(`Comparing ${a} ↔ ${b}`);
  const da = await readJsonFile(a, { label: a });
  const db = await readJsonFile(b, { label: b });
  console.log(`${c.bold("version:")}  ${da.version ?? "?"} ↔ ${db.version ?? "?"}`);
  console.log(`${c.bold("exported:")} ${da.exportedAt ?? "?"} ↔ ${db.exportedAt ?? "?"}`);
  const ja = new Map((da.journal ?? []).map((e) => [keyOf(e, "journal"), e]));
  const jb = new Map((db.journal ?? []).map((e) => [keyOf(e, "journal"), e]));
  const added = [...jb.keys()].filter((k) => !ja.has(k));
  const removed = [...ja.keys()].filter((k) => !jb.has(k));
  console.log(`${c.bold("journal:")}  +${added.length} / -${removed.length} / total ${jb.size}`);
  const ea = new Map((da.expenses ?? []).map((e) => [keyOf(e, "expense"), e]));
  const eb = new Map((db.expenses ?? []).map((e) => [keyOf(e, "expense"), e]));
  const eAdded = [...eb.keys()].filter((k) => !ea.has(k));
  const eRemoved = [...ea.keys()].filter((k) => !eb.has(k));
  console.log(`${c.bold("expenses:")} +${eAdded.length} / -${eRemoved.length} / total ${eb.size}`);
}
