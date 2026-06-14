// @ts-nocheck
// `edgewell version-check` compares the package.json version
// against a hard-coded "latest known" version. v3.0.0 keeps
// this offline — it does not phone home to a registry. The
// "latest known" version is updated by hand when a new
// release is tagged.

import { c } from "../cli.js";
import { readPackageJson } from "../config.js";

const LATEST_KNOWN = "3.0.0";

function cmp(a, b) {
  const A = a.split(".").map(Number);
  const B = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((A[i] ?? 0) < (B[i] ?? 0)) return -1;
    if ((A[i] ?? 0) > (B[i] ?? 0)) return 1;
  }
  return 0;
}

export async function versionCheckCommand(_args) {
  const pkg = readPackageJson();
  const cmpRes = cmp(pkg.version, LATEST_KNOWN);
  if (cmpRes < 0) {
    console.log(c.yellow(`you are on ${pkg.version}, latest known is ${LATEST_KNOWN}`));
  } else if (cmpRes > 0) {
    console.log(c.green(`you are ahead of the latest known (${pkg.version} > ${LATEST_KNOWN})`));
  } else {
    console.log(c.green(`you are on the latest known version (${pkg.version})`));
  }
}
