# EdgeWell v3.0.0 documentation

This directory holds the v3.0.0 docs. Read in order:

1. [ROADMAP.md](./ROADMAP.md) — what v3.0.0 is for and the
   release timeline.
2. [ARCHITECTURE.md](./ARCHITECTURE.md) — how the pieces fit
   together and the data flow for each user-visible operation.
3. [DESIGN.md](./DESIGN.md) — the "why" behind the v3.0.0 design
   choices (append-only, plugin isolation, no telemetry).
4. [DEPLOYMENT.md](./DEPLOYMENT.md) — installing and running
   EdgeWell on each of the three form factors.
5. [PLUGINS.md](./PLUGINS.md) — writing v3.0.0 plugins.
6. [SECURITY-MODEL.md](./SECURITY-MODEL.md) — the threat model
   and what v3.0.0 does (and does not) protect against.
7. [PERFORMANCE.md](./PERFORMANCE.md) — performance numbers and
   tuning knobs.
8. [FAQ.md](./FAQ.md) — frequently asked questions.
9. [GLOSSARY.md](./GLOSSARY.md) — definitions of v3.0.0 terms.
10. [TESTING.md](./TESTING.md) — running and writing tests.
11. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — common issues
    and how to fix them.
12. [MIGRATION-2-to-3.md](./MIGRATION-2-to-3.md) — upgrading
    from v2.0.0.
13. [CONTRIBUTING-v3.md](./CONTRIBUTING-v3.md) — v3.0.0-specific
    contribution conventions.
14. [RELEASE-CHECKLIST.md](./RELEASE-CHECKLIST.md) — pre-release,
    build, and tag steps.

## Other resources

- The main [README.md](../README.md) has the elevator pitch and
  a v1.0.0 → v3.0.0 changelog.
- [CHANGELOG.md](../CHANGELOG.md) is the per-version changelog.
- The `examples/plugins/` directory shows real v3.0.0 plugins.
- The `web/` directory is the static web UI for the companion
  server.

## Versioning

This documentation covers EdgeWell v3.0.0. Earlier versions
followed a different architecture and most of the new CLI
commands do not exist there. Refer to the version-specific
CHANGELOG entries for the precise changes.
