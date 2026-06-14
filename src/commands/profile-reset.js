// `edgewell profile-reset` clears the on-disk user profile and
// reverts to the bundled defaults. v3.0.0 keeps this offline: the
// profile is a single JSON file. We delete the file (rather than
// overwriting with `{}`) so a future load() falls through to the
// default merge path cleanly.

import { promises as fs } from "node:fs";
import { c } from "../cli.js";

export async function profileResetCommand(_args, ew) {
  try {
    await fs.unlink(ew.profile.filePath);
  } catch {
    // already absent — nothing to do
  }
  console.log(c.green("profile reset to defaults"));
}
