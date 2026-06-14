// @ts-nocheck
// `edgewell version` prints the current EdgeWell version. The
// version is sourced from package.json at module load time, so the
// command works regardless of the user's CWD.

import { readPackageJson } from "../config.js";

export async function versionCommand() {
  const pkg = readPackageJson();
  console.log(`edgewell v${pkg.version}`);
}
