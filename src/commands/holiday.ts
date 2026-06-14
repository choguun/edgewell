// @ts-nocheck
// `edgewell holiday` lists the holidays the user is tracking in
// `profile.holidays` (an array of `{ date, name }`). v3.0.0 keeps
// this offline; a future release can fetch holidays from a local
// ICS file.

import { c, header } from "../cli.js";

export async function holidayCommand(_args, ew) {
  const profile = await ew.profile.load();
  const holidays = profile.holidays ?? [];
  header("Holidays");
  if (holidays.length === 0) {
    console.log(c.dim("(set profile.holidays = [...] in your profile.json)"));
    return;
  }
  for (const h of holidays) {
    console.log(`  ${c.cyan(h.date)} ${h.name ?? ""}`);
  }
}
