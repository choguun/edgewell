# EdgeWell v3.0.1 — Judge's One-Pager

> **Pitch (one line):** A private, on-device health + finance coach
> that runs the full multi-agent stack on commodity hardware through
> the QVAC SDK, with no telemetry.

## What to look at first

- **The showcase** — `node bin/edgewell.js showcase` runs three
  questions through three specialists and emits a captured trace at
  `demo/showcase-compiled.txt`.
- **The architecture** — one-screen diagram at
  `docs/ARCHITECTURE.md`; Mermaid source at
  `docs/diagrams/architecture.mmd`.
- **The bench** — `node bin/edgewell.js bench` writes a structured
  profile × model × tokens/s JSON to `artifacts/bench.json`.

## 5-minute reproduction

```bash
corepack enable && corepack prepare pnpm@11.6.0 --activate
git clone <repo-url> edgewell && cd edgewell
pnpm install            # @qvac/sdk linked from vendor/qvac-sdk
pnpm test               # 445/445 green, no SDK required at runtime
node bin/edgewell.js showcase   # 3 questions, 3 specialists, offline
```

## Criterion-by-criterion

- **Built on QVAC SDK** — `package.json` `@qvac/sdk` link; wrapper in
  `src/qvac.ts`; model catalog in `src/registry.ts`.
- **Form-factor constraint** — `src/profiles.ts` declares
  `mobile` / `tinkerer` / `desktop` as pure-data overrides; no fork.
- **Reproducible from clean machine** — `package.json` pins
  `packageManager: pnpm@11.6.0` and `engines.node: ">=22.17"`; vendor
  SDK at `vendor/qvac-sdk/`.
- **Tests pass without the SDK** — `package.json` `test` script uses
  `node --import tsx --test`; offline stub at `src/commands/ask.ts`.
- **Multi-agent + tool calling + P2P + multimodal** — orchestrator in
  `src/agents/orchestrator.ts`, tool loop in `src/tool-agent.ts`,
  peer mesh in `src/peer-mesh.ts`, ingest in `src/multimodal/index.ts`.
- **Privacy** — at-rest `scrypt + AES-256-GCM` in `src/crypto.ts`;
  egress redaction in `src/redact.ts`; threat model in
  `docs/SECURITY-MODEL.md`.

## Disclaimers

- **Health:** Educational only — not a medical device. For urgent or
  severe symptoms, contact a licensed clinician. Surfaced in
  `src/agents/health.ts` and every `[health]` reply.
- **Finance:** Not financial advice. Surfaced in
  `src/agents/finance.ts` and every `[finance]` reply.

Canonical entry point: `HACKATHON-SUBMISSION.md`. Reproduction
fingerprint: `artifacts/source-sha256.txt`.
