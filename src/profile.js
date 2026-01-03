// User profile: small JSON file with health + finance baseline.
// Used by agents to personalize advice.

import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_PROFILE = {
  name: "friend",
  language: "en",
  goals: {
    health: ["sleep 7+ hours", "walk 8k steps", "drink 2L water"],
    finance: ["save 20% of income", "build 6-month emergency fund"],
  },
  baseline: {
    sleepHours: 7,
    stepsPerDay: 6000,
    monthlyIncome: 0,
    monthlySavings: 0,
  },
  createdAt: null,
};

export class ProfileStore {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async load() {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_PROFILE };
    }
  }

  async save(profile) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const next = { ...profile, createdAt: profile.createdAt ?? new Date().toISOString() };
    await fs.writeFile(this.filePath, JSON.stringify(next, null, 2));
    return next;
  }

  async update(patch) {
    const cur = await this.load();
    const next = { ...cur, ...patch };
    return this.save(next);
  }
}
