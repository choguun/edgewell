// `edgewell profile-reset` clears the on-disk user profile and
// loads the bundled defaults. v3.0.0 keeps this offline: the
// profile is a single JSON file.

import { c } from "../cli.js";

export async function profileResetCommand(_args, ew) {
  await ew.profile.save({});
  console.log(c.green("profile reset to defaults"));
}
