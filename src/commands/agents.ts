// @ts-nocheck
// `edgewell agents` lists the v3.0.0 agent bundle. v3.0.0 keeps this
// read-only: agents are constructed by `createEdgeWell` and exposed
// via the `ew` bundle, so this command is a friendly "what do I
// have?" view.

import { header, c } from "../cli.js";

const AGENTS = [
  { name: "health", description: "Symptom checker, lab results, general health Q&A." },
  { name: "finance", description: "Budgeting, expense analysis, monthly planning." },
  { name: "sleep", description: "Sleep phase events, total hours, verdict." },
  { name: "nutrition", description: "Meal regularity, average meals per day." },
  { name: "hydration", description: "Daily water intake, goal tracking." },
  { name: "activity", description: "Steps per day, goal tracking, sedentary flags." },
];

export async function agentsCommand(_args, _ew) {
  header("EdgeWell agents (v3.0.0)");
  for (const a of AGENTS) {
    console.log(`  ${c.cyan(a.name.padEnd(12))} ${a.description}`);
  }
}
