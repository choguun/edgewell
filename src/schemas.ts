// @ts-nocheck
// Schemas for our own data records. Used by JsonlStore and the
// encryption layer to validate before writing.

export const JOURNAL_SCHEMA = {
  type: "object",
  required: ["kind", "text"],
  properties: {
    kind: { type: "string", enum: ["journal"] },
    text: { type: "string", minLength: 1, maxLength: 8000 },
    mood: { type: "string", enum: ["great", "good", "okay", "low", "bad"] },
    tags: { type: "array", items: { type: "string", minLength: 1, maxLength: 32 }, maxItems: 16 },
    _ts: { type: "string" },
  },
};

export const EXPENSE_SCHEMA = {
  type: "object",
  required: ["kind", "amount", "category"],
  properties: {
    kind: { type: "string", enum: ["expense"] },
    amount: { type: "number", minimum: 0, maximum: 1_000_000_000 },
    category: { type: "string", minLength: 1, maxLength: 64 },
    note: { type: "string", maxLength: 500 },
    currency: { type: "string", enum: ["THB", "USD", "EUR", "JPY", "GBP", "SGD", "MYR"] },
    _ts: { type: "string" },
  },
};

export const RAG_CHUNK_SCHEMA = {
  type: "object",
  required: ["id", "source", "text", "tokens", "tf"],
  properties: {
    id: { type: "string", minLength: 1 },
    source: { type: "string", minLength: 1 },
    text: { type: "string", minLength: 1 },
    tokens: { type: "array", items: { type: "string" } },
    tf: { type: "array" }, // array of [term, weight]
  },
};

export const PROFILE_SCHEMA = {
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string", minLength: 1, maxLength: 64 },
    language: { type: "string", enum: ["en", "th", "ja", "es", "fr", "de", "zh"] },
    goals: {
      type: "object",
      properties: {
        health: { type: "array", items: { type: "string", minLength: 1, maxLength: 200 } },
        finance: { type: "array", items: { type: "string", minLength: 1, maxLength: 200 } },
      },
    },
    baseline: {
      type: "object",
      properties: {
        sleepHours: { type: "number", minimum: 0, maximum: 24 },
        stepsPerDay: { type: "integer", minimum: 0, maximum: 200_000 },
        monthlyIncome: { type: "number", minimum: 0, maximum: 1_000_000_000 },
        monthlySavings: { type: "number", minimum: 0, maximum: 1_000_000_000 },
      },
    },
    createdAt: { type: "string" },
  },
};
