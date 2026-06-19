# EdgeWell — Sponsor / Partnership Pack

> One-pager for investors and partners who may be forwarded this hackathon submission. No fabricated user counts; all numbers below come from the in-tree bench + test artifacts.

## What EdgeWell proves

- **Local-first AI is viable on commodity hardware.** A Raspberry Pi 4 with the `tinkerer` profile (`src/profiles.ts`) runs the full multi-agent orchestrator + 6 specialists at 64-dim hash embeddings and 300-char RAG chunks.
- **Multi-agent on the edge, not just on a GPU box.** The router prompt + keyword fallback (`src/agents/orchestrator.ts`) and the tool-calling loop (`src/tool-agent.ts`) ship in ~600 lines of TypeScript and pass 440 unit tests without the QVAC SDK installed.
- **Peer-mesh consensus is a real pattern, not a slide.** `PeerMesh.consensus()` (`src/peer-mesh.ts`) fans a prompt out to every healthy peer, normalises the replies, and returns the majority — over plain Node `http`, no new infrastructure.

## Why now

- **Privacy-regulation tailwind.** HIPAA, GDPR, Thai PDPA, and US state laws make "send the journal to OpenAI" a non-starter for an increasing share of consumer products.
- **Edge hardware growth.** Phones and SBCs routinely ship with NPUs and ≥ 4 GB RAM; the `mobile` and `tinkerer` profiles target those envelopes today (`HACKATHON-SUBMISSION.md` §5).
- **Open-weights ecosystem.** QVAC's catalogue (`src/registry.ts`) covers 1B → 70B Llama plus the medical-specialised Psy family (`MEDPSY_4B_INST_Q4_K_M`), all runnable offline.

## Ask

A self-hosted SaaS for teams that can't ship consumer health or finance data to a third-party LLM — the same EdgeWell binary with an admin plane, audit log, and SSO, sold per-seat to clinical practices, wellness coaches, and privacy-conscious households.
