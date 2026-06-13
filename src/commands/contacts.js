// `edgewell contacts` lists the user's emergency contacts stored
// in `profile.contacts` (an array of `{ name, relation, phone }`).
// v3.0.0 keeps this read-only; the CLI does not transmit the
// data anywhere.

import { c, header } from "../cli.js";

export async function contactsCommand(_args, ew) {
  const profile = await ew.profile.load();
  const list = profile.contacts ?? [];
  header("Emergency contacts");
  if (list.length === 0) {
    console.log(c.dim("(set profile.contacts = [...] in your profile.json)"));
    return;
  }
  for (const c1 of list) {
    console.log(`  ${c.cyan(c1.name ?? "?")} ${c.dim(c1.relation ?? "")} ${c1.phone ?? ""}`);
  }
}
