// @ts-nocheck
// `edgewell weekly-goals` lists the weekly goals the user has set
// in the profile. v3.0.0 reads `profile.weeklyGoals` (an array of
// strings) and prints them as a checklist. The `done` field on
// each goal is preserved across runs.

import { c, header } from "../cli.js";

export async function weeklyGoalsCommand(_args, ew) {
  const profile = await ew.profile.load();
  const goals = profile.weeklyGoals ?? [];
  header("Weekly goals");
  if (goals.length === 0) {
    console.log(c.dim("(set profile.weeklyGoals = [...] in your profile.json)"));
    return;
  }
  for (const g of goals) {
    const box = g.done ? c.green("[x]") : "[ ]";
    console.log(`  ${box} ${g.text ?? g}`);
  }
}
