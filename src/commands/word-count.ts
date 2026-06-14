// @ts-nocheck
// `edgewell word-count` reports the total word and character count
// of the journal. Useful for understanding how much context the
// agent has to work with.

import { c, header } from "../cli.js";

function tokenize(s) {
  return (s.match(/\b[\w']+\b/g) || []);
}

export async function wordCountCommand(_args, ew) {
  header("Journal word count");
  const all = await ew.journal.readAll();
  let totalChars = 0;
  let totalWords = 0;
  for (const e of all) {
    totalChars += (e.text ?? "").length;
    totalWords += tokenize(e.text ?? "").length;
  }
  console.log(`${c.bold("entries:")} ${all.length}`);
  console.log(`${c.bold("words:")}   ${totalWords}`);
  console.log(`${c.bold("chars:")}   ${totalChars}`);
  if (all.length > 0) {
    console.log(`${c.bold("avg:")}     ${(totalWords / all.length).toFixed(1)} words / entry`);
  }
}
