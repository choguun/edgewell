// @ts-nocheck
// `edgewell rotate-secret` prints a freshly generated companion
// secret and writes it to `~/.edgewell/secret` with 0600
// permissions. v3.0.0 keeps this as a one-shot CLI rather than a
// long-running service.

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { c } from "../cli.js";
import { newSecret } from "../companion/auth.js";

export async function rotateSecretCommand(_args) {
  const secret = newSecret();
  const file = path.join(os.homedir(), ".edgewell", "secret");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, secret, { mode: 0o600 });
  console.log(c.green(`new companion secret written to ${file}`));
  console.log(c.dim("export EDGEWELL_COMPANION_SECRET=$(cat ~/.edgewell/secret) to use it"));
}
