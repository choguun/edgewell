# Contributor Ladder — EdgeWell v3.0.1

> Five small steps, each a real file in the repo, each with a
> verify-it-works command. Pick the rung that matches what you want
> to learn; the same patterns recur across the codebase.

---

## 1. Add a custom tool (5 lines)

**File:** `src/tools.ts` — the `TOOLS` map near the top of the file.

```ts
// src/tools.ts — inside the TOOLS object:
greet: {
  description: "Return a friendly greeting in the user's locale.",
  params: { type: "object", properties: { name: { type: "string" } } },
  run({ name = "friend" }) { return { hello: `Hello, ${name}!` }; },
},
```

The `ToolRegistry` (also in `src/tools.ts`) auto-discovers the new
entry — no other wiring required.

**Verify it works:**

```bash
pnpm test -- --grep "ToolRegistry"
```

---

## 2. Add a custom agent (10 lines)

**File:** `src/agents/orchestrator.ts` — mirror the
`SpecialistAgent` interface (`ask` + `streamAsk`).

```ts
// src/agents/mindfulness.ts
import { LIFESTYLE_SYSTEM } from "./orchestrator.js";
export class MindfulnessAgent {
  constructor(private llm) {}
  async ask(q, h = []) {
    return this.llm.prompt({ system: LIFESTYLE_SYSTEM, user: q, history: h, maxTokens: 400 });
  }
  async *streamAsk(q, h = []) {
    for await (const tok of this.llm.stream({ system: LIFESTYLE_SYSTEM, user: q, history: h, maxTokens: 400 })) yield tok;
  }
}
```

Then in `src/index.ts` (`createEdgeWell`): construct the agent and
hand it to `new Orchestrator({ llm, health, finance, lifestyle: mind })`.
Re-export from `src/agents/index.ts`.

**Verify it works:**

```bash
node bin/edgewell.js ask "Help me breathe for two minutes"
# expect: [lifestyle] ... (router falls through; agent handles via lifestyle branch)
pnpm test
```

---

## 3. Add a custom profile (5 lines)

**File:** `src/profiles.ts` — append a key to the `PROFILES` map.

```ts
// src/profiles.ts — inside PROFILES:
kiosk: {
  label: "kiosk / shared screen (<= 2GB RAM)",
  localModel: "LLAMA_3_2_1B_INST_Q4_0",
  delegateModel: "LLAMA_3_1_8B_INST_Q4_K_M",
  rag: { chunkSize: 150, chunkOverlap: 20, topK: 2 },
  p2p: { enabled: false, host: "127.0.0.1", port: 8789, timeoutMs: 3000 },
  vector: { dim: 32, kind: "hash" },
  companion: { enabled: false, port: 8789, host: "127.0.0.1" },
},
```

`pickProfile("kiosk")` now returns the new overrides; the
`edgewell profiles apply kiosk` command picks it up automatically.

**Verify it works:**

```bash
node bin/edgewell.js profiles list     # kiosk appears
node bin/edgewell.js profiles apply kiosk
node bin/edgewell.js doctor            # shows kiosk knobs
```

---

## 4. Add a custom RAG backend (10 lines)

**File:** `src/vector-rag.ts` — implement a new `embed(text)` and
inject it via the `llmEmbed` factory.

```ts
// src/vector-rag.ts — alongside hashEmbedder:
export function constantEmbedder(value = 0) {
  return function embed(text) {
    const dim = 128;
    const v = new Float64Array(dim);
    for (let i = 0; i < Math.min(text.length, dim); i++) v[i] = value;
    return v;
  };
}
// Usage: const rag = createRag({ embed: constantEmbedder(1) });
```

Swap the real QVAC embedder in the same way once the SDK exposes it:
`{ embed: await qvacEmbedder() }` (see
`docs/ARCHITECTURE.md` §"Pluggable embedders").

**Verify it works:**

```bash
pnpm test -- --grep "vector-rag"
node bin/edgewell.js rag ingest ./README.md
node bin/edgewell.js rag search "qvac"   # expect a hit
```

---

## 5. Add a custom multimodal captioner (10 lines)

**File:** `src/multimodal/image.ts` — pass a `captionFn` to
`ingestImage`.

```ts
// Anywhere in your app code:
import { ingestImage } from "./src/multimodal/image.js";
const captionFn = async ({ bytes, meta }) =>
  `Local caption for ${meta.name}: ${bytes.length} bytes, ext=${meta.ext}`;
const result = await ingestImage({ filePath: "./photo.jpg", captionFn });
console.log(result.text);
```

The real QVAC vision model plugs in at the same seam:
`captionFn: qvacVisionCaptioner()` (no second runtime — same SDK call
path as `EdgeWellLLM`).

**Verify it works:**

```bash
pnpm test -- --grep "image"
```

---

**Next step:** read `AGENTS.md` §"Adding a new specialist" for the
end-to-end checklist (re-export, keyword fallback, unit test, build).
