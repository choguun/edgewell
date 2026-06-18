# Twitter / X thread — EdgeWell v3.0.1

> 9 tweets. ≤280 chars each. CTA at tweet 8 deep-links to
> `HACKATHON-SUBMISSION.md` in the GitHub repo so the click
> target is concrete. Tweet 9 is the RT-and-reply closer that
> drives showcase-output requests during the eval window.

---

**1/9** Built EdgeWell for the QVAC hackathon: a private, on-device health + finance coach. 1B model on the phone, 8B on a peer, zero telemetry. Same TypeScript binary, three form-factor profiles. #QVAC #EdgeAI 🚀

---

**2/9** Multi-agent without the cloud. Orchestrator routes each question to one of 6 specialists (Health, Finance, Sleep, Nutrition, Hydration, Activity) via a tiny JSON router prompt + keyword fallback. All offline. #QVAC #EdgeAI 🧠

---

**3/9** Hybrid RAG, no external deps. TF-IDF + vector cosine + reciprocal rank fusion + bigram re-ranker. Chunks are deduped by (source, text) so re-ingesting a file is a no-op. #QVAC #EdgeAI 🔍

---

**4/9** Peer mesh that consensus-votes. healthy() pings every peer in parallel, sorts by latency, streams the prompt. broadcast() + consensus() fan out a single prompt and pick the most common short answer. #QVAC #EdgeAI 🛰️

---

**5/9** Tool agent with two v3.0.1 hardening wins: unclosed <tool> tags surface as errors, and a stuck loop (same calls + same results as last round) stops early instead of burning maxRounds. #QVAC #EdgeAI 🛠️

---

**6/9** Privacy by default. At-rest: scrypt + AES-256-GCM. Egress: emails / phones / Thai IDs / SSNs / IPv4 / URL creds redacted before any peer call. Companion HTTP server is HMAC-token-gated with CORS + OPTIONS 204. #QVAC #EdgeAI 🔐

---

**7/9** v3.0.1 closes 20 of 24 UAT findings + 3 critical code-review blockers. Demo in 90 seconds: `edgewell doctor` → `edgewell ask "why am I so tired"` → `edgewell companion --print-token`. Full script: `demo/demo-script.md`. #QVAC #EdgeAI 🔗

---

**8/9** Full submission, commands, file-by-file evidence, and the per-day Build-in-Public calendar live at **`HACKATHON-SUBMISSION.md`** in the GitHub repo (github.com/<you>/edgewell/blob/main/HACKATHON-SUBMISSION.md). Open the file, paste §4, ship it in 5 min. #QVAC #EdgeAI 🗳️

---

**9/9** RT if you'd use a private on-device coach — I'll send the showcase output to anyone who replies. Three questions, three specialists, two tool calls, all offline. DM me your handle and I'll DM back the captured terminal trace from `node bin/edgewell.js showcase`. #QVAC #EdgeAI 💬
