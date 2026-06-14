// `edgewell version-bump <patch|minor|major>` bumps the
// package.json version. v3.0.0 keeps the bump logic in JS so
// the offline test suite stays green.

import { promises as fs } from "node:fs";
import { resolve } from "node:path";
import { c } from "../cli.js";
import { projectRoot, readPackageJson } from "../config.js";

function bump(ver, kind) {
  const [maj, min, pat] = ver.split(".").map(Number);
  if (kind === "major") return `${maj + 1}.0.0`;
  if (kind === "minor") return `${maj}.${min + 1}.0`;
  if (kind === "patch") return `${maj}.${min}.${pat + 1}`;
  throw new Error(`unknown kind: ${kind}`);
}

export async function versionBumpCommand(args) {
  const kind = args[0];
  if (!kind || !["major", "minor", "patch"].includes(kind)) {
    console.error("usage: edgewell version-bump <major|minor|patch>");
    process.exit(2);
  }
  const pkgPath = resolve(projectRoot(), "package.json");
  const pkg = readPackageJson();
  const next = bump(pkg.version, kind);
  pkg.version = next;
  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(c.green(`bumped ${pkg.name} to ${next}`));
}
