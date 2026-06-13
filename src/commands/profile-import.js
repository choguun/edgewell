// `edgewell profile-import` reads a JSON profile exported by
// `edgewell profile-export` and writes it to the live profile
// store. v3.0.0 overwrites the entire profile (no merge), so
// callers should snapshot first.

import { promises as fs } from "node:fs";
import path from "node:path";
import { c } from "../cli.js";

export async function profileImportCommand(args, ew) {
  const [inPath] = args;
  if (!inPath) {
    console.error("usage: edgewell profile-import <file.json>");
    process.exit(2);
  }
  const abs = path.resolve(inPath);
  const raw = await fs.readFile(abs, "utf8");
  const profile = JSON.parse(raw);
  await ew.profile.save(profile);
  console.log(c.green(`profile loaded from ${abs}`));
}
