# Contributing to EdgeWell v3.0.0

This document is the v3.0.0 supplement to the existing
`CONTRIBUTING.md` in the repository root. Read that first; this
adds the v3.0.0-specific conventions.

## Code style

- ESM only. The package is `"type": "module"`.
- No external runtime dependencies beyond `@qvac/sdk` (and even
  that is optional). Use Node's built-ins where possible.
- Prefer small, focused files. The v3.0.0 commands average under
  40 lines each; please keep new ones under 80.
- Add a JSDoc block to every public function in a new module.

## Tests

- Use `node --test` (the built-in test runner).
- One file per module, named `<module>.test.js`.
- Run the suite with `edgewell self-test` or `node --test test/*.test.js`.

## Commits

- Conventional Commits: `feat`, `fix`, `docs`, `test`, `refactor`,
  `chore`, `build`, `ci`.
- Scope with `(edgewell)` since this whole folder is the project.
- One logical change per commit.

## Pull requests

- Target the `main` branch.
- Include a CHANGELOG.md entry under `[Unreleased]`.
- All tests must pass.
- New CLI commands must register in `src/dispatch.js` *and* be
  documented in `src/commands/help.js`.

## Plugin authors

- Plugins live in `examples/plugins/` (or your own directory
  pointed to by `EDGEWELL_PLUGINS`).
- v3.0.0 plugins should export a default object with `name`,
  `version`, and `hooks`. The v2.0.0 function-style export is
  still supported.
- See `docs/PLUGINS.md` for the hook reference.

## Releases

- Bump `package.json` first, then write the CHANGELOG entry, then
  commit, then tag. The CI workflow runs tests on every push to
  `main` and on every tag.

## Security

- Read `docs/SECURITY-MODEL.md`.
- Never commit a real companion secret, API key, or passphrase.
- Use the placeholder values in `.env.example`.
