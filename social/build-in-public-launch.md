# Build-in-Public — 12-Hour Launch Playbook

> Single-day schedule for the evaluation window. All times UTC. Five drops, each ≤ 280 chars, each pinned to a real file or sibling artifact. Companion to `social/build-in-public.md`.

---

## Hour 0 — kickoff

- **Channel:** X + Keet room announce.
- **Asset:** rendered `docs/diagrams/architecture.mmd`.
- **Post:** "Day 0: EdgeWell v3.0.1 lands for #QVAC. 7 agents, hybrid RAG, peer-mesh consensus, 1B→8B model range, zero telemetry. `pnpm test` is green in 5 min. 🎯"

## Hour 2 — architecture drop

- **Channel:** LinkedIn + a code-sharing site (pastebin / GitHub gist).
- **Asset:** `docs/diagrams/architecture.mmd` (Mermaid) + `docs/diagrams/architecture.txt` (rendered text form).
- **Post:** "EdgeWell architecture in one screen: CLI / companion / browser → orchestrator → 6 specialists → hybrid RAG → EdgeWellLLM + DelegatingLLM → @qvac/sdk. Mermaid source in the repo 📐"

## Hour 4 — showcase terminal drop

- **Channel:** X + Keet.
- **Asset:** `demo/showcase-compiled.txt` (captured trace) and the script at `demo/demo-script.md`.
- **Post:** "Hour 4: 90-second showcase. 3 questions, 3 specialists, 2 tool calls, 0 cloud. Captured trace in `demo/showcase-compiled.txt`; follow `demo/demo-script.md` to reproduce 🎬"

## Hour 8 — bench profile drop

- **Channel:** LinkedIn + X.
- **Asset:** `artifacts/bench.json` (profile × model × tokens/s) + `artifacts/hardware-proof.txt` (per-profile knob summary).
- **Post:** "Hour 8: bench across mobile / tinkerer / desktop. 1B is the floor, 8B is the ceiling, MedPsy is the desktop delegate. Numbers in `artifacts/bench.json` 📊"

## Hour 12 — Psy-routing command drop

- **Channel:** Keet + X.
- **Asset:** the desktop profile's delegate-model swap, citing `src/profiles.ts` line 29 and `src/registry.ts` lines 52–60.
- **Post:** "Hour 12: the Psy path. `edgewell profiles apply desktop` then `edgewell ask 'why have I been tired for two weeks?'` — the `desktop` profile delegates to `MEDPSY_4B_INST_Q4_K_M` (Psy, `domain: 'medical'`). Same SDK call path, no second runtime 🧠"

---

> Cadence: one drop every two hours, two channels each, all artefacts in-tree and reproducible from §4 of `HACKATHON-SUBMISSION.md`.
