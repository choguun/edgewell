// Multi-agent orchestrator: routes user questions to the right specialist
// (health, finance, or a general/lifestyle one) and can chain them.

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

function parseRoute(text) {
  const t = (text || "").trim();
  // Be tolerant: strip code fences, find first {...} block.
  const fence = t.match(/\{[\s\S]*?\}/);
  const candidate = fence ? fence[0] : t;
  try {
    const obj = JSON.parse(candidate);
    const agent = String(obj.agent || "").toLowerCase();
    if (["health", "finance", "lifestyle"].includes(agent)) {
      return { agent, reason: obj.reason ?? "" };
    }
  } catch {}
  // Keyword fallback.
  const low = t.toLowerCase();
  if (/(symptom|sleep|exercise|diet|medication|pain|stress|mood)/.test(low)) {
    return { agent: "health", reason: "keyword match" };
  }
  if (/(money|budget|expense|saving|debt|income|price|thb|usd|baht)/.test(low)) {
    return { agent: "finance", reason: "keyword match" };
  }
  return { agent: "lifestyle", reason: "default" };
}

export class Orchestrator {
  constructor({ llm, health, finance, lifestyle }) {
    this.llm = llm;
    this.health = health;
    this.finance = finance;
    this.lifestyle = lifestyle;
  }

  async route(question) {
    const text = await this.llm.prompt({
      system: ROUTER_SYSTEM,
      user: question,
      maxTokens: 120,
      temperature: 0,
    });
    return parseRoute(text);
  }

  async ask(question, history = []) {
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

  async *streamAsk(question, history = []) {
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
}
