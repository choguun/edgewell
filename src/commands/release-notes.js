// `edgewell release-notes [v2.0.0]` prints the CHANGELOG entries
// for a given release. v3.0.0 reads CHANGELOG.md and slices the
// first `## [...]` section whose header matches the version
// argument. With no arg, prints the latest version section.

import { promises as fs } from "node:fs";
import { c, header } from "../cli.js";
import { projectRoot } from "../config.js";

function findSections(text) {
  const sections = [];
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      const m = line.match(/^##\s+\[?([^\]]+)\]?/);
      current = { name: m ? m[1] : line.slice(3).trim(), lines: [c.bold(line)] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);
  return sections;
}

export async function releaseNotesCommand(args) {
  const text = await fs.readFile(projectRoot() + "/CHANGELOG.md", "utf8");
  const sections = findSections(text);
  let chosen;
  if (args[0]) {
    const version = args[0];
    chosen = sections.find((s) => s.name === version || s.name.startsWith(version));
    if (!chosen) {
      console.log(c.yellow(`(no entries for ${version})`));
      return;
    }
  } else {
    // Default: latest section that has content (skip the "Unreleased"
    // section, which is usually empty until the next release).
    chosen = sections.find((s) => s.name !== "Unreleased" && s.lines.length > 1) ?? sections[0];
    if (!chosen) {
      console.log(c.yellow("(no releases recorded)"));
      return;
    }
  }
  header(`Release notes: ${chosen.name}`);
  console.log(chosen.lines.join("\n"));
}
