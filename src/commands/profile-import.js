// `edgewell profile-import` reads a JSON profile exported by
// `edgewell profile-export` and writes it to the live profile
// store. v3.0.0 overwrites the entire profile (no merge), so
// callers should snapshot first.

import path from "node:path";
import { c } from "../cli.js";
import { readJsonFile } from "../jsonl.js";

export async function profileImportCommand(args, ew) {
  const [inPath] = args;
  if (!inPath) {
    console.error("usage: edgewell profile-import <file.json>");
    process.exit(2);
  }
  const abs = path.resolve(inPath);
  const profile = await readJsonFile(abs, { label: abs });
  if (profile === null || typeof profile !== "object" || Array.isArray(profile)) {
    console.error(c.red(`${abs} is not a profile object (root must be a JSON object)`));
    process.exit(1);
  }
  await ew.profile.save(profile);
  console.log(c.green(`profile loaded from ${abs}`));
}
