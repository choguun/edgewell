# Why EdgeWell Wins — Innovation Pitch

> Submission narrative for the QVAC General Purpose hackathon track.
> All claims are anchored in code paths and CLI commands in the
> `edgewell` repository. Updated for v3.0.1.

## TL;DR

EdgeWell is a private, on-device personal health and finance coach
that runs the entire stack — router, specialists, RAG, tool agent,
companion server, multimodal ingest — on the user's own hardware
using QVAC SDK models. One TypeScript codebase ships as a CLI, a
peer-to-peer server, and a mobile-friendly web companion behind an
HMAC token gate. v3.0.1 closes 20 of 24 UAT findings, ships 6
specialist agents (Health, Finance, Sleep, Nutrition, Hydration,
Activity) behind one Orchestrator, ~190 CLI subcommands,
hybrid lexical+vector RAG with a bigram re-ranker, and a
multi-peer mesh that consensus-votes answers when more than one
peer is reachable.

## The problem

- **Consumer AI is a privacy minefield.** Health journals, expense
  ledgers, and wearable sensor streams flow through remote
  providers that retain, monetize, or leak them. The threat model
  in `docs/SECURITY-MODEL.md` starts from "network is hostile" for
  exactly this reason.
- **Edge devices cannot run >1B-parameter models.** A Raspberry Pi
  or a mid-range phone hits a memory wall before it can host a
  useful general model. EdgeWell ships form-factor profiles
  (`mobile`, `tinkerer`, `desktop` in `src/profiles.ts`) that
  swap model IDs and chunk sizes at runtime so the same binary
  runs on a 1B-phone, a 4 GB Pi, and an 8 GB laptop.
- **Multi-agent systems usually live in the cloud.** Most
  orchestrator/agent frameworks assume a server. EdgeWell's
  `src/agents/orchestrator.ts` runs a JSON-output router prompt
  with a keyword fallback and dispatches to a local specialist,
  all offline, with no shared scratchpad and no agent-to-agent
  call.

## What EdgeWell does that's different

1. **Six specialists + one router.** `src/agents/index.ts`
   exports `HealthAgent`, `FinanceAgent`, `SleepAgent`,
   `NutritionAgent`, `HydrationAgent`, `ActivityAgent`, plus the
   `Orchestrator` that picks one. The router prompt in
   `src/agents/orchestrator.ts` requests a single JSON object,
   tolerates code fences, and falls back to a keyword regex on
   the user's question if the model returns anything else.
2. **Peer-mesh with majority-vote consensus.** `src/peer-mesh.ts`
   exposes `healthy()`, `stream()`, `broadcast()`, and
   `consensus()`. The mesh pings every peer in parallel, sorts by
   latency, streams the prompt to the first healthy peer, and can
   also fan out a single prompt to every peer and pick the most
   common short-text answer.
3. **Hybrid TF-IDF + vector RAG with RRF + bigram re-ranker,
   offline.** `src/rag.ts` (lexical, zero external deps) +
   `src/vector-index.ts` (cosine top-k, hash embedder by default)
   + `src/hybrid-search.ts` (reciprocal rank fusion, default
   `k0 = 60`) + `src/retrieval-fusion.ts`. RAG chunks are deduped
   by `(source, text)` since v3.0.1, so re-ingesting the same
   file never surfaces the same chunk twice.
4. **Multimodal ingest — image, audio, sensor streams.**
   `src/multimodal/index.ts` dispatches by file extension:
   `ingestImage` for `.png/.jpg/...`, `ingestAudio` for
   `.wav/.mp3/...`, `summariseEvents` for sensor streams, with a
   plain-text fallback so `.md/.txt` notes also flow into RAG.
   Pluggable `captionFn` / `transcribeFn` slots mean the offline
   placeholder can be swapped for a real QVAC captioner at
   runtime.
5. **At-rest encryption, PII redaction, snapshot signing.**
   `src/crypto.ts` is scrypt + AES-256-GCM with parameters
   bundled in the envelope so the algorithm can be rotated
   later. `src/redact.ts` redacts emails, phones, Thai national
   IDs, US SSNs, IPv4, URL-embedded credentials, and long
   numeric runs (10–30 digits) before they leave the device.
   Snapshot sign/verify round out the cryptographic envelope.
6. **Tool-calling loop with malformed-call detection.**
   `src/tool-agent.ts` parses `<tool name="...">{json}</tool>`
   blocks, runs the registered tool, feeds results back, and now
   (v3.0.1) detects two failure modes: unclosed `<tool>` tags and
   stuck loops where the model keeps emitting the same tool
   calls. Both surface explicit errors instead of silently
   looping until `maxRounds`.
7. **One codebase, three form-factor profiles.** `src/profiles.ts`
   defines `mobile` (1B phone default), `tinkerer` (Pi 4/5, ≤4 GB
   RAM), and `desktop` (≥16 GB RAM, bigger local model). A user
   runs `edgewell profiles apply mobile` and the applied profile
   is persisted to `~/.edgewell/state.json` — wired in v3.0.1.

## Concrete numbers (with file references)

- **7 agents total** (Orchestrator + 6 specialists) exported by
  `src/agents/index.ts`.
- **~190 CLI subcommands** wired in `src/dispatch.ts` (the
  `MAP` table; `README.md` rounds this to ~140, the source
  imports ~193 distinct entries).
- **Companion HTTP server** with CORS, `OPTIONS` preflight
  handling, HMAC bearer tokens, and a bundled static `web/` UI
  served from the same port — `src/companion/server.ts`,
  `src/companion/router.ts`, `src/companion/auth.ts`.
- **Multimodal entry** with three modalities and a text
  fallback — `src/multimodal/index.ts`, `image.ts`, `audio.ts`,
  `sensors.ts`.
- **Tool agent loop** with up to 3 rounds and stuck-loop
  detection — `src/tool-agent.ts` (`maxRounds = 3` default,
  `lastSignature` early-exit guard).
- **At-rest encryption** is scrypt + AES-256-GCM with the
  parameters baked into the envelope so they can be rotated —
  `src/crypto.ts` (`ALGO`, `SCRYPT_PARAMS`).
- **Redactor** scrubs eight PII patterns before any peer call —
  `src/redact.ts` (rules ordered most-specific-first so
  URL-with-creds beats email).
- **Form-factor profiles** ship three ready-to-use knobs —
  `src/profiles.ts` (`mobile`, `tinkerer`, `desktop`).
- **440 unit + integration tests** run offline (no SDK
  installed) — `pnpm test` via `node --import tsx --test
  test/*.test.ts` (script in `package.json`).
- **v3.0.1 closed 20 of 24 UAT findings plus 3 critical
  code-review blockers** — `README.md` "What's new in v3.0.1".

## Why this fits the hackathon criteria

- **General-purpose on-device AI:** Every code path runs locally.
  The local model defaults to `LLAMA_3_2_1B_INST_Q4_0`; the
  peer-side default is `LLAMA_3_1_8B_INST_Q4_K_M` —
  `README.md` Configuration table.
- **Privacy by default:** Threat model in
  `docs/SECURITY-MODEL.md` plus on-disk encryption in
  `src/crypto.ts` and pre-egress redaction in `src/redact.ts`.
- **Multi-agent orchestration:** Router + 6 specialists behind
  one `Orchestrator` class — `src/agents/orchestrator.ts`.
- **Pluggable on-device RAG:** Hybrid lexical + vector + RRF +
  bigram rerank — `src/hybrid-search.ts` and
  `src/retrieval-fusion.ts`.
- **Mobile-friendly form factor:** Companion HTTP server with
  HMAC bearer auth and a static web UI served from the same
  port — `src/companion/server.ts`.
- **Robust peer/mesh:** Healthy-peers list, latency-sorted
  streaming, broadcast, and majority-vote consensus —
  `src/peer-mesh.ts`.
- **Production hardening in the final week:** v3.0.1 closes 20
  of 24 UAT findings, fixes companion CORS, wired
  `rotate-secret`, fixed `profiles apply`, deduped RAG —
  `README.md` "What's new in v3.0.1".

## Demo in 90 seconds

The script below is lifted from `demo/demo-script.md` line by line
so what judges see on the recording is byte-identical to what
community voters can paste on their own machine. Total runtime
≈ 90 seconds for the voice-over, ≈ 5 minutes for the commands;
the underlying commands reproduce in under 60 seconds of wall
time on Apple silicon (`demo/demo-script.md` "Behind-the-scenes").

```bash
# 00:00 — EdgeWell — private, on-device, multi-agent
#         (pre-roll: `pnpm install` already green ✔)
pnpm install

# 00:05 — QVAC SDK · local-first · no telemetry
node bin/edgewell.js doctor
# expected: 12/12 green ✔

# 00:12 — Multi-agent orchestrator
#         3 questions routed to 3 specialists + 2 tool calls
node bin/edgewell.js showcase

# 00:30 — Hybrid RAG (TF-IDF + vector, RRF, rerank)
node bin/edgewell.js rag "sleep journal last week"
# expected: top-5 hits with per-retriever scores

# 00:45 — P2P delegation + fallback
#         companion HTTP server on :8787 with bundled web/ UI;
#         --print-token mints a one-shot HMAC bearer.
node bin/edgewell.js companion --port 8787 --print-token
# in another terminal:
curl -s http://127.0.0.1:8787/health

# 01:00 — One codebase, three form factors
node bin/edgewell.js profiles list
node bin/edgewell.js profiles apply mobile
node bin/edgewell.js profiles apply tinkerer
node bin/edgewell.js profiles apply desktop

# 01:15 — Reproducible in 5 min from clean clone
pnpm test
# expected: 440/440 green ✔

# 01:25 — Reproducible bench
node bin/edgewell.js bench
# JSON form saved to artifacts/bench.json

# 01:30 — Hackathon submission
# cut to HACKATHON-SUBMISSION.md rendered as the canonical
# judge-facing submission
```

### Demo footnote

If `@qvac/sdk` is not installed (the typical judge laptop), set
`EDGEWELL_OFFLINE=1` and `edgewell ask` runs the clean offline
stub (`[lifestyle]` / `[health]` / `[finance]` line + stub body)
— see `src/commands/ask.ts`. The router still runs first so the
stub announces which specialist would have answered.

## Social proof

Artifacts the community can verify during the evaluation window.
Every file path below is real and tracked in the repo; line
counts and content match `HACKATHON-SUBMISSION.md` §12.

| What it proves                                              | Path (real)                                  |
|-------------------------------------------------------------|----------------------------------------------|
| Canonical submission, judge-facing                          | `HACKATHON-SUBMISSION.md`                    |
| Multi-agent orchestrator + 6 specialists + lifestyle        | `src/agents/index.ts`, `src/agents/orchestrator.ts` |
| Hybrid RAG (lexical + vector + RRF + bigram rerank)         | `src/hybrid-search.ts`, `src/vector-index.ts`, `src/rag.ts` |
| Peer-mesh healthy / stream / broadcast / consensus          | `src/peer-mesh.ts`                           |
| P2P delegation with local fallback (silent → observable)    | `src/p2p.ts` (`DelegatingLLM`)               |
| Tool-calling loop with stuck-loop and malformed-call guards | `src/tool-agent.ts`                          |
| Tool registry (calculator, datetime, search_kb, expenses, journal) | `src/tools.ts`                        |
| Three form-factor profiles (mobile / tinkerer / desktop)    | `src/profiles.ts`                            |
| Model catalog (Llama + MedPsy, frozen identifiers)          | `src/registry.ts`                            |
| Multimodal ingest (image / audio / sensor / text fallback)  | `src/multimodal/index.ts`                    |
| At-rest scrypt + AES-256-GCM                                | `src/crypto.ts`                              |
| Pre-egress PII redactor                                     | `src/redact.ts`                              |
| Companion HTTP server + HMAC bearer + CORS + OPTIONS 204    | `src/companion/server.ts`, `src/companion/auth.ts` |
| Bundled web/ UI on the same port                            | `web/app.js`, `web/index.html`               |
| Threat model — "network is hostile"                         | `docs/SECURITY-MODEL.md`                     |
| Architecture reference + Mermaid diagram                    | `docs/ARCHITECTURE.md`, `docs/diagrams/architecture.mmd` |
| Per-form-factor deployment guide                            | `docs/DEPLOYMENT.md`                         |
| Performance numbers (latency, tokens/s, P2P distribution)   | `docs/PERFORMANCE.md`                        |
| Reproducible bench JSON (profile × model × tok/s)           | `artifacts/bench.json`                       |
| Hardware-proof matrix (profile × model × chunk × tok/s)    | `artifacts/hardware-proof.txt`               |
| Source-tree SHA-256 fingerprint                             | `artifacts/source-sha256.txt`                |
| Agents manifest (machine-readable)                          | `artifacts/agents-manifest.json`             |
| Worked peer-mesh transcript (healthy → stream → consensus)  | `demo/peer-mesh-demo.log`                    |
| Worked tool-agent showcase (calculator → search_kb → journal) | `demo/multimodal-tool-showcase.log`        |
| Step-by-step demo script for the recorded video             | `demo/demo-script.md`                        |
| Build-in-public thread + per-day calendar                   | `social/build-in-public.md`                  |

### How a community voter verifies in 5 minutes

```bash
git clone <repo-url> edgewell && cd edgewell
corepack enable && corepack prepare pnpm@11.6.0 --activate
pnpm install
node bin/edgewell.js doctor     # 12/12 green
node bin/edgewell.js showcase   # 3 questions, 3 specialists
pnpm test                        # 440/440 green
ls artifacts/                    # bench.json, hardware-proof.txt,
                                 # source-sha256.txt all present
```

If the same `artifacts/source-sha256.txt` matches the published
fingerprint, the build is bit-identical to the submitted
artifact. If `pnpm test` is green and `showcase` reaches the
Health/Finance/Sleep branches, the routing logic is verified.

> Voting flow for community: open `HACKATHON-SUBMISSION.md` →
> reproduce §4 in your own terminal → confirm the file paths in
> the table above exist in your clone → upvote on Keet / Discord
> and star on GitHub.

## Codebase posture

- **TypeScript end-to-end.** `tsconfig.build.json` + `pnpm build`
  compile every `src/*.ts` into `dist/`. `bin/edgewell.js` is a
  shim that spawns `bin/edgewell.ts` under `node --import
  tsx/esm` so both `node bin/edgewell.js <cmd>` and `node
  dist/bin/edgewell.js <cmd>` work.
- **No telemetry.** `docs/SECURITY-MODEL.md` says so explicitly.
- **Hardened in v3.0.1.** Companion CORS + `OPTIONS 204` +
  bundled UI + `web/app.js` 401 prompt, `rotate-secret` writes
  to `~/.edgewell/secret` mode `0600`, `profiles apply` persists
  to `~/.edgewell/state.json`, `EDGEWELL_DATA_DIR` is validated
  against system roots when run as root, P2P silent fallback
  now logs a structured `warn` + stderr line, RAG search dedups
  by `(source, text)`, `redact` reads from stdin, `journal find
  <tag>` is wired, `journal add` caps at 8 KB, companion
  refuses privileged ports.

## What's next

- Swap the hash embedder in `src/vector-index.ts` for the real
  QVAC embedding model once the SDK ships it.
- Real captioner/transcriber injection in
  `src/multimodal/index.ts` (the slots already exist).
- Encrypted snapshots across the peer mesh so two devices can
  sync RAG indexes without redaction loss.
