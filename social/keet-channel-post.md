# EdgeWell v3.0.1 — Keet room post

> Drop into the EdgeWell Keet room at the QVAC hackathon hub.
> ~300 words. Vote CTA at the bottom.

---

Hey Keet room — shipping **EdgeWell v3.0.1** for the QVAC General
Purpose track. It is a private, on-device personal health +
finance coach that runs the whole stack on your own hardware: a
router, six specialists (Health, Finance, Sleep, Nutrition,
Hydration, Activity), hybrid TF-IDF + vector RAG with a bigram
re-ranker, a tool-calling agent loop, multimodal ingest (image /
audio / sensor / text), and a multi-peer mesh that consensus-
votes short answers when more than one peer is reachable. Same
TypeScript binary ships as a CLI, a peer server, and a mobile-
friendly web companion behind an HMAC token gate.

Why it matters here: the same code base covers the `mobile`,
`tinkerer`, and `desktop` profiles — no fork, no `#ifdef`. A
Raspberry Pi 4 with the `tinkerer` profile runs the full
orchestrator + 6 specialists at 64-dim hash embeddings and
300-char chunks (`src/profiles.ts`). Privacy is the headline:
`scrypt + AES-256-GCM` at rest (`src/crypto.ts`), pre-egress PII
redaction of emails, phones, Thai IDs, SSNs, IPv4, URL creds
(`src/redact.ts`), and no telemetry anywhere
(`docs/SECURITY-MODEL.md`).

Three things to try in the room today, each under a minute:

1. `git clone <repo> edgewell && cd edgewell && corepack enable
   && corepack prepare pnpm@11.6.0 --activate && pnpm install &&
   pnpm test` — expect a green ✔ wall (440/440, no SDK required).
2. `node bin/edgewell.js showcase` — three questions, three
   specialists, two tool calls, all offline.
3. `node bin/edgewell.js companion --port 8787 --print-token`
   and open `http://127.0.0.1:8787/` to see the bundled `web/`
   UI on the same port (paste the token on the first 401).

Drop your reproduction output, your favourite privacy nit, or
your bench numbers in the thread. The top three community
requests go straight into v3.0.2.

**Full submission + per-day Build-in-Public calendar:**
`HACKATHON-SUBMISSION.md` in the repo (open the file, paste §4,
ship it in 5 min).

**Vote on Keet:** thumbs-up on this post, share the
`artifacts/source-sha256.txt` fingerprint from your clone if it
matches, and reply with your `pnpm test` line. Three actions,
one vote counted. 🙌
