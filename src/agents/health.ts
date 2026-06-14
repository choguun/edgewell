// HealthAgent: answers symptom / wellness questions and produces
// short actionable plans. Uses RAG over the user's notes + a clear
// medical disclaimer in the system prompt.

import type { ChatMessage, LLM } from "../llm-types.js";
import type { RagIndex } from "../rag.js";
import type { ProfileStore } from "../profile.js";

const SYSTEM = `You are EdgeWell Health, a private on-device wellness coach.
You help with symptom triage, lifestyle advice, and trend analysis from
the user's own journal entries and wearables.

Rules:
- Be calm, supportive, and concise. Prefer bullet points and short steps.
- Always include a brief non-diagnostic disclaimer at the end of medical replies:
  "Note: I'm an AI, not a doctor. For urgent or severe symptoms, contact a
  licensed clinician or local emergency services."
- When the user mentions a possible emergency (chest pain, stroke signs,
  severe bleeding, suicidal thoughts), tell them to seek immediate help
  before any other advice.
- Use the provided context from the user's notes when relevant.`;

export interface HealthAgentOptions {
  llm: LLM;
  rag?: RagIndex | null;
  profile?: ProfileStore | null;
}

export class HealthAgent {
  public llm: LLM;
  public rag: RagIndex | null;
  public profile: ProfileStore | null;

  constructor({ llm, rag = null, profile = null }: HealthAgentOptions) {
    this.llm = llm;
    this.rag = rag;
    this.profile = profile;
  }

  private async _ctx(query: string): Promise<string> {
    if (!this.rag) return "";
    return this.rag.contextBlock(query, 4);
  }

  async ask(question: string, history: ChatMessage[] = []): Promise<string> {
    const ctx = await this._ctx(question);
    const userBlock = ctx
      ? `User notes (top matches):\n${ctx}\n\nQuestion: ${question}`
      : question;
    return this.llm.prompt({ system: SYSTEM, user: userBlock, history });
  }

  async *streamAsk(question: string, history: ChatMessage[] = []): AsyncIterable<string> {
    const ctx = await this._ctx(question);
    const userBlock = ctx
      ? `User notes (top matches):\n${ctx}\n\nQuestion: ${question}`
      : question;
    for await (const tok of this.llm.stream({ system: SYSTEM, user: userBlock, history })) {
      yield tok;
    }
  }

  /** Generate a 7-day plan from a goal string. */
  async plan(goal: string): Promise<string> {
    const user = `Create a 7-day plan for: "${goal}". Output as a numbered list, one short bullet per day.`;
    return this.llm.prompt({ system: SYSTEM, user, maxTokens: 600 });
  }
}
