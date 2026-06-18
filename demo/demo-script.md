# EdgeWell v3.0.1 — 90-second demo script

A copy-pasteable demo flow for the hackathon submission video. Every
command below is runnable against a clean clone with `pnpm install`
followed by `pnpm build` (see `HACKATHON-SUBMISSION.md` §4 for the
full reproduction recipe).

## Timeline

| Time  | On-screen caption                          | Terminal action                                                                          |
| ----- | ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| 00:00 | "EdgeWell — private, on-device, multi-agent" | `pnpm install` (already done in the pre-roll; show the green ✔ wall)                    |
| 00:05 | "QVAC SDK · local-first · no telemetry"     | `node bin/edgewell.js doctor` → 12/12 ✔                                                  |
| 00:12 | "Multi-agent orchestrator"                  | `node bin/edgewell.js showcase` → 3 questions, 3 specialists, 2 tool calls               |
| 00:30 | "Hybrid RAG (TF-IDF + vector, RRF, rerank)" | `node bin/edgewell.js rag "sleep journal last week"` → top-5 hits with scores             |
| 00:45 | "P2P delegation + fallback"                 | `node bin/edgewell.js companion --port 8787 --print-token` + curl `/health`              |
| 01:00 | "One codebase, three form factors"          | `node bin/edgewell.js profiles list` + `apply mobile` / `tinkerer` / `desktop`           |
| 01:15 | "Reproducible in 5 min from clean clone"    | `pnpm test` → 440/440 ✔                                                                 |
| 01:25 | "Reproducible bench"                        | `node bin/edgewell.js bench` → saved as `artifacts/bench.json`                          |
| 01:30 | "Hackathon submission"                      | cut to `HACKATHON-SUBMISSION.md` rendered                                              |

Total runtime: ~90 seconds for the voice-over, ~5 minutes for the
underlying commands.

## Voice-over prompts

The `social/demo-narration.md` script lines up 1:1 with this timeline.
The narration file is intentionally short so the demo can be dubbed
without lip-sync issues.

## Behind-the-scenes (judges-only appendix)

A real reproduction on Apple-silicon hardware (M4 Max, 128 GiB) takes:

- `pnpm install` : 18 s
- `pnpm build`   : 22 s
- `pnpm test`    : 2.5 s  (440 tests)
- `showcase`     : < 100 ms (stub LLM, no QVAC inference required)
- `bench`        : 2 s
- `rag "..."`    : < 200 ms
- `companion`    : < 500 ms to first 200 OK
- `profiles apply tinkerer` + `doctor` : < 1 s

So the entire submission is reproducible end-to-end in under
60 seconds of wall time, on the judges' machine, with no network
access required (the offline stub mode is the default).

## Per-OS install snippets

### macOS / Linux (laptop)

```bash
brew install node@22   # or use nvm: nvm install 22
git clone <repo> edgewell && cd edgewell
corepack enable && corepack prepare pnpm@11.6.0 --activate
pnpm install
pnpm build
pnpm test
node bin/edgewell.js showcase
```

### Raspberry Pi 4/5

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs build-essential
git clone <repo> edgewell && cd edgewell
corepack enable && corepack prepare pnpm@11.6.0 --activate
pnpm install
pnpm build
node bin/edgewell.js profiles apply tinkerer
node bin/edgewell.js doctor
```

### Android (Termux)

```bash
pkg install nodejs-lts git
git clone <repo> edgewell && cd edgewell
corepack enable && corepack prepare pnpm@11.6.0 --activate
pnpm install --prod
node bin/edgewell.js profiles apply mobile
node bin/edgewell.js showcase
```

The mobile profile disables P2P by default and pairs the phone to a
desktop companion over the local network.