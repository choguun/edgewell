# EdgeWell v3.0.0 — Roadmap

> **Codename:** *Senses & Memory*
> **Target release window:** 2026-Q2
> **Status:** in development

v3.0.0 is the next major version of EdgeWell. The goal is to upgrade the
on-device health + finance coach from a text-only CLI into a multimodal,
vector-aware assistant that can still run privately on a phone, a laptop,
or a $50 single-board computer.

## Why a major bump

v2.0.0 shipped the multi-agent core, encryption, PII redaction, peer mesh,
plugin loader, and the tool-calling loop. v3.0.0 introduces three new
*capabilities* that change the public surface area:

1. **Vector memory** — embeddings-based RAG alongside the existing TF-IDF index.
2. **Multimodal inputs** — first-class image and audio pipelines.
3. **Mobile companion API** — a small HTTP/WebSocket surface for phones and
   watches to talk to a local EdgeWell node.

Because these are visible from the CLI, the public API, and the config
schema, the project follows [SemVer](https://semver.org/) and bumps the
major version.

## Headline features

- **Vector RAG** (`src/vector-rag.js`) — pluggable embedding backend
  (QVAC model by default, deterministic hash-fallback for tests), cosine
  similarity search, hybrid retrieval (BM25 + vector), and re-ranking.
- **Multimodal pipeline** (`src/multimodal/`) — image ingest with caption
  pre-pass, audio ingest with transcript chunking, sensor streams.
- **Mobile companion** (`src/companion/`) — HTTP + WebSocket server with
  session tokens, mDNS announcement, and a tiny JSON schema.
- **Lifestyle agents** (`src/agents/`) — sleep, nutrition, hydration, and
  activity trackers in addition to the existing health and finance agents.
- **Config profiles** (`profiles/`) — ready-to-use YAML configs for
  `mobile`, `tinkerer`, and `desktop` form factors.
- **Web UI** (`web/`) — minimal HTML/JS front-end that talks to the
  companion server and renders chat, journal, and trends.

## Non-goals (for v3.0.0)

- No cloud sync. Everything stays on device.
- No new mandatory external dependencies. The vector backend defaults to a
  hash-based embedder so the test suite runs offline.
- No breaking change to the existing CLI subcommand names. New commands
  are additive.

## Milestones

| Milestone | Theme | Target |
|-----------|-------|--------|
| M1 | Vector RAG + tests | end of Feb 2026 |
| M2 | Multimodal pipelines + tests | mid Mar 2026 |
| M3 | Companion API + Web UI | end of Mar 2026 |
| M4 | Lifestyle agents | mid Apr 2026 |
| M5 | Config profiles + docs | end of Apr 2026 |
| M6 | Release candidate | mid May 2026 |

## Tracking

Issues are tracked in the GitHub issue tracker with the `v3` milestone.
High-level status is summarised at the top of `CHANGELOG.md` under
`[Unreleased]`.
