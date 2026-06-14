// `edgewell command-list` lists the registered v3.0.0 commands.
// Differs from the `help` command in that it does not paginate
// or group by area; it just prints one command per line.

import { header, c } from "../cli.js";
import { COMMAND_MAP } from "../dispatch.js";

export async function commandListCommand(_args) {
  header("Registered commands");
  const names = Object.keys(COMMAND_MAP ?? {});
  for (const n of names.sort()) {
    console.log(`  ${c.cyan(n)}`);
  }
  console.log(c.dim(`(${names.length} commands)`));
}
