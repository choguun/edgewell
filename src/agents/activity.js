// Activity agent. Counts steps from sensor events and rates daily
// activity vs. a configurable goal (default 8,000 steps/day).

const DEFAULT_STEP_GOAL = 8000;

function isoDay(ts) {
  return new Date(ts).toISOString().slice(0, 10);
}

export class ActivityAgent {
  constructor({ llm = null, profile = null, stepGoal = DEFAULT_STEP_GOAL } = {}) {
    this.llm = llm;
    this.profile = profile;
    this.stepGoal = stepGoal;
  }

  summarise(events) {
    const steps = events.filter((e) => e.kind === "steps");
    const byDay = new Map();
    for (const e of steps) {
      const day = isoDay(e.ts);
      byDay.set(day, (byDay.get(day) ?? 0) + Number(e.value ?? 0));
    }
    const days = byDay.size;
    const total = [...byDay.values()].reduce((a, b) => a + b, 0);
    const avgPerDay = days === 0 ? 0 : total / days;
    let verdict = "no data";
    if (days === 0) verdict = "no data";
    else if (avgPerDay < this.stepGoal * 0.5) verdict = "sedentary";
    else if (avgPerDay < this.stepGoal) verdict = "below goal";
    else if (avgPerDay < this.stepGoal * 1.5) verdict = "active";
    else verdict = "very active";
    return {
      events: steps.length,
      days,
      totalSteps: total,
      avgPerDay: Math.round(avgPerDay),
      goal: this.stepGoal,
      verdict,
    };
  }

  async advise(events) {
    const s = this.summarise(events);
    const base = `Avg ${s.avgPerDay} steps/day over ${s.days} day(s) — verdict: ${s.verdict} (goal ${s.goal}).`;
    if (this.llm) {
      try {
        const out = await this.llm.complete({ prompt: base, maxTokens: 60 });
        return String(out).trim();
      } catch {
        // fall back
      }
    }
    return base;
  }
}
