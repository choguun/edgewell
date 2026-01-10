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

## Requirements

- Node.js >= 22.17
- npm >= 10.9
- (Optional) `@qvac/sdk` for real on-device inference

## Install

```bash
cd edgewell
npm install
# Run unit tests (no SDK required)
node --test test/*.test.js
```

If you want real model inference, install the QVAC SDK. v1 of EdgeWell
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
| `EDGEWELL_MODEL`          | `LLAMA_3_2_1B_INST_Q4_0`      | Local model id                    |
| `EDGEWELL_DELEGATE_MODEL` | `LLAMA_3_1_8B_INST_Q4_K_M`    | Peer-side model id                |
| `EDGEWELL_P2P_HOST`       | `127.0.0.1`                   | Peer host                         |
| `EDGEWELL_P2P_PORT`       | `8787`                        | Peer port                         |
| `EDGEWELL_P2P_ENABLED=1`  | `0`                           | Enable delegation with fallback   |

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
