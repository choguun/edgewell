// `edgewell now` prints the current ISO timestamp. Useful for
// sanity-checking that the system clock is in the right
// timezone before adding time-sensitive journal entries.

import { c } from "../cli.js";

export async function nowCommand(_args) {
  console.log(c.cyan(new Date().toISOString()));
}
