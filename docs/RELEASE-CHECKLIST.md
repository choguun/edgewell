# EdgeWell v3.0.0 Release Checklist

A release is "done" when every box on this list is checked.

## Pre-release

- [ ] `edgewell doctor` passes locally.
- [ ] `edgewell self-test` passes locally.
- [ ] `edgewell ci` passes locally.
- [ ] All new commands are documented in `src/commands/help.js`.
- [ ] All new modules have a `<module>.test.js` companion.
- [ ] CHANGELOG.md has an entry under `[Unreleased]`.
- [ ] `docs/MIGRATION-2-to-3.md` is up to date.

## Build

- [ ] `package.json` version bumped.
- [ ] `npm pack` produces a tarball without warnings.
- [ ] `edgewell --version` prints the new version.

## Tag

- [ ] `git tag -a v3.0.0 -m "EdgeWell 3.0.0 — Senses and Memory"`
- [ ] `git push origin v3.0.0`

## Post-release

- [ ] GitHub release notes include the CHANGELOG excerpt.
- [ ] `docs/RELEASE-CHECKLIST.md` is updated to add a "what went
      wrong" section.
- [ ] The "what's new" section in the README links to the
      CHANGELOG.

## Rollback

If a regression is found after release:

1. `git revert <bad-commit>` on `main`.
2. Bump the version to `3.0.1` and add a "Reverted" entry to
   the CHANGELOG.
3. Re-tag and re-release.

The append-only stores make rollbacks safe: an old release can
read the new data, and the new release can read the old data.
