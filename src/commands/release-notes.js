// `edgewell release-notes [v2.0.0]` prints the CHANGELOG entries
// for a given release. v3.0.0 reads CHANGELOG.md and slices the
// first `## [...]` section whose header matches the version
// argument.

import { promises as fs } from "node:fs";
import { c, header } from "../cli.js";

export async function releaseNotesCommand(args) {
  const version = args[0] ?? "Unreleased";
  header(`Release notes: ${version}`);
  const text = await fs.readFile("./CHANGELOG.md", "utf8");
  const lines = text.split(/\r?\n/);
  let inSection = false;
  let depth = 0;
  const collected = [];
  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (inSection) break;
      const m = line.match(/^##\s+\[?([^\]]+)\]?/);
      if (m && (m[1] === version || m[1].startsWith(version))) {
        inSection = true;
        collected.push(c.bold(line));
        continue;
      }
    }
    if (inSection) {
      collected.push(line);
    }
  }
  if (collected.length === 0) {
    console.log(c.yellow(`(no entries for ${version})`));
    return;
  }
  console.log(collected.join("\n"));
}
