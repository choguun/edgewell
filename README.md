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

### Showcase

Run `edgewell showcase` to print the multi-agent + tool-calling +
P2P-fallback trace without installing the live QVAC SDK. The
captured transcript lives at `demo/showcase-compiled.txt` and is
the primary evidence artifact for the hackathon submission.

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

## Hackathon submission

v3.0.1 is the QVAC hackathon cut. Everything reviewers need to
evaluate the project is committed in this repo; no live SDK is
required to see the trace.

- **Project write-up**: [`HACKATHON-SUBMISSION.md`](./HACKATHON-SUBMISSION.md)
  is the canonical submission document — track, SDK, run
  instructions, evidence list, limitations, and roadmap.
- **Submission index**: [`SUBMISSION-INDEX.md`](./SUBMISSION-INDEX.md)
  lists every artifact a judge might want to look at, with a
  one-line description of each.
- **Demo script**: [`demo/demo-script.md`](./demo/demo-script.md)
  is the 5-minute judge-friendly walkthrough (`showcase` →
  `rag search` → `expense add` → `serve` → `companion`).
- **Architecture diagram**:
  [`docs/diagrams/architecture.mmd`](./docs/diagrams/architecture.mmd)
  is the top-level Mermaid flowchart (user surface →
  orchestrator → specialists → RAG → tools → multimodal).
- **Peer-mesh diagram**:
  [`docs/diagrams/peer-mesh.mmd`](./docs/diagrams/peer-mesh.mmd)
  shows the multi-peer fan-out, health checks, and
  majority-vote consensus used by `DelegatingLLM`.
- **Captured transcript**: the showcase command's stdout is
  checked in at `demo/showcase-compiled.txt` so reviewers can
  read the trace without running anything.
- **Run it yourself**: `pnpm install && pnpm build && node
  dist/bin/edgewell.js showcase` reproduces the transcript
  byte-for-byte (the showcase stub is deterministic — no
  `Date.now()`, no random IDs).

## What's new in v3.0.1 (hardening)

v3.0.1 is a quality-and-completeness pass over the v3.0.0 surface.
The CLI was ported from JavaScript to TypeScript (`tsconfig.build.json`
+ `pnpm build`), every blocker-class finding from the third UAT
pass was fixed, and the companion subsystem is now fully wired up.

- **`edgewell showcase` command**: prints the multi-agent +
  tool-calling + P2P-fallback trace without a live QVAC SDK. See
  `demo/showcase-compiled.txt`.
- **Companion server is end-to-end usable.** It now (a) sends CORS
  headers so a phone browser can call it from a different origin,
  (b) short-circuits `OPTIONS` preflight with `204`, (c) serves the
  bundled `web/` UI directly so users do not need a separate
  static-file server, and (d) the bundled `web/app.js` prompts for
  a bearer token on `401` so the chat form is no longer
  unauthenticatable out of the box.
- **`rotate-secret` is wired.** The command documented in
  `docs/COMMANDS.md` is now dispatched and writes a fresh HMAC
  secret to `~/.edgewell/secret` (mode `0600`).
- **`profiles apply` actually persists.** The applied form factor
  is written to `~/.edgewell/state.json` and the misleading
  "future release" message is gone.
- **`EDGEWELL_DATA_DIR` is validated.** When run as root, the env
  var refuses to write into system roots (`/etc`, `/usr`, `/bin`,
  `/sbin`, `/var`, `/boot`, `/System`, `/Library`); for normal
  users the value is resolved to an absolute path.
- **P2P silent fallback now logs.** When the peer is unreachable,
  `DelegatingLLM` emits a structured `warn` log and a stderr line
  so the user can see delegation was attempted.
- **RAG search dedups** by `(source, text)`, so re-ingesting the
  same file no longer surfaces the same chunk four times.
- **`redact` reads from stdin** so
  `echo 'j@x.com' | edgewell redact` works.
- **`journal find <tag>` subcommand** is wired (was documented but
  returned the wrong usage line). The journal `add` command now
  also caps entries at 8 KB with a word-boundary truncation warning.
- **`companion` refuses privileged ports** (anything `<1024`) unless
  `--allow-privileged` is passed.
- **20 of 24 UAT findings closed**, plus all 3 critical code-review
  blockers. The 4 skipped items are documented in the commit
  messages as design choices.

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

All knobs live in `src/config.ts` and can be overridden by env vars.
`EDGEWELL_DATA_DIR` is validated — when running as root, the loader
refuses to resolve the path into a system root (`/etc`, `/usr`,
`/bin`, `/sbin`, `/var`, `/boot`, `/System`, `/Library`).

| Variable                  | Default                       | Description                       |
|---------------------------|-------------------------------|-----------------------------------|
| `EDGEWELL_DATA_DIR`       | `./data`                      | Override the data directory (relative or absolute path; validated) |
| `EDGEWELL_MODEL`          | `LLAMA_3_2_1B_INST_Q4_0`      | Local model id                    |
| `EDGEWELL_DELEGATE_MODEL` | `LLAMA_3_1_8B_INST_Q4_K_M`    | Peer-side model id                |
| `EDGEWELL_P2P_HOST`       | `127.0.0.1`                   | Peer host                         |
| `EDGEWELL_P2P_PORT`       | `8787`                        | Peer port                         |
| `EDGEWELL_P2P_ENABLED=1`  | `0`                           | Enable delegation with fallback   |
| `EDGEWELL_LOG`            | `info`                        | Log level: debug, info, warn, error |
| `EDGEWELL_PLUGINS`        | `./plugins`                   | Plugin directory                  |
| `EDGEWELL_COMPANION_SECRET` | (random per start)          | Override the companion HMAC secret (use `rotate-secret` to mint) |
| `EDGEWELL_OFFLINE=1`      | `0`                           | Force stub output in `ask` (no @qvac/sdk required) |

## Project layout

```
edgewell/
  bin/edgewell.js          CLI entry (shim -> bin/edgewell.ts via tsx)
  src/
    config.ts              Defaults + env loading + validation
    qvac.ts                EdgeWellLLM (lazy @qvac/sdk wrapper)
    store.ts               JsonlStore (append-only records)
    profile.ts             ProfileStore (small JSON file)
    rag.ts                 TF-IDF RAG index (with dedup)
    vector-index.ts        Vector RAG index (cosine top-k)
    hybrid-search.ts       Lexical + vector hybrid + bigram re-ranker
    p2p.ts                 Peer server, PeerClient, DelegatingLLM
    peer-mesh.ts           Multi-peer mesh with health checks
    redact.ts              PII redactor (emails, phones, Thai IDs, SSN, IPv4)
    crypto.ts              At-rest encryption (scrypt + AES-256-GCM)
    index.ts               createEdgeWell() factory + public exports
    cli.ts                 Colors, parseFlags, withReadline
    dispatch.ts            Subcommand router
    agents/
      health.ts            Health agent
      finance.ts           Finance agent
      orchestrator.ts      Multi-agent router (router prompt + keyword fallback)
      sleep.ts             Lifestyle agent
      nutrition.ts         Lifestyle agent
      hydration.ts         Lifestyle agent
      activity.ts          Lifestyle agent
      index.ts             Re-exports
    companion/
      server.ts            Companion HTTP server (auth + CORS + static)
      router.ts            Dependency-free router with OPTIONS preflight
      auth.ts              HMAC-SHA256 bearer tokens (newSecret/signToken/verifyToken)
      mdns.ts              mDNS announcement stub
    commands/              One file per subcommand (~140 commands)
  test/                    node --test unit + integration tests
  data/                    Local user data (gitignored)
  web/                     Static web UI (served by companion)
  package.json
  README.md
  AGENTS.md                Agent reference
```

## Companion server (mobile / web UI)

`edgewell companion` boots an HTTP server that:

- listens on `--host` / `--port` (default `127.0.0.1:8787`; refuses
  ports `<1024` unless `--allow-privileged` is passed);
- serves the bundled `web/` UI on the same port (so a phone browser
  pointed at `http://<desktop-ip>:8787/` just works);
- exposes `/chat`, `/journal` (GET + POST), `/expenses` (GET + POST),
  `/profile`, and `/health`;
- short-circuits `OPTIONS` preflight with `204` and sends
  `Access-Control-Allow-Origin: *` on every response;
- gates everything except `/health` behind an HMAC bearer token.

Mint a token:

```bash
edgewell companion --print-token   # one-shot, prints a token for the auto-generated secret
EDGEWELL_COMPANION_SECRET=$(cat ~/.edgewell/secret) edgewell companion --port 8787
EDGEWELL_COMPANION_SECRET=$(cat ~/.edgewell/secret) edgewell token my-phone   # mint for a specific subject
```

Rotate the secret (writes `~/.edgewell/secret` with mode `0600`):

```bash
edgewell rotate-secret
```

The bundled `web/app.js` will prompt for the token automatically the
first time it sees a `401`. Paste in the output of
`edgewell companion --print-token` (or `edgewell token my-phone`).

## Data and privacy

Everything EdgeWell needs lives under `data/`:

- `data/journal.jsonl` - free-form journal entries
- `data/expenses.jsonl` - amount + category rows
- `data/profile.json`   - name, goals, baseline numbers
- `data/rag/chunks.json` - local lexical RAG index
- `data/rag/vectors.json` - local vector RAG index (v3.0.0+)
- `~/.edgewell/secret`  - companion HMAC secret (mode `0600`)
- `~/.edgewell/state.json` - last applied form-factor profile

Nothing leaves the device unless you explicitly point the P2P client
at a remote peer. Even then, only the prompt and tokens cross the
network - there is no analytics, no telemetry, no upstream LLM.

## Disclaimer

The Health agent is educational. It is not a medical device and does
not provide diagnoses. For urgent or severe symptoms, contact a
licensed clinician or local emergency services.
