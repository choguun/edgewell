// Hydration agent. Looks at expense or journal entries tagged with
// a "hydration" or "water" tag and estimates daily water intake in
// litres. The user is encouraged to log purchases of bottled water,
// refills, or use sensor data.

import type { LLM } from "../llm-types.js";
import type { ProfileStore } from "../profile.js";

const LITERS_PER_DAY_GOAL = 2.0;
const MIN_DAYS = 2;

function isoDay(ts: string | number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

function parseLiters(text: string | undefined | null): number | null {
  if (typeof text !== "string") return null;
  // Match patterns like "500ml", "1.5L", "2 liters".
  const ml = text.match(/(\d+(?:\.\d+)?)\s*ml/i);
  if (ml) return Number(ml[1]) / 1000;
  const l = text.match(/(\d+(?:\.\d+)?)\s*(?:l|liter|litre)/i);
  if (l) return Number(l[1]);
  return null;
}

export interface HydrationEntry {
  tags?: string[];
  category?: string;
  amount?: number;
  text?: string;
  note?: string;
  _ts?: string;
  ts?: string;
}

export interface HydrationSummary {
  entries: number;
  days: number;
  avgPerDay: number;
  verdict: string;
}

export interface HydrationAgentOptions {
  llm?: (LLM & { complete?(opts: { prompt: string; maxTokens?: number }): Promise<unknown> | unknown }) | null;
  profile?: ProfileStore | null;
}

export class HydrationAgent {
  public llm: HydrationAgentOptions["llm"];
  public profile: ProfileStore | null;

  constructor({ llm = null, profile = null }: HydrationAgentOptions = {}) {
    this.llm = llm;
    this.profile = profile;
  }

  summarise(entries: HydrationEntry[]): HydrationSummary {
    const water = entries.filter((e) => {
      const tags = e.tags ?? [];
      const cat = e.category ?? "";
      return tags.includes("hydration") || tags.includes("water") || cat === "hydration";
    });
    const byDay = new Map<string, number>();
    for (const e of water) {
      const liters = Number(
        e.amount ?? parseLiters(e.text ?? e.note ?? "") ?? 0,
      );
      if (!liters) continue;
      const ts = e._ts ?? e.ts ?? String(Date.now());
      const day = isoDay(ts);
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

  async advise(entries: HydrationEntry[]): Promise<string> {
    const s = this.summarise(entries);
    const base = `Average ${s.avgPerDay} L/day of water over ${s.days} day(s) — verdict: ${s.verdict}.`;
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
