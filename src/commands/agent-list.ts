// @ts-nocheck
// `edgewell agent-list` lists the v3.0.0 agents with a short
// description each. Sibling to the `agents` command but with a
// slightly different focus (a "what is this?" list rather than
// the `agents` command's "what do I have?" list).

import { c, header } from "../cli.js";

const AGENTS = [
  { name: "health", description: "Symptom reflection and 7-day plans. Never a diagnosis." },
  { name: "finance", description: "Budget breakdowns, savings tips, expense insights." },
  { name: "sleep", description: "Sleep phase aggregator with a verdict (short / normal / long)." },
  { name: "nutrition", description: "Meal frequency and regularity." },
  { name: "hydration", description: "Daily water intake, parsed from `ml` or `L` units." },
  { name: "activity", description: "Steps per day with a goal-based verdict." },
];

export async function agentListCommand(_args) {
  header("Agent list");
  for (const a of AGENTS) {
    console.log(`  ${c.cyan(a.name.padEnd(12))} ${a.description}`);
  }
}
