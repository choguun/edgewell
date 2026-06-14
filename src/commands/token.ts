// @ts-nocheck
// `edgewell token <subject>` mints a companion bearer token signed
// with `EDGEWELL_COMPANION_SECRET` (or a freshly generated secret
// for a one-off demo). Useful for testing the companion server
// without running the full server bootstrap.

import { c } from "../cli.js";
import { newSecret, signToken } from "../companion/auth.js";

export async function tokenCommand(args) {
  const subject = args[0] ?? "console";
  const ttlMs = Number(args[1] ?? 60 * 60 * 1000);
  const secret = process.env.EDGEWELL_COMPANION_SECRET ?? newSecret();
  const token = signToken({ secret, subject, ttlMs });
  console.log(token);
  if (!process.env.EDGEWELL_COMPANION_SECRET) {
    console.error(c.dim("(one-off secret — set EDGEWELL_COMPANION_SECRET for persistent tokens)"));
  }
}
