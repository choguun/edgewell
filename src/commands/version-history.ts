// @ts-nocheck
// `edgewell version-history` walks the git log for CHANGELOG.md
// and prints the commit subject for the last N changes. v3.0.0
// uses this as a "what's new since the last release" view.

import { spawnSync } from "node:child_process";
import { c, header } from "../cli.js";

export async function versionHistoryCommand(args) {
  const n = Number(args[0] ?? 20);
  header(`Recent CHANGELOG.md commits (last ${n})`);
  const r = spawnSync(
    "git",
    ["log", "-n", String(n), "--pretty=format:%h %ad %s", "--date=short", "--", "edgewell/CHANGELOG.md"],
    { cwd: "..", encoding: "utf8" },
  );
  if (r.status !== 0) {
    console.log(c.yellow("not a git checkout or CHANGELOG not tracked"));
    return;
  }
  process.stdout.write(r.stdout);
  process.stdout.write("\n");
}
