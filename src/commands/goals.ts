// @ts-nocheck
// `edgewell goals` lists the user's long-term goals stored in
// `profile.goals` (a { health: [...], finance: [...] } object
// per the schema in src/schemas.js).
// v3.0.0 prints them as a categorised checklist.

import { c, header } from "../cli.js";

export async function goalsCommand(_args, ew) {
  const profile = await ew.profile.load();
  const goals = profile.goals ?? {};
  const sections = [];
  if (Array.isArray(goals.health) && goals.health.length) {
    sections.push({ label: "Health", items: goals.health });
  }
  if (Array.isArray(goals.finance) && goals.finance.length) {
    sections.push({ label: "Finance", items: goals.finance });
  }
  // Allow a flat array fallback for users with custom profiles.
  if (Array.isArray(goals) && goals.length) {
    sections.push({ label: "Goals", items: goals });
  }
  header("Goals");
  if (sections.length === 0) {
    console.log(c.dim("(set profile.goals = { health: [...], finance: [...] } in your profile.json)"));
    return;
  }
  for (const s of sections) {
    console.log(`  ${c.bold(c.cyan(s.label))}`);
    for (const g of s.items) {
      const text = typeof g === "string" ? g : g.text ?? JSON.stringify(g);
      const deadline = typeof g === "string" ? "" : ` (${g.deadline ?? ""})`;
      console.log(`    - ${text}${c.dim(deadline)}`);
    }
  }
}
