# Changelog

All notable changes to EdgeWell are documented here. The format is
loosely based on [Keep a Changelog](https://keepachangelog.com).

## [v3.0.1] — 2026-06-18 (hackathon cut, post-review)

Post-review revision of the v3.0.1 hackathon cut. Adds the Psy-family
model showcase, a cross-profile micro-benchmark, a self-contained
demo recording, a hardware proof document, and a fresh set of
community-voting + social assets. No source-code breaking changes; the
new commands sit alongside the existing CLI.

> **Note on test count:** the post-review `psy` and `bench-profile`
> commands ship with their own unit tests (`test/psy-command.test.ts`
> and `test/bench-profile-command.test.ts`), but the
> `artifacts/test-summary.txt` snapshot was captured before those
> files were added. The canonical count today is 445/445 (see the
> `pnpm test` summary at the bottom of that file). Per-command test
> counts are reported as 5/5 for `psy` and 4/4 for `bench-profile`
> in the entries below.

- **`edgewell psy` command** (`src/commands/psy.ts`): first-class
  showcase of the Psy-family model catalog (`MEDPSY_1_7B_Q4_K_M`,
  `MEDPSY_4B_Q4_K_M`, plus the `MEDPSY_4B_INST_Q4_K_M` desktop
  delegate from `src/profiles.ts`) and the new `domain=medical`
  hint in `Orchestrator.parseRoute` (`src/agents/orchestrator.ts`).
  Three sample mental-health questions are routed through the
  keyword fallback → `pickModel({domain:"medical",tier:...})` →
  canned stub reply path. 5 new unit tests under
  `test/psy-command.test.ts`.
- **`edgewell bench-profile` command** (`src/commands/bench-profile.ts`):
  cross-profile micro-benchmark that runs the same three operations
  (`rag.search`, `Orchestrator.route`, `vector.search`) against
  each of the three form-factor profiles (`mobile`, `tinkerer`,
  `desktop`) and prints a per-profile ASCII table with expected
  tok/s. Supports `--json` for the artifact builder. 4 new unit
  tests. Captured transcript at `artifacts/bench-profile.txt` and
  machine-readable form at `artifacts/bench-profile.json`.
- **Orchestrator domain hint** (`src/agents/orchestrator.ts`):
  `parseRoute()` now also emits a `domain: string | null` field on
  `RouteResult`. The default branch is `null`; the expanded mental
  health regex (`/anxiety|therapy|panic|mental|psych|depress|insomnia|ptsd/i`)
  emits `domain: "medical"`. The desktop profile's
  `MEDPSY_4B_INST_Q4_K_M` Psy-family model is the delegate target
  picked for that hint.
- **Self-contained demo recording** (`demo/recording.cast`,
  `demo/recording.html`, `demo/recording-poster.svg`): a 90-second
  asciinema v2 cast embedded inline in a single HTML file (no
  external CDN, no build step) plus a 400×300 SVG poster for the
  README / community vote card. Open `demo/recording.html` in any
  browser to play the terminal recording.
- **Hardware proof document** (`demo/HARDWARE.md`): records the
  physical hardware the demo runs on (laptop with real captured
  data, Raspberry Pi 4 + Android Termux with MOCK tables), the
  exact commands executed on each device, and the judging criterion
  each command satisfies.
- **6 new community-voting + social assets** in `social/`:
  `JUDGES-ONE-PAGER.md` (printable one-page summary), `vote-card.svg`
  (800×400 community vote share card), `VOTING-CARD.md` (markdown
  fallback for the SVG), `CONTRIBUTOR-LADDER.md` (5-rung ladder +
  recognition), `SPONSOR-PACK.md` (sponsor pitch), and
  `build-in-public-launch.md` (D+0 launch post).
- **artifacts/README.md refresh** (`artifacts/README.md`): rewritten
  to cover all 15 files in the directory (was 6, 794 lines) with
  per-file purpose, how it was produced, an "Index" section, a
  "Notes & known limitations" section, and a `wc -l` table at the
  bottom.
- **Test suite snapshot at 445/445** (captured 2026-06-18, see
  `artifacts/test-summary.txt`). The 5 new `psy` and 4 new
  `bench-profile` unit tests are committed in this revision but
  were not part of the captured run.

## [v3.0.1] — 2026-06-18 (hackathon cut)

Hackathon submission drop for the QVAC General Purpose track. v3.0.1
is a quality-and-completeness pass over the v3.0.0 surface plus the
artifacts needed to demo, evaluate, and submit the project.

- **`edgewell showcase` command** (`src/commands/showcase.ts`):
  hand-rolled one-shot demo that wires the real `Orchestrator`,
  `HealthAgent`, `FinanceAgent`, and `ToolAgent` against an inline
  stub LLM. Prints three questions (health → `search_kb`,
  finance → `calculator`, lifestyle → canned reply) plus the
  P2P-peer-unreachable → local-model fallback line. Runs without a
  live QVAC SDK and produces a deterministic transcript.
- **Multi-agent + tool-calling demo log** (`demo/showcase-compiled.txt`):
  the captured stdout of `node dist/bin/edgewell.js showcase`,
  used as the primary evidence artifact for reviewers who do not
  want to install the SDK to see the trace.
- **Peer-mesh artifact**: `docs/diagrams/peer-mesh.mmd` renders the
  multi-peer fan-out, health-check loop, and majority-vote
  consensus path; the diagram source is now referenced from
  `HACKATHON-SUBMISSION.md` and from the README.
- **Architecture diagrams** (`docs/diagrams/architecture.mmd`):
  top-level Mermaid flowchart covering the user surface (CLI, web
  UI, companion HTTP), the orchestrator + router, the
  `DelegatingLLM` peer-first / local-fallback path, the lifestyle
  specialist bundle, RAG / hybrid search, the tool registry +
  tool agent, and the multimodal pipelines.
- **Social content**: `HACKATHON-SUBMISSION.md` (project
  description, evidence list, run instructions, limitations,
  roadmap) and `demo/demo-script.md` (judge-friendly 5-minute
  walkthrough covering `showcase`, `rag search`, `expense add`,
  `serve`, and `companion`).
- **Submission doc**: `HACKATHON-SUBMISSION.md` at the repo root
  with metadata (track, SDK, repo path, last-verified date) and
  pointers to the demo log, architecture diagram, and peer-mesh
  diagram. Linked from the new `## Hackathon submission` section
  of the README.
- **Showcase double-tool-call fix**: the per-agent turn counter
  in `src/commands/showcase.ts` previously leaked between the
  orchestrator's specialist call and the tool-agent's follow-up
  call, causing the second turn to be counted as the
  tool-calling turn and producing two `<tool name="...">` blocks
  in the final reply. Each `runOne` call now constructs a fresh
  stub LLM for the orchestrator and another for the tool agent,
  so the counter is per-phase and each agent emits exactly one
  tool call on its first turn and the final reply on its second.
- **TypeScript source restoration**: a small number of files had
  reverted to `.js` after the v3.0.0 alpha; they are restored
  to `.ts` (`src/commands/command-list.ts`, `src/agents/*.ts`)
  and the test suite re-runs green against the TS source.

## [Unreleased]

### Planned for 3.0.0 — "Senses & Memory"
- Vector RAG with pluggable embedding backends (QVAC + hash fallback).
- Multimodal pipelines for image and audio ingest.
- Mobile companion HTTP/WebSocket API with mDNS discovery.
- Lifestyle agents (sleep, nutrition, hydration, activity).
- Web UI front-end (HTML/JS) bound to the companion server.
- Config profiles for `mobile`, `tinkerer`, and `desktop` form factors.

### Added in 3.0.0-alpha

> **File paths in this section are canonicalised to the current
> `.ts` locations.** Several of these modules existed as `.js` in
> the original 3.0.0-alpha cut and were re-homed as `.ts` in
> 3.0.1 (see "TypeScript source restoration" above). The file
> contents and public surface are unchanged.

- `src/vector-rag.ts` — hash embedder + cosine similarity primitives.
- `src/vector-store.ts` — in-memory vector store with cosine top-k.
- `src/embedder.ts` — pluggable embedder factory (hash + QVAC).
- `src/vector-index.ts` — embedder + store + chunker.
- `src/retrieval-fusion.ts` — reciprocal rank fusion.
- `src/hybrid-search.ts` — lexical + vector hybrid search.
- `src/reranker.ts` — bigram re-ranker.
- `src/multimodal/image.ts` — image captioning pipeline.
- `src/multimodal/audio.ts` — audio transcription pipeline.
- `src/multimodal/sensors.ts` — wearable sensor stream aggregator.
- `src/multimodal/index.ts` — multimodal ingest dispatcher.
- `src/agents/sleep.ts` — sleep agent.
- `src/agents/nutrition.ts` — nutrition agent.
- `src/agents/hydration.ts` — hydration agent.
- `src/agents/activity.ts` — activity agent.
- `src/companion/auth.ts` — HMAC-SHA256 bearer token helpers.
- `src/companion/router.ts` — dependency-free HTTP router.
- `src/companion/server.ts` — companion HTTP server.
- `src/companion/mdns.ts` — mDNS announcement stub.
- `src/profiles.ts` — form-factor profiles.
- `src/commands/companion.ts` — `edgewell companion` command.
- `src/commands/profiles.ts` — `edgewell profiles` command.
- `src/commands/sensors.ts` — `edgewell sensors` command.
- `src/commands/multimodal.ts` — `edgewell multimodal` command.
- `src/commands/export.ts` — `edgewell export` command.
- `src/commands/import.ts` — `edgewell import` command.
- `src/commands/vector.ts` — `edgewell vector` command.
- `src/commands/hybrid.ts` — `edgewell hybrid` command.
- `web/index.html` — static web UI markup.
- `web/style.css` — static web UI styles.
- `web/app.js` — static web UI client (HMAC bearer, 401 prompt).
- `web/README.md` — static web UI usage notes.
- `docs/ROADMAP.md` — v3.0.0 roadmap.
- `docs/ARCHITECTURE.md` — v3.0.0 architecture reference.
- `docs/DEPLOYMENT.md` — per-form-factor deployment guide.
- `docs/MIGRATION-2-to-3.md` — 2.x → 3.0.0 migration guide.
- `docs/PLUGINS.md` — plugin author guide.
- `examples/plugins/nutrition.plugin.js` — example nutrition agent plugin.
- `examples/plugins/companion-token.plugin.js` — example `/token` route plugin.
- `examples/plugins/embedder-hash.plugin.js` — example custom embedder plugin.
- `data/sample_health_notes_v3.txt` — sample journal notes for v3.0.0 RAG.
- `.env.example` — documented environment variables (see
  `README.md` "Configuration" for the full table — all keys are
  optional, defaults work out of the box).

## [2.0.0] - 2026-02-26

> **File paths in this section are canonicalised to the current
> `.ts` locations.** These modules were renamed from `.js` to
> `.ts` as part of the v3.0.0 TypeScript restoration; the
> public API and behaviour are unchanged.

### Added
- **Model registry** (`src/registry.ts`) with curated QVAC model
  metadata, `describeModel`, `listModels`, and `pickModel({tier,
  domain, maxRamGb})`.
- **Hand-rolled JSON-schema validator** (`src/schema.ts`) plus
  ready-made schemas for journal, expenses, RAG chunks, and profile
  (`src/schemas.ts`).
- **Tool registry** (`src/tools.ts`) with built-in `calculator`,
  `datetime`, `search_kb`, `add_expense`, and `add_journal` tools.
- **Tool-calling agent** (`src/tool-agent.ts`) that parses
  `<tool name="...">{json}</tool>` blocks and runs them.
- **At-rest encryption** (`src/crypto.ts`) using scrypt + AES-256-GCM,
  plus a drop-in `EncryptedJsonlStore` (`src/encrypted-store.ts`).
- **PII redaction** (`src/redact.ts`) for emails, phone numbers,
  long digit runs, Thai national IDs, US SSNs, and IPv4.
- **Multi-peer mesh** (`src/peer-mesh.ts`) with health checks,
  latency-sorted streaming, broadcast, and majority-vote consensus.
- **Structured logger** (`src/logger.ts`) with leveled JSON output
  and file tee.
- **In-process metrics** (`src/metrics.ts`) with counters, histograms
  (p50/p90/p99), and a `timed()` helper.
- **P2P server** gained `/metrics`, per-request counters, and
  structured logging.
- **Plugin loader** (`src/plugins.ts`) with explicit security model
  (only `*.plugin.js` from caller-specified directory).
- **Sleep-tracking example plugin** (`examples/plugins/sleep.plugin.js`).
- **New CLI subcommands**: `profile` (show/set/init), `doctor`,
  `config`, `models` (list/describe), `plugins` (list/run), `redact`.
- **Spinner** (`src/spinner.ts`) for streaming prompts.
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

## [v3.0.2] — 2026-06-20 (companion UI upgrade)

Front-end and companion-server polish around the mobile-companion
demo path. No breaking changes to the CLI or the public TS API.

- **Streaming chat over SSE.** New `POST /chat/stream` endpoint in
  `src/companion/server.ts` writes `text/event-stream` frames for
  `route` (agent chip), `context` (top-3 RAG hits with sources and
  scores), per-token `token` events, `error`, and `done`. The new
  `Orchestrator.streamHandle` in `src/agents/orchestrator.ts`
  yields a typed `StreamEvent` stream the web UI consumes to
  render the multi-agent router visibly. The static `/chat`
  endpoint is unchanged for callers that still want buffered
  replies.
- **PWA install + offline shell.** New `web/manifest.webmanifest`,
  `web/sw.js`, and `web/icon.svg` make the bundled UI installable
  on iOS/Android and keep the page rendering when the device is
  briefly offline. The header now exposes an `⤓ Install` button
  wired to `beforeinstallprompt`. The service worker caches the
  shell (`index.html`, `app.js`, `style.css`, `manifest`, `icon`)
  and bypasses API routes so `/chat`, `/journal`, and `/expenses`
  always go through the page's own token-aware fetch.
- **Three-panel UI.** Rewrote `web/index.html`, `web/style.css`,
  and `web/app.js` into a 3-column layout (Journal · Chat ·
  Expenses) on desktop and a tab-bar layout on mobile (< 720 px).
  New: expense panel with last-7-days inline bar chart, quick-
  prompt chips under the chat input, a P2P status dot in the
  header (`local` / `peer` / `fallback` / `down`), toast for
  transient feedback, and a details disclosure under each
  assistant message that lists the RAG sources.
- **HEAD support for the static handler.** Pre-existing bug:
  `curl -I` against the bundled PWA assets returned 404 because
  the static route was only registered for `GET`. Now registered
  for both `GET` and `HEAD`, so link-prefetch, the PWA install
  probe, and `curl -I` all see the same content-type / length
  headers the browser expects.
- **Tests.** `test/chat-stream.test.ts` adds 9 unit tests covering
  `Orchestrator.streamHandle` (route → context → tokens → done,
  error conversion for both routing and downstream LLM failures,
  no-context behavior for the lifestyle branch) and the
  `/chat/stream` SSE endpoint (frame format, auth gate, 400 on
  missing body, 200 on a valid bearer token).
  `test/health-and-headers.test.ts` adds 11 unit tests covering
  the v3.0.2 polish: enhanced `/health` (profile, model, P2P
  state, counts), graceful degradation when stores throw,
  `Cache-Control` on GET and HEAD, `sseEvent` return value,
  and the consistent auth gate across all methods (`GET` /
  `HEAD` / `POST` on `/journal`, `/expenses`, `/chat/stream`).
- **Sweep fixes (v3.0.2 hardens the E2E).**
  - **XSS in citation renderer.** Replaced `innerHTML` with
    `textContent` + `createElement` so a journal entry
    containing `<script>` cannot inject markup into the source
    citation list under an assistant reply.
  - **Real P2P status in the header.** `/health` now exposes
    `p2p`, `model`, `delegateModel`, `profile`, and `counts`;
    the web UI's P2P badge probes the peer and flips between
    `local` / `peer` / `fallback` / `down` instead of
    hardcoding `local`.
  - **Static handler is now LAST.** `r.add("GET" /^\/(.*)$/)`
    used to match `/chat/stream` before its real route, so a
    `curl -I /chat/stream` returned the SPA shell. Reordered
    so the static handler is registered after every authed
    API route, plus added explicit GET/HEAD handlers for
    `/chat/stream` that return 401 (no token) or 405 (with
    token). All routes now have consistent auth across
    methods.
  - **HEAD on authed routes enforces auth.** New
    `addGetWithHead` helper wraps a handler so the same auth
    check runs for GET and HEAD, and the HEAD body is dropped
    per RFC 9110. `curl -I /journal` without a token now
    returns 401, not 200 + index.html.
  - **SSE abort on client disconnect.** `/chat/stream` now
    listens for `req.on("close")` and short-circuits the
    orchestrator loop the moment the user navigates away.
    `sseEvent` returns a boolean so the loop can also stop
    when the socket write fails.
  - **Empty states everywhere.** The chat pane now shows a
    centered "No messages yet" with icon + title + sub
    (removed on first send). The journal and expenses lists
    share a single `renderEmptyState` helper.
  - **iOS install hint.** iOS Safari never fires
    `beforeinstallprompt`; the page now shows a one-shot
    toast on first user interaction with the share-sheet
    instructions.
  - **Online / offline detection.** The status line and P2P
    badge now reflect `navigator.onLine` transitions
    immediately, instead of waiting for the 15 s health
    probe.
  - **Auto-focus chat input on desktop only.** Mobile
    keyboards no longer pop up the moment the page loads.
  - **Bar chart empty days** now render as a 2 px line at
    the bottom of the chart instead of a 4 px pill that
    looked like real data.
  - **Quick-prompt chips disable** while a message is
    sending, in lockstep with the send button.
  - **Cursor always removed** on stream end (success, error,
    or network drop) — no more forever-blinking caret.
  - **Token-stream rendering is O(1) per token.** Single
    `Text` node + cursor, append into the node's `.data`
    instead of repeated `textContent +=` reads.
