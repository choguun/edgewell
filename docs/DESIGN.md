# EdgeWell v3.0.0 Design Notes

The "why" behind the v3.0.0 design. Read this if you are about
to make a non-trivial change to a public surface.

## Three capabilities, one codebase

v3.0.0 introduces three capabilities (vector memory, multimodal,
companion) without splitting the project into three codebases. The
trick is to keep each capability behind a small interface:

- **Embedder** — `function text → vector`. The hash embedder is the
  default. The QVAC backend is selected by `kind`.
- **Multimodal pipeline** — `ingestPath({ filePath })` returns a
  `{ kind, text, source, meta }` envelope that the rest of the
  pipeline can index.
- **Companion server** — Node's built-in `http` module and a 60-line
  router. Plugins register routes through the `registerRoute` hook.

The CLI commands and the companion server share the same
`createEdgeWell()` factory. There is no second bootstrap path.

## Append-only everything

Journal, expenses, and the RAG index are append-only. New entries
are added; old entries are never rewritten. This is unusual for a
project of this size, but it gives us three things for free:

1. **Crash safety** — the only failure mode is a partial line at
   the end of a JSONL file, which a re-read tolerates.
2. **Idempotent imports** — `edgewell import` matches by timestamp
   + content and skips duplicates.
3. **Audit log** — every change is a new row. `edgewell dedup` can
   flag duplicates without ever losing data.

The cost is that old junk accumulates. The export/import round-trip
exists precisely so the user can prune.

## Plugin isolation

Plugins run with the same Node.js permissions as the CLI. We do
not sandbox them. This is a deliberate trade-off: a sandboxed
plugin API is more useful for marketing than for the actual user,
who can run the plugin code in a `node:test` file or read its
source. The threat model assumes the user has decided to trust
the plugin author.

## No telemetry

There is no analytics, no error reporting, no remote update check.
This is not an oversight; it is the threat model. Telemetry is
incompatible with "device is trusted, network is hostile" because
the network becomes a side channel for fingerprinting.

## Why so many commands?

v3.0.0 ships ~50 CLI subcommands. Most are short — a screenful of
output, a handful of flags. The reasoning: the CLI is a control
plane, and a small, well-named command is easier to script than a
complex command with many flags. `edgewell journal-stats` is a
single concept; `edgewell status --section journal` is two concepts
fused together.

## What v3.1 might look like

If v3.0.0 lands cleanly, the next minor could:

- Move the on-disk stores to SQLite (with the JSONL export kept
  as the human-readable source of truth).
- Add a thin Electron / Tauri wrapper for the web UI.
- Wire the mDNS stub to a real `multicast-dns` library.
- Add cross-lingual search via multilingual embeddings.

But that is a follow-up. v3.0.0 ships the v2 surface area intact
plus the three new capabilities.
