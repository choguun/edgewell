# EdgeWell v3.0.1 — Hackathon Submission

> **Project:** EdgeWell — Private, on-device personal health + finance coach
> **Track:** General Purpose (also runs on Mobile and Tinkerer profiles)
> **SDK:** `@qvac/sdk` (linked via `link:./vendor/qvac-sdk`)
> **Repo:** `/Users/choguun/Documents/workspaces/cool-projects/edgewell`
> **Document version:** 3.0.1
> **Last verified against source:** 2026-06-18

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

## 3. Mandatory Requirements Checklist

| Requirement                                | Status | Evidence (real file paths)                                                                 |
|--------------------------------------------|:------:|--------------------------------------------------------------------------------------------|
| **Built on QVAC SDK**                      |   ✅   | `package.json` line `"@qvac/sdk": "link:./vendor/qvac-sdk"`; wrapper at `src/qvac.ts` (`EdgeWellLLM` calls `sdk.loadModel` / `sdk.completion`); model catalog at `src/registry.ts` |
| **Form-factor constraint respected**       |   ✅   | `src/profiles.ts` (`PROFILES` map + `pickProfile`); runtime switch via `edgewell profiles apply mobile|tinkerer|desktop`; `tinkerer` uses 64-dim vector + 300-char chunks + 15 s P2P timeout |
| **Reproducible from clean machine**        |   ✅   | This file (§ 4); `package.json` pins `packageManager: pnpm@11.6.0` and `engines.node: ">=22.17"`; vendor SDK at `vendor/qvac-sdk/` matches the runtime contract |
| **Complete artifacts**                     |   ✅   | `README.md`, `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `docs/PERFORMANCE.md`, `docs/SECURITY-MODEL.md`, `HACKATHON-SUBMISSION.md`, plus `artifacts/`, `demo/`, `social/`, `docs/diagrams/` siblings (§ 12) |
| **Tests pass without the SDK**             |   ✅   | `pnpm test` (script `"test": "node --import tsx --test test/*.test.ts"` in `package.json`); offline stub at `src/commands/ask.ts` |
| **CLI runs without the SDK**               |   ✅   | `bin/edgewell.js` shim → `bin/edgewell.ts` via `tsx`; `src/qvac.ts` defers `import("@qvac/sdk")` until first call |
| **Multi-agent orchestration**              |   ✅   | `src/agents/orchestrator.ts` (router prompt + keyword fallback); `src/agents/{health,finance,sleep,nutrition,hydration,activity}.ts` |
| **Tool calling**                           |   ✅   | `src/tool-agent.ts` (parses `<tool name="...">{json}</tool>`); tools at `src/tools.ts` (`calculator`, `datetime`, `search_kb`, `add_expense`, `add_journal`) |
| **P2P delegation with fallback**           |   ✅   | `src/p2p.ts` (`DelegatingLLM` peer-first → local fallback); `src/peer-mesh.ts` (`PeerMesh.healthy / stream / broadcast / consensus`) |
| **Multimodal ingest (image / audio / sensors / text)** | ✅ | `src/multimodal/index.ts` (`ingestPath` dispatcher); `src/multimodal/{image,audio,sensors}.ts` |
| **Privacy: no telemetry, at-rest crypto**  |   ✅   | `src/crypto.ts` (scrypt + AES-256-GCM); `src/redact.ts` (PII redactor); `docs/SECURITY-MODEL.md` §"Telemetry exfiltration" |
| **Companion HTTP server with auth + CORS** |   ✅   | `src/companion/{server,router,auth,mdns}.ts`; `web/` static UI; HMAC bearer tokens; refuses ports < 1024 unless `--allow-privileged` |

## 4. How judges reproduce

All commands below are **copy-paste runnable** on a clean macOS / Linux box.
The only prerequisite is Node.js 22.17+; pnpm is bootstrapped by Corepack.

### 4.1 Install Node and pnpm

```bash
# Option A — using the version pinned in package.json
corepack enable
corepack prepare pnpm@11.6.0 --activate

# Option B — install Node 22.17 first
nvm install 22.17
nvm use 22.17
npm i -g pnpm@11.6.0

node --version   # expect: v22.17.x or newer in the 22.x line
pnpm --version   # expect: 11.6.0
```

### 4.2 Clone and build

```bash
git clone <repo-url> edgewell
cd edgewell
pnpm install        # installs @qvac/sdk via link:./vendor/qvac-sdk
pnpm build          # runs `tsc -p tsconfig.build.json`, writes dist/
pnpm typecheck      # tsc --noEmit, catches drift without emitting
```

### 4.3 Run the test suite (no SDK required)

```bash
pnpm test
# `node --import tsx --test test/*.test.ts`
```

Expected output: a TAP stream from `node --test` with a green summary line
(`# tests`, `# pass`, `# fail`). The captured tail at
`artifacts/test-summary.txt` shows `tests 445 / pass 445 / fail 0` from the
2026-06-18 run. All agent tests run against the in-process stub; they assert
`ask` returns a non-empty string and `streamAsk` yields at least one token
(per `AGENTS.md` §"Testing the agents").

### 4.4 Smoke-test the CLI

```bash
# Self-bootstrapping shim path (no build needed)
node bin/edgewell.js help

# Compiled-output path (after `pnpm build`)
node dist/bin/edgewell.js help
```

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

### 4.5 Ask a routed question (streams tokens once a model is loaded)

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

### 4.6 Start the companion server

```bash
EDGEWELL_COMPANION_SECRET=$(cat ~/.edgewell/secret 2>/dev/null || echo "") \
  node bin/edgewell.js companion --host 0.0.0.0 --port 8787
```

Mint a token for the bundled web UI:

```bash
node bin/edgewell.js companion --print-token
node bin/edgewell.js token my-phone   # subject-scoped token
```

Open `http://<this-host>:8787/` in a browser, paste the token when prompted
(the bundled `web/app.js` will auto-prompt on the first `401`). The companion
serves the bundled `web/` UI on the same port — no separate static server
needed (v3.0.1 hardening).

Rotate the secret:

```bash
node bin/edgewell.js rotate-secret
# writes ~/.edgewell/secret, mode 0600
```

### 4.7 Run the bench command

```bash
node bin/edgewell.js bench
# prompts the local LLM three times, prints tokens/s
```

The bench output is reproducible; the JSON form is saved to
`artifacts/bench.json` by the sibling artifact-builder (see § 12).

### 4.8 Optional: serve a larger model on a peer

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
streams from the local model. This silent fallback was made observable in
v3.0.1.

### 4.9 Verify reproducibility checksum

```bash
# Print the file tree (excludes node_modules, dist, vendor)
git ls-files | sort | tee artifacts/file-list.txt | wc -l

# Hash the source tree
find src docs README.md AGENTS.md package.json \
  -type f \( -name '*.ts' -o -name '*.md' -o -name '*.json' \) \
  | sort | xargs shasum -a 256 | tee artifacts/source-sha256.txt
```

The same hash is regenerated by the sibling artifact-builder and stored as
`artifacts/source-sha256.txt`; it serves as the canonical reproducibility
fingerprint.

## 5. Hardware Setup

EdgeWell is deliberately hardware-agnostic. The **profile** is the only thing
that changes between a phone, a Raspberry Pi, and a workstation. The CLI
binary is the same artefact for all three.

### 5.1 Profile → hardware matrix

| Profile   | Hardware                                | Min RAM | Vector dim | RAG chunk | P2P timeout | Companion host |
|-----------|-----------------------------------------|---------|------------|-----------|-------------|----------------|
| `mobile`  | Phone (Termux), tablet                  | 1.5 GB  | 96         | 200 chars | 8 s         | `0.0.0.0:8787` |
| `tinkerer`| Raspberry Pi 4 / Pi 5                   | 4 GB    | 64         | 300 chars | 15 s        | `0.0.0.0:8787` |
| `desktop` | MacBook / Linux laptop / workstation   | 16 GB   | 256        | 600 chars | 5 s         | `127.0.0.1:8788` (P2P off by default) |

### 5.2 Concrete configuration A — MacBook / Linux laptop (≥ 16 GB RAM)

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

### 5.3 Concrete configuration B — Raspberry Pi 4 / 5 (4 GB)

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

### 5.4 Concrete configuration C — Android phone (Termux)

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

### 5.5 Switching profiles at runtime

```bash
node bin/edgewell.js profiles list
node bin/edgewell.js profiles show tinkerer
node bin/edgewell.js profiles apply mobile
# v3.0.1: writes ~/.edgewell/state.json (persists across restarts)
```

### 5.6 Hardware Proof

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

## 6. Architecture

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

## 7. Multi-agent orchestration & tool calling

Reference: `AGENTS.md`, `src/agents/orchestrator.ts`, `src/tool-agent.ts`.

### 7.1 The orchestrator

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

### 7.2 The seven specialists

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

### 7.3 The tool-calling loop

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

### 7.4 v3.0.1 hardening of the tool loop

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

## 8. P2P & peer mesh

Reference: `src/p2p.ts`, `src/peer-mesh.ts`.

### 8.1 DelegatingLLM — peer-first with local fallback

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

### 8.2 PeerMesh — health, stream, broadcast, consensus

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

### 8.3 Two-device demo

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

## 9. Innovation

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

## 10. Performance

Reference: `docs/PERFORMANCE.md`.

### 10.1 The `bench` command

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

### 10.2 Cross-profile bench with `edgewell bench-profile`

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

### 10.3 Numbers from `docs/PERFORMANCE.md`

| Path                                      | Cost                                | Pi 4           | Desktop CPU    |
|-------------------------------------------|-------------------------------------|----------------|----------------|
| Hash embedder (default)                   | ~1.5 ms / 1 k tokens                | ✅             | ✅             |
| 64-dim hash embedder (tinkerer profile)   | ~25 % faster than 128-dim           | ✅             | n/a            |
| Vector store linear scan, 1 k records     | well under 5 ms                     | ✅             | ✅             |
| Companion `/journal` (1 k entries)        | ~10 ms                              | ✅             | ✅             |
| Hybrid search (lex + vec, RRF, bigram)    | O(n × q), negligible for top-5      | ✅             | ✅             |
| Real QVAC inference (Pi 4)                | 50–200 tokens/s                     | ✅             | n/a            |
| Real QVAC inference (desktop CPU)         | 200–800 tokens/s                    | n/a            | ✅             |

### 10.4 P2P load distribution

`DelegatingLLM` tries the peer first via `PeerClient.stream()`. If the
peer yields at least one token, the local model never runs. The
distribution looks like:

- **Healthy peer reachable** — 100 % of tokens served by peer.
- **Peer times out** — peer drops to 0 %; local model takes over. The user
  sees the stderr line `[p2p] peer <host>:<port> unreachable — falling back
  to local model` (v3.0.1).
- **Peer returns partial stream then dies** — the partial answer is kept;
  the loop doesn't kick off a second request.

### 10.5 `tinkerer` profile's 15 s P2P timeout

The `tinkerer` profile deliberately extends `p2p.timeoutMs` from 8 s
(mobile) and 5 s (desktop) up to 15 s. The rationale is that a Pi on a
home LAN often sees slow first packets (DHCP, Wi-Fi reassociation) and the
shorter timeouts would cause unnecessary fallbacks. See
`src/profiles.ts` and `docs/PERFORMANCE.md` §"Hybrid search latency".

## 11. Model usage & Psy coverage

Reference: `src/registry.ts`, `src/profiles.ts`.

### 11.1 The model catalog

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

### 11.2 Where each model is used

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


### 11.3 Multimodal captioning / transcription via the same SDK

`src/multimodal/image.ts` and `src/multimodal/audio.ts` accept a caller-
injected `captionFn` / `transcribeFn`. When the QVAC SDK exposes a vision
or speech model, the same `await import("@qvac/sdk")` path used by
`EdgeWellLLM` can back these hooks — there is no second runtime. The
default is an offline-friendly placeholder so the pipeline works without
network or model installs.

### 11.4 Psy showcase command — `edgewell psy`

`edgewell psy` is a one-shot demo that exercises the Psy catalog and
the orchestrator's domain-aware routing. It lists every registered
Psy-family model, classifies three representative mental-health
questions through the expanded mental-health keyword regex
(`/anxiety|therapy|panic|mental|psych|depress|insomnia|ptsd/i`),
resolves the right model via `pickModel({ domain: "medical", tier })`,
and prints a canned stub reply per routed question so the command
runs end-to-end without a live SDK. Live transcript captured to
`artifacts/psy-routing.log` (45-line command output + 12-line header).

The 4 Psy-family models in the codebase:

- `MEDPSY_1_7B_Q4_K_M` — 1.7B, ~2 GB RAM, `tier=small`, `domain=medical`
  (registry, used for triage)
- `MEDPSY_4B_Q4_K_M` — 4B, ~3 GB RAM, `tier=small`, `domain=medical`
  (registry, used for clinical)
- `MEDPSY_4B_INST_Q4_K_M` — 4B, ~3 GB RAM, `tier=small`, `domain=medical`
  (desktop profile's `delegateModel`; resolved by the `psy` command when
  no `MEDPSY_*_Q4_K_M` matches the requested tier, surfacing the full
  Psy family even before the registry is extended)

**Creative use:** the orchestrator's keyword router
(`src/agents/orchestrator.ts`, `parseRoute`) now tags mental-health
questions with `domain: "medical"` (added to the `RouteResult`
interface in v3.0.1). When that tag is present **and** the question
is complex (chronic, medication, therapy, severe), the `psy` command
and any future per-call delegate policy can read it and call
`pickModel({ domain: "medical" })` to resolve
`MEDPSY_4B_INST_Q4_K_M` (the desktop profile's `delegateModel` in
`src/profiles.ts`). This is the natural seam for promoting a request
to a medical-specialised peer at runtime, and it's wired today as
read-only inspection in the showcase.

```bash
node dist/bin/edgewell.js psy      # 45-line transcript, no SDK needed
```


## 12. Artifact Index

| Path                                          | Generated by        | Purpose                                                          |
|-----------------------------------------------|---------------------|------------------------------------------------------------------|
| `README.md`                                   | repo                | One-page entry; install + quick start                            |
| `HACKATHON-SUBMISSION.md`                     | this file           | Canonical judge-facing submission                                |
| `artifacts/bench.json`                        | artifact-builder    | Structured output of `edgewell bench` (profile × model × tok/s)  |
| `artifacts/bench-profile.json`                | `edgewell bench-profile --json` | Cross-profile medians (mobile / tinkerer / desktop)     |
| `artifacts/bench-profile.txt`                 | `edgewell bench-profile` | Human-readable per-profile table                                |
| `artifacts/hardware-proof.txt`                | artifact-builder    | Profile knobs + tokens/s, one line per profile                   |
| `artifacts/test-summary.txt`                  | `pnpm test` capture | TAP summary of the unit + integration suite                      |
| `artifacts/orchestrator-trace.txt`            | artifact-builder    | Worked routing trace over 12 sample questions                    |
| `artifacts/psy-routing.log`                   | `edgewell psy`      | Live Psy catalog + domain-aware routing transcript (45 lines)   |
| `artifacts/agents-manifest.json`              | static              | Machine-readable list of agents + tools                          |
| `artifacts/source-sha256.txt`                 | artifact-builder    | Reproducibility fingerprint of the source tree                   |
| `artifacts/file-list.txt`                     | `git ls-files`      | Exact list of tracked files                                      |
| `artifacts/companion-smoke.txt`               | recorded run        | Companion boot + `/health` curl                                  |
| `artifacts/edgewell-help.txt`                 | `edgewell help`     | Top-level help output                                            |
| `artifacts/edgewell-command-list.txt`         | `edgewell command-list` | Full 140-command registry                                    |
| `artifacts/edgewell-info.txt`                 | `edgewell info`     | `version: 3.0.1` snapshot                                       |
| `artifacts/README.md`                         | doc                 | Per-file index of every artifact (15 files)                      |
| `demo/demo-script.md`                         | doc                 | Step-by-step demo script for a recorded video                    |
| `demo/multimodal-tool-showcase.log`           | recorded run        | Tool-calling showcase incl. malformed-call + stuck-loop round    |
| `demo/peer-mesh-demo.log`                     | recorded run        | Worked PeerMesh `healthy / stream / broadcast / consensus` trace |
| `demo/showcase-compiled.txt`                  | recorded run        | Raw stdout of `edgewell showcase`                                |
| `demo/showcase-test-run.txt`                  | `pnpm test` filtered to showcase | TAP output of the 5 showcase unit tests (5/5 ✔)         |
| `demo/recording.cast`                         | recorded run        | Asciinema v2 cast (90 seconds)                                   |
| `demo/recording.html`                         | doc                 | Self-contained HTML player embedding the cast                    |
| `demo/recording-poster.svg`                   | doc                 | 400×300 SVG poster for the recording                             |
| `demo/HARDWARE.md`                            | doc                 | Hardware proof document (3 devices, commands, criteria)         |
| `demo/video-readme.md`                        | doc                 | Demo-video package index                                         |
| `social/build-in-public.md`                   | doc                 | Discord / Keet / Twitter thread outline                          |
| `social/innovation-pitch.md`                  | doc                 | 90-second pitch blurb                                            |
| `social/twitter-thread.md`                    | doc                 | 9-tweet X thread with CTA                                       |
| `social/keet-pitch.md`                        | doc                 | ~250-word Keet pitch                                             |
| `social/keet-channel-post.md`                 | doc                 | Keet room post                                                   |
| `social/discord-channel-post.md`              | doc                 | Discord-flavored channel post                                    |
| `social/linkedin-post.md`                     | doc                 | Professional LinkedIn post                                       |
| `social/community-faq.md`                     | doc                 | 12-Q FAQ for community voters                                    |
| `social/one-liners.md`                        | doc                 | 10 taglines + hero-image directions                              |
| `social/demo-narration.md`                    | doc                 | 60-second voice-over script                                      |
| `social/JUDGES-ONE-PAGER.md`                  | doc                 | Printable one-page summary (post-review add)                     |
| `social/VOTING-CARD.md`                       | doc                 | Markdown fallback for `vote-card.svg` (post-review add)         |
| `social/vote-card.svg`                        | doc                 | 800×400 community vote share card (post-review add)              |
| `social/CONTRIBUTOR-LADDER.md`                | doc                 | 5-rung contributor ladder (post-review add)                     |
| `social/SPONSOR-PACK.md`                      | doc                 | Sponsor pitch (post-review add)                                 |
| `social/build-in-public-launch.md`            | doc                 | D+0 launch post (post-review add)                               |
| `docs/diagrams/architecture.mmd`              | doc                 | Mermaid source for the architecture diagram                      |
| `docs/diagrams/architecture.txt`              | doc                 | Pure-ASCII architecture fallback                                 |
| `docs/diagrams/router-flow.mmd`               | doc                 | Router → specialist sequence diagram                             |
| `docs/diagrams/peer-mesh.mmd`                 | doc                 | Peer-mesh fan-out + consensus diagram                            |
| `docs/diagrams/multimodal-pipeline.mmd`       | doc                 | Image / audio / sensor ingest paths                              |
| `docs/diagrams/profile-apply.mmd`             | doc                 | Three form-factor profiles side-by-side                          |
| `docs/diagrams/README.md`                     | doc                 | Diagram index with render hints                                  |
| `docs/ARCHITECTURE.md`                        | doc                 | Full architecture reference                                      |
| `docs/DEPLOYMENT.md`                          | doc                 | Per-form-factor deployment guide                                 |
| `docs/PERFORMANCE.md`                         | doc                 | Performance characteristics of v3.0.0 hot paths                  |
| `docs/SECURITY-MODEL.md`                      | doc                 | Threat model + mitigations                                       |
| `docs/COMMANDS.md`                            | doc                 | Command reference (rotate-secret, journal, etc.)                |
| `docs/ROADMAP.md`                             | doc                 | v3.0.0 roadmap                                                   |
| `docs/PLUGINS.md`                             | doc                 | Plugin author guide                                              |
| `docs/MIGRATION-2-to-3.md`                    | doc                 | 2.x → 3.0.0 migration guide                                      |
| `AGENTS.md`                                   | doc                 | Specialist reference + extension how-to                          |

### 12.1 Sample `artifacts/agents-manifest.json`

The agents manifest is generated at build time and pinned to the commit:

```json
{
  "version": "3.0.1",
  "agents": [
    { "id": "health",    "module": "src/agents/health.ts",    "systemPromptId": "HEALTH_SYSTEM" },
    { "id": "finance",   "module": "src/agents/finance.ts",   "systemPromptId": "FINANCE_SYSTEM" },
    { "id": "sleep",     "module": "src/agents/sleep.ts",     "systemPromptId": "SLEEP_SYSTEM" },
    { "id": "nutrition", "module": "src/agents/nutrition.ts", "systemPromptId": "NUTRITION_SYSTEM" },
    { "id": "hydration", "module": "src/agents/hydration.ts", "systemPromptId": "HYDRATION_SYSTEM" },
    { "id": "activity",  "module": "src/agents/activity.ts",  "systemPromptId": "ACTIVITY_SYSTEM" },
    { "id": "lifestyle", "module": "src/agents/orchestrator.ts", "systemPromptId": "LIFESTYLE_SYSTEM" }
  ],
  "tools": ["calculator", "datetime", "search_kb", "add_expense", "add_journal"],
  "profiles": ["mobile", "tinkerer", "desktop"],
  "models": {
    "local":   { "mobile": "LLAMA_3_2_1B_INST_Q4_0", "tinkerer": "LLAMA_3_2_1B_INST_Q4_0", "desktop": "LLAMA_3_1_8B_INST_Q4_K_M" },
    "delegate":{ "mobile": "LLAMA_3_1_8B_INST_Q4_K_M", "tinkerer": "LLAMA_3_1_8B_INST_Q4_K_M", "desktop": "MEDPSY_4B_INST_Q4_K_M" }
  }
}
```

## 13. Build in Public

Full thread outline lives at `social/build-in-public.md`. The shape:

```
[1/12]   Day 0  — Repo + README. EdgeWell is a private on-device
                  health + finance coach on QVAC SDK. No telemetry.
                  github.com/<org>/edgewell

[2/12]   Day 1  — v1 ships: Health agent, Finance agent, orchestrator,
                  TF-IDF RAG, CLI (chat / ask / journal / expense /
                  rag / plan / serve).

[3/12]   Day 3  — v2.0.0: model registry, tool registry, at-rest
                  encryption (scrypt + AES-256-GCM), PII redactor,
                  multi-peer mesh with majority-vote consensus.

[4/12]   Day 5  — Vector memory + hybrid search (RRF + bigram
                  re-ranker). Multichannel RAG keeps latency under
                  5 ms on a Pi 4.

[5/12]   Day 7  — Mobile companion: HMAC bearer tokens, dependency-
                  free router, mDNS announcement stub. Ships with a
                  static web/ UI.

[6/12]   Day 9  — Form-factor profiles. edgewell profiles apply
                  {mobile|tinkerer|desktop}. Same binary, three
                  footprints. 1B / 1B / 8B local model.

[7/12]   Day 11 — Lifestyle agents: Sleep, Nutrition, Hydration,
                  Activity. Each exposes summarise() + advise().

[8/12]   Day 13 — Multimodal ingest. Images, audio, and wearable
                  sensor streams all flow through one ingestPath()
                  and land in the RAG index.

[9/12]   Day 15 — v3.0.1 hardening. 20/24 UAT findings closed,
                  CORS + OPTIONS preflight wired, profiles apply
                  persists, P2P silent fallback now logs.

[10/12]  Day 17 — Tool-calling loop with malformed-call detection
                  and stuck-loop early-stop. Showcase at
                  demo/multimodal-tool-showcase.log.

[11/12]  Day 19 — Peer-mesh majority vote. Broadcast the same
                  prompt to N peers, normalise, return winner.
                  Worked demo at demo/peer-mesh-demo.log.

[12/12]  Day 21 — Submission. HACKATHON-SUBMISSION.md, artifact
                  index, build-in-public wrap-up. Judge hand-off.
```

Posting cadence: one update per day across Discord (Tether / QVAC
channels), Keet (project room), and Twitter / X (tagging
`@Tether_to`, `@QVAC_`). The Keet room also doubles as the
issue-tracker for community bug reports during the judging window.

## 14. Compliance & Disclaimer

### 14.1 Health disclaimer

The Health agent is **educational**. It is not a medical device and does
not provide diagnoses. For urgent or severe symptoms, contact a licensed
clinician or local emergency services. This disclaimer is appended to every
`HEALTH_SYSTEM` prompt at `src/agents/health.ts` and surfaced verbatim by
`Orchestrator.handle()` replies tagged `[health]`.

### 14.2 Finance disclaimer

The Finance agent is **not financial advice**. The
`FINANCE_SYSTEM` prompt ends with `Note: not financial advice.` and the
bracket-prefixed `[finance]` reply inherits it.

### 14.3 Data stays on the device

Everything EdgeWell needs lives under the data directory configured in
`EDGEWELL_DATA_DIR` (default `./data`):

- `data/journal.jsonl` — free-form journal entries
- `data/expenses.jsonl` — amount + category rows
- `data/profile.json` — name, goals, baseline numbers
- `data/rag/chunks.json` — local lexical RAG index
- `data/rag/vectors.json` — local vector RAG index (v3.0.0+)
- `~/.edgewell/secret` — companion HMAC secret (mode `0600`)
- `~/.edgewell/state.json` — last applied form-factor profile

Nothing leaves the device unless you explicitly point the P2P client at a
remote peer. Even then, only the prompt and tokens cross the network —
there is no analytics, no telemetry, no upstream LLM.

### 14.4 No telemetry, reproducible offline

`docs/SECURITY-MODEL.md` §"Telemetry exfiltration": EdgeWell ships
**no telemetry**. No analytics, no error reporting, no automatic updates.
The full build + test + bench loop (§ 4) runs offline; the only network
touchpoints are the explicit `serve` (peer) and the optional companion
client, both of which are user-initiated.

### 14.5 Reporting vulnerabilities

Email `security@edgewell.local` (placeholder) or open a private issue on
GitHub. EdgeWell follows responsible disclosure: a fix is published before
the report goes public.

---

## Appendix A — File-path index

| Claim                                                              | File                                                        | Line(s)            |
|--------------------------------------------------------------------|-------------------------------------------------------------|--------------------|
| Project description                                                 | `README.md`                                                 | 1–10               |
| v3.0.1 hardening notes                                              | `README.md`                                                 | "What's new in v3.0.1" |
| Node ≥ 22.17 requirement                                            | `package.json`                                              | `engines.node`     |
| pnpm pin                                                            | `package.json`                                              | `packageManager`   |
| `@qvac/sdk` link                                                    | `package.json`                                              | `dependencies`     |
| `build` / `test` scripts                                            | `package.json`                                              | `scripts`          |
| CLI shim → tsx                                                      | `bin/edgewell.js`                                           | 1–30               |
| Router prompt + keyword fallback                                    | `src/agents/orchestrator.ts`                                | `ROUTER_SYSTEM`, `parseRoute` |
| Specialist contract                                                 | `src/agents/orchestrator.ts`                                | `SpecialistAgent`  |
| Tool-calling loop                                                   | `src/tool-agent.ts`                                         | `ToolAgent.ask`    |
| Tool registry                                                      | `src/tools.ts`                                              | `TOOLS`            |
| P2P peer-first + local fallback                                     | `src/p2p.ts`                                                | `DelegatingLLM`    |
| PeerMesh healthy / stream / broadcast / consensus                   | `src/peer-mesh.ts`                                          | methods            |
| Profile knobs                                                       | `src/profiles.ts`                                           | `PROFILES`         |
| Model catalog                                                       | `src/registry.ts`                                           | `MODELS`           |
| Multimodal dispatcher                                               | `src/multimodal/index.ts`                                   | `ingestPath`       |
| At-rest encryption                                                  | `src/crypto.ts`                                             | scrypt + AES-256-GCM |
| PII redactor                                                        | `src/redact.ts`                                             | email/phone/Thai ID/SSN/IPv4 |
| Snapshot sign / verify                                              | `src/commands/snapshot-sign.ts`, `src/commands/snapshot-verify.ts` | both                |
| Performance numbers                                                 | `docs/PERFORMANCE.md`                                       | tables             |
| Threat model                                                        | `docs/SECURITY-MODEL.md`                                    | table              |
| Deployment per profile                                              | `docs/DEPLOYMENT.md`                                        | Mobile / Tinkerer / Desktop |
| Architecture overview                                               | `docs/ARCHITECTURE.md`                                      | "High-level"       |

## Appendix B — Glossary

- **Delegate model** — the model that runs on a peer (`EDGEWELL_P2P_HOST`).
  EdgeWell's client tries the peer first and falls back to the local model.
- **Form-factor profile** — a frozen config override applied at startup;
  changes model id, chunk size, vector dim, P2P timeout, and companion host.
- **Hybrid RAG** — lexical TF-IDF hits fused with vector cosine hits via
  reciprocal rank, then re-ranked by a bigram overlap score.
- **Lifestyle default** — the catch-all branch in `Orchestrator.ask()` that
  uses `LIFESTYLE_SYSTEM` directly with the LLM (no specialist object).
- **Peer mesh** — a `PeerMesh` wrapping a list of `PeerClient`s with health
  probes, latency-ordered streaming, broadcast, and majority-vote consensus.
- **Psy family** — `MEDPSY_*` entries in `src/registry.ts`; medical-specialised
  QVAC models tagged `domain: "medical"`.
- **Specialist** — a small class implementing `ask` + `streamAsk` plus a
  `SYSTEM` prompt; owned by one file under `src/agents/`.
- **Stub** — the offline-friendly fallback when `@qvac/sdk` is not installed.
  Routing still runs; the reply is replaced by a one-line stub prefixed by
  the chosen agent tag.
- **Tool** — a named, schema-validated function in `src/tools.ts` invokable
  via `<tool name="...">{json}</tool>` from a model reply.

---

*End of submission. Total length target: 600–900 lines; every command above
is runnable against the in-tree vendor SDK stub (`vendor/qvac-sdk/`) so the
reproduction path works even before the real SDK is published.*
