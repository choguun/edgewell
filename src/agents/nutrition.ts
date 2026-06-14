// @ts-nocheck
// Nutrition agent. Groups journal entries tagged "meal" or "food" and
// reports simple stats: total meals, distribution across categories,
// and a quick "are you eating regularly?" verdict.

const RECOMMENDED_MEALS_PER_DAY = 3;
const MIN_DAYS = 3;

function isoDay(ts) {
  return new Date(ts).toISOString().slice(0, 10);
}

export class NutritionAgent {
  constructor({ llm = null, profile = null } = {}) {
    this.llm = llm;
    this.profile = profile;
  }

  summarise(entries) {
    const foodEntries = entries.filter((e) => {
      const tags = e.tags ?? [];
      const cat = e.category ?? "";
      return tags.includes("meal") || tags.includes("food") || cat === "food";
    });
    const byDay = new Map();
    for (const e of foodEntries) {
      const day = isoDay(e._ts ?? e.ts ?? Date.now());
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }
    const days = byDay.size;
    const avgPerDay = days === 0 ? 0 : foodEntries.length / days;
    let verdict = "no data";
    if (days === 0) verdict = "no data";
    else if (days < MIN_DAYS) verdict = "not enough days logged";
    else if (avgPerDay < 1) verdict = "under-eating";
    else if (avgPerDay < RECOMMENDED_MEALS_PER_DAY - 0.5) verdict = "irregular";
    else if (avgPerDay > RECOMMENDED_MEALS_PER_DAY + 2) verdict = "over-snacking";
    else verdict = "regular";
    return {
      meals: foodEntries.length,
      days,
      avgPerDay: Number(avgPerDay.toFixed(2)),
      verdict,
    };
  }

  async advise(entries) {
    const s = this.summarise(entries);
    const base = `Logged ${s.meals} meals over ${s.days} day(s) — pattern looks ${s.verdict}.`;
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
