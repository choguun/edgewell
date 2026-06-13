// `edgewell tag-jaccard <a> <b>` prints the Jaccard similarity
// between two tags' entry sets. v3.0.0 keeps the calculation
// in JS.

import { c } from "../cli.js";

export async function tagJaccardCommand(args, ew) {
  const [a, b] = args;
  if (!a || !b) {
    console.error("usage: edgewell tag-jaccard <tag-a> <tag-b>");
    process.exit(2);
  }
  const all = await ew.journal.readAll();
  const setA = new Set(all.filter((e) => (e.tags ?? []).includes(a)).map((e) => e._ts));
  const setB = new Set(all.filter((e) => (e.tags ?? []).includes(b)).map((e) => e._ts));
  const inter = [...setA].filter((t) => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  const jaccard = union === 0 ? 0 : inter / union;
  console.log(`${c.cyan(a)} ∩ ${c.cyan(b)}: ${inter}`);
  console.log(`${c.cyan(a)} ∪ ${c.cyan(b)}: ${union}`);
  console.log(`${c.bold("Jaccard:")} ${jaccard.toFixed(3)}`);
}
