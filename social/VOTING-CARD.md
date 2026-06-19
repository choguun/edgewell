# Vote for EdgeWell v3.0.1

> Copy-paste this card into the Discord thread or Keet room. Three reasons, three commands, three reactions.
## Why we deserve your vote
- **Innovation** — multi-agent orchestrator + tool-calling loop on a Raspberry Pi 4, with peer-mesh majority-vote consensus over plain HTTP (`src/agents/orchestrator.ts`, `src/peer-mesh.ts`).
- **Capabilities** — hybrid TF-IDF + vector RAG with RRF and a bigram re-ranker, multimodal ingest for image / audio / sensor, HMAC-token-gated companion server (`src/hybrid-search.ts`, `src/multimodal/`, `src/companion/`).
- **Model coverage** — `src/registry.ts` ships Llama 1B / 3B / 8B / 70B and the Psy family (`MEDPSY_1_7B`, `MEDPSY_4B`); the `desktop` profile delegates to `MEDPSY_4B_INST_Q4_K_M`.
## How to verify (≤ 5 minutes total)
1. **Clone & test** — `git clone <repo> edgewell && cd edgewell && pnpm install && pnpm test` (expect 445/445 green).
2. **Run showcase** — `node bin/edgewell.js showcase` (3 questions, 3 specialists, all offline).
3. **Inspect bench** — `node bin/edgewell.js bench` (writes `artifacts/bench.json` with profile × model × tokens/s).
## Cast your vote
Reply with **:white_check_mark:** if you reproduced **:heart:** if you'd use it **:rocket:** if you want a v4 with encrypted sync.
## Share this thread
> "Built EdgeWell for #QVAC: 7 specialists, hybrid RAG, peer-mesh consensus — all offline, on commodity HW. `pnpm test` is green in 5 min. github.com/<org>/edgewell"
> "Same TS binary, three form factors: phone (1B), Pi (1B + 64-dim), desktop (8B → MedPsy). Threat model starts from 'network is hostile'. #QVAC #EdgeAI"
> "Day N: hard parts were the tool-loop stuck guard and the silent P2P fallback. v3.0.1 makes both observable. #QVAC"
