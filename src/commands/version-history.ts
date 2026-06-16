// @ts-nocheck
// `edgewell version-history` walks the git log for CHANGELOG.md
// and prints the commit subject for the last N changes. v3.0.0
// uses this as a "what's new since the last release" view.

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { c, header } from "../cli.js";

export async function versionHistoryCommand(args, ew) {
  const n = Number(args[0] ?? 20);

  // Walk up from the current file until we find a directory that
  // has a `.git` folder and a `CHANGELOG.md`. The previous
  // implementation hard-coded `cwd: ".."` and the path
  // `edgewell/CHANGELOG.md`, which broke when the project was
  // moved to a different layout.
  const here = path.dirname(fileURLToPath(import.meta.url));
  let dir = here;
  let repoRoot = null;
  for (let i = 0; i < 6; i++) {
    const git = path.join(dir, ".git");
    const cl = path.join(dir, "CHANGELOG.md");
    try {
      const { existsSync } = await import("node:fs");
      if (existsSync(git) && existsSync(cl)) {
        repoRoot = dir;
        break;
      }
    } catch {
      // ignore
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  if (!repoRoot) {
    console.log(c.yellow("not a git checkout or CHANGELOG not tracked"));
    return;
  }

  header(`Recent CHANGELOG.md commits (last ${n})`);

  // Show package.json version on top so the user can confirm
  // they're on the version they think they are. v3.0.0 surfaced
  // this as UAT-FN-18: the `version` and `version-history`
  // commands should agree on what counts as a "release".
  try {
    const pkg = ew.cfg && (await (await import("../config.js")).readPackageJson?.());
    if (pkg && typeof pkg === "object" && "version" in pkg) {
      console.log(c.dim(`current: v${(pkg as { version?: string }).version ?? "?"}\n`));
    }
  } catch {
    // ignore — informational only
  }

  const r = spawnSync(
    "git",
    ["log", "-n", String(n), "--pretty=format:%h %ad %s", "--date=short", "--", "CHANGELOG.md"],
    { cwd: repoRoot, encoding: "utf8" },
  );
  if (r.status !== 0) {
    console.log(c.yellow(`git log failed: ${r.stderr || "unknown error"}`));
    return;
  }
  if (!r.stdout.trim()) {
    console.log(c.dim("(no CHANGELOG.md commits yet)"));
    return;
  }
  process.stdout.write(r.stdout);
  process.stdout.write("\n");
}
