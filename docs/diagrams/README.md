# EdgeWell v3.0.1 — Diagrams

Architecture and flow diagrams for the EdgeWell multi-agent stack.
Each `.mmd` file is hand-written Mermaid, sourced from the actual
modules and checked against the source for accuracy. The `.txt`
file is a pure-ASCII fallback that renders correctly in any
terminal.

## Index

| File | Type | One-line description |
|------|------|----------------------|
| [`architecture.mmd`](./architecture.mmd) | Mermaid `flowchart TB` | One-page system view: User → CLI/Companion/Web UI → Orchestrator → Specialists → RAG/Tools → DelegatingLLM (peer mesh, local fallback) + Profiles + Security |
| [`router-flow.mmd`](./router-flow.mmd) | Mermaid `sequenceDiagram` | Router-LLM call (maxTokens=120, temp=0) → parseRoute → keyword fallback → HealthAgent → RAG → optional ToolAgent loop with `search_kb` |
| [`peer-mesh.mmd`](./peer-mesh.mmd) | Mermaid `flowchart LR` | `DelegatingLLM` → `PeerMesh.healthy()` (parallel ping) → `stream()` walks peers by latency → `broadcast()` / `consensus()` → local fallback on all-peer failure |
| [`multimodal-pipeline.mmd`](./multimodal-pipeline.mmd) | Mermaid `flowchart LR` | Image → captioner → RAG; Audio → transcriber → RAG; Wearable sensors → aggregator → RAG; all paths converge on the same chunks.json + vector index |
| [`profile-apply.mmd`](./profile-apply.mmd) | Mermaid `stateDiagram-v2` | Profile lifecycle: default → `edgewell profiles apply <name>` → `~/.edgewell/state.json` → next boot reads overrides → mobile / tinkerer / desktop active |
| [`architecture.txt`](./architecture.txt) | Pure ASCII (≤ 80 cols) | Terminal-readable version of `architecture.mmd` using `+`, `-`, `=`, `\|`, `>` box drawing |

## Rendering

The `.mmd` files are valid Mermaid that GitHub renders natively in
markdown. To render to SVG locally (optional — the `.mmd` source is
human-readable on its own):

```bash
# One-shot, no global install
npx @mermaid-js/mermaid-cli -i architecture.mmd -o architecture.svg

# Or install once
npm i -g @mermaid-js/mermaid-cli
mmdc -i router-flow.mmd -o router-flow.svg
```

External dependency is optional. The `.mmd` files are also the
source of truth and can be pasted into
<https://mermaid.live> for an instant preview.

## Source citations

Every diagram begins with a `%% Sources:` comment listing the
exact files and functions it depicts. Examples:

- `architecture.mmd` cites `src/index.ts (createEdgeWell)`,
  `src/agents/orchestrator.ts`, `src/peer-mesh.ts`, `src/p2p.ts`,
  `src/profiles.ts`, `src/rag.ts`, `src/hybrid-search.ts`,
  `src/tools.ts`, `src/tool-agent.ts`, `src/companion/server.ts`,
  `src/multimodal/index.ts`, `src/crypto.ts`, `src/redact.ts`,
  `src/commands/snapshot-sign.ts`.
- `router-flow.mmd` cites `src/agents/orchestrator.ts (route,
  parseRoute, ask)`, `src/agents/health.ts`, `src/rag.ts
  (contextBlock)`, `src/tool-agent.ts`, `src/tools.ts (search_kb)`.
- `peer-mesh.mmd` cites `src/peer-mesh.ts` and
  `src/p2p.ts (DelegatingLLM._withFallback, PeerClient.ping)`.
- `multimodal-pipeline.mmd` cites `src/multimodal/{index,image,
  audio,sensors}.ts`, `src/rag.ts`, `src/vector-index.ts`.
- `profile-apply.mmd` cites `src/profiles.ts`,
  `src/commands/profiles.ts`, `src/config.ts`.

## File sizes

Counts from `wc -l docs/diagrams/*` (run after writing the files):

```
$ wc -l docs/diagrams/*
  146 docs/diagrams/architecture.mmd
   49 docs/diagrams/router-flow.mmd
   34 docs/diagrams/peer-mesh.mmd
   34 docs/diagrams/multimodal-pipeline.mmd
   36 docs/diagrams/profile-apply.mmd
  109 docs/diagrams/architecture.txt
  105 docs/diagrams/README.md
  513 total
```

| File | Lines | Type |
|------|-------|------|
| `architecture.mmd` | 146 | Mermaid `flowchart TB` |
| `router-flow.mmd` | 49 | Mermaid `sequenceDiagram` |
| `peer-mesh.mmd` | 34 | Mermaid `flowchart LR` |
| `multimodal-pipeline.mmd` | 34 | Mermaid `flowchart LR` |
| `profile-apply.mmd` | 36 | Mermaid `stateDiagram-v2` |
| `architecture.txt` | 109 | Pure ASCII (≤ 80 cols) |
| `README.md` | 105 | Markdown index |

## Accuracy check

Every node in every diagram corresponds to a real module or
function in the EdgeWell v3.0.1 source tree:

- Subgraph titles map 1:1 to source files / concepts
  (`Orchestration`, `Specialists`, `Retrieval`, `Inference`, etc.).
- The "maxTokens=120, temperature=0" annotation matches
  `Orchestrator.route()` in `src/agents/orchestrator.ts`.
- The three profile values (model, vector dim, p2p timeout) are
  copied from `PROFILES` in `src/profiles.ts`.
- The five tools (`calculator`, `datetime`, `search_kb`,
  `add_expense`, `add_journal`) are the exact entries in `TOOLS`
  in `src/tools.ts`.
- The model registry entries (LLAMA 1B/8B, MEDPSY 4B,
  captioner/transcriber) match `src/registry.ts` and the
  captioner/transcriber placeholders in `src/multimodal/{image,
  audio}.ts`.
- The "stuck-loop guard" and `maxRounds=3` notes match
  `ToolAgent.ask()` in `src/tool-agent.ts`.
- The fallback log + stderr line in `peer-mesh.mmd` matches the
  exact string written by `DelegatingLLM._withFallback()`.

Generated for the EdgeWell hackathon submission.
