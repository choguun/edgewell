// Multi-agent orchestrator: routes user questions to the right specialist
// (health, finance, or a general/lifestyle one) and can chain them.

import type { ChatMessage, LLM } from "../llm-types.js";
import type { RagIndex, RagSearchHit } from "../rag.js";

export type RouteAgent = "health" | "finance" | "lifestyle";

export interface RouteResult {
  agent: RouteAgent;
  reason: string;
  /**
   * Optional domain hint emitted by the keyword-fallback path.
   * `medical` is set when the question matches the v3.0.1
   * mental-health regex (`/anxiety|therapy|panic|mental|psych|
   * depress|insomnia|ptsd/i`); the `psy` showcase command and
   * future per-call delegate policies read this to choose a
   * Psy-family model via `pickModel({ domain: "medical" })`.
   * `null` means no domain hint (lifestyle default).
   */
  domain: string | null;
}

/**
 * Structured events yielded by `Orchestrator.streamHandle`.
 * The web UI (and the v3.0.1 `POST /chat/stream` SSE endpoint)
 * consumes these to render the router chip, source citations,
 * and token-by-token streaming reply.
 */
export type StreamEvent =
  | { type: "route"; agent: RouteAgent; reason: string; domain: string | null }
  | { type: "context"; hits: RagSearchHit[] }
  | { type: "token"; text: string }
  | { type: "error"; message: string }
  | { type: "done" };

export interface SpecialistAgent {
  ask(question: string, history?: ChatMessage[]): Promise<string>;
  streamAsk(question: string, history?: ChatMessage[]): AsyncIterable<string>;
}

export interface OrchestratorOptions {
  llm: LLM;
  health: SpecialistAgent;
  finance: SpecialistAgent;
  lifestyle?: SpecialistAgent;
  /**
   * Optional RAG index used by `streamHandle` to emit a
   * `context` event with the top-k hits alongside the reply.
   * The v3.0.1 web UI uses this to show a "📎 sleep journal"
   * source-citation line under each assistant message. Passing
   * `null` (the default) skips the lookup so the offline test
   * suite, which has no RAG index, stays green.
   */
  rag?: RagIndex | null;
}

export interface AskResult {
  agent: RouteAgent;
  reply: string;
}

const ROUTER_SYSTEM = `You are EdgeWell Router. Given a user question, output a single
JSON object with two fields:
- "agent": one of "health", "finance", "lifestyle"
- "reason": one short sentence explaining why

Rules:
- Symptom, sleep, exercise, mood, diet, medication → health
- Money, budget, expense, savings, debt, income, price → finance
- Everything else (habits, productivity, mixed) → lifestyle
- Output only the JSON. No prose, no code fences.`;

const LIFESTYLE_SYSTEM = `You are EdgeWell Lifestyle, a private on-device habits coach.
Help with routines, productivity, and integrating health + finance
recommendations into a sustainable daily plan. Be concise and supportive.`;

const VALID_AGENTS: ReadonlySet<RouteAgent> = new Set(["health", "finance", "lifestyle"]);

function parseRoute(text: string, question = ""): RouteResult {
  const t = (text || "").trim();
  // Be tolerant: strip code fences, find first {...} block.
  const fence = t.match(/\{[\s\S]*?\}/);
  const candidate = fence ? fence[0] : t;
  try {
    const obj = JSON.parse(candidate) as { agent?: unknown; reason?: unknown };
    const agent = String(obj.agent || "").toLowerCase() as RouteAgent;
    if (VALID_AGENTS.has(agent)) {
      return { agent, reason: typeof obj.reason === "string" ? obj.reason : "", domain: null };
    }
  } catch {
    // fall through to keyword fallback
  }
  // Keyword fallback - check the original question, not the model's text.
  const low = (question || "").toLowerCase();
  // v3.0.1: expanded mental-health regex that emits a `domain: "medical"`
  // hint so the `psy` showcase command and future per-call delegate
  // policies can resolve a Psy-family model via pickModel({domain:"medical"}).
  const medicalHint = /anxiety|therapy|panic|mental|psych|depress|insomnia|ptsd/i;
  if (/(symptom|sleep|exercise|diet|medication|pain|stress|mood)/.test(low)) {
    return { agent: "health", reason: "keyword match", domain: medicalHint.test(low) ? "medical" : null };
  }
  if (/(money|budget|expense|saving|debt|income|price|thb|usd|baht)/.test(low)) {
    return { agent: "finance", reason: "keyword match", domain: null };
  }
  return { agent: "lifestyle", reason: "default", domain: null };
}

export class Orchestrator {
  public llm: LLM;
  public health: SpecialistAgent;
  public finance: SpecialistAgent;
  public lifestyle?: SpecialistAgent;
  public rag: RagIndex | null;

  constructor({ llm, health, finance, lifestyle, rag = null }: OrchestratorOptions) {
    this.llm = llm;
    this.health = health;
    this.finance = finance;
    this.lifestyle = lifestyle;
    this.rag = rag;
  }

  async route(question: string): Promise<RouteResult> {
    const text = await this.llm.prompt({
      system: ROUTER_SYSTEM,
      user: question,
      maxTokens: 120,
      temperature: 0,
    });
    return parseRoute(text, question);
  }

  async ask(question: string, history: ChatMessage[] = []): Promise<AskResult> {
    const { agent } = await this.route(question);
    switch (agent) {
      case "health":
        return { agent, reply: await this.health.ask(question, history) };
      case "finance":
        return { agent, reply: await this.finance.ask(question, history) };
      default:
        return {
          agent: "lifestyle",
          reply: await this.llm.prompt({
            system: LIFESTYLE_SYSTEM,
            user: question,
            history,
            maxTokens: 500,
          }),
        };
    }
  }

  async *streamAsk(question: string, history: ChatMessage[] = []): AsyncIterable<string> {
    const { agent } = await this.route(question);
    switch (agent) {
      case "health":
        for await (const tok of this.health.streamAsk(question, history)) yield tok;
        return;
      case "finance":
        for await (const tok of this.finance.streamAsk(question, history)) yield tok;
        return;
      default:
        for await (const tok of this.llm.stream({
          system: LIFESTYLE_SYSTEM,
          user: question,
          history,
          maxTokens: 500,
        })) yield tok;
    }
  }

  /**
   * One-shot reply used by the companion server's POST /chat.
   * Returns a single string; uses the lifestyle system prompt as
   * the default branch so the response is self-contained.
   */
  async handle(question: string, history: ChatMessage[] = []): Promise<string> {
    const { agent, reply } = await this.ask(question, history);
    return `[${agent}] ${reply}`;
  }

  /**
   * Streaming variant of `handle`. Yields structured events the
   * web UI can render progressively: a `route` chip, the top RAG
   * hits as a `context` event, then one `token` event per LLM
   * token, and finally a `done` sentinel. Any thrown error is
   * converted into an `error` event so the client always gets a
   * clean stream tail. Used by `POST /chat/stream` in
   * `src/companion/server.ts`.
   */
  async *streamHandle(
    question: string,
    history: ChatMessage[] = [],
  ): AsyncIterable<StreamEvent> {
    let route: RouteResult;
    try {
      route = await this.route(question);
    } catch (err) {
      yield { type: "error", message: (err as Error).message };
      yield { type: "done" };
      return;
    }
    yield {
      type: "route",
      agent: route.agent,
      reason: route.reason,
      domain: route.domain,
    };
    // Emit the RAG context block as its own event so the UI can
    // show source citations without re-running search(). Only
    // health and finance use the index today; lifestyle is LLM-only.
    if (this.rag && (route.agent === "health" || route.agent === "finance")) {
      try {
        const hits = await this.rag.search(question, 3);
        if (hits.length > 0) yield { type: "context", hits };
      } catch {
        // RAG lookup is best-effort; never fail the whole stream.
      }
    }
    try {
      switch (route.agent) {
        case "health":
          for await (const tok of this.health.streamAsk(question, history)) {
            yield { type: "token", text: tok };
          }
          break;
        case "finance":
          for await (const tok of this.finance.streamAsk(question, history)) {
            yield { type: "token", text: tok };
          }
          break;
        default:
          for await (const tok of this.llm.stream({
            system: LIFESTYLE_SYSTEM,
            user: question,
            history,
            maxTokens: 500,
          })) {
            yield { type: "token", text: tok };
          }
      }
    } catch (err) {
      yield { type: "error", message: (err as Error).message };
    }
    yield { type: "done" };
  }
}
