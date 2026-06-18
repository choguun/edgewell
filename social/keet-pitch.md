# Keet pitch — EdgeWell

EdgeWell is a private, on-device personal health and finance coach
that ships as one TypeScript binary — CLI, peer server, and mobile
web companion — running the full stack (orchestrator, six
specialists, hybrid RAG, tool agent, multimodal ingest) on the
user's own hardware through the QVAC SDK.

v3.0.1 ships:

- **Six specialists + one router.** `HealthAgent`, `FinanceAgent`,
  `SleepAgent`, `NutritionAgent`, `HydrationAgent`,
  `ActivityAgent`, plus a `Lifestyle` default, dispatched by a
  JSON-output router prompt with a keyword fallback
  (`src/agents/orchestrator.ts`).
- **Hybrid TF-IDF + vector RAG** with reciprocal rank fusion and a
  bigram re-ranker, all offline and zero-dependency
  (`src/hybrid-search.ts`, `src/vector-index.ts`, `src/rag.ts`).
- **Multi-peer mesh with majority-vote consensus** — `healthy()`
  sorts peers by latency, `stream()` walks the list until one
  yields tokens, `consensus()` fans out and majority-votes the
  short answers (`src/peer-mesh.ts`).
- **Tool-calling loop** that surfaces malformed `<tool>` blocks
  and stuck loops as explicit errors instead of silently
  spinning (`src/tool-agent.ts`).
- **Three form-factor profiles** (`mobile`, `tinkerer`, `desktop`
  in `src/profiles.ts`) so the same binary runs on a 1B-param
  phone, a 4 GB Raspberry Pi, or an 8 GB laptop.
- **At-rest scrypt + AES-256-GCM**, pre-egress PII redactor
  (emails, phones, Thai IDs, SSNs, IPv4, URL creds), HMAC-token-
  gated companion server with CORS + `OPTIONS 204`.
- **440 tests green offline; 20/24 UAT findings closed.**
  `artifacts/bench.json` carries per-profile tokens/s;
  `artifacts/source-sha256.txt` is the reproducibility fingerprint.

The canonical submission with every command a judge or community
voter can paste is `HACKATHON-SUBMISSION.md`. A full per-day
Build-in-Public calendar lives at `social/build-in-public.md`,
and the 90-second demo script — terminal actions, captions, and
timing — lives at `demo/demo-script.md`.

I would love feedback from anyone shipping edge AI on Keet: what
did you have to give up to get under the model-size wall, and
how did you keep the user in control of their own data? Drop a
note in the room; the most useful three replies go into v3.0.2.

## Call to action — join the EdgeWell Keet room

**Join the EdgeWell Keet room** at the QVAC hackathon hub — the
room is the official community issue tracker for EdgeWell during
the evaluation window. Bring your reproduction output, your
favourite privacy nit, or your vote. Two-minute quickstart:

```bash
git clone <repo-url> edgewell && cd edgewell
corepack enable && corepack prepare pnpm@11.6.0 --activate
pnpm install && pnpm build && pnpm test
node bin/edgewell.js showcase
```

Then drop into the Keet room with:

1. Your `pnpm test` green ✔ wall (440/440 expected).
2. The `artifacts/bench.json` from `node bin/edgewell.js bench`.
3. The `showcase` trace from the quickstart above.

We compare profile-by-profile (mobile vs tinkerer vs desktop) in
the room, file bugs there first, and fold the top three community
requests into v3.0.2. **If you can reproduce §4 of
`HACKATHON-SUBMISSION.md` and leave a thumbs-up in the Keet
room, that's a vote.**
