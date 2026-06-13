// Prompt templates. v3.0.0 keeps a small library of canned
// prompts for common agent flows. Each template is a function
// that takes a context object and returns a string the LLM can
// complete.
//
// The templates intentionally avoid f-string interpolation so
// callers can layer in additional rules without re-parsing.

export const TEMPLATES = {
  health: ({ question, journal = [], ragContext = "" }) => `
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

  finance: ({ question, expenses = [], ragContext = "" }) => `
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

  sleep: ({ events = [] }) => {
    const total = events.reduce((s, e) => s + Number(e.value ?? 0), 0) / 60;
    return `The user logged ${events.length} sleep events totalling ${total.toFixed(2)} hours. Give a one-sentence verdict.`;
  },
};

export function renderTemplate(name, ctx) {
  const fn = TEMPLATES[name];
  if (!fn) throw new Error(`unknown template: ${name}`);
  return fn(ctx);
}
