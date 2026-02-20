# Changelog

All notable changes to EdgeWell are documented here. The format is
loosely based on [Keep a Changelog](https://keepachangelog.com).

## [Unreleased]

## [2.0.0] - 2026-02-XX

### Added
- **Model registry** (`src/registry.js`) with curated QVAC model
  metadata, `describeModel`, `listModels`, and `pickModel({tier,
  domain, maxRamGb})`.
- **Hand-rolled JSON-schema validator** (`src/schema.js`) plus
  ready-made schemas for journal, expenses, RAG chunks, and profile
  (`src/schemas.js`).
- **Tool registry** (`src/tools.js`) with built-in `calculator`,
  `datetime`, `search_kb`, `add_expense`, and `add_journal` tools.
- **Tool-calling agent** (`src/tool-agent.js`) that parses
  `<tool name="...">{json}</tool>` blocks and runs them.
- **At-rest encryption** (`src/crypto.js`) using scrypt + AES-256-GCM,
  plus a drop-in `EncryptedJsonlStore` (`src/encrypted-store.js`).
- **PII redaction** (`src/redact.js`) for emails, phone numbers,
  long digit runs, Thai national IDs, US SSNs, and IPv4.
- **Multi-peer mesh** (`src/peer-mesh.js`) with health checks,
  latency-sorted streaming, broadcast, and majority-vote consensus.
- **Structured logger** (`src/logger.js`) with leveled JSON output
  and file tee.
- **In-process metrics** (`src/metrics.js`) with counters, histograms
  (p50/p90/p99), and a `timed()` helper.
- **P2P server** gained `/metrics`, per-request counters, and
  structured logging.
- **Plugin loader** (`src/plugins.js`) with explicit security model
  (only `*.plugin.js` from caller-specified directory).
- **Sleep-tracking example plugin** (`examples/plugins/sleep.plugin.js`).
- **New CLI subcommands**: `profile` (show/set/init), `doctor`,
  `config`, `models` (list/describe), `plugins` (list/run), `redact`.
- **Spinner** (`src/spinner.js`) for streaming prompts.
- **GitHub Actions CI** (`.github/workflows/ci.yml`) running tests
  and a CLI smoke test on Node 22.17 and 24.
- **27 new unit tests** across registry, schema, crypto, redact,
  tools, logger, metrics, peer-mesh, tool-agent, and encrypted store.

## [1.0.0] - 2026-01-11

### Added
- First public release.
- Health and finance agents with multi-agent orchestrator and
  keyword routing fallback.
- Lightweight TF-IDF RAG over user notes.
- P2P server, client, and delegating LLM with local fallback.
- CLI with `chat`, `ask`, `journal`, `expense`, `rag`, `plan`,
  `serve`, `status`, `version`, and `help` subcommands.
- 9 unit tests for RAG, orchestrator, P2P, stores, and CLI flags.
- README with install, quick start, and P2P setup.
- Sample `data/sample_health_notes.txt` for `rag ingest`.
