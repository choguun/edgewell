# Contributing to EdgeWell

Thanks for your interest in EdgeWell. This document covers the
mechanics of landing a change.

## Ground rules

- Be respectful. We follow the [Contributor Covenant](./CODE_OF_CONDUCT.md).
- All commits must pass `npm test` locally.
- All new modules need unit tests. Aim for one test per exported
  function or class method.
- Keep the dependency surface small. `@qvac/sdk` is the only
  production runtime dep.

## Development setup

```bash
cd edgewell
npm install
node --test test/*.test.js
```

## Commit messages

Use the `type(scope): summary` format:

- `feat` new feature
- `fix` bug fix
- `test` only test changes
- `docs` documentation only
- `refactor` code change that neither fixes a bug nor adds a feature
- `style` formatting, no code change
- `chore` build / tooling / metadata
- `ci` CI changes
- `perf` performance

The summary is in the imperative mood: "add X", not "added X".

## Pull request flow

1. Branch off `main`.
2. Keep commits small and topical.
3. Open a PR. CI runs `npm test` plus a CLI smoke test.
4. Address review feedback with new commits, not force-pushes.

## Code style

- ESM only (`"type": "module"`).
- 2-space indent, no semicolons removed.
- No external test framework - just `node --test`.
- No TypeScript yet. If you want to add it, open an issue first.

## Releasing

- Bump `package.json` version.
- Add an entry to `CHANGELOG.md`.
- `git tag -a vX.Y.Z -m "..."`.
- Push the branch and the tag.
