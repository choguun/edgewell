// `edgewell meds` lists the medications the user is tracking in
// `profile.medications` (an array of `{ name, dose, schedule }`).
// v3.0.0 keeps this read-only; reminders are a follow-up.

import { c, header } from "../cli.js";

export async function medsCommand(_args, ew) {
  const profile = await ew.profile.load();
  const meds = profile.medications ?? [];
  header("Medications");
  if (meds.length === 0) {
    console.log(c.dim("(set profile.medications = [...] in your profile.json)"));
    return;
  }
  for (const m of meds) {
    console.log(`  ${c.cyan(m.name ?? "?")} ${c.dim(m.dose ?? "")} ${m.schedule ?? ""}`);
  }
}
