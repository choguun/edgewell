# EdgeWell

A private, on-device personal health and finance coach that runs on the
QVAC SDK. Combines a health agent, a finance agent, a multi-agent
orchestrator, a local RAG index over your notes, and P2P delegation
to a peer (laptop, desktop, SBC) when you want a bigger model.

Designed for the **General Purpose** track of the QVAC hackathon, but
the same code base can run on phones and SBCs by switching the model
ID at runtime.

## Features (v1)

- **Health agent** with strict non-diagnostic disclaimer, 7-day plan
  generation, and RAG over your journal entries and notes.
- **Finance agent** that summarizes your expenses by category and
  drafts monthly savings plans.
- **Orchestrator** that routes each question to the right specialist
  using a tiny router prompt and a keyword fallback.
- **Lightweight RAG** (TF-IDF, zero external deps) for personal
  document search.
- **P2P delegation**: a tiny HTTP server hosts a larger model; the
  client tries the peer first and falls back to local inference on
  any network failure.
- **CLI** with `chat`, `ask`, `journal`, `expense`, `rag`, `plan`,
  `serve`, `status`, and `version` subcommands.

## What's new in v2.0.0

- Model registry with curated QVAC model metadata.
- Hand-rolled JSON-schema validator and ready-made schemas.
- Tool registry with `calculator`, `datetime`, `search_kb`,
  `add_expense`, and `add_journal` tools.
- Tool-calling agent that parses `<tool name="...">{json}</tool>`.
- At-rest encryption (scrypt + AES-256-GCM).
- PII redaction (emails, phones, Thai national IDs, US SSNs, IPv4).
- Multi-peer mesh with health checks and majority-vote consensus.
- Structured logger, in-process metrics, plugin loader.
- New CLI subcommands: `profile`, `doctor`, `config`, `models`,
  `plugins`, `redact`, `summary`, `tags`, `eval`, `bench`, `snapshot`.

## What's new in v3.0.0 (alpha)

v3.0.0 is the "Senses & Memory" release. It adds three new
capabilities and keeps every v2.0.0 surface area intact.

- **Vector memory** alongside the existing TF-IDF RAG. Pluggable
  embedder (hash by default, real QVAC embeddings in production).
  Hybrid lexical + vector search with reciprocal rank fusion and
  a bigram re-ranker.
- **Multimodal ingest** for images, audio, and wearable sensor
  streams. The default is offline-friendly placeholders; inject a
  real captioner / transcriber at runtime.
- **Mobile companion** HTTP server with HMAC bearer tokens, a
  dependency-free router, and an mDNS announcement stub. Ships
  with a small static web UI (`web/`) for chat and journal.
- **Lifestyle agents**: sleep, nutrition, hydration, activity. Each
  agent exposes `summarise` and `advise`.
- **Form-factor profiles** for `mobile`, `tinkerer`, and `desktop`.
  `edgewell profiles list|show|apply <name>`.
- **New CLI subcommands**: `companion`, `profiles`, `sensors`,
  `multimodal`, `export`, `import`, `vector`, `hybrid`, `metrics`,
  `agents`.
- **Plugin loader v2**: plugins may now export a `hooks` object and
  register embedders, agents, and HTTP routes from JS.
- **Documentation**: `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`,
  `docs/DEPLOYMENT.md`, `docs/MIGRATION-2-to-3.md`, `docs/PLUGINS.md`.

## Requirements

- Node.js >= 22.17
- pnpm >= 11 (the project pins `packageManager: pnpm@11.6.0`)
- (Optional) `@qvac/sdk` for real on-device inference

## Install

EdgeWell uses **pnpm** (pinned in `package.json`). `npm install`
will fail on the local `link:` dependency and the `.npmrc`
`onlyBuiltDependencies` key.

```bash
cd edgewell
pnpm install
pnpm build          # compile src/*.ts -> dist/

# Optional: run the unit tests (no SDK required)
pnpm test
```

If you want real model inference, install the QVAC SDK. EdgeWell
is structured so the rest of the code paths work without it.

## Quick start

```bash
# 1. Show the help screen
node bin/edgewell.js help

# 2. Log a journal entry and a few expenses
node bin/edgewell.js journal add "Slept 7.5h, walked 6k steps"
node bin/edgewell.js expense add 250 food
node bin/edgewell.js expense add 80 transport

# 3. Index some notes and search them
node bin/edgewell.js rag ingest path/to/labs.txt
node bin/edgewell.js rag search "how much water should I drink"

# 4. Ask a routed question (streams tokens once a model is loaded)
node bin/edgewell.js ask "How can I save 20% of my income?"

# 5. Start an interactive chat
node bin/edgewell.js chat
```

`bin/edgewell.js` is a self-bootstrapping shim that spawns
`bin/edgewell.ts` under `node --import tsx/esm`, so the
`node bin/edgewell.js <cmd>` form works without any extra flags.
If you'd rather use the compiled output, run
`node dist/bin/edgewell.js <cmd>` after `pnpm build`. Both forms
accept the same flags.

## P2P delegation

On the **peer** (laptop/desktop with the bigger model):

```bash
node bin/edgewell.js serve --port 8787
```

On the **client** (phone, laptop, SBC):

```bash
EDGEWELL_P2P_ENABLED=1 \
EDGEWELL_P2P_HOST=192.168.1.20 \
EDGEWELL_P2P_PORT=8787 \
node bin/edgewell.js chat
```

If the peer is unreachable, the client automatically falls back to
its local small model.

## Configuration

All knobs live in `src/config.js` and can be overridden by env vars:

| Variable                  | Default                       | Description                       |
|---------------------------|-------------------------------|-----------------------------------|
| `EDGEWELL_DATA_DIR`       | `./data`                      | Override the data directory (relative or absolute path) |
| `EDGEWELL_MODEL`          | `LLAMA_3_2_1B_INST_Q4_0`      | Local model id                    |
| `EDGEWELL_DELEGATE_MODEL` | `LLAMA_3_1_8B_INST_Q4_K_M`    | Peer-side model id                |
| `EDGEWELL_P2P_HOST`       | `127.0.0.1`                   | Peer host                         |
| `EDGEWELL_P2P_PORT`       | `8787`                        | Peer port                         |
| `EDGEWELL_P2P_ENABLED=1`  | `0`                           | Enable delegation with fallback   |
| `EDGEWELL_LOG`            | `info`                        | Log level: debug, info, warn, error |
| `EDGEWELL_PLUGINS`        | `./plugins`                   | Plugin directory                  |

## Project layout

```
edgewell/
  bin/edgewell.js          CLI entry
  src/
    config.js              Defaults + env loading
    qvac.js                EdgeWellLLM (lazy @qvac/sdk wrapper)
    store.js               JsonlStore (append-only records)
    profile.js             ProfileStore (small JSON file)
    rag.js                 TF-IDF RAG index
    p2p.js                 Peer server, PeerClient, DelegatingLLM
    index.js               createEdgeWell() factory + public exports
    cli.js                 Colors, parseFlags, withReadline
    dispatch.js            Subcommand router
    agents/
      health.js            Health agent
      finance.js           Finance agent
      orchestrator.js      Multi-agent router
      index.js             Re-exports
    commands/              One file per subcommand
  test/                    node --test unit tests
  data/                    Local user data (gitignored)
  package.json
  README.md
```

## Data and privacy

Everything EdgeWell needs lives under `data/`:

- `data/journal.jsonl` - free-form journal entries
- `data/expenses.jsonl` - amount + category rows
- `data/profile.json`   - name, goals, baseline numbers
- `data/rag/chunks.json` - local RAG index

Nothing leaves the device unless you explicitly point the P2P client
at a remote peer. Even then, only the prompt and tokens cross the
network - there is no analytics, no telemetry, no upstream LLM.

## Disclaimer

The Health agent is educational. It is not a medical device and does
not provide diagnoses. For urgent or severe symptoms, contact a
licensed clinician or local emergency services.
