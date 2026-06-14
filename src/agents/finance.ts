// FinanceAgent: budgeting advice, spending trends, and savings plans
// over the user's expenses JSONL.

import type { ChatMessage, LLM } from "../llm-types.js";
import type { RagIndex } from "../rag.js";
import type { ProfileStore } from "../profile.js";
import type { JsonlStore } from "../store.js";

const SYSTEM = `You are EdgeWell Finance, a private on-device personal finance coach.
You help with budgeting, expense trends, savings plans, and simple forecasting
based on the user's own data.

Rules:
- Be concrete: cite numbers from the user's data when possible.
- Use short, scannable responses. Use bullet points for steps.
- Do not give specific investment product recommendations (no "buy X ticker").
- Frame savings advice in terms of percent of income, fixed categories, and
  time horizons (1, 3, 12 months).
- Always close with a one-line disclaimer: "Note: not financial advice."`;

export interface FinanceAgentOptions {
  llm: LLM;
  rag?: RagIndex | null;
  profile?: ProfileStore | null;
  expenses?: JsonlStore | null;
}

export interface ExpenseLike {
  category?: string;
  amount?: number;
  _ts?: string;
}

export interface MonthlyPlanOptions {
  income?: number;
  savingsPct?: number;
}

export class FinanceAgent {
  public llm: LLM;
  public rag: RagIndex | null;
  public profile: ProfileStore | null;
  public expenses: JsonlStore | null;

  constructor({ llm, rag = null, profile = null, expenses = null }: FinanceAgentOptions) {
    this.llm = llm;
    this.rag = rag;
    this.profile = profile;
    this.expenses = expenses;
  }

  private _summary(expenses: ExpenseLike[]): string {
    if (!expenses || expenses.length === 0) return "No expenses recorded yet.";
    const byCat = new Map<string, number>();
    let total = 0;
    for (const e of expenses) {
      const c = e.category ?? "other";
      byCat.set(c, (byCat.get(c) ?? 0) + Number(e.amount ?? 0));
      total += Number(e.amount ?? 0);
    }
    const cats = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
    return [
      `Total entries: ${expenses.length}`,
      `Total spend: ${total.toFixed(2)}`,
      "By category:",
      ...cats.map(([c, v]) => `  - ${c}: ${v.toFixed(2)}`),
    ].join("\n");
  }

  private async _ctx(question: string): Promise<string> {
    if (!this.rag) return "";
    return this.rag.contextBlock(question, 3);
  }

  async ask(question: string, history: ChatMessage[] = []): Promise<string> {
    const expenses: ExpenseLike[] = this.expenses ? await this.expenses.readAll() : [];
    const summary = this._summary(expenses);
    const ragCtx = await this._ctx(question);
    const user = `User expense summary:\n${summary}\n\n${ragCtx ? `Notes:\n${ragCtx}\n\n` : ""}Question: ${question}`;
    return this.llm.prompt({ system: SYSTEM, user, history });
  }

  async *streamAsk(question: string, history: ChatMessage[] = []): AsyncIterable<string> {
    const expenses: ExpenseLike[] = this.expenses ? await this.expenses.readAll() : [];
    const summary = this._summary(expenses);
    const ragCtx = await this._ctx(question);
    const user = `User expense summary:\n${summary}\n\n${ragCtx ? `Notes:\n${ragCtx}\n\n` : ""}Question: ${question}`;
    for await (const tok of this.llm.stream({ system: SYSTEM, user, history })) {
      yield tok;
    }
  }

  async monthlyPlan({ income, savingsPct = 20 }: MonthlyPlanOptions = {}): Promise<string> {
    // The profile baseline might be `monthlyIncome: 0` by default;
    // fall back to whatever was passed in, then 0.
    const baseline = (await this.profile?.load())?.baseline;
    const inc = income ?? baseline?.monthlyIncome ?? 0;
    const target = (inc * savingsPct) / 100;
    const user = `Income: ${inc}. Target monthly savings: ${target.toFixed(2)} (${savingsPct}%). Suggest a category budget in percentages of income.`;
    return this.llm.prompt({ system: SYSTEM, user, maxTokens: 400 });
  }
}
