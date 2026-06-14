// Nutrition agent. Groups journal entries tagged "meal" or "food" and
// reports simple stats: total meals, distribution across categories,
// and a quick "are you eating regularly?" verdict.

import type { LLM } from "../llm-types.js";
import type { ProfileStore } from "../profile.js";

const RECOMMENDED_MEALS_PER_DAY = 3;
const MIN_DAYS = 3;

function isoDay(ts: string | number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export interface NutritionEntry {
  tags?: string[];
  category?: string;
  _ts?: string;
  ts?: string;
}

export interface NutritionSummary {
  meals: number;
  days: number;
  avgPerDay: number;
  verdict: string;
}

export interface NutritionAgentOptions {
  llm?: (LLM & { complete?(opts: { prompt: string; maxTokens?: number }): Promise<unknown> | unknown }) | null;
  profile?: ProfileStore | null;
}

export class NutritionAgent {
  public llm: NutritionAgentOptions["llm"];
  public profile: ProfileStore | null;

  constructor({ llm = null, profile = null }: NutritionAgentOptions = {}) {
    this.llm = llm;
    this.profile = profile;
  }

  summarise(entries: NutritionEntry[]): NutritionSummary {
    const foodEntries = entries.filter((e) => {
      const tags = e.tags ?? [];
      const cat = e.category ?? "";
      return tags.includes("meal") || tags.includes("food") || cat === "food";
    });
    const byDay = new Map<string, number>();
    for (const e of foodEntries) {
      const ts = e._ts ?? e.ts ?? String(Date.now());
      const day = isoDay(ts);
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

  async advise(entries: NutritionEntry[]): Promise<string> {
    const s = this.summarise(entries);
    const base = `Logged ${s.meals} meals over ${s.days} day(s) — pattern looks ${s.verdict}.`;
    if (this.llm?.complete) {
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
