# Migrating from EdgeWell 2.x to 3.0.0

This document explains how to upgrade an EdgeWell 2.x installation to
3.0.0 without losing personal data.

## What's new in 3.0.0

- **Vector memory** alongside the existing TF-IDF RAG. Both are
  enabled by default; hybrid search is opt-in.
- **Multimodal ingest** for image, audio, and sensor data.
- **Mobile companion** HTTP server with HMAC bearer tokens.
- **Lifestyle agents**: sleep, nutrition, hydration, activity.
- **Form-factor profiles** (`mobile`, `tinkerer`, `desktop`).
- **Web UI** companion served as static files.

## Breaking changes

The v3.0.0 release is backwards compatible with v2.0.0 stores and
plugins. The only mandatory CLI change is:

- The `edgewell snapshot` command now also includes a `version`
  field set to `3.0.0`. Scripts that parse snapshot output should
  tolerate the new field.

The following *new* commands are additive and do not change the
behaviour of existing commands:

- `edgewell companion`
- `edgewell profiles`
- `edgewell sensors`
- `edgewell multimodal`
- `edgewell export`
- `edgewell import`

## Step-by-step

1. **Back up.** `edgewell export backup-$(date +%F).json`.
2. **Pull the new release.** `git pull` (or update your package).
3. **Re-install.** `npm install` to pick up any new peer
   dependencies.
4. **Run the doctor.** `edgewell doctor` to confirm the install.
5. **Pick a profile.** `edgewell profiles apply <name>`.
6. **Test the companion server.** `edgewell companion --port 8787`.
7. **Re-index the RAG** (optional). `edgewell rag ingest <files>`
   to add new context, or leave it alone — the existing TF-IDF
   index still works.

## Plugin authors

Plugins that target v2.0.0 keep working in v3.0.0 unchanged. The
plugin loader (`src/plugins.js`) is the same code. v3.0.0 adds two
new plugin hooks (documented in `docs/PLUGINS.md`):

- `registerEmbedder(register)` — register a custom embedder.
- `registerAgent(register)` — register a custom agent.

If your plugin only needs the legacy hooks, no changes are
required.

## Data migration

The on-disk format is unchanged. JSONL files, the RAG chunk index,
and the encrypted store keep working. There is no automatic
migration step.
