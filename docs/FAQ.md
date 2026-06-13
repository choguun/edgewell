# EdgeWell v3.0.0 FAQ

Frequently asked questions about EdgeWell v3.0.0.

## Why a CLI first?

EdgeWell started as a CLI because the QVAC SDK ships a Node.js
binding and a CLI is the smallest useful surface area. The v3.0.0
companion server and web UI are an extension of the same idea: a
local-first control plane that any client (phone, watch, browser)
can talk to.

## Why JSONL stores?

JSONL (one JSON object per line) is the smallest durable format
that:

- Streams (no need to load the whole file to append).
- Is human-readable in a text editor.
- Imports cleanly into anything that can parse JSON.

The trade-off is that large files get slow to read. v3.0.0 keeps
the data files under 10 MB on a typical personal device; if your
journal grows past that, run `edgewell export` and split the
archive.

## Why a separate vector RAG and lexical RAG?

Lexical retrieval (TF-IDF) is unbeatable for exact terms:
medication names, dollar amounts, product codes. Vector retrieval
is unbeatable for paraphrased concepts: "sleep" vs "rest", "save"
vs "set aside". v3.0.0 ships both, plus hybrid fusion and a
re-ranker, so each query gets the best of both.

## How do I add my own model?

Pass the model id via `EDGEWELL_MODEL` (local) or
`EDGEWELL_DELEGATE_MODEL` (peer). The model ids are looked up in
`src/registry.js`. Add a new entry to that file (or override at
runtime via a plugin) to use a model that is not in the default
list.

## How do I add my own agent?

Write a plugin that exports the v3.0.0 `hooks` object with a
`registerAgent` hook. The plugin can construct the agent using
the existing building blocks (LLM, RAG, profile) and add it to
the orchestrator.

## How do I run EdgeWell offline forever?

Skip `npm install @qvac/sdk`. The CLI starts and the local RAG,
profile, and stores all work without a model. The `bench` and
`ask` commands will return a placeholder when there is no real
LLM.

## Why no telemetry?

Telemetry is incompatible with the "device is trusted, network is
hostile" threat model. If EdgeWell phoned home, an attacker who
controlled the network could fingerprint the user by the telemetry
traffic alone. So EdgeWell does not phone home. There is no
analytics, no error reporting, no automatic updates.

## What's the upgrade path from v2.0.0 to v3.0.0?

See `docs/MIGRATION-2-to-3.md`. In short: back up, `git pull`,
`npm install`, `edgewell doctor`, and optionally `edgewell
profiles apply <name>`.
