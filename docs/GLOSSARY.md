# EdgeWell v3.0.0 Glossary

Quick definitions of the terms used throughout the docs and the
help screen.

- **Agent** — a small, focused piece of business logic. v3.0.0
  ships `HealthAgent`, `FinanceAgent`, `SleepAgent`,
  `NutritionAgent`, `HydrationAgent`, and `ActivityAgent`. Each
  agent exposes `summarise` and `advise`.

- **Companion** — the v3.0.0 HTTP server that exposes a tiny JSON
  surface to a paired phone. Auth is HMAC bearer tokens.

- **Chunk** — a slice of text that the RAG index stores. v3.0.0
  chunks by character windows with word-boundary snapping.

- **Embedder** — a function `text → vector`. The default
  `hashEmbedder` is dependency-free; a real QVAC embedder is wired
  through `makeEmbedder({ kind: "qvac" })`.

- **Form factor** — one of `mobile`, `tinkerer`, `desktop`. The
  profile sets the model id, RAG chunk size, vector dimension,
  P2P defaults, and the companion server port.

- **Hybrid search** — reciprocal-rank fusion of lexical and
  vector hits, followed by a bigram re-ranker.

- **JSONL** — one JSON object per line. The on-disk format for
  the journal, expenses, and (in v3.0.0) the multimodal ingest
  pipeline.

- **mDNS** — multicast DNS. The v3.0.0 companion server uses a
  stub announcer; a real implementation would publish a `_edgewell._tcp`
  service.

- **Peer** — another EdgeWell node reachable over HTTP. The peer
  is consulted first when `EDGEWELL_P2P_ENABLED=1`; if the peer
  fails, EdgeWell falls back to the local model.

- **PII redaction** — v2.0.0 scrubs emails, phone numbers, Thai
  national IDs, US SSNs, and IPv4 addresses from prompts and
  outputs.

- **Profile** — either the user profile (name, goals, baselines)
  or a form-factor profile (mobile / tinkerer / desktop). The
  CLI distinguishes them: `edgewell profile` is the user profile,
  `edgewell profiles` is the form-factor one.

- **RAG** — retrieval-augmented generation. v2.0.0 uses TF-IDF;
  v3.0.0 adds vector RAG and a hybrid mode.

- **Re-ranker** — a second-pass scorer applied to the merged
  list of hits. v3.0.0's re-ranker boosts chunks that share
  rare bigrams with the query and penalises very long chunks.

- **Tag** — a short string attached to a journal entry. Tags are
  how EdgeWell groups entries for the lifestyle agents and the
  CLI's analytics commands.

- **Vector index** — the data structure that backs similarity
  search. v3.0.0's `VectorStore` is a plain array; production
  deployments should swap it for an ANN index.
