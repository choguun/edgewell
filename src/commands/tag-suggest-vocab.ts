// @ts-nocheck
// `edgewell tag-suggest-vocab <text>` suggests tags that exist
// in the user's vocabulary (set in `profile.tagVocabulary`)
// based on substring match. v3.0.0 keeps this offline.

import { c } from "../cli.js";

export async function tagSuggestVocabCommand(args, ew) {
  const text = args.join(" ").toLowerCase();
  if (!text) {
    console.error("usage: edgewell tag-suggest-vocab <text>");
    process.exit(2);
  }
  const profile = await ew.profile.load();
  const vocab = profile.tagVocabulary ?? [];
  const matches = vocab.filter((t) => t.toLowerCase().includes(text));
  if (matches.length === 0) {
    console.log(c.dim("(no vocabulary matches)"));
    return;
  }
  console.log(matches.join(" "));
}
