// Prompt templates. v3.0.0 keeps a small library of canned
// prompts for common agent flows. Each template is a function
// that takes a context object and returns a string the LLM can
// complete.
//
// The templates intentionally avoid f-string interpolation so
// callers can layer in additional rules without re-parsing.

export interface JournalEntryLike {
  _ts?: string;
  text?: string;
  tags?: string[];
  kind?: string;
  value?: number;
  category?: string;
  ts?: string;
  amount?: number;
}

export interface HealthCtx {
  question: string;
  journal?: JournalEntryLike[];
  ragContext?: string;
}

export interface FinanceCtx {
  question: string;
  expenses?: JournalEntryLike[];
  ragContext?: string;
}

export interface SleepCtx {
  events?: JournalEntryLike[];
}

export interface NutritionCtx {
  entries?: JournalEntryLike[];
}

export interface HydrationCtx {
  entries?: JournalEntryLike[];
}

export interface ActivityCtx {
  events?: JournalEntryLike[];
}

export type TemplateName = "health" | "finance" | "sleep" | "nutrition" | "hydration" | "activity";
export type TemplateCtx = HealthCtx | FinanceCtx | SleepCtx | NutritionCtx | HydrationCtx | ActivityCtx;

/**
 * Map of template name -> renderer. Each renderer takes a
 * narrow context type but we surface the union on the lookup so
 * callers don't have to know which template expects what.
 * `renderTemplate` validates the name and casts at the boundary.
 */
export const TEMPLATES = {
  health: ({ question, journal = [], ragContext = "" }: HealthCtx) => `
You are EdgeWell Health, a private on-device health coach.
You help the user reflect on their wellness. Be concise, evidence-
based, and never provide a diagnosis. Always suggest seeing a
licensed clinician for serious or persistent symptoms.

The user asked: "${question}"

Recent journal entries:
${journal.slice(-5).map((e) => `- ${e._ts} ${e.text}`).join("\n") || "(none)"}

Relevant context from the user's notes:
${ragContext || "(none)"}

Reply in 2-4 sentences.
`.trim(),

  finance: ({ question, expenses = [], ragContext = "" }: FinanceCtx) => `
You are EdgeWell Finance, a private on-device finance coach.
You help the user understand their spending and savings. Be
practical and non-judgmental.

The user asked: "${question}"

Recent expenses (last 10):
${expenses.slice(-10).map((e) => `- ${e._ts} ${e.category} ${e.amount}`).join("\n") || "(none)"}

Relevant context from the user's notes:
${ragContext || "(none)"}

Reply in 2-4 sentences.
`.trim(),

  sleep: ({ events = [] }: SleepCtx) => {
    const total = events.reduce((s, e) => s + Number(e.value ?? 0), 0) / 60;
    return `The user logged ${events.length} sleep events totalling ${total.toFixed(2)} hours. Give a one-sentence verdict.`;
  },

  nutrition: ({ entries = [] }: NutritionCtx) => {
    const mealEntries = entries.filter((e) => {
      const tags = e.tags ?? [];
      return tags.includes("meal") || tags.includes("food") || e.category === "food";
    });
    const days = new Set(mealEntries.map((e) => (e._ts ?? "").slice(0, 10))).size;
    return `The user logged ${mealEntries.length} meal/food entries across ${days} days. Give a one-sentence verdict.`;
  },

  hydration: ({ entries = [] }: HydrationCtx) => {
    const waterEntries = entries.filter((e) => {
      const t = (e.text ?? "").toLowerCase();
      return /(\d+(?:\.\d+)?\s*(?:ml|l|liter|litre))/.test(t) ||
        (e.tags ?? []).some((tag) => ["hydration", "water"].includes(tag));
    });
    return `The user logged ${waterEntries.length} water/hydration entries. Give a one-sentence verdict on whether they are on track.`;
  },

  activity: ({ events = [] }: ActivityCtx) => {
    const steps = events.filter((e) => e.kind === "steps");
    const total = steps.reduce((s, e) => s + Number(e.value ?? 0), 0);
    const days = new Set(steps.map((e) => (e.ts ?? "").slice(0, 10))).size;
    return `The user logged ${steps.length} step events totalling ${total} steps across ${days} days. Give a one-sentence verdict against an 8,000-steps-per-day goal.`;
  },
};

export function renderTemplate(name: string, ctx: TemplateCtx): string {
  const fn = TEMPLATES[name as TemplateName];
  if (!fn) throw new Error(`unknown template: ${name}`);
  return (fn as (ctx: TemplateCtx) => string)(ctx);
}
