// @ts-nocheck
// `edgewell json` prints the profile as a JSON object. v3.0.0
// keeps this as a sibling to `yaml` for users who prefer JSON.

import { c } from "../cli.js";

export async function jsonCommand(_args, ew) {
  const profile = await ew.profile.load();
  console.log(JSON.stringify(profile, null, 2));
  if (Object.keys(profile).length === 0) console.error(c.dim("(profile is empty)"));
}
