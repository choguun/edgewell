// `edgewell tag-new <name>` adds a new tag to the global
// vocabulary. v3.0.0 keeps the vocabulary in the profile so it
// travels with the user across devices.

import { promises as fs } from "node:fs";
import { c } from "../cli.js";

export async function tagNewCommand(args, ew) {
  const name = args[0];
  if (!name) {
    console.error("usage: edgewell tag-new <name>");
    process.exit(2);
  }
  const profile = await ew.profile.load();
  const vocab = profile.tagVocabulary ?? [];
  if (vocab.includes(name)) {
    console.log(c.yellow(`"${name}" is already in the vocabulary`));
    return;
  }
  vocab.push(name);
  profile.tagVocabulary = vocab;
  // Persist via the standard profile save.
  const path = ew.profile.filePath;
  if (path) await fs.writeFile(path, JSON.stringify(profile, null, 2));
  console.log(c.green(`added "${name}" to the vocabulary`));
}
