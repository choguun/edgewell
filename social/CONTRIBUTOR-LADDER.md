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

The `ToolRegistry` (also in `src/tools.ts`) is constructed with
`TOOLS` as the default, so a new `new ToolRegistry()` (or a
`ToolAgent` that doesn't pass an explicit registry) picks up the
new `greet` entry automatically — no other wiring required.

**Verify it works:**

```bash
pnpm test -- --grep "ToolRegistry"
```

---

## 2. Add a custom agent (10 lines)

**Hypothetical example** — the recipe below is the cookbook
entry, not a shipped feature. To add a real new specialist,
create a new file (e.g. `src/agents/<your-agent>.ts`, not committed) that
mirrors the `SpecialistAgent` interface (`ask` + `streamAsk`).

> **Note:** the existing agents each define their own private
> `SYSTEM` constant at the top of their module (e.g. `SYSTEM` in
> `src/agents/health.ts`). `LIFESTYLE_SYSTEM` in
> `src/agents/orchestrator.ts` is **not** exported, so the
> snippet below defines its own system prompt — copy the
> existing agents' pattern rather than re-importing.

```ts
// src/agents/<your-agent>.ts (NEW FILE — recipe only, not committed; see CONTRIBUTING-v3.md)
import type { ChatMessage, LLM } from "../llm-types.js";

const SYSTEM = `You are EdgeWell Mindfulness, a private on-device
mindfulness coach. Help with brief, guided breathing and focus
exercises. Be calm and concise.`;

export interface MindfulnessAgentOptions {
  llm: LLM;
}

export class MindfulnessAgent {
  public llm: LLM;
  constructor({ llm }: MindfulnessAgentOptions) {
    this.llm = llm;
  }
  async ask(q: string, h: ChatMessage[] = []): Promise<string> {
    return this.llm.prompt({ system: SYSTEM, user: q, history: h, maxTokens: 400 });
  }
  async *streamAsk(q: string, h: ChatMessage[] = []): AsyncIterable<string> {
    for await (const tok of this.llm.stream({ system: SYSTEM, user: q, history: h, maxTokens: 400 })) yield tok;
  }
}
```

Then in `src/agents/index.ts` add a re-export:

```ts
export { MindfulnessAgent } from "./mindfulness.js";
```

To use the agent end-to-end you would also need to thread it
into `Orchestrator` (e.g. by extending the lifestyle branch in
`Orchestrator.ask` or by adding a per-call delegate policy that
reads the orchestrator's `domain` hint). The current
`Orchestrator.ask` default branch uses `LIFESTYLE_SYSTEM`
directly with the LLM and does **not** consult a lifestyle
specialist object, so wiring this in cleanly is a slightly
larger change — file an issue if you'd like a turnkey hook.

**Verify it works:**

```bash
# The new file is recipe-only until you actually create it; once
# created, add a unit test under test/agents-mindfulness.test.ts:
pnpm test -- --grep "MindfulnessAgent"
# Or just make sure the existing suite is still green:
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
inject it via `VectorIndex` (or `makeEmbedder` from `src/embedder.ts`).

> **Note:** the previous version of this snippet referenced a
> `createRag({ embed })` factory that does not exist. The
> real injection seam is `new VectorIndex({ embedder })` in
> `src/vector-index.ts` (or `makeEmbedder({ kind, llm, ... })`
> in `src/embedder.ts`). The snippet below uses the
> `VectorIndex` route.

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
// Usage:
//   import { VectorIndex } from "./vector-index.js";
//   const vidx = new VectorIndex({ dim: 128, embedder: constantEmbedder(1) });
//   await vidx.ingest({ source: "demo", text: "hello world" });
//   const hits = await vidx.search("hello", 5);
```

Swap the real QVAC embedder in the same way once the SDK exposes it:
`{ embedder: makeEmbedder({ kind: "qvac", llm }) }` (see
`docs/ARCHITECTURE.md` §"Pluggable embedders" and the `Embedder`
type in `src/embedder.ts`).

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
