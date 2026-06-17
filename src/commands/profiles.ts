// @ts-nocheck
// `edgewell profiles` manages v3.0.0 form-factor profiles. The
// command is named with a trailing 's' to avoid clashing with the
// existing `profile` user-profile command.
//
// Subcommands: list, show <name>, apply <name>.

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { header, c } from "../cli.js";
import { listProfiles, pickProfile } from "../profiles.js";

async function writeAppliedProfile(name: string) {
  // Persist the applied profile name to ~/.edgewell/state.json
  // so the user does not have to re-apply on every run. The
  // previous version printed a misleading "(writes to ~/.edgewell/
  // profile.json in a future release)" message — that's the
  // user-facing bug UAT-FN-22 reported.
  const dir = path.join(os.homedir(), ".edgewell");
  const file = path.join(dir, "state.json");
  await fs.mkdir(dir, { recursive: true });
  let cur: Record<string, unknown> = {};
  try {
    cur = JSON.parse(await fs.readFile(file, "utf8")) as Record<string, unknown>;
  } catch {
    cur = {};
  }
  cur.formFactor = name;
  cur.appliedAt = new Date().toISOString();
  await fs.writeFile(file, JSON.stringify(cur, null, 2), { mode: 0o600 });
  return file;
}

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
    const file = await writeAppliedProfile(p.name);
    console.log(c.green(`applied profile: ${p.name}`));
    console.log(c.dim(`saved to ${file}`));
    return;
  }
  console.error(`unknown subcommand: ${sub}. Use list, show, or apply.`);
  process.exit(2);
}
