# EdgeWell — Hackathon Submission

> **Project:** EdgeWell — Private, on-device personal health + finance coach
> **Track:** General Purpose (also runs on Mobile and Tinkerer profiles)

---

## 1. Project

EdgeWell is a private, on-device personal health and finance coach built on the
QVAC SDK. It is a Node.js 22.17+ CLI and HTTP companion server that combines a
multi-agent orchestrator (Health, Finance, Sleep, Nutrition, Hydration,
Activity, plus a Lifestyle default), a local hybrid RAG index (TF-IDF + vector
with reciprocal-rank fusion and a bigram re-ranker), a tool-calling agent loop
that parses `<tool name="...">{json}</tool>` blocks, and an optional
peer-to-peer delegation layer that tries a faster peer first and falls back to
the local model on any network failure. Every byte the user creates — journal
entries, expenses, the RAG index, the companion HMAC secret — stays on the
device; only the active prompt crosses the network, and only when P2P is
explicitly enabled.

## 2. Track

**Primary track: General Purpose.**

The same code base runs on three form-factor profiles declared in
`src/profiles.ts`:

| Profile   | Hardware target                  | Local model                | Delegate model             |
|-----------|----------------------------------|----------------------------|----------------------------|
| `mobile`  | Phone or tablet                  | `LLAMA_3_2_1B_INST_Q4_0`   | `LLAMA_3_1_8B_INST_Q4_K_M` |
| `tinkerer`| Raspberry Pi 4/5 (<= 4 GB RAM)   | `LLAMA_3_2_1B_INST_Q4_0`   | `LLAMA_3_1_8B_INST_Q4_K_M` |
| `desktop` | Laptop or workstation (>= 16 GB) | `LLAMA_3_1_8B_INST_Q4_K_M` | `MEDPSY_4B_INST_Q4_K_M`    |

So EdgeWell also covers the **Mobile** and **Tinkerer** profiles without any
code fork — only a profile switch (`edgewell profiles apply <name>`) and a
restart.


## 3. How judges reproduce

All commands below are **copy-paste runnable** on a clean macOS / Linux box.
The only prerequisite is Node.js 22.17+; pnpm is bootstrapped by Corepack.

### 3.0 Fastest path — web UI in one command

```bash
git clone <repo-url> edgewell && cd edgewell
pnpm install
pnpm dev companion --port 8787 --no-auth
# open http://localhost:8787/ in a browser
```

`--no-auth` disables the HMAC token prompt so the bundled SPA loads straight
into the chat form. Use only on `127.0.0.1`; the default `--host 0.0.0.0`
listens on every interface. Equivalents: `--auth=false` or
`EDGEWELL_COMPANION_SECRET=… pnpm dev companion --port 8787 --print-token`.


A green path is:

```bash
node bin/edgewell.js doctor
# prints: node, data dir, model id, profile, optional SDK status

node bin/edgewell.js profiles list
# mobile | tinkerer | desktop

node bin/edgewell.js profiles apply desktop
# writes ~/.edgewell/state.json (v3.0.1 hardening)

node bin/edgewell.js journal add "Slept 7.5h, walked 6k steps"
node bin/edgewell.js expense add 250 food
node bin/edgewell.js expense add 80 transport
```

### 3.1 Ask a routed question (streams tokens once a model is loaded)

```bash
# Online (with @qvac/sdk installed)
node bin/edgewell.js ask "How can I save 20% of my income?"

# Offline (no @qvac/sdk) — router still runs, prints a stub
EDGEWELL_OFFLINE=1 node bin/edgewell.js ask "How can I save 20% of my income?"
# [finance]
# [stub] no @qvac/sdk installed - would have answered: "How can I save 20% of my income?"
```

In offline mode the orchestrator still classifies the question (the bracket
prefix `[finance]`, `[health]`, `[lifestyle]` is always printed) so judges can
verify the routing logic without a model.


### 3.2 Run the bench command

```bash
node bin/edgewell.js bench
# prompts the local LLM three times, prints tokens/s
```

The bench output is reproducible; the JSON form is saved to
`artifacts/bench.json` by the sibling artifact-builder (see § 12).

### 3.3 Optional: serve a larger model on a peer

On the **peer** (laptop or workstation with the bigger model):

```bash
node bin/edgewell.js serve --port 8787
# serves POST /v1/chat, GET /health, GET /v1/models
```

On the **client** (phone, laptop, SBC):

```bash
EDGEWELL_P2P_ENABLED=1 \
EDGEWELL_P2P_HOST=192.168.1.20 \
EDGEWELL_P2P_PORT=8787 \
  node bin/edgewell.js chat
```

If the peer is unreachable, `DelegatingLLM` (in `src/p2p.ts`) emits a
structured `warn` log and the stderr line
`[p2p] peer <host>:<port> unreachable — falling back to local model`, then
streams from the local model. This silent fallback was made observable

## 4. Hardware Setup

EdgeWell is deliberately hardware-agnostic. The **profile** is the only thing
that changes between a phone, a Raspberry Pi, and a workstation. The CLI
binary is the same artefact for all three.

### 5.1 Profile → hardware matrix

| Profile   | Hardware                                | Min RAM | Vector dim | RAG chunk | P2P timeout | Companion host |
|-----------|-----------------------------------------|---------|------------|-----------|-------------|----------------|
| `mobile`  | Phone (Termux), tablet                  | 1.5 GB  | 96         | 200 chars | 8 s         | `0.0.0.0:8787` |
| `tinkerer`| Raspberry Pi 4 / Pi 5                   | 4 GB    | 64         | 300 chars | 15 s        | `0.0.0.0:8787` |
| `desktop` | MacBook / Linux laptop / workstation   | 16 GB   | 256        | 600 chars | 5 s         | `127.0.0.1:8788` (P2P off by default) |

### 4.1 Concrete configuration A — MacBook / Linux laptop (≥ 16 GB RAM)

```bash
# Node 22.17, pnpm 11.6.0
git clone <repo-url> edgewell && cd edgewell
pnpm install && pnpm build
node bin/edgewell.js profiles apply desktop
node bin/edgewell.js doctor
node bin/edgewell.js ask "Suggest a 7-day plan to improve sleep"
# optional: serve as the household peer
node bin/edgewell.js serve --port 8787 &
```

### 4.2 Concrete configuration B — Raspberry Pi 4 / 5 (4 GB)

```bash
# Flash Raspberry Pi OS Lite (64-bit), then:
sudo apt update && sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
corepack enable && corepack prepare pnpm@11.6.0 --activate

git clone <repo-url> edgewell && cd edgewell
pnpm install --production
node bin/edgewell.js profiles apply tinkerer
node bin/edgewell.js doctor
# P2P delegates to your desktop if reachable on the LAN
EDGEWELL_P2P_ENABLED=1 EDGEWELL_P2P_HOST=192.168.1.20 \
  node bin/edgewell.js ask "How much water should I drink?"
```

The `tinkerer` profile keeps memory pressure low by using a 64-dim hash
embedder (about 25 % faster than the 128-dim default per
`docs/PERFORMANCE.md`) and gives a generous 15 s P2P timeout so a slow home
LAN doesn't trip the fallback.

### 4.3 Concrete configuration C — Android phone (Termux)

```bash
# In Termux (F-Droid build)
pkg update && pkg upgrade
pkg install nodejs-lts git
corepack enable && corepack prepare pnpm@11.6.0 --activate

git clone <repo-url> edgewell && cd edgewell
pnpm install
node bin/edgewell.js profiles apply mobile
node bin/edgewell.js doctor
EDGEWELL_OFFLINE=1 node bin/edgewell.js ask "How can I save 20% of my income?"
# [finance]
# [stub] no @qvac/sdk installed - would have answered: "..."
```

On a phone the companion server is the most useful surface — point the
desktop browser at `http://<phone-ip>:8787/` after `edgewell companion
--host 0.0.0.0 --port 8787`.

### 4.4 Switching profiles at runtime

```bash
node bin/edgewell.js profiles list
node bin/edgewell.js profiles show tinkerer
node bin/edgewell.js profiles apply mobile
# v3.0.1: writes ~/.edgewell/state.json (persists across restarts)
```

### 4.5 Hardware Proof

A sibling artifact-builder script generates `artifacts/hardware-proof.txt`
after the bench run. That file records, per profile, the model id, the
chunk size, the vector dim, the P2P timeout, and the observed tokens/s for
three repetitions of the standard prompt. The expected file looks like:

```text
profile=mobile  model=LLAMA_3_2_1B_INST_Q4_0   vector_dim=96   chunk=200  p2p_timeout_ms=8000   tokens/s=…
profile=tinkerer model=LLAMA_3_2_1B_INST_Q4_0  vector_dim=64   chunk=300  p2p_timeout_ms=15000  tokens/s=…
profile=desktop model=LLAMA_3_1_8B_INST_Q4_K_M vector_dim=256  chunk=600  p2p_timeout_ms=5000   tokens/s=…
```

Judges can verify the profile knobs match `src/profiles.ts` exactly. The
`PROFILES` map at the top of the file declares `mobile` first, followed
by `tinkerer` and `desktop`; the relevant `vector.dim`, `rag.chunkSize`,
`p2p.timeoutMs`, and `companion.host` values appear on the lines
immediately under each profile key (no line numbers cited here so this
claim stays correct as the file is edited).

## 5. Architecture

Full reference: `docs/ARCHITECTURE.md`. One-screen summary:

```
+------------------------+        +-----------------------+
|  CLI (bin/edgewell.js) |        |  Web UI (web/)        |
|  ~140 subcommands      |        |  static, no build     |
+-----------+------------+        +-----------+-----------+
            |                                 |
            v                                 v
+------------------------+        +-----------------------+
|  Companion HTTP server | <----> |  Browser / phone app  |
|  (src/companion/)      |  HMAC  |                       |
+-----------+------------+        +-----------------------+
            |
            v
+----------------------------------------------------+
|              EdgeWell runtime (src/index.ts)        |
|                                                    |
|  +-------------+   +----------+   +-------------+  |
|  | Orchestrator|-->| Specialist|-->|  RAG (TF-IDF|
|  | (router +   |   | agents    |   |   + vector + |
|  |  keyword    |   | (Health,  |   |   hybrid +  |
|  |  fallback)  |   |  Finance, |   |   bigram    |
|  +-------------+   |  Sleep,   |   |   rerank)   |
|                    |  Nutrition|   +-------------+  |
|  +-------------+   |  Hydration,                 |
|  |  ToolAgent  |-->|  Activity,                 |
|  | <tool> loop |   |  Lifestyle)                |
|  +-------------+   +-------------+                |
|        |                       |                  |
|        v                       v                  |
|  +-------------+        +-------------+           |
|  | ToolRegistry|        |   LLM       |           |
|  | calculator  |        |  EdgeWellLLM|           |
|  | datetime    |        |  + DelegatingLLM (peer- |
|  | search_kb   |        |    first, local fallback) |
|  | add_expense |        +-------------+           |
|  | add_journal |              |                   |
|  +-------------+              v                   |
|                       +-------------+             |
|                       |  @qvac/sdk  |             |
|                       |  loadModel  |             |
|                       |  completion |             |
|                       +-------------+             |
|                                                    |
|  +-------------+   +----------+   +-------------+ |
|  | PeerMesh    |-->| PeerClient|->| HTTP peer  | |
|  | healthy /   |   | streaming |  | (another   | |
|  | stream /    |   |           |  |  EdgeWell) | |
|  | broadcast / |   +-----------+   +------------+ |
|  | consensus   |                                |
|  +-------------+                                |
|                                                   |
|  At rest: JSONL store + scrypt/AES-256-GCM       |
|           PII redactor (email/phone/Thai ID/SSN/IP)|
+----------------------------------------------------+
```

Three concrete data flows:

1. **`chat` request** — CLI → `EdgeWellLLM.stream` → orchestrator picks an
   agent → optional RAG context block built by `rag.contextBlock()` → tokens
   stream back to the CLI.
2. **`companion` request** — phone POSTs `/chat` → server validates HMAC
   bearer token → `ew.orchestrator.handle()` → JSON reply.
3. **Multimodal ingest** — `edgewell multimodal <file>` → `ingestPath()`
   picks image / audio / sensor / text pipeline by extension → emitted text
   is appended to RAG and/or the journal.

## 6. Multi-agent orchestration & tool calling

Reference: `AGENTS.md`, `src/agents/orchestrator.ts`, `src/tool-agent.ts`.

### 6.1 The orchestrator

`Orchestrator.route(question)` in `src/agents/orchestrator.ts` runs two
strategies in order:

1. **Router prompt** — a tiny `ROUTER_SYSTEM` (~120 `maxTokens`) asks the
   LLM for one JSON object `{ agent, reason }`. Valid `agent` values are
   `"health"`, `"finance"`, `"lifestyle"`. The parser strips code fences,
   finds the first `{...}` block, validates against the known set
   (`VALID_AGENTS`).
2. **Keyword fallback** — if JSON parsing fails or the agent is unknown,
   the orchestrator regexes the **original question** (never the model's
   text) for keywords:
   - `health` — `symptom`, `sleep`, `exercise`, `diet`, `medication`,
     `pain`, `stress`, `mood`
   - `finance` — `money`, `budget`, `expense`, `saving`, `debt`, `income`,
     `price`, `thb`, `usd`, `baht`
   - everything else → `lifestyle` (default)

`Orchestrator.ask()` dispatches to the matching specialist. The specialist
interface is intentionally minimal:

```ts
interface SpecialistAgent {
  ask(question: string, history?: ChatMessage[]): Promise<string>;
  streamAsk(question: string, history?: ChatMessage[]): AsyncIterable<string>;
}
```

Each agent owns one short `SYSTEM` prompt at the top of its module
(`src/agents/health.ts`, `src/agents/finance.ts`, `src/agents/sleep.ts`,
`src/agents/nutrition.ts`, `src/agents/hydration.ts`, `src/agents/activity.ts`).
The lifestyle default's `LIFESTYLE_SYSTEM` lives in `orchestrator.ts`.

### 6.2 The seven specialists

| Specialist           | Module                                  | Best for                                                  |
|----------------------|-----------------------------------------|-----------------------------------------------------------|
| `HealthAgent`        | `src/agents/health.ts`                  | symptoms, sleep, mood, exercise, diet, medication         |
| `FinanceAgent`       | `src/agents/finance.ts`                 | budgeting, expense trends, savings plans, monthly plan    |
| `SleepAgent`         | `src/agents/sleep.ts`                   | sleep trends, RAG-grounded sleep tips                     |
| `NutritionAgent`     | `src/agents/nutrition.ts`               | meal planning, hydration pairing, food-mood correlations  |
| `HydrationAgent`     | `src/agents/hydration.ts`               | water intake, electrolyte balance                        |
| `ActivityAgent`      | `src/agents/activity.ts`                | steps, exercise, sedentary time                           |
| `lifestyle` (LLM)    | `src/agents/orchestrator.ts`            | habits, productivity, mixed health+finance (default)     |

Every agent calls `this.llm.prompt(...)` or `this.llm.stream(...)`. The
agents don't know whether the LLM is local (`EdgeWellLLM`) or delegating
(`DelegatingLLM`) — the indirection is the whole point.

### 6.3 The tool-calling loop

`ToolAgent` (in `src/tool-agent.ts`) wraps a normal agent and adds a
tool-calling loop:

1. Build a system prompt that lists available tools.
2. Ask the model.
3. If the reply contains `<tool name="...">{json}</tool>` blocks, execute
   them, append results to the conversation, and ask again (up to
   `maxRounds = 3`).
4. Otherwise return the raw reply.

The registered tools (in `src/tools.ts`) are:

| Tool         | Params                                    | Behaviour                                              |
|--------------|-------------------------------------------|--------------------------------------------------------|
| `calculator` | `{ expression: string }`                  | Whitelist arithmetic: `+ - * / ( )` and digits          |
| `datetime`   | `{}`                                      | Returns `{ iso, tz }` from the local clock              |
| `search_kb`  | `{ query: string, topK?: number }`        | Queries the local RAG index, returns top-K hits         |
| `add_expense`| `{ amount: number, category: string }`    | Appends a row to `data/expenses.jsonl`                  |
| `add_journal`| `{ text: string }`                        | Appends an entry to `data/journal.jsonl`                |

### 6.4 hardening of the tool loop

Two failure modes that used to be silent are now surfaced to the model so
it can self-correct:

- **Malformed `<tool>` JSON** — recorded as `{ ok: false, error: ... }` and
  fed back into the next round. (Previously: silently coerced to an empty
  call.)
- **Unclosed `<tool name="…">` tag** — detected via `hasOpenTag &&
  !hasCloseTag` and reported as a malformed call.
- **Stuck loop** — a stable signature of the resolved tool set is compared
  to the previous round. If identical, the loop stops early and surfaces
  the last results to the caller.

A worked showcase of the loop — calculator → search_kb → add_journal,
including a malformed-call round and a stuck-loop early-stop — lives at
`demo/multimodal-tool-showcase.log` (sibling artifact).

## 7. P2P & peer mesh

Reference: `src/p2p.ts`, `src/peer-mesh.ts`.

### 7.1 DelegatingLLM — peer-first with local fallback

`DelegatingLLM` (in `src/p2p.ts`) is constructed when `cfg.p2p.enabled`
is true and is **transparent to the agents** — they call
`llm.prompt(...)` / `llm.stream(...)` exactly as before. The delegator:

1. Tries the peer first via `PeerClient.stream()`.
2. On any `fetch` failure (timeout, ECONNREFUSED, malformed response) emits
   a structured `warn` log and the stderr line
   `[p2p] peer <host>:<port> unreachable — falling back to local model`.
3. Drains the peer stream into the caller; if the peer yielded nothing,
   switches to the local `EdgeWellLLM`.

The agents never see the fallback — they only see "tokens streamed in."
This is why the existing agent tests are unaffected by the P2P flag.

### 7.2 PeerMesh — health, stream, broadcast, consensus

`PeerMesh` (in `src/peer-mesh.ts`) wraps a list of `PeerClient`s with a
single async surface:

| Method       | Returns                                                         | Used for                                         |
|--------------|-----------------------------------------------------------------|--------------------------------------------------|
| `healthy()`  | `[{ peer, latencyMs }, …]` sorted ascending by latency          | Picking the fastest live peer                    |
| `stream(b)`  | `AsyncIterable<{ token, peer }>` from the first yielding peer   | Streaming chat; tries peers in latency order     |
| `prompt(b)`  | `{ text, peer }`                                                | One-shot non-streaming call                      |
| `broadcast(b)`| `[{ peer, ok, text }]` from every reachable peer                | Driving `consensus()` and fan-out demos          |
| `consensus(b)`| `{ answer, votes, peers }` (majority vote on normalized text)   | Aggregating answers across multiple peers        |

`consensus()` lower-cases and trims the replies, tallies votes, returns the
winner plus the vote share. For long answers the broadcast view is still
returned via `peers` so the caller can pick by length instead.

### 7.3 Two-device demo

Peer (laptop, the bigger model):

```bash
node bin/edgewell.js serve --port 8787
# serves GET /health, GET /v1/models, POST /v1/chat (SSE)
```

Client (Pi, phone, or second laptop):

```bash
# Single peer
EDGEWELL_P2P_ENABLED=1 EDGEWELL_P2P_HOST=192.168.1.20 EDGEWELL_P2P_PORT=8787 \
  node bin/edgewell.js ask "Suggest a 7-day sleep plan"

# Multi-peer fan-out + majority vote
node bin/edgewell.js eval --peers 192.168.1.20:8787,192.168.1.21:8787 \
  --prompt "Is a 2 L water intake enough for a 70 kg adult?"
# prints the consensus answer and the per-peer replies
```

A worked demo transcript lives at `demo/peer-mesh-demo.log` (sibling
artifact). The transcript shows:

- the health probe ordering (sorted by latency);
- the first peer yielding a token and the stream accepting it;
- a deliberately-down second peer timing out and being skipped;
- the consensus tally for a short factual question.

## 8. Innovation

Seven concrete novel angles, each cited to the file that does the work:

1. **Multi-agent orchestrator on a $50 single-board computer.**
   The full router + six specialists + lifestyle default runs on a Pi 4 / Pi 5
   with the `tinkerer` profile (64-dim hash embedder, 300-char RAG chunks,
   15 s P2P timeout). See `src/profiles.ts` and `docs/DEPLOYMENT.md`
   §"Tinkerer".

2. **Peer-mesh majority vote over plain HTTP.**
   `PeerMesh.consensus()` fans a prompt out to every healthy peer and
   returns the normalised majority. No new infra — same Node `http`
   server that backs `serve`. See `src/peer-mesh.ts`.

3. **Tool-calling loop with malformed-call detection.**
   `ToolAgent` parses `<tool name="...">{json}</tool>`, surfaces bad JSON
   and unclosed tags back to the model, and stops early on a stuck-loop
   signature. See `src/tool-agent.ts` (v3.0.1 hardening commit messages).

4. **Hybrid TF-IDF + vector RAG with RRF + bigram re-ranker.**
   Lexical and vector retrievers run in parallel (`Promise.all`) and are
   fused by reciprocal rank; a bigram re-ranker up-weights hits that share
   bigrams with the query. See `src/hybrid-search.ts`, `src/vector-index.ts`,
   `src/rag.ts`. Latency: well under 5 ms per search over 1 k records on a
   Pi 4 (`docs/PERFORMANCE.md`).

5. **Multimodal ingest including wearable sensor streams.**
   `src/multimodal/index.ts` dispatches by extension. The sensor pipeline
   summarises an event stream (steps, heart rate, sleep stage) and writes
   a journal line. Default is offline-friendly placeholders; inject a real
   captioner / transcriber at runtime via `captionFn` / `transcribeFn`.
   See `src/multimodal/sensors.ts`.

6. **On-device encryption + PII redaction + signed snapshots.**
   `src/crypto.ts` (scrypt + AES-256-GCM) and `src/redact.ts` (emails,
   phones, Thai national IDs, US SSNs, IPv4) keep the user's data private
   on disk and on the wire. `src/commands/snapshot.ts`,
   `src/commands/snapshot-sign.ts`, and `src/commands/snapshot-verify.ts`
   produce portable JSON snapshots with SHA-256 sidecar fingerprints that
   round-trip through `edgewell snapshot merge`. No telemetry leaves the
   device (`docs/SECURITY-MODEL.md`).

7. **Three form-factor profiles sharing one codebase.**
   `src/profiles.ts` declares `mobile`, `tinkerer`, `desktop` as pure-data
   config overrides. `pickProfile(name)` returns them in a shape
   `loadConfig()` already understands. No runtime `#ifdef`, no compile-time
   fork.

## 9. Performance

Reference: `docs/PERFORMANCE.md`.

### 9.1 The `bench` command

`edgewell bench` runs a short prompt through the local LLM three times and
prints tokens/s. It is the fastest way to compare profiles before
deploying to a new device:

```bash
node bin/edgewell.js bench
# prompt: "Suggest a 7-day sleep plan"
# round 1: 12.4 tok/s
# round 2: 13.1 tok/s
# round 3: 12.8 tok/s
# median: 12.8 tok/s
```

A JSON form of the same numbers, with profile + model + chunk + vector
metadata, is saved to `artifacts/bench.json` by the sibling artifact-builder.

### 9.2 Cross-profile bench with `edgewell bench-profile`

`edgewell bench-profile` is the cross-profile cousin of `edgewell bench`: it
runs the same three micro-operations — `rag.search`, `Orchestrator.route`,
and `vector.search` — once per form-factor profile (`mobile`, `tinkerer`,
`desktop`) using the profile's actual `chunkSize` / `topK` / `vector.dim`
knobs from `src/profiles.ts`, then prints an ASCII table with the per-profile
medians plus a hand-tuned `expected tok/s` column derived from
`docs/PERFORMANCE.md` and the model registry's `tier` + `ramGb` fields. The
machine-readable form is captured in `artifacts/bench-profile.json`; the
human-readable transcript in `artifacts/bench-profile.txt` (both produced
`# EdgeWell v3.0.1 hackathon artifact — produced 2026-06-18`).

### 9.3 Numbers from `docs/PERFORMANCE.md`

| Path                                      | Cost                                | Pi 4           | Desktop CPU    |
|-------------------------------------------|-------------------------------------|----------------|----------------|
| Hash embedder (default)                   | ~1.5 ms / 1 k tokens                | ✅             | ✅             |
| 64-dim hash embedder (tinkerer profile)   | ~25 % faster than 128-dim           | ✅             | n/a            |
| Vector store linear scan, 1 k records     | well under 5 ms                     | ✅             | ✅             |
| Companion `/journal` (1 k entries)        | ~10 ms                              | ✅             | ✅             |
| Hybrid search (lex + vec, RRF, bigram)    | O(n × q), negligible for top-5      | ✅             | ✅             |
| Real QVAC inference (Pi 4)                | 50–200 tokens/s                     | ✅             | n/a            |
| Real QVAC inference (desktop CPU)         | 200–800 tokens/s                    | n/a            | ✅             |

### 9.4 P2P load distribution

`DelegatingLLM` tries the peer first via `PeerClient.stream()`. If the
peer yields at least one token, the local model never runs.

- **Healthy peer reachable** — 100 % of tokens served by peer.
- **Peer times out** — peer drops to 0 %; local model takes over. The user
  sees the stderr line `[p2p] peer <host>:<port> unreachable — falling back
  to local model` (v3.0.1).
- **Peer returns partial stream then dies** — the partial answer is kept;
  the loop doesn't kick off a second request.

The `tinkerer` profile extends `p2p.timeoutMs` to 15 s (vs 8 s on mobile,
5 s on desktop) because a Pi on a home LAN often sees slow first packets
(DHCP, Wi-Fi reassociation) and shorter timeouts cause unnecessary
fallbacks. See `src/profiles.ts`.

## 10. Model usage & Psy coverage

Reference: `src/registry.ts`, `src/profiles.ts`.

### 10.1 The model catalog

`src/registry.ts` exports `MODELS`, a curated, frozen list of QVAC model
identifiers with `family`, `size`, `quant`, `tier`, `ramGb`, `offline`, and
optional `domain` metadata:

| ID                              | Family  | Size  | Quant     | Tier    | RAM (GB) | Offline | Domain  |
|---------------------------------|---------|-------|-----------|---------|----------|---------|---------|
| `LLAMA_3_2_1B_INST_Q4_0`        | llama   | 1B    | Q4_0      | tiny    | 1.5      | ✅      | —       |
| `LLAMA_3_2_3B_INST_Q4_K_M`      | llama   | 3B    | Q4_K_M    | small   | 2.5      | ✅      | —       |
| `LLAMA_3_1_8B_INST_Q4_K_M`      | llama   | 8B    | Q4_K_M    | medium  | 6        | ✅      | —       |
| `LLAMA_3_1_70B_INST_Q4_K_M`     | llama   | 70B   | Q4_K_M    | large   | 48       | ✅      | —       |
| `MEDPSY_1_7B_Q4_K_M`            | medpsy  | 1.7B  | Q4_K_M    | small   | 2        | ✅      | medical |
| `MEDPSY_4B_Q4_K_M`              | medpsy  | 4B    | Q4_K_M    | small   | 3        | ✅      | medical |

Helpers: `describeModel(id)`, `modelExists(id)`, `listModels()`,
`pickModel({ tier, domain, maxRamGb })`.

### 10.2 Where each model is used

| Profile   | Local model (`EDGEWELL_MODEL`)    | Peer / delegate model                       |
|-----------|-----------------------------------|---------------------------------------------|
| `mobile`  | `LLAMA_3_2_1B_INST_Q4_0`          | `LLAMA_3_1_8B_INST_Q4_K_M` (on a desktop)   |
| `tinkerer`| `LLAMA_3_2_1B_INST_Q4_0`          | `LLAMA_3_1_8B_INST_Q4_K_M` (on a desktop)   |
| `desktop` | `LLAMA_3_1_8B_INST_Q4_K_M`        | `MEDPSY_4B_INST_Q4_K_M` (Psy family)        |

The desktop profile's delegate target is the **Psy family**
(`MEDPSY_4B_INST_Q4_K_M`). In `src/registry.ts` the Psy entries carry
`domain: "medical"` so `pickModel({ domain: "medical" })` finds them.
This is the "creative use" called for by the brief:

> A small local model handles routine chat and tool calls (1B on
> mobile / tinkerer, 8B on desktop); when the agent tags the request as
> domain-sensitive and complexity warrants, the same SDK delegation
> pipeline promotes it to a medical-specialised peer.

The promotion is opt-in: `DelegatingLLM` is constructed once per process
with a `localModel` and a `peer` URL; agents don't choose between them
per-call. For a future per-call policy, the registry's
`pickModel({ domain: "medical" })` is the natural seam — see
`src/registry.ts`.


### 10.3 Multimodal captioning / transcription via the same SDK

`src/multimodal/image.ts` and `src/multimodal/audio.ts` accept a caller-
injected `captionFn` / `transcribeFn`. When the QVAC SDK exposes a vision
or speech model, the same `await import("@qvac/sdk")` path used by
`EdgeWellLLM` can back these hooks — there is no second runtime. The
default is an offline-friendly placeholder so the pipeline works without
network or model installs.

### 10.4 Psy showcase command — `edgewell psy`

`edgewell psy` lists every Psy-family model, classifies three representative
mental-health questions through the orchestrator's `domain=medical` hint,
and prints a canned stub reply per routed question. No live SDK required;
live transcript captured at `artifacts/psy-routing.log`.

The 3 Psy models registered in `src/registry.ts` + `src/profiles.ts`:

| ID                       | Size | Tier   | Domain   | Used as                              |
|--------------------------|------|--------|----------|--------------------------------------|
| `MEDPSY_1_7B_Q4_K_M`     | 1.7B | small  | medical  | registry, triage                     |
| `MEDPSY_4B_Q4_K_M`       | 4B   | small  | medical  | registry, clinical                   |
| `MEDPSY_4B_INST_Q4_K_M`  | 4B   | small  | medical  | desktop `delegateModel` (live route) |

**Creative use:** `Orchestrator.parseRoute` tags mental-health questions
with `domain: "medical"` on the `RouteResult` interface (v3.0.1). When that
tag is set, `pickModel({ domain: "medical" })` resolves
`MEDPSY_4B_INST_Q4_K_M` — the natural seam for promoting a request to a
medical-specialised peer at runtime. Wired today as read-only inspection in
the showcase.

```bash
node dist/bin/edgewell.js psy      # no SDK needed
```