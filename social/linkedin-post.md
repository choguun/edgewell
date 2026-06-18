# EdgeWell v3.0.1 — LinkedIn post

> ~200 words. Targets the professional angle: privacy-preserving
> AI on the edge, multi-agent orchestration, QVAC ecosystem.

---

I just shipped **EdgeWell v3.0.1** for the QVAC General Purpose
hackathon — a private, on-device personal health and finance
coach that runs the entire stack (router, six specialists,
hybrid RAG, tool-calling agent, peer mesh, multimodal ingest)
on the user's own hardware, with no telemetry and no upstream
LLM.

A few engineering decisions worth highlighting for the
professional audience:

1. **Multi-agent orchestration on commodity hardware.** A
   Raspberry Pi 4 with the `tinkerer` profile runs the full
   `Orchestrator` + 6 specialists at 64-dim hash embeddings
   and 300-character RAG chunks (`src/profiles.ts`).
2. **Privacy-preserving by construction.** At-rest encryption
   is `scrypt + AES-256-GCM` with parameters bundled in the
   envelope (`src/crypto.ts`). Pre-egress redaction scrubs
   emails, phones, Thai national IDs, US SSNs, IPv4, and URL
   credentials (`src/redact.ts`).
3. **Multi-peer consensus over plain HTTP.** `PeerMesh.consensus()`
   fans a prompt out to every healthy peer and returns the
   normalised majority — no new infrastructure required
   (`src/peer-mesh.ts`).
4. **Production hardening in the final week.** v3.0.1 closes
   20 of 24 UAT findings plus three critical code-review
   blockers; the test suite (440 tests) runs offline without
   the QVAC SDK.

The full submission, including the per-day Build-in-Public
calendar, the 90-second demo script, and the file-by-file
evidence index, lives at `HACKATHON-SUBMISSION.md` in the
repo. Feedback and votes welcome — Keet room and Discord
channel pinned in §13 of the submission.
