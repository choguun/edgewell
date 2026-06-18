# EdgeWell v3.0.1 — Discord channel post

> Discord-flavored drop for the QVAC server. ~250 words.
> Includes code blocks + emoji-reaction suggestions so the
> thread counts reactions as votes.

---

**EdgeWell v3.0.1 just landed** for the QVAC General Purpose
track. It's a private, on-device personal health + finance
coach: orchestrator + 6 specialists, hybrid RAG, tool-calling
loop, peer mesh, multimodal ingest, all in one TypeScript
binary. Three form-factor profiles — `mobile`, `tinkerer`,
`desktop` — share the same code (`src/profiles.ts`). Privacy is
the headline: `scrypt + AES-256-GCM` at rest (`src/crypto.ts`),
pre-egress PII redaction (`src/redact.ts`), no telemetry
(`docs/SECURITY-MODEL.md`).

**Repro in 5 min:**

```bash
git clone <repo-url> edgewell && cd edgewell
corepack enable && corepack prepare pnpm@11.6.0 --activate
pnpm install
pnpm test          # expect 440/440 green
node bin/edgewell.js showcase   # 3 questions, 3 specialists
node bin/edgewell.js bench      # → artifacts/bench.json
```

**Why it's interesting:**

- 6 specialists + router behind one `Orchestrator` class
  (`src/agents/orchestrator.ts`).
- Hybrid RAG: TF-IDF + vector cosine + RRF + bigram re-ranker,
  zero external deps (`src/hybrid-search.ts`).
- Peer-mesh `consensus()` majority-votes short answers over
  plain HTTP (`src/peer-mesh.ts`).
- Tool loop surfaces malformed `<tool>` blocks and stuck loops
  as errors (`src/tool-agent.ts`, v3.0.1 hardening).

**Emoji reactions = votes. Pick one (or stack) below:**

- `:rocket:` — reproduced §4 of `HACKATHON-SUBMISSION.md`
- `:brain:` — read the multi-agent design in `AGENTS.md`
- `:shield:` — privacy story in `docs/SECURITY-MODEL.md`
  convinces you
- `:eyes:` — bench output matches (`artifacts/bench.json`)
- `:fire:` — would use this for your own journal / expenses

**Pinned**: `HACKATHON-SUBMISSION.md` is the canonical
judge-facing doc. Demo script at `demo/demo-script.md`.
Build-in-Public thread at `social/build-in-public.md`. 🙌
