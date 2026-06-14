// @ts-nocheck
// `edgewell release` prints a checklist of the steps needed to
// cut a release. v3.0.0 keeps the checklist in code so the
// CLI can show the user what to do without reading the docs.

import { c, header } from "../cli.js";

const STEPS = [
  "Run `edgewell self-test` and `edgewell doctor`.",
  "Run `edgewell version-check` to see if you are on the latest.",
  "Bump the version with `edgewell version-bump <kind>`.",
  "Update CHANGELOG.md under the [Unreleased] section.",
  "Commit the version bump and the changelog entry.",
  "Tag the commit: `git tag -a vX.Y.Z -m 'EdgeWell X.Y.Z'`.",
  "Push the tag: `git push origin vX.Y.Z`.",
  "Run `edgewell release-notes vX.Y.Z` to verify the entry.",
  "Optional: `edgewell snapshot-sign release.json` and upload.",
];

export async function releaseCommand(_args) {
  header("Release checklist");
  for (let i = 0; i < STEPS.length; i++) {
    console.log(`  ${c.cyan(String(i + 1).padStart(2) + ".")} ${STEPS[i]}`);
  }
}
