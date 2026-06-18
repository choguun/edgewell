# Build-in-Public calendar

> Per-day posting schedule for the evaluation window. All times UTC.
> Each post text is ≤ 280 chars and tagged with the recommended
> channel plus the asset to attach. Use the 12-post outline below
> as the canonical copy — this calendar just decides *when* and
> *where* each one goes.

| Day  | UTC time | Channel(s)        | Asset to attach                                  | Post text (≤ 280 chars)                                                                                                                                              |
|------|----------|-------------------|--------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| D+0  | 18:00    | X, Keet, Discord  | `docs/diagrams/architecture.mmd` rendered diagram | Kickoff. Building EdgeWell for the QVAC hackathon: a private, on-device health + finance coach. TypeScript + QVAC SDK. 1B phone, 8B peer, zero telemetry. #QVAC #EdgeAI |
| D+1  | 14:00    | X, Keet, Discord  | `social/one-liners.md` hero card                 | Built EdgeWell for the QVAC hackathon: 6 specialists, 1 router, 0 cloud. Same TypeScript binary, three form-factor profiles. Private by default. #QVAC #EdgeAI             |
| D+2  | 14:00    | X, Keet           | screenshot of `node bin/edgewell.js doctor` ✔ 12/12 | Day 1 shipped: orchestrator + 6 specialists. `edgewell doctor` returns 12/12 green on a clean clone. Offline stub means tests pass without the SDK. #QVAC #EdgeAI       |
| D+3  | 14:00    | X, LinkedIn       | `docs/diagrams/architecture.mmd` rendered diagram | Day 2: hybrid RAG — TF-IDF + vector cosine + RRF + bigram rerank. Chunks deduped by (source, text) since v3.0.1 so re-ingest is a no-op. #QVAC #EdgeAI                  |
| D+4  | 14:00    | X, Keet, Discord  | `demo/peer-mesh-demo.log` excerpt                | Day 3: peer mesh. healthy() sorts by latency, stream() walks the list, consensus() majority-votes short answers. Same Node `http` server as `serve`. #QVAC #EdgeAI       |
| D+5  | 14:00    | X, Keet           | snippet from `src/tool-agent.ts` stuck-loop guard | Day 4: tool agent hardened. Unclosed `<tool>` tags surface as errors; a stuck loop (same calls + same results as last round) stops early. #QVAC #EdgeAI                  |
| D+7  | 14:00    | X, LinkedIn       | `artifacts/bench.json` profile×tok/s chart       | Mid-week benchmark drop. `edgewell bench` across mobile / tinkerer / desktop profiles. Local 1B is the floor, peer 8B is the ceiling. JSON: `artifacts/bench.json`. #QVAC |
| D+10 | 14:00    | X, Keet, Discord  | link to `HACKATHON-SUBMISSION.md` in repo        | Final push. EdgeWell v3.0.1 ships 7 agents, ~190 CLI subcommands, hybrid RAG, peer mesh, multimodal ingest, companion server, 20/24 UAT findings closed. Vote on Keet! #QVAC |

> Calendar also doubles as the Day-of-Week rotation: Discord/Keet for
> deeper drops (D+0, D+1, D+4, D+5, D+10), X for the headline, LinkedIn
> for the architecture and benchmark days (D+3, D+7). D+0 is the
> pre-evaluation kickoff — published 18:00 UTC the day before the window
> opens so the room is warm when voters arrive.

---

# Build in Public — 12-post Thread Outline

> Copy each numbered block as one post. Add screenshots or shell
> output between them. Tag #QVAC #EdgeAI. Channel tags map to the
> calendar above.

---

**Day 0 — kickoff** *(X, Keet, Discord — D+0 calendar slot)*

1/12 Kicking off my QVAC hackathon build: EdgeWell, a private on-device health + finance coach. Goal: a 1B-param phone model, a peer-mesh for the big questions, and zero telemetry. Repo: github.com/<you>/edgewell. Stack: TypeScript + QVAC SDK. #QVAC #EdgeAI

---

**Day 1 — router** *(X, Keet — D+2 calendar slot)*

2/12 Day 1: orchestrator done. A tiny router prompt asks the model for `{agent, reason}` JSON, and a regex fallback handles the case where the model rambles. 6 specialists + 1 router, all in src/agents/. Tests pass without the SDK. #QVAC #EdgeAI

---

**Day 2 — RAG** *(X, LinkedIn — D+3 calendar slot)*

3/12 Day 2: hybrid RAG. TF-IDF (zero deps) + vector cosine top-k + reciprocal rank fusion + a bigram re-ranker. All offline. v3.0.1 also dedups chunks by (source, text) so re-ingesting a file is a no-op. #QVAC #EdgeAI

---

**Day 3 — peer mesh** *(X, Keet, Discord — D+4 calendar slot)*

4/12 Day 3: peer mesh. healthy() pings every peer in parallel and sorts by latency. stream() walks the list until one yields tokens. consensus() fans the prompt out and majority-votes the short answers. #QVAC #EdgeAI

---

**Day 4 — tool calling** *(X, Keet — D+5 calendar slot)*

5/12 Day 4: tool-calling loop. The agent parses <tool name="">{json}</tool> blocks, runs them, and feeds results back. v3.0.1 catches two bugs: unclosed tags and stuck loops where the model repeats the same call. Both surface as explicit errors now. #QVAC #EdgeAI

---

**Day 5 — multimodal** *(X, Keet — D+5 calendar slot, alt)*

6/12 Day 5: multimodal ingest. ingestPath() dispatches by extension: images, audio, sensor streams, plain text. captionFn / transcribeFn slots are pluggable so the offline placeholder can be swapped for a real QVAC captioner. #QVAC #EdgeAI

---

**Day 6 — profiles** *(X, LinkedIn — D+7 calendar slot, alt)*

7/12 Day 6: form-factor profiles. One binary, three form factors: mobile (1B phone default), tinkerer (Pi 4/5 ≤4 GB), desktop (≥16 GB RAM). `edgewell profiles apply mobile` writes to ~/.edgewell/state.json and persists. #QVAC #EdgeAI

---

**Day 7 — companion** *(X, Keet, Discord — D+4 calendar slot, alt)*

8/12 Day 7: companion HTTP server. /chat, /journal, /expenses, /profile, /health. HMAC bearer tokens, OPTIONS 204 preflight, bundled web/ UI served from the same port. v3.0.1 added the 401-token prompt to web/app.js. #QVAC #EdgeAI

---

**Day 8 — security** *(X, LinkedIn — D+7 calendar slot, alt)*

9/12 Day 8: security pass. At-rest: scrypt + AES-256-GCM (src/crypto.ts). Egress: redactor scrubs emails, phones, Thai IDs, SSNs, IPv4, URL creds, long digit runs (src/redact.ts). Threat model in docs/SECURITY-MODEL.md starts from "network is hostile". #QVAC #EdgeAI

---

**Day 9 — bench** *(X, LinkedIn — D+7 calendar slot)*

10/12 Day 9: benchmarks. Bench and bench-compare subcommands track p50/p95 latency across router, RAG, tool agent, and end-to-end ask. The 1B phone model is the floor; the 8B peer is the ceiling. Numbers tomorrow. #QVAC #EdgeAI

---

**Day 10 — submission** *(X, Keet, Discord — D+10 calendar slot)*

11/12 Day 10: submitted. EdgeWell v3.0.1 ships 7 agents, ~190 CLI subcommands, hybrid RAG, peer mesh with consensus, multimodal ingest, companion server, and 20 of 24 UAT findings closed. Demo: doctor, ask, companion --print-token. #QVAC #EdgeAI

---

**Day 11 — ask** *(X, Keet — D+10 calendar slot, follow-up)*

12/12 Day 11: ask me anything. What would you change about a local-first AI coach? What would make you trust it with your journal? Reply or DM — I will fold the best three into v3.0.2. #QVAC #EdgeAI
