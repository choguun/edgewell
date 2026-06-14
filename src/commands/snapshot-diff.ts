// @ts-nocheck
// `edgewell snapshot-diff <a.json> <b.json>` prints a unified
// diff of the two snapshot files. v3.0.0 keeps this offline
// using a simple line-by-line diff (no external libraries).

import { promises as fs } from "node:fs";
import { c, header } from "../cli.js";

function diff(a, b) {
  const A = a.split(/\r?\n/);
  const B = b.split(/\r?\n/);
  const m = Math.max(A.length, B.length);
  const lines = [];
  for (let i = 0; i < m; i++) {
    if (A[i] === B[i]) continue;
    if (A[i] !== undefined) lines.push(`- ${A[i]}`);
    if (B[i] !== undefined) lines.push(`+ ${B[i]}`);
  }
  return lines;
}

export async function snapshotDiffCommand(args) {
  const [a, b] = args;
  if (!a || !b) {
    console.error("usage: edgewell snapshot-diff <a.json> <b.json>");
    process.exit(2);
  }
  header(`Snapshot diff: ${a} ↔ ${b}`);
  const textA = await fs.readFile(a, "utf8");
  const textB = await fs.readFile(b, "utf8");
  const lines = diff(textA, textB);
  if (lines.length === 0) {
    console.log(c.green("snapshots are identical"));
    return;
  }
  for (const l of lines.slice(0, 100)) console.log(l);
  if (lines.length > 100) console.log(c.dim(`... (${lines.length - 100} more)`));
}
