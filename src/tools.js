// Tool calling layer. Each tool is a small named function with a JSON
// schema describing its parameters. Agents can list tools, render
// them in a system prompt, and parse the model's <tool>...</tool>
// output back into a tool call.

import { validateRecord } from "./schema.js";

const TOOLS = {
  calculator: {
    description: "Evaluate a basic arithmetic expression. Supports + - * / and parentheses.",
    params: {
      type: "object",
      required: ["expression"],
      properties: { expression: { type: "string", minLength: 1, maxLength: 200 } },
    },
    run({ expression }) {
      // Strict whitelist: digits, whitespace, parens, and the four
      // basic operators. The comma operator is intentionally excluded
      // because `(1,2)` returning `2` is surprising for a calculator.
      if (!/^[\d\s+\-*/().]+$/.test(expression)) {
        throw new Error("expression has disallowed characters");
      }
      if (expression.replace(/[\s]/g, "").length === 0) {
        throw new Error("expression is empty");
      }
      // eslint-disable-next-line no-new-func
      const fn = new Function(`"use strict"; return (${expression});`);
      const result = fn();
      if (typeof result !== "number" || !Number.isFinite(result)) {
        throw new Error("expression did not evaluate to a finite number");
      }
      return { result };
    },
  },

  datetime: {
    description: "Get the current local date and time in ISO 8601.",
    params: { type: "object", properties: {} },
    run() {
      return { iso: new Date().toISOString(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone };
    },
  },

  search_kb: {
    description: "Search the user's local RAG index for a query and return the top hits.",
    params: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string", minLength: 1, maxLength: 500 },
        topK: { type: "integer", minimum: 1, maximum: 10 },
      },
    },
    async run({ query, topK = 4 }, ctx) {
      const rag = ctx?.rag;
      if (!rag) return { hits: [] };
      const hits = await rag.search(query, topK);
      return { hits: hits.map((h) => ({ text: h.text, source: h.source, score: h.score })) };
    },
  },

  add_expense: {
    description: "Append a single expense to the user's local expense log.",
    params: {
      type: "object",
      required: ["amount", "category"],
      properties: {
        amount: { type: "number", minimum: 0 },
        category: { type: "string", minLength: 1, maxLength: 64 },
        note: { type: "string", maxLength: 500 },
      },
    },
    async run({ amount, category, note }, ctx) {
      const store = ctx?.expenses;
      if (!store) throw new Error("expense store not configured");
      const rec = { kind: "expense", amount, category, note };
      await store.append(rec);
      return { ok: true };
    },
  },

  add_journal: {
    description: "Append a single journal entry to the user's local journal.",
    params: {
      type: "object",
      required: ["text"],
      properties: {
        text: { type: "string", minLength: 1, maxLength: 8000 },
        mood: { type: "string", enum: ["great", "good", "okay", "low", "bad"] },
      },
    },
    async run({ text, mood }, ctx) {
      const store = ctx?.journal;
      if (!store) throw new Error("journal store not configured");
      const rec = { kind: "journal", text, mood };
      await store.append(rec);
      return { ok: true };
    },
  },
};

export class ToolRegistry {
  constructor(tools = TOOLS) {
    this.tools = { ...tools };
  }

  register(name, def) {
    this.tools[name] = def;
  }

  list() {
    return Object.entries(this.tools).map(([name, t]) => ({
      name,
      description: t.description,
      params: t.params,
    }));
  }

  // Render the tool catalog as a block to embed in a system prompt.
  describeForPrompt() {
    return this.list()
      .map((t) => {
        const params = JSON.stringify(t.params);
        return `- ${t.name}: ${t.description}\n  params: ${params}`;
      })
      .join("\n");
  }

  async call(name, params, ctx) {
    const t = this.tools[name];
    if (!t) throw new Error(`unknown tool: ${name}`);
    validateRecord(params, t.params);
    return t.run(params, ctx);
  }
}
