// `edgewell config` prints the resolved configuration so users can
// see exactly which values are active after env-var merging.

import { c } from "../cli.js";

export async function configCommand(_args, ew) {
  const { cfg } = ew;
  const out = JSON.stringify(cfg, null, 2);
  console.log(out);
}
