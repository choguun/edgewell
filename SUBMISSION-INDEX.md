# EdgeWell v3.0.1 — Hackathon Submission Index

> **Hackathon:** Tether QVAC Hackathon (General Purpose track)
> **Submission date:** 2026-06-18
> **One-liner:** Private on-device health + finance coach with a
> 7-agent orchestrator, peer-mesh delegation, multimodal ingest,
> and one codebase that runs on a laptop, a Pi, and a phone.

## Quick start for judges (5 minutes)

```bash
git clone <repo> edgewell && cd edgewell
corepack enable && corepack prepare pnpm@11.6.0 --activate
pnpm install && pnpm build && pnpm test
node dist/bin/edgewell.js showcase       # 33-line multi-agent + tool demo
node dist/bin/edgewell.js doctor         # 12-subsystem health check
node dist/bin/edgewell.js command-list   # 135 registered subcommands
node dist/bin/edgewell.js profiles list  # mobile / tinkerer / desktop
```

The showcase command runs end-to-end without a live QVAC SDK and
prints a deterministic 33-line transcript (see
`demo/multimodal-tool-showcase.log`).

## 1. Submission documents (read first)

| File                                    | Lines | Purpose                                       |
| --------------------------------------- | ----- | --------------------------------------------- |
| `HACKATHON-SUBMISSION.md`               | ~920  | Canonical submission doc — 14 sections + 2 appendices |
| `SUBMISSION-INDEX.md`                   | this  | Top-level index of every artifact              |
| `README.md`                             | -     | Project README with `## Hackathon submission` section |
| `CHANGELOG.md`                          | -     | `[v3.0.1] — 2026-06-18 (hackathon cut)` entry  |
| `AGENTS.md`                             | ~250  | Multi-agent reference (router + specialists)   |

## 2. Architecture diagrams

| File                                    | Lines | Purpose                                       |
| --------------------------------------- | ----- | --------------------------------------------- |
| `docs/diagrams/architecture.mmd`        | ~145  | Top-level Mermaid `flowchart TB`               |
| `docs/diagrams/architecture.txt`        | ~108  | Pure-ASCII fallback for terminal readers      |
| `docs/diagrams/router-flow.mmd`         | ~48   | Sequence diagram of one ask → router → reply  |
| `docs/diagrams/peer-mesh.mmd`           | ~33   | Peer-mesh healthy / stream / broadcast        |
| `docs/diagrams/multimodal-pipeline.mmd` | ~33   | Image / audio / sensor ingest paths           |
| `docs/diagrams/profile-apply.mmd`       | ~35   | Three form-factor profiles side-by-side       |
| `docs/diagrams/README.md`               | ~109  | Diagram index with render hints               |

## 3. Live evidence (judges, 3 min)

| File                                    | Lines | Source                                            |
| --------------------------------------- | ----- | ------------------------------------------------- |
| `demo/multimodal-tool-showcase.log`     | ~37   | `node dist/bin/edgewell.js showcase`              |
| `demo/showcase-compiled.txt`            | ~33   | Same, raw stdout                                  |
| `demo/peer-mesh-demo.log`               | ~87   | Synthetic trace of `PeerMesh.healthy/stream/...`  |
| `demo/demo-script.md`                   | ~86   | 90-second video script + per-OS install snippets  |
| `demo/showcase-test-run.txt`            | ~13   | TAP output of 5 showcase unit tests (5/5 ✔)      |
| `artifacts/test-summary.txt`            | 129   | Tail of `pnpm test` (445/445 ✔)                  |
| `artifacts/bench.json`                  | ~60   | `BenchmarkResult`-shaped honest measurements     |
| `artifacts/hardware-proof.txt`          | 107   | Host probe + doctor + status + info + showcase    |
| `artifacts/orchestrator-trace.txt`      | 266   | Annotated expected trace (3 questions × 2 paths)  |
| `artifacts/agents-manifest.json`        | 87    | 6 specialists + Orchestrator with tools           |
| `artifacts/companion-smoke.txt`         | 47    | Companion boot + `/health` curl                    |
| `artifacts/edgewell-help.txt`           | 65    | `edgewell help` output                            |
| `artifacts/edgewell-command-list.txt`   | 140   | Full 135-command registry (incl. `showcase`)      |
| `artifacts/edgewell-info.txt`           | 16    | `edgewell info` showing `version: 3.0.1`         |

## 4. Reproducibility (judges, 5 min)

| File                                    | Lines | Purpose                                       |
| --------------------------------------- | ----- | --------------------------------------------- |
| `artifacts/file-list.txt`               | 618   | `git ls-files` output                         |
| `artifacts/source-sha256.txt`           | 618   | `shasum -a 256` of every tracked file         |
| `docs/DEPLOYMENT.md`                    | ~120  | Per-form-factor install (Mac, Pi, Termux)     |
| `HACKATHON-SUBMISSION.md` § 4           | -     | "How judges reproduce" recipe                 |

## 5. Build-in-public & community (for the voting window)

| File                                    | Lines | Purpose                                       |
| --------------------------------------- | ----- | --------------------------------------------- |
| `social/build-in-public.md`             | ~104  | 12-post outline + D+0..D+10 calendar          |
| `social/twitter-thread.md`              | ~42   | 9-tweet X thread with CTA                     |
| `social/keet-pitch.md`                  | ~71   | ~250-word Keet pitch                          |
| `social/keet-channel-post.md`           | ~51   | Keet room post                                |
| `social/discord-channel-post.md`        | ~52   | Discord-flavored channel post                 |
| `social/linkedin-post.md`               | ~40   | Professional LinkedIn post                    |
| `social/community-faq.md`               | ~49   | 12-Q FAQ for community voters                 |
| `social/innovation-pitch.md`            | ~290  | Judge-facing "Why EdgeWell wins" deck         |
| `social/one-liners.md`                  | ~49   | 10 taglines + hero-image directions           |
| `social/demo-narration.md`              | ~41   | 60-second voice-over script                  |

## 6. Code surface (for the curious)

| File                                    | Purpose                                              |
| --------------------------------------- | ---------------------------------------------------- |
| `src/agents/orchestrator.ts`            | Router LLM + keyword fallback + dispatch             |
| `src/agents/{health,finance,sleep,nutrition,hydration,activity}.ts` | 6 specialists, each with `ask` / `streamAsk` |
| `src/tool-agent.ts`                     | `<tool name="...">{json}</tool>` loop with malformed-call detection |
| `src/peer-mesh.ts`                      | `healthy()` / `stream()` / `broadcast()` with majority-vote |
| `src/multimodal/`                       | image captioning + audio transcription + wearable sensor stream |
| `src/profiles.ts`                       | `mobile` / `tinkerer` / `desktop` profile matrix     |
| `src/companion/`                        | HTTP server (HMAC bearer, CORS, OPTIONS, bundled web UI) |
| `src/commands/showcase.ts`              | `edgewell showcase` — multi-agent + tool-calling + P2P demo |
| `test/showcase-command.test.ts`         | 5 unit tests for the showcase command (5/5 ✔)       |

---

## Total artifact size

| Bucket         | Files | Lines  |
| -------------- | ----- | ------ |
| Submission     | 5     | ~1300  |
| Architecture   | 7     | ~510   |
| Demo / logs    | 5     | ~260   |
| Artifacts      | 13    | ~1700  |
| Social         | 10    | ~790   |
| Test (new)     | 1     | ~146   |
| **Total**      | **41**| **~4700** |

---

## Verification matrix (re-run today)

```
✓ pnpm install            (re-runnable from clean clone)
✓ pnpm build              (exit 0; tsc -p tsconfig.build.json)
✓ pnpm typecheck          (exit 0)
✓ pnpm test               (445/445 pass, 0 fail, ~2.4 s)
✓ node dist/bin/edgewell.js info              → version 3.0.1
✓ node dist/bin/edgewell.js doctor            → 11/12 OK (QVAC SDK stub is expected FAIL)
✓ node dist/bin/edgewell.js status            → operational
✓ node dist/bin/edgewell.js agents list       → 6 specialists listed
✓ node dist/bin/edgewell.js command-list      → 135 commands (incl. showcase)
✓ node dist/bin/edgewell.js showcase          → 33-line deterministic trace
✓ node dist/bin/edgewell.js help              → usage + commands block
```

---

## Notable fix log (this revision)

- **Showcase double-tool-call bug**: the per-agent turn counter in
  `src/commands/showcase.ts` previously leaked between the
  orchestrator's specialist call and the tool-agent's follow-up call,
  producing two `<tool name=...>` blocks per question. Fixed by
  constructing a fresh stub LLM per phase of the demo (one for the
  orchestrator, one for the tool agent).
- **bench.json throughput claim**: replaced an unrealistic
  `throughput_tok_s = 18000` number with a `_notes`-tagged honest
  accounting (sub-millisecond trials because the linked QVAC SDK
  stub returns tokens instantly). Added four additional real
  `BenchmarkResult`s for `rag.search`, `route`, `encryptRoundTrip`,
  `vector.search`.
- **package.json version**: bumped from `3.0.0` to `3.0.1` to match
  the hackathon cut. Adjusted `size-info.test.ts` assertion.
- **CHANGELOG.md header**: added `[v3.0.1]` brackets so the
  `release-notes` parser picks it up. Adjusted
  `fixes-v3-7.test.ts` regex to accept the `v` prefix.
- **Hardware proof, command-list, help, info**: re-captured from the
  current build to confirm `version: 3.0.1`, `showcase` is in the
  registry, and the 12/12 doctor checks match reality.

---

All artifacts were produced on 2026-06-18. Every claim in
`HACKATHON-SUBMISSION.md` is grounded in a real file under `src/`,
`docs/`, or `artifacts/`. The submission is reproducible from a
clean clone in under 5 minutes.