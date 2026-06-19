# AGENTS — EdgeWell v3.0.1

Reference for the multi-agent system: who they are, what they do,
how they are picked, and how to extend the registry. If you are
debugging a routing issue or adding a new specialist, start here.

## Overview

EdgeWell runs a **router + specialists** model. The user asks one
question; the **orchestrator** picks one specialist; the
specialist answers using its own prompt template, the user's
local RAG context, and (optionally) the user's profile and expense
store. There is no shared scratchpad and no agent-to-agent call —
specialists are independent.

```
                ┌──────────────────────┐
                │   Orchestrator.route │
                │   (router prompt +   │
                │    keyword fallback) │
                └──────────┬───────────┘
                           │
        ┌────────────┬─────┴──────┬──────────────┐
        ▼            ▼            ▼              ▼
   HealthAgent  FinanceAgent  SleepAgent   NutritionAgent
                              HydrationAgent
                              ActivityAgent
                              (lifestyle = default branch)
```

## Specialist inventory

| Agent | Module | Best for | Inputs |
|---|---|---|---|
| `HealthAgent` | `src/agents/health.ts` | symptoms, sleep, mood, exercise, diet, medication | RAG over notes |
| `FinanceAgent` | `src/agents/finance.ts` | budgeting, expense trends, savings plans, monthly plan | RAG + expense JSONL |
| `SleepAgent` | `src/agents/sleep.ts` | sleep trends, recommendations, RAG-grounded tips | RAG over notes |
| `NutritionAgent` | `src/agents/nutrition.ts` | meal planning, hydration pairing, food-mood correlations | RAG |
| `HydrationAgent` | `src/agents/hydration.ts` | water intake, electrolyte balance | RAG |
| `ActivityAgent` | `src/agents/activity.ts` | steps, exercise, sedentary time | RAG |
| **lifestyle** (no agent) | `src/agents/orchestrator.ts` | habits, productivity, mixed health+finance | the LLM directly |

Every agent exposes two methods, plus the agent contract:

```ts
interface SpecialistAgent {
  ask(question: string, history?: ChatMessage[]): Promise<string>;
  streamAsk(question: string, history?: ChatMessage[]): AsyncIterable<string>;
}
```

Internally each agent calls `this.llm.prompt(...)` /
`this.llm.stream(...)` with its own `SYSTEM` prompt + a per-call
user block that mixes RAG context with the question. The LLM may be
the local `EdgeWellLLM` or the `DelegatingLLM` (peer-first, with
local fallback) — the agents do not know which.

## Routing

`Orchestrator.route(question)` runs **two** strategies and uses the
first that yields a known agent:

1. **Router prompt.** A tiny `ROUTER_SYSTEM` asks the LLM for a
   single JSON object `{ agent, reason }`. Valid values are
   `"health"`, `"finance"`, `"lifestyle"`. The orchestrator strips
   any code fences, parses the first `{...}` block, and validates
   `agent` against the known set. The router prompt is tuned to be
   small (~120 maxTokens) so the routing decision is cheap.
2. **Keyword fallback.** If the JSON parse fails or the agent is
   not in the known set, the orchestrator falls back to a regex
   against the original question:
   - `health` keywords: `symptom`, `sleep`, `exercise`, `diet`,
     `medication`, `pain`, `stress`, `mood`
   - `finance` keywords: `money`, `budget`, `expense`, `saving`,
     `debt`, `income`, `price`, `thb`, `usd`, `baht`
   - everything else: `lifestyle` (default)

`Orchestrator.ask()` then dispatches:

```ts
const { agent } = await this.route(question);
switch (agent) {
  case "health":   return { agent, reply: await this.health.ask(...) };
  case "finance":  return { agent, reply: await this.finance.ask(...) };
  default:         return { agent: "lifestyle",
                            reply: await this.llm.prompt({ system: LIFESTYLE_SYSTEM, ... }) };
}
```

`streamAsk` is the streaming variant, used by `edgewell chat` and
the companion's `POST /chat`.

The orchestrator's `parseRoute` now also emits a `domain: string | null` field on `RouteResult`. The default branch is `null`. Mental-health keywords (`anxiety|therapy|panic|mental|psych|depress|insomnia|ptsd`) emit `domain: "medical"`, which the desktop profile's `MEDPSY_4B_INST_Q4_K_M` Psy-family model uses to weight its response. See `edgewell psy` for the demo.

## Prompts

Every agent owns a single `SYSTEM` constant at the top of its
module. These are deliberately short and rule-scoped — see
`src/agents/health.ts`, `src/agents/finance.ts`, etc. Each prompt
ends with a one-line disclaimer:

- Health: `Note: I'm an AI, not a doctor. For urgent or severe
  symptoms, contact a licensed clinician or local emergency
  services.`
- Finance: `Note: not financial advice.`

`LIFESTYLE_SYSTEM` lives in `src/agents/orchestrator.ts` and is
the catch-all for questions that don't match a specialist.

## Routing in the offline stub

When `@qvac/sdk` is not installed, `edgewell ask` falls back to a
clean stub (see `src/commands/ask.ts`):

```
[lifestyle]
[stub] no @qvac/sdk installed - would have answered: "<question>"
```

`edgewell ask` runs the router first so the stub output still
announces which specialist would have answered. The previous
behaviour was to dump the entire prompt template (RAG context +
agent system + user block) before the stub line; that was replaced
in v3.0.1.

## Lifecycle

`createEdgeWell()` in `src/index.ts` is the single source of truth:

```ts
const llm = cfg.p2p.enabled
  ? new DelegatingLLM({ peer, localModel: cfg.localModel })
  : new EdgeWellLLM({ model: cfg.localModel });

const health  = new HealthAgent({ llm, rag, profile: null });
const finance = new FinanceAgent({ llm, rag, profile: null, expenses });
const orchestrator = new Orchestrator({ llm, health, finance });

return { cfg, llm, profile, journal, expenses, rag, health, finance, orchestrator };
```

Note the agents are constructed with `profile: null`. The user
profile is loaded on demand by the agents (or by the callers that
need it). This keeps `createEdgeWell()` cheap to instantiate for
unit tests.

## Adding a new specialist

1. Add a `SYSTEM` prompt and a class in `src/agents/<name>.ts`
   implementing `ask` + `streamAsk`. Mirror the structure of
   `health.ts` or `finance.ts` — small class, no dependencies
   beyond the LLM and the optional RAG index.
2. Re-export from `src/agents/index.ts`.
3. Add the agent to `OrchestratorOptions.lifestyle?` (or wire it
   into `Orchestrator.ask` / `streamAsk` if you want it picked by
   the router instead of the lifestyle fallback).
4. Add a keyword to the router's keyword fallback so the JSON-parse
   failure path also routes correctly.
5. Add a unit test under `test/agents-*.test.ts` covering at
   minimum: the `ask` method, the `streamAsk` method, and that
   the orchestrator routes a representative question to it.
6. Run `pnpm test` and `pnpm build`.

## P2P delegation and the agents

`DelegatingLLM` is constructed when `cfg.p2p.enabled === true` and
is transparent to the agents — they call `llm.prompt(...)` /
`llm.stream(...)` exactly as before. The delegator:

- tries the peer first via `PeerClient.stream()`;
- on `fetch` failure (timeout, ECONNREFUSED, etc.) emits a
  structured `warn` log + a stderr line
  (`[p2p] peer <host>:<port> unreachable — falling back to local model`)
  so interactive `chat` shows the fallback;
- drains the peer stream into the caller; if the peer yielded
  nothing, switches to the local `EdgeWellLLM`.

The agents never see the fallback — they only see "tokens streamed
in." This means existing agent tests are unaffected by the P2P
flag.

## Testing the agents

Each agent has a unit test under `test/agents-*.test.ts` that
asserts:

- the agent returns a non-empty string from `ask`;
- the agent yields at least one token from `streamAsk`;
- the agent does not throw on empty / very long questions.

The orchestrator has `test/orchestrator.test.ts` which covers:

- router JSON parsing (including code-fence tolerance);
- keyword fallback for each branch;
- default-to-lifestyle behaviour.

To exercise a real model end-to-end, install `@qvac/sdk` and run
`edgewell ask` from a CLI prompt — the agents are wired up
identically in dev and built layouts.
