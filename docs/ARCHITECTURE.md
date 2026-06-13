# EdgeWell v3.0.0 Architecture

This document describes how the pieces of EdgeWell v3.0.0 fit
together. It is meant to be read after `README.md` and before
contributing new features.

## High-level

EdgeWell is a Node.js CLI / library that runs locally on a phone,
laptop, or single-board computer. It:

1. Loads one or more QVAC models (text, vision, speech-to-text).
2. Stores personal data in local JSONL files (journal, expenses,
   profile, RAG chunks).
3. Routes user prompts through a small **multi-agent orchestrator**
   (Health, Finance, Sleep, Nutrition, Hydration, Activity).
4. Optionally exposes a small HTTP server so a phone can act as a
   **companion** to a desktop EdgeWell node.

```
+------------------------+        +-----------------------+
|  CLI (bin/edgewell.js) |        |  Web UI (web/)        |
+-----------+------------+        +-----------+-----------+
            |                                 |
            v                                 v
+------------------------+        +-----------------------+
|  Companion HTTP server |        |  HTTP routes          |
|  (src/companion/)      |<------>|  /health /chat ...    |
+-----------+------------+        +-----------+-----------+
            |
            v
+------------------------+
|  EdgeWell stack        |
|  (src/index.js)        |
+--+-----+-----+--------+
   |     |     |
   v     v     v
+---+ +---+ +-----+
|LLM| |RAG| |Store|
+---+ +---+ +-----+
   ^     ^
   |     |
+--+--+ +--+--+
|QVAC| |TFIDF|
|Vec | |or   |
+----+ +VecRAG
```

## Key modules

- `src/qvac.js` — thin wrapper around the QVAC SDK's `loadModel` /
  `completion` API. Used by the chat command and the orchestrator.
- `src/rag.js` — classic TF-IDF RAG. Small, dependency-free.
- `src/vector-rag.js`, `src/vector-store.js`, `src/vector-index.js`
  — v3.0.0 vector memory. Pluggable embedder (hash by default, real
  QVAC embeddings in production).
- `src/hybrid-search.js` — reciprocal-rank fusion of lexical +
  vector hits.
- `src/multimodal/` — image, audio, and sensor pipelines.
- `src/agents/` — HealthAgent, FinanceAgent, and the new
  lifestyle agents (Sleep, Nutrition, Hydration, Activity).
- `src/orchestrator.js` — keyword-based routing. v3.0.0 keeps the
  routing deterministic and falls back to a free-form chat.
- `src/companion/` — v3.0.0 mobile companion: HMAC tokens, tiny
  HTTP router, server, mDNS stub.
- `src/profiles.js` — v3.0.0 form-factor profiles (mobile,
  tinkerer, desktop).
- `src/web/` — static HTML/JS companion UI.

## Data flow for a `chat` request

1. CLI parses the input.
2. `EdgeWellLLM.stream()` is invoked through the orchestrator.
3. The orchestrator picks an agent and (optionally) attaches a RAG
   context block built by `rag.contextBlock()`.
4. Tokens stream back to the CLI and the user.

## Data flow for a `companion` request

1. The phone POSTs `/chat` to the desktop companion server.
2. The server validates the bearer token.
3. The server invokes `ew.orchestrator.handle()`.
4. The result is returned as JSON.

## Data flow for multimodal ingest

1. `edgewell multimodal <file>` calls `ingestPath()`.
2. The dispatcher picks the right pipeline by file extension.
3. The pipeline emits text (caption, transcript, or raw bytes).
4. The text is indexed in RAG and/or appended to the journal.

## Design choices

- **No web framework.** The companion server uses Node's built-in
  `http` module and a 60-line router. The web UI is a single static
  page with no build step. This keeps the offline test suite green
  and the install footprint tiny.
- **Pure-JS fallbacks.** The vector embedder defaults to a hash
  function so the project works without any model. Real QVAC
  embeddings are wired through `makeEmbedder({ kind: "qvac", llm })`.
- **Append-only stores.** Journal and expenses are JSONL. New
  records are appended; existing records are never rewritten. This
  makes the export/import round-trip trivial.
- **Pluggable agents.** Each agent exposes `summarise` and
  `advise` so the CLI can present them uniformly and tests can
  assert on their behaviour.
