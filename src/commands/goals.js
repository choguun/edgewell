// `edgewell goals` lists the user's long-term goals stored in
// `profile.goals` (an array of strings or `{ text, deadline }`).
// v3.0.0 prints them as a checklist.

import { c, header } from "../cli.js";

export async function goalsCommand(_args, ew) {
  const profile = await ew.profile.load();
  const goals = profile.goals ?? [];
  header("Goals");
  if (goals.length === 0) {
    console.log(c.dim("(set profile.goals = [...] in your profile.json)"));
    return;
  }
  for (const g of goals) {
    const text = typeof g === "string" ? g : g.text;
    const deadline = typeof g === "string" ? "" : ` (${g.deadline ?? ""})`;
    console.log(`  - ${text}${c.dim(deadline)}`);
  }
}
