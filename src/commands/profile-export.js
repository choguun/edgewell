// `edgewell profile-export` writes the current user profile to a
// JSON file. v3.0.0 keeps the on-disk profile as a single JSON
// object; this command adds a copy step so users can move the
// profile to a new device.

import { promises as fs } from "node:fs";
import path from "node:path";
import { c } from "../cli.js";

export async function profileExportCommand(args, ew) {
  const [outPath] = args;
  if (!outPath) {
    console.error("usage: edgewell profile-export <file.json>");
    process.exit(2);
  }
  const abs = path.resolve(outPath);
  const profile = await ew.profile.load();
  await fs.writeFile(abs, JSON.stringify(profile, null, 2));
  console.log(c.green(`wrote ${abs}`));
}
