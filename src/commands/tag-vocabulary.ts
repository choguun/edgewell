// @ts-nocheck
// `edgewell tag-vocabulary` lists the user's personal tag
// vocabulary from `profile.tagVocabulary`. v3.0.0 keeps this
// offline; the vocabulary travels with the profile export.

import { c, header } from "../cli.js";

export async function tagVocabularyCommand(_args, ew) {
  const profile = await ew.profile.load();
  const vocab = profile.tagVocabulary ?? [];
  header("Tag vocabulary");
  if (vocab.length === 0) {
    console.log(c.dim("(set profile.tagVocabulary = [...] in your profile.json)"));
    return;
  }
  for (const t of vocab) console.log(`  ${c.cyan(t)}`);
  console.log(c.dim(`(${vocab.length} tags)`));
}
