// @ts-nocheck
// Hydration agent. Looks at expense or journal entries tagged with
// a "hydration" or "water" tag and estimates daily water intake in
// litres. The user is encouraged to log purchases of bottled water,
// refills, or use sensor data.

const LITERS_PER_DAY_GOAL = 2.0;
const MIN_DAYS = 2;

function isoDay(ts) {
  return new Date(ts).toISOString().slice(0, 10);
}

function parseLiters(text) {
  if (typeof text !== "string") return null;
  // Match patterns like "500ml", "1.5L", "2 liters".
  const ml = text.match(/(\d+(?:\.\d+)?)\s*ml/i);
  if (ml) return Number(ml[1]) / 1000;
  const l = text.match(/(\d+(?:\.\d+)?)\s*(?:l|liter|litre)/i);
  if (l) return Number(l[1]);
  return null;
}

export class HydrationAgent {
  constructor({ llm = null, profile = null } = {}) {
    this.llm = llm;
    this.profile = profile;
  }

  summarise(entries) {
    const water = entries.filter((e) => {
      const tags = e.tags ?? [];
      const cat = e.category ?? "";
      return tags.includes("hydration") || tags.includes("water") || cat === "hydration";
    });
    const byDay = new Map();
    for (const e of water) {
      const liters = Number(e.amount ?? parseLiters(e.text ?? e.note ?? "") ?? 0);
      if (!liters) continue;
      const day = isoDay(e._ts ?? e.ts ?? Date.now());
      byDay.set(day, (byDay.get(day) ?? 0) + liters);
    }
    const days = byDay.size;
    const total = [...byDay.values()].reduce((a, b) => a + b, 0);
    const avgPerDay = days === 0 ? 0 : total / days;
    let verdict = "no data";
    if (days === 0) verdict = "no data";
    else if (days < MIN_DAYS) verdict = "not enough days logged";
    else if (avgPerDay < 1.0) verdict = "low";
    else if (avgPerDay < LITERS_PER_DAY_GOAL) verdict = "below goal";
    else if (avgPerDay > 4.0) verdict = "very high";
    else verdict = "on target";
    return {
      entries: water.length,
      days,
      avgPerDay: Number(avgPerDay.toFixed(2)),
      verdict,
    };
  }

  async advise(entries) {
    const s = this.summarise(entries);
    const base = `Average ${s.avgPerDay} L/day of water over ${s.days} day(s) — verdict: ${s.verdict}.`;
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
