// FinanceAgent: budgeting advice, spending trends, and savings plans
// over the user's expenses JSONL.

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

export class FinanceAgent {
  constructor({ llm, rag, profile, expenses }) {
    this.llm = llm;
    this.rag = rag;
    this.profile = profile;
    this.expenses = expenses;
  }

  _summary(expenses) {
    if (!expenses || expenses.length === 0) return "No expenses recorded yet.";
    const byCat = new Map();
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

  async _ctx(question) {
    if (!this.rag) return "";
    return this.rag.contextBlock(question, 3);
  }

  async ask(question, history = []) {
    const expenses = this.expenses ? await this.expenses.readAll() : [];
    const summary = this._summary(expenses);
    const ragCtx = await this._ctx(question);
    const user = `User expense summary:\n${summary}\n\n${ragCtx ? `Notes:\n${ragCtx}\n\n` : ""}Question: ${question}`;
    return this.llm.prompt({ system: SYSTEM, user, history });
  }

  async *streamAsk(question, history = []) {
    const expenses = this.expenses ? await this.expenses.readAll() : [];
    const summary = this._summary(expenses);
    const ragCtx = await this._ctx(question);
    const user = `User expense summary:\n${summary}\n\n${ragCtx ? `Notes:\n${ragCtx}\n\n` : ""}Question: ${question}`;
    for await (const tok of this.llm.stream({ system: SYSTEM, user, history })) {
      yield tok;
    }
  }

  async monthlyPlan({ income, savingsPct = 20 } = {}) {
    const inc = income ?? this.profile?.baseline?.monthlyIncome ?? 0;
    const target = (inc * savingsPct) / 100;
    const user = `Income: ${inc}. Target monthly savings: ${target.toFixed(2)} (${savingsPct}%). Suggest a category budget in percentages of income.`;
    return this.llm.prompt({ system: SYSTEM, user, maxTokens: 400 });
  }
}
