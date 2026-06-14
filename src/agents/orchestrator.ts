// Multi-agent orchestrator: routes user questions to the right specialist
// (health, finance, or a general/lifestyle one) and can chain them.

export type RouteAgent = "health" | "finance" | "lifestyle";

export interface RouteResult {
  agent: RouteAgent;
  reason: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface PromptInput {
  system?: string;
  user: string;
  history?: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface LLM {
  prompt(input: PromptInput): Promise<string>;
  stream(input: PromptInput): AsyncIterable<string>;
}

export interface SpecialistAgent {
  ask(question: string, history?: ChatMessage[]): Promise<string>;
  streamAsk(question: string, history?: ChatMessage[]): AsyncIterable<string>;
}

export interface OrchestratorOptions {
  llm: LLM;
  health: SpecialistAgent;
  finance: SpecialistAgent;
  lifestyle?: SpecialistAgent;
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
      return { agent, reason: typeof obj.reason === "string" ? obj.reason : "" };
    }
  } catch {
    // fall through to keyword fallback
  }
  // Keyword fallback - check the original question, not the model's text.
  const low = (question || "").toLowerCase();
  if (/(symptom|sleep|exercise|diet|medication|pain|stress|mood)/.test(low)) {
    return { agent: "health", reason: "keyword match" };
  }
  if (/(money|budget|expense|saving|debt|income|price|thb|usd|baht)/.test(low)) {
    return { agent: "finance", reason: "keyword match" };
  }
  return { agent: "lifestyle", reason: "default" };
}

export class Orchestrator {
  public llm: LLM;
  public health: SpecialistAgent;
  public finance: SpecialistAgent;
  public lifestyle?: SpecialistAgent;

  constructor({ llm, health, finance, lifestyle }: OrchestratorOptions) {
    this.llm = llm;
    this.health = health;
    this.finance = finance;
    this.lifestyle = lifestyle;
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
}
