// `edgewell profiles` manages v3.0.0 form-factor profiles. The
// command is named with a trailing 's' to avoid clashing with the
// existing `profile` user-profile command.
//
// Subcommands: list, show <name>, apply <name>.

import { header, c } from "../cli.js";
import { listProfiles, pickProfile } from "../profiles.js";

export async function profilesCommand(args) {
  const sub = args[0];
  if (!sub || sub === "list") {
    header("Available form-factor profiles");
    for (const p of listProfiles()) {
      console.log(`  ${c.bold(p.name.padEnd(10))} ${p.label}`);
    }
    return;
  }
  if (sub === "show") {
    const name = args[1];
    if (!name) {
      console.error("usage: edgewell profiles show <name>");
      process.exit(2);
    }
    const p = pickProfile(name);
    header(`Profile: ${p.name}`);
    console.log(c.dim(p.label));
    console.log(JSON.stringify(p, null, 2));
    return;
  }
  if (sub === "apply") {
    const name = args[1];
    if (!name) {
      console.error("usage: edgewell profiles apply <name>");
      process.exit(2);
    }
    const p = pickProfile(name);
    console.log(c.green(`applied profile: ${p.name}`));
    console.log(c.dim("(writes to ~/.edgewell/profile.json in a future release)"));
    return;
  }
  console.error(`unknown subcommand: ${sub}. Use list, show, or apply.`);
  process.exit(2);
}
