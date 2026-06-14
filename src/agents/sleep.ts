// @ts-nocheck
// Sleep agent. Analyses journal entries and wearable sleep events
// and returns a short, actionable summary. v3.0.0 keeps this offline
// and rule-based; the LLM is only consulted for the final phrasing
// if the caller provides one.

const SEVERE = 5; // hours
const SHORT = 6.5;
const LONG = 9.5;

function totalHours(events) {
  if (events.length === 0) return 0;
  // Each event is { kind: "sleep_phase", phase, ts, value } where
  // value is the minutes spent in that phase. We assume contiguous
  // events for one night form the total sleep.
  return events.reduce((s, e) => s + Number(e.value ?? 0), 0) / 60;
}

function average(xs) {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export class SleepAgent {
  constructor({ llm = null, profile = null } = {}) {
    this.llm = llm;
    this.profile = profile;
  }

  summarise(events) {
    const total = totalHours(events);
    const avg = average(events.length ? [total] : []);
    let verdict = "normal";
    if (total < SEVERE) verdict = "severely sleep-deprived";
    else if (total < SHORT) verdict = "short";
    else if (total > LONG) verdict = "long";
    return {
      events: events.length,
      totalHours: Number(total.toFixed(2)),
      averageHours: Number(avg.toFixed(2)),
      verdict,
    };
  }

  async advise(events) {
    const s = this.summarise(events);
    const base = `You slept ${s.totalHours}h across ${s.events} phase entries. That is ${s.verdict}. `;
    const tip =
      s.verdict === "short"
        ? "Try going to bed 30 minutes earlier this week."
        : s.verdict === "long"
        ? "Oversleeping can be a sign of poor sleep quality. Aim for 7–9h."
        : s.verdict === "severely sleep-deprived"
        ? "Please prioritise rest — under five hours is harmful."
        : "Keep the same bedtime and wake-up routine.";
    if (this.llm) {
      try {
        const out = await this.llm.complete({ prompt: base + tip, maxTokens: 80 });
        return String(out).trim();
      } catch {
        // fall through to local phrasing
      }
    }
    return base + tip;
  }
}
