# Community FAQ — EdgeWell v3.0.1

> Twelve questions community voters ask during the QVAC evaluation
> window. Each Q ≤ 80 chars, each A ≤ 280 chars. Every claim
> cites a real file or command in the repo.

---

**Q: What is EdgeWell?**
A: Private, on-device health + finance coach. Orchestrator + 6 specialists (Health, Finance, Sleep, Nutrition, Hydration, Activity), hybrid RAG, tool agent, peer mesh, multimodal ingest. All on the user's hardware. See `HACKATHON-SUBMISSION.md` §1, `src/agents/index.ts`.

**Q: Why local-first?**
A: Health journals and expenses should never leave the device. Threat model in `docs/SECURITY-MODEL.md` starts from "network is hostile." At-rest encryption in `src/crypto.ts`, egress redaction in `src/redact.ts`, no telemetry anywhere.

**Q: What is QVAC and how does EdgeWell use it?**
A: QVAC is the model SDK EdgeWell runs on. `package.json` links `@qvac/sdk` as a local vendor; `src/qvac.ts` wraps `loadModel` / `completion`. EdgeWell targets `LLAMA_3_2_1B_INST_Q4_0` on mobile and `LLAMA_3_1_8B_INST_Q4_K_M` on a desktop peer.

**Q: What makes EdgeWell novel?**
A: One TypeScript codebase, three form-factor profiles (`mobile` / `tinkerer` / `desktop` in `src/profiles.ts`). Multi-agent orchestrator that runs on a Raspberry Pi 4. Peer-mesh majority-vote consensus over plain HTTP, no new infra.

**Q: How do I reproduce in 5 minutes?**
A: `git clone <repo> edgewell && cd edgewell && corepack enable && corepack prepare pnpm@11.6.0 --activate && pnpm install && pnpm test`. 440 tests, no SDK required. Full steps: `HACKATHON-SUBMISSION.md` §4.

**Q: How do I vote or show support?**
A: Drop a thumbs-up in the Keet room, react on the Discord channel post, star the GitHub repo, and quote a line from `social/build-in-public.md` with `#QVAC`. Comments on the demo video count too.

**Q: What hardware do I need?**
A: Phone (Termux, `mobile` profile), Raspberry Pi 4/5 (`tinkerer`, 64-dim vector + 300-char chunks), or laptop with 16 GB RAM (`desktop`, 8B model). Profile knobs and RAM floors: `src/profiles.ts`, `HACKATHON-SUBMISSION.md` §5.

**Q: How do I add a new agent or tool?**
A: Drop a new file in `src/agents/<name>.ts` implementing `ask` + `streamAsk`, register it in `src/agents/index.ts`, add a keyword to the orchestrator's fallback regex. Full how-to: `AGENTS.md` §"Adding a new specialist".

**Q: What is the privacy story?**
A: No telemetry. At-rest `scrypt + AES-256-GCM` in `src/crypto.ts`. Egress redactor scrubs emails, phones, Thai IDs, SSNs, IPv4, URL creds in `src/redact.ts`. Companion HTTP server uses HMAC bearer tokens; CORS + `OPTIONS 204` in `src/companion/server.ts`.

**Q: What about the Psy / medical model?**
A: `src/registry.ts` tags `MEDPSY_4B_Q4_K_M` with `domain: "medical"`. The `desktop` profile delegates to it via `pickModel({ domain: "medical" })`. Same SDK call path as Llama — no second runtime.

**Q: What's next after v3.0.1?**
A: Swap the hash embedder in `src/vector-index.ts` for the real QVAC embedder once the SDK ships it; inject real `captionFn` / `transcribeFn` into `src/multimodal/index.ts`; encrypted snapshot sync across the peer mesh.

**Q: Who built EdgeWell?**
A: A solo builder for the QVAC General Purpose track. Canonical submission: `HACKATHON-SUBMISSION.md`. Build log: `social/build-in-public.md`. Community channels: Keet room and Discord thread pinned in `HACKATHON-SUBMISSION.md` §13.

---

> **Vote on Discord / Keet.** Open the Keet room or the pinned
> Discord thread, drop a thumbs-up on the demo video, and star
> the repo. Three concrete actions, three votes counted.
